import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { usePalette } from "@/design/psst";

function Segment({ state }: { state: "done" | "active" | "todo" }) {
  const p = usePalette();
  const reduce = useReducedMotion();
  const fill = useSharedValue(state === "done" ? 1 : 0);
  useEffect(() => {
    const target = state === "todo" ? 0 : 1;
    fill.value = reduce || state !== "active" ? target : withTiming(target, { duration: 420 });
  }, [state, reduce, fill]);
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  return (
    <View style={[styles.track, { backgroundColor: p.hair }]}>
      <Animated.View style={[styles.fill, { backgroundColor: p.ink }, bar]} />
    </View>
  );
}

export function RecapProgress({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`Card ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <Segment key={i} state={i < index ? "done" : i === index ? "active" : "todo"} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, flex: 1 },
  track: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  fill: { height: 3, borderRadius: 2 },
});
