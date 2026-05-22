# 简历编辑器功能扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 Markdown 简历编辑器新增五个功能模块：DOCX 导出、图片资产管理、AI 简历生成与优化、智能图标搜索、Git 版本管理。

**Architecture:** 每个模块作为独立 composable，遵循现有模式（`composables/xxx/index.ts`）。ExportService 已有 register 机制，DOCX 直接注册新 handler。AI/图标/Git 均为纯浏览器端实现（isomorphic-git 解决静态部署）。图片资产复用 localForage 存储。

**Tech Stack:** Vue 3 Composition API, Nuxt 3, TypeScript, docx (npm), isomorphic-git + lightning-fs, Iconify API, OpenAI/Anthropic SDK

**实施顺序:** P0 (导出+图片) → P1 (AI+图标) → P2 (Git)

---

## 文件结构总览

```
site/src/
├── utils/export/
│   └── docx.ts                          # CREATE: DOCX 导出处理器
├── composables/
│   ├── index.ts                         # MODIFY: 导出新 composable
│   ├── asset/
│   │   └── index.ts                     # CREATE: useAsset
│   ├── ai/
│   │   ├── index.ts                     # CREATE: useAI
│   │   ├── prompts.ts                   # CREATE: prompt 模板
│   │   └── providers/
│   │       ├── types.ts                 # CREATE: LLMProvider 接口
│   │       ├── openai.ts               # CREATE: OpenAI provider
│   │       └── anthropic.ts            # CREATE: Anthropic provider
│   ├── icon/
│   │   ├── index.ts                     # CREATE: useIcon
│   │   └── providers/
│   │       └── iconify.ts              # CREATE: IconifyProvider
│   └── git/
│       ├── index.ts                     # CREATE: useGit
│       └── gitops.ts                   # CREATE: Git 核心操作
├── components/editor/
│   ├── toolbar/file/
│   │   └── Export.vue                   # MODIFY: 添加 DOCX 按钮
│   ├── ai/
│   │   └── AIPanel.vue                  # CREATE: AI 面板（含两个 tab）
│   ├── icon/
│   │   └── IconPicker.vue              # CREATE: 图标搜索选择器
│   ├── asset/
│   │   └── AssetManager.vue            # CREATE: 图片管理
│   └── git/
│       ├── GitSettings.vue             # CREATE: Git 配置
│       └── GitHistory.vue              # CREATE: 版本历史
└── package.json                         # MODIFY: 添加依赖
```

---

## Phase 0: 导出引擎 + DOCX 导出 (P0)

### Task 1: 安装 docx 依赖

- [ ] **Step 1: 添加 docx 包**

```bash
cd site && pnpm add docx
```

### Task 2: 创建 DOCX 导出处理器

**Files:**
- Create: `site/src/utils/export/docx.ts`

- [ ] **Step 1: 实现 DocxHandler**

```ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ExportHandler } from "./index";

export const docxHandler: ExportHandler = async (ctx) => {
  const children: Paragraph[] = [];

  // 解析 HTML 为段落结构
  const parser = new DOMParser();
  const doc = parser.parseFromString(ctx.html, "text/html");
  const body = doc.body;

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: text.trim() })]
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    switch (tag) {
      case "H1":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: el.textContent ?? "", color: ctx.styles.themeColor })]
          })
        );
        break;
      case "H2":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: el.textContent ?? "", color: ctx.styles.themeColor })]
          })
        );
        break;
      case "H3":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: el.textContent ?? "", color: ctx.styles.themeColor })]
          })
        );
        break;
      case "P":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: el.textContent ?? "" })]
          })
        );
        break;
      case "UL":
      case "OL":
        el.childNodes.forEach((li) => {
          if (li.nodeType === Node.ELEMENT_NODE && (li as HTMLElement).tagName === "LI") {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: li.textContent ?? "" })],
                bullet: { level: 0 }
              })
            );
          }
        });
        break;
      default:
        el.childNodes.forEach(processNode);
    }
  }

  body.childNodes.forEach(processNode);

  const docx = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: ctx.styles.fontEN.name,
            size: ctx.styles.fontSize * 2 // docx uses half-points
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: ctx.styles.paper === "a4" ? 11906 : 12240, // twips
              height: ctx.styles.paper === "a4" ? 16838 : 15840
            },
            margin: {
              top: ctx.styles.marginV * 56.7, // px → twips approx
              bottom: ctx.styles.marginV * 56.7,
              left: ctx.styles.marginH * 56.7,
              right: ctx.styles.marginH * 56.7
            }
          }
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(docx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ctx.name}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### Task 3: 注册 DOCX handler

**Files:**
- Modify: `site/src/utils/export/handlers.ts`

- [ ] **Step 1: 在 registerExportHandlers 中添加 docx 注册**

在 `site/src/utils/export/handlers.ts` 中添加 import 和注册行：

```ts
import { docxHandler } from "./docx";

