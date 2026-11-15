import { describe, expect, test } from "vitest";
import { actionsFor, buildScreen, captionFor, dateLabel, headline, rowSubtitle, whenLabel, type Item, type TodayData } from "./model";

const TZ = 0;
const NOW = Date.UTC(2026, 10, 15, 9, 41);

const item = (over: Partial<Item>): Item => ({
  id: "a",
  section: "handful",
  keeper: "tock",
  roomName: "Deadlines",
  title: "Dentist booking",
  imageUrl: null,
  date: { when: "2026-11-17T15:00", what: "appointment", confident: true },
  line: null,
  takenAt: Date.UTC(2026, 10, 9, 12),
  reminder: null,
  actions: { primary: "remind", secondary: "done" },
  handled: false,
  ...over,
});

const card = (id: string, over: Partial<TodayData["handful"][number]> = {}) =>
  ({ _id: id, title: id, category: "deadlines", lineKey: null, imageUrl: null, importance: 4, takenAt: NOW, date: null, reminder: null, actions: { primary: "keep", secondary: "delete" }, ...over }) as TodayData["handful"][number];

const today = (over: Partial<TodayData> = {}): TodayData =>
  ({ day: "2026-11-15", justIn: [], missed: [], handful: [], thin: null, reminders: [], resurfaced: null, cleared: false, reading: { read: 3, total: 3, pending: 0, failed: 0 }, ...over }) as TodayData;

describe("labels", () => {
  test("dates and reminder times", () => {
    expect(dateLabel("2026-11-17T15:00")).toBe("Tue, Nov 17, 3:00 PM");
    expect(dateLabel("2026-11-20")).toBe("Fri, Nov 20");
    expect(whenLabel(Date.UTC(2026, 10, 16, 9), NOW, TZ)).toBe("Mon 9:00 AM");
    expect(whenLabel(Date.UTC(2026, 10, 30, 9), NOW, TZ)).toBe("Nov 30, 9:00 AM");
  });

  test("headlines name the keeper and the noun", () => {
    expect(headline(item({}), NOW, TZ)).toEqual({ name: "Tock", rest: "found your Tuesday booking." });
  });

  test("just in flyer", () => {
    const h = headline(item({ section: "justIn", title: "Pottery class sign-up", date: { when: "2026-11-20", what: "closes", confident: true } }), NOW, TZ);
    expect(h.rest.replace(/\u2060/g, "")).toBe("filed a sign-up that closes Friday.");
  });

  test("no noun falls back without inventing one", () => {
    expect(headline(item({ keeper: "penny", title: "Rent due Dec 1", date: { when: "2026-12-01", what: "rent", confident: true } }), NOW, TZ)).toEqual({ name: "Penny", rest: "has one for Dec 1." });
  });
});

describe("actions", () => {
  test("remind carries its default time", () => {
    const a = actionsFor(item({}), NOW, TZ);
    expect(a.primary).toBe("Remind me Mon 9:00 AM");
    expect(a.note).toBe("We'll remind you once, the day before. You can snooze or turn reminders off.");
    expect(a.secondary).toBe("Already done");
  });
  test("money never pays", () => {
    const a = actionsFor(item({ keeper: "penny", title: "Rent due Dec 1", date: { when: "2026-12-01", what: "rent", confident: true } }), NOW, TZ);
    expect(a.primary).toBe("Remind me Nov 30, 9:00 AM");
    expect(a.secondary).toBe("Already paid");
    expect(a.note).toContain("never pays or moves money");
  });
  test("no date keeps and can wait", () => {
    const a = actionsFor(item({ date: null, actions: { primary: "keep", secondary: "delete" } }), NOW, TZ);
    expect(a.primaryKind).toBe("keep");
    expect(a.secondaryKind).toBe("skip");
  });
  test("row subtitle", () => {
    expect(rowSubtitle(item({ handled: true, reminder: { id: "r" as never, state: "scheduled", dueAt: Date.UTC(2026, 10, 16, 9) } }), NOW, TZ)).toBe("Reminder set · Mon 9:00 AM");
  });
});

describe("screen", () => {
  test("loading until the query answers", () => {
    expect(buildScreen(undefined, new Set()).screen.kind).toBe("loading");
  });
  test("focus is the first unhandled, handled ones become rows", () => {
    const handled = card("a", { reminder: { id: "r" as never, state: "scheduled", dueAt: NOW }, actions: { primary: "done", secondary: "detail" } });
    const s = buildScreen(today({ handful: [handled, card("b"), card("c")] }), new Set()).screen;
    if (s.kind !== "focus") throw new Error(s.kind);
    expect(s.focus.id).toBe("b");
    expect(s.position).toBe(2);
    expect(s.total).toBe(3);
    expect(s.rows.map((r) => r.id)).toEqual(["a", "c"]);
    expect(captionFor(s)).toBe("Today's handful · 2 of 3");
  });
  test("just in comes first and says so", () => {
    const s = buildScreen(today({ justIn: [card("flyer")], handful: [card("b")] }), new Set()).screen;
    if (s.kind !== "focus") throw new Error(s.kind);
    expect(captionFor(s)).toBe("Just in · 1 of 2 today");
  });
  test("reading while a screenshot is pending and nothing is just in", () => {
    expect(buildScreen(today({ handful: [card("b")], reading: { read: 2, total: 3, pending: 1, failed: 0 } }), new Set()).screen.kind).toBe("reading");
  });
  test("done when everything is handled or skipped, empty when nothing exists", () => {
    expect(buildScreen(today({ handful: [card("b")] }), new Set(["b"])).screen.kind).toBe("done");
    expect(buildScreen(today({ cleared: true }), new Set()).screen.kind).toBe("done");
    expect(buildScreen(today({ reading: { read: 0, total: 0, pending: 0, failed: 0 } }), new Set()).screen.kind).toBe("empty");
  });
});
