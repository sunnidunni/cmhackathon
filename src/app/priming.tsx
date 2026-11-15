import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Body, Heading, Screen, Stack } from "@/components/onboarding/ui";
import { Button, Character, spacing, type } from "@/design";
import { hasPhotoAccess, usePhotoAccess } from "@/lib/photos";

export default function Priming() {
  const { access, request, openSettings } = usePhotoAccess();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasPhotoAccess(access)) router.replace("/bring");
  }, [access]);

  async function ask() {
    if (access === "denied") return openSettings();
    setBusy(true);
    const result = await request().catch(() => "denied" as const);
    setBusy(false);
    if (hasPhotoAccess(result)) router.replace("/bring");
    else setDenied(true);
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.xl }}>
        <View style={{ alignItems: "center" }}>
          <Character size={96} expression="happy" />
        </View>
        {denied ? (
          <Stack>
            <Heading>I can't see your screenshots yet</Heading>
            <Body>Psst needs to see your Screenshots album to find the ones you forgot.</Body>
          </Stack>
        ) : (
          <Stack>
            <Heading>I find the screenshots you forgot</Heading>
            <Body>I only read your Screenshots album.</Body>
            <Body>I never touch your other photos.</Body>
            <Body>Screenshots are sent to our server to be read.</Body>
          </Stack>
        )}
      </View>
      <Button
        label={denied ? (access === "denied" ? "Open settings" : "Ask again") : "Continue"}
        onPress={ask}
        disabled={busy}
      />
    </Screen>
  );
}
