import type { ValidVersion } from "~/composables/constant";
import { setResume } from "./utils";
import type { DbResumeUpdate, DbResumeEmpty } from "./db";
import { ResumeRepository } from "./repository";

const AVAILABLE_SERVICES: Record<string, DbService> = {
  localForage: new LocalForageDbService()
};

const _repo = new ResumeRepository(AVAILABLE_SERVICES.localForage);

/**
 * @deprecated Use `useResume()` composable instead.
 * `ResumeRepository` handles pure data access; `useResume()` wraps it with UI side effects.
 */
export class StorageService {
  private _db: DbService;
  private _version: ValidVersion;

  constructor(service: keyof typeof AVAILABLE_SERVICES) {
    const { VERSION } = useConstant();

    this._version = VERSION.CURRENT;
    this._db = AVAILABLE_SERVICES[service];
  }

  private _createEmptyResume(): DbResumeEmpty {
    const { DEFAULT } = useConstant();

    return {
      name: DEFAULT.RESUME_NAME,
      markdown: DEFAULT.MD_CONTENT,
      css: DEFAULT.CSS_CONTENT,
      styles: DEFAULT.STYLES
    };
  }

  public async getResumes() {
    const { data, error } = await _repo.getResumes();
    if (error) console.error("Get resumes error:", error);
    return data ?? [];
  }

  public async updateResume(data: DbResumeUpdate, newUpdateTime = true) {
    const { data: updatedData, error } = await _repo.updateResume(data, newUpdateTime);
    if (error) {
      console.error("Update error:", error);
    } else {
      const toast = useToast();
      toast.save();
    }
    return updatedData;
  }

  public async createResume() {
    const { data, error } = await _repo.createResume();
    if (error) {
      console.error("Create error:", error);
    } else {
      const toast = useToast();
      toast.new();
    }
    return data;
  }

  public async deleteResume(id: number) {
    const { data, error } = await _repo.deleteResume(id);
    if (error) {
      console.error("Delete error:", error);
    } else if (data) {
      const toast = useToast();
      toast.delete(data.name);
    }
    return data;
  }

  public async switchToResume(id: number) {
    const { setData } = useDataStore();
    setData("loaded", false);

    const { data, error } = await _repo.getResume(id);
    if (error) {
      console.error("Switch error:", error);
    } else if (!data) {
      console.error(`Switch error: Resume ${id} not found.`);
    } else {
      await setResume(data);
      const toast = useToast();
      toast.switch(data.name);
      setData("loaded", true);
    }
    return data;
  }

  public async duplicateResume(id: number) {
    const { data, error } = await _repo.duplicateResume(id);
    if (error) {
      console.error("Duplicate error:", error);
    } else if (data) {
      const toast = useToast();
      toast.duplicate(data.name);
    }
  }

  public async exportToJSON() {
    return _repo.exportToJSON();
  }

  public async importFromJson(content: string) {
    const toast = useToast();
    const { error } = await _repo.importFromJson(content);
    if (error) {
      console.error("Import error:", error);
      toast.import(false);
    } else {
      toast.import(true);
    }
  }
}

/** @deprecated Use `useResume()` composable instead. */
export const storageService = new StorageService("localForage");

export * from "./db";
export { IsValid } from "./utils";
export { ResumeRepository, type SyncProvider } from "./repository";
