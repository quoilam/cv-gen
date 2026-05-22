<template>
  <div class="p-3">
    <input
      v-model="keyword"
      type="text"
      class="w-full text-sm border rounded px-2 py-1.5 bg-background"
      placeholder="搜索图标..."
      @input="onSearch"
    />

    <div v-if="loading" class="text-center py-4 text-sm text-muted-foreground">
      <span i-lucide:loader-2 class="animate-spin" />
    </div>

    <div v-if="error" class="text-xs text-destructive mt-2">{{ error }}</div>

    <div class="grid grid-cols-5 gap-2 mt-3">
      <button
        v-for="icon in results"
        :key="icon.name"
        class="flex-center size-10 rounded border hover:bg-accent hover:border-primary"
        :title="icon.name"
        @click="insert(icon)"
      >
        <img :src="icon.url" :alt="icon.name" class="size-5" />
      </button>
    </div>

    <div v-if="!loading && keyword && results.length === 0" class="text-sm text-muted-foreground text-center py-4">
      未找到图标
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useIcon, type IconResult } from "~/composables/icon";

const { search, insertIcon, loading, results, error } = useIcon();
const keyword = ref("");

let _timer: ReturnType<typeof setTimeout>;

const onSearch = () => {
  clearTimeout(_timer);
  _timer = setTimeout(() => {
    search(keyword.value);
  }, 300);
};

const insert = (icon: IconResult) => {
  insertIcon(icon);
};
</script>
