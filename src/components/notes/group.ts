import type { Category } from "@/components/rooms/format";

export type Note = { _id: string; category: string; takenAt: number };
export type NoteGroup<T extends Note> = { key: string; title: string; data: T[] };

const ROOMS: { key: Category; title: string }[] = [
  { key: "deadlines", title: "Deadlines" },
  { key: "chats", title: "Chats" },
  { key: "money", title: "Money" },
  { key: "ideas", title: "Ideas" },
  { key: "unsorted", title: "Unsorted" },
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// The heading a note sits under when grouped by date, in the device's own calendar.
export function dateBucket(takenAt: number, now: Date = new Date()): { key: string; title: string } {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(takenAt))) / 86400000);
  if (days <= 0) return { key: "today", title: "Today" };
  if (days === 1) return { key: "yesterday", title: "Yesterday" };
  if (days < 7) return { key: "week", title: "Earlier this week" };
  const d = new Date(takenAt);
  const title = d.getFullYear() === now.getFullYear() ? MONTHS[d.getMonth()] : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return { key: `${d.getFullYear()}-${d.getMonth()}`, title };
}

// Rooms in their usual order, or date buckets newest first. Notes inside a group are newest first; empty groups are dropped.
export function groupNotes<T extends Note>(notes: T[], byDate: boolean, now: Date = new Date()): NoteGroup<T>[] {
  const sorted = [...notes].sort((a, b) => b.takenAt - a.takenAt);
  if (!byDate) {
    return ROOMS.map((r) => ({
      key: r.key,
      title: r.title,
      data: sorted.filter((n) => (ROOMS.some((x) => x.key === n.category) ? n.category : "unsorted") === r.key),
    })).filter((g) => g.data.length > 0);
  }
  const groups: NoteGroup<T>[] = [];
  for (const n of sorted) {
    const b = dateBucket(n.takenAt, now);
    const last = groups[groups.length - 1];
    if (last?.key === b.key) last.data.push(n);
    else groups.push({ ...b, data: [n] });
  }
  return groups;
}
