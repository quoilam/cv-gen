import { defineConfig } from "vitest/config";
import AutoImport from "unplugin-auto-import/vite";

const srcDir = new URL("src/", import.meta.url).pathname;
const packagesDir = new URL("../packages/", import.meta.url).pathname;
const mocksDir = new URL("tests/__mocks__/", import.meta.url).pathname;

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        "vue",
        "pinia",
        {
          "nuxt/app": ["useState", "useAsyncData", "useLazyFetch", "useRoute", "useRouter"],
          "@cvgen/dynamic-css": ["dynamicCssService"],
          "~/composables/monaco": ["useMonaco"],
        },
      ],
      dirs: [
        `${srcDir}composables/stores`,
        `${srcDir}composables/constant`,
      ],
    }),
  ],
  resolve: {
    alias: {
      "~/composables/monaco": `${mocksDir}monaco-composable.ts`,
      "~/": srcDir,
      "@@/": srcDir,
      "@cvgen/dynamic-css": `${packagesDir}dynamic-css/src/index.ts`,
      "@cvgen/utils": `${packagesDir}utils/src/index.ts`,
      "@cvgen/front-matter": `${packagesDir}front-matter/src/index.ts`,
      "@cvgen/markdown-it-katex": `${packagesDir}markdown-it-katex/src/index.ts`,
      "@cvgen/markdown-it-cross-ref": `${packagesDir}markdown-it-cross-ref/src/index.ts`,
      "@cvgen/markdown-it-latex-cmds": `${packagesDir}markdown-it-latex-cmds/src/index.ts`,
      "@cvgen/case-police": `${packagesDir}case-police/src/index.ts`,
      "@cvgen/vue-shortcuts": `${packagesDir}vue-shortcuts/src/index.ts`,
      "@cvgen/vue-smart-pages": `${packagesDir}vue-smart-pages/src/index.ts`,
      "@cvgen/vue-zoom": `${packagesDir}vue-zoom/src/index.ts`,
    },
  },
  test: {
    environment: "happy-dom",
    dir: "tests/unit",
    globals: true,
  },
});
