<template>
  <div class="text-center w-[220px] mx-auto">
    <SharedUiEditable
      class="w-full mx-auto"
      :default-value="resume.name"
      submit-mode="enter"
      auto-resize
      @submit="(text) => rename(text)"
    />

    <div class="text-xs text-muted-foreground mt-1">
      {{ formatDate(resume.updated_at) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isInteger } from "@cvgen/utils";
import type { DbResume } from "~/utils/storage";

const props = defineProps<{
  resume: DbResume;
}>();

const { updateResume } = useResume();

const rename = async (text?: string) => {
  if (!text) return;

  await updateResume(
    {
      id: props.resume.id,
      name: text
    },
    false
  );
};

const formatDate = (date?: string) =>
  date &&
  isInteger(date, { allowString: true }) &&
  new Date(parseInt(date))
    .toISOString()
    .substring(0, 19)
    .replace("T", " ")
    .replaceAll("-", "/");
</script>
