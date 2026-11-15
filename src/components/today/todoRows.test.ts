import { describe, expect, test } from "vitest";
import { buildTodoRows, showAllLabel, visibleTodos, type ShotInfo, type TodoItem } from "./todoRows";

const todo = (n: number, over: Partial<TodoItem> = {}): TodoItem => ({ _id: `t${n}`, text: `Task ${n}`, done: false, screenshotId: null, createdAt: n, ...over });
const shots = new Map<string, ShotInfo>([
  ["s1", { category: "money", date: "2026-11-21" }],
  ["s2", { category: "deadlines", date: "2026-11-24T15:00" }],
]);

describe("todo rows", () => {
  test("room and due date come from the screenshot, Mote and no date without one", () => {
    const { open } = buildTodoRows([todo(1, { screenshotId: "s1" }), todo(2, { screenshotId: "s2" }), todo(3), todo(4, { screenshotId: "gone" })], shots);
    expect(open.map((r) => [r.keeper, r.due])).toEqual([
      ["penny", "Due Sat, Nov 21"],
      ["tock", "Due Tue, Nov 24, 3:00 PM"],
      ["mote", null],
      ["mote", null],
    ]);
  });

  test("done rows are split from open rows", () => {
    const { open, done } = buildTodoRows([todo(1), todo(2, { done: true })], shots);
    expect([open.length, done.length]).toEqual([1, 1]);
  });

  test("five open rows then Show all, which reveals everything", () => {
    const { open, done } = buildTodoRows([...Array.from({ length: 7 }, (_, i) => todo(i)), ...Array.from({ length: 5 }, (_, i) => todo(10 + i, { done: true }))], shots);
    const collapsed = visibleTodos(open, done, false);
    expect([collapsed.open.length, collapsed.done.length, collapsed.hidden]).toEqual([5, 3, 4]);
    expect(showAllLabel(open.length, done.length)).toBe("Show all (12)");
    const all = visibleTodos(open, done, true);
    expect([all.open.length, all.done.length, all.hidden]).toEqual([7, 5, 0]);
  });

  test("no Show all when everything fits", () => {
    const { open, done } = buildTodoRows([todo(1), todo(2), todo(3, { done: true })], shots);
    expect(visibleTodos(open, done, false).hidden).toBe(0);
  });
});
