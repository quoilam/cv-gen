# GitHub 全量数据同步 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 GitHub 私有仓库作为全量数据同步后端，支持换设备完整恢复

**Architecture:** 重写 gitops.ts 适配新文件结构（resumes/*.md + *.css + settings.json + assets/），新建 GitHubSyncProvider 实现 SyncProvider 接口接入 ResumeRepository，简化 Git UI 为状态指示器

**Tech Stack:** isomorphic-git, lightning-fs, localforage, Vue 3 Composition API

---

## 文件变更总览

| 操作 | 文件 | 职责 |
|------|------|------|
| 重写 | `site/src/composables/git/gitops.ts` | 底层 Git 操作，适配新文件结构 + 配置持久化 |
| 重写 | `site/src/composables/git/index.ts` | GitHubSyncProvider + useGit composable + 自动同步 |
| 重写 | `site/src/components/editor/git/GitSettings.vue` | 配置 UI + 同步状态指示器 |
| 修改 | `site/src/components/editor/toolbar/Git.vue` | 简化为 GitSettings 容器 |
| 删除 | `site/src/components/editor/git/GitHistory.vue` | 不再需要版本历史 |
| 修改 | `site/src/utils/storage/repository.ts` | 精简 SyncProvider 接口 |
| 修改 | `site/src/composables/useResume.ts` | 暴露 setSyncProvider 用于外部挂载 |

---

### Task 1: 重写 gitops.ts — 新文件结构 + 配置持久化

**Files:**
- Rewrite: `site/src/composables/git/gitops.ts`

- [ ] **Step 1: 替换 gitops.ts 全文**

```typescript
import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";
import localforage from "localforage";

export interface GitConfig {
  repoUrl: string;
  token: string;
}

// ---- File structure constants ----
const RESUMES_DIR = "resumes";
const ASSETS_DIR = "assets";
const SETTINGS_FILE = "settings.json";

// ---- Internal state ----
let _fs: LightningFS | null = null;
let _config: GitConfig | null = null;
const _dir = "/repo";
const configStore = localforage.createInstance({ name: "cvgen_git_config" });

function _getFs(): LightningFS {
  if (!_fs) _fs = new LightningFS("cvgen_git");
  return _fs;
}

function _getAuth() {
  if (!_config) throw new Error("Git not configured");
  return { username: _config.token, password: _config.token };
}

function _resumeMdPath(name: string): string {
  return `${RESUMES_DIR}/${name}.md`;
}
function _resumeCssPath(name: string): string {
  return `${RESUMES_DIR}/${name}.css`;
}
function _assetPath(name: string): string {
  return `${ASSETS_DIR}/${name}`;
}

// ---- Filesystem helpers ----
async function _ensureDir(filePath: string): Promise<void> {
  const fs = _getFs();
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch {
    // already exists
  }
}

async function _writeFile(relPath: string, content: string | Uint8Array): Promise<void> {
  const fs = _getFs();
  const fullPath = `${_dir}/${relPath}`;
  await _ensureDir(fullPath);
  await fs.promises.writeFile(fullPath, content);
}

async function _readFile(relPath: string): Promise<string | null> {
  try {
    const fs = _getFs();
    return await fs.promises.readFile(`${_dir}/${relPath}`, "utf8");
  } catch {
    return null;
  }
}

async function _readBinaryFile(relPath: string): Promise<Uint8Array | null> {
  try {
    const fs = _getFs();
    return await fs.promises.readFile(`${_dir}/${relPath}`);
  } catch {
    return null;
  }
}

async function _listDir(relPath: string): Promise<string[]> {
  try {
    const fs = _getFs();
    return await fs.promises.readdir(`${_dir}/${relPath}`);
  } catch {
    return [];
  }
}

async function _removeFile(relPath: string): Promise<void> {
  try {
    const fs = _getFs();
    await fs.promises.unlink(`${_dir}/${relPath}`);
  } catch {}
}

// ---- Public API ----
export const GitOps = {
  // --- Config persistence ---
  async loadConfig(): Promise<GitConfig | null> {
    if (_config) return _config;
    const saved = await configStore.getItem<GitConfig>("config");
    if (saved) _config = saved;
    return saved;
  },

  async saveConfig(config: GitConfig): Promise<void> {
    _config = config;
    await configStore.setItem("config", config);
  },

  async clearConfig(): Promise<void> {
    _config = null;
    await configStore.removeItem("config");
  },

  isConfigured(): boolean {
    return _config !== null;
  },

  getConfig(): GitConfig | null {
    return _config;
  },

  // --- Repo lifecycle ---
  async clone(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();
    try { await fs.promises.rmdir(_dir); } catch {}

    await git.clone({
      fs, http,
      dir: _dir,
      url: _config.repoUrl,
      onAuth: () => _getAuth(),
      singleBranch: true,
      depth: 10,
    });
  },

  async pull(): Promise<string[]> {
    // Returns list of conflicting file paths
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    // Snapshot local content before pull for conflict detection
    const before = await _snapshotContent();

    // Push any local changes first
    const status = await git.statusMatrix({ fs, dir: _dir });
    const dirty = status.filter(([, , ws, wt]) => ws !== 1 || wt !== 1);
    if (dirty.length > 0) {
      await _commitAndPush("auto: sync before pull");
    }

    await git.pull({
      fs, http,
      dir: _dir,
      author: { name: "cvgen", email: "cvgen@local" },
      onAuth: () => _getAuth(),
    });

    // Compare: which files changed remotely AND locally?
    const after = await _snapshotContent();
    const conflicts: string[] = [];
    for (const [path, oldContent] of Object.entries(before)) {
      const newContent = after[path];
      if (newContent !== undefined && newContent !== oldContent) {
        conflicts.push(path);
      }
    }

    return conflicts;
  },

  async push(message = "auto: sync"): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    await _commitAndPush(message);
  },

  // --- Resume files ---
  async writeResume(name: string, markdown: string, css: string): Promise<void> {
    await _writeFile(_resumeMdPath(name), markdown);
    await _writeFile(_resumeCssPath(name), css);
  },

  async readResume(name: string): Promise<{ markdown: string; css: string } | null> {
    const md = await _readFile(_resumeMdPath(name));
    const css = await _readFile(_resumeCssPath(name));
    if (md === null && css === null) return null;
    return { markdown: md ?? "", css: css ?? "" };
  },

  async deleteResumeFiles(name: string): Promise<void> {
    await _removeFile(_resumeMdPath(name));
    await _removeFile(_resumeCssPath(name));
  },

  async listResumeNames(): Promise<string[]> {
    const files = await _listDir(RESUMES_DIR);
    const names = new Set<string>();
    for (const f of files) {
      const m = f.match(/^(.+)\.(?:md|css)$/);
      if (m) names.add(m[1]);
    }
    return [...names];
  },

  // --- Settings ---
  async writeSettings(settings: object): Promise<void> {
    await _writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  },

  async readSettings<T = object>(): Promise<T | null> {
    const raw = await _readFile(SETTINGS_FILE);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },

  // --- Generic file I/O (for arbitrary paths like settings.json, assets.json) ---
  async writeFile(relPath: string, content: string): Promise<void> {
    await _writeFile(relPath, content);
  },

  async readFile(relPath: string): Promise<string | null> {
    return _readFile(relPath);
  },

  // --- Assets ---
  async writeAsset(filename: string, base64Data: string): Promise<void> {
    const binary = _base64ToUint8(base64Data);
    await _writeFile(_assetPath(filename), binary);
  },

  async readAsset(filename: string): Promise<string | null> {
    const data = await _readBinaryFile(_assetPath(filename));
    return data ? _uint8ToBase64(data) : null;
  },

  async listAssetNames(): Promise<string[]> {
    return _listDir(ASSETS_DIR);
  },

  // --- Bulk import (repo → localForage) ---
  async importAllToLocal(): Promise<{
    resumes: Array<{ name: string; markdown: string; css: string }>;
    settings: object | null;
  }> {
    const resumeNames = await GitOps.listResumeNames();
    const resumes: Array<{ name: string; markdown: string; css: string }> = [];
    for (const name of resumeNames) {
      const r = await GitOps.readResume(name);
      if (r) resumes.push({ name, ...r });
    }

    const settings = await GitOps.readSettings();

    return { resumes, settings };
  },

  // --- Export localForage → repo ---
  async exportAllFromLocal(
    resumes: Array<{ name: string; markdown: string; css: string }>,
    settings: object,
    assets: Array<{ id: string; name: string; base64: string }>,
  ): Promise<void> {
    for (const r of resumes) {
      await GitOps.writeResume(r.name, r.markdown, r.css);
    }
    await GitOps.writeSettings(settings);
    await GitOps.writeFile("assets.json", JSON.stringify(assets));
  },
};

// ---- Internal helpers ----

async function _commitAndPush(message: string): Promise<void> {
  if (!_config) throw new Error("Git not configured");
  const fs = _getFs();

  await git.add({ fs, dir: _dir, filepath: "." });

  await git.commit({
    fs, dir: _dir, message,
    author: { name: "cvgen", email: "cvgen@local" },
  });

  await git.push({
    fs, http, dir: _dir,
    onAuth: () => _getAuth(),
  });
}

/** Snapshot all tracked file contents for conflict detection */
async function _snapshotContent(): Promise<Record<string, string>> {
  const snap: Record<string, string> = {};
  const names = await GitOps.listResumeNames();
  for (const name of names) {
    const md = await _readFile(_resumeMdPath(name));
    if (md !== null) snap[_resumeMdPath(name)] = md;
    const css = await _readFile(_resumeCssPath(name));
    if (css !== null) snap[_resumeCssPath(name)] = css;
  }
  const settings = await _readFile(SETTINGS_FILE);
  if (settings !== null) snap[SETTINGS_FILE] = settings;
  const assets = await _readFile("assets.json");
  if (assets !== null) snap["assets.json"] = assets;
  return snap;
}

