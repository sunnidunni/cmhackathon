import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { DemoDeleteSheet } from "@/components/privacy/DemoDeleteSheet";
import { FlowStep } from "@/components/privacy/FlowStep";
import { Toast } from "@/components/privacy/Toast";
import { KEEPER_IDS, KEEPERS, PsstButton, SoftCard, fonts, text, usePalette } from "@/design/psst";
import { KeeperAvatar } from "@/design/keepers-v2";

const STEPS = [
  { symbol: "photo.on.rectangle", title: "Your Screenshots album", caption: "We only read your Screenshots album." },
  { symbol: "server.rack", title: "Our server", caption: "Screenshots are sent to our server and an AI model to be read." },
  { symbol: "text.viewfinder", title: "An AI model reads it", caption: "It looks at what's on the screen, like a date, a name or an amount." },
  { symbol: "tray.full", title: "Filed into rooms by a keeper", caption: "One of four keepers puts it in their room, so you can find it later." },
] as const;

export default function Privacy() {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  function openSheet() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetOpen(true);
  }

  function cancel() {
    void Haptics.selectionAsync();
    setSheetOpen(false);
  }

  function confirm() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSheetOpen(false);
    setToast("Demo build: nothing was deleted.");
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "What happens to your screenshots",
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: pal.ink,
          headerStyle: { backgroundColor: pal.paper },
          headerLargeStyle: { backgroundColor: pal.paper },
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerLargeTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: pal.paper }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingBottom: 64, gap: 28 }}
      >
        <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
          {"Here's the path a screenshot takes, from your phone to its room."}
        </Text>

        <View>
          {STEPS.map((s, i) => (
            <FlowStep key={s.title} index={i} symbol={s.symbol} title={s.title} caption={s.caption} last={i === STEPS.length - 1}>
              {i === STEPS.length - 1 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                  {KEEPER_IDS.map((id) => (
                    <View key={id} style={{ alignItems: "center", gap: 4, width: 64 }}>
                      <KeeperAvatar name={id} size={40} />
                      <Text maxFontSizeMultiplier={1.6} numberOfLines={1} style={[text.caption, { color: pal.ink2 }]}>
                        {KEEPERS[id].name.split(" ")[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </FlowStep>
          ))}
        </View>

        <Animated.View entering={reduce ? undefined : FadeIn.delay(150 + STEPS.length * 140).duration(420)} style={{ gap: 20 }}>
          <SoftCard style={{ gap: 6 }}>
            <Text maxFontSizeMultiplier={2} style={[text.bodyBold, { color: pal.ink }]}>
              {"We don't sell your data."}
            </Text>
            <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink2 }]}>
              Delete everything anytime in Settings.
            </Text>
          </SoftCard>
          <PsstButton kind="outline" danger label="Delete everything" onPress={openSheet} />
        </Animated.View>
      </ScrollView>

      <DemoDeleteSheet visible={sheetOpen} onCancel={cancel} onConfirm={confirm} />
      {toast && <Toast message={toast} onHide={hideToast} />}
    </>
  );
}
