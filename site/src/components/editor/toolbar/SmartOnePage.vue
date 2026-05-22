<template>
  <EditorToolbarBox text="✨ 智能一页" icon="i-lucide:sparkles">
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
      class="w-full mb-3"
      @click="handleFit"
    >
      <span i-lucide:sparkles mr-1 />
      {{ status === 'fitting' ? '调整中...' : '自动调整' }}
    </UiButton>

    <UiSeparator class="mb-3" />

    <!-- Sliders -->
    <div class="flex flex-col gap-y-1">
      <SliderRow
        v-for="slider in sliders"
        :key="slider.key"
        :icon="slider.icon"
        :label="slider.label"
        :unit="slider.unit"
        :min="slider.min"
        :max="slider.max"
        :step="slider.step"
        :model-value="store.styles[slider.key] as number"
        :recommended="slider.recValue"
        :show-rec="hasRecommendation"
        @change="(v: number) => onSliderChange(slider.key, v)"
      />
    </div>

    <!-- Reset -->
    <div mt-3 text-right>
      <UiButton
        v-if="hasRecommendation"
        variant="ghost-secondary"
        size="sm"
        @click="handleReset"
      >
        ↩ 恢复推荐值
      </UiButton>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import { useSmartOnePage } from "~/composables/useSmartOnePage";
import SliderRow from "./SmartOnePageRow.vue";

const store = useStyleStore();
const { execute } = useStyleHistory();
const {
  pageCount,
  overflowPercent,
  status,
  hasRecommendation,
  fitToOnePage,
  resetToRecommended,
  BOUNDS
} = useSmartOnePage("preview");

const sliders = computed(() => [
  {
    key: "fontSize" as const,
    icon: "i-ri:font-size-2",
    label: "字号",
    unit: "px",
    min: BOUNDS.fontSize.min,
    max: BOUNDS.fontSize.max,
    step: 0.5,
    recValue: store.recommended.fontSize
  },
  {
    key: "lineHeight" as const,
    icon: "i-ic:round-format-line-spacing",
    label: "行间距",
    min: BOUNDS.lineHeight.min,
    max: BOUNDS.lineHeight.max,
    step: 0.05,
    recValue: store.recommended.lineHeight
  },
  {
    key: "marginV" as const,
    icon: "i-icon-park-outline:margin-one",
    label: "上下边距",
    unit: "px",
    min: BOUNDS.marginV.min,
    max: BOUNDS.marginV.max,
    step: 1,
    recValue: store.recommended.marginV
  },
  {
    key: "marginH" as const,
    icon: "i-icon-park-outline:margin",
    label: "左右边距",
    unit: "px",
    min: BOUNDS.marginH.min,
    max: BOUNDS.marginH.max,
    step: 1,
    recValue: store.recommended.marginH
  }
]);

async function handleFit() {
  await fitToOnePage();
}

function handleReset() {
  resetToRecommended();
}

function onSliderChange(key: string, value: number) {
  const k = key as keyof typeof store.styles;
  execute(k, store.styles[k], value);
}
</script>
