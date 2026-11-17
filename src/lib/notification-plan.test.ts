import { describe, expect, test } from "vitest";
import { planReminderNotification, screenshotIdFromData, shotRoute, MAX_PENDING, planNotificationSync } from "./notification-plan";

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

describe("planNotificationSync", () => {
  const NOW = 1_000_000;
  const r = (id: string, inMs: number) => ({ reminderId: id, screenshotId: `shot-${id}`, dueAt: NOW + inMs, text: id });

  test("schedules what is missing, soonest first, and leaves what is already pending alone", () => {
    const plan = planNotificationSync([r("late", 9000), r("soon", 1000), r("have", 5000)], ["have"], NOW);
    expect(plan.schedule.map((n) => n.reminderId)).toEqual(["soon", "late"]);
    expect(plan.cancel).toEqual([]);
  });

  test("cancels a pending notification whose reminder is no longer on the server", () => {
    const plan = planNotificationSync([r("kept", 1000)], ["kept", "turned-off-elsewhere"], NOW);
    expect(plan.schedule).toEqual([]);
    expect(plan.cancel).toEqual(["turned-off-elsewhere"]);
  });

  test("a reminder whose time has passed gets no notification, and a stale one for it is cancelled", () => {
    const plan = planNotificationSync([r("past", -1), r("now", 0)], ["past"], NOW);
    expect(plan.schedule).toEqual([]);
    expect(plan.cancel).toEqual(["past"]);
  });

  test("never keeps more than the phone can hold: the soonest ones win", () => {
    const wanted = Array.from({ length: MAX_PENDING + 10 }, (_, i) => r(`r${i}`, (i + 1) * 1000));
    const farthest = `r${MAX_PENDING + 9}`;
    const plan = planNotificationSync(wanted, [farthest], NOW);
    expect(plan.schedule).toHaveLength(MAX_PENDING);
    expect(plan.schedule[0].reminderId).toBe("r0");
    expect(plan.schedule.map((n) => n.reminderId)).not.toContain(farthest);
    // The far one was pending from before; it gives up its place.
    expect(plan.cancel).toEqual([farthest]);
  });

  test("with nothing on the server every pending notification goes", () => {
    expect(planNotificationSync([], ["a", "b"], NOW)).toEqual({ schedule: [], cancel: ["a", "b"] });
  });
});
