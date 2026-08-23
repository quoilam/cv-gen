import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@cvgen/dynamic-css", () => ({
  dynamicCssService: { injectToolbar: vi.fn() }
}));

vi.mock("~/composables/icon", () => ({
  fontService: { resolve: vi.fn() }
}));

import { useStyleHistory } from "~/composables/styleHistory";

describe("useStyleHistory", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("execute applies new value and records undo state", async () => {
    const { styles } = useStyleStore();
    const history = useStyleHistory();

    await history.execute("fontSize", 15, 20);

    expect(styles.fontSize).toBe(20);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("undo restores the old value and enables redo", async () => {
    const { styles } = useStyleStore();
    const history = useStyleHistory();

    await history.execute("fontSize", 15, 20);
    await history.undo();

    expect(styles.fontSize).toBe(15);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("redo re-applies the value after undo", async () => {
    const { styles } = useStyleStore();
    const history = useStyleHistory();

    await history.execute("fontSize", 15, 20);
    await history.undo();
    await history.redo();

    expect(styles.fontSize).toBe(20);
    expect(history.canRedo()).toBe(false);
  });

  it("a new execute after undo clears the redo stack", async () => {
    const { styles } = useStyleStore();
    const history = useStyleHistory();

    await history.execute("fontSize", 15, 20);
    await history.undo();
    await history.execute("fontSize", 15, 24);

    expect(styles.fontSize).toBe(24);
    expect(history.canRedo()).toBe(false);
  });

  it("executeBatch applies all changes at once and undoes them in reverse", async () => {
    const { styles } = useStyleStore();
    const history = useStyleHistory();

    await history.executeBatch([
      { key: "fontSize", oldValue: 15, newValue: 18 },
      { key: "marginV", oldValue: 20, newValue: 30 }
    ]);

    expect(styles.fontSize).toBe(18);
    expect(styles.marginV).toBe(30);
    expect(history.canUndo()).toBe(true);

    await history.undo();
    expect(styles.fontSize).toBe(15);
    expect(styles.marginV).toBe(20);

    await history.redo();
    expect(styles.fontSize).toBe(18);
    expect(styles.marginV).toBe(30);
  });

  it("undo and redo on empty stacks are no-ops", async () => {
    const history = useStyleHistory();

    await history.undo();
    await history.redo();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("clear resets both stacks", async () => {
    const history = useStyleHistory();

    await history.execute("fontSize", 15, 20);
    await history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });
});
