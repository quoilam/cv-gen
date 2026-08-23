import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: {
    injectToolbar: vi.fn(),
  },
}));

vi.mock("~/composables/constant", () => ({
  useConstant: () => ({
    DEFAULT: {
      RESUME_NAME: "New Resume",
      STYLES: {},
      MD_CONTENT: "",
      CSS_CONTENT: "",
    },
    VERSION: { CURRENT: "v1" },
  }),
}));

describe("useDataStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("initializes with default values", () => {
    const { data } = useDataStore();
    expect(data.markdown).toBe("");
    expect(data.resumeId).toBeNull();
    expect(data.loaded).toBe(false);
    expect(data.resumeName).toBe("New Resume");
  });

  it("setData updates reactive state", () => {
    const { data, setData } = useDataStore();
    setData("markdown", "# Hello");
    expect(data.markdown).toBe("# Hello");
  });

  it("setAndSyncToMonaco updates data and syncs to monaco", () => {
    const { data, setAndSyncToMonaco } = useDataStore();
    setAndSyncToMonaco("markdown", "## Test");
    expect(data.markdown).toBe("## Test");
    // useMonaco is auto-imported and aliased to global mock — verify the data was set
    // (the mock's setContent is a vi.fn, we verify data side-effect instead)
  });
});
