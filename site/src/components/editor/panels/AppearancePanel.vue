<template>
  <div class="appearance-panel space-y-4">
    <!-- Font Family -->
    <div>
      <div class="panel-label">字体</div>
      <div class="space-y-2 mt-2">
        <div class="flex items-center gap-x-2">
          <SharedUiCombobox
            v-if="fontLoaded"
            id="font-cjk-floating"
            class="flex-1"
            :items="localCjk.concat(systemCjkFonts)"
            :default-value="styles.fontCJK.fontFamily || styles.fontCJK.name"
          />
          <UiSkeleton v-else class="flex-1 h-8" />
          <span class="text-xs text-muted-foreground w-10 shrink-0">中日韩</span>
        </div>
        <div class="flex items-center gap-x-2">
          <SharedUiCombobox
            v-if="fontLoaded"
            id="font-en-floating"
            class="flex-1"
            :items="localEn.concat(systemEnFonts)"
            :default-value="styles.fontEN.fontFamily || styles.fontEN.name"
          />
          <UiSkeleton v-else class="flex-1 h-8" />
          <span class="text-xs text-muted-foreground w-10 shrink-0">英文</span>
        </div>
      </div>
    </div>

    <div class="border-t border-border/50 my-2" />

    <!-- Font Size -->
    <div>
      <div class="panel-label">
        字号
        <span class="text-xs text-muted-foreground ml-1">{{ styles.fontSize }}px</span>
      </div>
      <div class="mt-2">
        <SharedUiSlider
          unit="px"
          :model-value="fontSizeValue"
          :min="12"
          :max="20"
          :step="0.1"
          @update:model-value="onFontSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComboboxItem } from "~/components/shared/ui/Combobox.vue";

const { styles } = useStyleStore();
const { execute } = useStyleHistory();
const { FONT } = useConstant();

// Fonts
const makeItem = (
  font: { name: string; fontFamily?: string },
  key: "fontEN" | "fontCJK"
): ComboboxItem => ({
  label: font.name,
  value: font.fontFamily || font.name,
  onSelect: () =>
    execute(key, styles[key], { name: font.name, fontFamily: font.fontFamily })
});

const localEn = FONT.LOCAL.EN.map((f) => makeItem(f, "fontEN"));
const localCjk = FONT.LOCAL.CJK.map((f) => makeItem(f, "fontCJK"));

const fontLoaded = ref(false);
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
  fontLoaded.value = true;
});

// Font size slider
const fontSizeValue = ref([styles.fontSize]);
const onFontSizeChange = (value: number[] | undefined) => {
  if (!value) return;
  fontSizeValue.value = value;
  execute("fontSize", styles.fontSize, value.at(0)!);
};
</script>

<style scoped>
.panel-label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
