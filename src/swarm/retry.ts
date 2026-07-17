export type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

type RetryableError = Error & { retryable?: boolean };

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function withRetry<T>(
  action: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (
        (error as RetryableError)?.retryable === false ||
        attempt === options.attempts
      )
        throw error;
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
