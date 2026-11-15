import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";

// Whether new screenshots are read automatically when Psst opens or returns to the front.
// Kept on the device; on unless the person turns it off.
const AUTO_READ_KEY = "psst.autoRead";
export const AUTO_READ_DEFAULT = true;

export function parseAutoRead(stored: string | null): boolean {
  return stored === null ? AUTO_READ_DEFAULT : stored !== "0";
}

let autoRead: boolean | null = null;
let loading: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export function getAutoRead(): Promise<boolean> {
  if (autoRead !== null) return Promise.resolve(autoRead);
  loading ??= SecureStore.getItemAsync(AUTO_READ_KEY)
    .then(parseAutoRead)
    .catch(() => AUTO_READ_DEFAULT)
    .then((v) => {
      autoRead ??= v;
      listeners.forEach((l) => l());
      return autoRead;
    });
  return loading;
}

export async function setAutoRead(on: boolean) {
  autoRead = on;
  listeners.forEach((l) => l());
  await SecureStore.setItemAsync(AUTO_READ_KEY, on ? "1" : "0").catch(() => undefined);
}

// Device asset ids of screenshots the person removed from Psst. Removing deletes the server row, so the
// asset would look new again and the next automatic read would bring it back. Sync skips these ids.
const REMOVED_KEY = "psst.removedAssets";
const REMOVED_CAP = 200;
let removed: string[] | null = null;
let loadingRemoved: Promise<string[]> | null = null;

export function parseRemovedAssets(stored: string | null): string[] {
  try {
    const parsed: unknown = stored === null ? [] : JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function getRemovedAssets(): Promise<string[]> {
  if (removed !== null) return Promise.resolve(removed);
  loadingRemoved ??= SecureStore.getItemAsync(REMOVED_KEY)
    .then(parseRemovedAssets)
    .catch(() => [])
    .then((ids) => {
      removed ??= ids;
      return removed;
    });
  return loadingRemoved;
}

export async function markRemovedAsset(deviceAssetId: string) {
  const ids = await getRemovedAssets();
  if (ids.includes(deviceAssetId)) return;
  removed = [...ids, deviceAssetId].slice(-REMOVED_CAP);
  await SecureStore.setItemAsync(REMOVED_KEY, JSON.stringify(removed)).catch(() => undefined);
}

// enabled shows the default until the stored value has been read from the device.
export function useAutoRead() {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void getAutoRead();
      return () => listeners.delete(l);
    },
    () => autoRead,
  );
  const setEnabled = useCallback((on: boolean) => setAutoRead(on), []);
  return { enabled: value ?? AUTO_READ_DEFAULT, setEnabled };
}
