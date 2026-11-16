import { useSyncExternalStore } from "react";

let last: string | null = null;
const listeners = new Set<() => void>();

export const setConnectionError = (message: string | null) => {
  last = message;
  listeners.forEach((l) => l());
};

export const getConnectionError = () => last;

export function useConnectionError(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getConnectionError,
  );
}
