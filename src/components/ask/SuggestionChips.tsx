import { Pressable, Text, View } from "react-native";
import { text, usePalette } from "@/design/psst";
import type { Suggestion } from "./chips";

export function SuggestionChips({ items, onPick }: { items: Suggestion[]; onPick: (q: string) => void }) {
  const p = usePalette();
  if (items.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
      {items.map((c) => (
        <Pressable
          key={c.screenshotId}
          accessibilityRole="button"
          accessibilityLabel={`Ask: ${c.question}`}
          onPress={() => onPick(c.question)}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: p.hair, backgroundColor: p.paper }}
        >
          <Text style={[text.lead, { color: p.ink }]}>{c.question}</Text>
        </Pressable>
      ))}
    </View>
  );
}
