import { ROOM_ORDER } from "./handful";

type Lead = (typeof ROOM_ORDER)[number] | "mixed";
export type Count = { category: (typeof ROOM_ORDER)[number]; count: number };

const TABLE: Record<Exclude<Lead, "mixed" | "unsorted">, { title: string; sentence: (n: number) => string }> = {
  deadlines: { title: "The Calendar Keeper", sentence: (n) => `${n} of them have a date on them. I made a room for those.` },
  chats: { title: "The Group Chat Historian", sentence: (n) => `${n} of them are chats. I made a room for those.` },
  money: { title: "The Receipt Collector", sentence: (n) => `${n} of them are about money. I made a room for those.` },
  ideas: { title: "The Idea Collector", sentence: (n) => `${n} of them are ideas worth keeping. I made a room for those.` },
};

// Fixed table, never written by a model. Null under five screenshots.
export function headlineFor(counts: Count[], total: number) {
  if (total < 5) return null;
  const leader = counts.reduce((best, c) => (c.count > best.count ? c : best), counts[0]);
  if (leader.category === "unsorted" || leader.count * 100 < total * 40) {
    const rooms = counts.filter((c) => c.count > 0 && c.category !== "unsorted").length;
    return {
      title: "The Well-Rounded Saver",
      sentence: `Your screenshots are spread across ${Math.max(rooms, 1)} rooms. I'm keeping them all.`,
      lead: "mixed" as const,
    };
  }
  const row = TABLE[leader.category];
  return { title: row.title, sentence: row.sentence(leader.count), lead: leader.category };
}
