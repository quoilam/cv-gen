import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: {
    injectToolbar: vi.fn()
  }
}));

const mockFontResolve = vi.fn();
vi.mock("~/composables/icon", () => ({
  fontService: {
    resolve: mockFontResolve
  }
}));

describe("useStyleStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("initializes with default styles", () => {
    const { styles } = useStyleStore();
    expect(styles.fontSize).toBe(15);
    expect(styles.marginV).toBe(20);
  });

  it("setStyle updates a single style field", async () => {
    const { styles, setStyle } = useStyleStore();
    await setStyle("fontSize", 18);
    expect(styles.fontSize).toBe(18);
  });

  it("setStyles updates multiple fields at once", async () => {
    const { styles, setStyles } = useStyleStore();
    await setStyles({ fontSize: 20 });
    expect(styles.fontSize).toBe(20);
  });
});
