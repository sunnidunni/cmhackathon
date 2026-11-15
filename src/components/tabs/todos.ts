export const OPEN_LIMIT = 5;

export function splitTodos<T extends { done: boolean }>(items: T[]): { open: T[]; done: T[] } {
  return { open: items.filter((i) => !i.done), done: items.filter((i) => i.done) };
}

export function visibleOpen<T>(open: T[], expanded: boolean): { shown: T[]; hidden: number } {
  if (expanded || open.length <= OPEN_LIMIT) return { shown: open, hidden: 0 };
  return { shown: open.slice(0, OPEN_LIMIT), hidden: open.length - OPEN_LIMIT };
}

export const showAllLabel = (openCount: number) => `Show all (${openCount})`;
