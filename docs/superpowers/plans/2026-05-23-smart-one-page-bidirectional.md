# 智能一页双向填充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `useSmartOnePage` composable and its toolbar UI to fill exactly 1 page in both directions — expand short content to fill the page and compress long content to fit.

**Architecture:** Modify the existing weighted-adjustment algorithm to work symmetrically in both compress and expand directions. The composable owns all computation; the component handles display and toast warnings.

**Tech Stack:** Vue 3 Composition API, Pinia store, vue-sonner toast, TypeScript

---

## File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `site/src/composables/useSmartOnePage.ts` | Modify | Core algorithm: fill ratio detection, bidirectional weighted adjustment, refine, bounds checking |
| `site/src/components/editor/toolbar/SmartOnePage.vue` | Modify | UI: fill percentage display, bidirectional warn states, toast notifications |

---

### Task 1: Refactor useSmartOnePage.ts — bidirectional algorithm

**Files:**
- Modify: `site/src/composables/useSmartOnePage.ts` (entire file)

- [ ] **Step 1: Replace `estimateOverflow` with `measureFillRatio`, add `fillRatio` ref**

`estimateOverflow()` returned `overflow = totalHeight / pageHeight` but special-cased 1-page to `{pages: 1, overflow: 1.0}` (skipping true measurement). Replace with `measureFillRatio()` that always computes the real ratio:

```typescript
// Remove estimateOverflow, overflowPercent ref
// Add fillRatio ref

const fillRatio = ref(1);

function measureFillRatio(): { pages: number; ratio: number } {
  const pages = document.querySelectorAll(
    `#resume-${resumeId} [data-part="page"]`
  );
  const count = pages.length || 1;

  let totalHeight = 0;
  pages.forEach((p) => {
    totalHeight += p.scrollHeight;
  });
  const pageHeight = (pages[0] as HTMLElement).clientHeight;
  const ratio = pageHeight > 0 ? totalHeight / pageHeight : count;

  return { pages: count, ratio };
}
```

The threshold constant at module level:
```typescript
const THRESHOLD = 0.02; // ±2% tolerance
```

- [ ] **Step 2: Update `measureCurrent()` to use new function and fillRatio ref**

```typescript
async function measureCurrent(): Promise<{ pages: number; ratio: number }> {
  await waitForRender();
  const result = measureFillRatio();
  pageCount.value = result.pages;
  fillRatio.value = result.ratio;
  return result;
}
```

- [ ] **Step 3: Replace `weightedEstimate` with `weightedAdjust` (bidirectional)**

Add `sign = direction === "compress" ? -1 : 1` so the same math works both ways. Clamp to `BOUNDS[p].min` for compress, `BOUNDS[p].max` for expand.

```typescript
type Direction = "compress" | "expand";

