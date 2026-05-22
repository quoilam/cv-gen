import { GitOps, type GitConfig } from "./gitops";

export type { GitConfig };

// Shared state — all callers of useGit() share the same refs
const configured = ref(false);
const syncing = ref(false);
const conflicts = ref<string[]>([]);
const error = ref<string | null>(null);

export const useGit = () => {
  const configure = async (config: GitConfig) => {
    await GitOps.saveConfig(config);
    configured.value = true;
  };

  const clone = async () => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.clone();
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
      const result = await GitOps.pull();
      conflicts.value = result;
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

      await GitOps.writeResume(data.resumeName, data.markdown, data.css);
      await GitOps.push(message);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const clearConflicts = () => {
    conflicts.value = [];
  };

  return {
    configure,
    clone,
    pull,
    save,
    clearConflicts,
    configured,
    syncing,
    conflicts,
    error
  };
};
