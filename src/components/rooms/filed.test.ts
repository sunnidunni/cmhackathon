import { describe, expect, it } from "vitest";
import { chipLabel, filedWhen, recentlyFiled, roomChips, type FiledItem } from "./filed";

const tz = 480;
const now = Date.parse("2026-11-15T17:40:00-08:00");
const at = (s: string) => Date.parse(s);
const items: FiledItem[] = [
  { id: "a", title: "Pottery night", category: "deadlines", takenAt: at("2026-11-15T09:12:00-08:00"), imageUrl: null },
  { id: "b", title: "Rent", category: "chats", takenAt: at("2026-11-14T15:12:00-08:00"), imageUrl: null },
  { id: "c", title: "Blurry", category: "unsorted", takenAt: at("2026-11-15T10:00:00-08:00"), imageUrl: null },
  { id: "d", title: "Bill", category: "money", takenAt: at("2026-11-12T08:00:00-08:00"), imageUrl: null },
];

describe("rooms filed", () => {
  it("prefers the handful count over New today", () => {
    const chips = roomChips(items, ["chats", "money", "money"], now, tz);
    expect(chipLabel(chips.money!)).toBe("2 in today's handful");
    expect(chipLabel(chips.chats!)).toBe("1 in today's handful");
    expect(chipLabel(chips.deadlines!)).toBe("New today");
    expect(chips.ideas).toBeUndefined();
  });
  it("lists the newest filed items, skipping unsorted", () => {
    expect(recentlyFiled(items).map((i) => i.id)).toEqual(["a", "b", "d"]);
  });
  it("labels the filed time", () => {
    expect(filedWhen(items[0].takenAt, now, tz)).toBe("today, 9:12 AM");
    expect(filedWhen(items[1].takenAt, now, tz)).toBe("yesterday, 3:12 PM");
    expect(filedWhen(items[3].takenAt, now, tz)).toBe("Nov 12");
  });
});
