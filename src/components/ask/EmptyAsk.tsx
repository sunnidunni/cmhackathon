import { Pressable, Text, View } from "react-native";
import { DEV_TOOLS } from "@/lib/dev-flags";
import { Keeper, KeeperLine, PsstButton, text, usePalette } from "@/design/psst";

const TRY = DEV_TOOLS ? "When does pottery sign-up close?" : "When is that due?";
const MORE = ["What's the Wi-Fi password?", "What are my flight details?", "What was that recipe?"];

export function EmptyAsk({ count, onPick, showSuggestions }: { count: number | undefined; onPick: (q: string) => void; showSuggestions: boolean }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 8 }}>
        <Text style={[text.headline, { color: p.ink }]}>Ask about screenshots Psst has read.</Text>
        <Text style={[text.lead, { color: p.ink2 }]}>Each answer comes with its source screenshot. Open it to check the details.</Text>
      </View>
      {showSuggestions ? (
        <View style={{ marginTop: 16 }}>
          <PsstButton kind="filled" label={`Try: ${TRY}`} onPress={() => onPick(TRY)} />
          {MORE.map((q, i) => (
            <Pressable
              key={q}
              accessibilityRole="button"
              onPress={() => onPick(q)}
              style={{ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: i === 0 ? 0 : 1, borderBottomWidth: i === MORE.length - 1 ? 1 : 0, borderColor: p.hair }}
            >
              <Text style={[text.lead, { color: p.ink }]}>{q}</Text>
              <Text accessibilityElementsHidden style={[text.lead, { color: p.ink3 }]}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {showSuggestions && count !== undefined ? (
        <View style={{ flex: 1, justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end", gap: 12, paddingBottom: 8 }}>
          <KeeperLine id="murmur" style={{ flex: 1, paddingBottom: 12 }}>
            {count === 0 ? "Nothing to ask about yet." : `Ask about any of your ${count} screenshots. I show my work.`}
          </KeeperLine>
          <View style={{ marginRight: -24, marginBottom: -24 }}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Keeper id="murmur" size={120} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
