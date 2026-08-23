import { describe, it, expect } from "vitest";
import { dynamicCssService } from "~/utils/css";
import type { ResumeStyles } from "~/composables/stores/style";

const baseStyles: ResumeStyles = {
  marginV: 20,
  marginH: 45,
  contentWidth: 100,
  lineHeight: 1.3,
  paragraphSpace: 5,
  firstHeadingOverlap: 4,
  fontCJK: { name: "HKST", fontFamily: "HKST" },
  fontEN: { name: "Minion Pro" },
  fontSize: 15
};

const getCss = () => {
  const el = document.querySelector('[data-dynamic-css-id="cvgen-toolbar-preview"]');
  return el?.textContent ?? "";
};

describe("DynamicCssService", () => {
  it("injects heading and link colors with the default theme color", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain(
      "h1, #resume-preview h2, #resume-preview h3 { color: #377bb5; }"
    );
    expect(css).toContain(":not(.resume-header-item) > a { color: #377bb5; }");
  });

  it("injects badge styles with default vars", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain(".resume-badge");
    expect(css).toContain("--badge-color: #377bb5");
    expect(css).toContain("--badge-opacity: 15%");
  });

  it("stacks header above the first heading instead of beside it", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    // heading now spans its own full-width row
    expect(css).toContain('grid-template-areas: "identity identity" "heading heading";');
    expect(css).toContain(".resume-top > h2 { grid-area: heading; margin-top: -4px; }");
    // contact moved inside the header, no longer a right-hand grid cell
    expect(css).toContain(".resume-header-contact { margin-top: 2px; }");
    expect(css).not.toContain("grid-area: contact");
  });

  it("pulls the first heading up by the configured overlap", () => {
    dynamicCssService.injectToolbar({ ...baseStyles, firstHeadingOverlap: 10 });
    const css = getCss();
    expect(css).toContain(".resume-top > h2 { grid-area: heading; margin-top: -10px; }");
  });
});
