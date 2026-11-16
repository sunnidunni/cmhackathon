import { useSyncExternalStore } from "react";

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
  if (state.offline) return;
  state = { offline: true, reason };
  listeners.forEach((fn) => fn());
}
