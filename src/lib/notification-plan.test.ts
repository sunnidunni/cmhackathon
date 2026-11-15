import { expect, test } from "vitest";
import { planReminderNotification, screenshotIdFromData, shotRoute } from "./notification-plan";

const base = { reminderId: "r1", screenshotId: "s1", text: "Psst: your flyer is due tomorrow. Want to see it?" };

test("a future reminder is scheduled at dueAt with the ids as data", () => {
  expect(planReminderNotification({ ...base, dueAt: 10_000 }, 0)).toEqual({
    identifier: "r1",
    body: base.text,
    data: { screenshotId: "s1", reminderId: "r1" },
    at: 10_000,
  });
});

test("a due or past reminder is shown now", () => {
  expect(planReminderNotification({ ...base, dueAt: 500 }, 1000).at).toBeNull();
  expect(planReminderNotification({ ...base, dueAt: 1500 }, 1000).at).toBeNull();
});

test("tap data resolves to the detail route", () => {
  expect(screenshotIdFromData({ screenshotId: "s1" })).toBe("s1");
  expect(screenshotIdFromData({})).toBeNull();
  expect(screenshotIdFromData(null)).toBeNull();
  expect(shotRoute("s1")).toBe("/shot/s1");
});
