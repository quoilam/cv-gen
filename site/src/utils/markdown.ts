import localforage from "localforage";
import MarkdownIt from "markdown-it";
import type {
  PluginSimple,
  PluginWithOptions,
  Options as MarkdownItOptions
} from "markdown-it";
// @ts-expect-error missing types
import MarkdownItDeflist from "markdown-it-deflist";
import LinkAttributes from "markdown-it-link-attributes";
import MarkdownItKatex from "@cvgen/markdown-it-katex";
import MarkdownItCite from "@cvgen/markdown-it-cross-ref";
import MarkdownItBadge from "@cvgen/markdown-it-badge";
import MarkdownItIcon from "@cvgen/markdown-it-icon";
import MarkdownItLatexCmds from "@cvgen/markdown-it-latex-cmds";
import { FrontMatterParser } from "@cvgen/front-matter";

type ResumeHeaderItem = {
  readonly text: string;
  readonly link?: string;
  readonly newLine?: boolean;
};

type ResumeFrontMatter = {
  readonly name?: string;
  readonly subtitle?: string;
  readonly header?: Array<ResumeHeaderItem>;
};

type MarkdownItPlugins = Array<
  PluginSimple | PluginWithOptions | [PluginWithOptions, unknown]
>;

type MarkdownServiceOptions = {
  readonly plugins?: MarkdownItPlugins;
  readonly options?: MarkdownItOptions;
};

export class MarkdownService {
  private _md: MarkdownIt;
  private _frontMatterParser: FrontMatterParser<ResumeFrontMatter>;
  private _photoStore = localforage.createInstance({ name: "ohmycv_photo" });

  constructor(opt: MarkdownServiceOptions = {}) {
    this._md = this._setupMarkdownIt(opt);
    this._frontMatterParser = new FrontMatterParser<ResumeFrontMatter>({
      errorBehavior: "last"
    });
  }

  private _setupMarkdownIt({ plugins = [], options = {} }: MarkdownServiceOptions) {
    const md = new MarkdownIt(options);

    plugins.forEach((plugin) => {
      if (Array.isArray(plugin)) md.use(...plugin);
      else md.use(plugin);
    });

    return md;
  }

  private _renderMarkdown(md: string) {
    return this._md.render(md);
  }

  /**
   * Convert
   *
   *  <dt>...</dt>
   *  <dd>...</dd>
   *  <dt>...</dt>
   *  <dd>...</dd>
   *
   * (this would happen if two deflists are adjacent)
   *
   * to
   *
   * <dl>
   *   <dt>...</dt>
   *   <dd>...</dd>
   * </dl>
   * <dl>
   *   <dt>...</dt>
   *   <dd>...</dd>
   * </dl>
   *
   * @param html HTML string
   * @returns HTML string with resolved deflists
   */
  private _resolveDeflist(html: string) {
    return html.replace(/<dl>([\s\S]*?)<\/dl>/g, (match) =>
      match.replace(/<\/dd>\n<dt>/g, "</dd>\n</dl>\n<dl>\n<dt>")
    );
  }

  private _renderHeaderItem(item: ResumeHeaderItem, hasSeparator: boolean) {
    const content = item.link
      ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.text}</a>`
      : item.text;

    const element = `<span class="resume-header-item ${hasSeparator ? "" : "no-separator"}">
      ${content}
    </span>`;

    return item.newLine ? `<br>\n${element}` : element;
  }

  public async renderHeader(frontMatter: ResumeFrontMatter, contact: string) {
    const photoBase64 = await this._photoStore.getItem<string>("photo");
    const photoHtml = photoBase64
      ? `<img class="resume-photo" src="${photoBase64}" alt="photo" />`
      : "";

    const textContent = [
      frontMatter.name ? `<h1>${frontMatter.name}</h1>\n` : "",
      frontMatter.subtitle
        ? `<span class="resume-subtitle">${frontMatter.subtitle}</span>`
        : "",
      contact
    ].join("");

    const hasPhoto = !!photoHtml;

    const classList = ["resume-header"];
    if (hasPhoto) {
      classList.push("resume-header--with-photo", "resume-header--photo-right");
    }
    const className = classList.join(" ");

    const innerHtml = hasPhoto
      ? `${photoHtml}<div class="resume-header-text">${textContent}</div>`
      : textContent;

    return `<div class="${className}">${innerHtml}</div>`;
  }

  public renderHeaderContact(frontMatter: ResumeFrontMatter) {
    const items = frontMatter.header ?? [];
    if (items.length === 0) return "";

    const content = items
      .map((item, i, array) => {
        const normalized = i === 0 && item.newLine ? { ...item, newLine: false } : item;
        return this._renderHeaderItem(
          normalized,
          i !== array.length - 1 && !array[i + 1].newLine
        );
      })
      .join("\n");

    return `<div class="resume-header-contact">${content}</div>`;
  }

  private _splitFirstHeading(html: string) {
    const match = /<h2[^>]*>[\s\S]*?<\/h2>/.exec(html);
    if (!match) return { firstHeading: "", rest: html };

    const firstHeading = match[0];
    const rest =
      html.slice(0, match.index) + html.slice(match.index + firstHeading.length);
    return { firstHeading, rest };
  }

  public async renderResume(md: string, onResult?: (err: unknown | null) => void) {
    const { body, frontMatter } = this._frontMatterParser.parse(md);
    onResult?.(this._frontMatterParser.lastError ?? null);

    const content = this._resolveDeflist(this._renderMarkdown(body));
    const header = await this.renderHeader(
      frontMatter,
      this.renderHeaderContact(frontMatter)
    );

    const { firstHeading, rest } = this._splitFirstHeading(content);
    if (firstHeading) {
      return `<div class="resume-top">${header}${firstHeading}</div>${rest}`;
    }
    return header + content;
  }
}

export const markdownService = new MarkdownService({
  plugins: [
    MarkdownItDeflist,
    MarkdownItBadge,
    MarkdownItIcon,
    MarkdownItKatex,
    MarkdownItCite,
    MarkdownItLatexCmds,
    [
      LinkAttributes,
      {
        matcher: (link: string) => /^https?:\/\//.test(link),
        attrs: {
          target: "_blank",
          rel: "noopener"
        }
      }
    ]
  ],
  options: {
    html: true
  }
});
