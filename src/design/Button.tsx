import { Pressable, Text } from "react-native";
import { SketchFrame } from "./SketchFrame";
import { colors, radii, spacing, type } from "./theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        alignSelf: "stretch",
        opacity: disabled ? 0.5 : 1,
        transform: [{ translateY: pressed ? 3 : 0 }],
      })}
    >
      {({ pressed }) => (
        <SketchFrame
          fill={variant === "primary" ? colors.sun : colors.white}
          radius={radii.pill}
          strokeWidth={2.4}
          seed={label}
          shadow={{ color: colors.ink, opacity: 1, dy: pressed ? 1 : 4 }}
          style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: "center" }}
        >
          <Text style={type.heading}>{label}</Text>
        </SketchFrame>
      )}
    </Pressable>
  );
}
