import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

const { mockStorage } = vi.hoisted(() => {
  const mockStorage = new Map<string, unknown>();
  return { mockStorage };
});

vi.mock("localforage", () => {
  const instance = {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: unknown) => {
      mockStorage.set(key, value);
      return Promise.resolve(value);
    }),
    createInstance: vi.fn(() => ({
      getItem: vi.fn(() => Promise.resolve(null)),
      setItem: vi.fn()
    }))
  };
  return { ...instance, default: instance, __esModule: true };
});

vi.mock("@cvgen/utils", () => {
  let tick = 0;
  return {
    isClient: true,
    copy: (obj: unknown) => JSON.parse(JSON.stringify(obj)),
    now: () => {
      tick++;
      return 1717000000000 + tick;
    },
    downloadFile: vi.fn(),
    isObject: (v: unknown) => typeof v === "object" && v !== null,
    isInteger: (v: unknown) =>
      typeof v === "number" ? Number.isInteger(v) : /^\d+$/.test(String(v)),
    arrayify: (v: unknown) => (Array.isArray(v) ? v : [v])
  };
});

import { ResumeRepository } from "~/utils/storage/repository";
import { LocalForageDbService } from "~/utils/storage/localForage";

describe("ResumeRepository", () => {
  let repo: ResumeRepository;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockStorage.clear();
    mockStorage.set("cvgen_version", "v1");
    repo = new ResumeRepository(new LocalForageDbService());
  });

  it("createResume creates and returns a new resume", async () => {
    const { data, error } = await repo.createResume();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.name).toBe("New Resume");
    expect(data!.id).toBeGreaterThan(0);
  });

  it("getResumes returns all resumes", async () => {
    await repo.createResume();
    await repo.createResume();
    const { data, error } = await repo.getResumes();
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it("getResume returns specific resume by id", async () => {
    const { data: created } = await repo.createResume();
    const { data, error } = await repo.getResume(created!.id);
    expect(error).toBeNull();
    expect(data!.id).toBe(created!.id);
    expect(data!.name).toBe("New Resume");
  });

  it("updateResume modifies fields", async () => {
    const { data: created } = await repo.createResume();
    const { data: updated } = await repo.updateResume({
      id: created!.id,
      name: "Updated Name"
    });
    expect(updated!.name).toBe("Updated Name");
    const { data: reRead } = await repo.getResume(created!.id);
    expect(reRead!.name).toBe("Updated Name");
  });

  it("deleteResume removes the resume", async () => {
    const { data: created } = await repo.createResume();
    await repo.deleteResume(created!.id);
    const { data, error } = await repo.getResume(created!.id);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("duplicateResume copies a resume with appended name", async () => {
    const { data: created } = await repo.createResume();
    await repo.updateResume({ id: created!.id, name: "Original" });
    const { data: dup } = await repo.duplicateResume(created!.id);
    expect(dup!.name).toBe("Original Copy");
    expect(dup!.id).not.toBe(created!.id);
    expect(dup!.markdown).toBe(created!.markdown);
  });

  it("CRUD round-trip preserves all fields", async () => {
    const { data: created } = await repo.createResume();
    const id = created!.id;

    await repo.updateResume({
      id,
      name: "My CV",
      markdown: "# Custom MD"
    });

    const { data: loaded } = await repo.getResume(id);
    expect(loaded!.name).toBe("My CV");
    expect(loaded!.markdown).toBe("# Custom MD");
    expect(loaded!.id).toBe(id);
    expect(loaded!.updated_at).toBeDefined();
    expect(loaded!.created_at).toBeDefined();
  });
});
