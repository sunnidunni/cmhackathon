import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useConvexAuth } from "convex/react";
import { useEffect, useMemo, type ComponentProps } from "react";
import { OfflineBoundary } from "@/components/OfflineBoundary";
import { LoadingView } from "@/components/state-views";
import { useStickerFonts } from "@/design";
import { usePalette, usePsstFonts } from "@/design/psst";
import { convex } from "@/lib/convex";
import { AppLifecycle } from "@/lib/lifecycle";
import { setOffline, useOffline } from "@/lib/offline";
import { secureStorage } from "@/lib/secure-storage";

const SIGN_IN_TIMEOUT_MS = 4000;

// No sign-up: the first launch silently creates an anonymous Convex Auth user and the
// session token is kept in the keychain, so every later launch is the same user.
// When sign-in fails or has not settled in time, the app goes offline and shows sample data instead of waiting.
function AnonymousSession({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const offline = useOffline();

  useEffect(() => {
    if (isLoading || isAuthenticated || offline) return;
    signIn("anonymous").catch((e: unknown) => setOffline(e instanceof Error ? e.message : String(e)));
  }, [isLoading, isAuthenticated, offline, signIn]);

  useEffect(() => {
    if (isAuthenticated || offline) return;
    const timer = setTimeout(() => setOffline("Timed out while signing in"), SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, offline]);

  if (isAuthenticated || offline) return <>{children}</>;
  return <LoadingView label="Getting things ready…" />;
}

type SheetOptions = NonNullable<ComponentProps<typeof Stack.Screen>["options"]>;

// The glass back chevron is the native stack header's own back button, left over a transparent bar.
const backHeader: SheetOptions = { headerShown: true, headerTransparent: true, title: "", headerBackButtonDisplayMode: "minimal", headerShadowVisible: false };

export default function RootLayout() {
  useStickerFonts();
  usePsstFonts();
  const pal = usePalette();
  const sheet = useMemo<SheetOptions>(
    () => ({ presentation: "formSheet", headerShown: false, sheetGrabberVisible: true, sheetAllowedDetents: [0.95], sheetCornerRadius: 24, contentStyle: { backgroundColor: pal.paper } }),
    [pal.paper],
  );
  const settingsSheet = useMemo<SheetOptions>(
    () => ({ presentation: "formSheet", headerShown: false, sheetGrabberVisible: true, sheetAllowedDetents: [0.94, 1], sheetInitialDetentIndex: 0, sheetExpandsWhenScrolledToEdge: true, contentStyle: { backgroundColor: pal.paper } }),
    [pal.paper],
  );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexAuthProvider client={convex} storage={secureStorage}>
        <AnonymousSession>
          <AppLifecycle />
          <OfflineBoundary>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: pal.paper } }}>
            <Stack.Screen name="remind/[id]" options={sheet} />
            <Stack.Screen name="act/[id]" options={sheet} />
            <Stack.Screen name="act/flight-status" options={sheet} />
            <Stack.Screen name="settings" options={settingsSheet} />
            <Stack.Screen name="shot/[id]" options={backHeader} />
            <Stack.Screen name="room/[key]" options={backHeader} />
          </Stack>
          </OfflineBoundary>
        </AnonymousSession>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
