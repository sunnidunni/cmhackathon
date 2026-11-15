import { StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, radii, spacing, type } from "./theme";

export type BubbleTail = "bottom-left" | "bottom-right" | "left";

export function SpeechBubble({
  children,
  tail = "bottom-left",
  style,
}: {
  children: React.ReactNode;
  tail?: BubbleTail;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radii.md,
          borderWidth: 2,
          borderColor: colors.ink,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          alignSelf: "flex-start",
          maxWidth: 260,
          marginBottom: tail === "left" ? 0 : 10,
          marginLeft: tail === "left" ? 10 : 0,
        },
        style,
      ]}
    >
      {typeof children === "string" ? <Text style={type.bodyBold}>{children}</Text> : children}
      {tail === "left" ? (
        <Svg width={13} height={18} style={{ position: "absolute", left: -12, top: 10 }}>
          <Rect x={11} y={2} width={3} height={14} fill={colors.white} />
          <Path d="M12 1 L1 6 L12 15" fill={colors.white} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      ) : (
        <Svg
          width={18}
          height={13}
          style={[
            { position: "absolute", bottom: -12 },
            tail === "bottom-left" ? { left: 16 } : { right: 16, transform: [{ scaleX: -1 }] },
          ]}
        >
          <Rect x={2} y={0} width={14} height={3} fill={colors.white} />
          <Path d="M1 1 L5 12 L15 1" fill={colors.white} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}
