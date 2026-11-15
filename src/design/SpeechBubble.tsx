import { StyleProp, Text, ViewStyle } from "react-native";
import { SketchFrame } from "./SketchFrame";
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
    <SketchFrame
      fill={colors.white}
      radius={radii.md}
      strokeWidth={2.2}
      tail={tail}
      seed={typeof children === "string" ? children : tail}
      style={[
        {
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
      {typeof children === "string" ? <Text style={type.say}>{children}</Text> : children}
    </SketchFrame>
  );
}
