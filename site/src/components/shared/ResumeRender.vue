<template>
  <div class="resume-render" :id="`resume-${id}`" ref="target" />
</template>

<script lang="ts" setup>
import { useSmartPages } from "@cvgen/vue-smart-pages";
import type { ResumeStyles } from "~/composables/stores/style";
import { usePhoto } from "~/composables/photo";

// Lazy load Iconify for rendering resume icons (only when preview renders)
onMounted(() => {
  if (!document.querySelector('script[src*="iconify"]')) {
    const script = document.createElement("script");
    script.src = "https://code.iconify.design/2/2.2.1/iconify.min.js";
    script.type = "module";
    script.async = true;
    document.body.appendChild(script);
  }
});

const props = defineProps<{
  id: string | number;
  markdown: string;
  styles: ResumeStyles;
}>();

const constant = useConstant();
const target = ref<HTMLElement>();

const size = computed(() => ({
  height: constant.PAPER.sizeToPx("A4", "h"),
  width: constant.PAPER.SIZES.A4.w
}));
const margins = computed(() => ({
  top: props.styles.marginV,
  bottom: props.styles.marginV,
  left: props.styles.marginH,
  right: props.styles.marginH
}));

const html = ref("");
const { photo } = usePhoto();
const { frontMatter: toastFrontMatter } = useToast();
const frontMatterError = ref<unknown | null>(null);

watch(
  () => [props.markdown, photo.value] as const,
  async ([md]) => {
    try {
      html.value = await markdownService.renderResume(md, (err) => {
        frontMatterError.value = err;
      });
    } catch (error) {
      console.error("Failed to render resume:", error);
    }
  },
  { immediate: true }
);

watchDebounced(
  frontMatterError,
  (err) => {
    if (err) toastFrontMatter(err);
  },
  { debounce: 1500 }
);

const { render } = useSmartPages(target, html, size, margins, {
  beforeRender: async () => {
    // Wait for the fonts to be loaded
    await fontService.presetObserver(props.styles);
  },
  watchThrottledOptions: {
    throttle: 200
  }
});

watchThrottled(
  () => [
    props.styles.lineHeight,
    props.styles.paragraphSpace,
    props.styles.fontSize,
    props.styles.fontCJK,
    props.styles.fontEN
  ],
  render,
  {
    throttle: 200,
    leading: false
  }
);

defineExpose({
  render
});
</script>
