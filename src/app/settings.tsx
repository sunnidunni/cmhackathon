import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { ActionRow, Footer, Group, SectionLabel, SwitchRow } from "@/components/settings/rows";
import { fonts, KEEPER_IDS, KEEPERS, KeeperFace, SoftCard, text, usePalette } from "@/design/psst";
import { resetActs } from "@/lib/act/store";
import { useDeleteEverything } from "@/lib/delete-everything";
import { DEV_BUILD } from "@/lib/dev-flags";
import { FIXTURES } from "@/lib/fixtures";
import { useAutoRead } from "@/lib/auto-read";
import { useSounds } from "@/lib/sfx";
import { ensureNotificationPermission, hasNotificationPermission } from "@/lib/notifications";
import { DEV_TOOLS, useLibraryDiagnostics, usePhotoAccess, useReadAllPhotos } from "@/lib/photos";
import { useSync } from "@/lib/sync";

const ACCESS_VALUE = { full: "Full", limited: "Selected", denied: "Off", undetermined: "Not asked" } as const;
const ACCESS_DETAIL = {
  full: "iOS calls this Full Access.",
  limited: "You shared only some of your photos.",
  denied: "Shots can't see your screenshots yet.",
  undetermined: "Shots hasn't asked yet.",
} as const;

const PRIVACY_LINES = [
  "We only read your Screenshots album.",
  "Your other photos stay on your phone.",
  "Screenshots are sent to our server and an AI model to be read.",
  "We don't sell your data.",
  "Delete everything anytime in Settings.",
];

function CloseButton() {
  const pal = usePalette();
  const bar = { position: "absolute", width: 16, height: 2, borderRadius: 1, backgroundColor: pal.ink } as const;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={4}
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
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
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </Pressable>
  );
}

