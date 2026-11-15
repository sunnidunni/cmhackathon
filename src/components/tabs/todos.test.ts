import { describe, expect, it } from "vitest";
import { showAllLabel, splitTodos, visibleOpen } from "./todos";

describe("todos", () => {
  it("splits open from done, keeping order", () => {
    const items = [
      { _id: "1", done: false },
      { _id: "2", done: true },
      { _id: "3", done: false },
    ];
    expect(splitTodos(items)).toEqual({ open: [items[0], items[2]], done: [items[1]] });
  });
  it("shows at most 5 open items until expanded", () => {
    const open = Array.from({ length: 8 }, (_, i) => i);
    expect(visibleOpen(open, false)).toEqual({ shown: [0, 1, 2, 3, 4], hidden: 3 });
    expect(visibleOpen(open, true)).toEqual({ shown: open, hidden: 0 });
  });
  it("hides nothing when there are 5 or fewer", () => {
    expect(visibleOpen([1, 2, 3, 4, 5], false)).toEqual({ shown: [1, 2, 3, 4, 5], hidden: 0 });
    expect(visibleOpen([], false)).toEqual({ shown: [], hidden: 0 });
  });
  it("words the show all row with the full open count", () => {
    expect(showAllLabel(12)).toBe("Show all (12)");
  });
});
