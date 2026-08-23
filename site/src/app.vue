<template>
  <div class="font-ui">
    <NuxtPage />
    <ClientOnly>
      <UiToaster close-button />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const preferredDark = usePreferredDark();
const baseURL = useRuntimeConfig().app.baseURL;

onMounted(() => {
  // 开发模式下注销已注册的 Service Worker，避免缓存干扰
  if (import.meta.env.DEV) {
    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
});

useHead({
  title: "CvGen - 免费的在线简历制作工具",
  meta: [
    { name: "keywords", content: "Markdown 简历, 简历制作, 在线简历" },
    { name: "description", content: "免费的在线简历制作工具，使用 Markdown 来轻松制作您的简历！" },
    { property: "og:title", content: "CvGen - 免费的在线简历制作工具" },
    { property: "og:description", content: "免费的在线简历制作工具，使用 Markdown 来轻松制作您的简历！" },
    {
      name: "theme-color",
      content: () => (colorMode.value === "dark" ? "#15191F" : "#F9F8F6")
    }
  ],
  link: [
    {
      rel: "icon",
      type: "image/svg+xml",
      href: () => `${baseURL}${preferredDark.value ? "favicon-dark.svg" : "favicon.svg"}`
    },
    ...(!import.meta.env.DEV
      ? [{ rel: "manifest", href: `${baseURL}manifest.webmanifest` }]
      : [])
  ]
});
</script>
