<template>
  <EditorToolbarBox text="智能一页" icon="i-carbon:shrink-screen">
    <!-- Status -->
    <div text="sm muted-foreground" mb-3>
      <template v-if="status === 'fitting'">
        <span i-svg-spinners:3-dots-fade inline-block mr-1 />
        计算中...
      </template>
      <template v-else-if="status === 'success' && pageCount <= 1">
        当前 <b text-emerald-600>1 页 ✅</b>
      </template>
      <template v-else-if="status === 'warn'">
        当前 <b text-amber-500>{{ pageCount }} 页</b>
        · 已至压缩极限
      </template>
      <template v-else>
        当前
        <b :class="pageCount > 1 ? 'text-red-400' : ''">{{ pageCount }} 页</b>
        <span v-if="overflowPercent > 0"> · 溢出约 {{ overflowPercent }}%</span>
      </template>
    </div>

    <!-- Auto-fit button -->
    <UiButton
      :disabled="status === 'fitting'"
      variant="secondary"
      class="w-full mb-2"
      @click="handleFit"
    >
      <span i-carbon:shrink-screen mr-1 />
      {{ status === 'fitting' ? '调整中...' : '自动调整' }}
    </UiButton>

    <!-- Reset to recommended -->
    <div v-if="hasRecommendation" text-right>
      <UiButton variant="ghost-secondary" size="sm" @click="handleReset">
        ↩ 恢复推荐值
      </UiButton>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import { useSmartOnePage } from "~/composables/useSmartOnePage";

const {
  pageCount,
  overflowPercent,
  status,
  hasRecommendation,
  fitToOnePage,
  resetToRecommended
} = useSmartOnePage("preview");

async function handleFit() {
  await fitToOnePage();
}

function handleReset() {
  resetToRecommended();
}
</script>
