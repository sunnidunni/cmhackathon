import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { Keeper } from "@/design/keepers-v2";
import { fonts, KEEPER_IDS, KEEPERS, text, useKeeperColors, usePalette, Wash, type KeeperId } from "@/design/psst";
import { KEEPER_PROFILES, ROOM_NAME } from "@/components/keeper-profile/data";
import { KeeperChips, ListCard, SpeechBubble } from "@/components/keeper-profile/parts";

const body = { padding: 16, paddingTop: Platform.OS === "ios" ? 16 : 72, paddingBottom: 48, gap: 16 } as const;

const isKeeperId = (v: unknown): v is KeeperId => typeof v === "string" && (KEEPER_IDS as string[]).includes(v);

export default function KeeperProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pal = usePalette();
  const known = isKeeperId(id);
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: known ? KEEPERS[id].name : "Keepers",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: pal.ink,
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
        }}
      />
      {known ? <Profile key={id} id={id} /> : <Missing />}
    </>
  );
}

function Profile({ id }: { id: KeeperId }) {
  const pal = usePalette();
  const { deep } = useKeeperColors(id);
  const keeper = KEEPERS[id];
  const profile = KEEPER_PROFILES[id];
  const [line, setLine] = useState<{ text: string; n: number } | null>(null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pal.paper }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
      <Wash keeper={id} style={{ alignItems: "center", paddingTop: 24, paddingBottom: 20, gap: 12, borderRadius: 24 }}>
        <Keeper
          name={id}
          size={180}
          onLine={(t) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            setLine((prev) => ({ text: t, n: (prev?.n ?? 0) + 1 }));
          }}
        />
        <View style={{ minHeight: 64, justifyContent: "center" }}>
          {line ? (
            <SpeechBubble key={line.n} id={id} line={line.text} />
          ) : (
            <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
              Tap {keeper.name} to say hi.
            </Text>
          )}
        </View>
      </Wash>

      <View style={{ gap: 6 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { color: pal.ink, fontSize: 36, lineHeight: 40 }]}>
          {keeper.name}
        </Text>
        <Text maxFontSizeMultiplier={2} style={[text.voice, { color: deep, fontSize: 18, lineHeight: 24 }]}>
          “{keeper.motto}”
        </Text>
        <Text maxFontSizeMultiplier={2.2} style={[text.lead, { color: pal.ink2 }]}>
          Keeper of {ROOM_NAME[id]}. {profile.intro}
        </Text>
      </View>

      <Wash keeper={id} style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: deep }}>
          {profile.sampleCount}
        </Text>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={2} style={[text.bodyBold, { color: pal.ink }]}>
            screenshots in {ROOM_NAME[id]}
          </Text>
          <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink3 }]}>
            Sample count
          </Text>
        </View>
      </Wash>

      <ListCard title="What I keep" items={profile.keeps} symbol="checkmark.circle.fill" color={keeper.main} />
      <ListCard title="What I never do" items={profile.never} symbol="hand.raised.fill" color={pal.ink3} />

      <View style={{ gap: 10, paddingTop: 4 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.8} style={[text.bodyBold, { color: pal.ink }]}>
          Meet the others
        </Text>
        <KeeperChips current={id} />
      </View>
    </ScrollView>
  );
}

function Missing() {
  const pal = usePalette();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: pal.paper }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
      <Wash keeper="mote" style={{ alignItems: "center", paddingVertical: 24, gap: 12, borderRadius: 24 }}>
        <Keeper name="mote" state="sleeping" size={140} />
      </Wash>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { color: pal.ink }]}>
        No keeper by that name
      </Text>
      <Text maxFontSizeMultiplier={2.2} style={[text.lead, { color: pal.ink2 }]}>
        There are four of us. Pick one to say hello.
      </Text>
      <KeeperChips />
    </ScrollView>
  );
}
