<template>
  <EditorToolbarBox text="纸张尺寸" icon="i-majesticons:paper-fold-line">
    <SharedUiCombobox
      id="paper-size"
      class="capitalize"
      :items="items"
      :default-value="styles.paper"
    />
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import type { ValidPaperSize } from "~/composables/constant";

const { styles } = useStyleStore();
const { execute } = useStyleHistory();
const { PAPER } = useConstant();

const items = Object.keys(PAPER.SIZES).map((paper) => ({
  label: paper,
  value: paper,
  onSelect: () => execute("paper", styles.paper, paper as ValidPaperSize)
}));
</script>
