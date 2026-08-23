import type { ResumeStyles } from "~/composables/stores/style";

type ParamName = keyof Pick<
  ResumeStyles,
  "marginV" | "paragraphSpace" | "lineHeight" | "fontSize"
>;

const PARAM_CONFIG: Record<
  ParamName,
  { min: number; max: number; default: number; weight: number; step: number }
> = {
  marginV: { min: 0, max: 30, default: 20, weight: 0.30, step: 1 },
  paragraphSpace: { min: -5, max: 10, default: 5, weight: 0.15, step: 1 },
  lineHeight: { min: 1, max: 1.5, default: 1.3, weight: 0.25, step: 0.01 },
  fontSize: { min: 11, max: 20, default: 15, weight: 0.30, step: 0.1 },
};

// Priority order: least visually intrusive first
const PARAMS: ParamName[] = [
  "paragraphSpace",
  "marginV",
  "lineHeight",
  "fontSize",
];

// Approximate ratio change per unit of each param (will be adapted by feedback)
const INITIAL_SENSITIVITY: Record<ParamName, number> = {
  marginV: 0.003,
  paragraphSpace: 0.012,
  lineHeight: 0.5,
  fontSize: 0.06,
};

const THRESHOLD = 0.015; // ±1.5% tolerance
const MAX_ROUNDS = 20;
const DAMPING = 0.65; // when overshoot detected, scale adjustment by this

type Direction = "compress" | "expand";

