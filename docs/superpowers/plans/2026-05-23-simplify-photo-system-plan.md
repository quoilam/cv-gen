# Simplify Photo System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multi-image Asset system with a simplified single-photo system where users control their headshot via `photo: left|right` in YAML front matter.

**Architecture:** Photo is stored independently from markdown in localforage (`ohmycv_photo` store). A new `usePhoto` composable manages upload/compression/storage. `MarkdownService.renderResume()` becomes async, reads the `photo` front matter field, fetches the photo from localforage, and injects an `<img>` tag into the resume header HTML.

**Tech Stack:** Vue 3 Composition API, TypeScript, localforage, Canvas API, markdown-it

---

### Task 1: Remove old asset exports

**Files:**
- Modify: `site/src/composables/index.ts`

- [ ] **Step 1: Remove useAsset export**

Remove the `useAsset` export line from `site/src/composables/index.ts`:

```diff
- export { useAsset } from "./asset";
```

- [ ] **Step 2: Commit**

```bash
git add site/src/composables/index.ts
git commit -m "refactor: remove useAsset export from composables index"
```

---

### Task 2: Create photo composable

**Files:**
- Create: `site/src/composables/photo/index.ts`

- [ ] **Step 1: Write photo composable**

Create `site/src/composables/photo/index.ts`:

```ts
import localforage from "localforage";

const photoStore = localforage.createInstance({
  name: "ohmycv_photo"
});

const PHOTO_KEY = "photo";

const photo = ref<string | null>(null);

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 400;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type || "image/jpeg";
        const isLossy = mimeType === "image/jpeg";
        resolve(canvas.toDataURL(mimeType, isLossy ? 0.85 : undefined));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const usePhoto = () => {
  const init = async () => {
    photo.value = await photoStore.getItem<string>(PHOTO_KEY) ?? null;
  };

  const uploadPhoto = async (file: File) => {
    const base64 = await compressPhoto(file);
    await photoStore.setItem(PHOTO_KEY, base64);
    photo.value = base64;
  };

  const removePhoto = async () => {
    await photoStore.removeItem(PHOTO_KEY);
    photo.value = null;
  };

  return { photo, init, uploadPhoto, removePhoto };
};
```

- [ ] **Step 2: Commit**

```bash
git add site/src/composables/photo/index.ts
git commit -m "feat: add usePhoto composable for single headshot management"
```

---

### Task 3: Create Photo toolbar button

**Files:**
- Create: `site/src/components/editor/toolbar/Photo.vue`

- [ ] **Step 1: Write Photo.vue component**

Create `site/src/components/editor/toolbar/Photo.vue`:

```vue
<template>
  <EditorToolbarBox text="Photo" icon="i-lucide:user-round">
    <div class="flex items-center gap-2">
      <label
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-dashed hover:bg-accent"
        :class="hasPhoto ? 'border-green-500' : ''"
      >
        <span i-lucide:upload />
        {{ hasPhoto ? "Change Photo" : "Upload Photo" }}
        <input type="file" accept="image/*" class="hidden" @change="onUpload" />
      </label>
      <button
        v-if="hasPhoto"
        class="text-xs text-muted-foreground hover:text-destructive"
        @click="onRemove"
      >
        Remove
      </button>
    </div>
  </EditorToolbarBox>
</template>

<script lang="ts" setup>
import { usePhoto } from "~/composables/photo";

const { photo, init, uploadPhoto, removePhoto } = usePhoto();
const hasPhoto = computed(() => photo.value !== null);

onMounted(() => init());

const onUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await uploadPhoto(file);
};

const onRemove = async () => {
  await removePhoto();
};
</script>
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/editor/toolbar/Photo.vue
git commit -m "feat: add Photo toolbar button component"
```

---

### Task 4: Update toolbar index to replace Asset with Photo

**Files:**
- Modify: `site/src/components/editor/toolbar/index.vue`

- [ ] **Step 1: Replace Asset with Photo in toolbar**

In `site/src/components/editor/toolbar/index.vue`:

1. Remove `EditorToolbarAsset` from the imports:

```diff
-   EditorToolbarAsset,
```

