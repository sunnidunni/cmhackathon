import { useSyncExternalStore } from "react";

type ActState = { dismissed: ReadonlySet<string>; undone: ReadonlySet<string>; completed: ReadonlySet<string> };

let state: ActState = { dismissed: new Set(), undone: new Set(), completed: new Set() };
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
const toggle = (key: keyof ActState, id: string, on: boolean) => {
  const next = new Set(state[key]);
  if (on) next.add(id);
  else next.delete(id);
  state = { ...state, [key]: next };
  listeners.forEach((fn) => fn());
};

export const useActState = () => useSyncExternalStore(subscribe, () => state, () => state);
export const dismissAct = (id: string) => toggle("dismissed", id, true);
export const completeAct = (id: string) => toggle("completed", id, true);
export const setReminderMoved = (id: string, moved: boolean) => toggle("undone", id, !moved);
export const resetActs = () => {
  state = { dismissed: new Set(), undone: new Set(), completed: new Set() };
  listeners.forEach((fn) => fn());
};
