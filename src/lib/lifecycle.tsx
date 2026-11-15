import { useConvexAuth, useMutation } from "convex/react";
import * as Notifications from "expo-notifications";
import { addListener as addLibraryListener } from "expo-media-library";
import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { api } from "../../convex/_generated/api";
import { screenshotIdFromData, shotRoute } from "./notification-plan";
import { getImportStarted, runSync } from "./sync";

const LIBRARY_CHANGE_DEBOUNCE_MS = 1500;

// Mount once in the root layout, inside the Convex provider. Renders nothing.
// After sign-in: on launch and every return to the foreground it calls today.appOpened and, once the
// import has been started, syncs the album. While the app is open it syncs on library changes.
// A tap on a reminder notification routes to /shot/<screenshotId>.
export function AppLifecycle() {
  const { isAuthenticated } = useConvexAuth();
  const appOpened = useMutation(api.today.appOpened);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    const syncIfStarted = async () => {
      if (await getImportStarted()) await runSync().catch(() => undefined);
    };
    const onActive = () => {
      appOpened({ tzOffsetMinutes: new Date().getTimezoneOffset() }).catch(() => undefined);
      void syncIfStarted();
    };
    onActive();
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") onActive();
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let library: { remove(): void } | undefined;
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
    return () => {
      appState.remove();
      library?.remove();
      clearTimeout(timer);
    };
  }, [isAuthenticated, appOpened]);

  useEffect(() => {
    if (!isAuthenticated) return;
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
