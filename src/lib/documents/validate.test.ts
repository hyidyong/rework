import { describe, expect, it } from "vitest";

import { MAX_PROPOSAL_BYTES, validateProposalUpload } from "./validate";

const textBytes = new TextEncoder().encode("# 연구 계획\n검증 가능한 연구 질문을 설계한다.");

describe("validateProposalUpload", () => {
  it("accepts a matching UTF-8 Markdown upload", () => {
    expect(
      validateProposalUpload({
        name: "proposal.md",
        type: "text/markdown",
        size: textBytes.byteLength,
        bytes: textBytes,
      }),
    ).toMatchObject({ extension: ".md", mimeType: "text/markdown", safeFilename: "proposal.md" });
  });

  it("rejects files above 20 MiB", () => {
    expect(() =>
      validateProposalUpload({
        name: "large.pdf",
        type: "application/pdf",
        size: MAX_PROPOSAL_BYTES + 1,
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      }),
    ).toThrow(/20 MiB/i);
  });

  it("rejects MIME and extension mismatches", () => {
    expect(() =>
      validateProposalUpload({
        name: "proposal.pdf",
        type: "text/plain",
        size: textBytes.byteLength,
        bytes: textBytes,
      }),
    ).toThrow(/match/i);
  });

  it("rejects a forged PDF without its magic bytes", () => {
    expect(() =>
      validateProposalUpload({
        name: "proposal.pdf",
        type: "application/pdf",
        size: textBytes.byteLength,
        bytes: textBytes,
      }),
    ).toThrow(/signature/i);
  });

  it("strips path fragments and unsafe filename characters", () => {
    expect(
      validateProposalUpload({
        name: "../나의 계획서 !!.txt",
        type: "text/plain",
        size: textBytes.byteLength,
        bytes: textBytes,
      }).safeFilename,
    ).toBe("나의_계획서_.txt");
  });
});
