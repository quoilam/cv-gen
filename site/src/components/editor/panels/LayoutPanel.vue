<template>
  <div class="layout-panel space-y-4">
    <!-- Margins -->
    <div>
      <div class="panel-label">页边距</div>
      <div class="mt-2 space-y-2">
        <div class="flex items-center gap-x-2">
          <span class="text-xs text-muted-foreground w-8 shrink-0">上下</span>
          <SharedUiSlider
            unit="px"
            :model-value="marginVValue"
            :min="0"
            :max="30"
            @update:model-value="
              (v) => {
                marginVValue = v!;
                execute('marginV', styles.marginV, v!.at(0)!);
              }
            "
          />
          <span class="text-xs text-muted-foreground w-10 shrink-0 text-right"
            >{{ styles.marginV }}px</span
          >
        </div>
        <div class="flex items-center gap-x-2">
          <span class="text-xs text-muted-foreground w-8 shrink-0">左右</span>
          <SharedUiSlider
            unit="px"
            :model-value="marginHValue"
            :min="0"
            :max="50"
            @update:model-value="
              (v) => {
                marginHValue = v!;
                execute('marginH', styles.marginH, v!.at(0)!);
              }
            "
          />
          <span class="text-xs text-muted-foreground w-10 shrink-0 text-right"
            >{{ styles.marginH }}px</span
          >
        </div>
      </div>
    </div>

    <div class="border-t border-border/50" />

    <!-- Paragraph & Line Spacing -->
    <div>
      <div class="panel-label">段落与行距</div>
      <div class="mt-2 space-y-2">
        <div class="flex items-center gap-x-2">
          <span class="text-xs text-muted-foreground w-8 shrink-0">行距</span>
          <SharedUiSlider
            :model-value="lineHeightValue"
            :min="1"
            :max="1.5"
            :step="0.01"
            @update:model-value="
              (v) => {
                lineHeightValue = v!;
                execute('lineHeight', styles.lineHeight, v!.at(0)!);
              }
            "
          />
          <span class="text-xs text-muted-foreground w-10 shrink-0 text-right">{{
            styles.lineHeight
          }}</span>
        </div>
        <div class="flex items-center gap-x-2">
          <span class="text-xs text-muted-foreground w-8 shrink-0">段距</span>
          <SharedUiSlider
            unit="px"
            :model-value="paragraphSpaceValue"
            :min="-5"
            :max="10"
            @update:model-value="
              (v) => {
                paragraphSpaceValue = v!;
                execute('paragraphSpace', styles.paragraphSpace, v!.at(0)!);
              }
            "
          />
          <span class="text-xs text-muted-foreground w-10 shrink-0 text-right"
            >{{ styles.paragraphSpace }}px</span
          >
        </div>
      </div>
    </div>

    <div class="border-t border-border/50" />

    <!-- First heading upward overlap -->
    <div>
      <div class="panel-label">
        标题上移
        <span class="text-xs text-muted-foreground ml-1"
          >{{ styles.firstHeadingOverlap }}px</span
        >
      </div>
      <div class="mt-2">
        <SharedUiSlider
          unit="px"
          :model-value="firstHeadingOverlapValue"
          :min="0"
          :max="60"
          @update:model-value="
            (v) => {
              firstHeadingOverlapValue = v!;
              execute('firstHeadingOverlap', styles.firstHeadingOverlap, v!.at(0)!);
            }
          "
        />
      </div>
    </div>

    <div class="border-t border-border/50" />

    <!-- Banner height -->
    <div>
      <div class="panel-label">
        Banner 行高
        <span class="text-xs text-muted-foreground ml-1">{{ styles.badgeHeight }}px</span>
      </div>
      <div class="mt-2">
        <SharedUiSlider
          unit="px"
          :model-value="badgeHeightValue"
          :min="0"
          :max="8"
          :step="0.5"
          @update:model-value="
            (v) => {
              badgeHeightValue = v!;
              execute('badgeHeight', styles.badgeHeight, v!.at(0)!);
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { styles } = useStyleStore();
const { execute } = useStyleHistory();

// Slider refs (double-model pattern matches existing toolbar components)
const marginVValue = ref([styles.marginV]);
const marginHValue = ref([styles.marginH]);
const lineHeightValue = ref([styles.lineHeight]);
const paragraphSpaceValue = ref([styles.paragraphSpace]);
const firstHeadingOverlapValue = ref([styles.firstHeadingOverlap]);
const badgeHeightValue = ref([styles.badgeHeight]);
</script>

<style scoped>
.panel-label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--foreground));
  font-size: 12px;
  cursor: pointer;
  transition: background 100ms;
}

.panel-action-btn:hover:not(:disabled) {
  background: hsl(var(--muted));
}

.panel-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
