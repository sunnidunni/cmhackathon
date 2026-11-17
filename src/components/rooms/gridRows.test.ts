import { describe, expect, test } from "vitest";
import { buildRows, rowLayouts, snapLevel } from "./gridRows";

const groups = [
  { key: "2026-10", label: "November 2026", items: [1, 2, 3, 4, 5].map((n) => ({ _id: `a${n}` })) },
  { key: "2026-9", label: "October 2026", items: [{ _id: "b1" }] },
];

describe("buildRows", () => {
  test("a date line, then rows of at most cols items", () => {
    const rows = buildRows(groups, 2);
    expect(rows.map((r) => (r.type === "header" ? r.label : r.items.map((i) => i._id).join(",")))).toEqual([
      "November 2026",
      "a1,a2",
      "a3,a4",
      "a5",
      "October 2026",
      "b1",
    ]);
  });

  test("marks the first row under each date line, so the grid knows where a group starts", () => {
    const rows = buildRows(groups, 2);
    expect(rows.map((r) => (r.type === "row" ? r.first : null))).toEqual([null, true, false, false, null, true]);
  });

  test("keys are stable and unique", () => {
    const keys = buildRows(groups, 4).map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(buildRows(groups, 4).map((r) => r.key));
  });

  test("empty input gives no rows", () => {
    expect(buildRows([], 3)).toEqual([]);
  });
});

describe("rowLayouts", () => {
  test("offsets start below the list header and add up row heights", () => {
    const rows = buildRows(groups, 2);
    const layouts = rowLayouts(rows, { header: 40, row: 100 }, 200);
    expect(layouts.map((l) => [l.offset, l.length])).toEqual([
      [200, 40],
      [240, 100],
      [340, 100],
      [440, 100],
      [540, 40],
      [580, 100],
    ]);
  });
});

describe("snapLevel", () => {
  test("spread past the threshold goes toward days, pinch in toward years, small moves stay", () => {
    expect(snapLevel("month", 1.3)).toBe("day");
    expect(snapLevel("month", 0.7)).toBe("year");
    expect(snapLevel("month", 1.05)).toBe("month");
    expect(snapLevel("day", 2)).toBe("day");
    expect(snapLevel("year", 0.4)).toBe("year");
  });
});
