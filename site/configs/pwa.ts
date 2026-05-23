import type { ModuleOptions } from "@vite-pwa/nuxt";

const scope = "/";

export const pwa: ModuleOptions = {
  registerType: "autoUpdate",
  scope,
  base: scope,
  manifest: {
    id: scope,
    scope,
    name: "CvGen",
    short_name: "CvGen",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "512x512",
        type: "image/svg",
        purpose: "any maskable"
      }
    ]
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,otf,ttf,woff2,png,svg}"],
    maximumFileSizeToCacheInBytes: 16000000,
    cleanupOutdatedCaches: true
  },
  registerWebManifestInRouteRules: true,
  writePlugin: true
};
