import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useConvexAuth } from "convex/react";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { LoadingView, MessageView } from "@/components/state-views";
import { useStickerFonts } from "@/design";
import { usePalette, usePsstFonts } from "@/design/psst";
import { convex } from "@/lib/convex";
import { DEV_TOOLS } from "@/lib/dev-flags";
import { AppLifecycle } from "@/lib/lifecycle";
import { secureStorage, storageError } from "@/lib/secure-storage";

const SIGN_IN_TIMEOUT_MS = 20000;

// No sign-up: the first launch silently creates an anonymous Convex Auth user and the
// session token is kept in the keychain, so every later launch is the same user.
function AnonymousSession({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    signIn("anonymous").catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [isLoading, isAuthenticated, signIn, attempt]);

  useEffect(() => {
    if (isAuthenticated || error) return;
    const timer = setTimeout(() => setError("Timed out while signing in"), SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, error, attempt]);

  if (isAuthenticated) return <>{children}</>;
  if (error)
    return (
      <MessageView
        title="Couldn't connect"
        body={
          DEV_TOOLS
            ? `${error} (loading: ${isLoading}, keychain: ${storageError ?? "ok"})`
            : "Check your connection and try again."
        }
        actionLabel="Try again"
        onAction={() => {
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  return <LoadingView label="Getting things ready…" />;
}

type SheetOptions = NonNullable<ComponentProps<typeof Stack.Screen>["options"]>;

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
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: pal.paper } }}>
            <Stack.Screen name="remind/[id]" options={sheet} />
            <Stack.Screen name="act/[id]" options={sheet} />
            <Stack.Screen name="settings" options={settingsSheet} />
          </Stack>
        </AnonymousSession>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
