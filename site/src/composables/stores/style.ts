import { copy } from "@renovamen/utils";
import type { ValidPaperSize, Font } from "~/composables/constant";

export type ResumeStyles = {
  marginV: number;
  marginH: number;
  lineHeight: number;
  paragraphSpace: number;
  themeColor: string;
  fontCJK: Font;
  fontEN: Font;
  fontSize: number;
  paper: ValidPaperSize;
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

  return {
    styles,
    setStyle
  };
});
