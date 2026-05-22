import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: {
    injectCssEditor: vi.fn(),
    injectToolbar: vi.fn(),
  },
}));

const mockSetContent = vi.fn();
vi.mock("~/composables/monaco", () => ({
  useMonaco: () => ({
    setContent: mockSetContent,
    setup: vi.fn(),
    dispose: vi.fn(),
    activateModel: vi.fn(),
    loading: ref(false),
  }),
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
    expect(data.css).toBe("");
    expect(data.resumeId).toBeNull();
    expect(data.loaded).toBe(false);
    expect(data.resumeName).toBe("New Resume");
  });

  it("setData updates reactive state", () => {
    const { data, setData } = useDataStore();
    setData("markdown", "# Hello");
    expect(data.markdown).toBe("# Hello");
  });

  it("setData for css calls injectCssEditor", async () => {
    const { setData } = useDataStore();
    const { dynamicCssService } = await import("@cvgen/dynamic-css");
    setData("css", "body { color: red; }");
    expect(dynamicCssService.injectCssEditor).toHaveBeenCalledWith(
      "body { color: red; }",
    );
  });

  it("setAndSyncToMonaco updates data and syncs to monaco", () => {
    const { data, setAndSyncToMonaco } = useDataStore();
    setAndSyncToMonaco("markdown", "## Test");
    expect(data.markdown).toBe("## Test");
    expect(mockSetContent).toHaveBeenCalledWith("markdown", "## Test");
  });
});
