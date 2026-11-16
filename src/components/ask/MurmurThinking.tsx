import { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Keeper, useKeeperColors, usePalette } from "@/design/psst";
import { easing } from "@/design/motion";

const STAGGER_MS = 120;
const HALF_MS = 300;
const RISE = 4;

function Dot({ index, color, still }: { index: number; color: string; still: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    y.set(withDelay(index * STAGGER_MS, withRepeat(withSequence(withTiming(-RISE, { duration: HALF_MS, easing: easing.out }), withTiming(0, { duration: HALF_MS, easing: easing.in })), -1)));
    return () => {
      cancelAnimation(y);
      y.set(0);
    };
  }, [index, still, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, style]} />;
}

// Murmur with three bouncing reply dots while Ask waits. Lives above the answer, never in it.
// The dots only run while this is mounted (the request is in flight); Reduce Motion draws them still.
export function MurmurThinking() {
  const p = usePalette();
  const c = useKeeperColors("murmur");
  const still = useReducedMotion();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
      <Keeper id="murmur" size={56} />
      <View style={{ flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, borderRadius: 16, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} color={c.deep} still={still} />
        ))}
      </View>
    </View>
  );
}
