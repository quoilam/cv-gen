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
        :items="localCjk.concat(systemCjkFonts)"
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
        :items="localEn.concat(systemEnFonts)"
        :default-value="styles.fontEN.fontFamily || styles.fontEN.name"
      />
      <UiSkeleton v-else class="flex-1 h-9" />
      <span w-13>英文</span>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import type { ComboboxItem } from "~/components/shared/ui/Combobox.vue";
import { isCJKFont } from "~/utils/font";

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
const systemCjkFonts = ref<ComboboxItem[]>([]);
const systemEnFonts = ref<ComboboxItem[]>([]);

onMounted(async () => {
  const fonts = await fontService.querySystemFonts();
  const cjk: ComboboxItem[] = [];
  const en: ComboboxItem[] = [];

  for (const f of fonts) {
    const item: ComboboxItem = {
      label: f.name,
      value: f.fontFamily || f.name,
      onSelect: () =>
        execute("fontEN", styles.fontEN, {
          name: f.name,
          fontFamily: f.fontFamily
        })
    };
    if (isCJKFont(f.name, f.fontFamily)) {
      item.onSelect = () =>
        execute("fontCJK", styles.fontCJK, {
          name: f.name,
          fontFamily: f.fontFamily
        });
      cjk.push(item);
    } else {
      en.push(item);
    }
  }

  systemCjkFonts.value = cjk;
  systemEnFonts.value = en;
  loaded.value = true;
});
</script>
