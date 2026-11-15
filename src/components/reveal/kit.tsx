// Local stand-in for @/design/psst until the KIT ticket lands. Same names and props; swap the import and delete this file.
import { Image } from "expo-image";
import { Pressable, Text, useColorScheme, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

export type KeeperId = "tock" | "murmur" | "penny" | "mote";

export const KEEPERS: Record<
  KeeperId,
  { id: KeeperId; name: string; room: string; main: string; tint: string; deep: string; tintDark: string; deepDark: string }
> = {
  tock: { id: "tock", name: "Tock", room: "deadlines", main: "#F6B23C", tint: "#FDF0D8", deep: "#704905", tintDark: "#443423", deepDark: "#F8BF5D" },
  murmur: { id: "murmur", name: "Murmur", room: "chats", main: "#F58CA5", tint: "#FDE8ED", deep: "#8E1F3D", tintDark: "#432D38", deepDark: "#F8B0C1" },
  penny: { id: "penny", name: "Penny Pocket", room: "money", main: "#63C598", tint: "#E0F3EA", deep: "#215940", tintDark: "#263836", deepDark: "#8CD4B3" },
  mote: { id: "mote", name: "Mote", room: "ideas", main: "#9FA8F7", tint: "#ECEEFD", deep: "#2C3794", tintDark: "#323249", deepDark: "#BBC1F9" },
};

export function usePalette() {
  const dark = useColorScheme() === "dark";
  return dark
    ? { paper: "#17151D", white: "#211E29", ink: "#F2EFE9", ink2: "rgba(242,239,233,0.68)", ink3: "rgba(242,239,233,0.42)", hair: "rgba(242,239,233,0.13)", hair2: "rgba(242,239,233,0.28)", fill: "rgba(242,239,233,0.06)", fill2: "rgba(242,239,233,0.10)", kl: "#211D2B", cut: "#F2EFE9", danger: "#FF8A9A" }
    : { paper: "#FBFAF7", white: "#FFFFFF", ink: "#211D2B", ink2: "rgba(33,29,43,0.68)", ink3: "rgba(33,29,43,0.42)", hair: "rgba(33,29,43,0.13)", hair2: "rgba(33,29,43,0.28)", fill: "rgba(33,29,43,0.05)", fill2: "rgba(33,29,43,0.09)", kl: "#211D2B", cut: "#FFFFFF", danger: "#A3162B" };
}

export function useKeeperColors(id: KeeperId) {
  const dark = useColorScheme() === "dark";
  const k = KEEPERS[id];
  return { main: k.main, tint: dark ? k.tintDark : k.tint, deep: dark ? k.deepDark : k.deep };
}

export const fonts = { display: "Fraunces", ui: "Figtree_500Medium", uiBold: "Figtree_700Bold", voice: "ShantellSans_500Medium" } as const;

export const text = {
  headline: { fontFamily: fonts.display, fontWeight: "700", fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  headlineCard: { fontFamily: fonts.display, fontWeight: "700", fontSize: 25, lineHeight: 29, letterSpacing: -0.5 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21 },
  bodyBold: { fontFamily: fonts.uiBold, fontWeight: "700", fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18 },
  voiceRow: { fontFamily: fonts.voice, fontSize: 14, lineHeight: 19 },
} as const;

export function KeeperFace({ id, size = 40 }: { id: KeeperId; size?: number }) {
  const k = KEEPERS[id];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill={k.main} stroke="rgba(33,29,43,0.28)" />
      <Circle cx={14} cy={18} r={2.4} fill="#211D2B" />
      <Circle cx={26} cy={18} r={2.4} fill="#211D2B" />
      <Rect x={16} y={25} width={8} height={2} rx={1} fill="#211D2B" />
    </Svg>
  );
}

export function Keeper({ id, size = 64 }: { id: KeeperId; size?: number; mood?: "rest" | "react" | "anxious" }) {
  return <KeeperFace id={id} size={size} />;
}

export function KeeperLine({ id, children }: { id: KeeperId; children: React.ReactNode }) {
  const { deep } = useKeeperColors(id);
  return <Text style={[text.voiceRow, { color: deep }]}>{children}</Text>;
}

export function Wash({ keeper, children, style }: { keeper: KeeperId; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { tint } = useKeeperColors(keeper);
  return <View style={[{ backgroundColor: tint, borderRadius: 16 }, style]}>{children}</View>;
}

export function Skeleton({ w, h, style }: { w: number | string; h: number; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[{ width: w as number, height: h, borderRadius: h / 2, backgroundColor: p.fill2 }, style]} />;
}

export function ShotSticker({ uri, title, size = 56 }: { uri: string | number | null; title: string; tilt?: number; size?: number }) {
  const p = usePalette();
  return (
    <View style={{ width: size, height: size * 1.15, borderRadius: 8, borderWidth: 3, borderColor: p.cut, backgroundColor: p.white, overflow: "hidden", justifyContent: "center", padding: 3, outlineWidth: 1, outlineColor: p.hair } as ViewStyle}>
      {uri ? <Image source={typeof uri === "number" ? uri : { uri }} style={{ flex: 1 }} contentFit="cover" /> : <Text numberOfLines={3} style={[text.caption, { fontSize: 9, lineHeight: 11, color: p.ink2 }]}>{title}</Text>}
    </View>
  );
}

export function PsstButton({ kind = "filled", keeper, label, onPress, disabled }: { kind?: "filled" | "outline" | "text"; keeper?: KeeperId; label: string; onPress?: () => void; disabled?: boolean }) {
  const p = usePalette();
  const bg = kind === "filled" ? (keeper ? KEEPERS[keeper].main : p.ink) : "transparent";
  const fg = kind === "filled" ? (keeper ? p.kl : p.paper) : p.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{ height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: bg, borderWidth: kind === "outline" ? 1.5 : 0, borderColor: p.hair2, opacity: disabled ? 0.5 : 1 }}
    >
      <Text style={[text.bodyBold, { color: fg, textDecorationLine: kind === "text" ? "underline" : "none" }]}>{label}</Text>
    </Pressable>
  );
}
