import { describe, expect, test } from "vitest";
import { chooseFocus, withSkipped, type FocusMemory } from "./focus";
import { buildScreen, type TodayData } from "./model";

const card = (id: string, over: Partial<TodayData["handful"][number]> = {}) =>
  ({ _id: id, title: id, category: "deadlines", lineKey: null, imageUrl: null, importance: 4, takenAt: 0, date: null, reminder: null, actions: { primary: "keep", secondary: "delete" }, ...over }) as TodayData["handful"][number];

const today = (over: Partial<TodayData> = {}): TodayData =>
  ({ day: "2026-11-15", justIn: [], missed: [], handful: [card("a"), card("b"), card("c")], thin: null, reminders: [], resurfaced: null, cleared: false, reading: { read: 3, total: 3, pending: 0, failed: 0 }, ...over }) as TodayData;

const focusId = (data: TodayData, skipped: string[] = [], memory: FocusMemory | null = null) => {
  const { screen, memory: next } = buildScreen(data, new Set(skipped), undefined, memory);
  return { id: screen.kind === "focus" ? screen.focus.id : null, next };
};

describe("focus for the day", () => {
  test("first pick is remembered with the day", () => {
    expect(focusId(today())).toEqual({ id: "a", next: { day: "2026-11-15", id: "a", skipped: [] } });
  });

  test("the same day keeps the remembered focus even when a newer one arrives first", () => {
    const data = today({ justIn: [card("fresh")] });
    expect(focusId(data, [], { day: "2026-11-15", id: "b", skipped: [] }).id).toBe("b");
  });

  test("a new local day picks again", () => {
    const r = focusId(today({ day: "2026-11-16" }), [], { day: "2026-11-15", id: "b", skipped: [] });
    expect(r).toEqual({ id: "a", next: { day: "2026-11-16", id: "a", skipped: [] } });
  });

  test("a focus that left the handful picks again", () => {
    const r = focusId(today({ handful: [card("a"), card("c")] }), [], { day: "2026-11-15", id: "b", skipped: [] });
    expect(r).toEqual({ id: "a", next: { day: "2026-11-15", id: "a", skipped: [] } });
  });

  test("a skipped focus picks again", () => {
    expect(focusId(today(), ["b"], { day: "2026-11-15", id: "b", skipped: [] }).id).toBe("a");
  });

  test("a handled focus picks again", () => {
    const handled = card("b", { reminder: { id: "r", state: "scheduled", dueAt: 0 } as never });
    expect(focusId(today({ handful: [card("a"), handled] }), [], { day: "2026-11-15", id: "b", skipped: [] }).id).toBe("a");
  });

  test("with nothing to focus on the memory is left alone", () => {
    const memory = { day: "2026-11-15", id: "b", skipped: [] };
    expect(chooseFocus([], memory, "2026-11-15")).toEqual({ focus: undefined, next: memory });
  });

  test("a skipped item stays gone after a restart on the same day", () => {
    const memory = { day: "2026-11-15", id: "a", skipped: ["a"] };
    const r = focusId(today(), [], memory);
    expect(r).toEqual({ id: "b", next: { day: "2026-11-15", id: "b", skipped: ["a"] } });
  });

  test("skipped ids clear when the day changes", () => {
    const r = focusId(today({ day: "2026-11-16" }), [], { day: "2026-11-15", id: "b", skipped: ["a"] });
    expect(r).toEqual({ id: "a", next: { day: "2026-11-16", id: "a", skipped: [] } });
  });

  test("withSkipped adds to the day's list and starts fresh on a new day", () => {
    const once = withSkipped({ day: "2026-11-15", id: "a", skipped: ["x"] }, "2026-11-15", "a");
    expect(once).toEqual({ day: "2026-11-15", id: "a", skipped: ["x", "a"] });
    expect(withSkipped(once, "2026-11-15", "a").skipped).toEqual(["x", "a"]);
    expect(withSkipped(once, "2026-11-16", "b")).toEqual({ day: "2026-11-16", id: "", skipped: ["b"] });
  });
});
