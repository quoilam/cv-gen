import localforage from "localforage";
import { ResumeRepository } from "~/utils/storage/repository";
import { LocalForageDbService } from "~/utils/storage/localForage";

const BACKUP_FILENAME = "cvgen-backup.json";
const DIR_KEY = "backup-dir-handle";

let _dirStore: LocalForage | null = null;
function _getDirStore() {
  if (!_dirStore) {
    _dirStore = localforage.createInstance({ name: "cvgen_backup" });
  }
  return _dirStore;
}

let _repo: ResumeRepository | null = null;
function _getRepo(): ResumeRepository {
  if (!_repo) {
    _repo = new ResumeRepository(new LocalForageDbService());
  }
  return _repo;
}

export const useStorageBackup = () => {
  const isPersisted = ref(false);
  const backupReady = ref(false);

  // Request persistent storage so the browser won't evict IndexedDB data
  // under storage pressure or aggressive cache cleaning.
  const requestPersist = async () => {
    if (!("persist" in navigator.storage)) return false;
    try {
      isPersisted.value = await navigator.storage.persist();
      return isPersisted.value;
    } catch {
      return false;
    }
  };

  // Let the user pick a folder; once granted, every save also writes a JSON
  // backup there, surviving browser cache wipes.
  const setupBackupDirectory = async (): Promise<boolean> => {
    if (!("showDirectoryPicker" in window)) return false;
    try {
      const handle = await (
        window as Window & {
          showDirectoryPicker(options?: {
            mode?: "readwrite";
            id?: string;
          }): Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({ mode: "readwrite", id: "cvgen-backup" });

      const perms = await handle.queryPermission({ mode: "readwrite" });
      if (perms !== "granted") {
        const granted = await handle.requestPermission({ mode: "readwrite" });
        if (granted !== "granted") return false;
      }

      await _getDirStore().setItem(DIR_KEY, handle);
      backupReady.value = true;
      return true;
    } catch {
      return false;
    }
  };

  const _loadDirHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
    try {
      const handle = await _getDirStore().getItem<FileSystemDirectoryHandle>(DIR_KEY);
      if (!handle) return null;
      const perms = await handle.queryPermission({ mode: "readwrite" });
      if (perms !== "granted") {
        const granted = await handle.requestPermission({ mode: "readwrite" });
        if (granted !== "granted") return null;
      }
      return handle;
    } catch {
      return null;
    }
  };

  const _writeJson = async (
    handle: FileSystemDirectoryHandle,
    filename: string,
    json: string
  ) => {
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
  };

  const getBackupJSON = async (): Promise<string | null> => {
    const { data } = await _getRepo().getJSON();
    return data ? JSON.stringify(data) : null;
  };

  // Write a full snapshot of all resumes to the user's folder.
  const syncBackup = async (): Promise<boolean> => {
    const handle = await _loadDirHandle();
    if (!handle) return false;
    const json = await getBackupJSON();
    if (json === null) return false;
    try {
      await _writeJson(handle, BACKUP_FILENAME, json);
      return true;
    } catch {
      return false;
    }
  };

  // Read the snapshot back and restore it into IndexedDB.
  const restoreFromBackup = async (): Promise<boolean> => {
    const handle = await _loadDirHandle();
    if (!handle) return false;
    try {
      const fileHandle = await handle.getFileHandle(BACKUP_FILENAME);
      const file = await fileHandle.getFile();
      const content = await file.text();
      const { error } = await _getRepo().importFromJson(content);
      return !error;
    } catch {
      return false;
    }
  };

  const clearBackupDirectory = async () => {
    await _getDirStore().removeItem(DIR_KEY);
    backupReady.value = false;
  };

  const init = async () => {
    await requestPersist();
    const handle = await _loadDirHandle();
    backupReady.value = !!handle;
  };

  return {
    isPersisted,
    backupReady,
    requestPersist,
    setupBackupDirectory,
    syncBackup,
    restoreFromBackup,
    clearBackupDirectory,
    init
  };
};
