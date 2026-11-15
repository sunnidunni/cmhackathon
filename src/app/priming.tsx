import { router } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/state-views";
import { requestPhotoAccess } from "@/lib/photos";

// The one priming screen before the system photo prompt (spec section 4). No skip button.
export default function Priming() {
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    setBusy(true);
    const access = await requestPhotoAccess().catch(() => "denied" as const);
    setBusy(false);
    if (access === "all" || access === "limited") router.replace("/library");
    else setDenied(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.face}>(•ᴗ•)</Text>
        <Text style={styles.title}>We only read your Screenshots album.</Text>
        <Text style={styles.text}>We never touch your other photos.</Text>
        <Text style={styles.text}>
          Your screenshots are sent to our server so they can be read and sorted for you.
        </Text>
        {denied ? (
          <Text style={styles.warn}>
            Photo access is off. Turn it on in Settings so we can bring in your screenshots.
          </Text>
        ) : null}
      </View>
      {denied ? (
        <Button label="Open Settings" onPress={() => Linking.openSettings()} />
      ) : (
        <Button label="Continue" onPress={onContinue} disabled={busy} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 24, justifyContent: "space-between", backgroundColor: "white" },
  body: { flex: 1, justifyContent: "center", gap: 14 },
  face: { fontSize: 56, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  text: { fontSize: 16, color: "#444", textAlign: "center" },
  warn: { fontSize: 15, color: "#B00020", textAlign: "center", marginTop: 8 },
});
