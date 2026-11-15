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

export function screenshotIdFromData(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const id = (data as Record<string, unknown>).screenshotId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export function shotRoute(screenshotId: string) {
  return `/shot/${screenshotId}`;
}
