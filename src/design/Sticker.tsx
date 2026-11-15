import { StyleProp, View, ViewStyle } from "react-native";
import { SketchFrame } from "./SketchFrame";
import { colors, radii } from "./theme";

export function Sticker({
  children,
  tilt = 0,
  radius = radii.lg,
  border = 6,
  style,
}: {
  children: React.ReactNode;
  tilt?: number;
  radius?: number;
  border?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SketchFrame
      fill={colors.white}
      radius={radius}
      strokeWidth={1.9}
      shadow={{ color: colors.ink, opacity: 0.15, dy: 3 }}
      seed={tilt}
      style={[{ padding: border, transform: [{ rotate: `${tilt}deg` }], alignSelf: "flex-start" }, style]}
    >
      <View style={{ borderRadius: Math.max(radius - border, 4), overflow: "hidden" }}>{children}</View>
    </SketchFrame>
  );
}