function _base64ToUint8(base64: string): Uint8Array {
  const b64 = base64.includes("base64,") ? base64.split("base64,")[1] : base64;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function _uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
```

- [ ] **Step 2: 验证编译**

```bash
cd site && npx vue-tsc --noEmit --project tsconfig.json 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add site/src/composables/git/gitops.ts
git commit -m "refactor: rewrite gitops for new file structure and config persistence"
```

---

### Task 2: 重写 useGit composable — GitHubSyncProvider + 自动同步

**Files:**
- Rewrite: `site/src/composables/git/index.ts`

- [ ] **Step 1: 替换 index.ts 全文**

```typescript
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
const IDLE_MS = 5 * 60 * 1000;

let _beforeunloadBound = false;

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
    // Export local data to repo files first, then push
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
      // Remote version is already on disk from pull;
      // localForage kept the local version. User sees both.
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
    const { styles } = useStyleStore();
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
        const assetStore = localforage.createInstance({ name: "cvgen_assets" });
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
```

- [ ] **Step 2: 验证编译**

```bash
cd site && npx vue-tsc --noEmit --project tsconfig.json 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add site/src/composables/git/index.ts
git commit -m "feat: add GitHubSyncProvider with idle-timer auto-sync"
```

---

### Task 3: 重写 GitSettings.vue — 配置 UI + 状态指示器

**Files:**
- Rewrite: `site/src/components/editor/git/GitSettings.vue`

- [ ] **Step 1: 替换 GitSettings.vue 全文**

```vue
<template>
  <div class="p-3 space-y-3">
    <template v-if="!configured">
      <input
        v-model="repoUrl"
        type="text"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="https://github.com/user/resumes.git"
      />
      <input
        v-model="token"
        type="password"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="GitHub Personal Access Token"
      />
      <UiButton size="sm" class="w-full" :disabled="syncing" @click="doConnect">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ syncing ? "连接中..." : "连接仓库" }}
      </UiButton>
    </template>

    <template v-else>
      <div class="flex items-center gap-2">
        <span
          class="size-2 rounded-full shrink-0"
          :class="{
            'bg-green-500': syncStatus === 'synced' || syncStatus === 'idle',
            'bg-yellow-500 animate-pulse': syncStatus === 'syncing',
            'bg-red-500': syncStatus === 'error',
          }"
        />
        <span class="text-sm">
          {{ statusText }}
        </span>
        <UiButton
          size="xs"
          variant="ghost"
          class="ml-auto"
          :disabled="syncStatus === 'syncing'"
          @click="doPull"
        >
          <span i-lucide:refresh-cw class="size-3.5" />
        </UiButton>
      </div>

      <div v-if="syncStatus === 'error' && error" class="text-xs text-destructive">
        {{ error }}
      </div>

      <div class="flex gap-2">
        <UiButton size="xs" variant="outline" :disabled="syncing" @click="doPush">
          <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
          立即同步
        </UiButton>
        <UiButton size="xs" variant="ghost" class="text-destructive" @click="doDisconnect">
          断开
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const git = useGit();
const { configured, syncStatus, error } = git;

