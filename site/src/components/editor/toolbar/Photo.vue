<template>
  <EditorToolbarBox text="Photo" icon="i-lucide:user-round">
    <div class="flex items-center gap-2">
      <label
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-dashed hover:bg-accent"
        :class="hasPhoto ? 'border-green-500' : ''"
      >
        <span i-lucide:upload />
        {{ hasPhoto ? "Change Photo" : "Upload Photo" }}
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onUpload" />
      </label>
      <button
        v-if="hasPhoto"
        class="text-xs text-muted-foreground hover:text-destructive"
        @click="onRemove"
      >
        Remove
      </button>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import { usePhoto } from "~/composables/photo";

const { photo, init, uploadPhoto, removePhoto } = usePhoto();
const hasPhoto = computed(() => photo.value !== null);

onMounted(() => init());

const fileInput = ref<HTMLInputElement>();

const onUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await uploadPhoto(file);
  } finally {
    input.value = "";
  }
};

const onRemove = async () => {
  await removePhoto();
};
</script>
