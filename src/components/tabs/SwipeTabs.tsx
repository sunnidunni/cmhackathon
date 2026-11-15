import { router } from "expo-router";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { tabAfterSwipe } from "./swipe";

// Horizontal drags switch tabs. Vertical movement fails this gesture, so scrolling keeps working.
export function SwipeTabs({ name, children }: { name: string; children: React.ReactNode }) {
  const go = (tab: string) => router.navigate(`/${tab}` as never);
  const gesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      const next = tabAfterSwipe(name, e.translationX, e.velocityX);
      if (next) runOnJS(go)(next);
    });
  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }}>{children}</View>
    </GestureDetector>
  );
}
