---
title: 智能一页双向填充设计
date: 2026-05-23
status: approved
---

# 智能一页：双向填充设计

## 影响范围

- `site/src/composables/useSmartOnePage.ts` — 核心算法改造
- `site/src/components/editor/toolbar/SmartOnePage.vue` — UI 适配

## 最后更新时间

2026-05-23

## 问题

现有智能一页系统只处理内容**超过**一页时压缩参数，但对内容不足一页时不作任何处理。用户希望在「恰好占满一页」时才是成功，无论内容是多是少。

## 设计

### 1. 核心检测：fillRatio

将 `estimateOverflow()` 改为 `estimateFillRatio()`，返回填充率：

```typescript
type FillResult = {
  pages: number;        // 实际分页数（总是希望为 1）
  ratio: number;        // 填充率: 1.0 = 正好占满, < 1 = 不足, > 1 = 溢出
  atMin: boolean;       // 所有参数是否已达下限
  atMax: boolean;       // 所有参数是否已达上限
};
```

- 单页时，计算 `contentScrollHeight / pageClientHeight`
- 多页时，计算 `所有页面总 scrollHeight / 首页 clientHeight`（即现有 overflow 逻辑，结果 > 1）
- 阈值 ±2%（0.98 ~ 1.02）视为已占满

### 2. 对称双向算法

`weightedEstimate()` 改造为支持两个方向：

```typescript
function weightedAdjust(
  current: ResumeStyles,
  ratio: number,        // 当前填充率
  direction: "compress" | "expand"
): Partial<ResumeStyles>
```

- `compress`: 减少参数值（现有逻辑）
- `expand`: 增加参数值（对称，使用相同权重和敏感度）

权重和敏感度复用现有值：

| 参数 | 权重 | 敏感度 | 最小值 | 最大值 | 默认值 |
|------|------|--------|--------|--------|--------|
| fontSize | 0.20 | 0.07 | 11 | 20 | 15 |
| lineHeight | 0.30 | 0.40 | 1.1 | 2.0 | 1.3 |
| marginV | 0.35 | 0.005 | 18 | 80 | 50 |
| marginH | 0.10 | 0.002 | 18 | 80 | 45 |
| paragraphSpace | 0.05 | 0.01 | 0 | 50 | 5 |

### 3. fitToOnePage() 流程

```
1. 测量当前 fillRatio
2. 如 0.98 ≤ ratio ≤ 1.02 → 完成，设为 success
3. 如 ratio < 0.98 → direction = "expand"，调用 weightedAdjust
4. 如 ratio > 1.02 → direction = "compress"，调用 weightedAdjust
5. ｛执行批量参数变更 → 等待渲染(300ms) → 测量｝× 最多 2 轮 refine
6. 检查 bounds:
   - 已达极限但仍不满足 → status = "warn"，弹出 Toast
   - 满足 → status = "success"
```

### 4. 状态与 UI

状态扩展：

| 状态 | 含义 | UI 显示 |
|------|------|---------|
| `idle` | 未调整 | 当前填充 X% |
| `fitting` | 调整中 | 填充 X%，计算中... |
| `success` | 恰好占满 1 页 | 已占满 1 页 ✅ |
| `warn` | 达极限，无法完美占满 | 达调整极限，填充 X% |

填充率始终显示，让用户感知页面利用情况。

警告使用 `vue-sonner` toast：
- 内容超长无法压入一页：`toast.error("内容超出页面较多，已达压缩极限，建议精简简历内容")`
- 内容太少无法撑满一页：`toast.error("内容不足以填满一页，已达膨胀极限")`

### 5. 文件变更清单

**useSmartOnePage.ts：**
- `estimateOverflow()` → `estimateFillRatio()` 改造
- `weightedEstimate()` → `weightedAdjust(ratio, direction)` 对称化
- `fitToOnePage()` 双向流程
- `atBounds()` 新增上限检测
- 返回值增加 `fillRatio` 属性
- 引入 `useToast()` 用于警告

**SmartOnePage.vue：**
- 状态显示适配双向场景
- 始终显示填充率百分比
- warn 状态下区分压缩/膨胀方向
- 引入 `useToast()`

### 6. 不做的事

- 不修改 `vue-smart-pages` 分页引擎
- 不修改 `ResumeRender.vue` 渲染组件
- 不引入 CSS transform 缩放
- 不改动数据模型或 Pinia store 结构
- 不涉及导出系统变更

## 约束与边界

- 参数调整不会超出 BOUNDS 定义的上下限（见上表）
- 默认值保持在范围中间，给双向调整留足空间
- 极限时弹出 Toast 而非阻止用户操作
- 推荐重置机制不变：`resetToRecommended()` 恢复到调整后的推荐值
