import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: { injectToolbar: vi.fn() }
}));

vi.mock("~/composables/icon", () => ({
  fontService: { resolve: vi.fn() }
}));

import { IsValid } from "~/utils/storage/utils";

const validStyles = {
  fontSize: 15,
  lineHeight: 1.3,
  marginH: 45,
  marginV: 20,
  paragraphSpace: 5
};

const validV1Item = {
  name: "A",
  markdown: "# A",
  styles: validStyles,
  created_at: "1",
  updated_at: "1"
};

describe("IsValid", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("font", () => {
    it("accepts a font with name and fontFamily", () => {
      expect(IsValid.font({ name: "Minion Pro", fontFamily: "minion-pro" })).toBe(true);
    });

    it("accepts a font without fontFamily", () => {
      expect(IsValid.font({ name: "Minion Pro" })).toBe(true);
    });

    it("rejects non-objects and invalid shapes", () => {
      expect(IsValid.font(null)).toBe(false);
      expect(IsValid.font("A")).toBe(false);
      expect(IsValid.font({})).toBe(false);
      expect(IsValid.font({ name: 1 })).toBe(false);
    });
  });

  describe("importedData", () => {
    it("accepts valid v1 data", () => {
      expect(IsValid.importedData({ "1": validV1Item }, "v1")).toBe(true);
    });

    it("accepts valid v0 data with optional update field", () => {
      const v0Item = { name: "A", markdown: "", styles: validStyles, update: "1" };
      expect(IsValid.importedData({ "1": v0Item }, "v0")).toBe(true);
    });

    it("rejects an unknown version", () => {
      expect(IsValid.importedData({ "1": validV1Item }, "v9")).toBe(false);
    });

    it("rejects data missing required fields", () => {
      const item = { ...validV1Item, name: undefined };
      expect(IsValid.importedData({ "1": item }, "v1")).toBe(false);
    });

    it("rejects data with non-numeric style values", () => {
      const item = { ...validV1Item, styles: { ...validStyles, fontSize: "big" } };
      expect(IsValid.importedData({ "1": item }, "v1")).toBe(false);
    });
  });

  describe("importedJson", () => {
    it("accepts a full versioned JSON payload", () => {
      const json = { version: "v1", data: { "1": validV1Item } };
      const res = IsValid.importedJson(json);

      expect(res).not.toBe(false);
      if (res) {
        expect(res.version).toBe("v1");
        expect(res.data["1"].name).toBe("A");
      }
    });

    it("falls back to v0 when the payload is bare data without a version", () => {
      const v0Item = { name: "A", markdown: "", styles: validStyles, update: "1" };
      const res = IsValid.importedJson({ "1": v0Item });

      expect(res).not.toBe(false);
      if (res) {
        expect(res.version).toBe("v0");
      }
    });

    it("treats an empty object as valid empty v0 data", () => {
      const res = IsValid.importedJson({});
      expect(res).not.toBe(false);
      if (res) {
        expect(res.version).toBe("v0");
        expect(Object.keys(res.data)).toHaveLength(0);
      }
    });

    it("rejects non-object input", () => {
      expect(IsValid.importedJson("nope")).toBe(false);
      expect(IsValid.importedJson(null)).toBe(false);
      expect(IsValid.importedJson(42)).toBe(false);
    });
  });
});
