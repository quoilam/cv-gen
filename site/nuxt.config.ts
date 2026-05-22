import { pwa } from "./configs/pwa";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "src/",

  modules: [
    "@vueuse/nuxt",
    "@unocss/nuxt",
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@vite-pwa/nuxt",
    "nuxt-simple-sitemap",
    "radix-vue/nuxt",
    "shadcn-nuxt"
  ],

  css: [
    "@unocss/reset/tailwind.css",
    "katex/dist/katex.min.css",
    "~/assets/css/index.css"
  ],

  shadcn: {
    prefix: "Ui",
    componentDir: "./src/components/ui"
  },

  runtimeConfig: {
    public: {}
  },

  colorMode: {
    classSuffix: ""
  },

  app: {
    head: {
      viewport: "width=device-width,initial-scale=1",
      link: [
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#222" }
      ],
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "application-name", content: "CvGen" },
        { name: "apple-mobile-web-app-title", content: "CvGen" },
        { name: "msapplication-TileColor", content: "#fff" },
        { property: "og:url", content: "https://quoilam.github.io/cv-gen" },
        { property: "og:type", content: "website" }
      ]
    }
  },

  site: {
    url: "https://quoilam.github.io/cv-gen"
  },

  pwa,
  compatibilityDate: "2026-05-23"
});