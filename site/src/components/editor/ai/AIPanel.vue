<template>
  <div class="p-3">
    <!-- API Configuration -->
    <div v-if="!configured" class="mb-3 space-y-2">
      <select v-model="selectedProvider" class="w-full text-sm border rounded px-2 py-1 bg-background">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      <input
        v-model="apiKey"
        type="password"
        placeholder="API Key"
        class="w-full text-sm border rounded px-2 py-1 bg-background"
      />
      <UiButton size="sm" class="w-full" @click="doConfigure">
        {{ $t("ai.configure") }}
      </UiButton>
    </div>

    <!-- Feature Tabs -->
    <div v-else>
      <div class="flex border-b mb-3">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="text-sm px-3 py-1.5 border-b-2"
          :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent'"
          @click="activeTab = tab.id"
        >
          {{ $t(tab.labelKey) }}
        </button>
      </div>

      <!-- Generate from Project Docs -->
      <div v-if="activeTab === 'generate'">
        <textarea
          v-model="docInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          :placeholder="$t('ai.generate_placeholder')"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !docInput.trim()"
          @click="doGenerate"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? $t("ai.generating") : $t("ai.generate") }}
        </UiButton>
      </div>

      <!-- Optimize from JD -->
      <div v-if="activeTab === 'optimize'">
        <textarea
          v-model="jdInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          :placeholder="$t('ai.optimize_placeholder')"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !jdInput.trim()"
          @click="doOptimize"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? $t("ai.optimizing") : $t("ai.optimize") }}
        </UiButton>
      </div>

      <!-- Stream Output Preview -->
      <div v-if="streamContent" class="mt-3 border rounded p-2 max-h-48 overflow-y-auto">
        <div class="text-xs text-muted-foreground mb-1">{{ $t("ai.preview") }}</div>
        <div class="text-sm whitespace-pre-wrap">{{ streamContent }}</div>
        <div class="flex gap-2 mt-2">
          <UiButton
            v-if="activeTab === 'generate'"
            size="xs"
            variant="outline"
            @click="doInsert"
          >
            {{ $t("ai.insert") }}
          </UiButton>
          <UiButton
            v-if="activeTab === 'optimize'"
            size="xs"
            variant="outline"
            @click="doReplace"
          >
            {{ $t("ai.replace") }}
          </UiButton>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-2 text-xs text-destructive">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAI } from "~/composables/ai";

const ai = useAI();

const configured = ref(false);
const selectedProvider = ref<"openai" | "anthropic">("openai");
const apiKey = ref("");
const activeTab = ref<"generate" | "optimize">("generate");
const docInput = ref("");
const jdInput = ref("");
const { loading, streamContent, error } = ai;

const tabs = [
  { id: "generate", labelKey: "ai.tab_generate" },
  { id: "optimize", labelKey: "ai.tab_optimize" }
];

const doConfigure = () => {
  ai.configure(selectedProvider.value, apiKey.value);
  configured.value = true;
};

const doGenerate = async () => {
  try {
    await ai.generateFromDoc(docInput.value);
  } catch { /* handled by reactive error ref */ }
};

const doOptimize = async () => {
  try {
    const { data } = useDataStore();
    await ai.optimizeFromJD(jdInput.value, data.markdown);
  } catch { /* handled by reactive error ref */ }
};

const doInsert = () => {
  ai.insertToEditor(streamContent.value);
  streamContent.value = "";
  docInput.value = "";
};

const doReplace = () => {
  ai.replaceEditorContent(streamContent.value);
  streamContent.value = "";
  jdInput.value = "";
};
</script>
