"use client";

import { useState, useCallback } from "react";

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

interface UseRetryReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
}

export function useRetry<T = unknown>({
  maxRetries = 3,
  retryDelay = 1000,
  backoffMultiplier = 2,
}: UseRetryOptions = {}): UseRetryReturn<T> {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T> => {
      setIsRetrying(true);
      setLastError(null);

      let currentRetryCount = 0;
      let currentDelay = retryDelay;

      while (currentRetryCount <= maxRetries) {
        try {
          const result = await operation();
          setRetryCount(currentRetryCount);
          setIsRetrying(false);
          return result;
        } catch (error) {
          const err =
            error instanceof Error ? error : new Error("Unknown error");
          setLastError(err);
          setRetryCount(currentRetryCount);

          if (currentRetryCount === maxRetries) {
            setIsRetrying(false);
            throw err;
          }

          // Wait before retrying (with exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= backoffMultiplier;
          currentRetryCount++;
        }
      }

      setIsRetrying(false);
      throw lastError || new Error("Max retries exceeded");
    },
    [maxRetries, retryDelay, backoffMultiplier, lastError]
  );

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  }, []);

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    reset,
  };
}
