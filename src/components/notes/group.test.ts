import { describe, expect, it } from "vitest";
import { dateBucket, groupNotes } from "./group";

const now = new Date(2026, 10, 15, 10, 0);
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
const note = (id: string, category: string, takenAt: number) => ({ _id: id, category, takenAt });

describe("dateBucket", () => {
  it("names recent days, then months", () => {
    expect(dateBucket(at(2026, 10, 15, 1), now).title).toBe("Today");
    expect(dateBucket(at(2026, 10, 14, 23), now).title).toBe("Yesterday");
    expect(dateBucket(at(2026, 10, 10), now).title).toBe("Earlier this week");
    expect(dateBucket(at(2026, 10, 2), now).title).toBe("November");
    expect(dateBucket(at(2025, 11, 2), now).title).toBe("December 2025");
  });
});

describe("groupNotes", () => {
  const notes = [
    note("a", "money", at(2026, 10, 1)),
    note("b", "deadlines", at(2026, 10, 15)),
    note("c", "money", at(2026, 10, 14)),
    note("d", "weird", at(2026, 9, 3)),
  ];

  it("groups by room in room order, newest first, unknown rooms as unsorted", () => {
    const groups = groupNotes(notes, false, now);
    expect(groups.map((g) => g.title)).toEqual(["Deadlines", "Money", "Unsorted"]);
    expect(groups[1].data.map((n) => n._id)).toEqual(["c", "a"]);
    expect(groups[2].data.map((n) => n._id)).toEqual(["d"]);
  });

  it("groups by date newest first", () => {
    const groups = groupNotes(notes, true, now);
    expect(groups.map((g) => [g.title, g.data.map((n) => n._id)])).toEqual([
      ["Today", ["b"]],
      ["Yesterday", ["c"]],
      ["November", ["a"]],
      ["October", ["d"]],
    ]);
  });

  it("returns nothing for no notes", () => {
    expect(groupNotes([], true, now)).toEqual([]);
    expect(groupNotes([], false, now)).toEqual([]);
  });
});
