import { injectCss } from "@cvgen/dynamic-css";
import { useConstant } from "~/composables/constant";
import type { ResumeStyles } from "~/composables/stores/style";

const { RENDER } = useConstant();

/**
 * Service for injecting dynamic CSS into the document.
 *
 * Note: This service will not handle margins, height and width, which should be
 * handled by the `vue-smart-pages` package.
 */
export class DynamicCssService {
  constructor() {}

  private _selector = (id?: string | number) => {
    return `#resume-${id ?? RENDER.PREVIEW_ID}`;
  };

  private _injectedCssId = (type: "toolbar" | "css-editor", id?: string | number) => {
    return `cvgen-${type}-${id ?? RENDER.PREVIEW_ID}`;
  };

  private headingColor = (selector: string, styles: ResumeStyles) => {
    return (
      `${selector} h1, ${selector} h2, ${selector} h3 { color: ${styles.headingColor}; }` +
      `${selector} h2 { border-bottom-color: ${styles.headingColor}; }`
    );
  };

  private linkColor = (selector: string, styles: ResumeStyles) => {
    return `${selector} :not(.resume-header-item) > a { color: ${styles.linkColor}; }`;
  };

  private sectionBar = (selector: string, styles: ResumeStyles) => {
    if (!styles.sectionBarEnabled) return "";
    const opacity = (styles.sectionBarOpacity * 100).toFixed(0);
    return (
      `${selector} h2 { ` +
      `background: color-mix(in srgb, ${styles.sectionBarColor} ${opacity}%, transparent); ` +
      `padding: 2px 8px; border-radius: 4px; border-bottom-style: none; }`
    );
  };

  private badge = (selector: string, styles: ResumeStyles) => {
    const opacity = (styles.badgeOpacity * 100).toFixed(0);
    return (
      `${selector} .resume-badge { ` +
      `--badge-color: ${styles.badgeColor}; --badge-opacity: ${opacity}%; ` +
      `--badge-icon-scale: ${styles.badgeIconScale}; ` +
      `display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; ` +
      `border-radius: 4px; overflow: visible; ` +
      `background: color-mix(in srgb, var(--badge-color) var(--badge-opacity), transparent); ` +
      `color: var(--badge-color); font-weight: bold; }` +
      `${selector} .resume-badge-icon { width: 16px; height: 16px; object-fit: contain; flex-shrink: 0; ` +
      `mix-blend-mode: multiply; transform: scale(var(--badge-icon-scale)); transform-origin: center; }`
    );
  };

  private lineHeight = (selector: string, styles: ResumeStyles) => {
    const height = styles.lineHeight;

    return (
      `${selector} p, ${selector} li { line-height: ${height.toFixed(2)}; }` +
      `${selector} h2, ${selector} h3 { line-height: ${(height * 1.154).toFixed(2)}; }` +
      `${selector} dl { line-height: ${(height * 1.038).toFixed(2)}; }`
    );
  };

  private paragraphSpace = (selector: string, styles: ResumeStyles) => {
    return `${selector} h2 { margin-top: ${styles.paragraphSpace}px; }`;
  };

  private fontFamily = (selector: string, styles: ResumeStyles) => {
    const fontEN = styles.fontEN.fontFamily || styles.fontEN.name;
    const fontCJK = styles.fontCJK.fontFamily || styles.fontCJK.name;
    return `${selector} { font-family: ${fontEN}, ${fontCJK}, Arial, Helvetica, sans-serif; }`;
  };

  private fontSize = (selector: string, styles: ResumeStyles) => {
    return `${selector} { font-size: ${styles.fontSize}px; }`;
  };

  private paperSize = (styles: ResumeStyles) => {
    return `@media print { @page { size: ${styles.paper}; } }`;
  };

  private headerLayout = (selector: string) => {
    return (
      // Flexbox header when photo is present — center text vertically with photo
      `${selector} .resume-header--with-photo { display: flex; align-items: center; gap: 18px; }` +
      `${selector} .resume-header--with-photo.resume-header--photo-right { flex-direction: row-reverse; }` +
      // Photo sizing — compact portrait ratio, flex-shrink so it keeps its size
      `${selector} .resume-photo { width: 80px; height: 96px; object-fit: cover; border-radius: 3px; flex-shrink: 0; }` +
      // Text wrapper fills remaining space
      `${selector} .resume-header-text { flex: 1; min-width: 0; }` +
      // Text is centered in the remaining area after photo
      `${selector} .resume-header--with-photo .resume-header-text { text-align: center; }` +
      `${selector} .resume-header--with-photo .resume-header h1 { text-align: center; }` +
      `${selector} .resume-header--photo-right .resume-header-text { text-align: center; }` +
      `${selector} .resume-header--photo-right .resume-header h1 { text-align: center; }`
    );
  };

  /**
   * Inject CSS that controlled by the toolbar into the document.
   *
   * @param styles Resume styles
   * @param id Element ID of the corresponding resume element (dashboard). If not
   * provided, it will be set to "preview", which is the preview view in the editor.
   */
  public injectToolbar(styles: ResumeStyles, id?: string | number) {
    const selector = this._selector(id);

    const css =
      this.headerLayout(selector) +
      this.fontFamily(selector, styles) +
      this.fontSize(selector, styles) +
      this.headingColor(selector, styles) +
      this.linkColor(selector, styles) +
      this.sectionBar(selector, styles) +
      this.badge(selector, styles) +
      this.paragraphSpace(selector, styles) +
      this.lineHeight(selector, styles) +
      // We only need to set paper size for the preview view in the editor
      (id === undefined ? this.paperSize(styles) : "");

    injectCss(this._injectedCssId("toolbar", id), css);
  }

  /**
   * Inject CSS that controlled by the CSS editor into the document.
   *
   * @param css CSS string
   * @param id Element ID of the corresponding resume element (dashboard). If not
   * provided, it will be set to "preview", which is the preview view in the editor.
   */
  public injectCssEditor(css: string, id?: string | number) {
    if (id !== undefined) {
      // To control each resume element (dashboard) separately
      css = css.replaceAll(RENDER.PREVIEW_SELECTOR, this._selector(id));
    }

    injectCss(this._injectedCssId("css-editor", id), css);
  }
}

export const dynamicCssService = new DynamicCssService();
