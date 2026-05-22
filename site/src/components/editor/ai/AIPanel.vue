<template>
  <div class="p-3">
    <!-- Not configured: message + link to settings -->
    <div v-if="!configured" class="text-center py-6">
      <div class="text-sm text-muted-foreground mb-3">AI 未配置</div>
      <NuxtLink to="/settings" class="text-sm text-primary hover:underline inline-flex items-center gap-1">
        <span i-lucide:settings class="size-3.5" />
        前往设置
      </NuxtLink>
    </div>

    <!-- Configured: Feature Tabs -->
    <div v-else>
      <div class="flex border-b mb-3">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="text-sm px-3 py-1.5 border-b-2"
          :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Generate from Project Docs -->
      <div v-if="activeTab === 'generate'">
        <textarea
          v-model="docInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          placeholder="在此输入项目描述，AI 将根据描述生成简历内容"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !docInput.trim()"
          @click="doGenerate"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? '生成中...' : '生成' }}
        </UiButton>
      </div>

      <!-- Optimize from JD -->
      <div v-if="activeTab === 'optimize'">
        <textarea
          v-model="jdInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          placeholder="在此输入职位描述，AI 将根据 JD 优化简历"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !jdInput.trim()"
          @click="doOptimize"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? '优化中...' : '优化' }}
        </UiButton>
      </div>

      <!-- Stream Output Preview -->
      <div v-if="streamContent" class="mt-3 border rounded p-2 max-h-48 overflow-y-auto">
        <div class="text-xs text-muted-foreground mb-1">预览</div>
        <div class="text-sm whitespace-pre-wrap">{{ streamContent }}</div>
        <div class="flex gap-2 mt-2">
          <UiButton
            v-if="activeTab === 'generate'"
            size="xs"
            variant="outline"
            @click="doInsert"
          >
            插入
          </UiButton>
          <UiButton
            v-if="activeTab === 'optimize'"
            size="xs"
            variant="outline"
            @click="doReplace"
          >
            替换
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
import { NuxtLink } from "#components";

const ai = useAI();

const { loading, streamContent, error, configured } = ai;
const activeTab = ref<"generate" | "optimize">("generate");
const docInput = ref("");
const jdInput = ref("");

const tabs = [
  { id: "generate", label: "生成" },
  { id: "optimize", label: "优化" }
] as const;

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