// 在 registerExportHandlers() 中添加：
exportService.register("docx", docxHandler);
```

### Task 4: Export.vue 添加 DOCX 按钮

**Files:**
- Modify: `site/src/components/editor/toolbar/file/Export.vue`

- [ ] **Step 1: 在 HTML 导出按钮后添加 DOCX 按钮**

```vue
<UiButton
  class="gap-x-1.5 w-full h-8 justify-start"
  variant="ghost"
  size="sm"
  @click="doExport('docx')"
>
  <span i-mdi:file-word text-base />
  {{ $t("toolbar.file.export_docx") }}
</UiButton>
```

- [ ] **Step 2: 验证导出**

```bash
pnpm dev
# 打开编辑器，点击 File → DOCX，确认 .docx 文件下载成功且内容正确
```

---

## Phase 1: 图片资产管理 (P0)

### Task 5: 创建 useAsset composable

**Files:**
- Create: `site/src/composables/asset/index.ts`

- [ ] **Step 1: 实现 useAsset**

```ts
import localforage from "localforage";

export interface AssetInfo {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

const assetStore = localforage.createInstance({
  name: "ohmycv_assets"
});

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function compressImage(file: File): Promise<AssetInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        const id = generateId();
        resolve({
          id,
          name: file.name,
          base64,
          mimeType: "image/jpeg",
          width,
          height,
          size: base64.length
        });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useAsset = () => {
  const uploadImage = async (file: File): Promise<AssetInfo> => {
    const asset = await compressImage(file);
    const assets = await getAssets();
    assets.push(asset);
    await assetStore.setItem("assets", assets);
    return asset;
  };

  const getAssets = async (): Promise<AssetInfo[]> => {
    const data = await assetStore.getItem<AssetInfo[]>("assets");
    return data ?? [];
  };

  const deleteAsset = async (id: string): Promise<void> => {
    const assets = await getAssets();
    await assetStore.setItem(
      "assets",
      assets.filter((a) => a.id !== id)
    );
  };

  const insertImageRef = (asset: AssetInfo) => {
    const { setContent } = useMonaco();
    const { data } = useDataStore();
    const mdRef = `![${asset.name}](${asset.base64})`;
    setContent("markdown", data.markdown + "\n" + mdRef);
  };

  return { uploadImage, getAssets, deleteAsset, insertImageRef };
};
```

- [ ] **Step 2: 从 composables/index.ts 导出**

```ts
export { useAsset } from "./asset";
```

### Task 6: 创建 AssetManager UI 组件

**Files:**
- Create: `site/src/components/editor/asset/AssetManager.vue`

- [ ] **Step 1: 实现图片管理面板**

```vue
<template>
  <div class="p-3">
    <div class="flex items-center gap-2 mb-3">
      <label
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-dashed hover:bg-accent"
      >
        <span i-lucide:upload />
        {{ $t("asset.upload") }}
        <input type="file" accept="image/*" class="hidden" @change="onUpload" />
      </label>
    </div>

    <div v-if="assets.length === 0" class="text-sm text-muted-foreground text-center py-4">
      {{ $t("asset.empty") }}
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="asset in assets"
        :key="asset.id"
        class="group relative border rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
        @click="insert(asset)"
      >
        <img :src="asset.base64" :alt="asset.name" class="w-full h-20 object-cover" />
        <div class="p-1 text-xs truncate">{{ asset.name }}</div>
        <button
          class="absolute top-0.5 right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground flex-center opacity-0 group-hover:opacity-100"
          @click.stop="remove(asset.id)"
        >
          <span i-lucide:x class="size-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAsset, type AssetInfo } from "~/composables/asset";

const { uploadImage, getAssets, deleteAsset, insertImageRef } = useAsset();
const assets = ref<AssetInfo[]>([]);

onMounted(async () => {
  assets.value = await getAssets();
});

const onUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const asset = await uploadImage(file);
  assets.value.push(asset);
};

const remove = async (id: string) => {
  await deleteAsset(id);
  assets.value = assets.value.filter((a) => a.id !== id);
};

