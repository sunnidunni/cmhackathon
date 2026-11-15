import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function LoadingView({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function MessageView({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.muted}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonDim]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  muted: { fontSize: 15, color: "#666", textAlign: "center" },
  button: {
    backgroundColor: "#3D5AFE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  buttonDim: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 17, fontWeight: "600" },
});
