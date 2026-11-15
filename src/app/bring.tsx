import { router } from "expo-router";
import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { bringInHeadline, howManyLine } from "@/components/onboarding/format";
import { KeeperFace, PsstButton, SoftCard, Skeleton, text, usePalette } from "@/components/onboarding/kit";
import { Footnote, Headline, KeeperRow, Lead, Page } from "@/components/onboarding/page";
import { useBringCount } from "@/components/onboarding/use-bring-count";
import { usePhotoAccess } from "@/lib/photos";
import { useImportStarted } from "@/lib/sync";

export default function Bring() {
  const p = usePalette();
  const { markStarted } = useImportStarted();
  const { access, openLimitedPicker } = usePhotoAccess();
  const { count, limit } = useBringCount();
  const [readNew, setReadNew] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    await markStarted();
    router.replace("/import");
  }

  return (
    <Page>
      <View style={{ flex: 1, paddingTop: 24, gap: 20 }}>
        <KeeperRow muted size={64} />
        {count === null ? (
          <View style={{ gap: 10 }} accessibilityLabel="Counting your screenshots">
            <Skeleton w="85%" h={34} />
            <Skeleton w="60%" h={34} />
          </View>
        ) : (
          <Headline>{bringInHeadline(count)}</Headline>
        )}
        <Lead>The keepers read them in about a minute and file each one into a room. You can look around while they work.</Lead>
        {access === "limited" && count !== null ? (
          <SoftCard>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <KeeperFace id="murmur" size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[text.bodyBold, { color: p.ink }]}>{`Psst sees the ${count} you picked. That works.`}</Text>
                <Text style={[text.caption, { color: p.ink2 }]} onPress={openLimitedPicker} accessibilityRole="button">
                  Change the selection
                </Text>
              </View>
            </View>
          </SoftCard>
        ) : null}
        <View>
          <View style={{ borderTopWidth: 1, borderColor: p.hair, paddingVertical: 14, gap: 2 }}>
            <Text style={[text.bodyBold, { color: p.ink }]}>How many</Text>
            {count === null ? <Skeleton w="70%" h={18} /> : <Text style={[text.caption, { color: p.ink2 }]}>{howManyLine(count, limit)}</Text>}
          </View>
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.hair, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.bodyBold, { color: p.ink }]}>Read new screenshots</Text>
              <Text style={[text.caption, { color: p.ink2 }]}>
                {"Off. Turn on to read new ones when you open Psst. Each is sent to be read."}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Read new screenshots"
              value={readNew}
              onValueChange={setReadNew}
              trackColor={{ true: p.ink, false: p.fill2 }}
            />
          </View>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Footnote>Screenshots go to our server and the model that reads them. Nowhere else.</Footnote>
        <PsstButton label="Bring in my screenshots" onPress={start} disabled={busy} />
      </View>
    </Page>
  );
}
