import { useAction, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { LoadingView } from "@/components/state-views";

const PRICE = "$9";

type Phase = "idle" | "starting" | "pending" | "failed";

function Eyes({ pupil = "#2B2118", size = 12 }: { pupil?: string; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: size * 0.7 }}>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.eye, { width: size * 2, height: size * 2, borderRadius: size }]}>
          <View style={{ width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: pupil }} />
        </View>
      ))}
    </View>
  );
}

function Mouth({ width = 22 }: { width?: number }) {
  return <View style={[styles.mouth, { width }]} />;
}

function Friends() {
  return (
    <View style={styles.friends} accessibilityLabel="Tock, Penny Pocket and Wisp">
      <View style={[styles.tock]}>
        <View style={styles.nub} />
        <Eyes />
        <Mouth />
      </View>
      <View style={[styles.penny]}>
        <Eyes pupil="#12382B" size={11} />
        <Mouth />
      </View>
      <View style={styles.wisp}>
        <View style={styles.sparkle} />
        <Eyes pupil="#231B4D" size={9} />
        <View style={styles.o} />
      </View>
    </View>
  );
}

function Perk({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.perk}>
      <View style={styles.tick}>
        <Text style={styles.tickText}>✓</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.perkTitle}>{title}</Text>
        <Text style={styles.perkBody}>{body}</Text>
      </View>
    </View>
  );
}

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

  const close = () => (router.canGoBack() ? router.back() : router.replace("/library"));

  if (plan === undefined) return <LoadingView label="One moment…" />;

  const paid = plan === "paid";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Friends />
        {paid ? (
          <View style={styles.center} testID="upgrade-paid">
            <Text style={styles.title}>You're all set</Text>
            <Text style={styles.sub}>
              Your whole screenshot library is open, and reminders have no limit. Thank you!
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Keep every screenshot</Text>
            <Text style={styles.sub}>Free gives you your latest 50. Upgrade once and keep the lot.</Text>
            <View style={styles.perks}>
              <Perk title="Your whole library" body="Every screenshot you have, not just the latest 50." />
              <Perk title="Unlimited reminders" body="Tock will keep an eye on as many dates as you like." />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {paid ? (
          <Pressable accessibilityRole="button" onPress={close} style={styles.primary}>
            <Text style={styles.primaryText}>Back to my screenshots</Text>
          </Pressable>
        ) : (
          <>
            {phase === "pending" ? (
              <View style={styles.status} testID="upgrade-pending">
                <ActivityIndicator />
                <Text style={styles.statusText}>Waiting for your payment to come through. This usually takes a few seconds.</Text>
              </View>
            ) : null}
            {phase === "failed" ? (
              <Text style={styles.failed} testID="upgrade-failed">
                We couldn't start checkout{error ? `: ${error}` : "."} Nothing was charged.
              </Text>
            ) : null}
            <Text style={styles.price}>
              {PRICE} <Text style={styles.priceNote}>one time, no subscription</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onUpgrade}
              disabled={phase === "starting"}
              style={({ pressed }) => [styles.primary, (pressed || phase === "starting") && styles.dim]}
            >
              <Text style={styles.primaryText}>
                {phase === "starting"
                  ? "Opening checkout…"
                  : phase === "failed"
                    ? "Try again"
                    : phase === "pending"
                      ? "Open checkout again"
                      : `Upgrade for ${PRICE}`}
              </Text>
            </Pressable>
            <Text style={styles.fine}>No account needed. You pay on a secure Whop page.</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8EC" },
  top: { alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 8 },
  close: { fontSize: 20, color: "#8A7A63", padding: 4 },
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 16 },
  center: { gap: 12 },
  friends: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 10, height: 140, marginBottom: 8 },
  tock: { width: 96, height: 96, borderRadius: 30, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center", gap: 8 },
  nub: { position: "absolute", top: -10, width: 14, height: 12, borderRadius: 4, backgroundColor: "#F59E0B" },
  penny: { width: 84, height: 112, borderRadius: 26, backgroundColor: "#2FA37A", alignItems: "center", justifyContent: "center", gap: 10 },
  wisp: { width: 104, height: 84, borderRadius: 42, backgroundColor: "#8B7CF6", alignItems: "center", justifyContent: "center", gap: 8 },
  sparkle: { position: "absolute", top: -14, right: 12, width: 18, height: 18, backgroundColor: "#FFD966", transform: [{ rotate: "45deg" }], borderRadius: 4 },
  eye: { backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  mouth: { height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.35)" },
  o: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(35,27,77,0.6)" },
  title: { fontSize: 32, fontWeight: "800", color: "#2B2118", textAlign: "center" },
  sub: { fontSize: 17, lineHeight: 24, color: "#6B5B45", textAlign: "center" },
  perks: { gap: 14, marginTop: 8, backgroundColor: "white", borderRadius: 20, padding: 18 },
  perk: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#2FA37A", alignItems: "center", justifyContent: "center", marginTop: 2 },
  tickText: { color: "white", fontWeight: "800" },
  perkTitle: { fontSize: 17, fontWeight: "700", color: "#2B2118" },
  perkBody: { fontSize: 15, lineHeight: 21, color: "#6B5B45", marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 10 },
  price: { fontSize: 28, fontWeight: "800", color: "#2B2118", textAlign: "center" },
  priceNote: { fontSize: 15, fontWeight: "500", color: "#6B5B45" },
  primary: { backgroundColor: "#3D5AFE", paddingVertical: 17, borderRadius: 16, alignItems: "center" },
  primaryText: { color: "white", fontSize: 18, fontWeight: "700" },
  dim: { opacity: 0.6 },
  fine: { fontSize: 13, color: "#8A7A63", textAlign: "center" },
  status: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#EEF1FF", padding: 12, borderRadius: 12 },
  statusText: { flex: 1, fontSize: 14, color: "#2B3A9E" },
  failed: { fontSize: 14, color: "#B00020", textAlign: "center" },
});
