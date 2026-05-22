<template>
  <div class="rounded-md bg-secondary/50 px-3 py-2">
    <!-- Label row -->
    <div flex justify-between items-center mb-1>
      <div flex items-center gap-x-1 text-xs text-muted-foreground>
        <span v-if="icon" :class="icon" />
        <span>{{ label }}</span>
      </div>
      <div flex items-center gap-x-2>
        <span
          v-if="showRec && recommended != null"
          text="xs white"
          bg-purple-500 px-1.5 py-0.5 rounded
        >
          ⭐ {{ fmt(recommended) }}
        </span>
        <span text="xs" font-600 min-w-9 text-right>
          {{ fmt(modelValue) }}{{ unit }}
        </span>
      </div>
    </div>

    <!-- Slider with recommendation marker -->
    <div class="relative">
      <SharedUiSlider
        :model-value="[modelValue]"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        class="[&>[data-orientation=horizontal]]:py-2"
        @update:model-value="(vals) => { if (vals) emit('change', vals[0]) }"
      />
      <div
        v-if="showRec && recommended != null"
        class="absolute pointer-events-none"
        style="top: 5px; transform: translateX(-50%)"
        :style="{ left: `${((recommended - min) / (max - min)) * 100}%` }"
      >
        <div class="mx-auto w-px h-3 bg-purple-400" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  icon?: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  modelValue: number;
  recommended?: number;
  showRec: boolean;
}>();

const emit = defineEmits<{
  change: [value: number];
}>();

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
</script>
