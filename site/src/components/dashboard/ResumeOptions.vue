<template>
  <div flex="~ col gap-y-1.5" items-end>
    <UiButton
      size="round"
      variant="ghost"
      class="group/btn gap-x-1 shadow-sm bg-background/90 backdrop-blur-sm
             hover:(bg-background ring-1 ring-border shadow-md w-auto px-2.5)
             focus-visible:(w-auto px-2.5)
             transition-all duration-200"
      @click="duplicate"
      aria-label="创建副本"
    >
      <span i-ion:duplicate class="size-4" />
      <span class="hidden text-xs font-medium group-hover/btn:inline group-focus-visible/btn:inline ml-1">
        创建副本
      </span>
    </UiButton>

    <UiButton
      size="round"
      variant="ghost"
      class="group/btn gap-x-1 shadow-sm bg-background/90 backdrop-blur-sm
             hover:(bg-destructive text-destructive-foreground ring-1 ring-destructive/30 shadow-md w-auto px-2.5)
             focus-visible:(w-auto px-2.5)
             transition-all duration-200"
      @click="remove"
      aria-label="删除"
    >
      <span i-material-symbols:delete-outline-rounded class="size-4" />
      <span class="hidden text-xs font-medium group-hover/btn:inline group-focus-visible/btn:inline ml-1">
        删除
      </span>
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import type { DbResume } from "~/utils/storage";

const props = defineProps<{
  resume: DbResume;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { duplicateResume, deleteResume } = useResume();

const duplicate = async () => {
  await duplicateResume(props.resume.id);
  emit("update");
};

const remove = async () => {
  await deleteResume(props.resume.id);
  emit("update");
};
</script>
