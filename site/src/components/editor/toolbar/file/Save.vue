<template>
  <UiButton
    class="gap-x-1.5 w-full h-8 justify-start"
    variant="ghost"
    size="sm"
    @click="save"
  >
    <span i-ic:baseline-save text-base />
    保存
    <span class="flex-1 tracking-widest" text="xs right muted-foreground">⌘ S</span>
  </UiButton>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@cvgen/vue-shortcuts";

const { data } = useDataStore();
const { styles } = useStyleStore();
const { updateResume } = useResume();

const save = async () => {
  if (!data.resumeId) return;

  await updateResume({
    id: data.resumeId,
    name: data.resumeName,
    markdown: data.markdown,
    css: data.css,
    styles: toRaw(styles)
  });

  const git = useGit();
  git.notifyActivity();
};

// Use the shortcut to save the current resume
useShortcuts("ctrl+s", save);
</script>
