import { StyleSheet, Text, View } from "react-native";
import { KeeperLine, ShotSticker, Wash, text, usePalette, useKeeperColors } from "@/design/psst";
import { DEMO_RECEIPT } from "@/lib/fixtures";
import { Enter } from "./Enter";

// Fixture only: the backend has no refund field yet (see Backend asks in the PR).
export function RefundCard() {
  const p = usePalette();
  const { deep } = useKeeperColors("penny");
  return (
    <Enter>
      <Wash keeper="penny" style={styles.card}>
        <ShotSticker uri={null} title={DEMO_RECEIPT.title} size={72} variant="receipt" />
        <View style={styles.body}>
          <Text style={[text.bodyBold, { color: p.ink }]}>Penny Pocket found a refund still marked pending.</Text>
          <Text style={[text.bodyBold, { color: deep }]}>
            {DEMO_RECEIPT.refund.amount} at {DEMO_RECEIPT.merchant}, {DEMO_RECEIPT.date} · {DEMO_RECEIPT.source}
          </Text>
          <KeeperLine id="penny" row>
            {DEMO_RECEIPT.pennyLine}
          </KeeperLine>
        </View>
      </Wash>
    </Enter>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  body: { flex: 1, gap: 3 },
});
