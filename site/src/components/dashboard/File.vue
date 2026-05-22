<template>
  <div class="flex gap-2">
    <UiButton variant="outline" size="sm" class="h-9 font-medium" @click="exportToJSON">
      <span i-lucide:download size-3.5 class="mr-1.5" />
      导出
    </UiButton>
    <UiButton variant="outline" size="sm" class="h-9 font-medium" @click="open">
      <span i-lucide:upload size-3.5 class="mr-1.5" />
      导入
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@cvgen/vue-shortcuts";
import { useFileDialog, readFile } from "@cvgen/utils";

const emits = defineEmits<{
  (e: "update"): void;
}>();

const { open, onChange } = useFileDialog(".json");
const { importFromJson, exportToJSON: doExport } = useResume();

onChange(async (file) => {
  const content = await readFile(file);
  await importFromJson(content);
  emits("update");
});

const exportToJSON = () => doExport();

useShortcuts("shift+ctrl+s", exportToJSON);
</script>
