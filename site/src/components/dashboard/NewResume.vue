<template>
  <div class="w-60 h-[360px]">
    <button
      class="group w-[220px] h-[315px] flex-center flex-col gap-y-3 rounded-lg border-2 border-dashed border-border/80 bg-muted/50 hover:bg-muted hover:border-primary/40 hover:shadow-sm ring-when-focus transition-all duration-200"
      aria-label="新建简历"
      @click="newAndSwitch"
    >
      <span
        class="size-12 rounded-full bg-primary/10 flex-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300"
      >
        <span i-lucide:plus class="size-6 text-primary" />
      </span>
      <span
        class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors"
      >
        新建简历
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const { createResume } = useResume();

const newAndSwitch = async () => {
  const data = await createResume();

  if (!data) return;
  else router.push(`/editor/${data.id}`);
};
</script>
