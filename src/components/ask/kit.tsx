import { Image } from "expo-image";
import { Platform, Pressable, Text, useColorScheme, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

// Local stand-in for `@/design/psst` (ticket KIT). Same names and props as the kit contract, so the
// swap is changing this one file's exports to `export * from "@/design/psst"`.

export type KeeperId = "tock" | "murmur" | "penny" | "mote";

const LIGHT = { paper: "#FBFAF7", white: "#FFFFFF", ink: "#211D2B", ink2: "rgba(33,29,43,0.68)", ink3: "rgba(33,29,43,0.42)", hair: "rgba(33,29,43,0.13)", hair2: "rgba(33,29,43,0.28)", fill: "rgba(33,29,43,0.05)", fill2: "rgba(33,29,43,0.09)", kl: "#211D2B", cut: "#FFFFFF", danger: "#A3162B" };
const DARK = { paper: "#17151D", white: "#211E29", ink: "#F2EFE9", ink2: "rgba(242,239,233,0.68)", ink3: "rgba(242,239,233,0.42)", hair: "rgba(242,239,233,0.13)", hair2: "rgba(242,239,233,0.28)", fill: "rgba(242,239,233,0.06)", fill2: "rgba(242,239,233,0.10)", kl: "#211D2B", cut: "#F2EFE9", danger: "#FF8A9A" };

export function usePalette() {
  return useColorScheme() === "dark" ? DARK : LIGHT;
}

export const KEEPERS = {
  tock: { id: "tock", name: "Tock", main: "#F6B23C", tint: "#FDF0D8", deep: "#704905", tintDark: "#443423", deepDark: "#F8BF5D" },
  murmur: { id: "murmur", name: "Murmur", main: "#F58CA5", tint: "#FDE8ED", deep: "#8E1F3D", tintDark: "#432D38", deepDark: "#F8B0C1" },
  penny: { id: "penny", name: "Penny Pocket", main: "#63C598", tint: "#E0F3EA", deep: "#215940", tintDark: "#263836", deepDark: "#8CD4B3" },
  mote: { id: "mote", name: "Mote", main: "#9FA8F7", tint: "#ECEEFD", deep: "#2C3794", tintDark: "#323249", deepDark: "#BBC1F9" },
} as const;

export function useKeeperColors(id: KeeperId) {
  const k = KEEPERS[id];
  return useColorScheme() === "dark" ? { main: k.main, tint: k.tintDark, deep: k.deepDark } : { main: k.main, tint: k.tint, deep: k.deep };
}

export const text = {
  headline: { fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontWeight: "700", fontSize: 25, lineHeight: 30 },
  largeTitle: { fontWeight: "700", fontSize: 30, lineHeight: 36 },
  headlineCard: { fontWeight: "700", fontSize: 25, lineHeight: 29 },
  lead: { fontWeight: "500", fontSize: 16, lineHeight: 22 },
  body: { fontWeight: "500", fontSize: 15, lineHeight: 21 },
  bodyBold: { fontWeight: "700", fontSize: 16, lineHeight: 22 },
  caption: { fontWeight: "500", fontSize: 13, lineHeight: 18 },
  voice: { fontWeight: "500", fontSize: 16, lineHeight: 21 },
} satisfies Record<string, TextStyle>;

export function KeeperFace({ id, size = 40 }: { id: KeeperId; size?: number }) {
  const c = KEEPERS[id].main;
  const eye = { position: "absolute" as const, top: size * 0.4, width: size * 0.1, height: size * 0.1, borderRadius: size, backgroundColor: KEEPERS[id].deep };
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, borderWidth: 1, borderColor: "rgba(33,29,43,0.28)" }}>
      <View style={[eye, { left: size * 0.32 }]} />
      <View style={[eye, { right: size * 0.32 }]} />
    </View>
  );
}

export function KeeperLine({ id, children, style }: { id: KeeperId; children: string; style?: StyleProp<TextStyle> }) {
  const { deep } = useKeeperColors(id);
  return <Text style={[text.voice, { color: deep }, style]}>{children}</Text>;
}

export function PsstButton({ kind = "filled", keeper, label, onPress, disabled }: { kind?: "filled" | "outline" | "text"; keeper?: KeeperId; label: string; onPress?: () => void; disabled?: boolean }) {
  const p = usePalette();
  const main = keeper ? KEEPERS[keeper].main : null;
  const filled = kind === "filled";
  const base: ViewStyle = { minHeight: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 };
  const style: ViewStyle = filled
    ? { ...base, backgroundColor: main ?? p.ink, borderWidth: main ? 1.5 : 0, borderColor: "#211D2B" }
    : kind === "outline"
      ? { ...base, borderWidth: 1.5, borderColor: p.ink }
      : { ...base, minHeight: 44 };
  const color = filled ? (main ? "#211D2B" : p.paper) : p.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={onPress} disabled={disabled} style={({ pressed }) => [style, { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }]}>
      <Text style={[text.bodyBold, { color, textDecorationLine: kind === "text" ? "underline" : "none" }]}>{label}</Text>
    </Pressable>
  );
}

// Placeholder for the kit's die-cut sticker. uri null draws the title on a card.
export function ShotSticker({ uri, title, size = 56 }: { uri: string | null; title: string; size?: number }) {
  const p = usePalette();
  return (
    <View style={{ width: size, height: size * 1.5, borderRadius: 8, borderWidth: 3, borderColor: p.cut, backgroundColor: p.fill2, overflow: "hidden", justifyContent: "center" }}>
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <Text style={[text.caption, { color: p.ink2, textAlign: "center", padding: 4 }]} numberOfLines={4}>{title}</Text>}
    </View>
  );
}
