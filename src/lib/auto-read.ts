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

// Applies the change for this session at once. Resolves false when the device could not save it, so
// the caller can say the choice may not survive a restart.
export async function setAutoRead(on: boolean): Promise<boolean> {
  autoRead = on;
  listeners.forEach((l) => l());
  return SecureStore.setItemAsync(AUTO_READ_KEY, on ? "1" : "0").then(
    () => true,
    () => false,
  );
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
