import { describe, expect, it, vi } from "vitest";

import { withRetry } from "./retry";

describe("withRetry", () => {
  it("retries transient failures with bounded attempts", async () => {
    const action = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue("ok");
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(withRetry(action, { attempts: 3, baseDelayMs: 10, sleep })).resolves.toBe("ok");
    expect(action).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(10);
  });

  it("does not retry a non-retryable failure", async () => {
    const error = Object.assign(new Error("invalid output"), { retryable: false });
    const action = vi.fn().mockRejectedValue(error);

    await expect(withRetry(action, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow("invalid output");
    expect(action).toHaveBeenCalledOnce();
  });
});
