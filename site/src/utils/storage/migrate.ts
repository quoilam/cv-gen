import type { ValidVersion } from "~/composables/constant";
import type { StorageJsonData, DbResumeEmpty } from "./db";

export type StorageJsonDataV0 = {
  [id: string]: DbResumeEmpty & {
    update?: string;
  };
};

export type ValidStorageJsonData = StorageJsonDataV0 | StorageJsonData;

export type MigrateReturn = {
  from: ValidVersion;
  to: ValidVersion;
  data: StorageJsonData;
};

export class MigrateService {
  private _from: ValidVersion;
  private _to: ValidVersion;

  constructor(fromVersion?: ValidVersion | null) {
    const { VERSION } = useConstant();

    this._from = fromVersion ?? VERSION.EMPTY_FALLBACK;
    this._to = VERSION.CURRENT;
  }

  private _return = (data: StorageJsonData): MigrateReturn => ({
    from: this._from,
    to: this._to,
    data
  });

  public async migrate(storage: ValidStorageJsonData): Promise<MigrateReturn> {
    switch (this._from) {
      case this._to:
        return this._return(storage as StorageJsonData);
      case "v0":
        return this.fromV0(storage as StorageJsonDataV0);
      default:
        throw new Error(`Migration from version ${this._from} is not supported`);
    }
  }

  public async fromV0(storage: StorageJsonDataV0): Promise<MigrateReturn> {
    const newStorage: StorageJsonData = {};

    Object.entries(storage).forEach(([id, data]) => {
      const { update, ...rest } = data;

      newStorage[id] = {
        ...rest,
        created_at: id,
        updated_at: update ?? id
      };
    });

    return this._return(newStorage);
  }
}