export default function Settings() {
  const pal = usePalette();
  const { access, openLimitedPicker, openSettings } = usePhotoAccess();
  const { status, syncNow } = useSync();
  const deleteEverything = useDeleteEverything();
  const { enabled: autoRead, setEnabled: setAutoRead } = useAutoRead();
  const { enabled: sounds, setEnabled: setSounds } = useSounds();
  const [notify, setNotify] = useState(false);
  const [checked, setChecked] = useState<string | null>(null);
  const [readAll, setReadAll] = useReadAllPhotos();
  const diag = useLibraryDiagnostics();

  useEffect(() => {
    hasNotificationPermission().then(setNotify, () => setNotify(false));
  }, []);

  async function toggleNotify(on: boolean) {
    if (!on) return Linking.openSettings();
    const ok = await ensureNotificationPermission();
    setNotify(ok);
    if (!ok) Linking.openSettings();
  }

  async function setAutoReadSaved(on: boolean) {
    if (await setAutoRead(on)) return;
    Alert.alert("Couldn't save this", "Shots will use your choice until it closes, then it may switch back. Try again.");
  }

  async function checkNow() {
    setChecked(null);
    try {
      const { uploaded, failed } = await syncNow();
      if (failed > 0) setChecked(`${failed} didn't go through. Check again to retry.`);
      else setChecked(uploaded === 0 ? "Nothing new." : uploaded === 1 ? "Read 1 new screenshot." : `Read ${uploaded} new screenshots.`);
    } catch {
      setChecked(null);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete everything?",
      "This removes every screenshot, reminder and answer from Shots and our server. The photos stay on your phone. Reading new screenshots turns off until you turn it back on.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            if (await deleteEverything()) return;
            Alert.alert("Couldn't delete", "Nothing was deleted. Check your connection and try again.");
          },
        },
      ],
    );
  }

  const checkDetail =
    status === "syncing" ? "Checking now." : status === "error" ? "Couldn't check. Try again." : (checked ?? undefined);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: pal.paper }}
        contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 48, gap: 24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { flex: 1, color: pal.ink }]}>
            Choose what Shots does for you.
          </Text>
          <CloseButton />
        </View>

        <View style={{ gap: 8 }}>
          <SectionLabel>Reading</SectionLabel>
          <Group>
            <SwitchRow
              first
              title="Read new screenshots automatically"
              detail={autoRead ? "On. When you open Shots, each new one is sent to be read." : "Off. New screenshots wait until you check."}
              value={autoRead}
              onValueChange={setAutoReadSaved}
              testID="auto-read-switch"
            />
            <ActionRow
              title="Check for new screenshots now"
              detail={checkDetail}
              onPress={checkNow}
              disabled={status === "syncing"}
              chevron={false}
              trailing={status === "syncing" ? <ActivityIndicator color={pal.ink2} /> : undefined}
            />
          </Group>
        </View>

        <View style={{ gap: 8 }}>
          <SectionLabel>Reminders</SectionLabel>
          <Group>
            <SwitchRow
              first
              title="Reminder notifications"
              detail="One per reminder you set."
              value={notify}
              onValueChange={toggleNotify}
              testID="notifications-switch"
            />
          </Group>
          <Footer>{"We'll remind you once per item. You can snooze or turn reminders off."}</Footer>
        </View>

        <View style={{ gap: 8 }}>
          <SectionLabel>Sounds</SectionLabel>
          <Group>
            <SwitchRow
              first
              title="Sounds"
              detail={sounds ? "On. Small sounds for keepers and confirmations. Your silent switch still mutes them." : "Off. Shots stays quiet."}
              value={sounds}
              onValueChange={(on) => void setSounds(on)}
              testID="sounds-switch"
            />
          </Group>
        </View>

        <View style={{ gap: 8 }}>
          <SectionLabel>Privacy & photo access</SectionLabel>
          <Group>
            <ActionRow
              first
              title="Photo access"
              detail={access ? ACCESS_DETAIL[access] : "Checking."}
              value={access ? ACCESS_VALUE[access] : undefined}
              onPress={() => (access === "limited" ? openLimitedPicker() : openSettings())}
            />
            <ActionRow title="Change in iOS Settings" onPress={() => openSettings()} />
          </Group>
          <SoftCard style={{ gap: 8, marginTop: 8 }}>
            <Text accessibilityRole="header" style={[text.bodyBold, { color: pal.ink }]}>
              What leaves your phone
            </Text>
            {PRIVACY_LINES.map((line) => (
              <Text key={line} style={[text.body, { color: pal.ink2 }]}>
                {line}
              </Text>
            ))}
          </SoftCard>
        </View>

        <View style={{ gap: 8 }}>
          <SectionLabel>Shots</SectionLabel>
          <Group>
            <View
              accessible
              accessibilityLabel="The keepers: Tock, Murmur, Penny Pocket, Mote"
              style={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[text.bodyBold, { color: pal.ink }]}>The keepers</Text>
                <Text style={[text.caption, { color: pal.ink2 }]}>{KEEPER_IDS.map((id) => KEEPERS[id].name).join(", ")}</Text>
              </View>
              <View style={{ flexDirection: "row" }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                {KEEPER_IDS.map((id, i) => (
                  <View key={id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                    <KeeperFace id={id} size={32} />
                  </View>
                ))}
              </View>
            </View>
            <ActionRow title="Upgrade" detail="Bring in more than 50 screenshots." onPress={() => router.push("/upgrade")} />
          </Group>
        </View>

        <Group>
          <ActionRow first title="Delete everything" tone="danger" onPress={confirmDelete} />
        </Group>

        <View style={{ gap: 8 }}>
          <SectionLabel>More</SectionLabel>
          <Group>
            <ActionRow first title="About Shots" onPress={() => router.push("/about")} />
            <ActionRow title="What happens to your screenshots" onPress={() => router.push("/privacy")} />
            {FIXTURES ? (
              <>
                <ActionRow title="Activity" onPress={() => router.push("/activity")} />
                <ActionRow title="Let Shots prepare actions" onPress={() => router.push("/settings/actions")} />
                <ActionRow title="Your week with Shots" onPress={() => router.push("/recap")} />
              </>
            ) : null}
          </Group>
        </View>

        {DEV_TOOLS ? (
          <View style={{ gap: 8 }}>
            <SectionLabel>Developer</SectionLabel>
            <Group>
              <SwitchRow first title="Read all photos" value={readAll} onValueChange={setReadAll} testID="read-all-switch" />
              <ActionRow title="Reset demos" onPress={resetActs} />
              <ActionRow title="Replay onboarding" detail="Plays the walkthrough with sample screenshots. Nothing of yours is changed." onPress={() => router.push("/welcome?replay=1")} />
              <ActionRow title="Keepers" onPress={() => router.push("/keepers")} />
            </Group>
            <Text style={[text.caption, { color: pal.ink2, fontFamily: fonts.ui }]} testID="diagnostics">
              {diag === null
                ? "Reading library…"
                : typeof diag === "string"
                  ? `Diagnostics failed: ${diag}`
                  : `Smart albums: ${diag.smartAlbums.join(", ") || "none"}\nScreenshots album: ${diag.screenshotsAlbumCount ?? "missing"} · screenshot subtype: ${diag.screenshotSubtypeCount} · all images: ${diag.allImagesCount}`}
            </Text>
          </View>
        ) : null}

        {DEV_BUILD ? (
          <Group>
            <ActionRow first title="Developer" onPress={() => router.push("/dev")} />
          </Group>
        ) : null}
      </ScrollView>
    </>
  );
}
