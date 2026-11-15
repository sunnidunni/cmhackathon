import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Footnote, Headline, Lead, Page, Tick } from "@/components/onboarding/page";
import { Keeper, KeeperLine, PsstButton, text, usePalette } from "@/components/onboarding/kit";
import { hasPhotoAccess, usePhotoAccess } from "@/lib/photos";

export default function Priming() {
  const p = usePalette();
  const { access, request, openSettings } = usePhotoAccess();
  const [declined, setDeclined] = useState(false);
  const [busy, setBusy] = useState(false);
  const denied = declined || access === "denied";

  useEffect(() => {
    if (hasPhotoAccess(access)) router.replace("/bring");
  }, [access]);

  async function ask() {
    setBusy(true);
    const result = await request().catch(() => "denied" as const);
    setBusy(false);
    if (hasPhotoAccess(result)) router.replace("/bring");
    else setDeclined(true);
  }

  if (denied)
    return (
      <Page>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 14 }}>
          <Keeper id="murmur" size={128} />
          <Headline>{"Psst can't see your screenshots yet."}</Headline>
          <Lead>
            {"Without the Screenshots album there's nothing for the keepers to keep. You can change this in iOS Settings, and take it away again any time."}
          </Lead>
          <KeeperLine id="murmur">{"No screenshots to read yet. I'll wait."}</KeeperLine>
        </View>
        <View style={{ gap: 4 }}>
          <PsstButton label="Open iOS Settings" onPress={openSettings} />
          <PsstButton kind="text" label="Not now" onPress={() => router.replace("/today")} />
        </View>
      </Page>
    );

  const points = [
    <Text key="a" style={[text.lead, { color: p.ink, flex: 1 }]}>
      We <Text style={{ textDecorationLine: "underline" }}>only</Text> read your Screenshots album.
    </Text>,
    <Text key="b" style={[text.lead, { color: p.ink, flex: 1 }]}>Your other photos are never opened, even if iOS says Full Access.</Text>,
    <Text key="c" style={[text.lead, { color: p.ink, flex: 1 }]}>
      Each screenshot goes to our server to be read once. You can delete everything in Settings.
    </Text>,
  ];
  return (
    <Page>
      <View style={{ flex: 1, paddingTop: 24, gap: 20 }}>
        <View style={{ alignSelf: "flex-start" }}>
          <Keeper id="murmur" size={88} />
        </View>
        <Headline>Psst only needs your screenshots.</Headline>
        <View style={{ gap: 14 }}>
          {points.map((point, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{ paddingTop: 1 }}>
                <Tick />
              </View>
              {point}
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Footnote>Nothing is read until you tap Continue and choose in the iOS prompt.</Footnote>
        <PsstButton label="Continue" onPress={ask} disabled={busy} />
      </View>
    </Page>
  );
}
