import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TableOfContents,
  TextRun,
} from "docx";

type FinalPaperDocxInput = {
  title: string;
  abstract: string;
  markdown: string;
};

function markdownParagraphs(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        return new Paragraph({
          text: heading[2],
          heading:
            level === 1
              ? HeadingLevel.HEADING_1
              : level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3,
          spacing: { before: 220, after: 100 },
        });
      }
      return new Paragraph({
        children: [new TextRun(line.replace(/^[-*]\s+/, ""))],
        bullet: /^[-*]\s+/.test(line) ? { level: 0 } : undefined,
        spacing: { after: 120 },
      });
    });
}

export async function buildFinalPaperDocx({
  title,
  abstract,
  markdown,
}: FinalPaperDocxInput): Promise<Buffer> {
  const body = markdown.trim() ? markdownParagraphs(markdown) : [];
  const document = new Document({
    creator: "RE:SEARCH Academic Swarm",
    title,
    features: { updateFields: true },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 260 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "초록", bold: true })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 120, after: 100 },
          }),
          new Paragraph({ text: abstract, spacing: { after: 220 } }),
          new TableOfContents("목차", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),
          ...body,
        ],
      },
    ],
  });
  return Packer.toBuffer(document);
}
