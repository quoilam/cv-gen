<template>
  <div flex="~ col gap-y-1.5" items-end>
    <UiButton
      size="round"
      variant="ghost"
      class="group/btn gap-x-1 shadow-sm bg-background/90 backdrop-blur-sm hover:(bg-background ring-1 ring-border shadow-md w-auto px-2.5) focus-visible:(w-auto px-2.5) transition-all duration-200"
      @click="duplicate"
      aria-label="创建副本"
    >
      <span i-ion:duplicate class="size-4" />
      <span
        class="hidden text-xs font-medium group-hover/btn:inline group-focus-visible/btn:inline ml-1"
      >
        创建副本
      </span>
    </UiButton>

    <UiDialog v-model:open="deleteDialogOpen">
      <UiDialogTrigger as-child>
        <UiButton
          size="round"
          variant="ghost"
          class="group/btn gap-x-1 shadow-sm bg-background/90 backdrop-blur-sm hover:(bg-destructive text-destructive-foreground ring-1 ring-destructive/30 shadow-md w-auto px-2.5) focus-visible:(w-auto px-2.5) transition-all duration-200"
          aria-label="删除"
        >
          <span i-material-symbols:delete-outline-rounded class="size-4" />
          <span
            class="hidden text-xs font-medium group-hover/btn:inline group-focus-visible/btn:inline ml-1"
          >
            删除
          </span>
        </UiButton>
      </UiDialogTrigger>
      <UiDialogContent class="sm:max-w-100">
        <UiDialogHeader>
          <UiDialogTitle>确认删除</UiDialogTitle>
        </UiDialogHeader>
        <p class="text-sm text-muted-foreground">
          确定要删除简历「{{ resume.name }}」吗？删除后无法恢复。
        </p>
        <div class="flex justify-end gap-x-2 mt-2">
          <UiButton variant="outline" @click="deleteDialogOpen = false"> 取消 </UiButton>
          <UiButton variant="destructive" @click="handleDelete"> 确认删除 </UiButton>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { DbResume } from "~/utils/storage";

const props = defineProps<{
  resume: DbResume;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { duplicateResume, deleteResume } = useResume();

const deleteDialogOpen = ref(false);

const duplicate = async () => {
  await duplicateResume(props.resume.id);
  emit("update");
};

const handleDelete = async () => {
  await deleteResume(props.resume.id);
  deleteDialogOpen.value = false;
  emit("update");
};
</script>