const insert = (asset: AssetInfo) => {
  insertImageRef(asset);
};
</script>
```

### Task 7: 将 AssetManager 集成到工具栏

**Files:**
- Modify: `site/src/components/editor/toolbar/index.vue`

- [ ] **Step 1: 在 tools 数组中添加 asset 工具项**

```ts
{
  id: "asset",
  icon: "i-lucide:image",
  component: EditorToolbarAsset
}
```

- [ ] **Step 2: 创建工具栏包装组件**

创建 `site/src/components/editor/toolbar/Asset.vue`：

```vue
<template>
  <EditorToolbarBox :text="$t('toolbar.asset.title')" icon="i-lucide:image">
    <EditorAssetManager />
  </EditorToolbarBox>
</template>
```

### Task 8: 验证图片功能

- [ ] **Step 1: 运行并测试**

```bash
pnpm dev
# 1. 打开编辑器，在工具栏找到图片工具
# 2. 上传一张图片
# 3. 点击图片，确认 Markdown 图片引用插入到编辑器
# 4. 预览中确认图片正常显示
```

---

## Phase 2: AI 服务 (P1)

### Task 9: 定义 LLM Provider 接口

**Files:**
- Create: `site/src/composables/ai/providers/types.ts`

- [ ] **Step 1: 实现接口定义**

```ts
export interface LLMMessage {
  role: "system" | "user";
  content: string;
}

export interface LLMStreamChunk {
  content: string;
}

export interface LLMProvider {
  readonly id: string;
  readonly label: string;
  chat(messages: LLMMessage[]): Promise<string>;
  chatStream(messages: LLMMessage[], onChunk: (chunk: LLMStreamChunk) => void): Promise<void>;
}
```

### Task 10: 实现 OpenAI Provider

**Files:**
- Create: `site/src/composables/ai/providers/openai.ts`

- [ ] **Step 1: 实现 OpenAI provider**

```ts
import type { LLMProvider, LLMMessage, LLMStreamChunk } from "./types";

export class OpenAIProvider implements LLMProvider {
  readonly id = "openai";
  readonly label = "OpenAI";
  private _apiKey: string;
  private _baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.openai.com/v1") {
    this._apiKey = apiKey;
    this._baseUrl = baseUrl;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.choices[0].message.content;
  }

  async chatStream(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamChunk) => void
  ): Promise<void> {
    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        stream: true
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) onChunk({ content });
        } catch {
          // skip incomplete JSON
        }
      }
    }
  }
}
```

### Task 11: 实现 Anthropic Provider

**Files:**
- Create: `site/src/composables/ai/providers/anthropic.ts`

- [ ] **Step 1: 实现 Anthropic provider**

```ts
import type { LLMProvider, LLMMessage, LLMStreamChunk } from "./types";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  readonly label = "Anthropic";
  private _apiKey: string;

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role === "user");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this._apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: userMsgs.map((m) => ({ role: "user", content: m.content }))
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.content[0].text;
  }

  async chatStream(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamChunk) => void
  ): Promise<void> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role === "user");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this._apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: userMsgs.map((m) => ({ role: "user", content: m.content })),
        stream: true
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const json = JSON.parse(data);
          if (json.type === "content_block_delta") {
            onChunk({ content: json.delta.text });
          }
        } catch {
          // skip
        }
      }
    }
  }
}
```

### Task 12: 创建 Prompt 模板

**Files:**
- Create: `site/src/composables/ai/prompts.ts`

- [ ] **Step 1: 实现 prompt 模板**

```ts
export const PROMPTS = {
  generateFromDoc: (doc: string) => `You are a professional resume writer. Given the following project documentation, generate 3-5 resume bullet points that highlight achievements using the STAR method. Each bullet should include quantified results where possible. Output only the bullet points in Markdown format, one per line starting with "- ".

Project documentation:
${doc}`,

  optimizeFromJD: (jd: string, currentResume: string) => `You are a professional resume writer. Optimize the following resume content to better match the job description. Focus on:
1. Aligning keywords from the JD with the resume content
2. Rewriting weak bullet points to be more impactful (STAR method)
3. Adding quantified achievements where the JD suggests them
4. Do NOT fabricate experience - only rephrase and emphasize existing content

Job Description:
${jd}

Current Resume:
${currentResume}

Output the optimized resume in Markdown format. Only output the resume content, no explanations.`
};
```

### Task 13: 创建 useAI composable

**Files:**
- Create: `site/src/composables/ai/index.ts`

- [ ] **Step 1: 实现 useAI**

```ts
import type { LLMProvider } from "./providers/types";
import { OpenAIProvider } from "./providers/openai";
import { PROMPTS } from "./prompts";

