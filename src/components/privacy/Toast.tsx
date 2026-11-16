import { useEffect } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { text, usePalette } from "@/design/psst";

export function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const t = setTimeout(onHide, 2800);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(260)}
      exiting={reduce ? undefined : FadeOut.duration(200)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: insets.bottom + 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: pal.ink,
      }}
    >
      <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.paper, textAlign: "center" }]}>
        {message}
      </Text>
    </Animated.View>
  );
}
