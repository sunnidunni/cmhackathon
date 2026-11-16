import type { KeeperId } from "@/design/psst";

export type RoomTally = { keeper: KeeperId; count: number };

export const RECAP_WEEK = {
  range: "Nov 9 – 15",
  rooms: [
    { keeper: "tock", count: 9 },
    { keeper: "murmur", count: 6 },
    { keeper: "mote", count: 5 },
    { keeper: "penny", count: 4 },
  ] satisfies RoomTally[],
  busiestDay: "Wednesday",
};

export const RECAP_TOTAL = RECAP_WEEK.rooms.reduce((n, r) => n + r.count, 0);

export const KEEPER_OF_WEEK: KeeperId = RECAP_WEEK.rooms.reduce((a, b) => (b.count > a.count ? b : a)).keeper;

export const RECAP_CARD_COUNT = 4;
