import { useAction, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Button, Character, colors, Doodle, SketchFrame, SpeechBubble, radii, spacing, type } from "@/design";

const PRICE = "$9";

type Phase = "idle" | "starting" | "pending" | "failed";

export default function Upgrade() {
  const router = useRouter();
  const plan = useQuery(api.plan.myPlan);
  const createCheckout = useAction(api.whop.createCheckout);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onUpgrade() {
    setPhase("starting");
    setError(null);
    try {
      const { purchaseUrl } = await createCheckout({});
      await WebBrowser.openBrowserAsync(purchaseUrl, { dismissButtonStyle: "close" });
      setPhase("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("failed");
    }
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const paid = plan === "paid";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={12}>
          <Text style={type.heading}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "flex-start", alignSelf: "stretch", gap: spacing.xs }}>
          <SpeechBubble tail="bottom-left">
            {plan === undefined ? "One moment…" : paid ? "Shots. It's all yours now." : "Shots. Want all of them?"}
          </SpeechBubble>
          <View style={{ marginLeft: spacing.md }}>
            <Character room="money" size={104} expression={paid ? "happy" : "neutral"} />
          </View>
        </View>

        {plan === undefined ? (
          <ActivityIndicator color={colors.ink} />
        ) : paid ? (
          <View style={{ alignSelf: "stretch", gap: spacing.sm }} testID="upgrade-paid">
            <Text style={type.display}>You&apos;re all set</Text>
            <Text style={type.body}>
              Bring in your whole screenshot library, not just the newest 50. Thank you for supporting Shots.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ alignSelf: "stretch", gap: spacing.xs }}>
              <Text style={type.display}>Bring in everything</Text>
              <Doodle kind="underline" width={170} color={colors.sun} />
              <Text style={[type.body, { marginTop: spacing.sm }]}>
                Free reads the newest 50 screenshots. Pay once and Shots reads your whole library.
              </Text>
            </View>
            <SketchFrame fill={colors.white} radius={radii.lg} seed="upgrade-card" style={{ alignSelf: "stretch", padding: spacing.lg, gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <Text style={type.title}>{PRICE}</Text>
                <Text style={type.caption}>one time, no subscription</Text>
              </View>
              <Text style={type.body}>Reminders stay free and unlimited either way.</Text>
            </SketchFrame>
          </>
        )}
      </ScrollView>

      <View style={{ padding: spacing.xl, gap: spacing.sm }}>
        {paid ? (
          <Button label="Done" onPress={close} />
        ) : plan === undefined ? null : (
          <>
            {phase === "pending" ? (
              <View testID="upgrade-pending" style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <ActivityIndicator color={colors.ink} />
                <Text style={[type.body, { flex: 1 }]}>Waiting for your payment to come through. This takes a few seconds.</Text>
              </View>
            ) : null}
            {phase === "failed" ? (
              <Text testID="upgrade-failed" style={type.body}>
                Couldn&apos;t start checkout{error ? `: ${error}` : ""}. Nothing was charged.
              </Text>
            ) : null}
            <Button
              label={phase === "starting" ? "Opening checkout…" : phase === "failed" ? "Try again" : phase === "pending" ? "Open checkout again" : `Upgrade for ${PRICE}`}
              onPress={onUpgrade}
              disabled={phase === "starting"}
            />
            <Text style={[type.caption, { textAlign: "center" }]}>No account needed. You pay on a secure Whop page.</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
