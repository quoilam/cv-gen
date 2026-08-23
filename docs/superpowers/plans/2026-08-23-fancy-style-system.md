# Fancy 样式系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为简历添加 fancy 彩色样式（多强调色、Section 标题色条、经历/项目 badge 标识条）。

**Architecture:** 扩展 `ResumeStyles` 数据模型 → `DynamicCssService` 生成对应 CSS → 新增 markdown-it-badge 插件识别 deflist 加粗 dt 渲染 badge → Appearance 面板加控件 + Asset 面板加图标上传。

**Tech Stack:** Vue 3 + TypeScript, Nuxt 3, markdown-it v14, @zag-js/color-picker, localforage, happy-dom (vitest), Playwright (e2e)。

## Global Constraints

- 颜色存纯 hex（3/6/8 位），透明度用独立 `number`（0~1），渲染用 `color-mix(in srgb, <color> <pct>%, transparent)` 生成半透明。
- `themeColor` 字段保留不删除（向后兼容旧简历数据与 h2 下划线默认色）。
- badge 识别目标：deflist 的加粗 dt（`**...**`）；`~`/`:` 次要信息（dd）不加 badge、保持横向。
- badge 颜色语法：`**#hex 文本**`（`#` + 3/6/8 位 hex + 空格）；图标语法：标准 `**![](url)文本**`。
- 旧简历 styles 缺新字段时回退 `DEFAULT.STYLES` 默认值，无需迁移逻辑（store 初始即含默认值）。
- commit message 格式：`ACTION(MODULE): 中文描述`。
- 不提交 `test.md`、`playwright-report/`、`test-results/` 等临时/测试产物。

## File Structure

**创建：**
- `site/src/internal/markdown-it-badge/index.ts` — badge 渲染插件（core rule 识别 dt 内 strong）
- `site/src/composables/badge-icon/index.ts` — 图标上传/存储 composable
- `site/tests/unit/utils/css.test.ts` — DynamicCssService CSS 注入测试
- `site/tests/unit/composables/badge-icon.test.ts` — 图标存储逻辑测试（mock localforage）

**修改：**
- `site/nuxt.config.ts` — 加 `@cvgen/markdown-it-badge` alias
- `site/vitest.config.ts` — 加同款 alias
- `site/src/utils/markdown.ts` — 注册 badge 插件
- `site/src/composables/stores/style.ts` — `ResumeStyles` 加 7 个字段
- `site/src/composables/constant/variables/default.ts` — `DEFAULT_STYLES` 加默认值
- `site/src/utils/css.ts` — 拆分 themeColor + 新增 sectionBar/badge
- `site/src/components/editor/panels/AssetPanel.vue` — 加图标上传区块
- `site/src/components/editor/panels/AppearancePanel.vue` — 加颜色/色条/badge 控件
- `site/tests/unit/composables/markdown.test.ts` — 加 badge 渲染测试

---

### Task 1: badge 渲染插件（核心）

**Files:**
- Create: `site/src/internal/markdown-it-badge/index.ts`
- Modify: `site/nuxt.config.ts:64-74`
- Modify: `site/vitest.config.ts:39-51`
- Modify: `site/src/utils/markdown.ts:11-13, 155-170`
- Test: `site/tests/unit/composables/markdown.test.ts`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces: `MarkdownItBadge`（`PluginSimple`，default export）。渲染输出 `.resume-badge` / `.resume-badge-icon` / `.resume-badge-text` 结构，带可选内联 `style="--badge-color: #xxx"`。Task 2 的 CSS 依赖这些 class 名。

- [ ] **Step 1: 写失败测试**

在 `site/tests/unit/composables/markdown.test.ts` 的 `describe("MarkdownService", ...)` 块内（`plain MarkdownService` 那条测试之后）追加：

