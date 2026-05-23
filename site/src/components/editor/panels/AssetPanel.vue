<template>
  <div class="asset-panel space-y-4">
    <!-- Photo Upload -->
    <div>
      <div class="panel-label">头像照片</div>
      <div class="flex items-center gap-2 mt-2">
        <label
          class="cursor-pointer inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-dashed hover:bg-accent transition-colors"
          :class="hasPhoto ? 'border-green-500' : 'border-border'"
        >
          <span i-lucide:upload class="size-3.5 shrink-0" />
          <span>{{ hasPhoto ? "更换照片" : "上传照片" }}</span>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onUpload" />
        </label>
        <button
          v-if="hasPhoto"
          class="text-xs text-muted-foreground hover:text-destructive transition-colors"
          @click="onRemove"
        >
          移除
        </button>
      </div>
    </div>

    <div class="border-t border-border/50" />

    <!-- Icon Picker -->
    <div>
      <div class="panel-label">图标搜索</div>
      <div class="mt-2">
        <EditorIconPicker />
      </div>
    </div>

    <div class="border-t border-border/50" />

    <!-- Asset Manager -->
    <div>
      <div class="panel-label">资源管理</div>
      <div class="mt-2">
        <EditorAssetManager />
      </div>
    </div>
  </div>
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

<style scoped>
.panel-label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
