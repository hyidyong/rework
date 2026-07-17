import { describe, expect, it } from "vitest";

import { extractProposalText } from "./extract";

describe("extractProposalText", () => {
  it("normalizes UTF-8 text and rejects empty documents", async () => {
    const text = await extractProposalText(
      new TextEncoder().encode("제목\r\n\r\n\r\n연구 질문  \n"),
      "text/plain",
    );
    expect(text).toBe("제목\n\n연구 질문");
    await expect(
      extractProposalText(new Uint8Array(), "text/plain"),
    ).rejects.toThrow(/empty/i);
  });
});
