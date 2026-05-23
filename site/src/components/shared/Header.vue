<template>
  <header
    class="hstack justify-between pl-5 pr-2 sticky top-0 z-50
           bg-background/80 backdrop-blur-md
           border-b border-border/60"
  >
    <nuxt-link class="hstack gap-x-2.5 group" to="/">
      <SharedLogo text-base />
      <div text-lg font-semibold tracking-tight>
        <SharedBrandName />
      </div>
    </nuxt-link>

    <div class="hstack gap-x-0.5">
<slot name="tail" />

<SharedToggleDark />

      <UiButton
        as="a"
        variant="ghost"
        size="round"
        class="text-muted-foreground hover:text-foreground"
        href="https://github.com/quoilam/cv-gen"
        target="_blank"
        rel="nofollow noopener"
      >
        <span i-tabler:brand-github text-base />
      </UiButton>
    </div>
  </header>
</template>

<script lang="ts" setup>
</script>
