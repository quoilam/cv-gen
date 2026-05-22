<template>
  <EditorToolbarBox text="智能一页" icon="i-carbon:shrink-screen">
    <!-- Status -->
    <div text="sm muted-foreground" mb-3>
      <template v-if="status === 'fitting'">
        <span i-svg-spinners:3-dots-fade inline-block mr-1 />
        填充 {{ fillPercent }}%，计算中...
      </template>
      <template v-else-if="status === 'success'">已占满 1 页 ✅</template>
      <template v-else-if="status === 'warn' && fillRatio < 1">
        已达膨胀极限，填充 {{ fillPercent }}%
      </template>
      <template v-else-if="status === 'warn' && fillRatio > 1">
        已达压缩极限，溢出 {{ overflowPercent }}%
      </template>
      <template v-else>
        当前填充 {{ fillPercent }}%
        <span v-if="fillRatio > 1"> · 溢出约 {{ overflowPercent }}%</span>
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
      {{ status === "fitting" ? "调整中..." : "自动调整" }}
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
import { toast } from "vue-sonner";

const {
  fillRatio,
  status,
  hasRecommendation,
  fitToOnePage,
  resetToRecommended
} = useSmartOnePage("preview");

const fillPercent = computed(() => Math.round(Math.min(fillRatio.value, 1) * 100));
const overflowPercent = computed(() => Math.round((fillRatio.value - 1) * 100));

async function handleFit() {
  await fitToOnePage();
  if (status.value === "warn") {
    if (fillRatio.value < 1) {
      toast.error("内容不足以填满一页，已达膨胀极限，建议增加简历内容");
    } else {
      toast.error("内容超出页面较多，已达压缩极限，建议精简简历内容");
    }
  }
}

function handleReset() {
  resetToRecommended();
}
</script>
