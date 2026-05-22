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
  const undoStack: StyleChangeCommand[] = [];
  const redoStack: StyleChangeCommand[] = [];

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

  const undo = async () => {
    const cmd = undoStack.pop();
    if (!cmd) return;
    await cmd.undo();
    redoStack.push(cmd);
  };

  const redo = async () => {
    const cmd = redoStack.pop();
    if (!cmd) return;
    await cmd.execute();
    undoStack.push(cmd);
  };

  const clear = () => {
    undoStack.length = 0;
    redoStack.length = 0;
  };

  return {
    execute,
    undo,
    redo,
    clear,
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0
  };
};
