import type { ResumeStyles } from "~/composables/stores/style";

export type ExportContext = {
  markdown: string;
  styles: ResumeStyles;
  name: string;
  html: string;
};

export type ExportHandler = (ctx: ExportContext) => void | Promise<void>;

class ExportService {
  private _formats = new Map<string, ExportHandler>();

  register(id: string, handler: ExportHandler) {
    this._formats.set(id, handler);
  }

  async export(id: string, ctx: ExportContext) {
    const handler = this._formats.get(id);
    if (!handler) {
      console.error(`Export format "${id}" not registered`);
      return;
    }
    await handler(ctx);
  }

  registeredFormats(): string[] {
    return [...this._formats.keys()];
  }
}

export const exportService = new ExportService();
