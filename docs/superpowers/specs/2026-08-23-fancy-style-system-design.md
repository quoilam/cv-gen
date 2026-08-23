# Fancy 样式系统设计

> **影响范围**：样式数据模型（`ResumeStyles`）、动态 CSS 注入（`DynamicCssService`）、Markdown 渲染（新增 badge 插件）、图标上传、Appearance 面板。
> **最后更新时间**：2026-08-23

## 1. 背景与目标

当前简历样式能力单一：只有一个 `themeColor`（作用于标题/链接/h2 下划线）+ 字体 + 间距 + 纸张。花哨样式只能靠用户在 CSS 编辑器手写。

目标：为简历引入「fancy 彩色样式」，包含三个子能力：

1. **多强调色** — 把单一 `themeColor` 拆成可独立配置的标题色与链接色。
2. **Section 标题色条** — h2 标题加半透明彩色背景块。
3. **经历/项目标识条（badge）** — 把 deflist 的加粗职位名/项目名渲染成「左侧图标 + 半透明彩色 banner 背景 + 文本」的醒目条。

交付形式为**细粒度控制项**（Appearance 面板加控件），非整套预设主题。

## 2. 关键决策（已与用户确认）

| 决策点 | 结论 |
|--------|------|
| badge 识别目标 | deflist 的加粗 dt（`**职位名**`/`**项目名**）；`~` 次要信息保持横向，不加 badge |
| badge 每条颜色语法 | `#hex` 短前缀：`**#377bb5 Microwavesoft**` |
| badge 图标来源 | 标准 markdown 图片 `**![](url)文本**`；支持外部 URL 与上传的 base64；ico 上传时转 png |
| 透明度控制 | 颜色（纯 hex）与透明度分离：透明度用独立 slider，渲染时 `color-mix()` 生成半透明 |

## 3. 数据模型扩展

`site/src/composables/stores/style.ts` 的 `ResumeStyles` 新增字段：

```ts
type ResumeStyles = {
  // ...现有字段不变
  themeColor: string;          // 保留（向后兼容旧数据、h2 下划线默认色）

  // 多强调色
  headingColor: string;        // 标题 h1/h2/h3 颜色 + h2 border-bottom
  linkColor: string;           // 链接 a 颜色

  // Section 标题色条
  sectionBarColor: string;     // 色条颜色
  sectionBarOpacity: number;   // 0~1
  sectionBarEnabled: boolean;  // 开关

  // badge（经历条）
  badgeColor: string;          // 无 #hex 前缀时的默认色
  badgeOpacity: number;        // 0~1，统一透明度（所有 badge 共用）
};
```

默认值（`constant/variables/default.ts` 的 `DEFAULT_STYLES`）：
- `headingColor` / `linkColor` 默认取当前 `themeColor` 值（`#377bb5`）。
- `sectionBarColor` 默认 `#377bb5`，`sectionBarOpacity` 默认 `0.12`，`sectionBarEnabled` 默认 `false`。
- `badgeColor` 默认 `#377bb5`，`badgeOpacity` 默认 `0.15`。

**兼容性**：旧简历数据没有新字段，加载后由 `setStyle`/`setStyles` 的默认合并逻辑补全（或读取时 `?? DEFAULT`）。`themeColor` 不被移除，避免破坏已存数据的渲染。

## 4. 动态 CSS 注入扩展

`site/src/utils/css.ts` 的 `DynamicCssService`：

### 4.1 拆分 themeColor

原 `themeColor()` 方法拆为两个：
- `headingColor(selector, styles)`：`h1/h2/h3 { color: headingColor }` + `h2 { border-bottom-color: headingColor }`
- `linkColor(selector, styles)`：`a { color: linkColor }`

### 4.2 Section 标题色条

新增 `sectionBar(selector, styles)`，当 `sectionBarEnabled` 为真时输出：

```css
${selector} h2 {
  background: color-mix(in srgb, ${sectionBarColor} ${opacityPct}%, transparent);
  padding: 2px 8px;
  border-radius: 4px;
  border-bottom-style: none;
}
```

（`opacityPct = sectionBarOpacity * 100`；色条开启时去掉 h2 下划线，避免与色块冲突。）

### 4.3 badge 基础样式

新增 `badge(selector, styles)`，注入默认 CSS 变量（全局 `badgeColor`/`badgeOpacity`），每条 badge 用内联 style 覆盖 `--badge-color`：

```css
${selector} .resume-badge {
  --badge-color: ${styles.badgeColor};
  --badge-opacity: ${styles.badgeOpacity * 100}%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--badge-color) var(--badge-opacity), transparent);
  color: var(--badge-color);
  font-weight: bold;
}
${selector} .resume-badge-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}
```

`injectToolbar()` 末尾追加调用 `sectionBar` 与 `badge`。

## 5. badge 渲染插件（新）

新增内部包 `site/src/internal/markdown-it-badge/index.ts`，导出 `MarkdownItBadge`（`PluginSimple`）。

