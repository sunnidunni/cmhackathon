import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaughtUp } from "@/components/notifications/CaughtUp";
import { NOTIFICATIONS, type PsstNotification } from "@/components/notifications/fixtures";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { UndoToast } from "@/components/notifications/UndoToast";
import { fonts, text, usePalette } from "@/design/psst";

const UNDO_MS = 4000;

type Undo = { key: number; label: string; previous: PsstNotification[] };

export default function Notifications() {
  const pal = usePalette();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(NOTIFICATIONS);
  const [undo, setUndo] = useState<Undo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const act = useCallback(
    (label: string, next: (list: PsstNotification[]) => PsstNotification[]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      AccessibilityInfo.announceForAccessibility(label);
      setUndo({ key: Date.now(), label, previous: items });
      setItems(next(items));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setUndo(null), UNDO_MS);
    },
    [items],
  );

  const snooze = (id: string) => act("Snoozed until this evening.", (list) => list.filter((n) => n.id !== id));
  const archive = (id: string) => act("Archived.", (list) => list.filter((n) => n.id !== id));
  const archiveAll = () => act("Archived all.", () => []);

  const restore = () => {
    if (!undo) return;
    Haptics.selectionAsync();
    if (timer.current) clearTimeout(timer.current);
    setItems(undo.previous);
    setUndo(null);
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const layout = reduce ? undefined : LinearTransition.springify().damping(20);

  return (
    <View style={{ flex: 1, backgroundColor: pal.paper }}>
      <Stack.Screen
        options={{
          presentation: "formSheet",
          headerShown: false,
          sheetAllowedDetents: [0.6, 1],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          sheetExpandsWhenScrolledToEdge: true,
          contentStyle: { backgroundColor: pal.paper },
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 16, paddingBottom: insets.bottom + 96, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, marginBottom: 2 }}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={[text.largeTitle, { flex: 1, color: pal.ink }]}>
            Notifications
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={4}
            onPress={close}
            style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? pal.fill2 : pal.white, borderWidth: 1, borderColor: pal.hair })}
          >
            <SymbolView name="xmark" size={15} weight="bold" tintColor={pal.ink} fallback={<Text style={{ fontFamily: fonts.uiBold, fontSize: 16, color: pal.ink }}>✕</Text>} />
          </Pressable>
        </View>

        {items.length > 0 ? (
          <Animated.View layout={layout} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, marginBottom: 4 }}>
            <Text maxFontSizeMultiplier={1.8} style={[text.caption, { flex: 1, color: pal.ink2 }]}>
              Swipe left on a note to snooze or archive it.
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Archive all" onPress={archiveAll} hitSlop={8} style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
              <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 14, color: pal.ink2 }}>
                Archive all
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {items.map((item) => (
          <Animated.View key={item.id} layout={layout} entering={reduce ? undefined : FadeIn.duration(220)} exiting={reduce ? undefined : FadeOut.duration(180)}>
            <NotificationRow item={item} onSnooze={snooze} onArchive={archive} />
          </Animated.View>
        ))}

        {items.length === 0 ? <CaughtUp /> : null}
      </ScrollView>

      {undo ? <UndoToast key={undo.key} label={undo.label} bottom={insets.bottom + 16} onUndo={restore} /> : null}
    </View>
  );
}
