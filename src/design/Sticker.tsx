import { StyleProp, View, ViewStyle } from "react-native";
import { colors, radii, stickerShadow } from "./theme";

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
    <View
      style={[
        {
          backgroundColor: colors.white,
          padding: border,
          borderRadius: radius,
          borderWidth: 1.5,
          borderColor: colors.ink,
          boxShadow: stickerShadow,
          transform: [{ rotate: `${tilt}deg` }],
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <View style={{ borderRadius: Math.max(radius - border, 4), overflow: "hidden" }}>{children}</View>
    </View>
  );
}
