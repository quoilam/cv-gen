import { describe, it, expect, vi } from "vitest";

vi.mock("localforage", () => {
  const instance = {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    createInstance: vi.fn(() => ({
      getItem: vi.fn(() => Promise.resolve(null)),
      setItem: vi.fn(),
    })),
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
- Baking`,
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

$E = mc^2$`,
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
: Definition text here`,
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

See [~P1] for more.`,
    );
    expect(result).toContain("Paper Title");
    expect(result).toContain("cross-ref");
  });

  it("opens external links with target=_blank", async () => {
    const result = await markdownService.renderResume(
      `---
name: Link Test
---

[External](https://example.com)`,
    );
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener"');
    expect(result).toContain('href="https://example.com"');
  });

  it("handles empty body gracefully", async () => {
    const result = await markdownService.renderResume(
      `---
name: Empty
---`,
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

Content here.`,
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
});
