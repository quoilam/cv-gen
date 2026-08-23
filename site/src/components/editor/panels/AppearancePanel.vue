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
          @click="themeApi.setValue(color)"
        >
          <span v-show="toHex(themeApi.value) === color.toUpperCase()" i-line-md:confirm class="size-3" />
        </button>
      </div>
      <!-- Color picker control -->
      <div v-bind="themeApi.getRootProps()" class="relative mt-2">
        <div
          v-bind="themeApi.getControlProps()"
          class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors"
          :class="themeApi.open ? 'border-primary' : 'border-border'"
        >
          <button v-bind="themeApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
            <div class="size-full" v-bind="themeApi.getSwatchProps({ value: themeApi.value })" />
          </button>
          <input
            v-bind="themeApi.getChannelInputProps({ channel: 'hex' })"
            class="bg-transparent outline-none flex-1 text-xs min-w-0"
          />
        </div>
      </div>
    </div>

    <!-- Heading & Link Colors -->
    <div class="space-y-3">
      <div>
        <div class="panel-label">标题色</div>
        <div v-bind="headingApi.getRootProps()" class="relative mt-2">
          <div v-bind="headingApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="headingApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="headingApi.getSwatchProps({ value: headingApi.value })" />
            </button>
            <input v-bind="headingApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
      </div>
      <div>
        <div class="panel-label">链接色</div>
        <div v-bind="linkApi.getRootProps()" class="relative mt-2">
          <div v-bind="linkApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="linkApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="linkApi.getSwatchProps({ value: linkApi.value })" />
            </button>
            <input v-bind="linkApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
      </div>
      <div>
        <div class="panel-label">经历条默认色</div>
        <div v-bind="badgeApi.getRootProps()" class="relative mt-2">
          <div v-bind="badgeApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="badgeApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="badgeApi.getSwatchProps({ value: badgeApi.value })" />
            </button>
            <input v-bind="badgeApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
        <div class="mt-2">
          <SharedUiSlider unit="%" :model-value="badgeOpacityValue" :min="0" :max="100" @update:model-value="onBadgeOpacityChange" />
        </div>
        <div class="mt-3">
          <div class="panel-label">
            banner 图标大小
            <span class="text-xs text-muted-foreground ml-1">{{ styles.badgeIconScale }}x</span>
          </div>
          <div class="mt-2">
            <SharedUiSlider unit="x" :model-value="badgeIconScaleValue" :min="0.5" :max="3" :step="0.1" @update:model-value="onBadgeIconScaleChange" />
          </div>
        </div>
      </div>
      <div>
        <div class="panel-label">标题色条</div>
        <label class="flex items-center gap-2 text-sm mt-2 cursor-pointer">
          <input type="checkbox" :checked="styles.sectionBarEnabled" @change="onSectionBarToggle" />
          显示标题色条
        </label>
        <div v-bind="sectionBarApi.getRootProps()" class="relative mt-2">
          <div v-bind="sectionBarApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="sectionBarApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="sectionBarApi.getSwatchProps({ value: sectionBarApi.value })" />
            </button>
            <input v-bind="sectionBarApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
        <div class="mt-2">
          <SharedUiSlider unit="%" :model-value="sectionBarOpacityValue" :min="0" :max="100" @update:model-value="onSectionBarOpacityChange" />
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
type ColorKey = "themeColor" | "headingColor" | "linkColor" | "sectionBarColor" | "badgeColor";

const toHex = (value: colorPicker.Color) =>
  "#" + value.toHexInt().toString(16).toUpperCase().padStart(6, "0");

const createColorField = (key: ColorKey) => {
  const [state, send] = useMachine(
    colorPicker.machine({
      id: `${key}-floating`,
      value: colorPicker.parse(styles[key]),
      onValueChange: (details) => {
        execute(key, styles[key], toHex(details.value));
      },
    })
  );
  const api = computed(() => colorPicker.connect(state.value, send, normalizeProps));
  return api;
};

const themeApi = createColorField("themeColor");
const headingApi = createColorField("headingColor");
const linkApi = createColorField("linkColor");
const sectionBarApi = createColorField("sectionBarColor");
const badgeApi = createColorField("badgeColor");

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

// Section bar opacity + toggle
const sectionBarOpacityValue = ref([styles.sectionBarOpacity * 100]);
const onSectionBarOpacityChange = (value: number[] | undefined) => {
  if (!value) return;
  sectionBarOpacityValue.value = value;
  execute("sectionBarOpacity", styles.sectionBarOpacity, value.at(0)! / 100);
};

const onSectionBarToggle = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  execute("sectionBarEnabled", styles.sectionBarEnabled, checked);
};

// Badge opacity
const badgeOpacityValue = ref([styles.badgeOpacity * 100]);
const onBadgeOpacityChange = (value: number[] | undefined) => {
  if (!value) return;
  badgeOpacityValue.value = value;
  execute("badgeOpacity", styles.badgeOpacity, value.at(0)! / 100);
};

// Badge icon scale
const badgeIconScaleValue = ref([styles.badgeIconScale]);
const onBadgeIconScaleChange = (value: number[] | undefined) => {
  if (!value) return;
  badgeIconScaleValue.value = value;
  execute("badgeIconScale", styles.badgeIconScale, value.at(0)!);
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
