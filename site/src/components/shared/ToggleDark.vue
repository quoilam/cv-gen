<template>
  <UiButton
    variant="ghost"
    size="round"
    class="text-muted-foreground hover:text-foreground"
    aria-label="切换颜色模式"
    @click="toggle"
  >
    <span v-if="colorMode.value === 'dark'" class="i-ph:moon-bold size-4" />
    <span v-else class="i-ph:sun-bold size-4" />
  </UiButton>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();

const toggle = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>
