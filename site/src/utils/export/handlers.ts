import type { ExportHandler } from "./index";
import { exportService } from "./index";
import { docxHandler } from "./docx";

export const pdfHandler: ExportHandler = (ctx) => {
  const prevTitle = document.title;
  document.title = ctx.name;
  window.print();
  document.title = prevTitle;
};

export function registerExportHandlers() {
  exportService.register("pdf", pdfHandler);
  exportService.register("docx", docxHandler);
}
