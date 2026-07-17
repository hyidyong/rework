import { describe, expect, it } from "vitest";

import { decryptText, encryptText } from "./envelope";

const key = Buffer.alloc(32, 13).toString("base64");

describe("AES-GCM envelope", () => {
  it("round-trips Korean academic text with associated data", () => {
    const aad = "owner-1:proposal-1";
    const encrypted = encryptText("연구 질문과 방법론", key, aad);

    expect(encrypted.ciphertext).not.toContain("연구 질문");
    expect(decryptText(encrypted, key, aad)).toBe("연구 질문과 방법론");
  });

  it("rejects ciphertext when the authentication tag is changed", () => {
    const aad = "owner-1:proposal-1";
    const encrypted = encryptText("sensitive proposal", key, aad);
    const tampered = {
      ...encrypted,
      tag: `${encrypted.tag.slice(0, -2)}AA`,
    };

    expect(() => decryptText(tampered, key, aad)).toThrow();
  });

  it("rejects decryption under different associated data", () => {
    const encrypted = encryptText("sensitive proposal", key, "owner-1:proposal-1");

    expect(() => decryptText(encrypted, key, "owner-2:proposal-1")).toThrow();
  });
});

