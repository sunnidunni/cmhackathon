import type { Category } from "./format";

export type FiledItem = { id: string; title: string; category: Category; takenAt: number; imageUrl: string | null };
export type RoomChip = { kind: "handful"; count: number } | { kind: "new" };

const localDay = (t: number, tz: number) => new Date(t - tz * 60000).toISOString().slice(0, 10);

export function roomChips(items: FiledItem[], handful: Category[], now: number, tz: number): Partial<Record<Category, RoomChip>> {
  const out: Partial<Record<Category, RoomChip>> = {};
  for (const c of handful) {
    const prev = out[c];
    out[c] = { kind: "handful", count: prev?.kind === "handful" ? prev.count + 1 : 1 };
  }
  const today = localDay(now, tz);
  for (const i of items) if (!out[i.category] && localDay(i.takenAt, tz) === today) out[i.category] = { kind: "new" };
  return out;
}

export const chipLabel = (chip: RoomChip) => (chip.kind === "new" ? "New today" : `${chip.count} in today's handful`);

export const recentlyFiled = (items: FiledItem[], n = 3) =>
  items.filter((i) => i.category !== "unsorted").sort((a, b) => b.takenAt - a.takenAt).slice(0, n);

export function filedWhen(takenAt: number, now: number, tz: number): string {
  const d = new Date(takenAt - tz * 60000);
  const h = d.getUTCHours();
  const time = `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  if (localDay(takenAt, tz) === localDay(now, tz)) return `today, ${time}`;
  if (localDay(takenAt, tz) === localDay(now - 86400000, tz)) return `yesterday, ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
