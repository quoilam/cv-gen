import { describe, it, expect, vi } from "vitest";

const storeItems = new Map<string, string>();
vi.mock("localforage", () => {
  const instance = {
    getItem: vi.fn((key: string) => Promise.resolve(storeItems.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      storeItems.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      storeItems.delete(key);
      return Promise.resolve();
    }),
    keys: vi.fn(() => Promise.resolve([...storeItems.keys()])),
    createInstance: vi.fn(function () {
      return instance;
    })
  };
  return { ...instance, default: instance, __esModule: true };
});

import { useBadgeIcon } from "~/composables/badge-icon";

describe("useBadgeIcon", () => {
  it("insert returns markdown image snippet", () => {
    const { insert } = useBadgeIcon();
    expect(insert("data:image/png;base64,abc")).toBe("![](data:image/png;base64,abc)");
  });
});
