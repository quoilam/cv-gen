<template>
  <div>
    <!-- Not configured -->
    <div v-if="!configured">
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">提供商</label>
          <SharedUiCombobox
            id="llm-provider"
            class="mt-1"
            :items="providerItems"
            :default-value="provider"
          />
        </div>
        <div>
          <label class="text-sm font-medium">API Key</label>
          <UiInput v-model="apiKey" type="password" placeholder="sk-..." class="mt-1" />
        </div>
        <div>
          <label class="text-sm font-medium">模型</label>
          <UiInput v-model="model" :placeholder="defaultModel" class="mt-1" />
        </div>
        <div>
          <label class="text-sm font-medium">Base URL</label>
          <UiInput v-model="baseUrl" :placeholder="defaultBaseUrl" class="mt-1" />
        </div>
      </div>
      <div v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</div>
      <UiButton class="mt-3 w-full" @click="handleConnect">
        连接
      </UiButton>
    </div>

    <!-- Connected state -->
    <div v-else>
      <div class="flex items-center gap-2 text-sm text-green-600 mb-1">
        <span i-line-md:confirm />
        已连接
      </div>
      <div class="text-sm text-muted-foreground mb-3">
        {{ currentProvider }} · {{ currentModel }}
      </div>
      <UiButton variant="outline" class="w-full" @click="handleDisconnect">
        断开连接
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAI } from "~/composables/ai";

const ai = useAI();
const { configured, currentModel, currentBaseUrl, error } = ai;

const providerMap: Record<string, { model: string; baseUrl: string }> = {
  openai: { model: "gpt-4o", baseUrl: "https://api.openai.com/v1" },
  anthropic: { model: "claude-sonnet-4-6", baseUrl: "https://api.anthropic.com/v1" }
};

const provider = ref("openai");
const apiKey = ref("");
const model = ref("");
const baseUrl = ref("");

const defaultModel = computed(() => providerMap[provider.value]?.model ?? "");
const defaultBaseUrl = computed(() => providerMap[provider.value]?.baseUrl ?? "");

const currentProvider = computed(() =>
  provider.value === "openai" ? "OpenAI" : "Anthropic"
);

function onProviderChange(val: string) {
  provider.value = val;
  model.value = "";
  baseUrl.value = "";
}

const providerItems = [
  { label: "OpenAI", value: "openai", onSelect: () => onProviderChange("openai") },
  { label: "Anthropic", value: "anthropic", onSelect: () => onProviderChange("anthropic") }
];

function handleConnect() {
  if (!apiKey.value) return;
  ai.configure({
    provider: provider.value as "openai" | "anthropic",
    apiKey: apiKey.value,
    model: model.value || undefined,
    baseUrl: baseUrl.value || undefined
  });
}

function handleDisconnect() {
  ai.disconnect();
  provider.value = "openai";
  apiKey.value = "";
  model.value = "";
  baseUrl.value = "";
}
</script>
