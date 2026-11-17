import { useAction, useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Linking, ScrollView, Share, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { PsstButton, SoftCard, fonts, text, usePalette } from "@/design/psst";
import { SIRI_SHORTCUT_URL, siriAddress } from "@/lib/siri";

const ADDRESS = siriAddress(process.env.EXPO_PUBLIC_CONVEX_URL, process.env.EXPO_PUBLIC_CONVEX_SITE_URL);

// Steps for building the Shortcut by hand, used when no ready-made one has been published.
const STEPS = [
  "Open the Shortcuts app and make a new shortcut called Ask Shots.",
  "Add Ask for Input, set to Text. This is your question.",
  "Add Get Contents of URL. Set the URL to the address below, the method to POST, and the request body to Form with two fields: key (your key) and question (the Ask for Input result).",
  "Add Speak Text, speaking the result of Get Contents of URL.",
  "Say “Hey Siri, Ask Shots”.",
];

function Value({ label, value, onShare }: { label: string; value: string; onShare: () => void }) {
  const pal = usePalette();
  return (
    <SoftCard style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={[text.caption, { fontFamily: fonts.uiBold, color: pal.ink2 }]}>
        {label}
      </Text>
      <Text selectable maxFontSizeMultiplier={1.6} style={[text.body, { color: pal.ink }]}>
        {value}
      </Text>
      <PsstButton kind="outline" label={`Share or copy the ${label.toLowerCase()}`} onPress={onShare} />
    </SoftCard>
  );
}

export default function Siri() {
  const pal = usePalette();
  const status = useQuery(api.siri.status, {});
  const enable = useAction(api.siri.enable);
  const disable = useMutation(api.siri.disable);
  // The key exists in the app only until this screen closes. The server keeps a hash and cannot show it again.
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function turnOn() {
    setBusy(true);
    setError(null);
    try {
      setKey((await enable({})).key);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      setError("Couldn't turn Siri on. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);
    try {
      await disable({});
      setKey(null);
    } catch {
      setError("Couldn't turn Siri off. It is still on. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const confirmNewKey = () =>
    Alert.alert("Make a new key?", "Your current key stops working at once. You'll need to put the new one in your Shortcut.", [
      { text: "Cancel", style: "cancel" },
      { text: "Make a new key", onPress: () => void turnOn() },
    ]);
  const confirmOff = () =>
    Alert.alert("Turn off Siri?", "Your key stops working at once. Your Shortcut will no longer get answers.", [
      { text: "Cancel", style: "cancel" },
      { text: "Turn off", style: "destructive", onPress: () => void turnOff() },
    ]);
  const share = (message: string) => void Share.share({ message }).catch(() => undefined);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Ask with Siri",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: pal.paper },
          headerTintColor: pal.ink,
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerLargeTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: pal.paper }} contentContainerStyle={{ padding: 20, paddingBottom: 64, gap: 20 }}>
        <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
          Ask Siri about your screenshots and hear the answer. It works through a Shortcut that sends your question to Shots with a key.
        </Text>

        {status === undefined ? <Text style={[text.body, { color: pal.ink2 }]}>Checking.</Text> : null}

        {status && !status.on && !key ? (
          <>
            <PsstButton kind="filled" label="Turn on Siri" onPress={turnOn} disabled={busy} />
            <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
              Turning it on makes a key. Anyone who has the key can ask about your screenshots, so keep it in your own Shortcut. You can turn Siri off here at any time.
            </Text>
          </>
        ) : null}

        {key ? (
          <>
            <Value label="Key" value={key} onShare={() => share(key)} />
            <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
              This is the only time Shots shows the key. If you lose it, make a new one.
            </Text>
            {ADDRESS ? <Value label="Address" value={ADDRESS} onShare={() => share(ADDRESS)} /> : <Text style={[text.body, { color: pal.danger }]}>{"Shots couldn't work out its address in this build, so Siri can't be set up from here."}</Text>}
            {SIRI_SHORTCUT_URL ? (
              <>
                <PsstButton kind="filled" label="Get the Ask Shots Shortcut" onPress={() => void Linking.openURL(SIRI_SHORTCUT_URL).catch(() => setError("Couldn't open the Shortcut."))} />
                <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
                  When the Shortcut asks, paste in the key and the address. Then say “Hey Siri, Ask Shots”.
                </Text>
              </>
            ) : (
              <View style={{ gap: 10 }}>
                <Text accessibilityRole="header" style={[text.bodyBold, { color: pal.ink }]}>
                  Set up the Shortcut
                </Text>
                {STEPS.map((step, i) => (
                  <Text key={step} maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink2 }]}>{`${i + 1}. ${step}`}</Text>
                ))}
              </View>
            )}
          </>
        ) : null}

        {status?.on && !key ? (
          <>
            <Text maxFontSizeMultiplier={2} style={[text.bodyBold, { color: pal.ink }]}>
              {status.since ? `Siri is on, since ${new Date(status.since).toLocaleDateString()}.` : "Siri is on."}
            </Text>
            <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
              Shots can&apos;t show your key again. If your Shortcut has stopped working or the key may have been seen by someone else, make a new one.
            </Text>
            <PsstButton kind="outline" label="Make a new key" onPress={confirmNewKey} disabled={busy} />
          </>
        ) : null}

        {status?.on || key ? <PsstButton kind="outline" danger label="Turn off Siri" onPress={confirmOff} disabled={busy} /> : null}
        {error ? <Text accessibilityLiveRegion="polite" style={[text.caption, { color: pal.danger }]}>{error}</Text> : null}
      </ScrollView>
    </>
  );
}
