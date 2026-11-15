import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

// DESIGN 2.5: a new focus enters with opacity and a 12pt rise over 300ms; Reduce Motion is a 150ms crossfade.
export function Rise({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: reduce ? 150 : 300, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  }, [progress, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduce ? 0 : (1 - progress.value) * 12 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
