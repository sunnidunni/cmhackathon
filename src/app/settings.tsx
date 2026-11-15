import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Body, Screen } from "@/components/onboarding/ui";
import { Button, colors, radii, ScreenHeader, SketchFrame, spacing, type } from "@/design";
import { ensureNotificationPermission, hasNotificationPermission } from "@/lib/notifications";
import { DEV_TOOLS, useLibraryDiagnostics, usePhotoAccess, useReadAllPhotos } from "@/lib/photos";
import { useSync } from "@/lib/sync";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SketchFrame fill={colors.white} radius={radii.lg} seed={title} style={{ padding: spacing.lg, gap: spacing.sm }}>
      <Text style={type.heading}>{title}</Text>
      {children}
    </SketchFrame>
  );
}

const ACCESS_LINE = {
  full: "Psst can see all your photos and reads only your Screenshots album.",
  limited: "Psst can only see some of your photos.",
  denied: "Photo access is off, so Psst can't read your screenshots.",
  undetermined: "Photo access hasn't been asked for yet.",
} as const;

export default function Settings() {
  const { access, openLimitedPicker, openSettings } = usePhotoAccess();
  const { status, error, syncNow } = useSync();
  const removeAll = useMutation(api.shots.removeAll);
  const [notify, setNotify] = useState(false);
  const [leaves, setLeaves] = useState(false);
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

  function confirmDelete() {
    Alert.alert(
      "Delete everything?",
      "This removes every screenshot, reminder and answer from Psst and our server. The photos stay on your phone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete everything", style: "destructive", onPress: () => removeAll({}) },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <ScreenHeader
          title="Settings"
          right={<Button label="Done" variant="secondary" onPress={() => router.back()} />}
        />
        <Card title="Reminders">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Text style={[type.body, { flex: 1 }]}>Reminder notifications</Text>
            <Switch value={notify} onValueChange={toggleNotify} trackColor={{ true: colors.sun }} />
          </View>
          <Body>A notification holds only a short line from Psst and the title of the screenshot, such as "Psst: your flyer is due tomorrow. Want to see it?"</Body>
        </Card>

        <Card title="Photo access">
          <Body>{access ? ACCESS_LINE[access] : "Checking photo access."}</Body>
          <Body>Psst reads only your Screenshots album.</Body>
          {status === "syncing" ? <Body>Checking for new screenshots</Body> : null}
          {status === "error" ? <Body>{error ?? "Couldn't sync. Check your connection and try again"}</Body> : null}
          <Button label="Sync now" variant="secondary" onPress={() => syncNow().catch(() => {})} disabled={status === "syncing"} />
          {access === "limited" ? (
            <Button label="Give access to all screenshots" onPress={() => openLimitedPicker()} />
          ) : null}
          {access === "denied" ? <Button label="Open settings" onPress={() => openSettings()} /> : null}
        </Card>

        <Card title="What leaves your phone">
          <Pressable accessibilityRole="button" onPress={() => setLeaves(!leaves)}>
            <Text style={type.body}>{leaves ? "Hide" : "Show me"}</Text>
          </Pressable>
          {leaves ? (
            <Body>
              Each screenshot is shrunk and sent to our server, where it is read to find its title, dates and room. The
              text and the file are stored so you can ask about them. Your other photos never leave your phone. Delete
              everything removes it all.
            </Body>
          ) : null}
        </Card>

        <Card title="Upgrade">
          <Body>Bring in more than 50 screenshots.</Body>
          <Button label="Upgrade" variant="secondary" onPress={() => router.push("/upgrade")} />
        </Card>

        <Button label="Delete everything" variant="secondary" onPress={confirmDelete} />

        {DEV_TOOLS ? (
          <Card title="Developer">
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Text style={[type.body, { flex: 1 }]}>Read all photos</Text>
              <Switch value={readAll} onValueChange={setReadAll} testID="read-all-switch" trackColor={{ true: colors.sun }} />
            </View>
            <Text style={type.caption} testID="diagnostics">
              {diag === null
                ? "Reading library…"
                : typeof diag === "string"
                  ? `Diagnostics failed: ${diag}`
                  : `Smart albums: ${diag.smartAlbums.join(", ") || "none"}\nScreenshots album: ${diag.screenshotsAlbumCount ?? "missing"} · screenshot subtype: ${diag.screenshotSubtypeCount} · all images: ${diag.allImagesCount}`}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
