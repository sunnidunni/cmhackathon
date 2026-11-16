import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, TextInput } from "react-native";
import { text, usePalette } from "@/design/psst";

export function Composer({ value, onChange, onSend, busy }: { value: string; onChange: (v: string) => void; onSend: () => void; busy: boolean }) {
  const p = usePalette();
  const ready = value.trim().length > 0 && !busy;
  const glass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  return (
    <GlassView
      glassEffectStyle="regular"
      isInteractive
      style={{ marginHorizontal: 16, marginBottom: 8, minHeight: 52, borderRadius: 26, flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 6, gap: 8, backgroundColor: glass ? undefined : p.white, borderWidth: glass ? 0 : 1, borderColor: p.hair }}
    >
      <TextInput
        style={[text.lead, { flex: 1, color: p.ink, paddingVertical: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder="Ask about a screenshot"
        placeholderTextColor={p.ink2}
        accessibilityLabel="Ask about a screenshot"
        returnKeyType="send"
        onSubmitEditing={onSend}
        submitBehavior="submit"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!ready}
          onPress={onSend}
          hitSlop={2}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: p.ink, alignItems: "center", justifyContent: "center", opacity: ready ? (pressed ? 0.8 : 1) : 0.4 })}
        >
          <SymbolView name="arrow.up" size={18} tintColor={p.paper} fallback={<Text style={{ color: p.paper, fontWeight: "700" }}>↑</Text>} />
        </Pressable>
      ) : null}
    </GlassView>
  );
}
