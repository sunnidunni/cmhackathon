import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { fonts, KeeperLine, text, Wash, usePalette, type KeeperId } from "@/design/psst";
import { Keeper } from "@/design/keepers-v2";
import { ActionToggleRow } from "./ActionToggleRow";

type ActionKey = "messages" | "orders" | "calendar";

const ACTIONS: { key: ActionKey; symbol: "bubble.left.and.bubble.right" | "bag" | "calendar"; keeper: KeeperId; title: string; detail: string }[] = [
  { key: "messages", symbol: "bubble.left.and.bubble.right", keeper: "murmur", title: "Messages", detail: "Murmur drafts a reply. You tap Send." },
  { key: "orders", symbol: "bag", keeper: "penny", title: "Orders", detail: "Penny fills in an order from your screenshot. You place it." },
  { key: "calendar", symbol: "calendar", keeper: "tock", title: "Calendar", detail: "Tock turns a date into an event. You add it." },
];

const DEFAULT_LINE = "I'll get it ready. You decide.";

function CloseButton() {
  const pal = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={4}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? pal.fill2 : pal.white,
        borderWidth: 1,
        borderColor: pal.hair,
      })}
    >
      <SymbolView name="xmark" size={15} weight="semibold" tintColor={pal.ink} fallback={<Text style={[text.bodyBold, { color: pal.ink }]}>✕</Text>} />
    </Pressable>
  );
}

export function PrepareActionsScreen() {
  const pal = usePalette();
  const [master, setMaster] = useState(true);
  const [enabled, setEnabled] = useState<Record<ActionKey, boolean>>({ messages: true, orders: false, calendar: true });
  const [line, setLine] = useState(DEFAULT_LINE);

  function toggleMaster(on: boolean) {
    Haptics.selectionAsync().catch(() => undefined);
    setMaster(on);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pal.paper }}
      contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 48, gap: 20 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { flex: 1, color: pal.ink }]}>
          Let Shots prepare actions
        </Text>
        <CloseButton />
      </View>

      <Wash keeper="penny" style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Keeper name="penny" size={72} state={master ? "rest" : "sleeping"} onLine={setLine} />
          <View style={{ flex: 1, gap: 4 }}>
            <KeeperLine id="penny">{master ? line : "Resting. Nothing gets prepared."}</KeeperLine>
            <Text style={[text.body, { color: pal.ink }]}>
              Shots can prepare a draft for you to review. It never sends anything on its own.
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: pal.hair }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[text.bodyBold, { color: pal.ink }]}>Prepare actions</Text>
            <Text style={[text.caption, { color: pal.ink2 }]}>
              {master ? "On. Prepared cards show up on Today." : "Off. You can turn it back on anytime."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Prepare actions"
            value={master}
            onValueChange={toggleMaster}
            testID="prepare-actions-master"
            trackColor={{ true: pal.ink, false: pal.fill2 }}
            ios_backgroundColor={pal.fill2}
            thumbColor="#FFFFFF"
          />
        </View>
      </Wash>

      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={2.25} style={[text.caption, { fontFamily: fonts.uiBold, color: pal.ink2, marginLeft: 4 }]}>
          What keepers may prepare
        </Text>
        <View style={{ backgroundColor: pal.white, borderRadius: 16, borderWidth: 1, borderColor: pal.hair, overflow: "hidden" }}>
          {ACTIONS.map((a, i) => (
            <ActionToggleRow
              key={a.key}
              first={i === 0}
              symbol={a.symbol}
              keeper={a.keeper}
              title={a.title}
              detail={a.detail}
              value={master && enabled[a.key]}
              disabled={!master}
              onValueChange={(on) => setEnabled((prev) => ({ ...prev, [a.key]: on }))}
            />
          ))}
        </View>
        <Text style={[text.caption, { color: pal.ink2, marginHorizontal: 4 }]}>
          Nothing is sent, ordered or added without your tap. Every card shows the screenshot it came from.
        </Text>
      </View>
    </ScrollView>
  );
}
