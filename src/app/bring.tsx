import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { bringInHeadline, howManyLine } from "@/components/onboarding/format";
import { KeeperFace, PsstButton, SoftCard, Skeleton, text, usePalette } from "@/design/psst";
import { Footnote, Headline, KeeperRow, Lead, Page } from "@/components/onboarding/page";
import { useBringCount } from "@/components/onboarding/use-bring-count";
import { FIXTURES } from "@/lib/fixtures";
import { usePhotoAccess } from "@/lib/photos";
import { useImportStarted } from "@/lib/sync";

export default function Bring() {
  const p = usePalette();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { markStarted } = useImportStarted();
  const { access, openLimitedPicker } = usePhotoAccess();
  const { count, limit, recount } = useBringCount();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    if (FIXTURES && replay) return router.replace("/import?demo=play");
    await markStarted();
    router.replace("/import");
  }

  return (
    <Page
      footer={
        <View style={{ gap: 8 }}>
          <Footnote>Screenshots are sent to our server and an AI model to be read.</Footnote>
          <PsstButton kind="filled" label="Bring in my screenshots" onPress={start} disabled={busy} />
        </View>
      }
    >
      <View style={{ flexGrow: 1, paddingTop: 24, gap: 20 }}>
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
                <Text style={[text.bodyBold, { color: p.ink }]}>{`We only read the ${count} you picked. Your other photos stay on your phone.`}</Text>
                <Text style={[text.caption, { color: p.ink2 }]} onPress={async () => { await openLimitedPicker(); recount(); }} accessibilityRole="button">
                  Pick more screenshots
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
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.hair, paddingVertical: 14 }}>
            <Text style={[text.caption, { color: p.ink2 }]}>
              Psst will read new screenshots when you open it. You can turn this off in Settings.
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
