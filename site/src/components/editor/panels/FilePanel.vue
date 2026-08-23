<template>
  <div class="file-panel space-y-1.5">
    <!-- Save -->
    <button class="panel-btn" @click="handleSave">
      <span i-ic:baseline-save class="size-4 shrink-0" />
      <span>保存</span>
      <span class="ml-auto text-xs text-muted-foreground tracking-widest">⌘S</span>
    </button>

    <!-- Rename -->
    <div class="hstack gap-x-1.5 px-2 h-8">
      <span i-material-symbols:edit-square-outline-rounded class="size-4 shrink-0" />
      <span class="text-sm">重命名</span>
    </div>
    <SharedUiEditable
      class="text-sm ml-8"
      :default-value="data.resumeName"
      submit-mode="enter"
      auto-resize
      @submit="(text: string) => handleRename(text)"
    />

    <div class="border-t border-border/50 my-2" />

    <!-- Export -->
    <button class="panel-btn" @click="doExport('pdf')">
      <span i-mdi:file-pdf class="size-4 shrink-0" />
      <span>导出 PDF</span>
    </button>
    <button class="panel-btn" @click="doExport('html')">
      <span i-mdi:language-html5 class="size-4 shrink-0" />
      <span>导出 HTML</span>
    </button>
    <button class="panel-btn" @click="doExport('docx')">
      <span i-mdi:file-word class="size-4 shrink-0" />
      <span>导出 DOCX</span>
    </button>
    <button class="panel-btn" @click="doExport('md')">
      <span i-ri:markdown-fill class="size-4 shrink-0" />
      <span>导出 Markdown</span>
    </button>

    <div class="border-t border-border/50 my-2" />

    <!-- Import Dialog -->
    <UiDialog>
      <UiDialogTrigger as-child>
        <button class="panel-btn">
          <span i-mdi:upload class="size-4 shrink-0" />
          <span>导入 Markdown</span>
        </button>
      </UiDialogTrigger>
      <UiDialogContent class="sm:max-w-110">
        <UiDialogHeader>
          <UiDialogTitle>上传 Markdown 文件</UiDialogTitle>
        </UiDialogHeader>
        <div class="pt-2 space-y-6 text-sm">
          <div v-bind="importApi.getRootProps()">
            <div
              v-bind="importApi.getDropzoneProps()"
              class="py-14 cursor-pointer hover:(bg-accent text-accent-foreground)"
              border="~ dashed rounded"
            >
              <input v-bind="importApi.getHiddenInputProps()" />
              <div text-center>将文件拖拽至这里，或点击这里以选择文件</div>
            </div>
            <div v-if="localFile" class="bg-muted text-muted-foreground rounded p-2 mt-2">
              {{ localFile }}
            </div>
          </div>
          <div hstack>
            <UiSeparator flex-1 bg="primary/40" />
            <div px-5 text-primary>OR</div>
            <UiSeparator flex-1 bg="primary/40" />
          </div>
          <div class="flex gap-x-2">
            <UiInput
              v-model="pastedURL"
              placeholder="粘贴文件 URL"
              @keyup.enter="uploadFileFromURL"
            />
            <UiButton
              type="submit"
              size="icon"
              class="shrink-0"
              @click="uploadFileFromURL"
              :disabled="pastedURL === ''"
            >
              <span i-line-md:confirm class="size-4" />
            </UiButton>
          </div>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script lang="ts" setup>
import * as fileUpload from "@zag-js/file-upload";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { fetchFile } from "@cvgen/utils";
import { exportService } from "~/utils/export";
import { registerExportHandlers } from "~/utils/export/handlers";
import type { ExportContext } from "~/utils/export";
registerExportHandlers();

const { data, setAndSyncToMonaco } = useDataStore();
const { styles } = useStyleStore();
const { updateResume } = useResume();
const { frontMatter: toastFrontMatter } = useToast();

// Save
const handleSave = async () => {
  if (!data.resumeId) return;
  await updateResume({
    id: data.resumeId,
    name: data.resumeName,
    markdown: data.markdown,
    styles: toRaw(styles)
  });
};

// Rename
const handleRename = async (text?: string) => {
  if (!text || !data.resumeId) return;
  data.resumeName = text;
  await updateResume({ id: data.resumeId, name: text }, false);
};

// Export
const saveName = computed(() => data.resumeName.trim().replace(/\s+/g, "_"));
const ctx = computed<ExportContext>(() => ({
  markdown: data.markdown,
  styles: toRaw(styles),
  name: saveName.value,
  html: markdownService.renderResume(data.markdown, (err) => {
    if (err) toastFrontMatter(err);
  })
}));
const doExport = (format: string) => {
  exportService.export(format, ctx.value);
};

// Import
const localFile = ref<string | null>(null);
const pastedURL = ref("");

const [state, send] = useMachine(
  fileUpload.machine({
    id: "import-dialog-floating",
    accept: ".md",
    onFileAccept: ({ files }) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const content = reader.result as string;
        setAndSyncToMonaco("markdown", content);
      };
      reader.readAsText(files[0]);
      localFile.value = files[0].name;
      pastedURL.value = "";
    }
  })
);
const importApi = computed(() => fileUpload.connect(state.value, send, normalizeProps));

const uploadFileFromURL = async () => {
  if (pastedURL.value.trim() === "") return;
  try {
    const content = await fetchFile(pastedURL.value);
    setAndSyncToMonaco("markdown", content);
    localFile.value = null;
    pastedURL.value = "";
  } catch (error) {
    console.error(error);
  }
};
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
