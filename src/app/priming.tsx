import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Footnote, Headline, Lead, Page, Tick } from "@/components/onboarding/page";
import { Keeper, KeeperLine, PsstButton, text, usePalette } from "@/design/psst";
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
      <Page
        footer={
          <View style={{ gap: 4 }}>
            <Footnote>We only read your Screenshots album.</Footnote>
            <PsstButton kind="filled" label="Open iOS Settings" onPress={openSettings} />
            <PsstButton kind="text" label="Go to Today" onPress={() => router.replace("/today")} />
          </View>
        }
      >
        <View style={{ flexGrow: 1, justifyContent: "center", gap: 14 }}>
          <View style={{ alignSelf: "center" }}>
            <Keeper id="murmur" size={128} />
          </View>
          <Headline>{"Psst can't see your screenshots yet."}</Headline>
          <Lead>{"Nothing has been brought in. You can choose screenshots later. You can pick a few screenshots instead, or change photo access in iOS Settings → Psst → Photos."}</Lead>
          <KeeperLine id="murmur">{"Fine by me. I'll wait by the door."}</KeeperLine>
        </View>
      </Page>
    );

  const choices = [
    ["Allow Full Access", "New screenshots are read when you open Psst. Your other photos stay on your phone."],
    ["Limit Access", "iOS shows all your photos: tap Collections › Screenshots and tick the ones you want. Add more any time."],
  ] as const;
  return (
    <Page
      footer={
        <View style={{ gap: 8 }}>
          <Footnote>
            {"Screenshots are sent to our server and an AI model to be read. We don't sell your data. Delete everything anytime in Settings."}
          </Footnote>
          <PsstButton kind="filled" label="Continue" onPress={ask} disabled={busy} />
        </View>
      }
    >
      <View style={{ flexGrow: 1, paddingTop: 24, gap: 20 }}>
        <View style={{ alignSelf: "flex-start" }}>
          <Keeper id="murmur" size={88} />
        </View>
        <Headline>
          We <Text style={{ textDecorationLine: "underline" }}>only</Text> read your Screenshots album.
        </Headline>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 4, alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Tick />
            <Text style={[text.bodyBold, { color: p.ink }]}>Screenshots: read</Text>
          </View>
          <Text style={[text.body, { color: p.ink2 }]}>Photos: stay on your phone</Text>
        </View>
        <View>
          <Text style={[text.body, { color: p.ink2, paddingBottom: 10 }]}>iOS calls this Full Access, which covers your whole photo library. You can pick a few screenshots instead.</Text>
          {choices.map(([title, body]) => (
            <View key={title} style={{ borderTopWidth: 1, borderColor: p.hair, paddingVertical: 12, gap: 2 }}>
              <Text style={[text.bodyBold, { color: p.ink }]}>{title}</Text>
              <Text style={[text.body, { color: p.ink2 }]}>{body}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}
