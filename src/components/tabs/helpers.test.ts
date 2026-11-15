import { describe, expect, test } from "vitest";
import { allScreenshotsCount, buttonLabel, cardSubtitle, formatWhen, lineFor, nudgeSample, reminderCaption, roomName, weekday } from "./helpers";

describe("all screenshots count", () => {
  test("sums every room including unsorted", () => {
    expect(allScreenshotsCount([{ count: 3 }, { count: 0 }, { count: 2 }, { count: 1 }, { count: 4 }])).toBe(10);
    expect(allScreenshotsCount([])).toBe(0);
  });
});

describe("tab helpers", () => {
  test("formats dates plainly", () => {
    expect(weekday("2026-11-20")).toBe("Fri");
    expect(formatWhen("2026-11-20")).toBe("Fri, Nov 20");
    expect(formatWhen("2026-11-16T18:30")).toBe("Mon, Nov 16, 6:30 pm");
    expect(formatWhen("2026-11-16T00:05")).toBe("Mon, Nov 16, 12:05 am");
    expect(formatWhen("11-21", false)).toBe("11-21");
  });

  test("button labels follow the card actions", () => {
    const date = { when: "2026-11-19", what: "appointment", confident: true };
    expect(buttonLabel("remind", date)).toBe("Remind Thu");
    expect(buttonLabel("detail", date)).toBe("Reminder set, Thu");
    expect(buttonLabel("keep", null)).toBe("Keep");
    expect(buttonLabel("see", null)).toBe("See it");
    expect(buttonLabel("delete", null)).toBe("Delete");
  });

  test("subtitle uses the date, else the saved day", () => {
    expect(cardSubtitle({ date: { when: "2026-11-20", what: "sign-up closes", confident: true }, takenAt: 0 })).toBe(
      "Fri, Nov 20, sign-up closes",
    );
    expect(cardSubtitle({ date: null, takenAt: new Date(2026, 9, 4).getTime() })).toBe("Saved Oct 4");
  });

  test("looks lines up by key, null when unknown", () => {
    expect(lineFor("deadlines_01")).toBe("Got one! I've circled it twice already.");
    expect(lineFor("unsorted_01")).toContain("Not sure");
    expect(lineFor("nope")).toBeNull();
    expect(lineFor(null)).toBeNull();
  });

  test("reminder caption follows the reminder state", () => {
    expect(reminderCaption(null)).toBe("Remind me");
    expect(reminderCaption({ state: "scheduled" })).toBe("Reminder set");
    expect(reminderCaption({ state: "sent" })).toBe("Reminder sent");
    expect(reminderCaption({ state: "dismissed" })).toBe("Remind me");
  });

  test("nudge sample uses the item's own title", () => {
    expect(nudgeSample("Brightside Power bill")).toBe("Psst: your Brightside Power bill is due tomorrow. Want to see it?");
    expect(nudgeSample(undefined)).toBe("Psst: your reminder is due tomorrow. Want to see it?");
  });

  test("room names", () => {
    expect(roomName("money")).toBe("Money");
    expect(roomName("weird")).toBe("Unsorted");
  });
});
