import { Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Keeper } from "@/design/keepers-v2";
import { text, usePalette } from "@/design/psst";

export function CaughtUp() {
  const pal = usePalette();
  const reduce = useReducedMotion();
  return (
    <Animated.View entering={reduce ? undefined : FadeIn.duration(400)} style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 32, gap: 10 }}>
      <Keeper name="mote" state="sleeping" size={140} />
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.8} style={[text.headlineCard, { color: pal.ink, textAlign: "center" }]}>
        All caught up.
      </Text>
      <View style={{ maxWidth: 280 }}>
        <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink2, textAlign: "center" }]}>
          The keepers will let you know when something new comes in.
        </Text>
      </View>
    </Animated.View>
  );
}
