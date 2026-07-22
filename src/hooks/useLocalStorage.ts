import { useEffect, useState } from "react";

/**
 * Persists a piece of state to localStorage under the given key.
 * Falls back silently to in-memory state if localStorage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — ignore.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
