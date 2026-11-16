import { describe, expect, it } from "vitest";
import { computeInsights, localDay, type InsightShot } from "./insights";

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 16, 20, 0); // Mon Nov 16 2026 20:00Z
const shot = (id: string, takenAt: number, category = "chats", title = id): InsightShot => ({ _id: id, takenAt, category, title });
const input = (items: InsightShot[], extra: Partial<Parameters<typeof computeInsights>[0]> = {}) => ({
  items,
  now: NOW,
  tzOffsetMinutes: 0,
  openTodos: 0,
  reminders: 0,
  ...extra,
});
const many = (n: number, at = NOW - DAY, category = "chats") => Array.from({ length: n }, (_, i) => shot(`s${i}`, at - i * 1000, category));

describe("insights", () => {
  it("returns nothing for an empty or tiny library", () => {
    expect(computeInsights(input([]))).toEqual([]);
    expect(computeInsights(input(many(4)))).toEqual([]);
  });

  it("counts the total and the last 7 days", () => {
    const items = [...many(5, NOW - DAY), ...many(3, NOW - 20 * DAY).map((s, i) => ({ ...s, _id: `old${i}` }))];
    const total = computeInsights(input(items)).find((i) => i.id === "total");
    expect(total?.text).toBe("8 screenshots in all, 5 in the last 7 days.");
  });

  it("uses the phone's time zone for day boundaries", () => {
    const edge = Date.UTC(2026, 10, 9, 23, 30);
    expect(localDay(edge, 0)).not.toBe(localDay(edge, -540));
    expect(localDay(edge, -540) - localDay(edge, 0)).toBe(1);
    // Nov 10 12:00Z is 6 local days before Nov 16 in UTC, but 7 days before Nov 17 (05:00 local) in UTC+9.
    const boundary = Date.UTC(2026, 10, 10, 12);
    const lastWeek = [shot("a", boundary), ...many(5, NOW - DAY)];
    expect(computeInsights(input(lastWeek)).find((i) => i.id === "total")?.text).toBe("6 screenshots in all, 6 in the last 7 days.");
    expect(computeInsights(input(lastWeek, { tzOffsetMinutes: -540 })).find((i) => i.id === "total")?.text).toBe("6 screenshots in all, 5 in the last 7 days.");
  });

  it("names the biggest room and its share, first room winning ties", () => {
    const items = [...many(3, NOW - DAY, "money"), ...many(3, NOW - DAY, "chats").map((s) => ({ ...s, _id: "c" + s._id })), shot("x", NOW - DAY, "ideas")];
    const room = computeInsights(input(items)).find((i) => i.id === "room");
    expect(room?.text).toBe("Chats is your biggest room: 3 of 7, 43%.");
  });

  it("finds the busiest weekday and day, ties going to the earlier weekday and the later day", () => {
    const monday = Date.UTC(2026, 10, 9, 12); // Mon Nov 9
    const tuesday = Date.UTC(2026, 10, 10, 12); // Tue Nov 10
    const items = [shot("a", monday), shot("b", monday + 1000), shot("c", tuesday), shot("d", tuesday + 1000), shot("e", tuesday + 2000), shot("f", monday - 7 * DAY), shot("g", monday - 7 * DAY + 1000)];
    const out = computeInsights(input(items));
    expect(out.find((i) => i.id === "weekday")?.text).toBe("You screenshot most on Mondays: 4 of 7.");
    expect(out.find((i) => i.id === "day")?.text).toBe("Your busiest day was Tue, Nov 10: 3 screenshots.");
  });

  it("points at the oldest screenshot with its month", () => {
    const old = Date.UTC(2026, 2, 3, 12);
    const items = [shot("old", old, "ideas", "Soup recipe"), ...many(5, NOW - DAY)];
    const out = computeInsights(input(items)).find((i) => i.id === "oldest");
    expect(out?.text).toBe("You've had this one since March: Soup recipe.");
    expect(out?.shotId).toBe("old");
  });

  it("adds the year when the oldest is from an earlier year", () => {
    const old = Date.UTC(2025, 11, 3, 12);
    const items = [shot("old", old), ...many(5, NOW - DAY)];
    expect(computeInsights(input(items)).find((i) => i.id === "oldest")?.text).toBe("You've had this one since December 2025: old.");
  });

  it("uses each timestamp's own offset when given a time zone", () => {
    const july = Date.UTC(2026, 6, 2, 4, 30); // Thu Jul 2 00:30 in New York (UTC-4)
    expect(localDay(july, 300)).toBe(localDay(Date.UTC(2026, 6, 1, 12), 0));
    expect(localDay(july, 300, "America/New_York")).toBe(localDay(Date.UTC(2026, 6, 2, 12), 0));
  });

  it("does not claim an exact reminder count at the preview cap", () => {
    const out = computeInsights(input(many(6), { reminders: 20 }));
    expect(out.find((i) => i.id === "reminders")?.text).toBe("20 or more reminders are set.");
  });

  it("only mentions to-dos and reminders when there are some", () => {
    const items = many(6);
    expect(computeInsights(input(items)).some((i) => i.id === "todos" || i.id === "reminders")).toBe(false);
    const out = computeInsights(input(items, { openTodos: 1, reminders: 2 }));
    expect(out.find((i) => i.id === "todos")?.text).toBe("1 thing to do came out of your screenshots.");
    expect(out.find((i) => i.id === "reminders")?.text).toBe("2 reminders are set.");
  });
});
