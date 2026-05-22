import type { ResumeStyles } from "~/composables/stores/style";

// Balanced strategy bounds
const BOUNDS = {
  fontSize: { min: 11, max: 20, default: 15 },
  lineHeight: { min: 1.1, max: 2.0, default: 1.3 },
  marginV: { min: 18, max: 80, default: 50 },
  marginH: { min: 18, max: 80, default: 45 },
  paragraphSpace: { min: 0, max: 50, default: 5 }
};

// Visual cost weights (sum = 1.0)
const WEIGHTS = {
  marginV: 0.35,
  lineHeight: 0.30,
  fontSize: 0.20,
  marginH: 0.10,
  paragraphSpace: 0.05
};

// Sensitivity: approximate height change per unit of each parameter
const SENSITIVITY = {
  fontSize: 0.07,
  lineHeight: 0.40,
  marginV: 0.005,
  marginH: 0.002,
  paragraphSpace: 0.01
};

type ParamName = "fontSize" | "lineHeight" | "marginV" | "marginH" | "paragraphSpace";

const THRESHOLD = 0.02; // ±2% tolerance

type Direction = "compress" | "expand";

export const useSmartOnePage = (resumeId: string | number) => {
  const store = useStyleStore();
  const { executeBatch } = useStyleHistory();

  const pageCount = ref(1);
  const fillRatio = ref(1);
  const status = ref<"idle" | "fitting" | "success" | "warn">("idle");
  const hasRecommendation = ref(false);

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

  function makeChange(key: string, oldValue: unknown, newValue: unknown) {
    return {
      key: key as keyof ResumeStyles,
      oldValue: oldValue as ResumeStyles[keyof ResumeStyles],
      newValue: newValue as ResumeStyles[keyof ResumeStyles]
    };
  }

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

  function resetToRecommended() {
    if (!hasRecommendation.value) return;
    const rec = { ...store.recommended };
    const changes = Object.entries(rec).map(([key, value]) =>
      makeChange(key, (store.styles as Record<string, unknown>)[key], value)
    );
    executeBatch(changes);
  }

  async function refresh() {
    const result = await measureCurrent();
    if (Math.abs(result.ratio - 1.0) <= THRESHOLD && status.value !== "fitting" && hasRecommendation.value) {
      status.value = "success";
    } else if (Math.abs(result.ratio - 1.0) > THRESHOLD && !hasRecommendation.value) {
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
    BOUNDS
  };
};
