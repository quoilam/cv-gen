<template>
  <div class="file-panel space-y-1.5">
    <!-- Save -->
    <button class="panel-btn" @click="handleSave">
      <span i-ic:baseline-save class="size-4 shrink-0" />
      <span>保存</span>
      <span class="ml-auto text-xs text-muted-foreground tracking-widest">
        上次保存: {{ lastSavedText }}
      </span>
    </button>

    <div class="border-t border-border/50 my-2" />

    <!-- Export -->
    <button class="panel-btn" @click="doExport('pdf')">
      <span i-mdi:file-pdf class="size-4 shrink-0" />
      <span>导出 PDF</span>
    </button>
    <button class="panel-btn" @click="doExport('docx')">
      <span i-mdi:file-word class="size-4 shrink-0" />
      <span>导出 DOCX</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { exportService } from "~/utils/export";
import { registerExportHandlers } from "~/utils/export/handlers";
import type { ExportContext } from "~/utils/export";
registerExportHandlers();

const { data, setData } = useDataStore();
const { styles } = useStyleStore();
const { updateResume } = useResume();
const { frontMatter: toastFrontMatter } = useToast();

const lastSavedText = computed(() => {
  if (!data.lastSavedAt) return "未保存";
  return formatTime(new Date(data.lastSavedAt));
});

// Save
const handleSave = async () => {
  if (!data.resumeId) return;
  const updated = await updateResume({
    id: data.resumeId,
    name: data.resumeName,
    markdown: data.markdown,
    styles: toRaw(styles)
  });
  if (updated) setData("lastSavedAt", Date.now());
};

// Export
const saveName = computed(() => data.resumeName.trim().replace(/\s+/g, "_"));
const doExport = async (format: string) => {
  const html = await markdownService.renderResume(data.markdown, (err) => {
    if (err) toastFrontMatter(err);
  });
  const ctx: ExportContext = {
    markdown: data.markdown,
    styles: toRaw(styles),
    name: saveName.value,
    html
  };
  exportService.export(format, ctx);
};

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
</script>

<style scoped>
.panel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--foreground));
  font-size: 13px;
  cursor: pointer;
  transition: background 100ms;
}
.panel-btn:hover {
  background: hsl(var(--muted));
}
</style>
