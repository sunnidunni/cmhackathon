import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";
import { text, usePalette } from "@/design/psst";

// A capsule toast with an optional Undo. Real Liquid Glass on iOS 26 when the API exists and Reduce Transparency is off;
// otherwise an opaque ink capsule (white-on-ink passes contrast). The message is announced to VoiceOver.
export function UndoToast({ message, onUndo }: { message: string; onUndo?: () => void }) {
  const p = usePalette();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
    if (Platform.OS !== "ios") return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency, () => undefined);
  }, [message]);

  const glass = Platform.OS === "ios" && !reduceTransparency && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const color = glass ? p.ink : p.paper;
  const row = (
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 56, paddingHorizontal: 20, gap: 12 }}>
      <Text style={[text.body, { color, flex: 1 }]}>{message}</Text>
      {onUndo ? (
        <Pressable accessibilityRole="button" onPress={onUndo} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={[text.bodyBold, { color, textDecorationLine: "underline" }]}>Undo</Text>
        </Pressable>
      ) : null}
    </View>
  );
  return glass ? (
    <GlassView style={{ borderRadius: 28 }}>{row}</GlassView>
  ) : (
    <View style={{ borderRadius: 28, backgroundColor: p.ink }}>{row}</View>
  );
}
