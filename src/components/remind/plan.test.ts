import { describe, expect, it } from "vitest";
import { defaultReminder, savedLabel, whenLabel } from "./plan";

const PT = 480; // Date.getTimezoneOffset() in PST
const sun9am = Date.UTC(2026, 10, 15, 17, 12); // Sun Nov 15, 9:12 AM PST

describe("defaultReminder", () => {
  it("is 9:00 AM the day before the date", () => {
    const r = defaultReminder([{ when: "2026-11-20", what: "Sign-up closes", confident: true }], sun9am, PT);
    expect(r?.label).toBe("Thu 9:00 AM");
    expect(r?.day).toBe("Thu, Nov 19");
  });
  it("skips dates that are not confident or already past", () => {
    const dates = [
      { when: "2026-11-10", what: "Past", confident: true },
      { when: "2026-11-21", what: "Maybe", confident: false },
    ];
    expect(defaultReminder(dates, sun9am, PT)).toBeNull();
  });
  it("picks the soonest confident future date", () => {
    const r = defaultReminder(
      [
        { when: "2026-12-04", what: "Later", confident: true },
        { when: "2026-11-20", what: "Sooner", confident: true },
      ],
      sun9am,
      PT,
    );
    expect(r?.date.what).toBe("Sooner");
  });
});

describe("existing reminder", () => {
  it("keeps the saved instant instead of recomputing in the current time zone", () => {
    const saved = Date.UTC(2026, 10, 19, 17, 0);
    const r = defaultReminder([{ when: "2026-11-20", what: "Sign-up closes", confident: true }], sun9am, 300, saved);
    expect(r?.dueAt).toBe(saved);
    expect(r?.label).toBe("Thu 12:00 PM");
  });
});

describe("labels", () => {
  it("formats a date without a time zone shift", () => {
    expect(whenLabel("2026-11-20")).toBe("Fri, Nov 20");
  });
  it("says today with the time for a screenshot saved this morning", () => {
    expect(savedLabel(sun9am, sun9am + 3600000, PT)).toBe("today, 9:12 AM");
    expect(savedLabel(Date.UTC(2026, 10, 8, 20, 0), sun9am, PT)).toBe("Nov 8");
  });
});
