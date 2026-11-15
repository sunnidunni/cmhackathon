import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Body, Heading, Screen, Stack } from "@/components/onboarding/ui";
import { Button, Character, spacing } from "@/design";
import { useImportStarted } from "@/lib/sync";

export default function Bring() {
  const { markStarted } = useImportStarted();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    await markStarted();
    router.replace("/import");
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.xl }}>
        <View style={{ alignItems: "center" }}>
          <Character size={96} />
        </View>
        <Stack>
          <Heading>Ready when you are</Heading>
          <Body>I will read up to 50 of your newest screenshots. It takes about a minute.</Body>
        </Stack>
      </View>
      <Button label="Bring in my screenshots" onPress={start} disabled={busy} />
    </Screen>
  );
}
