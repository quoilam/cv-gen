<template>
  <div class="icon-panel space-y-3">
    <div>
      <div class="panel-label">图标搜索（Iconify）</div>
      <UiInput
        v-model="query"
        placeholder="搜索图标，如 go / redis / database"
        class="mt-2"
      />
    </div>

    <div
      v-if="loading"
      class="flex items-center justify-center py-8 text-xs text-muted-foreground"
    >
      搜索中…
    </div>

    <div v-else-if="icons.length" class="grid grid-cols-4 gap-2">
      <button
        v-for="name in icons"
        :key="name"
        class="group flex flex-col items-center gap-1 rounded border border-border p-2 hover:border-primary/60 hover:bg-accent transition-colors"
        :title="name"
        @click="onInsert(name)"
      >
        <img :src="iconSrc(name)" :alt="shortName(name)" class="size-6" loading="lazy" />
        <span
          class="w-full truncate text-center text-[10px] leading-none text-muted-foreground group-hover:text-foreground"
        >
          {{ shortName(name) }}
        </span>
      </button>
    </div>

    <p v-else-if="query.trim()" class="py-8 text-center text-xs text-muted-foreground">
      无匹配图标
    </p>
    <p v-else class="py-8 text-center text-xs text-muted-foreground">
      输入关键词搜索图标，点击插入
    </p>

    <p class="text-xs leading-relaxed text-muted-foreground">
      技术栈示例：<code>[:vscode-icons:file-type-go] Golang</code>、
      <code>[:devicon:redis] Redis</code>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { toast } from "vue-sonner";

const API_BASE = "https://api.iconify.design";

const query = ref("");
const icons = ref<string[]>([]);
const loading = ref(false);

const colorMode = useColorMode();
const iconColor = computed(() => (colorMode.value === "dark" ? "ffffff" : "1f2937"));

const iconSrc = (name: string) => `${API_BASE}/${name}.svg?color=%23${iconColor.value}`;
const shortName = (name: string) => name.split(":").slice(-1)[0] ?? name;

const { insertText } = useMonaco();

const search = async (keyword: string) => {
  if (!keyword.trim()) {
    icons.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(
      `${API_BASE}/search?query=${encodeURIComponent(keyword)}&limit=48`
    );
    if (!res.ok) throw new Error(`Iconify search failed: ${res.status}`);
    const data = (await res.json()) as { icons?: string[] };
    icons.value = data.icons ?? [];
  } catch (error) {
    console.error("Failed to search icons:", error);
    toast.error("图标搜索失败，请检查网络");
    icons.value = [];
  } finally {
    loading.value = false;
  }
};

watchDebounced(query, (value) => search(value), { debounce: 300 });

const onInsert = (name: string) => {
  insertText(`[:${name}] `);
  toast.success("已插入图标");
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
