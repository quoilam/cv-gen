import localforage from "localforage";
import type { LLMProvider } from "./providers/types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { PROMPTS } from "./prompts";

export interface LLMConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

const llmConfigStore = localforage.createInstance({ name: "cvgen_llm_config" });

let _initialized = false;

export const useAI = () => {
  const loading = ref(false);
  const streamContent = ref("");
  const error = ref<string | null>(null);
  const configured = ref(false);
  const currentModel = ref<string | null>(null);
  const currentBaseUrl = ref<string | null>(null);

  let _provider: LLMProvider | null = null;
  const _streamCallbacks: Array<(chunk: string) => void> = [];

  const saveConfig = async (config: LLMConfig) => {
    await llmConfigStore.setItem("config", config);
  };

  const loadConfig = async (): Promise<LLMConfig | null> => {
    return llmConfigStore.getItem<LLMConfig>("config");
  };

  const clearConfig = async () => {
    await llmConfigStore.removeItem("config");
  };

  const configure = (config: LLMConfig) => {
    if (config.provider === "openai") {
      _provider = new OpenAIProvider(config.apiKey, config.model, config.baseUrl);
      currentModel.value = config.model ?? "gpt-4o";
      currentBaseUrl.value = config.baseUrl ?? "https://api.openai.com/v1";
    } else {
      _provider = new AnthropicProvider(config.apiKey, config.model, config.baseUrl);
      currentModel.value = config.model ?? "claude-sonnet-4-6";
      currentBaseUrl.value = config.baseUrl ?? "https://api.anthropic.com/v1";
    }
    configured.value = true;
    saveConfig(config);
  };

  const disconnect = async () => {
    _provider = null;
    configured.value = false;
    currentModel.value = null;
    currentBaseUrl.value = null;
    await clearConfig();
  };

  if (!_initialized) {
    _initialized = true;
    loadConfig().then((c) => { if (c) configure(c); });
  }

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
    disconnect,
    loading,
    streamContent,
    error,
    configured,
    currentModel,
    currentBaseUrl
  };
};
