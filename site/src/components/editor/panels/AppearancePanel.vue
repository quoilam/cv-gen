<template>
  <div class="appearance-panel space-y-4">
    <!-- Theme Color -->
    <div>
      <div class="panel-label">主题色</div>
      <div class="flex justify-between mt-2">
        <button
          v-for="(color, i) in COLOR.PRESET"
          :key="`${i}-${color}`"
          class="size-5 rounded-full flex-center text-white cursor-pointer ring-when-focus"
          :style="{ backgroundColor: color }"
          @click="api.setValue(color)"
        >
          <span v-show="toHex(api.value) === color.toUpperCase()" i-line-md:confirm class="size-3" />
        </button>
      </div>
      <!-- Color picker control -->
      <div v-bind="api.getRootProps()" class="relative mt-2">
        <div
          v-bind="api.getControlProps()"
          class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors"
          :class="api.open ? 'border-primary' : 'border-border'"
        >
          <button v-bind="api.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
            <div class="size-full" v-bind="api.getSwatchProps({ value: api.value })" />
          </button>
          <input
            v-bind="api.getChannelInputProps({ channel: 'hex' })"
            class="bg-transparent outline-none flex-1 text-xs min-w-0"
          />
        </div>
      </div>
    </div>

    <div class="border-t border-border/50 my-2" />

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
          @update:model-value="onFontSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as colorPicker from "@zag-js/color-picker";
import { normalizeProps, useMachine } from "@zag-js/vue";
import type { ComboboxItem } from "~/components/shared/ui/Combobox.vue";
import { isCJKFont } from "~/utils/font";

const { styles } = useStyleStore();
const { execute } = useStyleHistory();
const { COLOR, FONT } = useConstant();

// Theme color
const [state, send] = useMachine(
  colorPicker.machine({
    id: "theme-color-floating",
    value: colorPicker.parse(styles.themeColor),
    onValueChange: (details) => {
      execute("themeColor", styles.themeColor, toHex(details.value));
    },
  })
);
const api = computed(() => colorPicker.connect(state.value, send, normalizeProps));
const toHex = (value: colorPicker.Color) =>
  "#" + value.toHexInt().toString(16).toUpperCase().padStart(6, "0");

// Fonts
const makeItem = (
  font: { name: string; fontFamily?: string },
  key: "fontEN" | "fontCJK"
): ComboboxItem => ({
  label: font.name,
  value: font.fontFamily || font.name,
  onSelect: () =>
    execute(key, styles[key], { name: font.name, fontFamily: font.fontFamily }),
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
          fontFamily: f.fontFamily,
        }),
    };
    if (isCJKFont(f.name, f.fontFamily)) {
      item.onSelect = () =>
        execute("fontCJK", styles.fontCJK, {
          name: f.name,
          fontFamily: f.fontFamily,
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
