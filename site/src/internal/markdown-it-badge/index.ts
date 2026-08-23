import type { PluginSimple, Token, Core } from "markdown-it";

type BadgeMeta = {
  color?: string;
  iconUrl?: string;
  text: string;
};

const COLOR_PREFIX = /^#([0-9a-fA-F]{3,8})\s+(.+)$/;

function parseBadge(children: Token[]): BadgeMeta | null {
  let strongStart = -1;
  let strongEnd = -1;
  for (let i = 0; i < children.length; i++) {
    if (children[i].type === "strong_open") strongStart = i;
    else if (children[i].type === "strong_close") {
      strongEnd = i;
      break;
    }
  }
  if (strongStart === -1 || strongEnd === -1) return null;

  // If the strong is not the only content of the dt (e.g. `**bold** rest`),
  // keep it as plain bold instead of a banner.
  for (let i = 0; i < children.length; i++) {
    if (i > strongStart && i < strongEnd) continue;
    const t = children[i];
    if ((t.type === "text" || t.type === "code_inline") && t.content.trim() !== "") {
      return null;
    }
  }

  let text = "";
  let iconUrl: string | undefined;
  for (let i = strongStart + 1; i < strongEnd; i++) {
    const t = children[i];
    if (t.type === "text" || t.type === "code_inline") text += t.content;
    else if (t.type === "image") {
      const src = t.attrGet("src");
      if (src) iconUrl = src;
    }
  }

  let color: string | undefined;
  const m = text.match(COLOR_PREFIX);
  if (m) {
    color = `#${m[1]}`;
    text = m[2];
  }

  return { color, iconUrl, text };
}

const processBadges: Core.RuleCore = (state) => {
  const tokens = state.tokens;
  let inDt = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "dt_open") {
      inDt = true;
      continue;
    }
    if (t.type === "dt_close") {
      inDt = false;
      continue;
    }
    if (!inDt || t.type !== "inline") continue;

    const meta = parseBadge(t.children ?? []);
    if (!meta) continue;

    const token = new state.Token("badge", "", 0);
    token.meta = meta;
    token.content = meta.text;
    t.children = [token];
  }
  return true;
};

export const MarkdownItBadge: PluginSimple = (md) => {
  md.core.ruler.after("inline", "badge", processBadges);

  md.renderer.rules.badge = (tokens, idx) => {
    const { color, iconUrl, text } = tokens[idx].meta as BadgeMeta;
    const style = color ? ` style="--badge-color: ${color}"` : "";
    const img = iconUrl
      ? `<img class="resume-badge-icon" src="${iconUrl}" alt="" />`
      : "";
    return `<span class="resume-badge"${style}>${img}<span class="resume-badge-text">${md.utils.escapeHtml(text)}</span></span>`;
  };
};

export default MarkdownItBadge;
