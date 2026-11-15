import { describe, expect, it } from "vitest";
import { countLabel, dateLabel, defaultReminder, reminderLabel, roomLine, sortItems } from "./format";

const now = new Date(2026, 10, 15, 10, 0);

describe("rooms format", () => {
  it("labels dates with and without a time", () => {
    expect(dateLabel("2026-11-20")).toBe("Fri, Nov 20");
    expect(dateLabel("2026-11-17T15:00")).toBe("Tue, Nov 17, 3:00 PM");
  });

  it("marks a reminder the day before", () => {
    const dueAt = new Date(2026, 10, 19, 9, 0).getTime();
    expect(reminderLabel(dueAt, "2026-11-20")).toBe("Thu 9:00 AM (day before)");
    expect(reminderLabel(dueAt, "2026-11-25")).toBe("Thu 9:00 AM");
    expect(reminderLabel(dueAt, null)).toBe("Thu 9:00 AM");
  });

  it("offers 9:00 AM the day before, or nothing once that has passed", () => {
    expect(defaultReminder("2026-11-20", now)?.short).toBe("Thu 9:00 AM");
    expect(defaultReminder("2026-11-16", now)).toBeNull();
  });

  it("sorts soonest first with undated between upcoming and past", () => {
    const items = [
      { id: "a", date: "2026-11-01", takenAt: 1 },
      { id: "b", date: null, takenAt: 5 },
      { id: "c", date: "2026-12-04", takenAt: 2 },
      { id: "d", date: "2026-11-17", takenAt: 3 },
    ];
    expect(sortItems("deadlines", items, now).map((i) => i.id)).toEqual(["d", "c", "b", "a"]);
    expect(sortItems("ideas", items, now).map((i) => i.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("builds room lines from real rows", () => {
    expect(roomLine("deadlines", [{ date: "2026-11-17", takenAt: 1 }, { date: null, takenAt: 2 }], now)).toBe("1 thing with a date. The soonest is Tuesday.");
    expect(roomLine("chats", [{ date: null, takenAt: 1 }], now)).toBe("1 conversation kept. Not a word repeated.");
    expect(countLabel(1)).toBe("1 screenshot");
  });
});
