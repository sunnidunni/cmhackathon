import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

// Opacity plus a 12pt rise over 300ms on the enter curve. Reduce Motion: 150ms crossfade, no rise.
export function Enter({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: reduced ? 150 : 300, easing: reduced ? Easing.linear : Easing.bezier(0.16, 1, 0.3, 1) });
  }, [t, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: t.value, transform: reduced ? [] : [{ translateY: (1 - t.value) * 12 }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
