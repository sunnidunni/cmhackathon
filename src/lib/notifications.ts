import * as Notifications from "expo-notifications";
import { planNotificationSync, planReminderNotification, type ReminderNotification } from "./notification-plan";

// Local notifications only. app.json sets enableRemoteNotifications: false so the build has no
// aps-environment entitlement and still signs with a free personal team.

// Show reminders as banners even while the app is open (the demo fires one on stage).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function hasNotificationPermission() {
  const p = await Notifications.getPermissionsAsync().catch(() => null);
  return p?.granted === true;
}

// Never call at launch. Call when the user first turns on a reminder, after explaining it.
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return next.granted;
}

// Returns false when there is no permission (it never asks) or the system refused.
export async function scheduleReminderNotification(n: ReminderNotification): Promise<boolean> {
  if (!(await hasNotificationPermission())) return false;
  const plan = planReminderNotification(n, Date.now());
  try {
    await Notifications.cancelScheduledNotificationAsync(plan.identifier).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: plan.identifier,
      content: { body: plan.body, data: plan.data, sound: true },
      trigger:
        plan.at === null
          ? null
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.at },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminderNotification(reminderId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminderId).catch(() => undefined);
}

export async function cancelReminderNotifications(reminderIds: readonly string[]): Promise<void> {
  await Promise.all(reminderIds.map(cancelReminderNotification));
}

// Every notification Shots schedules is a reminder, so this clears them all. For "Delete everything".
export async function cancelAllReminderNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}

export async function showReminderNow(n: Omit<ReminderNotification, "dueAt">): Promise<boolean> {
  return scheduleReminderNotification({ ...n, dueAt: 0 });
}

// Makes this phone's pending notifications match the server's upcoming reminders. Safe to call often.
// It covers the cases where a reminder exists but its notification does not: notifications were off when it was
// set, the app was reinstalled, or it was set on another phone. It also clears notifications for reminders that
// ended somewhere else. Does nothing without notification permission, and never asks for it.
export async function syncReminderNotifications(fetchUpcoming: () => Promise<ReminderNotification[]>): Promise<void> {
  if (!(await hasNotificationPermission())) return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const plan = planNotificationSync(await fetchUpcoming(), pending.map((n) => n.identifier), Date.now());
  await cancelReminderNotifications(plan.cancel);
  for (const n of plan.schedule) await scheduleReminderNotification(n);
}
