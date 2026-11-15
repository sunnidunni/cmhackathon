import { router } from "expo-router";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { tabAfterSwipe } from "./swipe";

// Horizontal drags switch tabs. Vertical movement fails this gesture, so scrolling keeps working.
export function SwipeTabs({ name, children }: { name: string; children: React.ReactNode }) {
  const onSwipeEnd = (dx: number, vx: number) => {
    const next = tabAfterSwipe(name, dx, vx);
    if (next) router.navigate(`/${next}` as never);
  };
  const gesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      runOnJS(onSwipeEnd)(e.translationX, e.velocityX);
    });
  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }}>{children}</View>
    </GestureDetector>
  );
}
