import { Pressable, ScrollView, Text } from "react-native";
import { text, usePalette } from "@/design/psst";
import type { Suggestion } from "./suggestions";

export function SuggestionChips({ items, onPick }: { items: Suggestion[]; onPick: (q: string) => void }) {
  const p = usePalette();
  if (items.length === 0) return null;
  return (
    <ScrollView style={{ flexGrow: 0, flexShrink: 0 }} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
      {items.map((c, i) => (
        <Pressable
          key={c.question}
          accessibilityRole="button"
          accessibilityLabel={`Ask: ${c.question}`}
          onPress={() => onPick(c.question)}
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: 14,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: i === 0 ? p.ink : p.hair,
            backgroundColor: i === 0 ? p.ink : p.paper,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={[text.lead, { color: i === 0 ? p.paper : p.ink }]}>
            {c.question}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
