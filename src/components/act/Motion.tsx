import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { usePalette } from "@/design/psst";

// MOTION.md: enter with opacity and a 6pt rise over 200ms; Reduce Motion is a 150ms crossfade.
export function Fade({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: reduce ? 150 : 200, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  }, [progress, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: reduce ? 0 : (1 - progress.value) * 6 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Dot({ index, still }: { index: number; still: boolean }) {
  const p = usePalette();
  const o = useSharedValue(0.35);
  useEffect(() => {
    if (still) return;
    o.value = withDelay(index * 160, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.35, { duration: 400 })), -1));
  }, [index, o, still]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.ink2 }, style]} />;
}

export function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <View accessibilityLabel="Typing" style={{ flexDirection: "row", gap: 6, alignItems: "center", height: 20 }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} still={reduce} />
      ))}
    </View>
  );
}
