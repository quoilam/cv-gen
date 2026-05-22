<template>
  <UiDialog>
    <UiDialogTrigger as-child>
      <UiButton class="gap-x-1.5 w-full h-8 justify-start" variant="ghost" size="sm">
        <span i-mdi:upload text-base />
        导入 Markdown
      </UiButton>
    </UiDialogTrigger>

    <UiDialogContent class="sm:max-w-110">
      <UiDialogHeader>
        <UiDialogTitle>上传一个 Markdown 文件</UiDialogTitle>
      </UiDialogHeader>

      <div class="pt-2 space-y-6 text-sm">
        <div v-bind="api.getRootProps()">
          <div
            v-bind="api.getDropzoneProps()"
            class="py-14 cursor-pointer hover:(bg-accent text-accent-foreground)"
            border="~ dashed rounded"
          >
            <input v-bind="api.getHiddenInputProps()" />
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
            <span class="sr-only">Submit</span>
            <span i-line-md:confirm size-4 />
          </UiButton>
        </div>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
import * as fileUpload from "@zag-js/file-upload";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { fetchFile } from "@cvgen/utils";

const { setAndSyncToMonaco } = useDataStore();

// Zag.js file component
const localFile = ref<string | null>(null);

const [state, send] = useMachine(
  fileUpload.machine({
    id: "import-dialog",
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
const api = computed(() => fileUpload.connect(state.value, send, normalizeProps));

// Fetched file from pasted URL
const pastedURL = ref("");

const uploadFileFromURL = async () => {
  if (pastedURL.value.trim() === "") return;

  try {
    const content = await fetchFile(pastedURL.value);
    setAndSyncToMonaco("markdown", content);

    localFile.value = null;
    pastedURL.value = "";
  } catch (error) {
    const toast = useToast();
    toast.error("import_fetch");
    console.error(error);
  }
};
</script>
