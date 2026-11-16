import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import { Keeper, KeeperLine, PsstButton, text, usePalette } from "@/design/psst";

// Starter questions for the sample screenshots. Demo builds only: a real library gets questions built from its own screenshots.
export const DEMO_STARTERS = ["When does the pottery sign-up close?", "What's the Wi-Fi password from Mom?", "What are my flight details?", "What was that recipe?"];

// `starters` are questions this library can answer. The first is the main button; with none, no suggestions show.
export function EmptyAsk({ count, starters, onPick, showSuggestions }: { count: number | undefined; starters: string[]; onPick: (q: string) => void; showSuggestions: boolean }) {
  const p = usePalette();
  const [first, ...more] = starters;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 8 }}>
        <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>Ask about screenshots Shots has read.</Text>
        <Text style={[text.lead, { color: p.ink2 }]}>Each answer comes with its source screenshot. Open it to check the details.</Text>
      </View>
      {showSuggestions && first ? (
        <View style={{ marginTop: 16 }}>
          <PsstButton kind="filled" label={`Try: ${first}`} onPress={() => onPick(first)} />
          {more.map((q, i) => (
            <Pressable
              key={q}
              accessibilityRole="button"
              onPress={() => onPick(q)}
              style={({ pressed }) => ({ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: i === 0 ? 0 : 1, borderBottomWidth: i === more.length - 1 ? 1 : 0, borderColor: p.hair, backgroundColor: pressed ? p.fill : "transparent" })}
            >
              <Text style={[text.lead, { color: p.ink }]}>{q}</Text>
              <SymbolView name="chevron.right" size={13} weight="semibold" tintColor={p.ink3} fallback={<Text style={{ color: p.ink3 }}>›</Text>} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {showSuggestions && count !== undefined ? (
        <View style={{ flex: 1, justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end", gap: 12, paddingBottom: 8 }}>
          <KeeperLine id="murmur" style={{ flex: 1, paddingBottom: 12 }}>
            {count === 0 ? "Nothing to ask about yet." : `${count} ${count === 1 ? "screenshot" : "screenshots"} brought in. Answers come ${count === 1 ? "only from it" : "only from these"}.`}
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
