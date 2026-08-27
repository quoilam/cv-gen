import { injectCss } from "@cvgen/dynamic-css";
import type { ResumeStyles } from "~/composables/stores/style";

const { RENDER, DEFAULT, COLOR } = useConstant();

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

  private headingColor = (selector: string) => {
    return (
      `${selector} h1, ${selector} h2, ${selector} h3 { color: ${COLOR.THEME}; }` +
      `${selector} h2 { border-bottom-color: ${COLOR.THEME}; }`
    );
  };

  private linkColor = (selector: string) => {
    return `${selector} :not(.resume-header-item) > a { color: ${COLOR.THEME}; }`;
  };

  private badge = (selector: string, styles: ResumeStyles) => {
    const opacity = (COLOR.BADGE.opacity * 100).toFixed(0);
    return (
      `${selector} .resume-badge { ` +
      `--badge-color: ${COLOR.BADGE.color}; --badge-opacity: ${opacity}%; ` +
      `--badge-icon-scale: ${COLOR.BADGE.iconScale}; ` +
      `display: inline-flex; align-items: center; gap: 6px; padding: ${styles.badgeHeight}px 10px; ` +
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

  private paperSize = () => {
    return `@media print { @page { size: A4; } }`;
  };

  private headerLayout = (selector: string, styles: ResumeStyles) => {
    return (
      // Stacked top: header (name + subtitle + contact) on the first row, first
      // heading full-width below. Negative margin pulls the heading up so the
      // header's bottom edge dips below the heading's top.
      `${selector} .resume-top { display: grid; grid-template-columns: auto 1fr; grid-template-areas: "identity identity" "heading heading"; row-gap: 0; }` +
      `${selector} .resume-header { grid-area: identity; }` +
      `${selector} .resume-subtitle { display: block; font-weight: bold; font-size: 1.2em; }` +
      `${selector} .resume-top > h2 { grid-area: heading; margin-top: ${-styles.firstHeadingOverlap}px; }` +
      `${selector} .resume-header-contact { margin-top: 2px; }` +
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
      this.headerLayout(selector, styles) +
      this.fontFamily(selector, styles) +
      this.fontSize(selector, styles) +
      this.headingColor(selector) +
      this.linkColor(selector) +
      this.badge(selector, styles) +
      this.paragraphSpace(selector, styles) +
      this.lineHeight(selector, styles) +
      // We only need to set paper size for the preview view in the editor
      (id === undefined ? this.paperSize() : "");

    injectCss(this._injectedCssId("toolbar", id), css);
  }

  /**
   * Inject CSS that controlled by the CSS editor into the document.
   *
   * @param css CSS string
   * @param id Element ID of the corresponding resume element (dashboard). If not
   * provided, it will be set to "preview", which is the preview view in the editor.
   */
  public injectBackbone(id?: string | number) {
    let css = DEFAULT.CSS_CONTENT;
    if (id !== undefined) {
      // To control each resume element (dashboard) separately
      css = css.replaceAll(RENDER.PREVIEW_SELECTOR, this._selector(id));
    }

    injectCss(this._injectedCssId("css-editor", id), css);
  }
}

export const dynamicCssService = new DynamicCssService();
