<template>
  <div class="flex flex-wrap items-center gap-2">
    <UiButton variant="outline" size="sm" class="h-9 font-medium" @click="exportToJSON">
      <span i-lucide:download size-3.5 class="mr-1.5" />
      导出
    </UiButton>
    <UiButton variant="outline" size="sm" class="h-9 font-medium" @click="open">
      <span i-lucide:upload size-3.5 class="mr-1.5" />
      导入
    </UiButton>
    <UiButton
      variant="outline"
      size="sm"
      class="h-9 font-medium"
      :disabled="backupReady"
      @click="setupBackup"
    >
      <span i-lucide:folder-sync size-3.5 class="mr-1.5" />
      {{ backupReady ? "本地备份已开启" : "开启本地备份" }}
    </UiButton>
    <UiButton
      v-if="backupReady"
      variant="outline"
      size="sm"
      class="h-9 font-medium"
      @click="restore"
    >
      <span i-lucide:rotate-ccw size-3.5 class="mr-1.5" />
      从备份恢复
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@cvgen/vue-shortcuts";
import { useFileDialog, readFile } from "@cvgen/utils";
import { useStorageBackup } from "~/composables/useStorageBackup";

const emits = defineEmits<{
  (e: "update"): void;
}>();

const { open, onChange } = useFileDialog(".json");
const { importFromJson, exportToJSON: doExport } = useResume();
const backup = useStorageBackup();
const { backupReady } = backup;
const toast = useToast();

const setupBackup = async () => {
  const ok = await backup.setupBackupDirectory();
  if (ok) {
    await backup.syncBackup();
    toast.success("本地备份已开启，每次保存后自动同步");
  } else {
    toast.error("无法授权备份目录");
  }
};

const restore = async () => {
  const ok = await backup.restoreFromBackup();
  if (ok) {
    toast.success("已从备份恢复");
    emits("update");
  } else {
    toast.error("恢复失败，请检查备份文件");
  }
};

onChange(async (file) => {
  const content = await readFile(file);
  await importFromJson(content);
  emits("update");
});

const exportToJSON = () => doExport();

useShortcuts("shift+ctrl+s", exportToJSON);
</script>
