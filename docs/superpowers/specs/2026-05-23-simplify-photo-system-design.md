# Simplify Photo System — Design Spec

**日期**：2026-05-23
**状态**：Approved

## 目标

将当前复杂的多图片 Asset 系统替换为极简的单张头像系统。用户只需在 markdown front matter 中设置一个字段即可控制照片的显示与位置。

## 当前问题

- 多图片管理界面（AssetManager.vue）过度设计，简历只需一张头像
- 图片以 base64 数据 URL 嵌入 markdown（`![filename](data:image/...)`），使 markdown 文件巨大
- 照片与内容耦合，无法独立管理
- DOCX 导出图片静默丢失

## 新设计

### Front Matter 协议

```yaml
---
name: 张三
photo: left   # "left" | "right" | 省略（不显示）
---
```

### 数据存储

- 照片单独存入 localforage `ohmycv_photo` store（单 key，单字符串值）
- 照片 base64 不与 markdown 混合

### 数据流

```
用户点击工具栏上传按钮 → 文件选择器 → canvas 压缩（max 400px 宽）
  → 存为 base64 到 localforage（ohmycv_photo）
  → markdownService.renderResume() 异步读取 front matter + localforage
  → 在 resume-header 区域注入 <img class="resume-photo resume-photo--left|--right">
  → 预览实时更新
```

### renderResume 签名变更

- 从同步 `renderResume(markdown): string` 变为异步 `renderResume(markdown): Promise<string>`
- 调用方 `ResumeRender.vue` 从 `computed` 改为异步模式（`ref` + `watchEffect` 或 `useAsyncState`）

## 文件变更

### 删除（3 个文件）

- `site/src/components/editor/asset/AssetManager.vue`
- `site/src/components/editor/toolbar/Asset.vue`
- `site/src/composables/asset/index.ts`

### 新建（2 个文件）

- `site/src/composables/photo/index.ts` — 单图上传/存储/删除 composable
- `site/src/components/editor/toolbar/Photo.vue` — 简化上传按钮

### 修改

- `site/src/components/editor/toolbar/index.vue` — 替换 Asset 工具为 Photo
- `site/src/utils/markdown.ts` — 读取 `photo` front matter，注入 `<img>` 到 header，方法改为 async
- `site/src/components/shared/ResumeRender.vue` — 适配异步 renderResume
- `site/src/composables/constant/variables/default.ts` — 新增 `.resume-photo` CSS

## Composable 接口

```ts
usePhoto() {
  uploadPhoto(file: File): Promise<void>
  removePhoto(): Promise<void>
  getPhoto(): Promise<string | null>
  photo: Ref<string | null>  // 响应式状态
}
```

## 渲染逻辑

```
1. 解析 front matter 提取 photo 字段
2. 如果 photo ∈ {left, right}，异步读取 localforage 中的照片 base64
3. 在 <div class="resume-header"> 中注入：
   <img class="resume-photo resume-photo--{position}" src="{base64}" />
```

## CSS

```css
.resume-photo {
  width: 100px;
  height: 133px;
  object-fit: cover;
}
.resume-photo--left  { float: left;  margin-right: 16px; }
.resume-photo--right { float: right; margin-left: 16px; }
```

## 清理项

- data store 中不再有 markdown 内嵌图片的残留处理
- 工具栏 tool 注册从 `asset` 改为 `photo`
- 清理 i18n 文件中的 asset 相关 key（可选，不管 i18n）
