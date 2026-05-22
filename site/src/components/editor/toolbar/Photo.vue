<template>
  <EditorToolbarBox text="Photo" icon="i-lucide:user-round">
    <div class="flex items-center gap-2">
      <label
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-dashed hover:bg-accent"
        :class="hasPhoto ? 'border-green-500' : ''"
      >
        <span i-lucide:upload />
        {{ hasPhoto ? "Change Photo" : "Upload Photo" }}
        <input type="file" accept="image/*" class="hidden" @change="onUpload" />
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

const onUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await uploadPhoto(file);
};

const onRemove = async () => {
  await removePhoto();
};
</script>
