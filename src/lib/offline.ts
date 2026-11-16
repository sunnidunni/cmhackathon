import { useSyncExternalStore } from "react";
import { DEV_TOOLS } from "./dev-flags";

// "Offline" means: the server can't be reached, so the screens show sample screenshots instead.
// That only happens in demo builds (EXPO_PUBLIC_DEV_TOOLS=1), where it keeps a demo going on bad Wi-Fi.
// Every other build stays online and shows a retry screen, so a slow sign-in or a crashed screen
// can never put sample screenshots in front of a real user.
export const SAMPLE_DATA_WHEN_OFFLINE = DEV_TOOLS;

let state: { offline: boolean; reason: string | null } = { offline: false, reason: null };
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

export const isOffline = () => state.offline;
export const useOffline = () =>
  useSyncExternalStore(
    subscribe,
    () => state.offline,
    () => state.offline,
  );

export function setOffline(reason: string) {
  if (!SAMPLE_DATA_WHEN_OFFLINE || state.offline) return;
  state = { offline: true, reason };
  listeners.forEach((fn) => fn());
}
