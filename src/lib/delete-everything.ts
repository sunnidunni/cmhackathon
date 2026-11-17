import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { getAutoRead, setAutoRead } from "./auto-read";
import { cancelAllReminderNotifications } from "./notifications";

// deleted: the server deleted everything.
// autoReadOffSaved: the phone saved "automatic reading is off". When false after a delete, the setting may switch back on
// after a restart and bring the same screenshots in again, so the caller must tell the person.
export type DeleteEverythingResult = { deleted: boolean; autoReadOffSaved: boolean };

export const AUTO_READ_NOT_SAVED = "Everything was deleted, but Shots couldn't save that automatic reading is off. It may turn back on after a restart. Turn it off in Settings if it does.";

// "Delete everything", for Settings and the privacy screen. The reminders go on the server, and their notifications on this phone.
// Automatic reading goes off first, so a sync that starts meanwhile can't bring the same screenshots straight back in.
// It stays off after a delete; after a failed one it goes back to what the person had chosen.
export function useDeleteEverything(): () => Promise<DeleteEverythingResult> {
  const removeAll = useMutation(api.shots.removeAll);
  return useCallback(async () => {
    const before = await getAutoRead();
    const autoReadOffSaved = await setAutoRead(false);
    try {
      await removeAll({});
      await cancelAllReminderNotifications();
      return { deleted: true, autoReadOffSaved };
    } catch {
      await setAutoRead(before);
      return { deleted: false, autoReadOffSaved };
    }
  }, [removeAll]);
}
