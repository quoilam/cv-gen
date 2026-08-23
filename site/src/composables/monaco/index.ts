import { isClient } from "@cvgen/utils";
import type * as Monaco from "monaco-editor";
import { setupMonacoModel, setupMonacoEditor, type MonacoModel } from "./setup";

type MonacoStates = {
  editor: Monaco.editor.IStandaloneCodeEditor;
  markdown: MonacoModel;
};

export const useMonacoState = () =>
  useState<MonacoStates | undefined>("monacoStates", shallowRef);

export const useMonaco = () => {
  const states = useMonacoState();
  const loading = useState<boolean>("monacoLoading", () => false);

  const setup = async (container?: HTMLElement) => {
    if (!isClient || !container) return;

    loading.value = true;

    try {
      const { editor } = await setupMonacoEditor(container);
      const { data, setData } = useDataStore();

      const markdown = await setupMonacoModel("markdown", data.markdown, () =>
        setData("markdown", markdown.get().getValue())
      );

      editor.setModel(markdown.get());
      states.value = { editor, markdown };
    } catch (error) {
      const toast = useToast();
      toast.error("monaco");
      console.error("Failed to initialize the editor: ", error);
    } finally {
      loading.value = false;
    }
  };

  const dispose = () => {
    states.value?.editor.dispose();
    states.value?.markdown.dispose();

    states.value = undefined;
    loading.value = false;
  };

  const setContent = (model: "markdown", content: string) => {
    states.value?.[model].get().setValue(content);
  };

  return {
    setup,
    dispose,
    setContent,
    loading
  };
};
