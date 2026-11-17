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

  test("when the person turns a reminder off mid-sync, the sync starts over from a fresh picture: the rest are scheduled, the cancelled one is not", async () => {
    // The server's answer changes once the person has turned "third" off.
    let turnedOff = false;
    const fetchUpcoming = vi.fn(async () => (turnedOff ? [soon("first", 60_000), soon("second", 120_000)] : [soon("first", 60_000), soon("second", 120_000), soon("third", 180_000)]));
    const pendingNow: string[] = [];
    native.getAllScheduledNotificationsAsync.mockImplementation(async () => pendingNow.map((identifier) => ({ identifier })));
    native.scheduleNotificationAsync.mockImplementation(async (request: { identifier: string }) => {
      pendingNow.push(request.identifier);
      // Right after the first notification is scheduled, the person turns off the third reminder.
      if (request.identifier === "first" && !turnedOff) {
        turnedOff = true;
        await cancelReminderNotification("third");
      }
      return "id";
    });
    await syncReminderNotifications(fetchUpcoming);
    expect(fetchUpcoming).toHaveBeenCalledTimes(2);
    expect(pendingNow).toEqual(["first", "second"]);
  });

  test("delete everything during a sync: it starts over, finds nothing to schedule, and schedules nothing", async () => {
    native.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
    let deleted = false;
    await syncReminderNotifications(async () => {
      if (deleted) return [];
      deleted = true;
      await cancelAllReminderNotifications();
      return [soon("first", 60_000)];
    });
    expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test("cancellations that never stop cannot keep a sync going forever", async () => {
    native.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
    const fetchUpcoming = vi.fn(async () => {
      await cancelAllReminderNotifications();
      return [soon("first", 60_000)];
    });
    await syncReminderNotifications(fetchUpcoming);
    expect(fetchUpcoming).toHaveBeenCalledTimes(5);
    expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test("the sync's own cancelling of stale notifications does not stop it", async () => {
    native.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: "stale" }]);
    await syncReminderNotifications(async () => [soon("missing", 60_000)]);
    expect(native.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});
