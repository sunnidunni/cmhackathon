export function cleanTodoText(text: string): string | null {
  const trimmed = text.trim().slice(0, 200).trim();
  return trimmed === "" ? null : trimmed;
}

export const restoreDraft = (current: string, failed: string) => (current === "" ? failed : current);

export function splitTodos<T extends { done: boolean }>(items: T[]): { open: T[]; done: T[] } {
  return { open: items.filter((i) => !i.done), done: items.filter((i) => i.done) };
}
