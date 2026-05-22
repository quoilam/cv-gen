<template>
  <div class="p-3">
    <div class="flex items-center gap-2 mb-3">
      <label
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-dashed hover:bg-accent"
      >
        <span i-lucide:upload />
        上传图片
        <input type="file" accept="image/*" class="hidden" @change="onUpload" />
      </label>
    </div>

    <div v-if="assets.length === 0" class="text-sm text-muted-foreground text-center py-4">
      暂无图片
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="asset in assets"
        :key="asset.id"
        class="group relative border rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
        @click="insert(asset)"
      >
        <img :src="asset.base64" :alt="asset.name" class="w-full h-20 object-cover" />
        <div class="p-1 text-xs truncate">{{ asset.name }}</div>
        <button
          class="absolute top-0.5 right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground flex-center opacity-0 group-hover:opacity-100"
          @click.stop="remove(asset.id)"
        >
          <span i-lucide:x class="size-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAsset, type AssetInfo } from "~/composables/asset";

const { uploadImage, getAssets, deleteAsset, insertImageRef } = useAsset();
const assets = ref<AssetInfo[]>([]);

onMounted(async () => {
  assets.value = await getAssets();
});

const onUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const asset = await uploadImage(file);
  assets.value.push(asset);
};

const remove = async (id: string) => {
  await deleteAsset(id);
  assets.value = assets.value.filter((a) => a.id !== id);
};

const insert = (asset: AssetInfo) => {
  insertImageRef(asset);
};
</script>
