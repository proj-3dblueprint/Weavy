import { useCallback } from 'react';

type CallbackReturn<T, B extends boolean | undefined> = B extends false ? string | null : T | null;

export const useLocalStorage = <T>(key: string) => {
  const getItem = useCallback(
    <P extends boolean | undefined = true>(parse?: P): CallbackReturn<T, P> => {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      return (parse || parse === undefined ? (JSON.parse(item) as T) : item) as CallbackReturn<T, P>;
    },
    [key],
  );

  const setItem = useCallback(
    (value: T, parse = true) => {
      if (parse) {
        localStorage.setItem(key, JSON.stringify(value));
      } else if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        throw new Error('Value must be a string or allowed to be parsed');
      }
    },
    [key],
  );

  return { getItem, setItem };
};
