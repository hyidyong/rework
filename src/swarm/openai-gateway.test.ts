import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { OpenAIModelGateway } from "./openai-gateway";

describe("OpenAIModelGateway", () => {
  it("initializes lazily and validates the parsed structured output", async () => {
    const parse = vi.fn().mockResolvedValue({ output_parsed: { answer: "grounded" } });
    const factory = vi.fn(() => ({ responses: { parse } }));
    const gateway = new OpenAIModelGateway({ apiKey: "test-key", model: "test-model" }, factory);
    const schema = z.object({ answer: z.string().min(3) });

    expect(factory).not.toHaveBeenCalled();
    await expect(
      gateway.run({
        role: "analyzer",
        systemPrompt: "Analyze only the supplied proposal.",
        input: { proposal: "text" },
        outputSchema: schema,
      }),
    ).resolves.toEqual({ answer: "grounded" });
    expect(factory).toHaveBeenCalledOnce();
    expect(parse).toHaveBeenCalledOnce();
  });

  it("fails closed when the model omits structured output", async () => {
    const gateway = new OpenAIModelGateway(
      { apiKey: "test-key", model: "test-model" },
      () => ({ responses: { parse: vi.fn().mockResolvedValue({ output_parsed: null }) } }),
    );

    await expect(
      gateway.run({
        role: "director",
        systemPrompt: "Review.",
        input: {},
        outputSchema: z.object({ verdict: z.string() }),
      }),
    ).rejects.toThrow(/structured/i);
  });
});
