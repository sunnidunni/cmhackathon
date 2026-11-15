import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";
import type { FocusMemory } from "./focus";

// Kept on the device with the same pattern as auto-read: module state, SecureStore behind it.
const KEY = "psst.todayFocus";

export function parseFocusMemory(stored: string | null): FocusMemory | null {
  try {
    const v: unknown = stored === null ? null : JSON.parse(stored);
    if (typeof v !== "object" || v === null) return null;
    const { day, id } = v as Record<string, unknown>;
    return typeof day === "string" && typeof id === "string" ? { day, id } : null;
  } catch {
    return null;
  }
}

let memory: FocusMemory | null | undefined;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  loading ??= SecureStore.getItemAsync(KEY)
    .then(parseFocusMemory)
    .catch(() => null)
    .then((m) => {
      memory ??= m;
      listeners.forEach((l) => l());
    });
}

// undefined until the device has answered.
export function useFocusMemory() {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      load();
      return () => listeners.delete(l);
    },
    () => memory,
    () => undefined,
  );
  const save = useCallback((next: FocusMemory) => {
    memory = next;
    listeners.forEach((l) => l());
    void SecureStore.setItemAsync(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);
  return [value, save] as const;
}
