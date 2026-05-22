import type { LLMProvider } from "./providers/types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { PROMPTS } from "./prompts";

export const useAI = () => {
  const loading = ref(false);
  const streamContent = ref("");
  const error = ref<string | null>(null);

  let _provider: LLMProvider | null = null;
  const _streamCallbacks: Array<(chunk: string) => void> = [];

  const configure = (provider: "openai" | "anthropic", apiKey: string) => {
    if (provider === "openai") {
      _provider = new OpenAIProvider(apiKey);
    } else {
      _provider = new AnthropicProvider(apiKey);
    }
  };

  const onStream = (cb: (chunk: string) => void) => {
    _streamCallbacks.push(cb);
  };

  const generateFromDoc = async (doc: string): Promise<string> => {
    if (!_provider) throw new Error("AI provider not configured");

    loading.value = true;
    error.value = null;
    streamContent.value = "";

    try {
      const messages = [
        { role: "user" as const, content: PROMPTS.generateFromDoc(doc) }
      ];

      let result = "";
      await _provider.chatStream(messages, (chunk) => {
        result += chunk.content;
        streamContent.value = result;
        _streamCallbacks.forEach((cb) => cb(chunk.content));
      });

      return result;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const optimizeFromJD = async (jd: string, currentMd: string): Promise<string> => {
    if (!_provider) throw new Error("AI provider not configured");

    loading.value = true;
    error.value = null;
    streamContent.value = "";

    try {
      const messages = [
        { role: "user" as const, content: PROMPTS.optimizeFromJD(jd, currentMd) }
      ];

      let result = "";
      await _provider.chatStream(messages, (chunk) => {
        result += chunk.content;
        streamContent.value = result;
        _streamCallbacks.forEach((cb) => cb(chunk.content));
      });

      return result;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const insertToEditor = (content: string) => {
    const { data } = useDataStore();
    const { setContent } = useMonaco();
    setContent("markdown", data.markdown + "\n" + content);
  };

  const replaceEditorContent = (content: string) => {
    const { setContent } = useMonaco();
    setContent("markdown", content);
  };

  return {
    configure,
    generateFromDoc,
    optimizeFromJD,
    insertToEditor,
    replaceEditorContent,
    onStream,
    loading,
    streamContent,
    error
  };
};
