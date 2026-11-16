import { Pressable, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from "react-native-reanimated";
import { fonts, text, usePalette } from "@/design/psst";

export function UndoToast({ label, bottom, onUndo }: { label: string; bottom: number; onUndo: () => void }) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(220)}
      exiting={reduce ? undefined : FadeOutDown.duration(180)}
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 18,
        paddingRight: 6,
        minHeight: 52,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: pal.ink,
        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
      }}
    >
      <Text maxFontSizeMultiplier={1.6} style={[text.body, { flex: 1, color: pal.paper }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Undo"
        onPress={onUndo}
        hitSlop={6}
        style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
      >
        <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 16, color: pal.paper, textDecorationLine: "underline" }}>
          Undo
        </Text>
      </Pressable>
    </Animated.View>
  );
}
