import { describe, expect, it } from "vitest";

import { readPublicEnv, readServerEnv } from "./schema";

const encryptionKey = Buffer.alloc(32, 7).toString("base64");

describe("readServerEnv", () => {
  it("accepts a complete server configuration", () => {
    const result = readServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-with-safe-length",
      OPENAI_API_KEY: "openai-key-with-safe-length",
      DATA_ENCRYPTION_KEY: encryptionKey,
      OPENAI_MODEL: "gpt-5.6-terra",
    });

    expect(result.OPENAI_MODEL).toBe("gpt-5.6-terra");
    expect(result.DATA_ENCRYPTION_KEY).toBe(encryptionKey);
  });

  it("rejects an encryption key that is not exactly 32 bytes", () => {
    expect(() =>
      readServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key-with-safe-length",
        OPENAI_API_KEY: "openai-key-with-safe-length",
        DATA_ENCRYPTION_KEY: Buffer.alloc(16).toString("base64"),
      }),
    ).toThrow(/32 bytes/i);
  });
});

describe("readPublicEnv", () => {
  it("returns only browser-safe Supabase settings", () => {
    expect(
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_key",
        SUPABASE_SERVICE_ROLE_KEY: "must-not-be-returned",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_key",
    });
  });
});