export const useSmartOnePage = (resumeId: string | number) => {
  const store = useStyleStore();
  const { executeBatch } = useStyleHistory();

  const pageCount = ref(1);
  const fillRatio = ref(1);
  const status = ref<"idle" | "fitting" | "success" | "warn">("idle");
  const hasRecommendation = ref(false);

  // Adaptive sensitivity tracking (per-parameter, learned from feedback)
  const _sensitivity = { ...INITIAL_SENSITIVITY };

  function measureFillRatio(): { pages: number; ratio: number } {
    const pages = document.querySelectorAll(
      `#resume-${resumeId} [data-part="page"]`,
    );
    if (pages.length === 0) return { pages: 1, ratio: 1 };

    let totalHeight = 0;
    pages.forEach((p) => {
      totalHeight += p.scrollHeight;
    });
    const pageHeight = (pages[0] as HTMLElement).clientHeight;
    const ratio = pageHeight > 0 ? totalHeight / pageHeight : 1;

    return { pages: pages.length, ratio };
  }

  async function waitForRender(): Promise<void> {
    await nextTick();
    await new Promise((r) => setTimeout(r, 300));
  }

  async function measureCurrent(): Promise<{ pages: number; ratio: number }> {
    await waitForRender();
    const result = measureFillRatio();
    pageCount.value = result.pages;
    fillRatio.value = result.ratio;
    return result;
  }

  function makeChange(key: string, oldValue: unknown, newValue: unknown) {
    return {
      key: key as keyof ResumeStyles,
      oldValue: oldValue as ResumeStyles[keyof ResumeStyles],
      newValue: newValue as ResumeStyles[keyof ResumeStyles],
    };
  }

  /**
   * Calculate parameter adjustments using weighted distribution.
   * Each round distributes the remaining deviation across available params
   * proportionally to weight × available headroom.
   */
  function calcAdjustment(
    current: ResumeStyles,
    deviation: number,
    direction: Direction,
  ): Partial<ResumeStyles> {
    const result: Partial<ResumeStyles> = {};
    const sign = direction === "compress" ? -1 : 1;

    // Weight each param by its config weight × available headroom
    const entries: { param: ParamName; headroom: number; score: number }[] = [];
    let totalScore = 0;

    for (const param of PARAMS) {
      const val = current[param] as number;
      const cfg = PARAM_CONFIG[param];
      const headroom =
        direction === "compress"
          ? Math.max(0, val - cfg.min)
          : Math.max(0, cfg.max - val);

      if (headroom < cfg.step) continue;

      // Params with more headroom take a larger share
      const score = cfg.weight * headroom;
      entries.push({ param, headroom, score });
      totalScore += score;
    }

    if (totalScore === 0) return result;

    for (const { param, headroom } of entries) {
      const val = current[param] as number;
      const cfg = PARAM_CONFIG[param];
      const share = deviation * (cfg.weight * headroom / totalScore);
      const sens = _sensitivity[param];
      let delta = sens > 0 ? share / sens : 0;

      // Clamp to available headroom
      delta = Math.min(delta, headroom);
      // Quantize to step size
      const steps = Math.round(delta / cfg.step);
      delta = steps * cfg.step;

      if (Math.abs(delta) < cfg.step) continue;

      const newVal = Math.round((val + sign * delta) * 100) / 100;
      (result as Record<string, number>)[param] = newVal;
    }

    return result;
  }

  /**
   * After each round, update sensitivity based on actual vs expected ratio change.
   * This lets the algorithm self-correct when content characteristics differ from
   * initial estimates.
   */
  function updateSensitivity(
    prevRatio: number,
    newRatio: number,
    applied: Partial<ResumeStyles>,
    prevStyles: ResumeStyles,
  ): void {
    const actualChange = Math.abs(prevRatio - newRatio);
    if (actualChange < 0.001) return;

    let totalExpected = 0;

    for (const param of PARAMS) {
      const newVal = applied[param];
      if (newVal === undefined) continue;
      const oldVal = prevStyles[param] as number;
      const delta = Math.abs(newVal - oldVal);
      const expected = delta * _sensitivity[param];
      totalExpected += expected;
    }

    if (totalExpected < 0.001) return;

    // Scale: if actual change was larger than expected, sensitivity is higher
    const scale = actualChange / totalExpected;

    for (const param of PARAMS) {
      if (applied[param] === undefined) continue;
      const old = _sensitivity[param];
      // Smooth update (70% old, 30% new) to avoid oscillation
      _sensitivity[param] = old * 0.7 + old * scale * 0.3;
    }
  }

  function allAtBounds(
    applied: Partial<ResumeStyles>,
    baseline: ResumeStyles,
    direction: Direction,
  ): boolean {
    return PARAMS.every((p) => {
      const val = (applied[p] ?? baseline[p]) as number;
      const cfg = PARAM_CONFIG[p];
      if (direction === "compress") return val <= cfg.min + 0.01;
      return val >= cfg.max - 0.01;
    });
  }

  async function fitToOnePage(): Promise<void> {
    if (status.value === "fitting") return;
    status.value = "fitting";
    hasRecommendation.value = false;

    try {
      // Reset sensitivity to defaults
      Object.assign(_sensitivity, INITIAL_SENSITIVITY);

      const baseline = { ...store.styles };

      // Ensure preview is rendered — if no pages found, wait and retry
      let initial = await measureCurrent();
      for (let retry = 0; retry < 3 && initial.pages === 1 && Math.abs(initial.ratio - 1.0) <= THRESHOLD; retry++) {
        await new Promise((r) => setTimeout(r, 500));
        initial = await measureCurrent();
      }

      // Already within tolerance
      if (Math.abs(initial.ratio - 1.0) <= THRESHOLD) {
        status.value = "success";
        hasRecommendation.value = true;
        store.setRecommended({});
        return;
      }

    const direction: Direction =
      initial.ratio > 1.0 + THRESHOLD ? "compress" : "expand";
    let applied: Partial<ResumeStyles> = {};
    let prevRatio = initial.ratio;
    let overshootCount = 0;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const current = await measureCurrent();
      const deviation = Math.abs(current.ratio - 1.0);

      if (deviation <= THRESHOLD) {
        status.value = "success";
        break;
      }

      const adj = calcAdjustment(store.styles, deviation, direction);
      if (Object.keys(adj).length === 0) {
        // No more parameters to adjust
        status.value = "warn";
        break;
      }

      // Check if we're going the wrong way (overshoot)
      const goingRight =
        direction === "compress"
          ? current.ratio > 1.0
          : current.ratio < 1.0;

      if (!goingRight) {
        overshootCount++;
        if (overshootCount > 3) {
          status.value = "warn";
          break;
        }
        // Reduce aggressiveness and try smaller adjustments
        for (const param of PARAMS) {
          _sensitivity[param] *= 1.5;
        }
        continue;
      }

      const changes = Object.entries(adj).map(([key, value]) =>
        makeChange(key, (store.styles as Record<string, unknown>)[key], value),
      );

      // Dampen when close to target to avoid oscillation
      if (deviation < 0.05) {
        for (const c of changes) {
          const oldVal = c.oldValue as number;
          const newVal = c.newValue as number;
          (c as Record<string, unknown>).newValue =
            Math.round((oldVal + (newVal - oldVal) * DAMPING) * 100) / 100;
        }
      }

      // Capture pre-adjustment state for sensitivity calibration
      const beforeStyles = { ...store.styles };
      await executeBatch(changes);
      Object.assign(applied, adj);

      // Measure and update sensitivity using actual delta
      const measured = await measureCurrent();
      updateSensitivity(prevRatio, measured.ratio, adj, beforeStyles);
      prevRatio = measured.ratio;

      if (Math.abs(measured.ratio - 1.0) <= THRESHOLD) {
        status.value = "success";
        break;
      }

      if (allAtBounds(applied, baseline, direction)) {
        status.value = "warn";
        break;
      }
    }

    const final = await measureCurrent();

    // Save the applied changes as recommended (for undo/reset purposes)
    const recommended: Partial<ResumeStyles> = {};
    for (const param of PARAMS) {
      const val = store.styles[param];
      if (val !== baseline[param]) {
        (recommended as Record<string, number>)[param] = val as number;
      }
    }
    store.setRecommended(recommended);
    hasRecommendation.value = true;

    if (status.value === "fitting") {
      status.value =
        Math.abs(final.ratio - 1.0) <= THRESHOLD ? "success" : "warn";
    }
  } catch (err) {
    console.error("[SmartOnePage] fitToOnePage error:", err);
    status.value = "idle";
  }
  }

  function resetToRecommended() {
    if (!hasRecommendation.value) return;
    const rec = { ...store.recommended };
    const changes = Object.entries(rec).map(([key, value]) =>
      makeChange(key, (store.styles as Record<string, unknown>)[key], value),
    );
    executeBatch(changes);
  }

  async function refresh() {
    const result = await measureCurrent();
    if (
      Math.abs(result.ratio - 1.0) <= THRESHOLD &&
      status.value !== "fitting" &&
      hasRecommendation.value
    ) {
      status.value = "success";
    } else if (
      Math.abs(result.ratio - 1.0) > THRESHOLD &&
      !hasRecommendation.value
    ) {
      status.value = "idle";
    }
  }

  return {
    pageCount,
    fillRatio,
    status,
    hasRecommendation,
    fitToOnePage,
    resetToRecommended,
    refresh,
    BOUNDS: PARAM_CONFIG,
  };
};
