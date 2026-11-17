// Pure parts of local reminder notifications. No React Native imports, so it runs under vitest.

export type ReminderNotification = {
  reminderId: string;
  screenshotId: string;
  dueAt: number;
  text: string;
};

export type NotificationPlan = {
  identifier: string;
  body: string;
  data: { screenshotId: string; reminderId: string };
  // null means show it now.
  at: number | null;
};

export function planReminderNotification(n: ReminderNotification, now: number): NotificationPlan {
  return {
    identifier: n.reminderId,
    body: n.text,
    data: { screenshotId: n.screenshotId, reminderId: n.reminderId },
    at: n.dueAt > now + 1000 ? n.dueAt : null,
  };
}

// iOS keeps at most 64 pending local notifications per app and silently drops the rest. Stay a little under it.
export const MAX_PENDING = 60;

// Brings the phone's pending notifications in line with the reminders the server says are still to come.
// wanted: the server's scheduled reminders. scheduledIds: identifiers of the notifications pending on this phone,
// read BEFORE asking the server, so a reminder set in between is never mistaken for a stale one.
// schedule: reminders with no notification yet, soonest first, within the limit.
// cancel: notifications whose reminder is gone (done, removed or turned off elsewhere) or falls outside the limit.
export function planNotificationSync(wanted: readonly ReminderNotification[], scheduledIds: readonly string[], now: number) {
  const soonest = wanted
    .filter((r) => r.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, MAX_PENDING);
  const keep = new Set(soonest.map((r) => r.reminderId));
  const have = new Set(scheduledIds);
  return {
    schedule: soonest.filter((r) => !have.has(r.reminderId)),
    cancel: scheduledIds.filter((id) => !keep.has(id)),
  };
}

export function screenshotIdFromData(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const id = (data as Record<string, unknown>).screenshotId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export function shotRoute(screenshotId: string) {
  return `/shot/${screenshotId}`;
}
