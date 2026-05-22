<template>
  <EditorToolbarBox
    text="字体"
    icon="i-material-symbols:font-download-outline"
  >
    <div class="w-full hstack gap-x-2 mb-2">
      <SharedUiCombobox
        v-if="loaded"
        id="font-cjk"
        class="flex-1"
        :items="localCjk.concat(systemFonts)"
        :default-value="styles.fontCJK.fontFamily || styles.fontCJK.name"
      />
      <UiSkeleton v-else class="flex-1 h-9" />
      <span w-13>中日韩</span>
    </div>

    <div class="hstack gap-x-2 w-full">
      <SharedUiCombobox
        v-if="loaded"
        id="font-en"
        class="flex-1"
        :items="localEn.concat(systemFonts)"
        :default-value="styles.fontEN.fontFamily || styles.fontEN.name"
      />
      <UiSkeleton v-else class="flex-1 h-9" />
      <span w-13>英文</span>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import type { ComboboxItem } from "~/components/shared/ui/Combobox.vue";

const { styles } = useStyleStore();
const { execute } = useStyleHistory();
const { FONT } = useConstant();

const makeItem = (
  font: { name: string; fontFamily?: string },
  key: "fontEN" | "fontCJK"
): ComboboxItem => ({
  label: font.name,
  value: font.fontFamily || font.name,
  onSelect: () =>
    execute(key, styles[key], {
      name: font.name,
      fontFamily: font.fontFamily
    })
});

const localEn = FONT.LOCAL.EN.map((f) => makeItem(f, "fontEN"));
const localCjk = FONT.LOCAL.CJK.map((f) => makeItem(f, "fontCJK"));

const loaded = ref(false);
const systemFonts = ref<ComboboxItem[]>([]);

onMounted(async () => {
  const fonts = await fontService.querySystemFonts();
  systemFonts.value = fonts.map((f) => ({
    label: f.name,
    value: f.fontFamily || f.name,
    onSelect: () =>
      execute("fontEN", styles.fontEN, {
        name: f.name,
        fontFamily: f.fontFamily
      })
  }));
  loaded.value = true;
});
</script>
