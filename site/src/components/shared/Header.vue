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
      <UiButton
        :as="NuxtLink"
        to="/dashboard"
        variant="ghost"
        size="sm"
        class="h-8 gap-x-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        aria-label="我的简历"
      >
        <span class="i-ep:menu text-base" />
        <span class="hide-on-mobile">我的简历</span>
      </UiButton>

      <slot name="tail" />

      <UiButton
        :as="NuxtLink"
        to="/settings"
        variant="ghost"
        size="round"
        class="text-muted-foreground hover:text-foreground"
        aria-label="设置"
      >
        <span i-lucide:settings text-base />
      </UiButton>

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
import { NuxtLink } from "#components";
</script>
