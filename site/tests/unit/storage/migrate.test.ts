import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: { injectToolbar: vi.fn() }
}));

vi.mock("~/composables/icon", () => ({
  fontService: { resolve: vi.fn() }
}));

import { MigrateService } from "~/utils/storage/migrate";

const styles = {
  marginV: 20,
  marginH: 45,
  contentWidth: 100,
  lineHeight: 1.3,
  paragraphSpace: 5,
  firstHeadingOverlap: 4,
  fontCJK: { name: "华康宋体", fontFamily: "HKST" },
  fontEN: { name: "Minion Pro" },
  fontSize: 15
};

describe("MigrateService", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("migrate from v0 derives timestamps from id and update field", async () => {
    const svc = new MigrateService("v0");
    const result = await svc.migrate({
      "123": { name: "A", markdown: "# A", styles, update: "456" }
    });

    expect(result.from).toBe("v0");
    expect(result.to).toBe("v1");
    expect(result.data["123"]).toEqual({
      name: "A",
      markdown: "# A",
      styles,
      created_at: "123",
      updated_at: "456"
    });
  });

  it("fromV0 falls back to id for updated_at when update is absent", async () => {
    const svc = new MigrateService("v0");
    const result = await svc.fromV0({
      "9": { name: "B", markdown: "", styles }
    });

    expect(result.data["9"].created_at).toBe("9");
    expect(result.data["9"].updated_at).toBe("9");
  });

  it("migrate passes data through unchanged when source version equals current", async () => {
    const { VERSION } = useConstant();
    const svc = new MigrateService(VERSION.CURRENT);
    const input = {
      "1": { name: "C", markdown: "", styles, created_at: "1", updated_at: "1" }
    };

    const result = await svc.migrate(input);
    expect(result.data).toEqual(input);
    expect(result.from).toBe(result.to);
  });

  it("migrate throws on unsupported source version", async () => {
    const svc = new MigrateService("v9" as never);
    await expect(svc.migrate({})).rejects.toThrow(/not supported/);
  });

  it("defaults to empty fallback version when none is passed", async () => {
    const svc = new MigrateService();
    const result = await svc.fromV0({ "5": { name: "D", markdown: "", styles } });

    expect(result.data["5"].created_at).toBe("5");
    expect(result.data["5"].updated_at).toBe("5");
  });
});
