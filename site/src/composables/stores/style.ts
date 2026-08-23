import { copy } from "@cvgen/utils";
import type { Font } from "~/composables/constant";

export type ResumeStyles = {
  marginV: number;
  marginH: number;
  contentWidth: number;
  lineHeight: number;
  paragraphSpace: number;
  firstHeadingOverlap: number;
  badgeHeight: number;
  fontCJK: Font;
  fontEN: Font;
  fontSize: number;
};

export const useStyleStore = defineStore("style", () => {
  const { DEFAULT } = useConstant();
  const styles = reactive<ResumeStyles>(copy(DEFAULT.STYLES));

  const setStyle = async <T extends keyof ResumeStyles>(
    key: T,
    value: ResumeStyles[T]
  ) => {
    // resolve font
    if (["fontCJK", "fontEN"].includes(key)) {
      await fontService.resolve(value as Font);
    }

    // update styles for the current resume
    styles[key] = value;

    // update CSS
    // vue-smart-pages will handle margins, height and width
    if (!["marginV", "marginH"].includes(key)) dynamicCssService.injectToolbar(styles);
  };

  const setStyles = async (values: Partial<ResumeStyles>) => {
    for (const key of Object.keys(values) as (keyof ResumeStyles)[]) {
      const value = values[key];
      if (value === undefined) continue;
      if (["fontCJK", "fontEN"].includes(key)) {
        await fontService.resolve(value as Font);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (styles as any)[key] = value;
    }
    dynamicCssService.injectToolbar(styles);
  };

  return {
    styles,
    setStyle,
    setStyles
  };
});
