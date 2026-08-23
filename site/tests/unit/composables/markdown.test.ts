import { describe, it, expect, vi } from "vitest";

vi.mock("localforage", () => {
  const instance = {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    createInstance: vi.fn(() => ({
      getItem: vi.fn(() => Promise.resolve(null)),
      setItem: vi.fn()
    }))
  };
  return { ...instance, default: instance, __esModule: true };
});

import { MarkdownService, markdownService } from "~/utils/markdown";

describe("MarkdownService", () => {
  it("renders basic markdown to HTML", async () => {
    const result = await markdownService.renderResume(
      `---
name: Test User
---

## Skills

- Cooking
- Baking`
    );
    expect(result).toContain("Test User");
    expect(result).toContain("<h2>Skills</h2>");
    expect(result).toContain("<li>Cooking</li>");
  });

  it("renders KaTeX math expressions", async () => {
    const result = await markdownService.renderResume(
      `---
name: Math Test
---

$E = mc^2$`
    );
    expect(result).toContain("katex");
    expect(result).toContain("E = mc^2");
  });

  it("renders definition lists via markdown-it-deflist", async () => {
    const result = await markdownService.renderResume(
      `---
name: Deflist Test
---

Term
: Definition text here`
    );
    expect(result).toContain("<dt>Term</dt>");
    expect(result).toContain("<dd>Definition text here</dd>");
  });

  it("renders cross-references", async () => {
    const result = await markdownService.renderResume(
      `---
name: Ref Test
---

[~P1]: **Paper Title**
: Citation detail

See [~P1] for more.`
    );
    expect(result).toContain("Paper Title");
    expect(result).toContain("cross-ref");
  });

  it("opens external links with target=_blank", async () => {
    const result = await markdownService.renderResume(
      `---
name: Link Test
---

[External](https://example.com)`
    );
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener"');
    expect(result).toContain('href="https://example.com"');
  });

  it("handles empty body gracefully", async () => {
    const result = await markdownService.renderResume(
      `---
name: Empty
---`
    );
    expect(result).toContain("Empty");
    expect(result).toContain("resume-header");
  });

  it("renders header with name and contact links", async () => {
    const result = await markdownService.renderResume(
      `---
name: John Doe
header:
  - text: john@email.com
    link: mailto:john@email.com
---

Content here.`
    );
    expect(result).toContain("John Doe");
    expect(result).toContain("resume-header");
    expect(result).toContain("john@email.com");
    expect(result).toContain('href="mailto:john@email.com"');
  });

  it("plain MarkdownService without plugins renders basic HTML", async () => {
    const md = new MarkdownService();
    const result = await md.renderResume(`---
name: Test
---

**bold** text`);
    expect(result).toContain("Test");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("text");
  });

  it("passes null to onResult when front matter is valid", async () => {
    let result: unknown = "unset";
    await markdownService.renderResume(
      `---
name: Test User
---

Content`,
      (err) => {
        result = err;
      }
    );
    expect(result).toBeNull();
  });

  it("passes the error to onResult and falls back to last front matter on parse failure", async () => {
    await markdownService.renderResume(`---
name: Good Name
---

Content`);

    // The parser logs the expected YAML error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let result: unknown = "unset";
    const html = await markdownService.renderResume(
      `---
name: "Bad
---

Content`,
      (err) => {
        result = err;
      }
    );
    errorSpy.mockRestore();
    expect(result).not.toBeNull();
    // errorBehavior "last": falls back to the previously parsed front matter
    expect(html).toContain("Good Name");
  });

  it("renders bold dt as badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**Cooking Engineer Intern**
  ~ Microwavesoft
  ~ 2021`);
    expect(result).toContain('class="resume-badge"');
    expect(result).toContain("Cooking Engineer Intern");
    expect(result).toContain("Microwavesoft");
  });

  it("extracts #hex color prefix in badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**#377bb5 Microwavesoft**
  ~ 2021`);
    expect(result).toContain("--badge-color: #377bb5");
    expect(result).toContain("Microwavesoft");
    expect(result).not.toContain("#377bb5 Microwavesoft");
  });

  it("renders image icon in badge", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**![](logo.png)Company**
  ~ 2021`);
    expect(result).toContain('class="resume-badge-icon"');
    expect(result).toContain('src="logo.png"');
  });

  it("does not badge bold text outside dt", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**just bold** text here`);
    expect(result).not.toContain("resume-badge");
    expect(result).toContain("<strong>just bold</strong>");
  });

  it("does not treat non-hex # as color prefix", async () => {
    const result = await markdownService.renderResume(`---
name: Badge Test
---

**#1 Best**
  ~ 2021`);
    expect(result).not.toContain("--badge-color");
    expect(result).toContain("#1 Best");
  });

  it("stacks header above the first heading with contact inside header", async () => {
    const result = await markdownService.renderResume(`---
name: Jane Doe
subtitle: Engineer
header:
  - text: jane@x.com
---

## Experience

Worked here.`);

    const headerIdx = result.indexOf('<div class="resume-header">');
    const subtitleIdx = result.indexOf('<span class="resume-subtitle">Engineer</span>');
    const contactIdx = result.indexOf('<div class="resume-header-contact">');
    const h2Idx = result.indexOf("<h2>Experience</h2>");

    // order: header → subtitle → contact → h2 (heading below, not beside, the header)
    expect(headerIdx).toBeGreaterThan(-1);
    expect(subtitleIdx).toBeGreaterThan(headerIdx);
    expect(contactIdx).toBeGreaterThan(subtitleIdx);
    expect(h2Idx).toBeGreaterThan(contactIdx);

    // contact must be nested inside .resume-header (its closing div comes after it)
    const headerCloseIdx = result.indexOf("</div>", contactIdx);
    expect(headerCloseIdx).toBeGreaterThan(contactIdx);
  });
});
