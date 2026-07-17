export const MAX_PROPOSAL_BYTES = 20 * 1024 * 1024;

const MIME_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
} as const;

export type SupportedMimeType =
  (typeof MIME_BY_EXTENSION)[keyof typeof MIME_BY_EXTENSION];

export type ProposalUpload = {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
};

export type ValidatedProposalUpload = {
  extension: keyof typeof MIME_BY_EXTENSION;
  mimeType: SupportedMimeType;
  safeFilename: string;
};

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function assertSignature(
  bytes: Uint8Array,
  extension: keyof typeof MIME_BY_EXTENSION,
): void {
  if (
    extension === ".pdf" &&
    !hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
  ) {
    throw new Error("PDF signature does not match the file type");
  }
  if (extension === ".docx" && !hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    throw new Error("DOCX ZIP signature does not match the file type");
  }
  if (extension === ".txt" || extension === ".md") {
    if (bytes.includes(0))
      throw new Error("Text document contains a binary signature");
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("Text document must contain valid UTF-8");
    }
  }
}

function sanitizeFilename(rawName: string, extension: string): string {
  const basename = rawName.split(/[\\/]/).pop() ?? `proposal${extension}`;
  const stem = basename.slice(0, -extension.length);
  const safeStem = stem
    .normalize("NFKC")
    // Supabase Storage object keys must remain ASCII-safe. Keep the original
    // filename separately in the proposal record, but use an ASCII key here.
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/[^\p{L}\p{N}._-]/gu, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, 120)
    .replace(/^[._-]+|[.-]+$/g, "");
  return `${safeStem || "proposal"}${extension}`;
}

export function validateProposalUpload(
  upload: ProposalUpload,
): ValidatedProposalUpload {
  if (!Number.isSafeInteger(upload.size) || upload.size < 1)
    throw new Error("Proposal file is empty");
  if (upload.size > MAX_PROPOSAL_BYTES)
    throw new Error("Proposal file must be 20 MiB or smaller");
  if (upload.bytes.byteLength !== upload.size)
    throw new Error("Proposal byte length does not match its declared size");
  const basename = upload.name.split(/[\\/]/).pop() ?? "";
  const extension = basename
    .slice(basename.lastIndexOf("."))
    .toLowerCase() as keyof typeof MIME_BY_EXTENSION;
  const expectedMime = MIME_BY_EXTENSION[extension];
  if (!expectedMime)
    throw new Error(
      "Only PDF, DOCX, TXT, and Markdown proposals are supported",
    );
  if (upload.type.toLowerCase() !== expectedMime)
    throw new Error("File extension and MIME type must match");
  assertSignature(upload.bytes, extension);
  return {
    extension,
    mimeType: expectedMime,
    safeFilename: sanitizeFilename(upload.name, extension),
  };
}
