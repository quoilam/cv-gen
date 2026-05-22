# 智能一页 — 功能设计

**日期**: 2026-05-23  
**状态**: 设计阶段  
**范围**: 新增 `useSmartOnePage` composable + `SmartOnePage` 工具栏组件

## 1. 目标

当简历内容超出一页时，自动调整排版参数使其恰好缩为一页，同时最大化视觉效果。

交互方式：
- 一键「✨ 自动调整」按钮
- 滑杆微调（字号、行距、上下边距、左右边距），滑杆旁显示 ⭐ 推荐值
- 恢复按钮回到推荐值

## 2. UI 设计

### 新增组件：`SmartOnePage.vue`

位置：工具栏内，现有样式面板下方，作为独立卡片。

结构：
```
┌─ ✨ 智能一页 ─────────────────────┐
│ 状态栏：当前 X 页 · 溢出约 Y%      │
│ [✨ 自动调整]                      │
│ ──────────────────────────────── │
│ 🔤 字号    ⭐13.5  15px  ──●────  │
│ ↕️ 行间距  ⭐1.2   1.3   ──●────  │
│ 📐 上下边距 ⭐30   50px  ──●────  │
│ 📏 左右边距 ⭐28   45px  ──●────  │
│                      [↩ 恢复默认] │
└──────────────────────────────────┘
```

### 交互流程

1. 初始状态：显示当前页数、溢出比例，"自动调整"按钮可用
2. 点击自动调整：算法计算最优值 → 应用 → 滑杆跳至推荐位 → ⭐ 标记出现
3. 用户手动拖滑杆：⭐ 保留在推荐位，滑杆偏离，实时更新页数状态
4. 点击恢复默认：滑杆回到 ⭐ 推荐值
5. 如果内容原本就一页：按钮 disabled，状态显示"✅ 已为一页"

## 3. 核心算法

### 3.1 整体流程

```
fitToOnePage(currentStyles) {
  // Step 1: 测量溢出
  overflow = measureOverflow()
  if overflow <= 1.0 → 已一页，直接返回

  // Step 2: 加权估算初始值
  estimated = weightedEstimate(currentStyles, overflow)

  // Step 3: 应用并重新测量
  apply(estimated)
  await waitForRender()
  newOverflow = measureOverflow()

  // Step 4: 微调（最多 2 轮）
  for i in [1, 2]:
    if |newOverflow - 1.0| < tolerance → 完成
    correction = proportionalCorrection(newOverflow)
    apply(correction)
    await waitForRender()
    newOverflow = measureOverflow()

  return finalValues
}
```

### 3.2 溢出测量

DOM-based 测量，通过 vue-smart-pages 分页后的 DOM 结构判断页数：

```
measureOverflow() {
  pages = targetEl.querySelectorAll('[data-part="page"]')
  if pages.length <= 1 → return 1.0  // 已一页

  // 估算溢出比例
  // 第一页内容高度 + 第二页内容高度 / 单页可用高度
  page1Content = measureContentHeight(pages[0])
  page2Content = measureContentHeight(pages[1])
  availableHeight = pageHeight - marginV * 2

  // 第二页上有多少内容溢出了
  return (page1Content + page2Content) / availableHeight
}
```

实际上，溢出测量不需要精确到像素。我们要的是"还需要压缩多少比例"。简化为：

```
overflow = totalPages > 1 ? estimateOverflowRatio() : 1.0
```

通过分页后测量第一页底部被截断元素和第二页总高度的比例来估算。

### 3.3 加权估算

```
// 视觉代价权重（和 = 1.0）
weights = {
  marginV:     0.35,  // 代价最低
  marginH:     0.10,  // 横向边距对高度影响小
  lineHeight:  0.30,  // 代价中等
  fontSize:    0.20,  // 代价最高
  paragraphSpace: 0.05  // 影响最小
}

// 参数敏感度：每个参数单位变化对总高度的近似影响比例
// 这些值基于经验估计，使用时结合实际情况校正
sensitivity = {
  fontSize:    0.07,   // 1px 字号 ≈ 7% 高度变化
  lineHeight:  0.40,   // 0.1 行距 ≈ 4% 高度变化
  marginV:     0.005,  // 1px 边距 ≈ 0.5% 高度变化（上下各一次所以 ×2）
  marginH:     0.002,  // 1px 横向边距对高度影响更小（通过换行间接影响）
  paragraphSpace: 0.01 // 1px 段落间距 ≈ 1% 高度变化
}

weightedEstimate(current, overflow) {
  excess = overflow - 1.0  // e.g. 0.15 = 15% 溢出

  result = clone(current)
  for param in [marginV, marginH, lineHeight, fontSize, paragraphSpace]:
    // 该参数需要承担的缩减量
    share = excess * weights[param]
    // 转换为参数单位
    reduction = share / sensitivity[param]
    // 应用但不低于下限
    result[param] = max(current[param] - reduction, bounds[param].min)

  return result
}
```