```ts
  it("renders bold dt as badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**Cooking Engineer Intern**
  ~ Microwavesoft
  ~ 2021`);
    expect(result).toContain('class="resume-badge"');
    expect(result).toContain("Cooking Engineer Intern");
    expect(result).toContain("Microwavesoft");
  });

  it("extracts #hex color prefix in badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**#377bb5 Microwavesoft**
  ~ 2021`);
    expect(result).toContain('--badge-color: #377bb5');
    expect(result).toContain("Microwavesoft");
    expect(result).not.toContain("#377bb5 Microwavesoft");
  });

  it("renders image icon in badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**![](logo.png)Company**
  ~ 2021`);
    expect(result).toContain('class="resume-badge-icon"');
    expect(result).toContain('src="logo.png"');
  });

  it("does not badge bold text outside dt", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**just bold** text here`);
    expect(result).not.toContain("resume-badge");
    expect(result).toContain("<strong>just bold</strong>");
  });

  it("does not treat non-hex # as color prefix", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**#1 Best**
  ~ 2021`);
    expect(result).not.toContain("--badge-color");
    expect(result).toContain("#1 Best");
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm test`
Expected: 5 条新用例 FAIL（`resume-badge` 未渲染；`**Cooking Engineer Intern**` 仍输出 `<strong>`）。

- [ ] **Step 3: 实现插件**

Create `site/src/internal/markdown-it-badge/index.ts`：

```ts
import type { PluginSimple, Token, Core } from "markdown-it";

type BadgeMeta = {
  color?: string;
  iconUrl?: string;
  text: string;
};

const COLOR_PREFIX = /^#([0-9a-fA-F]{3,8})\s+(.+)$/;

function parseBadge(children: Token[]): BadgeMeta | null {
  let strongStart = -1;
  let strongEnd = -1;
  for (let i = 0; i < children.length; i++) {
    if (children[i].type === "strong_open") strongStart = i;
    else if (children[i].type === "strong_close") {
      strongEnd = i;
      break;
    }
  }
  if (strongStart === -1 || strongEnd === -1) return null;

  let text = "";
  let iconUrl: string | undefined;
  for (let i = strongStart + 1; i < strongEnd; i++) {
    const t = children[i];
    if (t.type === "text" || t.type === "code_inline") text += t.content;
    else if (t.type === "image") {
      const src = t.attrGet("src");
      if (src) iconUrl = src;
    }
  }

  let color: string | undefined;
  const m = text.match(COLOR_PREFIX);
  if (m) {
    color = `#${m[1]}`;
    text = m[2];
  }

  return { color, iconUrl, text };
}

const processBadges: Core.RuleCore = (state) => {
  const tokens = state.tokens;
  let inDt = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "dt_open") {
      inDt = true;
      continue;
    }
    if (t.type === "dt_close") {
      inDt = false;
      continue;
    }
    if (!inDt || t.type !== "inline") continue;

    const meta = parseBadge(t.children ?? []);
    if (!meta) continue;

    const token = new state.Token("badge", "", 0);
    token.meta = meta;
    token.content = meta.text;
    t.children = [token];
  }
  return true;
};

export const MarkdownItBadge: PluginSimple = (md) => {
  md.core.ruler.after("inline", "badge", processBadges);

  md.renderer.rules.badge = (tokens, idx) => {
    const { color, iconUrl, text } = tokens[idx].meta as BadgeMeta;
    const style = color ? ` style="--badge-color: ${color}"` : "";
    const img = iconUrl
      ? `<img class="resume-badge-icon" src="${iconUrl}" alt="" />`
      : "";
    return `<span class="resume-badge"${style}>${img}<span class="resume-badge-text">${md.utils.escapeHtml(text)}</span></span>`;
  };
};

export default MarkdownItBadge;
```

- [ ] **Step 4: 加 alias 并注册插件**

在 `site/nuxt.config.ts` 的 alias 对象（第 64-74 行）加一行：

```ts
        "@cvgen/markdown-it-badge": resolve(__dirname, "src/internal/markdown-it-badge"),
```

在 `site/vitest.config.ts` 的 alias 对象（第 39-51 行）加一行：

```ts
      "@cvgen/markdown-it-badge": resolve(__dirname, "src/internal/markdown-it-badge"),
