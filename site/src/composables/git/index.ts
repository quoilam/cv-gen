import { toRaw } from "vue";
import localforage from "localforage";
import { GitOps, type GitConfig } from "./gitops";
import type { SyncProvider } from "~/utils/storage/repository";

export type { GitConfig };

// ---- Shared reactive state ----
const configured = ref(false);
const syncStatus = ref<"idle" | "syncing" | "synced" | "error">("idle");
const error = ref<string | null>(null);
let _initialized = false;
let _idleTimer: ReturnType<typeof setTimeout> | null = null;
let _beforeunloadBound = false;
const IDLE_MS = 5 * 60 * 1000;

function _resetIdleTimer() {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => _doPush(), IDLE_MS);
}

function _setupBeforeUnload() {
  if (_beforeunloadBound) return;
  _beforeunloadBound = true;
  window.addEventListener("beforeunload", () => _doPush());
}

// ---- GitHubSyncProvider ----
export class GitHubSyncProvider implements SyncProvider {
  async push(): Promise<{ error: string | null }> {
    try {
      await _doPush();
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async pull(): Promise<{ error: string | null }> {
    return _doPull();
  }
}

// ---- Internal sync operations ----
async function _doPush() {
  if (!configured.value) return;
  syncStatus.value = "syncing";
  error.value = null;
  try {
    await _exportLocalToRepo();
    await GitOps.push("auto: sync");
    syncStatus.value = "synced";
  } catch (e: any) {
    error.value = e.message;
    syncStatus.value = "error";
  }
}

async function _doPull(): Promise<{ error: string | null }> {
  if (!configured.value) return { error: "Git not configured" };
  syncStatus.value = "syncing";
  error.value = null;
  try {
    const conflicts = await GitOps.pull();
    if (conflicts.length > 0) {
      console.warn("Sync conflicts:", conflicts);
    }
    await _importRepoToLocal();
    syncStatus.value = "synced";
    return { error: null };
  } catch (e: any) {
    error.value = e.message;
    syncStatus.value = "error";
    return { error: e.message };
  }
}

async function _exportLocalToRepo() {
  const { styles } = useStyleStore();

  // Get all resumes from localForage and write to repo
  // Dynamic import to avoid circular dependency at module level
  const { useResume } = await import("~/composables/useResume");
  const resumes = await useResume().getResumes();

  for (const r of resumes) {
    await GitOps.writeResume(r.name, r.markdown, r.css);
  }

  // Write settings
  await GitOps.writeSettings({ styles: toRaw(styles) });

  // Write assets as assets.json
  const { getAssets } = useAsset();
  const assets = await getAssets();
  await GitOps.writeFile("assets.json", JSON.stringify(assets));
}

async function _importRepoToLocal() {
  const { resumes, settings } = await GitOps.importAllToLocal();

  // Merge resumes: remote resumes that don't exist locally are added
  const { useResume } = await import("~/composables/useResume");
  const resumeOps = useResume();
  const localResumes = await resumeOps.getResumes();
  const localByName = new Map(localResumes.map((r) => [r.name, r]));

  for (const remote of resumes) {
    const local = localByName.get(remote.name);
    if (!local) {
      // New resume from remote — create locally
      const created = await resumeOps.createResume();
      if (created) {
        await resumeOps.updateResume({
          id: created.id,
          name: remote.name,
          markdown: remote.markdown,
          css: remote.css,
        });
      }
    }
    // If exists locally, local wins (localForage is source of truth)
  }

  // Merge settings: only apply if not yet set locally
  if (settings) {
    const s = settings as any;
    if (s.styles) {
      const styleStore = useStyleStore();
      for (const [key, value] of Object.entries(s.styles)) {
        if ((styleStore as any)[key] === undefined) {
          (styleStore as any)[key] = value;
        }
      }
    }
  }

  // Merge assets from assets.json
  const assetsJson = await GitOps.readFile("assets.json");
  if (assetsJson) {
    try {
      const remoteAssets = JSON.parse(assetsJson) as Array<{ id: string; name: string; base64: string }>;
      const { getAssets } = useAsset();
      const localAssets = await getAssets();
      const localIds = new Set(localAssets.map((a) => a.id));
      let changed = false;
      for (const asset of remoteAssets) {
        if (!localIds.has(asset.id)) {
          localAssets.push(asset as any);
          changed = true;
        }
      }
      if (changed) {
        const assetStore = localforage.createInstance({ name: "ohmycv_assets" });
        await assetStore.setItem("assets", localAssets);
      }
    } catch {}
  }
}

// ---- useGit composable ----
export const useGit = () => {
  if (!_initialized) {
    _initialized = true;
    GitOps.loadConfig().then((c) => {
      if (c) {
        configured.value = true;
        _doPull();
        _resetIdleTimer();
        _setupBeforeUnload();
      }
    });
  }

  const configure = async (config: GitConfig) => {
    await GitOps.saveConfig(config);
    configured.value = true;
    // Clone on first configure
    await GitOps.clone();
    // Import repo content into localForage
    await _importRepoToLocal();
    // Connect SyncProvider to ResumeRepository
    const { useResume } = await import("~/composables/useResume");
    useResume().setSyncProvider(new GitHubSyncProvider());
    syncStatus.value = "synced";
    _resetIdleTimer();
    _setupBeforeUnload();
  };

  const disconnect = async () => {
    await GitOps.clearConfig();
    configured.value = false;
    syncStatus.value = "idle";
    if (_idleTimer) clearTimeout(_idleTimer);
  };

  const notifyActivity = () => {
    if (configured.value) _resetIdleTimer();
  };

  return {
    configure,
    disconnect,
    notifyActivity,
    configured,
    syncStatus,
    error,
    pull: _doPull,
    push: _doPush,
  };
};
