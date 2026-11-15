import { StyleSheet, Text, View } from "react-native";
import { KeeperLine, ShotSticker, Wash, text, usePalette, useKeeperColors } from "@/design/psst";
import { Enter } from "./Enter";
import { foundFact } from "./demo-shots";

// Fixture only: the backend has no "found" fact yet (see Backend asks in the PR).
export function FoundCard() {
  const p = usePalette();
  const { deep } = useKeeperColors("penny");
  const fact = foundFact();
  return (
    <Enter>
      <Wash keeper="penny" style={styles.card}>
        <ShotSticker uri={fact.uri} title={fact.title} size={72} />
        <View style={styles.body}>
          <Text style={[text.bodyBold, { color: p.ink }]}>{fact.headline}</Text>
          <Text style={[text.bodyBold, { color: deep }]}>{fact.detail}</Text>
          {fact.line ? (
            <KeeperLine id="penny" row>
              {fact.line}
            </KeeperLine>
          ) : null}
        </View>
      </Wash>
    </Enter>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  body: { flex: 1, gap: 3 },
});
