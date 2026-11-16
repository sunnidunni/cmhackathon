import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

// Debug switches for the Notes tab, kept on the device. Both are off until turned on in Settings → Developer.
const KEY = "psst.notesPrefs";

export type NotesPrefs = { tab: boolean; byDate: boolean };
export const NOTES_PREFS_DEFAULT: NotesPrefs = { tab: false, byDate: false };

export function parseNotesPrefs(stored: string | null): NotesPrefs {
  try {
    const p: unknown = stored === null ? null : JSON.parse(stored);
    if (typeof p !== "object" || p === null) return NOTES_PREFS_DEFAULT;
    const o = p as Record<string, unknown>;
    return { tab: o.tab === true, byDate: o.byDate === true };
  } catch {
    return NOTES_PREFS_DEFAULT;
  }
}

let prefs: NotesPrefs | null = null;
let loading: Promise<NotesPrefs> | null = null;
const listeners = new Set<() => void>();

export function getNotesPrefs(): Promise<NotesPrefs> {
  if (prefs !== null) return Promise.resolve(prefs);
  loading ??= SecureStore.getItemAsync(KEY)
    .then(parseNotesPrefs)
    .catch(() => NOTES_PREFS_DEFAULT)
    .then((v) => {
      prefs ??= v;
      listeners.forEach((l) => l());
      return prefs;
    });
  return loading;
}

export async function setNotesPrefs(change: Partial<NotesPrefs>) {
  prefs = { ...(prefs ?? NOTES_PREFS_DEFAULT), ...change };
  listeners.forEach((l) => l());
  await SecureStore.setItemAsync(KEY, JSON.stringify(prefs)).catch(() => undefined);
}

// Shows the defaults until the stored value has been read from the device.
export function useNotesPrefs(): NotesPrefs {
  return (
    useSyncExternalStore(
      (l) => {
        listeners.add(l);
        void getNotesPrefs();
        return () => listeners.delete(l);
      },
      () => prefs,
    ) ?? NOTES_PREFS_DEFAULT
  );
}