function weightedAdjust(
  current: ResumeStyles,
  ratio: number,
  direction: Direction
): Partial<ResumeStyles> {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= THRESHOLD) return {};

  const result: Partial<ResumeStyles> = {};
  const params: ParamName[] = [
    "fontSize", "lineHeight", "marginV", "marginH", "paragraphSpace"
  ];
  const sign = direction === "compress" ? -1 : 1;

  for (const param of params) {
    const share = deviation * WEIGHTS[param];
    const delta = share / SENSITIVITY[param];
    const currentVal = current[param] as number;
    let newVal = currentVal + sign * delta;

    if (direction === "compress") {
      newVal = Math.max(newVal, BOUNDS[param].min);
    } else {
      newVal = Math.min(newVal, BOUNDS[param].max);
    }
    (result as Record<string, number>)[param] = Math.round(newVal * 100) / 100;
  }

  return result;
}
```

- [ ] **Step 4: Make `refine` bidirectional**

```typescript
function refine(
  current: ResumeStyles,
  ratio: number,
  applied: Partial<ResumeStyles>,
  direction: Direction
): Partial<ResumeStyles> | null {
  const remaining = direction === "compress" ? ratio - 1.0 : 1.0 - ratio;
  if (remaining <= THRESHOLD) return null;

  const params: ParamName[] = [
    "fontSize", "lineHeight", "marginV", "marginH", "paragraphSpace"
  ];

  const available = params.filter((p) => {
    const val = applied[p] ?? (current[p] as number);
    if (direction === "compress") return val > BOUNDS[p].min;
    return val < BOUNDS[p].max;
  });

  if (available.length === 0) return null;

  const totalWeight = available.reduce((s, p) => s + WEIGHTS[p], 0);
  const sign = direction === "compress" ? -1 : 1;
  const correction: Partial<ResumeStyles> = {};

  for (const param of available) {
    const share = remaining * (WEIGHTS[param] / totalWeight);
    const delta = share / SENSITIVITY[param];
    const currentVal = (applied[param] ?? current[param]) as number;
    let newVal = currentVal + sign * delta;

    if (direction === "compress") {
      newVal = Math.max(newVal, BOUNDS[param].min);
    } else {
      newVal = Math.min(newVal, BOUNDS[param].max);
    }
    (correction as Record<string, number>)[param] = Math.round(newVal * 100) / 100;
  }

  return correction;
}
```

- [ ] **Step 5: Make `atBounds` bidirectional**

```typescript
function atBounds(values: Partial<ResumeStyles>, direction: Direction): boolean {
  const params: ParamName[] = [
    "fontSize", "lineHeight", "marginV", "marginH", "paragraphSpace"
  ];
  return params.every((p) => {
    const val = values[p] ?? store.styles[p];
    if (direction === "compress") return val <= BOUNDS[p].min + 0.01;
    return val >= BOUNDS[p].max - 0.01;
  });
}
```

- [ ] **Step 6: Rewrite `fitToOnePage()` with bidirectional flow**

```typescript
async function fitToOnePage(): Promise<void> {
  status.value = "fitting";
  const current = { ...store.styles };
  const initial = await measureCurrent();

  // Already within tolerance
  if (Math.abs(initial.ratio - 1.0) <= THRESHOLD) {
    status.value = "success";
    pageCount.value = 1;
    fillRatio.value = 1;
    hasRecommendation.value = true;
    store.setRecommended({});
    return;
  }

  const direction: Direction = initial.ratio > 1.0 + THRESHOLD ? "compress" : "expand";

  // Step 1: Weighted estimate
  let applied = weightedAdjust(current, initial.ratio, direction);

  const changes = Object.entries(applied).map(([key, value]) =>
    makeChange(key, (current as Record<string, unknown>)[key], value)
  );
  await executeBatch(changes);

  // Step 2: Measure and refine (up to 2 rounds)
  for (let round = 0; round < 2; round++) {
    const measurement = await measureCurrent();
    if (Math.abs(measurement.ratio - 1.0) <= THRESHOLD) break;

    const correction = refine(current, measurement.ratio, applied, direction);
    if (!correction) break;

    const correctionChanges = Object.entries(correction).map(([key, value]) =>
      makeChange(key, (store.styles as Record<string, unknown>)[key], value)
    );
    await executeBatch(correctionChanges);

    applied = { ...applied, ...correction };
  }

  const final = await measureCurrent();

  store.setRecommended(applied);
  hasRecommendation.value = true;

  if (Math.abs(final.ratio - 1.0) <= THRESHOLD) {
    status.value = "success";
  } else if (atBounds(applied, direction)) {
    status.value = "warn";
  } else {
    status.value = "success";
  }
}
```

- [ ] **Step 7: Update `refresh()` to use ratio-based comparison**

```typescript
async function refresh() {
  const result = await measureCurrent();
  if (Math.abs(result.ratio - 1.0) <= THRESHOLD && status.value !== "fitting" && hasRecommendation.value) {
    status.value = "success";
  } else if (Math.abs(result.ratio - 1.0) > THRESHOLD && !hasRecommendation.value) {
    status.value = "idle";
  }
}
```

- [ ] **Step 8: Update return values**

```typescript
return {
  pageCount,
  fillRatio,         // replaces overflowPercent
  status,
  hasRecommendation,
  fitToOnePage,
  resetToRecommended,
  refresh,
  BOUNDS
};
```

- [ ] **Step 9: Commit**

```bash
git add site/src/composables/useSmartOnePage.ts
git commit -m "feat: make smart one-page algorithm bidirectional"
```

---

### Task 2: Update SmartOnePage.vue — bidirectional UI

**Files:**
- Modify: `site/src/components/editor/toolbar/SmartOnePage.vue`

- [ ] **Step 1: Update template to handle bidirectional status and always show fill percentage**

```vue
<template>
  <EditorToolbarBox text="智能一页" icon="i-carbon:shrink-screen">
    <!-- Status -->
    <div text="sm muted-foreground" mb-3>
      <template v-if="status === 'fitting'">
        <span i-svg-spinners:3-dots-fade inline-block mr-1 />
        填充 {{ fillPercent }}%，计算中...
      </template>
      <template v-else-if="status === 'success'">
        已占满 1 页 ✅
      </template>
      <template v-else-if="status === 'warn' && fillRatio < 1">
        已达膨胀极限，填充 {{ fillPercent }}%
      </template>
      <template v-else-if="status === 'warn' && fillRatio > 1">
        已达压缩极限，溢出 {{ overflowPercent }}%
      </template>
      <template v-else>
        当前填充 {{ fillPercent }}%
        <span v-if="fillRatio > 1">
           · 溢出约 {{ overflowPercent }}%
        </span>
      </template>
    </div>

    <!-- Auto-fit button -->
    <UiButton
      :disabled="status === 'fitting'"
      variant="secondary"
      class="w-full mb-2"
      @click="handleFit"
    >
      <span i-carbon:shrink-screen mr-1 />
      {{ status === 'fitting' ? '调整中...' : '自动调整' }}
    </UiButton>

    <!-- Reset to recommended -->
    <div v-if="hasRecommendation" text-right>
      <UiButton variant="ghost-secondary" size="sm" @click="handleReset">
        ↩ 恢复推荐值
      </UiButton>
    </div>
  </EditorToolbarBox>
</template>
```

- [ ] **Step 2: Rewrite script section — import fillRatio, add computed percentages and toast**

```vue
<script lang="ts" setup>
import { useSmartOnePage } from "~/composables/useSmartOnePage";
import { toast } from "vue-sonner";

const {
  pageCount,
  fillRatio,
  status,
  hasRecommendation,
  fitToOnePage,
  resetToRecommended
} = useSmartOnePage("preview");

const fillPercent = computed(() =>
  Math.round(Math.min(fillRatio.value, 1) * 100)
);
const overflowPercent = computed(() =>
  Math.round((fillRatio.value - 1) * 100)
);

async function handleFit() {
  await fitToOnePage();
  if (status.value === "warn") {
    if (fillRatio.value < 1) {
      toast.error("内容不足以填满一页，已达膨胀极限，建议增加简历内容");
    } else {
      toast.error("内容超出页面较多，已达压缩极限，建议精简简历内容");
    }
  }
}

function handleReset() {
  resetToRecommended();
}
</script>
```

- [ ] **Step 3: Verify the component compiles and the toolbar renders correctly**

Run:
```bash
pnpm lint
pnpm build
```
Expected: No errors, Nuxt generates successfully.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/editor/toolbar/SmartOnePage.vue
git commit -m "feat: update smart one-page UI for bidirectional fill"
```