export const useAI = () => {
  const loading = ref(false);
  const streamContent = ref("");
  const error = ref<string | null>(null);

  let _provider: LLMProvider | null = null;
  let _streamCallbacks: Array<(chunk: string) => void> = [];

  const configure = (provider: "openai" | "anthropic", apiKey: string) => {
    if (provider === "openai") {
      _provider = new OpenAIProvider(apiKey);
    } else {
      _provider = new AnthropicProvider(apiKey);
    }
  };

  const onStream = (cb: (chunk: string) => void) => {
    _streamCallbacks.push(cb);
  };

  const generateFromDoc = async (doc: string): Promise<string> => {
    if (!_provider) throw new Error("AI provider not configured");

    loading.value = true;
    error.value = null;
    streamContent.value = "";

    try {
      const messages = [
        { role: "user" as const, content: PROMPTS.generateFromDoc(doc) }
      ];

      let result: string;
      if (_provider.id === "openai" || _provider.id === "anthropic") {
        result = "";
        await _provider.chatStream(messages, (chunk) => {
          result += chunk.content;
          streamContent.value = result;
          _streamCallbacks.forEach((cb) => cb(chunk.content));
        });
      } else {
        result = await _provider.chat(messages);
        streamContent.value = result;
      }

      return result;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const optimizeFromJD = async (jd: string, currentMd: string): Promise<string> => {
    if (!_provider) throw new Error("AI provider not configured");

    loading.value = true;
    error.value = null;
    streamContent.value = "";

    try {
      const messages = [
        { role: "user" as const, content: PROMPTS.optimizeFromJD(jd, currentMd) }
      ];

      let result: string;
      if (_provider.id === "openai" || _provider.id === "anthropic") {
        result = "";
        await _provider.chatStream(messages, (chunk) => {
          result += chunk.content;
          streamContent.value = result;
          _streamCallbacks.forEach((cb) => cb(chunk.content));
        });
      } else {
        result = await _provider.chat(messages);
        streamContent.value = result;
      }

      return result;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const insertToEditor = (content: string) => {
    const { setContent } = useMonaco();
    const { data } = useDataStore();
    setContent("markdown", data.markdown + "\n" + content);
  };

  const replaceEditorContent = (content: string) => {
    const { setContent } = useMonaco();
    setContent("markdown", content);
  };

  return {
    configure,
    generateFromDoc,
    optimizeFromJD,
    insertToEditor,
    replaceEditorContent,
    onStream,
    loading,
    streamContent,
    error
  };
};
```

- [ ] **Step 2: 从 composables/index.ts 导出**

```ts
export { useAI } from "./ai";
```

### Task 14: 创建 AI 面板 UI

**Files:**
- Create: `site/src/components/editor/ai/AIPanel.vue`

- [ ] **Step 1: 实现 AI 面板**

```vue
<template>
  <div class="p-3">
    <!-- API 配置 -->
    <div v-if="!configured" class="mb-3 space-y-2">
      <select v-model="selectedProvider" class="w-full text-sm border rounded px-2 py-1 bg-background">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      <input
        v-model="apiKey"
        type="password"
        placeholder="API Key"
        class="w-full text-sm border rounded px-2 py-1 bg-background"
      />
      <UiButton size="sm" class="w-full" @click="doConfigure">
        {{ $t("ai.configure") }}
      </UiButton>
    </div>

    <!-- 功能 tabs -->
    <div v-else>
      <div class="flex border-b mb-3">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="text-sm px-3 py-1.5 border-b-2"
          :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 项目文档 → 简历片段 -->
      <div v-if="activeTab === 'generate'">
        <textarea
          v-model="docInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          :placeholder="$t('ai.generate_placeholder')"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !docInput.trim()"
          @click="doGenerate"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? $t("ai.generating") : $t("ai.generate") }}
        </UiButton>
      </div>

      <!-- JD 优化 -->
      <div v-if="activeTab === 'optimize'">
        <textarea
          v-model="jdInput"
          class="w-full h-32 text-sm border rounded p-2 bg-background resize-none"
          :placeholder="$t('ai.optimize_placeholder')"
        />
        <UiButton
          size="sm"
          class="w-full mt-2"
          :disabled="loading || !jdInput.trim()"
          @click="doOptimize"
        >
          <span v-if="loading" i-lucide:loader-2 class="animate-spin mr-1" />
          {{ loading ? $t("ai.optimizing") : $t("ai.optimize") }}
        </UiButton>
      </div>

      <!-- 流式输出预览 -->
      <div v-if="streamContent" class="mt-3 border rounded p-2 max-h-48 overflow-y-auto">
        <div class="text-xs text-muted-foreground mb-1">{{ $t("ai.preview") }}</div>
        <div class="text-sm whitespace-pre-wrap">{{ streamContent }}</div>
        <div class="flex gap-2 mt-2">
          <UiButton
            v-if="activeTab === 'generate'"
            size="xs"
            variant="outline"
            @click="doInsert"
          >
            {{ $t("ai.insert") }}
          </UiButton>
          <UiButton
            v-if="activeTab === 'optimize'"
            size="xs"
            variant="outline"
            @click="doReplace"
          >
            {{ $t("ai.replace") }}
          </UiButton>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="mt-2 text-xs text-destructive">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { useAI } = await import("~/composables/ai");
const ai = useAI();

const configured = ref(false);
const selectedProvider = ref<"openai" | "anthropic">("openai");
const apiKey = ref("");
const activeTab = ref<"generate" | "optimize">("generate");
const docInput = ref("");
const jdInput = ref("");
const { loading, streamContent, error } = ai;

const tabs = [
  { id: "generate", label: "Generate" },
  { id: "optimize", label: "Optimize" }
];

const doConfigure = () => {
  ai.configure(selectedProvider.value, apiKey.value);
  configured.value = true;
};

const doGenerate = async () => {
  try {
    await ai.generateFromDoc(docInput.value);
  } catch {}
};

const doOptimize = async () => {
  try {
    const { data } = useDataStore();
    await ai.optimizeFromJD(jdInput.value, data.markdown);
  } catch {}
};

const doInsert = () => {
  ai.insertToEditor(streamContent.value);
  streamContent.value = "";
  docInput.value = "";
};

const doReplace = () => {
  ai.replaceEditorContent(streamContent.value);
  streamContent.value = "";
  jdInput.value = "";
};
</script>
```

### Task 15: 集成 AI 面板到工具栏

**Files:**
- Modify: `site/src/components/editor/toolbar/index.vue`

- [ ] **Step 1: 在 tools 数组中添加 ai 工具项**

```ts
{
  id: "ai",
  icon: "i-lucide:sparkles",
  component: EditorToolbarAI
}
```

- [ ] **Step 2: 创建工具栏包装组件**

创建 `site/src/components/editor/toolbar/Ai.vue`：

```vue
<template>
  <EditorToolbarBox :text="$t('toolbar.ai.title')" icon="i-lucide:sparkles">
    <EditorAIPanel />
  </EditorToolbarBox>
</template>
```

### Task 16: 验证 AI 功能

- [ ] **Step 1: 运行并测试**

```bash
pnpm dev
# 1. 打开编辑器，找到 AI 工具
# 2. 输入 OpenAI API Key 并配置
# 3. 粘贴一段项目文档，点击生成，验证流式输出
# 4. 点击插入，确认内容进入编辑器
# 5. 切换到优化 tab，粘贴 JD，验证优化功能
```

---

## Phase 3: 智能图标 (P1)

### Task 17: 创建 IconifyProvider

**Files:**
- Create: `site/src/composables/icon/providers/iconify.ts`

- [ ] **Step 1: 实现 IconifyProvider**

```ts
export interface IconResult {
  name: string;
  svg: string;
  url: string;
  provider: string;
}

export interface IconProvider {
  readonly id: string;
  search(keyword: string): Promise<IconResult[]>;
}

export class IconifyProvider implements IconProvider {
  readonly id = "iconify";

  async search(keyword: string): Promise<IconResult[]> {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=20`
    );

    if (!res.ok) throw new Error(`Iconify API error: ${res.status}`);

    const json = await res.json();
    const icons = (json.icons ?? []) as string[];

    // 批量获取图标 SVG
    const svgRes = await fetch("https://api.iconify.design/icons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons, width: 24, height: 24 })
    });

    if (!svgRes.ok) throw new Error(`Iconify SVG fetch error: ${svgRes.status}`);

    const svgJson = await svgRes.json();
    return Object.entries(svgJson.icons ?? {}).map(([name, data]: [string, any]) => ({
      name,
      svg: `<span class="iconify" data-icon="${name}">${data.body}</span>`,
      url: `https://api.iconify.design/${name}.svg`,
      provider: "iconify"
    }));
  }
}
```

### Task 18: 创建 useIcon composable

**Files:**
- Create: `site/src/composables/icon/index.ts`

- [ ] **Step 1: 实现 useIcon**

```ts
import type { IconProvider, IconResult } from "./providers/iconify";
import { IconifyProvider } from "./providers/iconify";

