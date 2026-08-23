<template>
  <ClientOnly>
    <div id="editor-page" class="flex flex-col">
      <SharedHeader>
        <template #tail>
          <button
            v-if="data.loaded"
            class="floating-trigger"
            aria-label="打开编辑面板"
            @click="isPanelOpen = true"
          >
            <span class="i-tabler:dots size-5" />
          </button>
        </template>
      </SharedHeader>

      <!-- Invalid route ID -->
      <div v-if="badRoute" class="workspace flex items-center justify-center py-20">
        <div class="text-center space-y-3">
          <p class="text-lg font-semibold text-muted-foreground">无效的简历 ID</p>
          <NuxtLink to="/" class="text-sm text-primary hover:underline"
            >返回首页</NuxtLink
          >
        </div>
      </div>

      <div v-else class="workspace flex pb-2">
        <SplitterGroup
          id="splitter-editor"
          direction="horizontal"
          class="px-3"
          :default-size="50"
        >
          <SplitterPanel id="code-pane">
            <EditorCode v-if="data.loaded" />
            <div v-else class="flex flex-col gap-y-2 h-full p-2">
              <UiSkeleton class="h-10 bg-muted rounded-lg" />
              <UiSkeleton class="flex-1 bg-muted rounded-lg" />
            </div>
          </SplitterPanel>

          <SplitterResizeHandle id="code-preview-handle" class="w-4 relative group">
            <div
              class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 rounded-full bg-border/60 group-hover:bg-primary/60 group-active:bg-primary transition-colors duration-200"
            />
          </SplitterResizeHandle>

          <SplitterPanel id="preview-pane" class="relative">
            <EditorPreview v-if="data.loaded" />
            <UiSkeleton v-else class="size-full bg-muted rounded-lg m-2" />
          </SplitterPanel>
        </SplitterGroup>
      </div>

      <EditorFloatingPanel v-if="data.loaded" v-model:open="isPanelOpen" />
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { isInteger } from "@cvgen/utils";
import { useShortcuts } from "@cvgen/vue-shortcuts";

const isPanelOpen = ref(false);
const route = useRoute();
const { data } = useDataStore();
const { styles } = useStyleStore();
const { switchToResume, updateResume } = useResume();

const handleSave = async () => {
  if (!data.resumeId) return;
  await updateResume({
    id: data.resumeId,
    name: data.resumeName,
    markdown: data.markdown,
    styles: toRaw(styles)
  });
};
useShortcuts("ctrl+s", handleSave);

const badRoute = ref(false);

onMounted(() => {
  if (isInteger(route.params.id, { allowString: true })) {
    switchToResume(Number(route.params.id));
  } else {
    badRoute.value = true;
  }
});
</script>

<style scoped>
.floating-trigger {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: hsl(var(--primary));
  border: none;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
  color: hsl(var(--primary-foreground));
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 150ms,
    transform 150ms,
    box-shadow 150ms;
  opacity: 0.85;
}

.floating-trigger:hover {
  opacity: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}
</style>
