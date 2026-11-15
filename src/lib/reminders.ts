import { useMutation } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  cancelReminderNotification,
  scheduleReminderNotification,
  showReminderNow,
} from "./notifications";

const tzOffsetMinutes = () => new Date().getTimezoneOffset();

// Each action calls the server first, then the matching local notification. None of them asks for
// notification permission; call ensureNotificationPermission() first from the screen's own sheet.
// notified is false when there is no permission: the reminder still lands in "You might have missed".
export function useReminderActions() {
  const set = useMutation(api.reminders.set);
  const cancelReminder = useMutation(api.reminders.cancel);
  const fire = useMutation(api.reminders.fireNow);
  return useMemo(
    () => ({
      async remind(screenshotId: Id<"screenshots">, when?: string) {
        const r = await set({ screenshotId, tzOffsetMinutes: tzOffsetMinutes(), when });
        const notified = await scheduleReminderNotification({
          reminderId: r.reminderId,
          screenshotId,
          dueAt: r.dueAt,
          text: r.text,
        });
        return { ...r, notified };
      },
      async cancel(reminderId: Id<"reminders">) {
        await cancelReminder({ reminderId });
        await cancelReminderNotification(reminderId);
      },
      async fireNow(screenshotId: Id<"screenshots">) {
        const r = await fire({ screenshotId, tzOffsetMinutes: tzOffsetMinutes() });
        const notified = await showReminderNow({ reminderId: r.reminderId, screenshotId, text: r.text });
        return { ...r, notified };
      },
    }),
    [set, cancelReminder, fire],
  );
}
