<template>
  <UiTooltipProvider :delay-duration="0">
    <UiTooltip>
      <UiTooltipTrigger as-child>
        <UiButton
          class="gap-x-1.5 w-full h-8 justify-start"
          variant="ghost"
          size="sm"
          @click="doExport('pdf')"
        >
          <span i-mdi:file-pdf text-base />
          {{ $t("toolbar.file.export_pdf.title") }}
        </UiButton>
      </UiTooltipTrigger>
      <UiTooltipContent side="bottom" class="w-54 p-0 rounded border-destructive/60">
        <UiAlert variant="destructive" class="border-none rounded-none">
          <UiAlertTitle>
            {{ $t("toolbar.file.export_pdf.alert.title") }}
            <span class="text-foreground font-normal text-xs">
              (<SharedIssueLink issue="13" />, <SharedIssueLink issue="16" />)
            </span>
          </UiAlertTitle>
          <UiAlertDescription v-html="$t('toolbar.file.export_pdf.alert.content')" />
        </UiAlert>
      </UiTooltipContent>
    </UiTooltip>
  </UiTooltipProvider>

  <UiButton
    class="gap-x-1.5 w-full h-8 justify-start"
    variant="ghost"
    size="sm"
    @click="doExport('html')"
  >
    <span i-mdi:language-html5 text-base />
    {{ $t("toolbar.file.export_html") }}
  </UiButton>

  <UiButton
    class="gap-x-1.5 w-full h-8 justify-start"
    variant="ghost"
    size="sm"
    @click="doExport('docx')"
  >
    <span i-mdi:file-word text-base />
    {{ $t("toolbar.file.export_docx") }}
  </UiButton>

  <UiButton
    class="gap-x-1.5 w-full h-8 justify-start"
    variant="ghost"
    size="sm"
    @click="doExport('md')"
  >
    <span i-ri:markdown-fill text-base />
    {{ $t("toolbar.file.export_md") }}
  </UiButton>
</template>

<script lang="ts" setup>
import { exportService } from "~/utils/export";
import { registerExportHandlers } from "~/utils/export/handlers";
import type { ExportContext } from "~/utils/export";

registerExportHandlers();

const { data } = useDataStore();
const { styles } = useStyleStore();
const saveName = computed(() => data.resumeName.trim().replace(/\s+/g, "_"));

const ctx = computed<ExportContext>(() => ({
  markdown: data.markdown,
  css: data.css,
  styles: toRaw(styles),
  name: saveName.value,
  html: markdownService.renderResume(data.markdown)
}));

const doExport = (format: string) => {
  exportService.export(format, ctx.value);
};
</script>
