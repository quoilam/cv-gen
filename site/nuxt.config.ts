import { resolve } from "path";
import { fileURLToPath } from "url";
import { pwa } from "./configs/pwa";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "src/",

  modules: [
    "@vueuse/nuxt",
    ["@unocss/nuxt", { content: { pipeline: { include: [/\/src\/.*\.(vue|ts|js|tsx|jsx)$/] } } }],
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    ...(process.env.NODE_ENV === 'production' ? ["@vite-pwa/nuxt"] : []),
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
    baseURL: process.env.NODE_ENV === 'production' ? '/cv-gen/' : '/',
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

  ...(process.env.NODE_ENV === 'production' ? { pwa } : {}),
  compatibilityDate: "2026-05-23",

  vite: {
    resolve: {
      alias: {
        "@cvgen/case-police": resolve(__dirname, "src/internal/case-police"),
        "@cvgen/dynamic-css": resolve(__dirname, "src/internal/dynamic-css"),
        "@cvgen/front-matter": resolve(__dirname, "src/internal/front-matter"),
        "@cvgen/markdown-it-cross-ref": resolve(__dirname, "src/internal/markdown-it-cross-ref"),
        "@cvgen/markdown-it-badge": resolve(__dirname, "src/internal/markdown-it-badge"),
        "@cvgen/markdown-it-katex": resolve(__dirname, "src/internal/markdown-it-katex"),
        "@cvgen/markdown-it-latex-cmds": resolve(__dirname, "src/internal/markdown-it-latex-cmds"),
        "@cvgen/utils": resolve(__dirname, "src/internal/utils"),
        "@cvgen/vue-shortcuts": resolve(__dirname, "src/internal/vue-shortcuts"),
        "@cvgen/vue-smart-pages": resolve(__dirname, "src/internal/vue-smart-pages"),
        "@cvgen/vue-zoom": resolve(__dirname, "src/internal/vue-zoom")
      }
    },
    optimizeDeps: {
      exclude: ["monaco-editor"]
    },
    server: {
      warmup: {
        clientFiles: ["./src/app.vue", "./src/pages/**/*.vue"]
      }
    }
  }
});