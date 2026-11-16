import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Footnote, Headline, KeeperRow, Lead, Page } from "@/components/onboarding/page";
import { PsstButton, ShotSticker, text, usePalette } from "@/design/psst";
import { DEMO_FLYER } from "@/lib/fixtures";

const WHAT_WHEN_WHERE = [
  ["What", DEMO_FLYER.title],
  ["When", `Closes ${DEMO_FLYER.closes}`],
  ["Where", "Eastside Community Center"],
] as const;

export default function Welcome() {
  const p = usePalette();
  const [step, setStep] = useState<"welcome" | "explainer">("welcome");
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const toPriming = () => router.push(replay ? "/priming?replay=1" : "/priming");

  if (step === "explainer")
    return (
      <Page
        header={
          <View style={{ alignItems: "flex-end" }}>
            <PsstButton kind="text" label="Skip" onPress={toPriming} />
          </View>
        }
        footer={
          <View style={{ gap: 8 }}>
            <Footnote>Reading starts only after you choose in the iOS prompt.</Footnote>
            <PsstButton kind="filled" label="Next" onPress={toPriming} />
          </View>
        }
      >
        <View style={{ flexGrow: 1, gap: 20, paddingTop: 8 }}>
          <Headline>Psst pulls the date, price or place out of a screenshot.</Headline>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ShotSticker uri={DEMO_FLYER.image} title={DEMO_FLYER.title} size={132} tilt />
            <View style={{ flex: 1, gap: 8 }}>
              {WHAT_WHEN_WHERE.map(([label, value]) => (
                <View key={label} style={{ backgroundColor: p.fill, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={[text.caption, { color: p.ink2 }]}>{label}</Text>
                  <Text style={[text.bodyBold, { color: p.ink }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
          <Lead>Dates, prices, plans and places, pulled out of the screenshot itself.</Lead>
        </View>
      </Page>
    );

  return (
    <Page
      footer={
        <View style={{ gap: 8 }}>
          <Footnote>Takes about a minute. Nothing is read yet.</Footnote>
          <PsstButton kind="filled" label="Get started" onPress={() => setStep("explainer")} />
        </View>
      }
    >
      <View style={{ flexGrow: 1, justifyContent: "center", gap: 28 }}>
        <KeeperRow size={76} />
        <View style={{ gap: 12 }}>
          <Headline large>Psst. You saved these for a reason.</Headline>
          <Lead>Psst reads your screenshots, files them into four rooms, and brings back the few that matter today.</Lead>
        </View>
      </View>
    </Page>
  );
}
