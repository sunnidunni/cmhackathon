import { useEffect, useState } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

const enter = Easing.bezier(0.16, 1, 0.3, 1);

// Opacity plus a 12pt rise over 300ms on the enter curve. Reduce Motion: 150ms crossfade, no rise.
export function Enter({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => t.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: reduced ? 150 : 300, easing: reduced ? Easing.linear : enter, useNativeDriver: true }).start();
  }, [t, reduced]);
  return (
    <Animated.View style={[style, { opacity: t, transform: reduced ? [] : [{ translateY: rise }] }]}>{children}</Animated.View>
  );
}
