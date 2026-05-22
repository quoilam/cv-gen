import { useConstant, type Font } from "~/composables/constant";
import type { ResumeStyles } from "~/composables/stores/style";

export interface FontProvider {
  readonly name: string;
  search(query: string): Font[];
  resolve(font: Font): Promise<void>;
}

class LocalFonts implements FontProvider {
  readonly name = "local";

  search(query: string): Font[] {
    const { FONT } = useConstant();
    const all = [...FONT.LOCAL.EN, ...FONT.LOCAL.CJK];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.fontFamily && f.fontFamily.toLowerCase().includes(q))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolve(_font: Font): Promise<void> {
    // Local fonts are always available — no-op
  }
}

export class SystemFonts implements FontProvider {
  readonly name = "system";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  search(_query: string): Font[] {
    // queryLocalFonts requires user gesture, so search is async-in-practice.
    return [];
  }

  async resolve(font: Font): Promise<void> {
    await document.fonts.load(`12px "${font.fontFamily || font.name}"`);
  }

  async query(): Promise<Font[]> {
    if (!("queryLocalFonts" in window)) return [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fonts = await (window as any).queryLocalFonts();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [...fonts].map((f: any) => ({
        name: f.fullName,
        fontFamily: f.family
      }));
    } catch {
      return [];
    }
  }
}

class FontService {
  private _providers: FontProvider[] = [];

  register(provider: FontProvider) {
    this._providers.push(provider);
  }

  search(query: string): Font[] {
    return this._providers.flatMap((p) => p.search(query));
  }

  async resolve(font: Font): Promise<void> {
    for (const provider of this._providers) {
      await provider.resolve(font);
    }
  }

  async observer(fonts: string | string[]) {
    const list = typeof fonts === "string" ? [fonts] : fonts;
    const observers = list.map((font) => document.fonts.load(`12px ${font}`));
    return Promise.all(observers);
  }

  presetObserver(styles: ResumeStyles) {
    return this.observer([
      styles.fontEN.fontFamily || styles.fontEN.name,
      styles.fontCJK.fontFamily || styles.fontCJK.name
    ]);
  }

  includes(font: Font): boolean {
    const { FONT } = useConstant();
    return FONT.LOCAL.includes(font);
  }

  async querySystemFonts(): Promise<Font[]> {
    const sys = this._providers.find((p) => p instanceof SystemFonts) as
      | SystemFonts
      | undefined;
    return sys ? sys.query() : [];
  }
}

export const fontService = new FontService();
fontService.register(new LocalFonts());
fontService.register(new SystemFonts());
