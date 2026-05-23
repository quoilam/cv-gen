import { downloadFile } from "@renovamen/utils";
import type { ValidVersion } from "~/composables/constant";
import type {
  DbService,
  DbResume,
  DbResumeUpdate,
  DbResumeEmpty,
  StorageJson,
  StorageJsonData
} from "./db";
import { IsValid } from "./utils";
import { MigrateService } from "./migrate";

export class ResumeRepository {
  private _db: DbService;
  private _version: ValidVersion;

  constructor(db: DbService) {
    const { VERSION } = useConstant();
    this._version = VERSION.CURRENT;
    this._db = db;
  }

  async getResumes() {
    const { data, error } = await this._db.queryAll();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  async getResume(id: number) {
    const { data, error } = await this._db.queryById(id);
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: `Resume ${id} not found` };
    return { data, error: null };
  }

  async createResume() {
    const { data, error } = await this._db.create(this._createEmptyResume());
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  async updateResume(data: DbResumeUpdate, newUpdateTime = true) {
    const { data: updated, error } = await this._db.update(data, newUpdateTime);
    if (error) return { data: null, error: error.message };
    return { data: updated, error: null };
  }

  async deleteResume(id: number) {
    const { data, error } = await this._db.delete(id);
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  async duplicateResume(id: number) {
    const { data, error } = await this.getResume(id);
    if (error) return { data: null, error };
    if (!data) return { data: null, error: `Resume ${id} not found` };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, updated_at: _ua, created_at: _ca, ...rest } = data;
    const { data: dup, error: createError } = await this._db.create({
      ...rest,
      name: rest.name + " Copy"
    });

    if (createError) return { data: null, error: createError.message };
    return { data: dup, error: null };
  }

  async exportToJSON() {
    const { data: resumes, error } = await this.getResumes();
    if (error) return { data: null, error };

    const jsonData = (resumes ?? []).reduce<StorageJsonData>((acc, { id, ...resume }) => {
      acc[id] = resume;
      return acc;
    }, {});

    const json: StorageJson = { version: this._version, data: jsonData };
    downloadFile("ohmycv_data.json", JSON.stringify(json));
    return { data: json, error: null };
  }

  async importFromJson(content: string) {
    const json = (() => {
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    })();

    const res = IsValid.importedJson(json);
    if (!res) return { data: null, error: "Invalid data format" };

    const migrateService = new MigrateService(res.version);
    const { data } = await migrateService.migrate(res.data);

    for (const [_id, resume] of Object.entries(data)) {
      const id = Number(_id);
      const { data: existing } = await this._db.queryById(id);

      if (existing) {
        await this._db.update({ id, ...resume }, false);
      } else {
        await this._db.create({ id, ...resume });
      }
    }

    return { data: null, error: null };
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
}
