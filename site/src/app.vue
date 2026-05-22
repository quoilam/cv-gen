<template>
  <div class="font-ui">
    <VitePwaManifest />
    <NuxtPage />
    <UiToaster close-button />
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const preferredDark = usePreferredDark();

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
      href: () => (preferredDark.value ? "/favicon-dark.svg" : "/favicon.svg")
    }
  ],
  script: [
    {
      src: "https://code.iconify.design/2/2.2.1/iconify.min.js",
      type: "module",
      tagPosition: "bodyClose"
    }
  ]
});
</script>
