<template>
  <EditorToolbarBox
    :text="$t('toolbar.line_height')"
    icon="i-ic:round-format-line-spacing"
  >
    <SharedUiSlider
      :model-value="modelValue"
      :min="1"
      :max="2"
      :step="0.05"
      @update:model-value="
        (value) => {
          modelValue = value!;
          execute('lineHeight', styles.lineHeight, value!.at(0)!);
        }
      "
    />
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
const { styles } = useStyleStore();
const { execute } = useStyleHistory();

const modelValue = ref([styles.lineHeight]);
</script>
