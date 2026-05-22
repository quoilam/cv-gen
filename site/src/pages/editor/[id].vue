<template>
  <div id="editor-page" class="flex flex-col">
    <SharedHeader>
      <template #tail>
        <UiButton
          variant="ghost"
          size="round"
          class="text-muted-foreground hover:text-foreground"
          @click="isToolbarOpen = !isToolbarOpen"
          :aria-label="isToolbarOpen ? '关闭工具栏' : '打开工具栏'"
        >
          <span
            :class="[
              'size-4.5 transition-transform duration-200',
              isToolbarOpen
                ? 'i-tabler:layout-sidebar-right-collapse'
                : 'i-tabler:layout-sidebar-right-expand'
            ]"
          />
        </UiButton>
      </template>
    </SharedHeader>

    <div class="workspace flex pb-2">
      <SplitterGroup id="splitter-editor" direction="horizontal" class="px-3">
        <SplitterPanel id="code-pane">
          <EditorCode v-if="data.loaded" />
          <div v-else class="flex flex-col gap-y-2 h-full p-2">
            <UiSkeleton class="h-10 bg-muted rounded-lg" />
            <UiSkeleton class="flex-1 bg-muted rounded-lg" />
          </div>
        </SplitterPanel>

        <SplitterResizeHandle
          id="code-preview-handle"
          class="w-4 relative group"
        >
          <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1
                      rounded-full bg-border/60 group-hover:bg-primary/60
                      group-active:bg-primary transition-colors duration-200" />
        </SplitterResizeHandle>

        <SplitterPanel id="preview-pane">
          <EditorPreview v-if="data.loaded" />
          <UiSkeleton v-else class="size-full bg-muted rounded-lg m-2" />
        </SplitterPanel>
      </SplitterGroup>

      <div
        v-if="isToolbarOpen"
        id="tools-pane"
        class="shrink-0"
        lt-lg="fixed z-10 max-w-full h-full right-0 top-12 pb-10"
      >
        <EditorToolbar v-if="data.loaded" />
        <UiSkeleton v-else class="h-full w-68 bg-muted mr-3 rounded-l-xl" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isInteger } from "@cvgen/utils";

const route = useRoute();
const { data } = useDataStore();
const { switchToResume } = useResume();

onMounted(() => {
  if (isInteger(route.params.id, { allowString: true })) {
    switchToResume(Number(route.params.id));
  }
});

const { width } = useWindowSize();
const isToolbarOpen = ref(width.value > 1024);
</script>