```

在 `site/src/utils/markdown.ts`：
- import 区（第 12 行 `MarkdownItCite` 附近）加：

```ts
import MarkdownItBadge from "@cvgen/markdown-it-badge";
```

- 插件数组（第 155-170 行）在 `MarkdownItDeflist` 之后加 `MarkdownItBadge`：

```ts
  plugins: [
    MarkdownItDeflist,
    MarkdownItBadge,
    MarkdownItKatex,
    MarkdownItCite,
    MarkdownItLatexCmds,
    [
      LinkAttributes,
      // ...其余不变
    ]
  ],
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd site && pnpm test`
Expected: 全部 PASS（含 5 条新 badge 用例与原有用例）。

- [ ] **Step 6: Commit**

```bash
git add site/src/internal/markdown-it-badge/index.ts site/nuxt.config.ts site/vitest.config.ts site/src/utils/markdown.ts site/tests/unit/composables/markdown.test.ts
git commit -m "feat(markdown): 添加经历条 badge 渲染插件"
```

---

### Task 2: 样式字段 + 默认值 + 动态 CSS

**Files:**
- Modify: `site/src/composables/stores/style.ts:4-15`
- Modify: `site/src/composables/constant/variables/default.ts:4-20`
- Modify: `site/src/utils/css.ts:24-98`
- Test: `site/tests/unit/utils/css.test.ts`（新建）

**Interfaces:**
- Consumes: Task 1 产出的 `.resume-badge` / `.resume-badge-icon` class 名。
- Produces: `ResumeStyles` 新增字段 `headingColor` / `linkColor` / `sectionBarColor` / `sectionBarOpacity` / `sectionBarEnabled` / `badgeColor` / `badgeOpacity`（均为 Task 4 面板与 `dynamicCssService.injectToolbar` 依赖）。

- [ ] **Step 1: 写失败测试**

Create `site/tests/unit/utils/css.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { dynamicCssService } from "~/utils/css";
import type { ResumeStyles } from "~/composables/stores/style";

const baseStyles: ResumeStyles = {
  marginV: 50,
  marginH: 45,
  contentWidth: 100,
  lineHeight: 1.3,
  paragraphSpace: 5,
  themeColor: "#377bb5",
  headingColor: "#111111",
  linkColor: "#222222",
  sectionBarColor: "#333333",
  sectionBarOpacity: 0.5,
  sectionBarEnabled: true,
  badgeColor: "#444444",
  badgeOpacity: 0.2,
  fontCJK: { name: "HKST", fontFamily: "HKST" },
  fontEN: { name: "Minion Pro" },
  fontSize: 15,
  paper: "A4"
};

const getCss = () => {
  const el = document.querySelector('[data-dynamic-css-id="cvgen-toolbar-preview"]');
  return el?.textContent ?? "";
};

