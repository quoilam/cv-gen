import type { PluginSimple, Token, Core } from "markdown-it";

const ICON_RE = /\[:([^\[\]]+)\]/g;

const processIcons: Core.RuleCore = (state) => {
  for (const t of state.tokens) {
    if (t.type !== "inline" || !t.children) continue;

    const children = t.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== "text") continue;

      const parts = child.content.split(ICON_RE);
      // With a capturing group, `a[:go]b` splits into ["a", "go", "b"].
      // Length >= 3 means at least one `[:name]` matched.
      if (parts.length < 3) continue;

      const newTokens: Token[] = [];
      parts.forEach((part, idx) => {
        if (idx % 2 === 1) {
          const icon = new state.Token("icon", "", 0);
          icon.meta = { name: part };
          newTokens.push(icon);
        } else if (part) {
          const text = new state.Token("text", "", 0);
          text.content = part;
          newTokens.push(text);
        }
      });

      children.splice(i, 1, ...newTokens);
      i += newTokens.length - 1;
    }
  }
  return true;
};

export const MarkdownItIcon: PluginSimple = (md) => {
  md.core.ruler.after("inline", "icon", processIcons);

  md.renderer.rules.icon = (tokens, idx) => {
    const { name } = tokens[idx].meta as { name: string };
    return `<span class="iconify" data-icon="${md.utils.escapeHtml(name)}"></span>`;
  };
};

export default MarkdownItIcon;
