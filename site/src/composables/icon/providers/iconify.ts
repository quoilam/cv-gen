export interface IconResult {
  name: string;
  svg: string;
  url: string;
  provider: string;
}

export interface IconProvider {
  readonly id: string;
  search(keyword: string): Promise<IconResult[]>;
}

export class IconifyProvider implements IconProvider {
  readonly id = "iconify";

  async search(keyword: string): Promise<IconResult[]> {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=20`
    );

    if (!res.ok) throw new Error(`Iconify API error: ${res.status}`);

    const json = await res.json();
    const icons = (json.icons ?? []) as string[];

    if (icons.length === 0) return [];

    const svgRes = await fetch("https://api.iconify.design/icons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons, width: 24, height: 24 })
    });

    if (!svgRes.ok) throw new Error(`Iconify SVG fetch error: ${svgRes.status}`);

    const svgJson = await svgRes.json();
    return Object.entries(svgJson.icons ?? {}).map(([name, data]: [string, any]) => ({
      name,
      svg: `<span class="iconify" data-icon="${name}">${data.body}</span>`,
      url: `https://api.iconify.design/${name}.svg`,
      provider: "iconify"
    }));
  }
}
