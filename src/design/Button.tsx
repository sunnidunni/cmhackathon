import { Pressable, Text } from "react-native";
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
        backgroundColor: variant === "primary" ? colors.sun : colors.white,
        borderColor: colors.ink,
        borderWidth: 2,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        alignItems: "center",
        alignSelf: "stretch",
        opacity: disabled ? 0.5 : 1,
        boxShadow: pressed ? "0px 1px 0px #2B1D14" : "0px 4px 0px #2B1D14",
        transform: [{ translateY: pressed ? 3 : 0 }],
      })}
    >
      <Text style={[type.heading, { fontSize: 17 }]}>{label}</Text>
    </Pressable>
  );
}
