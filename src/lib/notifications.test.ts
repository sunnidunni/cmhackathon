import { beforeEach, describe, expect, test, vi } from "vitest";
import { cancelAllReminderNotifications, cancelReminderNotification, syncReminderNotifications } from "./notifications";

const native = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
vi.mock("expo-notifications", () => native);

const soon = (id: string, inMs: number) => ({ reminderId: id, screenshotId: `shot-${id}`, dueAt: Date.now() + inMs, text: `text ${id}` });
const order: string[] = [];

beforeEach(() => {
  order.length = 0;
  native.getPermissionsAsync.mockReset().mockResolvedValue({ granted: true });
  native.getAllScheduledNotificationsAsync.mockReset().mockImplementation(async () => {
    order.push("read pending");
    return [];
  });
  native.cancelScheduledNotificationAsync.mockReset().mockResolvedValue(undefined);
  native.scheduleNotificationAsync.mockReset().mockResolvedValue("id");
});

describe("syncReminderNotifications", () => {
  test("without notification permission it does nothing, and does not ask the server", async () => {
    native.getPermissionsAsync.mockResolvedValue({ granted: false });
    const fetchUpcoming = vi.fn();
    await syncReminderNotifications(fetchUpcoming);
    expect(fetchUpcoming).not.toHaveBeenCalled();
    expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test("reads the phone's pending notifications before asking the server", async () => {
    await syncReminderNotifications(async () => {
      order.push("ask server");
      return [];
    });
    expect(order).toEqual(["read pending", "ask server"]);
  });

  test("schedules a missing reminder under its own id, with the screenshot to open, and cancels a stale one", async () => {
    native.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: "kept" }, { identifier: "stale" }]);
    await syncReminderNotifications(async () => [soon("kept", 60_000), soon("missing", 120_000)]);
    const scheduled = native.scheduleNotificationAsync.mock.calls.map(([request]) => request);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]).toMatchObject({ identifier: "missing", content: { body: "text missing", data: { screenshotId: "shot-missing", reminderId: "missing" } } });
    expect(scheduled[0].trigger.date).toBeGreaterThan(Date.now());
    // "stale" is cancelled by the sync; "missing" is cancelled once just before it is scheduled, which is how a notification is replaced.
    expect(native.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id)).toEqual(["stale", "missing"]);
  });

  test("a reminder the person turns off while a sync is scheduling is not put back by that sync", async () => {
    native.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
    // The first schedule call is where the person turns off the third reminder.
    native.scheduleNotificationAsync.mockImplementationOnce(async () => {
      await cancelReminderNotification("third");
      return "id";
    });
    await syncReminderNotifications(async () => [soon("first", 60_000), soon("second", 120_000), soon("third", 180_000)]);
    const scheduled = native.scheduleNotificationAsync.mock.calls.map(([request]) => request.identifier);
    // The sync stops at once: its picture of the server is out of date. The next sync schedules "second".
    expect(scheduled).toEqual(["first"]);
  });

  test("delete everything during a sync stops it before it schedules anything", async () => {
    native.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
    await syncReminderNotifications(async () => {
      await cancelAllReminderNotifications();
      return [soon("first", 60_000)];
    });
    expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test("the sync's own cancelling of stale notifications does not stop it", async () => {
    native.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: "stale" }]);
    await syncReminderNotifications(async () => [soon("missing", 60_000)]);
    expect(native.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});
