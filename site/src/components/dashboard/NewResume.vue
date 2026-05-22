<template>
  <div class="w-56 h-80">
    <button
      class="resume-card group w-[210px] h-[299px] flex-center bg-secondary hover:bg-background ring-when-focus"
      :aria-label="$t('dashboard.new')"
      @click="newAndSwitch"
    >
      <span i-ic:round-plus text="5xl muted-foreground group-hover:primary" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const localePath = useLocalePath();
const { createResume } = useResume();

const newAndSwitch = async () => {
  const data = await createResume();

  if (!data) return;
  else router.push(localePath(`/editor/${data.id}`));
};
</script>