describe("DynamicCssService", () => {
  it("injects heading and link colors", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain("h1, #resume-preview h2, #resume-preview h3 { color: #111111; }");
    expect(css).toContain("color: #222222;");
  });

  it("injects section bar CSS when enabled", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain("color-mix(in srgb, #333333 50%, transparent)");
    expect(css).toContain("border-bottom-style: none;");
  });

  it("skips section bar when disabled", () => {
    dynamicCssService.injectToolbar({ ...baseStyles, sectionBarEnabled: false });
    const css = getCss();
    expect(css).not.toContain("#333333");
  });

  it("injects badge styles with default vars", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain(".resume-badge");
    expect(css).toContain("--badge-color: #444444");
    expect(css).toContain("--badge-opacity: 20%");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm test tests/unit/utils/css.test.ts`
Expected: FAIL — `ResumeStyles` 类型缺少新字段导致 `baseStyles` 对象类型报错（TS 编译失败）。

- [ ] **Step 3: 扩展 ResumeStyles 类型**

在 `site/src/composables/stores/style.ts` 的 `ResumeStyles` 类型（第 4-15 行）`themeColor` 之后加：

```ts
  headingColor: string;
  linkColor: string;
  sectionBarColor: string;
  sectionBarOpacity: number;
  sectionBarEnabled: boolean;
  badgeColor: string;
  badgeOpacity: number;
```

- [ ] **Step 4: 加默认值**

在 `site/src/composables/constant/variables/default.ts` 的 `DEFAULT_STYLES`（第 4-20 行）`themeColor: "#377bb5",` 之后加：

```ts
  headingColor: "#377bb5",
  linkColor: "#377bb5",
  sectionBarColor: "#377bb5",
  sectionBarOpacity: 0.12,
  sectionBarEnabled: false,
  badgeColor: "#377bb5",
  badgeOpacity: 0.15,
```

- [ ] **Step 5: 重构 DynamicCssService**

在 `site/src/utils/css.ts` 中，将 `themeColor` 方法（第 24-30 行）替换为 `headingColor` + `linkColor`，并新增 `sectionBar` 与 `badge`：

```ts
  private headingColor = (selector: string, styles: ResumeStyles) => {
    return (
      `${selector} h1, ${selector} h2, ${selector} h3 { color: ${styles.headingColor}; }` +
      `${selector} h2 { border-bottom-color: ${styles.headingColor}; }`
    );
  };

  private linkColor = (selector: string, styles: ResumeStyles) => {
    return `${selector} :not(.resume-header-item) > a { color: ${styles.linkColor}; }`;
  };

  private sectionBar = (selector: string, styles: ResumeStyles) => {
    if (!styles.sectionBarEnabled) return "";
    const opacity = (styles.sectionBarOpacity * 100).toFixed(0);
    return (
      `${selector} h2 { ` +
      `background: color-mix(in srgb, ${styles.sectionBarColor} ${opacity}%, transparent); ` +
      `padding: 2px 8px; border-radius: 4px; border-bottom-style: none; }`
    );
  };

  private badge = (selector: string, styles: ResumeStyles) => {
    const opacity = (styles.badgeOpacity * 100).toFixed(0);
    return (
      `${selector} .resume-badge { ` +
      `--badge-color: ${styles.badgeColor}; --badge-opacity: ${opacity}%; ` +
      `display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; ` +
      `border-radius: 4px; ` +
      `background: color-mix(in srgb, var(--badge-color) var(--badge-opacity), transparent); ` +
      `color: var(--badge-color); font-weight: bold; }` +
      `${selector} .resume-badge-icon { width: 16px; height: 16px; object-fit: contain; flex-shrink: 0; }`
    );
  };
```

将 `injectToolbar`（第 84-98 行）的 `css` 拼接改为：

```ts
    const css =
      this.headerLayout(selector) +
      this.fontFamily(selector, styles) +
      this.fontSize(selector, styles) +
      this.headingColor(selector, styles) +
      this.linkColor(selector, styles) +
      this.sectionBar(selector, styles) +
      this.badge(selector, styles) +
      this.paragraphSpace(selector, styles) +
      this.lineHeight(selector, styles) +
      (id === undefined ? this.paperSize(styles) : "");
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd site && pnpm test`
Expected: 全部 PASS（含 css.test.ts 4 条与 Task 1 的 badge 用例）。

- [ ] **Step 7: Commit**

```bash
git add site/src/composables/stores/style.ts site/src/composables/constant/variables/default.ts site/src/utils/css.ts site/tests/unit/utils/css.test.ts
git commit -m "feat(style): 添加多强调色、标题色条与 badge 样式"
```

---

### Task 3: 图标上传通道

**Files:**
- Create: `site/src/composables/badge-icon/index.ts`
- Modify: `site/src/components/editor/panels/AssetPanel.vue`
- Test: `site/tests/unit/composables/badge-icon.test.ts`（新建，mock localforage，仅测存储逻辑）

**Interfaces:**
- Consumes: 无
- Produces: `useBadgeIcon()` 返回 `{ icons, init, upload, remove, insert }`。`icons: Ref<Array<{ id: string; url: string }>>`；`upload(file: File): Promise<void>`；`remove(id: string): Promise<void>`；`insert(url: string): string`（返回 `![](${url})` markdown 片段）。

- [ ] **Step 1: 写失败测试（存储逻辑）**

Create `site/tests/unit/composables/badge-icon.test.ts`：

```ts
import { describe, it, expect, vi } from "vitest";

const storeItems = new Map<string, string>();
vi.mock("localforage", () => {
  const instance = {
    getItem: vi.fn((key: string) => Promise.resolve(storeItems.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      storeItems.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      storeItems.delete(key);
      return Promise.resolve();
    }),
    keys: vi.fn(() => Promise.resolve([...storeItems.keys()])),
    createInstance: vi.fn(function () {
      return instance;
    }),
  };
  return { ...instance, default: instance, __esModule: true };
});

import { useBadgeIcon } from "~/composables/badge-icon";

describe("useBadgeIcon", () => {
  it("insert returns markdown image snippet", () => {
    const { insert } = useBadgeIcon();
    expect(insert("data:image/png;base64,abc")).toBe("![](data:image/png;base64,abc)");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm test tests/unit/composables/badge-icon.test.ts`
Expected: FAIL — `~/composables/badge-icon` 模块不存在。

- [ ] **Step 3: 实现 useBadgeIcon**

Create `site/src/composables/badge-icon/index.ts`：

```ts
import localforage from "localforage";

type BadgeIcon = { id: string; url: string };

const INSTANCE_NAME = "cvgen_badge_icons";

function getStore(): LocalForage {
  return localforage.createInstance({ name: INSTANCE_NAME });
}

function compressIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 256;
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to decode icon image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read icon file"));
    reader.readAsDataURL(file);
  });
}

const icons = ref<BadgeIcon[]>([]);

export const useBadgeIcon = () => {
  const init = async () => {
    try {
      const store = getStore();
      const keys = await store.keys();
      const entries: BadgeIcon[] = [];
      for (const key of keys) {
        const url = await store.getItem<string>(key);
        if (url) entries.push({ id: key, url });
      }
      icons.value = entries;
    } catch (error) {
      console.error("Failed to load badge icons:", error);
      icons.value = [];
    }
  };

  const upload = async (file: File) => {
    const url = await compressIcon(file);
    const id = `icon_${Date.now()}`;
    await getStore().setItem(id, url);
    icons.value = [...icons.value, { id, url }];
  };

  const remove = async (id: string) => {
    await getStore().removeItem(id);
    icons.value = icons.value.filter((i) => i.id !== id);
  };

  const insert = (url: string) => `![](${url})`;

  return { icons, init, upload, remove, insert };
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd site && pnpm test tests/unit/composables/badge-icon.test.ts`
Expected: PASS（`insert` 用例通过）。

- [ ] **Step 5: AssetPanel 加图标上传区块**

在 `site/src/components/editor/panels/AssetPanel.vue` 中：
- `<script lang="ts" setup>` 内加：

```ts
import { useBadgeIcon } from "~/composables/badge-icon";

const { icons, init: initIcons, upload: uploadIcon, remove: removeIcon, insert } = useBadgeIcon();
const iconInput = ref<HTMLInputElement>();

onMounted(() => {
  init();
  initIcons();
});

const onIconUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await uploadIcon(file);
  } finally {
    input.value = "";
  }
};

const onIconRemove = (id: string) => removeIcon(id);
```

- `<template>` 在「头像照片」区块之后加：

```vue
    <div>
      <div class="panel-label">经历条图标</div>
      <div class="flex items-center gap-2 mt-2">
        <label
          class="cursor-pointer inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-dashed hover:bg-accent transition-colors border-border"
        >
          <span i-lucide:upload class="size-3.5 shrink-0" />
          <span>上传图标</span>
          <input ref="iconInput" type="file" accept="image/*,.ico" class="hidden" @change="onIconUpload" />
        </label>
      </div>
      <div v-if="icons.length" class="flex flex-wrap gap-2 mt-2">
        <div v-for="icon in icons" :key="icon.id" class="group relative">
          <img :src="icon.url" class="size-10 object-contain rounded border border-border" />
          <button
            class="absolute -top-1 -right-1 hidden group-hover:block size-4 rounded-full bg-destructive text-white text-[10px] leading-none"
            @click="onIconRemove(icon.id)"
          >
            ×
          </button>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mt-1">
        在 markdown 中用 <code>**![](data:...)公司名**</code> 引用图标，或用外链 <code>**![](https://...)公司名**</code>。
      </p>
    </div>
```

- [ ] **Step 6: 手动验证**

Run: `cd site && pnpm dev`，浏览器打开编辑器 → FloatingPanel → Asset Tab，上传一张 png/ico，确认缩略图出现、可删除。

- [ ] **Step 7: Commit**

```bash
git add site/src/composables/badge-icon/index.ts site/src/components/editor/panels/AssetPanel.vue site/tests/unit/composables/badge-icon.test.ts
git commit -m "feat(asset): 添加经历条图标上传通道"
```

---

### Task 4: Appearance 面板控件

**Files:**
- Modify: `site/src/components/editor/panels/AppearancePanel.vue`

**Interfaces:**
- Consumes: Task 2 产出的 `ResumeStyles` 新字段 + `useStyleHistory().execute`（已存在）+ `SharedUiSlider`（已存在）。
- Produces: 用户可配置 `headingColor` / `linkColor` / `sectionBarColor` / `sectionBarOpacity` / `sectionBarEnabled` / `badgeColor` / `badgeOpacity`。

- [ ] **Step 1: 扩展脚本逻辑**

在 `site/src/components/editor/panels/AppearancePanel.vue` 的 `<script lang="ts" setup>` 中，将「Theme color」machine 段（原第 98-108 行，即 `// Theme color` 到 `const api = computed(...)` 那一行，`const toHex` 定义除外）整体替换为：

```ts
// Theme color
type ColorKey = "themeColor" | "headingColor" | "linkColor" | "sectionBarColor" | "badgeColor";

const toHex = (value: colorPicker.Color) =>
  "#" + value.toHexInt().toString(16).toUpperCase().padStart(6, "0");

const createColorField = (key: ColorKey) => {
  const [state, send] = useMachine(
    colorPicker.machine({
      id: `${key}-floating`,
      value: colorPicker.parse(styles[key]),
      onValueChange: (details) => {
        execute(key, styles[key], toHex(details.value));
      },
    })
  );
  const api = computed(() => colorPicker.connect(state.value, send, normalizeProps));
  return api;
};

const themeApi = createColorField("themeColor");
const headingApi = createColorField("headingColor");
const linkApi = createColorField("linkColor");
const sectionBarApi = createColorField("sectionBarColor");
const badgeApi = createColorField("badgeColor");
```

注意：原脚本里已有一处 `const toHex = ...`（原第 109-110 行），替换时须将其一并删除，只保留上面这一段里的 `toHex` 定义，避免重复声明。`ColorKey` 限定了颜色字段，使 `styles[key]` 推断为 `string`，`execute` 与 `colorPicker.parse` 的类型均正确，无需 `as string` 强转。

在脚本末尾追加透明度 slider 与开关逻辑：

```ts
const sectionBarOpacityValue = ref([styles.sectionBarOpacity * 100]);
const onSectionBarOpacityChange = (value: number[] | undefined) => {
  if (!value) return;
  sectionBarOpacityValue.value = value;
  execute("sectionBarOpacity", styles.sectionBarOpacity, value.at(0)! / 100);
};

const onSectionBarToggle = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  execute("sectionBarEnabled", styles.sectionBarEnabled, checked);
};

const badgeOpacityValue = ref([styles.badgeOpacity * 100]);
const onBadgeOpacityChange = (value: number[] | undefined) => {
  if (!value) return;
  badgeOpacityValue.value = value;
  execute("badgeOpacity", styles.badgeOpacity, value.at(0)! / 100);
};
```

- [ ] **Step 2: 扩展模板**

在 `site/src/components/editor/panels/AppearancePanel.vue` 的 `<template>` 中：

1. 将原「Theme Color」区块内所有 `api.` 引用改为 `themeApi.`（`api.setValue` → `themeApi.setValue`、`api.value` → `themeApi.value`、`api.getRootProps/getControlProps/getTriggerProps/getSwatchProps/getChannelInputProps` → `themeApi.*`）。
2. 在「Theme Color」区块的 `</div>`（即原第 33 行，主题色控件的闭合 div）之后、第一个 `<div class="border-t border-border/50 my-2" />` 分隔线之前，插入以下区块（此区块自身以 `<div class="space-y-3">` 开头，分隔线沿用上面已有的那条）：

```vue
    <!-- Heading & Link Colors -->
    <div class="space-y-3">
      <div>
        <div class="panel-label">标题色</div>
        <div v-bind="headingApi.getRootProps()" class="relative mt-2">
          <div v-bind="headingApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="headingApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="headingApi.getSwatchProps({ value: headingApi.value })" />
            </button>
            <input v-bind="headingApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
      </div>
      <div>
        <div class="panel-label">链接色</div>
        <div v-bind="linkApi.getRootProps()" class="relative mt-2">
          <div v-bind="linkApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="linkApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="linkApi.getSwatchProps({ value: linkApi.value })" />
            </button>
            <input v-bind="linkApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
      </div>
      <div>
        <div class="panel-label">经历条默认色</div>
        <div v-bind="badgeApi.getRootProps()" class="relative mt-2">
          <div v-bind="badgeApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="badgeApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="badgeApi.getSwatchProps({ value: badgeApi.value })" />
            </button>
            <input v-bind="badgeApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
        <div class="mt-2">
          <SharedUiSlider unit="%" :model-value="badgeOpacityValue" :min="0" :max="100" @update:model-value="onBadgeOpacityChange" />
        </div>
      </div>
      <div>
        <div class="panel-label">标题色条</div>
        <label class="flex items-center gap-2 text-sm mt-2 cursor-pointer">
          <input type="checkbox" :checked="styles.sectionBarEnabled" @change="onSectionBarToggle" />
          显示标题色条
        </label>
        <div v-bind="sectionBarApi.getRootProps()" class="relative mt-2">
          <div v-bind="sectionBarApi.getControlProps()" class="w-full h-8 hstack gap-x-2 px-2 rounded border text-sm transition-colors border-border">
            <button v-bind="sectionBarApi.getTriggerProps()" class="size-3.5 rounded-full overflow-hidden shrink-0">
              <div class="size-full" v-bind="sectionBarApi.getSwatchProps({ value: sectionBarApi.value })" />
            </button>
            <input v-bind="sectionBarApi.getChannelInputProps({ channel: 'hex' })" class="bg-transparent outline-none flex-1 text-xs min-w-0" />
          </div>
        </div>
        <div class="mt-2">
          <SharedUiSlider unit="%" :model-value="sectionBarOpacityValue" :min="0" :max="100" @update:model-value="onSectionBarOpacityChange" />
        </div>
      </div>
    </div>
```

- [ ] **Step 3: 类型检查与 lint**

Run: `cd site && pnpm lint`
Expected: 无新增错误。若有 color-picker 类型问题，确认 `createColorField` 返回类型与 `api` 一致（`computed` 的 value 类型为 `colorPicker.Api`）。

- [ ] **Step 4: 手动验证**

Run: `cd site && pnpm dev`，编辑器 → Appearance Tab：切换标题色/链接色/badge 色/标题色条颜色与透明度，预览区实时变化；开启「显示标题色条」后 h2 出现半透明色块；标题色条透明度 slider 拖动生效。

- [ ] **Step 5: Commit**

```bash
git add site/src/components/editor/panels/AppearancePanel.vue
git commit -m "feat(editor): Appearance 面板添加 fancy 样式控件"
```

---

### Task 5: 收尾 — 提交前置改动并 push 部署

**Files:**
- 前置未提交改动（front-matter 错误提示功能，已完成且有测试）
- `.gitignore`（如需忽略测试产物）

**Interfaces:**
- Consumes: Task 1-4 全部完成、`pnpm test` 与 `pnpm build` 通过。

- [ ] **Step 1: 全量验证**

Run: `cd site && pnpm test && pnpm build`
Expected: 单测全绿；`nuxt generate` 构建成功。

- [ ] **Step 2: 检查 .gitignore 是否忽略测试产物**

Run: `git status --short`
- 若 `site/playwright-report/`、`site/test-results/`、`test-results/`、`test.md` 仍显示为 untracked，确认 `.gitignore` 是否需补充。不提交这些产物与 `test.md`（`test.md` 为临时文件，直接删除：`rm -f test.md`）。

- [ ] **Step 3: 提交前置 front-matter 改动**

Run:
```bash
git add site/src/components/editor/panels/FilePanel.vue site/src/components/shared/ResumeRender.vue site/src/composables/constant/variables/default.ts site/src/composables/toast.ts site/src/internal/front-matter/front-matter.ts site/src/utils/markdown.ts site/tests/unit/composables/markdown.test.ts
git commit -m "feat(front-matter): 解析失败时 toast 提示并回退上次正确内容"
```

- [ ] **Step 4: push 触发部署**

Run: `git push origin main`
Expected: push 成功，GitHub Actions 触发 `nuxt generate` 部署到 GitHub Pages。

- [ ] **Step 5: 确认部署结果**

等待 GitHub Pages 部署完成后，浏览器访问 `https://<user>.github.io/cv-gen/`（或仓库 Pages URL），确认 fancy 样式功能上线。