const repoUrl = ref("");
const token = ref("");

const syncing = computed(() => syncStatus.value === "syncing");

const statusText = computed(() => {
  switch (syncStatus.value) {
    case "synced": return "已同步";
    case "syncing": return "同步中...";
    case "error": return "同步失败";
    default: return "就绪";
  }
});

const doConnect = async () => {
  try { await git.configure({ repoUrl: repoUrl.value, token: token.value }); } catch {}
};

const doPull = async () => { try { await git.pull(); } catch {} };
const doPush = async () => { try { await git.push(); } catch {} };

const doDisconnect = () => { git.disconnect(); };
</script>
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/editor/git/GitSettings.vue
git commit -m "refactor: rewrite GitSettings with status indicator and auto-sync"
```

---

### Task 4: 删除 GitHistory.vue + 简化 Git.vue

**Files:**
- Delete: `site/src/components/editor/git/GitHistory.vue`
- Modify: `site/src/components/editor/toolbar/Git.vue`

- [ ] **Step 1: 删除 GitHistory.vue**

```bash
rm site/src/components/editor/git/GitHistory.vue
```

- [ ] **Step 2: 简化 Git.vue**

将 `site/src/components/editor/toolbar/Git.vue` 替换为：

```vue
<template>
  <EditorToolbarBox text="Git 同步" icon="i-lucide:git-branch">
    <EditorGitSettings />
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
</script>
```

> 注意：`EditorGitSettings` 由 Nuxt 自动导入（`components/editor/git/GitSettings.vue`），无需显式 import。

- [ ] **Step 3: Commit**

```bash
git add site/src/components/editor/git/GitHistory.vue site/src/components/editor/toolbar/Git.vue
git commit -m "refactor: remove GitHistory, simplify Git toolbar wrapper"
```

---

### Task 5: 精简 SyncProvider 接口 + 接入 ResumeRepository

**Files:**
- Modify: `site/src/utils/storage/repository.ts`
- Modify: `site/src/composables/useResume.ts`

- [ ] **Step 1: 精简 SyncProvider 接口**

在 `repository.ts` 中，将 `SyncProvider` 接口从 4 个方法精简为 2 个：

```typescript
// 替换原有的 SyncProvider 接口定义（约第 14-24 行）
export interface SyncProvider {
  push(): Promise<{ error: string | null }>;
  pull(): Promise<{ error: string | null }>;
}
```

- [ ] **Step 2: 在 useResume 中暴露 setSyncProvider**

在 `useResume.ts` 的返回值中添加 `setSyncProvider`：

```typescript
// 在 useResume() 函数的 return 语句中添加：
return {
  getResumes,
  updateResume,
  createResume,
  deleteResume,
  switchToResume,
  duplicateResume,
  exportToJSON,
  importFromJson,
  setSyncProvider: (provider: import("~/utils/storage/repository").SyncProvider) => {
    _getRepo().setRemote(provider);
  },
};
```

- [ ] **Step 3: 验证编译**

```bash
cd site && npx vue-tsc --noEmit --project tsconfig.json 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add site/src/utils/storage/repository.ts site/src/composables/useResume.ts
git commit -m "feat: simplify SyncProvider interface, wire to useResume"
```

---

### Task 6: 接入 Save 组件 — 重置空闲计时器

**Files:**
- Modify: `site/src/components/editor/toolbar/file/Save.vue`

- [ ] **Step 1: 在 save 函数末尾调用 notifyActivity**

在 `Save.vue` 的 `<script>` 中，save 函数末尾添加一行：

```typescript
// 在 await updateResume({...}) 之后添加：
const git = useGit();
git.notifyActivity();
```

即 save 函数变为：

```typescript
const save = async () => {
  if (!data.resumeId) return;

  await updateResume({
    id: data.resumeId,
    name: data.resumeName,
    markdown: data.markdown,
    css: data.css,
    styles: toRaw(styles)
  });

  const git = useGit();
  git.notifyActivity();
};
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/editor/toolbar/file/Save.vue
git commit -m "feat: wire save to git idle timer reset"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动 dev server**

```bash
pnpm dev
```

- [ ] **Step 2: 手动验证清单**

1. 打开编辑器页面，点击 Git 工具栏面板
2. 输入仓库 URL + PAT，点击「连接仓库」
3. 确认连接成功后状态指示器变为绿色「已同步」
4. 编辑简历，等待 5 分钟空闲，检查是否自动 push
5. 手动点击「立即同步」，确认 push 成功
6. 点击刷新按钮 pull，确认状态正常
7. 点击「断开」，确认配置被清除

- [ ] **Step 3: 如有编译错误，修复后重新验证**

---

## 设计决策记录

- **认证方式**：继续使用 GitHub PAT（HTTPS），浏览器中 SSH 支持受限
- **冲突处理**：pull 时对比前后快照，远程有变而本地也有变则标记冲突，但双方文件都保留
- **同步方向**：本地是数据源（localForage），push 时导出到 repo 文件再 push；pull 时从 repo 导入到 localForage
- **资产格式**：repo 中存原始二进制（节省 33% 空间），localForage 中保持 base64（兼容现有逻辑）
- **空闲检测**：5 分钟无 `notifyActivity()` 调用触发 push；编辑器 save 时应调用此方法重置计时器