export type { IconProvider, IconResult };

export const useIcon = () => {
  const loading = ref(false);
  const results = ref<IconResult[]>([]);
  const error = ref<string | null>(null);

  const _providers: IconProvider[] = [new IconifyProvider()];

  const registerProvider = (provider: IconProvider) => {
    _providers.push(provider);
  };

  const search = async (keyword: string) => {
    if (!keyword.trim()) {
      results.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const allResults = await Promise.all(
        _providers.map((p) => p.search(keyword).catch(() => [] as IconResult[]))
      );
      results.value = allResults.flat();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const insertIcon = (icon: IconResult) => {
    const { setContent } = useMonaco();
    const { data } = useDataStore();
    const mdRef = `![icon:${icon.name}](${icon.url})`;
    setContent("markdown", data.markdown + "\n" + mdRef);
  };

  return { search, insertIcon, registerProvider, loading, results, error };
};
```

- [ ] **Step 2: 从 composables/index.ts 导出**

```ts
export { useIcon } from "./icon";
```

### Task 19: 创建 IconPicker UI

**Files:**
- Create: `site/src/components/editor/icon/IconPicker.vue`

- [ ] **Step 1: 实现图标选择器**

```vue
<template>
  <div class="p-3">
    <input
      v-model="keyword"
      type="text"
      class="w-full text-sm border rounded px-2 py-1.5 bg-background"
      :placeholder="$t('icon.search_placeholder')"
      @input="onSearch"
    />

    <div v-if="loading" class="text-center py-4 text-sm text-muted-foreground">
      <span i-lucide:loader-2 class="animate-spin" />
    </div>

    <div v-if="error" class="text-xs text-destructive mt-2">{{ error }}</div>

    <div class="grid grid-cols-5 gap-2 mt-3">
      <button
        v-for="icon in results"
        :key="icon.name"
        class="flex-center size-10 rounded border hover:bg-accent hover:border-primary"
        :title="icon.name"
        @click="insert(icon)"
      >
        <img :src="icon.url" :alt="icon.name" class="size-5" />
      </button>
    </div>

    <div v-if="!loading && keyword && results.length === 0" class="text-sm text-muted-foreground text-center py-4">
      {{ $t("icon.no_results") }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useIcon, type IconResult } from "~/composables/icon";

const { search, insertIcon, loading, results, error } = useIcon();
const keyword = ref("");

let _timer: ReturnType<typeof setTimeout>;

const onSearch = () => {
  clearTimeout(_timer);
  _timer = setTimeout(() => {
    search(keyword.value);
  }, 300);
};

const insert = (icon: IconResult) => {
  insertIcon(icon);
};
</script>
```

### Task 20: 集成 IconPicker 到工具栏

**Files:**
- Modify: `site/src/components/editor/toolbar/index.vue`

- [ ] **Step 1: 在 tools 数组中添加 icon 工具项**

```ts
{
  id: "icon",
  icon: "i-lucide:icons",
  component: EditorToolbarIcon
}
```

- [ ] **Step 2: 创建工具栏包装组件**

创建 `site/src/components/editor/toolbar/Icon.vue`：

```vue
<template>
  <EditorToolbarBox :text="$t('toolbar.icon.title')" icon="i-lucide:icons">
    <EditorIconPicker />
  </EditorToolbarBox>
</template>
```

### Task 21: 验证图标功能

- [ ] **Step 1: 运行并测试**

```bash
pnpm dev
# 1. 打开编辑器，找到图标工具
# 2. 搜索 "github"，确认图标列表出现
# 3. 点击一个图标，确认 Markdown 图片引用插入
```

---

## Phase 4: Git 集成 (P2)

### Task 22: 安装 isomorphic-git 依赖

- [ ] **Step 1: 添加 isomorphic-git + lightning-fs**

```bash
cd site && pnpm add isomorphic-git @isomorphic-git/lightning-fs
```

### Task 23: 创建 GitOps 核心服务

**Files:**
- Create: `site/src/composables/git/gitops.ts`

- [ ] **Step 1: 实现 Git 操作封装**

```ts
import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";

export interface GitConfig {
  repoUrl: string;
  token: string;
}

export interface CommitInfo {
  oid: string;
  message: string;
  author: string;
  timestamp: number;
}

let _fs: LightningFS | null = null;
let _config: GitConfig | null = null;
const _dir = "/resumes";

function _getFs(): LightningFS {
  if (!_fs) _fs = new LightningFS("ohmycv_git");
  return _fs;
}

function _getAuth() {
  if (!_config) throw new Error("Git not configured");
  return {
    username: _config.token,
    password: _config.token
  };
}

export const GitOps = {
  configure(config: GitConfig) {
    _config = config;
  },

  isConfigured(): boolean {
    return _config !== null;
  },

  async clone(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.clone({
      fs,
      http,
      dir: _dir,
      url: _config.repoUrl,
      onAuth: () => _getAuth(),
      singleBranch: true,
      depth: 10
    });
  },

  async pull(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.pull({
      fs,
      http,
      dir: _dir,
      author: { name: "ohmycv", email: "ohmycv@local" },
      onAuth: () => _getAuth()
    });
  },

  async commitAndPush(message: string): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.add({ fs, dir: _dir, filepath: "." });

    await git.commit({
      fs,
      dir: _dir,
      message,
      author: { name: "ohmycv", email: "ohmycv@local" }
    });

    await git.push({
      fs,
      http,
      dir: _dir,
      onAuth: () => _getAuth()
    });
  },

  async getHistory(limit = 20): Promise<CommitInfo[]> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    const commits = await git.log({ fs, dir: _dir, depth: limit });

    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author.name,
      timestamp: c.commit.author.timestamp
    }));
  },

  async checkout(oid: string): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.checkout({ fs, dir: _dir, ref: oid });
  },

  async writeFile(filepath: string, content: string): Promise<void> {
    const fs = _getFs();
    const fullPath = `${_dir}/${filepath}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));

    // 确保目录存在
    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch {
      // 目录已存在
    }

    await fs.promises.writeFile(fullPath, content);
  },

  async readFile(filepath: string): Promise<string> {
    const fs = _getFs();
    return fs.promises.readFile(`${_dir}/${filepath}`, "utf8");
  }
};
```

### Task 24: 创建 useGit composable

**Files:**
- Create: `site/src/composables/git/index.ts`

- [ ] **Step 1: 实现 useGit**

```ts
import { GitOps, type GitConfig, type CommitInfo } from "./gitops";

export type { GitConfig, CommitInfo };

export const useGit = () => {
  const configured = ref(false);
  const syncing = ref(false);
  const history = ref<CommitInfo[]>([]);
  const error = ref<string | null>(null);

  const configure = async (config: GitConfig) => {
    GitOps.configure(config);
    configured.value = true;
  };

  const clone = async () => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.clone();
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const pull = async () => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.pull();
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const save = async (message = "Update resume") => {
    syncing.value = true;
    error.value = null;
    try {
      // 写入当前简历数据
      const { data } = useDataStore();
      const { styles } = useStyleStore();

      const resumeJson = JSON.stringify({
        name: data.resumeName,
        markdown: data.markdown,
        css: data.css,
        styles: toRaw(styles)
      });

      await GitOps.writeFile(`${data.resumeId}/resume.json`, resumeJson);
      await GitOps.commitAndPush(message);
      await loadHistory();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  const loadHistory = async () => {
    try {
      history.value = await GitOps.getHistory();
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const checkoutVersion = async (oid: string) => {
    syncing.value = true;
    error.value = null;
    try {
      await GitOps.checkout(oid);
      // 重新读取 resume.json
      const { data } = useDataStore();
      const content = await GitOps.readFile(`${data.resumeId}/resume.json`);
      const resume = JSON.parse(content);
      const { setAndSyncToMonaco } = useDataStore();
      setAndSyncToMonaco("markdown", resume.markdown);
      setAndSyncToMonaco("css", resume.css);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  return {
    configure,
    clone,
    pull,
    save,
    loadHistory,
    checkoutVersion,
    configured,
    syncing,
    history,
    error
  };
};
```

- [ ] **Step 2: 从 composables/index.ts 导出**

```ts
export { useGit } from "./git";
```

### Task 25: 创建 Git 配置 UI

**Files:**
- Create: `site/src/components/editor/git/GitSettings.vue`

- [ ] **Step 1: 实现 Git 设置面板**

```vue
<template>
  <div class="p-3 space-y-2">
    <div v-if="!configured">
      <input
        v-model="repoUrl"
        type="text"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background"
        placeholder="https://github.com/user/resumes.git"
      />
      <input
        v-model="token"
        type="password"
        class="w-full text-sm border rounded px-2 py-1.5 bg-background mt-2"
        placeholder="GitHub Personal Access Token"
      />
      <UiButton size="sm" class="w-full mt-2" :disabled="syncing" @click="doConnect">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ syncing ? $t("git.connecting") : $t("git.connect") }}
      </UiButton>
    </div>

    <div v-else>
      <div class="text-sm text-green-600 mb-2">{{ $t("git.connected") }}</div>
      <UiButton size="sm" variant="outline" class="w-full" :disabled="syncing" @click="doSync">
        <span v-if="syncing" i-lucide:loader-2 class="animate-spin mr-1" />
        {{ $t("git.sync") }}
      </UiButton>
    </div>

    <div v-if="error" class="text-xs text-destructive">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useGit } from "~/composables/git";

const git = useGit();
const { configured, syncing, error } = git;

const repoUrl = ref("");
const token = ref("");

const doConnect = async () => {
  try {
    await git.configure({ repoUrl: repoUrl.value, token: token.value });
    await git.clone();
  } catch {}
};

const doSync = async () => {
  try {
    await git.save("Manual sync");
  } catch {}
};
</script>
```

### Task 26: 创建 Git 历史 UI

**Files:**
- Create: `site/src/components/editor/git/GitHistory.vue`

- [ ] **Step 1: 实现版本历史面板**

```vue
<template>
  <div class="p-3">
    <div v-if="history.length === 0" class="text-sm text-muted-foreground text-center py-4">
      {{ $t("git.no_history") }}
    </div>

    <div v-for="commit in history" :key="commit.oid" class="border-b py-2 last:border-b-0">
      <div class="text-sm font-medium truncate">{{ commit.message }}</div>
      <div class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
        <span>{{ commit.oid.slice(0, 7) }}</span>
        <span>{{ new Date(commit.timestamp * 1000).toLocaleString() }}</span>
      </div>
      <UiButton size="xs" variant="ghost" class="mt-1" @click="doCheckout(commit.oid)">
        {{ $t("git.view") }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGit, type CommitInfo } from "~/composables/git";

const git = useGit();
const { history } = git;

const doCheckout = async (oid: string) => {
  try {
    await git.checkoutVersion(oid);
  } catch {}
};
</script>
```

### Task 27: 集成 Git 到工具栏

**Files:**
- Modify: `site/src/components/editor/toolbar/index.vue`

- [ ] **Step 1: 在 tools 数组中添加 git 工具项**

```ts
{
  id: "git",
  icon: "i-lucide:git-branch",
  component: EditorToolbarGit
}
```

- [ ] **Step 2: 创建工具栏包装组件**

创建 `site/src/components/editor/toolbar/Git.vue`：

```vue
<template>
  <EditorToolbarBox :text="$t('toolbar.git.title')" icon="i-lucide:git-branch">
    <EditorGitSettings />
    <UiSeparator class="my-2" />
    <EditorGitHistory />
  </EditorToolbarBox>
</template>
```

### Task 28: 验证 Git 功能

- [ ] **Step 1: 运行并测试**

```bash
pnpm dev
# 1. 打开编辑器，找到 Git 工具
# 2. 输入 GitHub 仓库 URL + PAT，点击连接
# 3. 确认 clone 成功
# 4. 编辑简历后，点击同步
# 5. 查看版本历史
# 6. checkout 旧版本，确认编辑器内容回滚
```

---

## 收尾

### Task 29: 添加 i18n 翻译键

**Files:**
- Modify: `site/src/i18n/locales/` (en, zh-cn, sp)

- [ ] **Step 1: 为所有新增 UI 文本添加翻译**

按模块添加翻译键（示例为英文，需补充中文等）：

```json
{
  "toolbar": {
    "ai": { "title": "AI Assistant" },
    "icon": { "title": "Icons" },
    "asset": { "title": "Images" },
    "git": { "title": "Git Sync" },
    "file": {
      "export_docx": "DOCX Document"
    }
  },
  "ai": {
    "configure": "Connect",
    "generate": "Generate Bullet Points",
    "generating": "Generating...",
    "optimize": "Optimize Resume",
    "optimizing": "Optimizing...",
    "generate_placeholder": "Paste project documentation here...",
    "optimize_placeholder": "Paste job description here...",
    "preview": "Preview",
    "insert": "Insert",
    "replace": "Replace"
  },
  "icon": {
    "search_placeholder": "Search icons...",
    "no_results": "No icons found"
  },
  "asset": {
    "upload": "Upload Image",
    "empty": "No images uploaded"
  },
  "git": {
    "connect": "Connect Repository",
    "connecting": "Connecting...",
    "connected": "Connected",
    "sync": "Save & Sync",
    "no_history": "No commit history",
    "view": "View this version"
  }
}
```

### Task 30: 全量验证

- [ ] **Step 1: Lint 检查**

```bash
pnpm lint
```

- [ ] **Step 2: 构建检查**

```bash
pnpm build
```

- [ ] **Step 3: 功能烟雾测试**

```bash
pnpm dev
```

测试清单：
1. DOCX 导出 → 文件下载且内容正确
2. 图片上传 → 存到 IndexedDB → 插入到编辑器 → 预览正常
3. AI 生成 → 输入项目文档 → 流式输出 → 插入编辑器
4. AI 优化 → 输入 JD → 流式输出 → 替换编辑器内容
5. 图标搜索 → 搜索关键词 → 结果展示 → 插入编辑器
6. Git 连接 → clone 成功 → 保存同步 → 查看历史 → checkout 旧版本
