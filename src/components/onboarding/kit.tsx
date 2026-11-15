import { Pressable, Text, View, useColorScheme, type TextStyle } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

// Local stand-in for `@/design/psst` until the kit lands. Every onboarding file imports from here,
// so switching to the kit is one change in this file.

export type KeeperId = "tock" | "murmur" | "penny" | "mote";
export const KEEPER_IDS: KeeperId[] = ["tock", "murmur", "penny", "mote"];

const light = {
  paper: "#FBFAF7", white: "#FFFFFF", ink: "#211D2B", ink2: "rgba(33,29,43,0.68)", ink3: "rgba(33,29,43,0.42)",
  hair: "rgba(33,29,43,0.13)", hair2: "rgba(33,29,43,0.28)", fill: "rgba(33,29,43,0.05)", fill2: "rgba(33,29,43,0.09)",
  kl: "#211D2B", cut: "#FFFFFF", danger: "#A3162B",
};
const dark: typeof light = {
  paper: "#17151D", white: "#211E29", ink: "#F2EFE9", ink2: "rgba(242,239,233,0.68)", ink3: "rgba(242,239,233,0.42)",
  hair: "rgba(242,239,233,0.13)", hair2: "rgba(242,239,233,0.28)", fill: "rgba(242,239,233,0.06)", fill2: "rgba(242,239,233,0.10)",
  kl: "#211D2B", cut: "#F2EFE9", danger: "#FF8A9A",
};
export function usePalette() {
  return useColorScheme() === "dark" ? dark : light;
}

export const KEEPERS = {
  tock: { name: "Tock", main: "#F6B23C", tint: "#FDF0D8", deep: "#704905", tintDark: "#443423", deepDark: "#F8BF5D" },
  murmur: { name: "Murmur", main: "#F58CA5", tint: "#FDE8ED", deep: "#8E1F3D", tintDark: "#432D38", deepDark: "#F8B0C1" },
  penny: { name: "Penny Pocket", main: "#63C598", tint: "#E0F3EA", deep: "#215940", tintDark: "#263836", deepDark: "#8CD4B3" },
  mote: { name: "Mote", main: "#9FA8F7", tint: "#ECEEFD", deep: "#2C3794", tintDark: "#323249", deepDark: "#BBC1F9" },
} as const;
const MUTED = { main: "#D6D4DB", tint: "#F1F0F3", deep: "#4A4653", tintDark: "#3D3B43", deepDark: "#D6D4DB" };

export function useKeeperColors(id: KeeperId | "muted") {
  const k = id === "muted" ? MUTED : KEEPERS[id];
  const isDark = useColorScheme() === "dark";
  return { main: k.main, tint: isDark ? k.tintDark : k.tint, deep: isDark ? k.deepDark : k.deep };
}

export const fonts = {
  display: "Fraunces", ui: "Figtree", uiBold: "Figtree", voice: "Shantell Sans",
} as const;
export const text: Record<"largeTitle" | "headline" | "lead" | "body" | "bodyBold" | "caption" | "voice", TextStyle> = {
  largeTitle: { fontFamily: fonts.display, fontSize: 38, lineHeight: 41, fontWeight: "700", letterSpacing: -0.76 },
  headline: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, fontWeight: "700", letterSpacing: -0.6 },
  lead: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22, fontWeight: "500" },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, fontWeight: "500" },
  bodyBold: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 22, fontWeight: "700" },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  voice: { fontFamily: fonts.voice, fontSize: 16, lineHeight: 21, fontWeight: "500" },
};

export function Keeper({ id, size = 96, muted = false }: { id: KeeperId; size?: number; muted?: boolean; mood?: "rest" | "react" | "anxious" }) {
  const k = KEEPERS[id];
  const fill = muted ? MUTED.main : k.main;
  const line = "#211D2B";
  const eyes = (
    <>
      <Circle cx={49} cy={66} r={4} fill={line} />
      <Circle cx={71} cy={66} r={4} fill={line} />
      <Path d="M52 78 Q60 83 68 78" stroke={line} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {id === "murmur" ? (
        <>
          <Circle cx={36} cy={42} r={14} fill={fill} stroke={line} strokeWidth={3} />
          <Circle cx={84} cy={42} r={14} fill={fill} stroke={line} strokeWidth={3} />
          <Path d="M30 108 V66 C30 44 44 38 60 38 C76 38 90 44 90 66 V108 Z" fill={fill} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          {eyes}
          <Rect x={72} y={74} width={9} height={22} rx={4.5} fill={fill} stroke={line} strokeWidth={2.5} />
        </>
      ) : id === "tock" ? (
        <>
          <Circle cx={36} cy={30} r={11} fill={fill} stroke={line} strokeWidth={3} />
          <Circle cx={84} cy={30} r={11} fill={fill} stroke={line} strokeWidth={3} />
          <Rect x={24} y={36} width={72} height={72} rx={30} fill={fill} stroke={line} strokeWidth={3} />
          {eyes}
        </>
      ) : id === "penny" ? (
        <>
          <Path d="M44 34 L60 22 L76 34 Z" fill={fill} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={60} cy={78} rx={40} ry={30} fill={fill} stroke={line} strokeWidth={3} />
          {eyes}
        </>
      ) : (
        <>
          <Path d="M60 44 V24 M60 8 L63 18 L73 21 L63 24 L60 34 L57 24 L47 21 L57 18 Z" fill={fill} stroke={line} strokeWidth={2.5} strokeLinejoin="round" />
          <Circle cx={60} cy={78} r={30} fill={fill} stroke={line} strokeWidth={3} />
          {eyes}
        </>
      )}
      <Path d="M8 109.5 H112" stroke="transparent" />
    </Svg>
  );
}

export function KeeperFace({ id, size = 40 }: { id: KeeperId; size?: number }) {
  const p = usePalette();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: KEEPERS[id].main, borderWidth: 1, borderColor: p.hair2, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx={15} cy={19} r={2.4} fill="#211D2B" />
        <Circle cx={25} cy={19} r={2.4} fill="#211D2B" />
        <Path d="M16 25 Q20 28 24 25" stroke="#211D2B" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function KeeperLine({ id, children }: { id: KeeperId; children: string }) {
  const c = useKeeperColors(id);
  return <Text style={[text.voice, { color: c.deep }]}>{children}</Text>;
}

export function PsstButton({ kind = "filled", label, onPress, disabled }: { kind?: "filled" | "outline" | "text"; label: string; onPress: () => void; disabled?: boolean }) {
  const p = usePalette();
  const filled = kind === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", alignSelf: "stretch",
        backgroundColor: filled ? (pressed ? p.ink2 : p.ink) : "transparent",
        borderWidth: kind === "outline" ? 1.5 : 0, borderColor: p.ink,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Text style={[text.bodyBold, { color: filled ? p.paper : p.ink, textDecorationLine: kind === "text" ? "underline" : "none" }]}>{label}</Text>
    </Pressable>
  );
}

export function SoftCard({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <View style={{ backgroundColor: p.fill, borderRadius: 16, padding: 16 }}>{children}</View>;
}

export function Skeleton({ w, h }: { w: number | `${number}%`; h: number }) {
  const p = usePalette();
  return <View style={{ width: w, height: h, borderRadius: 8, backgroundColor: p.fill2 }} />;
}
