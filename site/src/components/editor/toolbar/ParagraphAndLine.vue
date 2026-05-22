<template>
  <EditorToolbarBox text="段落与行距" icon="i-ic:round-format-line-spacing">
    <div hstack text-muted-foreground gap-x-1 justify-end>
      <span i-ic:round-format-line-spacing />
      行间距
    </div>

    <SharedUiSlider
      :model-value="lineHeightModel"
      :min="1"
      :max="2"
      :step="0.05"
      @update:model-value="
        (value) => {
          lineHeightModel = value!;
          execute('lineHeight', styles.lineHeight, value!.at(0)!);
        }
      "
    />

    <div mt-4 hstack text-muted-foreground gap-x-1 justify-end>
      <span i-icon-park-outline:paragraph-break-two />
      段间距
    </div>

    <SharedUiSlider
      unit="px"
      :model-value="paragraphSpaceModel"
      :max="50"
      @update:model-value="
        (value) => {
          paragraphSpaceModel = value!;
          execute('paragraphSpace', styles.paragraphSpace, value!.at(0)!);
        }
      "
    />
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
const { styles } = useStyleStore();
const { execute } = useStyleHistory();

const lineHeightModel = ref([styles.lineHeight]);
const paragraphSpaceModel = ref([styles.paragraphSpace]);
</script>
