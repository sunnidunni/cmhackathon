import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Stack, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useConvexAuth } from "convex/react";
import { useEffect, useMemo, type ComponentProps } from "react";
import { OfflineBoundary } from "@/components/OfflineBoundary";
import { DevHotspot } from "@/components/dev/DevHotspot";
import { LoadingView } from "@/components/state-views";
import { useStickerFonts } from "@/design";
import { fonts, usePalette, usePsstFonts } from "@/design/psst";
import { convex } from "@/lib/convex";
import { setConnectionError } from "@/lib/connection-error";
import { AppLifecycle } from "@/lib/lifecycle";
import { setOffline, useOffline } from "@/lib/offline";
import { preloadSfx } from "@/lib/sfx";
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
    signIn("anonymous").catch((e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      setConnectionError(message);
      setOffline(message);
    });
  }, [isLoading, isAuthenticated, offline, signIn]);

  useEffect(() => {
    if (isAuthenticated || offline) return;
    const timer = setTimeout(() => {
      setConnectionError("Timed out while signing in");
      setOffline("Timed out while signing in");
    }, SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, offline]);

  if (isAuthenticated || offline) return <>{children}</>;
  return <LoadingView label="Getting things ready…" />;
}

type SheetOptions = NonNullable<ComponentProps<typeof Stack.Screen>["options"]>;

function BackButton() {
  const pal = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      onPress={() => router.back()}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingLeft: 10,
        paddingRight: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: pal.hair,
        backgroundColor: pressed ? pal.paper : pal.white,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <SymbolView
        name="chevron.left"
        size={17}
        weight="semibold"
        tintColor={pal.ink}
        fallback={
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={pal.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        }
      />
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 20, color: pal.ink }}>
        Back
      </Text>
    </Pressable>
  );
}

// A solid "Back" pill in the native stack header, over a transparent bar; the header keeps it inside the safe area.
const backHeader: SheetOptions = { headerShown: true, headerTransparent: true, title: "", headerShadowVisible: false, headerLeft: () => <BackButton /> };

export default function RootLayout() {
  useStickerFonts();
  usePsstFonts();
  useEffect(() => {
    preloadSfx();
  }, []);
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
        <DevHotspot>
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
        </DevHotspot>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
