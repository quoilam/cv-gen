# 简历编辑器功能扩展设计

> 最后更新：2026-05-23
> 影响范围：AI 服务、Git 版本管理、导出引擎、图标系统、图片资产

## 概述

在现有的 Markdown 简历编辑器基础上新增五个独立功能模块。

---

## 模块一：AI 服务 (`composables/ai/`)

### 职责

接收用户输入（项目文档 / JD），调用 LLM 生成简历片段或优化建议。纯浏览器端运行，无需后端。

### 接口

```ts
interface UseAI {
  generateFromDoc(doc: string, options?: { stream?: boolean }): Promise<string>
  optimizeFromJD(jd: string, currentMd: string): Promise<string>
  onStream(callback: (chunk: string) => void): void
  loading: Ref<boolean>
}
```

### 内部结构

- `prompts.ts` — prompt 模板，方便调优
- `providers/openai.ts` — OpenAI 兼容 provider
- `providers/anthropic.ts` — Anthropic provider
- `providers/types.ts` — LLMProvider 接口，预留扩展

### 依赖

- 零新依赖，纯 `fetch` 请求
- 用户需提供 API Key
- 流式响应：SSE 解析（OpenAI）或 Anthropic streaming

---

## 模块二：Git 集成 (`composables/git/`)

### 职责

通过 isomorphic-git 在浏览器中执行完整 git 操作。GitHub 仓库作为存储和版本管理后端。

### 接口

```ts
interface UseGit {
  configure(repoUrl: string, token: string): Promise<void>
  isConfigured: Ref<boolean>

  clone(): Promise<void>
  pull(): Promise<void>
  commit(message: string): Promise<void>
  push(): Promise<void>

  getHistory(limit?: number): Promise<CommitInfo[]>
  checkout(hash: string): Promise<void>

  status: Ref<"clean" | "dirty" | "conflict">
  lastSync: Ref<Date | null>
}
```

### 存储布局

仓库中每个简历存为独立目录：

```
cvgen-resumes/
├── 1/
│   ├── resume.json       # 完整简历数据 + 样式
│   └── assets/           # 图片资产（base64 内联在 json 中，此目录可作备选）
├── 2/
│   ├── resume.json
│   └── assets/
```

### 技术方案

- [isomorphic-git](https://isomorphic-git.org/) — 纯 JS git 实现
- [lightning-fs](https://github.com/isomorphic-git/lightning-fs) — 浏览器内文件系统（IndexedDB 后端）
- GitHub Personal Access Token 认证（不存本地，每次会话输入或存在 sessionStorage）

### 工作流

1. 用户输入仓库 URL + GitHub Token
2. `clone()` → 拉取仓库到 lightning-fs
3. 编辑简历后，自动保存到本地 fs，标记 dirty
4. 用户手动触发 commit + push（或设置自动 push）
5. 查看历史：`git log` → 展示 commit 列表，可 checkout 旧版本查看
6. 冲突处理：pull 时检测到冲突 → 提示用户，保留本地版本或远程版本

### 关键风险

- 首次 clone 慢（全量历史），后续增量快
- lightning-fs 与 localForage 共享 IndexedDB 配额

---

## 模块三：导出引擎 (`composables/export/`)

### 职责

统一导出入口，支持 PDF、DOCX、HTML 格式。注册机制，方便后期加格式。

### 接口

```ts
interface Exporter {
  readonly id: string
  readonly label: string
  export(data: ResumeData, styles: ResumeStyles, assets: AssetInfo[]): Promise<Blob>
}

class ExportService {
  register(exporter: Exporter): void
  export(format: string, resume: ResumeData, styles: ResumeStyles, assets: AssetInfo[]): Promise<Blob>
  listFormats(): { id: string; label: string }[]
}
```

### 内置实现

| 格式 | 方案 |
|------|------|
| PDF | 现有浏览器 print → PDF 逻辑迁移至此 |
| HTML | 现有预览 HTML 逻辑迁移至此 |
| DOCX | 新增，基于 `docx` npm 库 |

### DOCX 导出要点

- 将 Markdown 渲染为 HTML，再映射到 docx 元素（段落、标题、列表）
- 样式映射：themeColor → 标题颜色，fontFamily → 字体，fontSize → 字号
- 图片内联到 docx 中
- 页面尺寸匹配用户选择的 paper 设置（A4/Letter）

### 依赖

- `docx` npm 包

---

## 模块四：智能图标 (`composables/icon/`)

### 职责

根据关键词搜索图标，插入到编辑器光标位置。

### 接口

```ts
interface IconProvider {
  readonly id: string
  search(keyword: string): Promise<IconResult[]>
}

interface IconResult {
  name: string
  svg: string           // 内联 SVG 代码
  url: string           // CDN URL（备选）
  provider: string
}

interface UseIcon {
  search(keyword: string): Promise<IconResult[]>
  insertIcon(icon: IconResult): void
  registerProvider(provider: IconProvider): void
  loading: Ref<boolean>
}
```

### 内置实现

- `IconifyProvider` — 调 Iconify API (`https://api.iconify.design/search?query=...`)，免费、无需 key
- `IconProvider` 接口预留 LLM Provider（后期可输入自然语言描述，LLM 选择最匹配图标）

### 依赖

- 无新依赖，纯 HTTP 请求

---

## 模块五：图片资产 (`composables/asset/`)

### 职责

管理简历中的图片资产——上传、存储、引用、导出时内联。

### 接口

```ts
interface AssetInfo {
  id: string
  name: string
  base64: string         // 压缩后的 base64
  mimeType: string
  width: number
  height: number
  size: number
}

interface UseAsset {
  uploadImage(file: File): Promise<AssetInfo>
  getAssets(resumeId: number): Promise<AssetInfo[]>
  deleteAsset(id: string): Promise<void>
  insertImageRef(asset: AssetInfo): void
}
```

### 存储

- 图片以 base64 存入 IndexedDB（复用 localForage 实例，独立 key 命名空间 `assets-{resumeId}`）
- 上传时通过 canvas 压缩到合理尺寸（max 1200px 宽，JPEG quality 0.85）
- 导出时 base64 直接内联到 HTML/DOCX

### 依赖

- 无新依赖，`FileReader` + `canvas` 均为浏览器 API

---

## 实现优先级

| 优先级 | 模块 | 理由 |
|--------|------|------|
| P0 | 导出引擎 + DOCX | 独立模块，Unblock 其他功能不依赖 |
| P0 | 图片资产 | 基础能力，AI 和导出都可能引用 |
| P1 | AI 服务 | 核心差异化功能 |
| P1 | 智能图标 | 改动小、见效快 |
| P2 | Git 集成 | 复杂度最高，最后做 |

---

## 不做的

- B 方向（简历即站点）：不做
- AI ATS 打分：不做
- 多用户/协作：不做
