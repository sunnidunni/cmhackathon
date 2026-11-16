import Constants from "expo-constants";
import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ScrollView, Text, View } from "react-native";
import { CreditsRoll } from "@/components/about/CreditsRoll";
import { KeeperLineup } from "@/components/about/KeeperLineup";
import { fonts, SoftCard, text, usePalette } from "@/design/psst";

export default function About() {
  const pal = usePalette();
  const version = Constants.expoConfig?.version;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "About",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerStyle: { backgroundColor: pal.paper },
          headerTintColor: pal.ink,
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerLargeTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: pal.paper }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 64, gap: 28 }}
      >
        <View style={{ alignItems: "center", gap: 4, paddingTop: 8 }}>
          <Text maxFontSizeMultiplier={1.4} accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 62, letterSpacing: -1.4, color: pal.ink }}>
            shots.
          </Text>
          <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2, textAlign: "center" }]}>
            Your screenshots, kept by four small friends.
          </Text>
          {version ? (
            <Text maxFontSizeMultiplier={2} selectable style={[text.caption, { color: pal.ink3, marginTop: 4 }]}>
              Version {version}
            </Text>
          ) : null}
        </View>

        <KeeperLineup />

        <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <SymbolView
            name="sparkles"
            size={22}
            tintColor={pal.ink2}
            fallback={<Text style={{ fontSize: 18, color: pal.ink2 }}>✦</Text>}
          />
          <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink, flex: 1 }]}>
            Made at the YC Consumer Mobile Hackathon by Ryan Ding, Derek Sun and Bradley Tsou
          </Text>
        </SoftCard>

        <CreditsRoll />

        <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink3, textAlign: "center" }]}>
          Thanks for keeping things with us.
        </Text>
      </ScrollView>
    </>
  );
}
