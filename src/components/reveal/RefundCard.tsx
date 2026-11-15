import { StyleSheet, Text, View } from "react-native";
import { Enter } from "./Enter";
import { KeeperLine, ShotSticker, Wash, text, usePalette, useKeeperColors } from "./kit";

// Fixture only: the backend has no refund field yet (see Backend asks in the PR).
export const REFUND_FIXTURE = { amount: "$6.49", merchant: "Greenleaf", date: "Nov 8", title: "Greenleaf grocery receipt" };

export function RefundCard() {
  const p = usePalette();
  const { deep } = useKeeperColors("penny");
  return (
    <Enter>
      <Wash keeper="penny" style={styles.card}>
        <ShotSticker uri={null} title={REFUND_FIXTURE.title} size={52} />
        <View style={styles.body}>
          <Text style={[text.bodyBold, { color: p.ink }]}>Penny Pocket found a refund still marked pending.</Text>
          <Text style={[text.bodyBold, { color: deep }]}>{`${REFUND_FIXTURE.amount} at ${REFUND_FIXTURE.merchant}, ${REFUND_FIXTURE.date}`}</Text>
          <Text style={[text.caption, { color: p.ink2 }]}>{"From the receipt. Psst can't see your bank."}</Text>
          <KeeperLine id="penny">Pending since Nov 8. Worth a look.</KeeperLine>
        </View>
      </Wash>
    </Enter>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 14, padding: 14, alignItems: "flex-start" },
  body: { flex: 1, gap: 3 },
});
