import { describe, it, expect } from "vitest";
import { dynamicCssService } from "~/utils/css";
import type { ResumeStyles } from "~/composables/stores/style";

const baseStyles: ResumeStyles = {
  marginV: 50,
  marginH: 45,
  contentWidth: 100,
  lineHeight: 1.3,
  paragraphSpace: 5,
  firstHeadingOverlap: 4,
  themeColor: "#377bb5",
  headingColor: "#111111",
  linkColor: "#222222",
  sectionBarColor: "#333333",
  sectionBarOpacity: 0.5,
  sectionBarEnabled: true,
  badgeColor: "#444444",
  badgeOpacity: 0.2,
  fontCJK: { name: "HKST", fontFamily: "HKST" },
  fontEN: { name: "Minion Pro" },
  fontSize: 15,
  paper: "A4"
};

const getCss = () => {
  const el = document.querySelector('[data-dynamic-css-id="cvgen-toolbar-preview"]');
  return el?.textContent ?? "";
};

describe("DynamicCssService", () => {
  it("injects heading and link colors", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain(
      "h1, #resume-preview h2, #resume-preview h3 { color: #111111; }"
    );
    expect(css).toContain("color: #222222;");
  });

  it("injects section bar CSS when enabled", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain("color-mix(in srgb, #333333 50%, transparent)");
    expect(css).toContain("border-bottom-style: none;");
  });

  it("skips section bar when disabled", () => {
    dynamicCssService.injectToolbar({ ...baseStyles, sectionBarEnabled: false });
    const css = getCss();
    expect(css).not.toContain("#333333");
  });

  it("injects badge styles with default vars", () => {
    dynamicCssService.injectToolbar(baseStyles);
    const css = getCss();
    expect(css).toContain(".resume-badge");
    expect(css).toContain("--badge-color: #444444");
    expect(css).toContain("--badge-opacity: 20%");
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
