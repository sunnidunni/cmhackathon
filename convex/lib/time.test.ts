import { describe, expect, test } from "vitest";
import { notificationText } from "./notificationText";
import { computeDueAt, dayPhrase, isFutureWhen, localDay } from "./time";

const PST = 480;
// Sun Nov 15 2026, 10:00 PST
const now = Date.UTC(2026, 10, 15, 18, 0);
const at = (iso: string) => Date.UTC(...(iso.split(/[-T:]/).map(Number) as [number, number, number, number, number]).map((n, i) => (i === 1 ? n - 1 : n)) as [number, number, number, number, number]);

describe("time", () => {
  test("local day follows the phone offset", () => {
    expect(localDay(Date.UTC(2026, 10, 16, 3, 0), PST)).toBe("2026-11-15");
    expect(localDay(Date.UTC(2026, 10, 16, 3, 0), -540)).toBe("2026-11-16");
  });
  test("day before at 9am local", () => {
    expect(computeDueAt("2026-11-20T19:00", now, PST)).toBe(at("2026-11-19T17:00"));
  });
  test("today with a time is one hour before", () => {
    expect(computeDueAt("2026-11-15T18:30", now, PST)).toBe(at("2026-11-16T01:30"));
  });
  test("never in the past", () => {
    expect(computeDueAt("2026-11-16T18:30", now, PST)).toBeGreaterThanOrEqual(now + 60000);
    expect(computeDueAt("2026-11-15", now, PST)).toBe(now + 60000);
    expect(computeDueAt("2026-11-15T10:30", now, PST)).toBe(now + 60000);
  });
  test("future check treats date-only as the whole local day", () => {
    expect(isFutureWhen("2026-11-15", now, PST)).toBe(true);
    expect(isFutureWhen("2026-11-14", now, PST)).toBe(false);
    expect(isFutureWhen("11-21", now, PST)).toBe(false);
  });
  test("day phrases", () => {
    expect(dayPhrase("2026-11-16T09:00", now, PST)).toBe("tomorrow");
    expect(dayPhrase("2026-11-15", now, PST)).toBe("today");
    expect(dayPhrase("2026-11-20", now, PST)).toBe("on Fri, Nov 20");
  });
});

describe("notification text", () => {
  const base = { at: now, tz: PST };
  test("one mascot voice, no character names", () => {
    const t = notificationText({ ...base, title: "Harvest Lantern Night", category: "deadlines", when: "2026-11-16T18:30" });
    expect(t).toBe("Psst: your Harvest Lantern Night is due tomorrow. Want to see it?");
    expect(t).not.toMatch(/Tock|Murmur|Penny|Wisp/);
  });
  test("money is plain, with no question", () => {
    expect(notificationText({ ...base, title: "power bill, $142.37", category: "money", when: "2026-11-16" })).toBe(
      "Psst: your power bill, $142.37 is due tomorrow.",
    );
  });
  test("today includes the time", () => {
    expect(notificationText({ ...base, title: "dentist", category: "deadlines", when: "2026-11-15T18:30" })).toBe(
      "Psst: your dentist is due today at 6:30 pm. Want to see it?",
    );
  });
});
