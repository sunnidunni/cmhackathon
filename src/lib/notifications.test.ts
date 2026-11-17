import { beforeEach, describe, expect, test, vi } from "vitest";
import { syncReminderNotifications } from "./notifications";

const native = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
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
});
