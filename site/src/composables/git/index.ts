import { toRaw } from "vue";
import { GitOps, type GitConfig, type CommitInfo } from "./gitops";

export type { GitConfig, CommitInfo };

// Shared state — all callers of useGit() share the same refs
const configured = ref(false);
const syncing = ref(false);
const history = ref<CommitInfo[]>([]);
const error = ref<string | null>(null);

export const useGit = () => {
  const configure = async (config: GitConfig) => {
    GitOps.configure(config);
    configured.value = true;
  };

  const clone = async () => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.clone();
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const pull = async () => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.pull();
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const save = async (message = "Update resume") => {
    syncing.value = true;
    error.value = null;
    try {
      const { data } = useDataStore();
      const { styles } = useStyleStore();

      const resumeJson = JSON.stringify({
        name: data.resumeName,
        markdown: data.markdown,
        css: data.css,
        styles: toRaw(styles)
      });

      await GitOps.writeFile(`${data.resumeId}/resume.json`, resumeJson);
      await GitOps.commitAndPush(message);
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const loadHistory = async () => {
    try {
      history.value = await GitOps.getHistory();
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const checkoutVersion = async (oid: string) => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.checkout(oid);
      const { data } = useDataStore();
      const content = await GitOps.readFile(`${data.resumeId}/resume.json`);
      const resume = JSON.parse(content);
      const { setAndSyncToMonaco } = useDataStore();
      setAndSyncToMonaco("markdown", resume.markdown);
      setAndSyncToMonaco("css", resume.css);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  return {
    configure,
    clone,
    pull,
    save,
    loadHistory,
    checkoutVersion,
    configured,
    syncing,
    history,
    error
  };
};
