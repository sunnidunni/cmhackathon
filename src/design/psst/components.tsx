import { useEffect, type ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { fonts, text } from "./fonts";
import { KEEPERS, mix, useKeeperColors, usePalette, type KeeperId } from "./tokens";

type ButtonProps = {
  kind: "filled" | "outline" | "text";
  label: string;
  onPress?: () => void;
  keeper?: KeeperId;
  disabled?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PsstButton({ kind, label, onPress, keeper, disabled = false, danger = false, style }: ButtonProps) {
  const pal = usePalette();
  const colors = useKeeperColors(keeper ?? "tock");
  const keyed = kind === "filled" && keeper !== undefined;
  const font = { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 22, textAlign: "center" } as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        const shape = { minHeight: kind === "text" ? 44 : 50, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" } as const;
        if (kind === "text") return [shape, style];
        if (kind === "outline") return [shape, { borderWidth: 1.5, borderColor: pal.hair2, backgroundColor: pressed ? pal.fill : "transparent" }, style];
        if (disabled) return [shape, { backgroundColor: pal.fill2 }, style];
        if (keyed) return [shape, { borderWidth: 1.5, borderColor: pal.kl, backgroundColor: pressed ? mix(colors.main, pal.kl, 0.78) : colors.main }, style];
        return [shape, { backgroundColor: pressed ? mix(pal.ink, pal.paper, 0.82) : pal.ink }, style];
      }}
    >
      {({ pressed }) => {
        const color = disabled
          ? pal.ink3
          : danger
            ? pal.danger
            : kind === "filled"
              ? keyed
                ? pal.kl
                : pal.paper
              : kind === "text"
                ? pressed
                  ? pal.ink
                  : pal.ink2
                : pal.ink;
        return (
          <Text style={[font, { color }, kind === "text" && { textDecorationLine: "underline", textDecorationColor: pal.hair2 }]}>{label}</Text>
        );
      }}
    </Pressable>
  );
}

export function Wash({ keeper, children, style }: { keeper: KeeperId; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { tint } = useKeeperColors(keeper);
  return <View style={[{ backgroundColor: tint, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}

export function SoftCard({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const pal = usePalette();
  return <View style={[{ backgroundColor: pal.fill, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}

export function Skeleton({ w, h, style }: { w: number | `${number}%`; h: number; style?: StyleProp<ViewStyle> }) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(0.55, { duration: 900 }), -1, true);
  }, [reduce, pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View accessibilityLabel="Loading" style={[{ width: w, height: h, borderRadius: 8, backgroundColor: pal.fill2 }, animated, style]} />;
}

export function KeeperLine({ id, row = false, children, style }: { id: KeeperId; row?: boolean; children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { deep } = useKeeperColors(id);
  return (
    <Text accessibilityLabel={`${KEEPERS[id].name}: ${typeof children === "string" ? children : ""}`} style={[row ? text.voiceRow : text.voice, { color: deep }, style]}>
      {children}
    </Text>
  );
}
