import { describe, expect, it } from "vitest";
import { filedLine, freshJustIn } from "./filed";
import type { Item } from "./model";

const item = (over: Partial<Item>): Item => ({
  id: "a",
  section: "justIn",
  keeper: "tock",
  roomName: "Deadlines",
  title: "Pottery sign-up",
  imageUrl: null,
  date: { when: "2026-11-20", what: "Sign-up closes", confident: true },
  line: null,
  takenAt: 0,
  reminder: null,
  actions: { primary: "remind", secondary: "done" },
  handled: false,
  ...over,
} as Item);

describe("freshJustIn", () => {
  it("returns only unseen, unhandled just-in items", () => {
    const items = [item({ id: "a" }), item({ id: "b", section: "handful" }), item({ id: "c", handled: true }), item({ id: "d" })];
    expect(freshJustIn(items, new Set(["a"])).map((i) => i.id)).toEqual(["d"]);
  });
});

describe("filedLine", () => {
  it("Tock names a closing sign-up by weekday", () => {
    expect(filedLine(item({}))).toBe("Filed. Pottery sign-up closes Friday.");
  });
  it("Tock uses 'is on' for a booking", () => {
    expect(filedLine(item({ title: "Dentist", date: { when: "2026-11-19T09:00", what: "Appointment", confident: true } as Item["date"] }))).toBe("Filed. Dentist is on Thursday.");
  });
  it("Murmur names a plan by weekday", () => {
    expect(filedLine(item({ keeper: "murmur", roomName: "Chats", title: "Dinner with Sam", date: { when: "2026-11-19", what: "Dinner", confident: true } as Item["date"] }))).toBe("Filed. Dinner with Sam is on Thursday.");
  });
  it("Penny gives the due date and never an amount", () => {
    expect(filedLine(item({ keeper: "penny", roomName: "Money", title: "Electric bill", date: { when: "2026-11-24", what: "Due", confident: true } as Item["date"] }))).toBe("Filed. Electric bill is due Nov 24.");
  });
  it("Mote files for a someday", () => {
    expect(filedLine(item({ keeper: "mote", roomName: "Ideas", title: "Tiny garden", date: null }))).toBe("Filed. Tiny garden, for a someday.");
  });
  it("falls back to the room without a verified date", () => {
    expect(filedLine(item({ date: null }))).toBe("Filed in Deadlines.");
  });
  it("unsorted gets the app line", () => {
    expect(filedLine(item({ roomName: "Unsorted", keeper: "mote" }))).toBe("Psst couldn't place this one. You decide where it goes.");
  });
});
