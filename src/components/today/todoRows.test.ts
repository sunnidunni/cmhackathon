import { describe, expect, test } from "vitest";
import { buildTodoRows, showAllLabel, visibleTodos, type ShotInfo, type TodoItem } from "./todoRows";

const todo = (n: number, over: Partial<TodoItem> = {}): TodoItem => ({ _id: `t${n}`, text: `Task ${n}`, done: false, screenshotId: null, createdAt: n, ...over });
const DAY = "2026-11-15";
const NONE = new Set<string>();
const shots = new Map<string, ShotInfo>([
  ["s1", { category: "money", date: "2026-11-21" }],
  ["s2", { category: "deadlines", date: "2026-11-24T15:00" }],
]);

describe("todo rows", () => {
  test("room and due date come from the screenshot, Mote and no date without one", () => {
    const { open } = buildTodoRows([todo(1, { screenshotId: "s1" }), todo(2, { screenshotId: "s2" }), todo(3), todo(4, { screenshotId: "gone" })], shots, DAY, NONE);
    expect(open.map((r) => [r.keeper, r.due])).toEqual([
      ["penny", "Nov 21"],
      ["tock", "Nov 24, 3:00 PM"],
      ["mote", null],
      ["mote", null],
    ]);
  });

  test("done rows are split from open rows", () => {
    const { open, done } = buildTodoRows([todo(1), todo(2, { done: true })], shots, DAY, NONE);
    expect([open.length, done.length]).toEqual([1, 1]);
  });

  test("five open rows then Show all, which reveals everything", () => {
    const { open, done } = buildTodoRows([...Array.from({ length: 7 }, (_, i) => todo(i)), ...Array.from({ length: 5 }, (_, i) => todo(10 + i, { done: true }))], shots, DAY, NONE);
    const collapsed = visibleTodos(open, done, false);
    expect([collapsed.open.length, collapsed.done.length, collapsed.hidden]).toEqual([5, 3, 4]);
    expect(showAllLabel(open.length, done.length)).toBe("Show all (12)");
    const all = visibleTodos(open, done, true);
    expect([all.open.length, all.done.length, all.hidden]).toEqual([7, 5, 0]);
  });

  test("no Show all when everything fits", () => {
    const { open, done } = buildTodoRows([todo(1), todo(2), todo(3, { done: true })], shots, DAY, NONE);
    expect(visibleTodos(open, done, false).hidden).toBe(0);
  });

  test("open rows run by date, soonest first, undated last", () => {
    const { open } = buildTodoRows([todo(1), todo(2, { screenshotId: "s2" }), todo(3, { screenshotId: "s1" }), todo(4)], shots, DAY, NONE);
    expect(open.map((r) => r.id)).toEqual(["t3", "t2", "t1", "t4"]);
  });

  test("a date before today reads Was, without time and flagged late", () => {
    const past = new Map<string, ShotInfo>([["p", { category: "money", date: "2026-11-12T09:30" }]]);
    const { open } = buildTodoRows([todo(1, { screenshotId: "p" })], past, DAY, NONE);
    expect([open[0].due, open[0].late]).toEqual(["Was Nov 12", true]);
    expect(buildTodoRows([todo(1, { screenshotId: "s1" })], shots, DAY, NONE).open[0].late).toBe(false);
  });

  test("a to-do whose screenshot is already on Today is left out", () => {
    const { open, done } = buildTodoRows([todo(1, { screenshotId: "s1" }), todo(2, { screenshotId: "s2", done: true }), todo(3)], shots, DAY, new Set(["s1", "s2"]));
    expect([open.map((r) => r.id), done.length]).toEqual([["t3"], 0]);
  });
});
