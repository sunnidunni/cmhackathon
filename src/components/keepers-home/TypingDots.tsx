import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from "react-native-reanimated";
import { KEEPERS, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";

function Dot({ v, color }: { v: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.65, transform: [{ translateY: -v.value * 3 }] }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, style]} />;
}

export function TypingDots({ keeper }: { keeper: KeeperId }) {
  const pal = usePalette();
  const { tint, deep } = useKeeperColors(keeper);
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const pulse = (delay: number) => withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 280 }), withTiming(0, { duration: 280 })), -1, false));
    a.set(pulse(0));
    b.set(pulse(140));
    c.set(pulse(280));
  }, [a, b, c]);

  return (
    <View
      accessible
      accessibilityLabel={`${KEEPERS[keeper].name} is typing`}
      style={{ flexDirection: "row", gap: 5, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18, borderTopLeftRadius: 6, backgroundColor: tint, borderWidth: 1, borderColor: pal.hair }}
    >
      <Dot v={a} color={deep} />
      <Dot v={b} color={deep} />
      <Dot v={c} color={deep} />
    </View>
  );
}