### 3.4 微调

如果估算后仍未达标，按剩余溢出的比例再次修正。微调只调整仍有空间的参数（未触及下限的）。

```
refine(current, overflow, bounds) {
  remaining = overflow - 1.0
  if remaining <= 0.02 → 完成（2% 容差）
  if all parameters at bounds → 报告"无法缩为一页"

  // 只对尚未触底的参数按权重再次分配
  availableParams = filter(current, p => current[p] > bounds[p].min)
  redistributeRemaining(remaining, availableParams)
}
```

### 3.5 边界常量（均衡策略）

| 参数 | 默认值 | 下限 | 上限 |
|------|--------|------|------|
| fontSize | 15 px | 11 px | 20 px |
| lineHeight | 1.3 | 1.1 | 2.0 |
| marginV | 50 px | 18 px | 80 px |
| marginH | 45 px | 18 px | 80 px |
| paragraphSpace | 5 px | 0 px | 50 px |

### 3.6 无法缩为一页时

当所有参数触及下限仍超出一页：
- 状态栏显示"⚠️ 无法缩为一页（已至极限）"
- 按钮保持可用（重新尝试）
- 滑杆均在各下限位置，推荐值也指向下限

## 4. 架构

### 新增文件

| 文件 | 职责 |
|------|------|
| `site/src/composables/useSmartOnePage.ts` | 核心算法 composable：溢出测量、加权估算、微调循环、状态管理 |
| `site/src/components/editor/toolbar/SmartOnePage.vue` | UI 组件：状态栏、自动调整按钮、滑杆（含推荐标记）、恢复按钮 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `site/src/pages/editor/[id].vue` | 工具栏中引入 SmartOnePage 组件 |
| `site/src/composables/stores/style.ts` | 新增 `recommendedStyles` 状态，存储算法推荐值 |

### 不修改的文件

现有的独立样式面板（FontSize.vue、LineHeight.vue、Margins.vue 等）保持不变。SmartOnePage 通过同一个 Pinia store 读写，两者自然同步。

## 5. 数据流

```
用户点击「自动调整」
    │
    ▼
useSmartOnePage.fitToOnePage()
    │
    ├─ 读取 styleStore.styles（当前值）
    ├─ 测量 DOM 溢出（通过 vue-smart-pages 分页结果）
    ├─ 计算推荐值
    ├─ 写入 styleStore.styles（触发预览重渲染）
    ├─ 写入 styleStore.recommendedStyles（⭐ 标记用）
    │
    ▼
SmartOnePage 滑杆响应 store 变化，显示新值 + ⭐标记
    │
    ▼
用户手动拖滑杆
    │
    ├─ 写入 styleStore.styles（覆盖推荐值）
    ├─ 实时测量是否仍为一页
    ├─ 更新状态栏
    │
    ▼
用户点击「恢复默认」
    │
    └─ 将 styleStore.recommendedStyles 写回 styleStore.styles
```

## 6. 关键实现细节

### 6.1 等待渲染完成

每次修改样式后，需等待 vue-smart-pages 完成重排才能测量。利用 ResumeRender.vue 已有的 `render()` 方法和 `watchThrottled`（200ms）。

```ts
// useSmartOnePage.ts
async function waitForRender(): Promise<void> {
  // ResumeRender 的 watch 有 200ms throttle
  // 我们等待一个稍长的间隔确保 DOM 更新完成
  await nextTick()
  await new Promise(r => setTimeout(r, 250))
}
```

### 6.2 溢出测量

```ts
function measurePages(): number {
  const pages = document.querySelectorAll(
    '#resume-preview [data-part="page"]'
  )
  return pages.length
}

function estimateOverflow(): number {
  const pages = document.querySelectorAll(
    '#resume-preview [data-part="page"]'
  )
  if (pages.length <= 1) return 1.0

  // 总内容高度 / 第一页可用高度
  let totalHeight = 0
  pages.forEach(p => { totalHeight += p.scrollHeight })
  const firstPageHeight = pages[0].clientHeight
  return totalHeight / firstPageHeight
}
```

### 6.3 无法缩为一页的边界情况

- 所有参数触底下限仍 > 1 页：提示用户，保持压缩到极限的值
- 内容原本就一页：按钮置灰，显示"✅ 已为一页"
- 内容在渲染中（字体加载等）：按钮临时 disabled + loading 态

## 7. 与现有系统的兼容性

- **Style History（undo/redo）**：自动调整的批量参数修改应作为一个历史条目（而非每个参数一个），点击 undo 一次恢复所有参数
- **导出**：无需修改。导出时使用当前的 styleStore.styles（无论来自推荐还是手动）
- **预览缩放**：无需修改。fitWidth/fitHeight 在 vue-zoom 层工作
- **多简历**：每个简历独立计算，切换简历时清空推荐值
