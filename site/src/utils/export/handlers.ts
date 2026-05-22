import { downloadFile } from "@renovamen/utils";
import type { ExportHandler } from "./index";
import { exportService } from "./index";

export const mdHandler: ExportHandler = (ctx) => {
  downloadFile(`${ctx.name}.md`, ctx.markdown);
};

export const pdfHandler: ExportHandler = (ctx) => {
  const prevTitle = document.title;
  document.title = ctx.name;
  window.print();
  document.title = prevTitle;
};

export const htmlHandler: ExportHandler = (ctx) => {
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ctx.name}</title>
  <style>
    @page { size: ${ctx.styles.paper}; margin: 0; }
    body {
      margin: ${ctx.styles.marginV}px ${ctx.styles.marginH}px;
      font-family: ${ctx.styles.fontEN.fontFamily || ctx.styles.fontEN.name}, ${ctx.styles.fontCJK.fontFamily || ctx.styles.fontCJK.name}, Arial, Helvetica, sans-serif;
      font-size: ${ctx.styles.fontSize}px;
      line-height: ${ctx.styles.lineHeight};
      color: black;
    }
    h1, h2, h3 { color: ${ctx.styles.themeColor}; }
    h2 { border-bottom: 1px solid ${ctx.styles.themeColor}; }
    a { color: ${ctx.styles.themeColor}; }
    ${ctx.css}
  </style>
</head>
<body>${ctx.html}</body>
</html>`;

  downloadFile(`${ctx.name}.html`, doc);
};

export function registerExportHandlers() {
  exportService.register("md", mdHandler);
  exportService.register("pdf", pdfHandler);
  exportService.register("html", htmlHandler);
}
