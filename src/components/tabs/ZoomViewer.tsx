import { Image } from "expo-image";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, type } from "@/design";
import { clampOffset, clampScale, nextTapScale } from "./zoom";

export function ZoomViewer({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const reset = () => {
    "worklet";
    scale.value = withTiming(1);
    savedScale.value = 1;
    x.value = withTiming(0);
    y.value = withTiming(0);
    savedX.value = 0;
    savedY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clampScale(savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) reset();
      else {
        x.value = withTiming(clampOffset(x.value, scale.value, width));
        y.value = withTiming(clampOffset(y.value, scale.value, height));
        savedX.value = clampOffset(x.value, scale.value, width);
        savedY.value = clampOffset(y.value, scale.value, height);
      }
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      x.value = clampOffset(savedX.value + e.translationX, scale.value, width);
      y.value = clampOffset(savedY.value + e.translationY, scale.value, height);
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (nextTapScale(scale.value) === 1) reset();
      else {
        scale.value = withTiming(nextTapScale(scale.value));
        savedScale.value = nextTapScale(scale.value);
      }
    });

  const gesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} onShow={() => reset()}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ flex: 1 }, style]}>
            <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" />
          </Animated.View>
        </GestureDetector>
        <SafeAreaView edges={["top"]} pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: spacing.xl }}
          >
            <Text style={[type.heading, { color: colors.white }]}>Close</Text>
          </Pressable>
        </SafeAreaView>
        <View pointerEvents="none" style={{ position: "absolute", bottom: spacing.xl, left: 0, right: 0, alignItems: "center" }}>
          <Text style={[type.caption, { color: colors.inkFaint }]}>Pinch to zoom, double tap to jump in</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
