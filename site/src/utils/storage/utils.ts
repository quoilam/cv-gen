import * as localForage from "localforage";
import { isObject, isInteger, arrayify } from "@cvgen/utils";
import type { ValidVersion } from "~/composables/constant";
import type { ResumeStyles } from "~/composables/stores/style";
import type { DbResume } from "./db";
import type { ValidStorageJsonData } from "./migrate";

/**
 * Write resume styles from local storage to the store
 *
 * @param styles resume styles
 */
const setResumeStyles = async (styles: ResumeStyles) => {
  const { setStyle } = useStyleStore();

  for (const [key, value] of Object.entries(styles)) {
    await setStyle(key as keyof ResumeStyles, value);
  }
};

/**
 * Write resume data from local storage to the store
 *
 * @param data resume data
 */
export const setResume = async (data: DbResume) => {
  const { setData } = useDataStore();

  setData("resumeId", data.id);
  setData("resumeName", data.name);

  setData("markdown", data.markdown);

  await setResumeStyles(data.styles);

  dynamicCssService.injectBackbone();
};

const _checkType = (value: unknown, required: string | string[]) => {
  return arrayify(required).includes(typeof value);
};

const _getNestedValue = (object: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((o, p) => {
    return o && typeof o === "object" ? (o as Record<string, unknown>)[p] : undefined;
  }, object);
};

const _checkObject = (
  obj: unknown,
  fields: Array<{ fields: string | string[]; types: string | string[] }>
): boolean => {
  return fields.every(({ fields, types }) =>
    arrayify(fields).every((field) => _checkType(_getNestedValue(obj, field), types))
  );
};

export class IsValid {
  static font = (font: unknown) => {
    if (!isObject(font)) return false;
    const f = font as Record<string, unknown>;
    return (
      typeof f.name === "string" && ["string", "undefined"].includes(typeof f.fontFamily)
    );
  };

  static importedData = (data: unknown, version: unknown) => {
    const { VERSION } = useConstant();

    return (
      // Check version
      typeof version === "string" &&
      VERSION.isVersionValid(version) &&
      // Check data
      isObject(data) &&
      Object.entries(data as Record<string, unknown>).every(
        ([id, item]) =>
          isInteger(id, { allowString: true }) &&
          _checkObject(item, VERSION.REQUIRED_DATA_TYPES[version as ValidVersion])
      )
    );
  };

  static importedJson(
    json: unknown
  ): false | { version: ValidVersion; data: ValidStorageJsonData } {
    const { VERSION } = useConstant();

    if (!isObject(json)) return false;

    const obj = json as Record<string, unknown>;

    if (this.importedData(obj.data, obj.version)) {
      return obj as { version: ValidVersion; data: ValidStorageJsonData };
    } else if (this.importedData(obj, VERSION.EMPTY_FALLBACK)) {
      return {
        data: obj as ValidStorageJsonData,
        version: VERSION.EMPTY_FALLBACK
      };
    }

    return false;
  }
}

export class StorageVersion {
  static get = async (): Promise<ValidVersion | null> => {
    const { VERSION } = useConstant();
    return await localForage.getItem<ValidVersion>(VERSION.VERSION_KEY);
  };

  static update = async () => {
    const { VERSION } = useConstant();
    await localForage.setItem(VERSION.VERSION_KEY, VERSION.CURRENT);
    return VERSION.CURRENT;
  };
}
