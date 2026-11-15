import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Character, colors, radii, RoomKey, ScreenHeader, SketchFrame, SpeechBubble, spacing, type, UNSORTED_ROOM } from "@/design";

export const tzOffset = () => new Date().getTimezoneOffset();
export const designRoom = (room: string): RoomKey => (room === "unsorted" ? UNSORTED_ROOM : (room as RoomKey));

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.paper }}>{children}</SafeAreaView>;
}

export function SettingsButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => router.push("/settings")}
      style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm }}
    >
      <Text style={type.label}>Settings</Text>
    </Pressable>
  );
}

export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <ScreenHeader title={title} subtitle={subtitle} right={<SettingsButton />} />;
}

export function Loading({ label, room }: { label: string; room?: RoomKey }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl }}>
      <Character room={room} size={72} />
      <ActivityIndicator color={colors.ink} />
      <Text style={[type.body, { color: colors.inkSoft, textAlign: "center" }]}>{label}</Text>
    </View>
  );
}

export function Notice({
  title,
  body,
  room,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  room?: RoomKey;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", gap: spacing.md, padding: spacing.xl }}>
      <Character room={room} size={80} />
      <Text style={[type.title, { textAlign: "center" }]}>{title}</Text>
      {body ? <Text style={[type.body, { color: colors.inkSoft, textAlign: "center" }]}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <SketchFrame fill={colors.white} radius={radii.lg} seed="info" style={{ padding: spacing.lg, gap: spacing.md }}>
      {children}
    </SketchFrame>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3500);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const node = message ? (
    <View pointerEvents="none" style={{ position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.xl }}>
      <SketchFrame fill={colors.ink} stroke={colors.ink} radius={radii.md} seed={message} style={{ padding: spacing.md }}>
        <Text style={[type.body, { color: colors.white, textAlign: "center" }]}>{message}</Text>
      </SketchFrame>
    </View>
  ) : null;
  return { show, node };
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(43,29,20,0.4)" }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: colors.paper, padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}>
        <Text style={type.title}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

export { SpeechBubble };
