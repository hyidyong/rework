import mammoth from "mammoth";
import { extractText } from "unpdf";

import type { SupportedMimeType } from "./validate";

const MAX_EXTRACTED_CHARACTERS = 2_000_000;

function normalizeExtractedText(text: string): string {
  const normalized = text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) throw new Error("Extracted proposal text is empty");
  if (normalized.length > MAX_EXTRACTED_CHARACTERS) {
    throw new Error("Extracted proposal text exceeds the 2,000,000 character limit");
  }
  return normalized;
}

export async function extractProposalText(bytes: Uint8Array, mimeType: SupportedMimeType): Promise<string> {
  if (bytes.byteLength === 0) throw new Error("Proposal document is empty");
  if (mimeType === "application/pdf") {
    const result = await extractText(bytes, { mergePages: true });
    return normalizeExtractedText(result.text);
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return normalizeExtractedText(result.value);
  }
  return normalizeExtractedText(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
