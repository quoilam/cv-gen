import type { IconProvider, IconResult } from "./providers/iconify";
import { IconifyProvider } from "./providers/iconify";

export type { IconProvider, IconResult };

export const useIcon = () => {
  const loading = ref(false);
  const results = ref<IconResult[]>([]);
  const error = ref<string | null>(null);

  const _providers: IconProvider[] = [new IconifyProvider()];

  const registerProvider = (provider: IconProvider) => {
    _providers.push(provider);
  };

  const search = async (keyword: string) => {
    if (!keyword.trim()) {
      results.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const allResults = await Promise.all(
        _providers.map((p) => p.search(keyword).catch(() => [] as IconResult[]))
      );
      results.value = allResults.flat();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const insertIcon = (icon: IconResult) => {
    const monacoState = useMonacoState();
    const editor = monacoState.value?.editor;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    const mdRef = `![icon:${icon.name}](${icon.url})`;
    editor.executeEdits("insert-icon", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: mdRef
      }
    ]);

    const newColumn = position.column + mdRef.length;
    editor.setPosition({ lineNumber: position.lineNumber, column: newColumn });
    editor.revealPositionInCenter({ lineNumber: position.lineNumber, column: newColumn });
  };

  return { search, insertIcon, registerProvider, loading, results, error };
};
