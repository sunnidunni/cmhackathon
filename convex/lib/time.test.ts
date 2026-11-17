import { describe, expect, test } from "vitest";
import { notificationText } from "./notificationText";
import { computeDueAt, dayInZone, dayPhrase, isFutureWhen, isTimeZone, localDay, offsetInZone, parseWhen, todayPhrase, wallToInstant } from "./time";

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
    expect(notificationText({ ...base, title: "power bill", category: "money", when: "2026-11-16", amount: "$142.37" })).toBe(
      "Psst: your power bill is due tomorrow. $142.37.",
    );
  });
  test("today includes the time", () => {
    expect(notificationText({ ...base, title: "dentist", category: "deadlines", when: "2026-11-15T18:30" })).toBe(
      "Psst: your dentist is due today at 6:30 PM. Want to see it?",
    );
  });
});

describe("notification thing", () => {
  const base = { at: now, tz: PST };
  test("the exact bad bill title reads correctly", () => {
    expect(
      notificationText({ ...base, title: "Brightside Power & Light: $142.37 due", category: "money", when: "2026-11-16", amount: "$142.37" }),
    ).toBe("Psst: your Brightside Power & Light is due tomorrow. $142.37.");
  });
  test("money without an extracted amount shows no amount", () => {
    expect(notificationText({ ...base, title: "Brightside Power bill, $142.37", category: "money", when: "2026-11-16" })).toBe(
      "Psst: your Brightside Power bill is due tomorrow.",
    );
  });
  test("non-money never shows an amount", () => {
    expect(
      notificationText({ ...base, title: "Harvest Lantern Night", category: "deadlines", when: "2026-11-16T18:30", amount: "$5.00" }),
    ).toBe("Psst: your Harvest Lantern Night is due tomorrow. Want to see it?");
  });
});


describe("notification verbs by what the date is", () => {
  const n = (title: string, category: string, when: string, what: string, amount?: string) =>
    notificationText({ title, category, when, what, amount, at: Date.UTC(2026, 10, 15, 17, 0), tz: PST });
  test("the flyer's event date is tomorrow at its time", () => {
    expect(n("Harvest Lantern Night", "deadlines", "2026-11-16T18:30", "Harvest Lantern Night")).toBe(
      "Psst: Harvest Lantern Night is tomorrow at 6:30 PM. Want to see it?",
    );
  });
  test("the flyer's RSVP date is a due date on the RSVP", () => {
    expect(n("Harvest Lantern Night", "deadlines", "2026-11-16", "RSVP deadline")).toBe(
      "Psst: your Harvest Lantern Night RSVP is due tomorrow. Want to see it?",
    );
  });
  test("an appointment is an event with its time", () => {
    expect(n("Willow Creek Dental cleaning", "deadlines", "2026-11-16T09:15", "Dental cleaning with Dr. Okafor")).toBe(
      "Psst: Willow Creek Dental cleaning is tomorrow at 9:15 AM. Want to see it?",
    );
  });
  test("a bill is due, with the amount and no question", () => {
    expect(n("Brightside Power bill", "money", "2026-11-16", "Payment due date", "$142.37")).toBe(
      "Psst: your Brightside Power bill is due tomorrow. $142.37.",
    );
  });
  test("a deal ends", () => {
    expect(n("Drift Pro Wireless Headphones", "money", "2026-11-16", "Limited headphone deal ends", "$89.99")).toBe(
      "Psst: the Drift Pro Wireless Headphones deal ends tomorrow. $89.99.",
    );
  });
  test("an event with no time shown has no time, and unknown labels fall back to due", () => {
    expect(n("Pottery class", "deadlines", "2026-11-16", "Event starts")).toBe("Psst: Pottery class is tomorrow. Want to see it?");
    expect(n("Thing", "ideas", "2026-11-16", "something odd")).toBe("Psst: your Thing is due tomorrow. Want to see it?");
  });
});

const LA = "America/Los_Angeles";

describe("time zones by name", () => {
  test("knows a real zone from a made-up one", () => {
    expect(isTimeZone(LA)).toBe(true);
    expect(isTimeZone("Asia/Tokyo")).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
    expect(isTimeZone("")).toBe(false);
  });
  test("the offset follows the clock change", () => {
    expect(offsetInZone(Date.UTC(2027, 0, 15, 12, 0), LA)).toBe(480);
    expect(offsetInZone(Date.UTC(2027, 6, 15, 12, 0), LA)).toBe(420);
    expect(offsetInZone(Date.UTC(2027, 0, 15, 12, 0), "Asia/Kolkata")).toBe(-330);
  });
  test("the day is the day in that zone", () => {
    const instant = Date.UTC(2026, 10, 16, 3, 0);
    expect(dayInZone(instant, LA)).toBe("2026-11-15");
    expect(dayInZone(instant, "Asia/Tokyo")).toBe("2026-11-16");
    expect(todayPhrase(instant, LA)).toBe("Sunday, 2026-11-15");
    expect(todayPhrase(instant, "Asia/Tokyo")).toBe("Monday, 2026-11-16");
  });
  test("a wall-clock time becomes the right instant on both sides of a clock change", () => {
    // In 2027 Los Angeles moves its clocks forward on March 14 and back on November 7.
    expect(wallToInstant(2027, 3, 13, 9, 0, LA)).toBe(Date.UTC(2027, 2, 13, 17, 0));
    expect(wallToInstant(2027, 3, 14, 9, 0, LA)).toBe(Date.UTC(2027, 2, 14, 16, 0));
    expect(wallToInstant(2027, 11, 7, 9, 0, LA)).toBe(Date.UTC(2027, 10, 7, 17, 0));
  });
  test("a reminder set before a clock change still lands at 9:00 local the day before", () => {
    // Set on March 1 (offset 480) for an event on March 20, after the clocks moved (offset 420).
    const march1 = Date.UTC(2027, 2, 1, 20, 0);
    expect(computeDueAt("2027-03-20T19:00", march1, PST, LA)).toBe(Date.UTC(2027, 2, 19, 16, 0));
    // Without the zone name, today's offset is all there is, and the reminder is an hour late.
    expect(computeDueAt("2027-03-20T19:00", march1, PST)).toBe(Date.UTC(2027, 2, 19, 17, 0));
  });
  test("with a zone, today with a time is still one hour before", () => {
    expect(computeDueAt("2026-11-15T18:30", now, PST, LA)).toBe(at("2026-11-16T01:30"));
  });
});

describe("parseWhen", () => {
  test("rejects dates and times that do not exist", () => {
    expect(parseWhen("2026-13-01", PST)).toBeNull();
    expect(parseWhen("2026-02-31", PST)).toBeNull();
    expect(parseWhen("2026-11-20T24:00", PST)).toBeNull();
    expect(parseWhen("2026-11-20T10:61", PST)).toBeNull();
    expect(parseWhen("2028-02-29", PST)).not.toBeNull();
    expect(parseWhen("2026-11-20T23:59", PST)).toMatchObject({ y: 2026, mo: 11, d: 20, hh: 23, mm: 59, hasTime: true });
  });
});
