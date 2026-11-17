import { describe, expect, test } from "vitest";
import { fairOrder } from "./queue";

const row = (userId: string, n: number) => ({ userId, n });
const show = (rows: { userId: string; n: number }[]) => rows.map((r) => `${r.userId}${r.n}`).join(" ");

describe("fairOrder", () => {
  test("takes one from each user in turn, so a long line does not block a short one", () => {
    const rows = [row("a", 1), row("a", 2), row("a", 3), row("a", 4), row("b", 1), row("c", 1), row("c", 2)];
    expect(show(fairOrder(rows))).toBe("a1 b1 c1 a2 c2 a3 a4");
  });
  test("keeps a single user's order and returns every row once", () => {
    const rows = [row("a", 1), row("a", 2), row("a", 3)];
    expect(show(fairOrder(rows))).toBe("a1 a2 a3");
    expect(fairOrder([])).toEqual([]);
  });
});
