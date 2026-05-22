import type { ResumeStyles } from "~/composables/stores/style";

export class StyleChangeCommand<T extends keyof ResumeStyles = keyof ResumeStyles> {
  key: T;
  oldValue: ResumeStyles[T];
  newValue: ResumeStyles[T];

  constructor(key: T, oldValue: ResumeStyles[T], newValue: ResumeStyles[T]) {
    this.key = key;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  async execute() {
    const { setStyle } = useStyleStore();
    await setStyle(this.key, this.newValue);
  }

  async undo() {
    const { setStyle } = useStyleStore();
    await setStyle(this.key, this.oldValue);
  }
}

export const useStyleHistory = () => {
  const undoStack: (StyleChangeCommand | StyleChangeCommand[])[] = [];
  const redoStack: (StyleChangeCommand | StyleChangeCommand[])[] = [];

  const execute = async <T extends keyof ResumeStyles>(
    key: T,
    oldValue: ResumeStyles[T],
    newValue: ResumeStyles[T]
  ) => {
    const cmd = new StyleChangeCommand(key, oldValue, newValue);
    await cmd.execute();
    undoStack.push(cmd);
    redoStack.length = 0;
  };

  const executeBatch = async (changes: { key: keyof ResumeStyles; oldValue: ResumeStyles[keyof ResumeStyles]; newValue: ResumeStyles[keyof ResumeStyles] }[]) => {
    const cmds = changes.map(
      (c) => new StyleChangeCommand(c.key, c.oldValue, c.newValue)
    );
    const { setStyles } = useStyleStore();
    const values: Partial<ResumeStyles> = {};
    for (const c of changes) {
      (values as Record<string, unknown>)[c.key as string] = c.newValue;
    }
    await setStyles(values);
    undoStack.push(cmds);
    redoStack.length = 0;
  };

  const undo = async () => {
    const item = undoStack.pop();
    if (!item) return;
    if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i--) {
        await item[i].undo();
      }
    } else {
      await item.undo();
    }
    redoStack.push(item);
  };

  const redo = async () => {
    const item = redoStack.pop();
    if (!item) return;
    if (Array.isArray(item)) {
      const { setStyles } = useStyleStore();
      const values: Partial<ResumeStyles> = {};
      for (const cmd of item) {
        (values as Record<string, unknown>)[cmd.key as string] = cmd.newValue;
      }
      await setStyles(values);
    } else {
      await item.execute();
    }
    undoStack.push(item);
  };

  const clear = () => {
    undoStack.length = 0;
    redoStack.length = 0;
  };

  return {
    execute,
    executeBatch,
    undo,
    redo,
    clear,
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0
  };
};
