import { router, usePathname } from "expo-router";
import { useTabSlot } from "expo-router/ui";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { pageAfterDrag, TAB_ORDER } from "./swipe";

const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };

// The page follows the path only while a tab is showing, so a pushed screen on top never moves it.
// The four tab screens sit side by side and stay mounted. A drag moves them with the finger and
// the neighbour slides in; on release they spring to the nearer page. A tab tap slides the same way.
export function TabPager() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const found = TAB_ORDER.findIndex((t) => pathname === `/${t}`);
  const [index, setIndex] = useState(Math.max(0, found));
  if (found >= 0 && found !== index) setIndex(found);
  const slot = useTabSlot({
    detachInactiveScreens: false,
    style: { flex: 1 },
    renderFn: (descriptor, { index: i }) => (
      <View key={descriptor.route.key} style={{ position: "absolute", top: 0, bottom: 0, left: i * width, width }}>
        {descriptor.render()}
      </View>
    ),
  });
  const x = useSharedValue(-index * width);
  const base = useSharedValue(-index * width);
  const minX = -(TAB_ORDER.length - 1) * width;

  useEffect(() => {
    base.value = -index * width;
    x.value = withSpring(-index * width, SPRING);
  }, [index, width, base, x]);

  const onDragEnd = (dx: number, vx: number) => {
    const next = pageAfterDrag(index, dx, vx, width, TAB_ORDER.length);
    if (next === index) x.value = withSpring(-index * width, SPRING);
    else router.navigate(`/${TAB_ORDER[next]}` as never);
  };

  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const v = base.value + e.translationX;
      x.value = v > 0 ? v / 3 : v < minX ? minX + (v - minX) / 3 : v;
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(e.translationX, e.velocityX);
    });

  const track = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View style={[{ flex: 1 }, track]}>{slot}</Animated.View>
      </View>
    </GestureDetector>
  );
}
