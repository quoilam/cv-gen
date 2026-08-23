import type { DbResumeUpdate } from "~/utils/storage/db";
import { ResumeRepository } from "~/utils/storage/repository";
import { LocalForageDbService } from "~/utils/storage/localForage";
import { setResume } from "~/utils/storage/utils";

let _repo: ResumeRepository | null = null;

function _getRepo(): ResumeRepository {
  if (!_repo) {
    _repo = new ResumeRepository(new LocalForageDbService());
  }
  return _repo;
}

export const useResume = () => {
  const toast = useToast();

  const getResumes = async () => {
    const { data, error } = await _getRepo().getResumes();
    if (error) console.error("Get resumes error:", error);
    return data ?? [];
  };

  const updateResume = async (
    data: DbResumeUpdate,
    newUpdateTime = true,
    silent = false
  ) => {
    const { data: updated, error } = await _getRepo().updateResume(data, newUpdateTime);
    if (error) {
      console.error("Update error:", error);
    } else if (!silent) {
      toast.save();
    }
    if (updated) {
      // Fire-and-forget: if a backup folder is authorized, keep the local
      // snapshot fresh so it survives browser cache wipes.
      useStorageBackup().syncBackup();
    }
    return updated;
  };

  const createResume = async () => {
    const { data, error } = await _getRepo().createResume();
    if (error) {
      console.error("Create error:", error);
    } else {
      toast.new();
    }
    if (data) useStorageBackup().syncBackup();
    return data;
  };

  const deleteResume = async (id: number) => {
    const { data, error } = await _getRepo().deleteResume(id);
    if (error) {
      console.error("Delete error:", error);
    } else if (data) {
      toast.delete(data.name);
    }
    if (data) useStorageBackup().syncBackup();
    return data;
  };

  const switchToResume = async (id: number) => {
    const { setData } = useDataStore();
    setData("loaded", false);

    const { data, error } = await _getRepo().getResume(id);
    if (error) {
      console.error("Switch error:", error);
    } else if (!data) {
      console.error(`Switch error: Resume ${id} not found.`);
    } else {
      await setResume(data);
      toast.switch(data.name);
      setData("loaded", true);
    }
    return data;
  };

  const duplicateResume = async (id: number) => {
    const { data, error } = await _getRepo().duplicateResume(id);
    if (error) {
      console.error("Duplicate error:", error);
    } else if (data) {
      toast.duplicate(data.name);
    }
    return data;
  };

  const exportToJSON = () => {
    return _getRepo().exportToJSON();
  };

  const importFromJson = async (content: string) => {
    const { error } = await _getRepo().importFromJson(content);
    if (error) {
      console.error("Import error:", error);
      toast.import(false);
    } else {
      toast.import(true);
    }
  };

  return {
    getResumes,
    updateResume,
    createResume,
    deleteResume,
    switchToResume,
    duplicateResume,
    exportToJSON,
    importFromJson
  };
};
