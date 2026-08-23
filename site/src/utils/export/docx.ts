import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ExportHandler } from "./index";
import { useConstant } from "~/composables/constant";

export const docxHandler: ExportHandler = async (ctx) => {
  const { COLOR } = useConstant();
  const children: Paragraph[] = [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(ctx.html, "text/html");
  const body = doc.body;

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: text.trim() })]
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    switch (tag) {
      case "H1":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: el.textContent ?? "", color: COLOR.THEME })]
          })
        );
        break;
      case "H2":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: el.textContent ?? "", color: COLOR.THEME })]
          })
        );
        break;
      case "H3":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: el.textContent ?? "", color: COLOR.THEME })]
          })
        );
        break;
      case "P":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: el.textContent ?? "" })]
          })
        );
        break;
      case "UL":
      case "OL":
        el.childNodes.forEach((li) => {
          if (li.nodeType === Node.ELEMENT_NODE && (li as HTMLElement).tagName === "LI") {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: li.textContent ?? "" })],
                bullet: { level: 0 }
              })
            );
          }
        });
        break;
      default:
        el.childNodes.forEach(processNode);
    }
  }

  body.childNodes.forEach(processNode);

  const docx = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: ctx.styles.fontEN.name,
            size: ctx.styles.fontSize * 2
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838
            },
            margin: {
              top: Math.round(ctx.styles.marginV * 15),
              bottom: Math.round(ctx.styles.marginV * 15),
              left: Math.round(ctx.styles.marginH * 15),
              right: Math.round(ctx.styles.marginH * 15)
            }
          }
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(docx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ctx.name}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};
