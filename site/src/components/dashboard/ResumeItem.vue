<template>
  <div class="w-60">
    <div class="h-[360px] flex flex-col">
      <div class="group/card relative mx-auto">
        <nuxt-link
          :to="`/editor/${props.resume.id}`"
          class="block rounded-lg overflow-hidden ring-when-focus
                 border border-border/60 bg-card
                 shadow-sm hover:shadow-lg hover:-translate-y-1
                 transition-all duration-300"
          :style="{
            width: `${size.w}px`,
            height: `${size.h}px`
          }"
        >
          <SharedResumeRender
            :id="resume.id"
            ref="renderRef"
            :markdown="resume.markdown"
            :styles="resume.styles"
            class="origin-top-left"
            :style="{
              transform: `scale(${1 / PAPER.MM_TO_PX})`
            }"
          />
        </nuxt-link>

        <DashboardResumeOptions
          class="opacity-0 group-hover/card:opacity-100 peer-focus-within:opacity-100 focus-within:opacity-100
                 transition-opacity duration-200"
          pos="absolute right-2 top-2"
          :resume="resume"
          @update="emit('update')"
        />
      </div>

      <DashboardResumeInfo :resume="resume" class="mt-3" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { delay } from "@cvgen/utils";
import type { DbResume } from "~/utils/storage";
import { SharedResumeRender } from "#components";

const props = defineProps<{
  resume: DbResume;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { PAPER } = useConstant();
const size = PAPER.SIZES.A4;

const renderRef = ref<InstanceType<typeof SharedResumeRender>>();

onMounted(async () => {
  dynamicCssService.injectBackbone(props.resume.id);
  await fontService.resolve(props.resume.styles.fontEN);
  await fontService.resolve(props.resume.styles.fontCJK);
  dynamicCssService.injectToolbar(props.resume.styles, props.resume.id);
  await delay(100);
  renderRef.value?.render();
});
</script>

<style scoped>
:deep(.resume-render) > *:not(:first-child) {
  @apply hidden;
}
</style>
