import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";
import AutoImport from "unplugin-auto-import/vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = resolve(__dirname, "src");
const mocksDir = resolve(__dirname, "tests/__mocks__");

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        "vue",
        "pinia",
        {
          "nuxt/app": [
            "useState",
            "useAsyncData",
            "useLazyFetch",
            "useRoute",
            "useRouter"
          ],
          "@cvgen/dynamic-css": ["dynamicCssService"],
          "~/composables/monaco": ["useMonaco"]
        }
      ],
      dirs: [`${srcDir}/composables/stores`, `${srcDir}/composables/constant`]
    })
  ],
  resolve: {
    alias: {
      "~/composables/monaco": `${mocksDir}/monaco-composable.ts`,
      "~/": `${srcDir}/`,
      "@@/": `${srcDir}/`,
      "@cvgen/dynamic-css": resolve(__dirname, "src/internal/dynamic-css"),
      "@cvgen/utils": resolve(__dirname, "src/internal/utils"),
      "@cvgen/front-matter": resolve(__dirname, "src/internal/front-matter"),
      "@cvgen/markdown-it-katex": resolve(__dirname, "src/internal/markdown-it-katex"),
      "@cvgen/markdown-it-cross-ref": resolve(
        __dirname,
        "src/internal/markdown-it-cross-ref"
      ),
      "@cvgen/markdown-it-badge": resolve(__dirname, "src/internal/markdown-it-badge"),
      "@cvgen/markdown-it-latex-cmds": resolve(
        __dirname,
        "src/internal/markdown-it-latex-cmds"
      ),
      "@cvgen/case-police": resolve(__dirname, "src/internal/case-police"),
      "@cvgen/vue-shortcuts": resolve(__dirname, "src/internal/vue-shortcuts"),
      "@cvgen/vue-smart-pages": resolve(__dirname, "src/internal/vue-smart-pages"),
      "@cvgen/vue-zoom": resolve(__dirname, "src/internal/vue-zoom")
    }
  },
  test: {
    environment: "happy-dom",
    dir: "tests/unit",
    globals: true,
    setupFiles: ["tests/setup.ts"]
  }
});
