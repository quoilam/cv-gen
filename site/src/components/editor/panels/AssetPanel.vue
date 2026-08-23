<template>
  <div class="asset-panel space-y-4">
    <div>
      <div class="panel-label">头像照片</div>
      <div class="flex items-center gap-2 mt-2">
        <label
          class="cursor-pointer inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-dashed hover:bg-accent transition-colors"
          :class="hasPhoto ? 'border-green-500' : 'border-border'"
        >
          <span i-lucide:upload class="size-3.5 shrink-0" />
          <span>{{ hasPhoto ? "更换照片" : "上传照片" }}</span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onUpload"
          />
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

    <div>
      <div class="panel-label">经历条图标</div>
      <div class="flex items-center gap-2 mt-2">
        <label
          class="cursor-pointer inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-dashed hover:bg-accent transition-colors border-border"
        >
          <span i-lucide:upload class="size-3.5 shrink-0" />
          <span>上传图标</span>
          <input
            ref="iconInput"
            type="file"
            accept="image/*,.ico"
            class="hidden"
            @change="onIconUpload"
          />
        </label>
      </div>
      <div v-if="icons.length" class="flex flex-wrap gap-2 mt-2">
        <div v-for="icon in icons" :key="icon.id" class="group relative">
          <img
            :src="icon.url"
            class="size-10 object-contain rounded border border-border cursor-pointer"
            @click="onIconClick(icon.url)"
          />
          <button
            class="absolute -top-1 -right-1 hidden group-hover:block size-4 rounded-full bg-destructive text-white text-[10px] leading-none"
            @click.stop="onIconRemove(icon.id)"
          >
            ×
          </button>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mt-1">
        点击图标复制引用，在 markdown 中用 <code>**![](data:...)公司名**</code> 或外链
        <code>**![](https://...)公司名**</code>。
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePhoto } from "~/composables/photo";
import { useBadgeIcon } from "~/composables/badge-icon";
import { toast } from "vue-sonner";

const { photo, init, uploadPhoto, removePhoto } = usePhoto();
const hasPhoto = computed(() => photo.value !== null);

const {
  icons,
  init: initIcons,
  upload: uploadIcon,
  remove: removeIcon,
  insert
} = useBadgeIcon();
const iconInput = ref<HTMLInputElement>();

onMounted(() => {
  init();
  initIcons();
});

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

const onIconUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await uploadIcon(file);
  } finally {
    input.value = "";
  }
};

const onIconRemove = (id: string) => removeIcon(id);

const onIconClick = async (url: string) => {
  try {
    await navigator.clipboard.writeText(insert(url));
    toast.success("已复制图标引用");
  } catch {
    // 剪贴板不可用时静默忽略
  }
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
