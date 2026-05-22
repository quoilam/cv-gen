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

export const useSmartOnePage = (resumeId: string | number) => {
  const store = useStyleStore();
  const { executeBatch } = useStyleHistory();

  const pageCount = ref(1);
  const overflowPercent = ref(0);
  const status = ref<"idle" | "fitting" | "success" | "warn">("idle");
  const hasRecommendation = ref(false);

  function estimateOverflow(): { pages: number; overflow: number } {
    const pages = document.querySelectorAll(
      `#resume-${resumeId} [data-part="page"]`
    );
    const count = pages.length || 1;

    if (count <= 1) return { pages: 1, overflow: 1.0 };

    let totalHeight = 0;
    pages.forEach((p) => {
      totalHeight += p.scrollHeight;
    });
    const firstPageHeight = (pages[0] as HTMLElement).clientHeight;
    const overflow = firstPageHeight > 0 ? totalHeight / firstPageHeight : count;

    return { pages: count, overflow };
  }

  function weightedEstimate(
    current: ResumeStyles,
    overflow: number
  ): Partial<ResumeStyles> {
    const excess = overflow - 1.0;
    if (excess <= 0) return {};

    const result: Partial<ResumeStyles> = {};
    const params: ParamName[] = [
      "fontSize",
      "lineHeight",
      "marginV",
      "marginH",
      "paragraphSpace"
    ];

    for (const param of params) {
      const share = excess * WEIGHTS[param];
      const reduction = share / SENSITIVITY[param];
      const currentVal = current[param] as number;
      const newVal = Math.max(
        currentVal - reduction,
        BOUNDS[param].min
      );
      (result as Record<string, number>)[param] = Math.round(newVal * 100) / 100;
    }

    return result;
  }

  async function waitForRender(): Promise<void> {
    await nextTick();
    await new Promise((r) => setTimeout(r, 300));
  }

  async function measureCurrent(): Promise<{ pages: number; overflow: number }> {
    await waitForRender();
    const result = estimateOverflow();
    pageCount.value = result.pages;
    overflowPercent.value = Math.round((result.overflow - 1.0) * 100);
    return result;
  }

  function refine(
    current: ResumeStyles,
    overflow: number,
    applied: Partial<ResumeStyles>
  ): Partial<ResumeStyles> | null {
    const remaining = overflow - 1.0;
    if (remaining <= 0.02) return null;

    const params: ParamName[] = [
      "fontSize",
      "lineHeight",
      "marginV",
      "marginH",
      "paragraphSpace"
    ];

    const available = params.filter((p) => {
      const val = applied[p] ?? (current[p] as number);
      return val > BOUNDS[p].min;
    });

    if (available.length === 0) return null;

    const totalWeight = available.reduce((s, p) => s + WEIGHTS[p], 0);

    const correction: Partial<ResumeStyles> = {};
    for (const param of available) {
      const share = remaining * (WEIGHTS[param] / totalWeight);
      const reduction = share / SENSITIVITY[param];
      const currentVal = (applied[param] ?? current[param]) as number;
      const newVal = Math.max(
        currentVal - reduction,
        BOUNDS[param].min
      );
      (correction as Record<string, number>)[param] =
        Math.round(newVal * 100) / 100;
    }

    return correction;
  }

  function atBounds(values: Partial<ResumeStyles>): boolean {
    const params: ParamName[] = [
      "fontSize",
      "lineHeight",
      "marginV",
      "marginH",
      "paragraphSpace"
    ];
    return params.every(
      (p) => (values[p] ?? store.styles[p]) <= BOUNDS[p].min + 0.01
    );
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

    if (initial.overflow <= 1.02) {
      status.value = "success";
      pageCount.value = 1;
      overflowPercent.value = 0;
      hasRecommendation.value = true;
      store.setRecommended({});
      return;
    }

    // Step 1: Weighted estimate
    let applied = weightedEstimate(current, initial.overflow);

    const changes = Object.entries(applied).map(([key, value]) =>
      makeChange(key, (current as Record<string, unknown>)[key], value)
    );
    await executeBatch(changes);

    // Step 2: Measure and refine (up to 2 rounds)
    for (let round = 0; round < 2; round++) {
      const measurement = await measureCurrent();
      if (measurement.pages <= 1 && measurement.overflow <= 1.02) break;

      const correction = refine(current, measurement.overflow, applied);
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

    if (final.pages <= 1) {
      status.value = "success";
    } else if (atBounds(applied)) {
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
    if (result.pages <= 1 && status.value !== "fitting" && hasRecommendation.value) {
      status.value = "success";
    } else if (result.pages > 1 && !hasRecommendation.value) {
      status.value = "idle";
    }
  }

  return {
    pageCount,
    overflowPercent,
    status,
    hasRecommendation,
    fitToOnePage,
    resetToRecommended,
    refresh,
    BOUNDS
  };
};