2. Keep the other imports as-is (no need to import `EditorToolbarPhoto` — Nuxt auto-imports `EditorToolbarPhoto` from `#components` because it's in the `components/editor/toolbar/` directory).

3. Change the tool entry from `asset` to `photo`:

```diff
    {
-     id: "asset",
-     icon: "i-lucide:image",
-     component: EditorToolbarAsset
+     id: "photo",
+     icon: "i-lucide:user-round",
+     component: EditorToolbarPhoto
    },
```

4. Replace `"asset"` with `"photo"` in the `getTooltip` array:

```diff
-     return ["asset", "file", "correct_case", "font_family", "margins", "ai", "icon", "git", "smart_one_page"].includes(id)
+     return ["photo", "file", "correct_case", "font_family", "margins", "ai", "icon", "git", "smart_one_page"].includes(id)
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/editor/toolbar/index.vue
git commit -m "refactor: replace Asset tool with Photo in toolbar"
```

---

### Task 5: Update MarkdownService for photo front matter

**Files:**
- Modify: `site/src/utils/markdown.ts`

- [ ] **Step 1: Add photo to ResumeFrontMatter type and make renderResume async**

In `site/src/utils/markdown.ts`, make these changes:

1. Add `photo` to the `ResumeFrontMatter` type:

```diff
  type ResumeFrontMatter = {
    readonly name?: string;
+   readonly photo?: "left" | "right";
    readonly header?: Array<ResumeHeaderItem>;
  };
```

2. Add import for localforage at top:

```diff
+ import localforage from "localforage";
```

3. Replace `renderResume` method with async version:

```diff
-   public renderResume(md: string) {
-     const { body, frontMatter } = this._frontMatterParser.parse(md);
- 
-     const content = this._resolveDeflist(this._renderMarkdown(body));
-     const header = this.renderHeader(frontMatter);
- 
-     return header + content;
-   }
+   public async renderResume(md: string) {
+     const { body, frontMatter } = this._frontMatterParser.parse(md);
+ 
+     const content = this._resolveDeflist(this._renderMarkdown(body));
+     const header = await this.renderHeader(frontMatter);
+ 
+     return header + content;
+   }
```

4. Replace `renderHeader` with async version that injects photo:

```diff
-   public renderHeader(frontMatter: ResumeFrontMatter) {
-     const content = [
-       frontMatter.name ? `<h1>${frontMatter.name}</h1>\n` : "",
-       (frontMatter.header ?? [])
-         .map((item, i, array) =>
-           this._renderHeaderItem(item, i !== array.length - 1 && !array[i + 1].newLine)
-         )
-         .join("\n")
-     ].join("");
- 
-     return `<div class="resume-header">${content}</div>`;
-   }
+   public async renderHeader(frontMatter: ResumeFrontMatter) {
+     let photoHtml = "";
+     if (frontMatter.photo && (frontMatter.photo === "left" || frontMatter.photo === "right")) {
+       const photoStore = localforage.createInstance({ name: "ohmycv_photo" });
+       const photoBase64 = await photoStore.getItem<string>("photo");
+       if (photoBase64) {
+         photoHtml = `<img class="resume-photo resume-photo--${frontMatter.photo}" src="${photoBase64}" />`;
+       }
+     }
+ 
+     const content = [
+       frontMatter.name ? `<h1>${frontMatter.name}</h1>\n` : "",
+       (frontMatter.header ?? [])
+         .map((item, i, array) =>
+           this._renderHeaderItem(item, i !== array.length - 1 && !array[i + 1].newLine)
+         )
+         .join("\n")
+     ].join("");
+ 
+     return `<div class="resume-header">${photoHtml}${content}</div>`;
+   }
```

- [ ] **Step 2: Commit**

```bash
git add site/src/utils/markdown.ts
git commit -m "feat: support photo front matter field in MarkdownService"
```

---

### Task 6: Adapt ResumeRender.vue for async renderResume

**Files:**
- Modify: `site/src/components/shared/ResumeRender.vue`

- [ ] **Step 1: Change from sync computed to async reactive**

In `site/src/components/shared/ResumeRender.vue`:

1. Add import for `usePhoto`:

```diff
+ import { usePhoto } from "~/composables/photo";
```

2. Replace `html` computed with async `ref` + `watch`:

```diff
- const html = computed(() => markdownService.renderResume(props.markdown));
+ const html = ref("");
+ const { photo } = usePhoto();
+ 
+ watch(
+   () => [props.markdown, photo.value] as const,
+   async ([md]) => {
+     html.value = await markdownService.renderResume(md);
+   },
+   { immediate: true }
+ );
```

- [ ] **Step 2: Commit**

```bash
git add site/src/components/shared/ResumeRender.vue
git commit -m "refactor: adapt ResumeRender to async renderResume with photo reactivity"
```

---

### Task 7: Add photo CSS

**Files:**
- Modify: `site/src/composables/constant/variables/default.ts`

- [ ] **Step 1: Add photo styles to default CSS**

In `site/src/composables/constant/variables/default.ts`, replace the `/* SVG & Images */` section:

```diff
  /* SVG & Images */
  
  ${PREVIEW_SELECTOR} svg.iconify {
    vertical-align: -0.2em;
  }
  
- ${PREVIEW_SELECTOR} img {
-   max-width: 100%;
- }
+ ${PREVIEW_SELECTOR} .resume-photo {
+   width: 100px;
+   height: 133px;
+   object-fit: cover;
+ }
+ 
+ ${PREVIEW_SELECTOR} .resume-photo--left {
+   float: left;
+   margin-right: 16px;
+ }
+ 
+ ${PREVIEW_SELECTOR} .resume-photo--right {
+   float: right;
+   margin-left: 16px;
+ }
```

- [ ] **Step 2: Commit**

```bash
git add site/src/composables/constant/variables/default.ts
git commit -m "style: add resume-photo CSS rules"
```

---

### Task 8: Delete old asset files

**Files:**
- Delete: `site/src/components/editor/asset/AssetManager.vue`
- Delete: `site/src/components/editor/toolbar/Asset.vue`
- Delete: `site/src/composables/asset/index.ts`

- [ ] **Step 1: Delete the old files**

```bash
git rm site/src/components/editor/asset/AssetManager.vue
git rm site/src/components/editor/toolbar/Asset.vue
git rm site/src/composables/asset/index.ts
```

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor: remove legacy multi-image Asset system"
```

---

### Task 9: Verify build

**Files:** (none — verification only)

- [ ] **Step 1: Run type check**

```bash
cd site && pnpm exec vue-tsc --noEmit 2>&1 | head -50
```

Expected: No type errors related to photo/asset changes.

- [ ] **Step 2: Run build**

```bash
pnpm build:pkg && cd site && pnpm build 2>&1 | tail -20
```

Expected: Build succeeds without errors.
