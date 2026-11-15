import { router } from "expo-router";
import { View } from "react-native";
import { Footnote, Headline, KeeperRow, Lead, Page } from "@/components/onboarding/page";
import { PsstButton } from "@/components/onboarding/kit";

export default function Welcome() {
  return (
    <Page>
      <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
        <KeeperRow size={76} />
        <View style={{ gap: 12 }}>
          <Headline large>Psst. You saved these for a reason.</Headline>
          <Lead>Four keepers file your screenshots into four rooms. They bring back the few that matter today.</Lead>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <PsstButton label="Get started" onPress={() => router.push("/priming")} />
        <Footnote>Takes about a minute. Nothing is read yet.</Footnote>
      </View>
    </Page>
  );
}
