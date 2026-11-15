// Local stand-in for the KIT ticket's `@/design/psst` (same names and props as the contract).
// When KIT lands on ryan/build this file is replaced by `export * from "@/design/psst"`.
import { useColorScheme } from "react-native";
import { Image } from "expo-image";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { DEV_TOOLS } from "@/lib/dev-flags";

export type KeeperId = "tock" | "murmur" | "penny" | "mote";
export type RoomKey = "deadlines" | "chats" | "money" | "ideas";

export const FIXTURES = DEV_TOOLS;

export const KEEPERS: Record<KeeperId, { id: KeeperId; name: string; room: RoomKey; main: string; tint: string; deep: string; tintDark: string; deepDark: string }> = {
  tock: { id: "tock", name: "Tock", room: "deadlines", main: "#F6B23C", tint: "#FDF0D8", deep: "#704905", tintDark: "#443423", deepDark: "#F8BF5D" },
  murmur: { id: "murmur", name: "Murmur", room: "chats", main: "#F58CA5", tint: "#FDE8ED", deep: "#8E1F3D", tintDark: "#432D38", deepDark: "#F8B0C1" },
  penny: { id: "penny", name: "Penny", room: "money", main: "#63C598", tint: "#E0F3EA", deep: "#215940", tintDark: "#263836", deepDark: "#8CD4B3" },
  mote: { id: "mote", name: "Mote", room: "ideas", main: "#9FA8F7", tint: "#ECEEFD", deep: "#2C3794", tintDark: "#323249", deepDark: "#BBC1F9" },
};
export const keeperForRoom = (room: RoomKey): KeeperId => (Object.values(KEEPERS).find((k) => k.room === room)?.id ?? "mote");

const LIGHT = { paper: "#FBFAF7", white: "#FFFFFF", ink: "#211D2B", ink2: "rgba(33,29,43,0.68)", ink3: "rgba(33,29,43,0.42)", hair: "rgba(33,29,43,0.13)", hair2: "rgba(33,29,43,0.28)", fill: "rgba(33,29,43,0.05)", fill2: "rgba(33,29,43,0.09)", kl: "#211D2B", cut: "#FFFFFF", danger: "#A3162B" };
const DARK = { paper: "#17151D", white: "#211E29", ink: "#F2EFE9", ink2: "rgba(242,239,233,0.68)", ink3: "rgba(242,239,233,0.42)", hair: "rgba(242,239,233,0.13)", hair2: "rgba(242,239,233,0.28)", fill: "rgba(242,239,233,0.06)", fill2: "rgba(242,239,233,0.1)", kl: "#211D2B", cut: "#F2EFE9", danger: "#FF8A9A" };
export const usePalette = () => (useColorScheme() === "dark" ? DARK : LIGHT);
export function useKeeperColors(id: KeeperId) {
  const dark = useColorScheme() === "dark";
  const k = KEEPERS[id];
  return { main: k.main, tint: dark ? k.tintDark : k.tint, deep: dark ? k.deepDark : k.deep };
}

export const fonts = { display: "serif", ui: "System", uiBold: "System", voice: "System" };
export const text = {
  headline: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, fontWeight: "600" as const },
  headlineCard: { fontFamily: fonts.display, fontSize: 25, lineHeight: 29, letterSpacing: -0.5, fontWeight: "600" as const },
  largeTitle: { fontFamily: fonts.uiBold, fontSize: 30, lineHeight: 34, fontWeight: "700" as const },
  lead: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22, fontWeight: "500" as const },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, fontWeight: "500" as const },
  bodyBold: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 22, fontWeight: "700" as const },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  voice: { fontFamily: fonts.voice, fontSize: 16, lineHeight: 21, fontWeight: "500" as const },
  voiceRow: { fontFamily: fonts.voice, fontSize: 14, lineHeight: 19, fontWeight: "500" as const },
};

export function KeeperFace({ id, size = 40 }: { id: KeeperId; size?: number }) {
  const p = usePalette();
  const eye = { width: size * 0.12, height: size * 0.12, borderRadius: size, backgroundColor: p.kl };
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: KEEPERS[id].main, borderWidth: 1, borderColor: p.hair2, alignItems: "center", justifyContent: "center", gap: size * 0.1 }}>
      <View style={{ flexDirection: "row", gap: size * 0.22 }}>
        <View style={eye} />
        <View style={eye} />
      </View>
      <View style={{ width: size * 0.2, height: size * 0.08, borderBottomWidth: 2, borderRadius: size, borderColor: "#211D2B" }} />
    </View>
  );
}
export function Keeper({ id, size = 128 }: { id: KeeperId; size?: number; mood?: "rest" | "react" | "anxious" }) {
  return <KeeperFace id={id} size={size} />;
}

export function KeeperLine({ id, children }: { id: KeeperId; children: string }) {
  const c = useKeeperColors(id);
  return <Text style={[text.voice, { color: c.deep }]}>{children}</Text>;
}

export function PsstButton({ kind = "filled", keeper, label, onPress, disabled }: { kind?: "filled" | "outline" | "text"; keeper?: KeeperId; label: string; onPress: () => void; disabled?: boolean }) {
  const p = usePalette();
  const k = keeper ? KEEPERS[keeper] : null;
  const filled = kind === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: kind === "text" ? 44 : 50,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        backgroundColor: filled ? (k ? k.main : p.ink) : "transparent",
        borderWidth: filled ? (k ? 1.5 : 0) : kind === "outline" ? 1 : 0,
        borderColor: filled ? "#211D2B" : p.hair2,
        opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
      })}
    >
      <Text style={[text.bodyBold, { color: filled ? (k ? "#211D2B" : p.paper) : p.ink, textDecorationLine: kind === "text" ? "underline" : "none" }]}>{label}</Text>
    </Pressable>
  );
}

export function Wash({ keeper, children, style }: { keeper: KeeperId; children: React.ReactNode; style?: ViewStyle }) {
  const c = useKeeperColors(keeper);
  return <View style={[{ backgroundColor: c.tint, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}

export function SoftCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const p = usePalette();
  return <View style={[{ backgroundColor: p.fill, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}

export function Skeleton({ w, h, style }: { w: number | string; h: number; style?: ViewStyle }) {
  const p = usePalette();
  return <View style={[{ width: w as number, height: h, borderRadius: 8, backgroundColor: p.fill2 }, style]} />;
}

export function ShotSticker({ uri, title, tilt = 0, size = 96 }: { uri: string | null; title: string; tilt?: number; size?: number }) {
  const p = usePalette();
  return (
    <View style={{ transform: [{ rotate: `${tilt}deg` }], borderWidth: 3, borderColor: p.cut, borderRadius: 10, overflow: "hidden", width: size, height: size * 1.9 > 190 ? 190 : size * 1.9, backgroundColor: p.white }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel={title} />
      ) : (
        <View style={{ flex: 1, padding: 8, justifyContent: "center" }}>
          <Text style={[text.caption, { color: "#211D2B", fontWeight: "700" }]}>{title}</Text>
        </View>
      )}
    </View>
  );
}
