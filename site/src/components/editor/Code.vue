<template>
  <div class="pane-container overflow-hidden bg-background" flex="~ col">
    <div ref="editor" flex-1 />
  </div>
</template>

<script lang="ts" setup>
const editor = ref<HTMLDivElement>();
const { setup, dispose } = useMonaco();

onMounted(async () => {
  await setup(editor.value);
});

onBeforeUnmount(dispose);
</script>