### 5.1 语法

```markdown
**Cooking Engineer Intern**                 → 用全局 badgeColor
**#377bb5 Microwavesoft**                   → 该条用 #377bb5
**![](logo.png)#377bb5 Microwavesoft**      → 图标 + 颜色
**![](https://x.com/logo.png) Company**     → 外部 URL 图标，默认色
```

- 颜色前缀：`#` + 3/6/8 位 hex + 空格（严格匹配，避免误伤正文以 `#` 开头的加粗文本）。
- 图标：标准 markdown 图片 `![](url)`，url 为外部地址或 `data:` base64。

### 5.2 识别机制

用 `core.ruler` 规则（在 `inline` 之后）遍历 token 树，维护「当前是否在 deflist 的 `dt` 内」状态；遇到 `dt` 内的 `strong`（`**...**`）token 时：

1. 解析其文本内容，提取可选 `#hex` 前缀与可选内嵌 `![]()` 图片。
2. 若含颜色前缀或图片（或需要 badge 时），给该 `strong` 标记 `token.meta.badge = { color?, iconUrl?, text }`。
3. 自定义 renderer 规则按 `meta.badge` 输出：

```html
<span class="resume-badge" style="--badge-color: #377bb5">
  <img class="resume-badge-icon" src="logo.png" alt="" />
  <span class="resume-badge-text">Microwavesoft</span>
</span>
```

无 `#hex` 前缀时，不设内联 `--badge-color`，由 4.3 的 `badge()` 注入的默认 `--badge-color: ${badgeColor}` 继承。

> 注：`dt` 内 strong 的具体 token 定位方式（借助 `dt_open`/`strong_open` 的 nesting 与 level）在实现计划中细化。

### 5.3 注册

`site/src/utils/markdown.ts` 的 `markdownService` 插件数组追加 `MarkdownItBadge`（置于 `MarkdownItDeflist` 之后，确保 dt 结构已生成）。

## 6. 图标上传通道（新）

新建 `site/src/composables/badge-icon/index.ts`，`useBadgeIcon()`：

- 复用 `photo/index.ts` 的 `compressPhoto` 逻辑，压缩参数改为小图标（maxWidth ≈ 256px，保留 PNG 透明通道）。
- 存储到独立 localForage instance `cvgen_badge_icons`，可存多张（key 为时间戳 id）。
- API：`list() / upload(file) / remove(id) / insert(id)`（`insert` 返回 `![](data:...)` 片段供插入 markdown）。
- 上传 `.ico` 时用 canvas 取第一帧转 png。

`AssetPanel.vue` 增加「图标」区块：上传按钮 + 已存图标缩略图列表（点击插入、可删除）。

## 7. Appearance 面板扩展

`site/src/components/editor/panels/AppearancePanel.vue` 新增：

1. **标题色** + **链接色**：复用现有 `@zag-js/color-picker` 模式（`useStyleHistory().execute` 接入撤销）。
2. **标题色条**：开关（switch）+ 颜色选择器 + 透明度 slider（0~1）。
3. **badge 默认色** + **badge 透明度** slider。

所有颜色控件沿用 `color-picker.machine` + `execute(key, old, new)` 模式。

## 8. 数据流

```
用户在 markdown 写 **#377bb5 Microwavesoft**
  → markdown-it-badge 识别 dt 内 strong，解析颜色前缀
  → 渲染 <span class="resume-badge" style="--badge-color:#377bb5">...
  → DynamicCssService.badge() 注入 .resume-badge 结构样式（color-mix 半透明背景）
  → Appearance 面板改 badgeColor/badgeOpacity → setStyle → injectToolbar 重注入
```

## 9. 测试

- **单测（vitest）**：`site/tests/unit/composables/markdown.test.ts` 追加用例：
  - `**Name**` 在 dt 内渲染为 `.resume-badge`；dt 外 bold 不变。
  - `**#377bb5 Name**` 正确提取 `--badge-color` 与文本。
  - `**![](url)Name**` 渲染出 `<img class="resume-badge-icon">`。
  - 非 hex 的 `#`（如 `**#1 最佳**`）不误判为颜色前缀。
- **CSS 单测**（如有）或手动验证：`sectionBarEnabled` 开/关时 h2 样式、`color-mix` 输出正确。
- **e2e（Playwright）**：在编辑器输入 badge 语法，断言预览区出现 badge 元素；Appearance 面板切换色条开关后 h2 背景变化。

## 10. 风险与权衡

- **`#hex` 短前缀误判**：通过严格 hex 匹配（3/6/8 位）降低；文档中说明该语法。
- **`color-mix` 浏览器兼容**：现代 Chromium/Firefox/Safari 均支持；若担心，可回退 `rgba()`（实现时按需）。
- **`themeColor` 未移除**：为避免旧数据兼容问题暂保留；后续可在迁移中清理。
- **badge 与 dt 定位复杂度**：markdown-it token 树定位是主要实现风险，计划阶段需细化并补单测兜底。
