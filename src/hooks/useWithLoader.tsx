/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any --- Callback with args requires using any */
import { useCallback, useMemo, useState } from 'react';

type LoaderFunction<T> = (...args: any[]) => Promise<T>;

interface SyncWithLoaderResult {
  isLoading: boolean;
  execute: (...args: any[]) => void;
}

interface WithLoaderResult<T> {
  isLoading: boolean;
  execute: LoaderFunction<T>;
}

export function useWithLoader(
  callback: (...args: any[]) => Promise<void>,
  options: { sync: true },
): SyncWithLoaderResult;
export function useWithLoader<T>(callback: LoaderFunction<T>, options?: { sync: false }): WithLoaderResult<T>;
export function useWithLoader<T>(
  callback: LoaderFunction<T>,
  options?: { sync: boolean },
): WithLoaderResult<T> | SyncWithLoaderResult {
  const [isLoading, setIsLoading] = useState(false);

  const asyncExecute = useCallback(
    async (...args: Parameters<typeof callback>) => {
      setIsLoading(true);

      try {
        const result = await callback(...args);
        setIsLoading(false);
        return result;
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [callback],
  );

  const executeSync = useCallback(
    (...args: Parameters<typeof callback>) => {
      setIsLoading(true);
      callback(...args)
        .then(() => {
          setIsLoading(false);
        })
        .catch((error) => {
          setIsLoading(false);
          throw error;
        });
    },
    [callback],
  );

  return useMemo(
    () => ({
      isLoading,
      execute: options?.sync ? executeSync : asyncExecute,
    }),
    [isLoading, options?.sync, executeSync, asyncExecute],
  );
}
