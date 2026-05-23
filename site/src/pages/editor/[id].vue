<template>
  <div id="editor-page" class="flex flex-col">
    <SharedHeader />

    <div class="workspace flex pb-2">
      <SplitterGroup id="splitter-editor" direction="horizontal" class="px-3" :default-size="50">
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

        <SplitterPanel id="preview-pane" class="relative">
          <EditorPreview v-if="data.loaded" />
          <UiSkeleton v-else class="size-full bg-muted rounded-lg m-2" />

          <FloatingPanel v-if="data.loaded" />
        </SplitterPanel>
      </SplitterGroup>
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
</script>
