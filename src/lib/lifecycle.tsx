import { useConvexAuth, useMutation } from "convex/react";
import * as Notifications from "expo-notifications";
import { addListener as addLibraryListener } from "expo-media-library";
import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex";
import { screenshotIdFromData, shotRoute } from "./notification-plan";
import { syncReminderNotifications } from "./notifications";
import { getAutoRead } from "./auto-read";
import { getPhotoAccess, hasPhotoAccess } from "./photos";
import { getImportStarted, runSync } from "./sync";

const LIBRARY_CHANGE_DEBOUNCE_MS = 1500;

export const upcomingReminders = () => convex.query(api.reminders.upcoming, { after: Date.now() });

// Mount once in the root layout, inside the Convex provider. Renders nothing.
// After sign-in: on launch and every return to the foreground it calls today.appOpened, brings the phone's
// reminder notifications in line with the server and, once the import has been started and "Read new
// screenshots automatically" is on, syncs the album. While the app is open it syncs on library changes.
// A tap on a reminder notification routes to /shot/<screenshotId>.
export function AppLifecycle() {
  const { isAuthenticated } = useConvexAuth();
  const appOpened = useMutation(api.today.appOpened);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    const syncIfStarted = async () => {
      if ((await getImportStarted()) && (await getAutoRead())) await runSync({ quick: true }).catch(() => undefined);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let library: { remove(): void } | undefined;
    let disposed = false;
    // Registering a photo-library observer makes iOS show the photo prompt when access is still
    // undetermined, so only listen once access has been granted on the priming screen.
    const listenToLibrary = async () => {
      if (library || !hasPhotoAccess(await getPhotoAccess().catch(() => null)) || disposed) return;
      try {
        library = addLibraryListener(() => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (AppState.currentState === "active") void syncIfStarted();
          }, LIBRARY_CHANGE_DEBOUNCE_MS);
        });
      } catch {
        library = undefined;
      }
    };
    const onActive = () => {
      appOpened({ tzOffsetMinutes: new Date().getTimezoneOffset(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => undefined);
      syncReminderNotifications(upcomingReminders).catch(() => undefined);
      void syncIfStarted();
      void listenToLibrary();
    };
    onActive();
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") onActive();
    });
    return () => {
      disposed = true;
      appState.remove();
      library?.remove();
      clearTimeout(timer);
    };
  }, [isAuthenticated, appOpened]);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = screenshotIdFromData(response?.notification.request.content.data);
      if (!id) return;
      Notifications.clearLastNotificationResponse();
      router.push(shotRoute(id) as Href);
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [isAuthenticated, router]);

  return null;
}
