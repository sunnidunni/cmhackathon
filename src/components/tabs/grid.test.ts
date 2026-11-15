import { describe, expect, test } from "vitest";
import { COLUMNS, groupByLevel, stepLevel } from "./grid";

const at = (iso: string) => new Date(iso).getTime();
const NOW = at("2026-11-15T20:00:00Z");

describe("photo grid levels", () => {
  test("pinching out goes toward days, pinching in toward years, one level per gesture", () => {
    expect(stepLevel("month", "out")).toBe("day");
    expect(stepLevel("day", "in")).toBe("month");
    expect(stepLevel("month", "in")).toBe("year");
    expect(stepLevel("day", "out")).toBe("day");
    expect(stepLevel("year", "in")).toBe("year");
  });

  test("columns grow as thumbnails shrink", () => {
    expect(COLUMNS).toEqual({ day: 2, month: 4, year: 6 });
  });
});

describe("groupByLevel", () => {
  const items = [
    { id: "a", takenAt: at("2026-11-15T18:00:00Z") },
    { id: "b", takenAt: at("2026-11-15T09:00:00Z") },
    { id: "c", takenAt: at("2026-11-14T20:00:00Z") },
    { id: "d", takenAt: at("2026-11-10T20:00:00Z") },
    { id: "e", takenAt: at("2026-10-02T20:00:00Z") },
    { id: "f", takenAt: at("2025-12-31T20:00:00Z") },
  ];

  test("day level names today and yesterday, then dates", () => {
    const groups = groupByLevel(items, "day", 0, NOW);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Tue, Nov 10", "Fri, Oct 2", "Wed, Dec 31, 2025"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  test("month level", () => {
    const groups = groupByLevel(items, "month", 0, NOW);
    expect(groups.map((g) => g.label)).toEqual(["November 2026", "October 2026", "December 2025"]);
    expect(groups[0].items).toHaveLength(4);
  });

  test("year level", () => {
    const groups = groupByLevel(items, "year", 0, NOW);
    expect(groups.map((g) => g.label)).toEqual(["2026", "2025"]);
    expect(groups[0].items).toHaveLength(5);
  });

  test("uses the phone's time zone, not UTC", () => {
    const late = [{ id: "x", takenAt: at("2026-11-16T02:00:00Z") }];
    expect(groupByLevel(late, "day", 480, NOW)[0].label).toBe("Today");
    expect(groupByLevel(late, "day", 0, NOW)[0].label).toBe("Mon, Nov 16");
  });

  test("keeps the input order and handles an empty list", () => {
    expect(groupByLevel([], "day", 0, NOW)).toEqual([]);
  });
});
