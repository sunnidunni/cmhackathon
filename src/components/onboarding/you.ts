import { roomName } from "../tabs/helpers";

type Count = { category: string; count: number };

export function barSegments(counts: Count[]): { category: string; fraction: number }[] {
  const total = counts.reduce((n, c) => n + c.count, 0);
  if (total === 0) return [];
  return counts.filter((c) => c.count > 0).map((c) => ({ category: c.category, fraction: c.count / total }));
}

export function countsLine(counts: Count[]): string {
  return counts
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => `${roomName(c.category)} ${c.count}`)
    .join(" · ");
}

export function fromLine(total: number): string {
  return `From your ${total} ${total === 1 ? "screenshot" : "screenshots"}`;
}
