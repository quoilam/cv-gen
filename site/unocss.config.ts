import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup
} from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

export default defineConfig({
  shortcuts: [
    {
      "flex-center": "flex items-center justify-center",
      hstack: "flex items-center",
      "hide-on-mobile": "lt-md:hidden",
      "ring-when-focus":
        "ring-offset-background focus-visible:(outline-none ring-2 ring-ring ring-offset-2)",
      "shadow-c": "shadow shadow-gray-300 dark:shadow-neutral-900",
      "resume-card":
        "relative mx-auto rounded-md duration-150 hover:(-translate-y-3 drop-shadow-xl)"
    }
  ],
  preflights: [
    {
      getCSS: () => `
        :root {
          --success: 142 71% 29%;
          --info: 224 77% 48%;
        }

        .dark {
          --success: 142 76% 40%;
          --info: 209 87% 57%;
        }
      `
    }
  ],
  theme: {
    breakpoints: {
      sm: "641px",
      md: "769px",
      lg: "1025px"
    },
    colors: {
      success: "hsl(var(--success))",
      info: "hsl(var(--info))"
    },
    fontFamily: {
      ui: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
    }
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: "inline-block"
      }
    }),
    presetAnimations(),
    presetShadcn(
      {
        color: {
          base: "blue",
          light: {
            background: "40 20% 98%",
            foreground: "222 20% 18%",
            card: "0 0% 100%",
            "card-foreground": "222 20% 18%",
            popover: "0 0% 100%",
            "popover-foreground": "222 20% 18%",
            primary: "221 83% 53%",
            "primary-foreground": "0 0% 100%",
            secondary: "220 14% 94%",
            "secondary-foreground": "220 30% 25%",
            muted: "220 14% 96%",
            "muted-foreground": "220 9% 46%",
            accent: "220 14% 94%",
            "accent-foreground": "220 30% 25%",
            border: "220 13% 88%",
            input: "220 13% 88%",
            ring: "221 83% 53%"
          },
          dark: {
            background: "222 20% 10%",
            foreground: "210 20% 95%",
            card: "222 20% 12%",
            "card-foreground": "210 20% 95%",
            popover: "222 20% 12%",
            "popover-foreground": "210 20% 95%",
            primary: "217 91% 65%",
            "primary-foreground": "222 20% 10%",
            secondary: "217 15% 20%",
            "secondary-foreground": "210 20% 95%",
            muted: "217 15% 18%",
            "muted-foreground": "215 14% 65%",
            accent: "217 15% 20%",
            "accent-foreground": "210 20% 95%",
            border: "217 15% 25%",
            input: "217 15% 25%",
            ring: "217 91% 65%"
          }
        }
      },
      false
    )
  ],
  safelist: [
    "i-tabler:dots",
    "i-tabler:file-text",
    "i-tabler:palette",
    "i-tabler:layout",
    "i-tabler:brand-github",
    "i-lucide:zoom-in",
    "i-lucide:zoom-out",
    "i-lucide:upload",
    "i-ri:image-line",
    "i-ri:markdown-fill",
    "i-mdi:file-pdf",
    "i-mdi:language-html5",
    "i-mdi:file-word",
    "i-mdi:upload",
    "i-fluent:arrow-autofit-width-20-filled",
    "i-fluent:arrow-autofit-height-20-filled",
    "i-ic:baseline-save",
    "i-material-symbols:edit-square-outline-rounded",
    "i-ph:sun-bold",
    "i-ph:moon-bold"
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  content: {
    pipeline: {
      // https://github.com/fisand/unocss-preset-shadcn
      include: [/\.ts/, /\.vue$/, /\.vue\?vue/]
    }
  }
});
