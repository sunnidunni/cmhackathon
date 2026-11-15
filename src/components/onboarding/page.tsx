import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Keeper, KEEPER_IDS, text, usePalette } from "./kit";

export function Page({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.paper, paddingHorizontal: 16, paddingBottom: 8 }}>{children}</SafeAreaView>;
}

export function Headline({ children, large }: { children: React.ReactNode; large?: boolean }) {
  const p = usePalette();
  return (
    <Text accessibilityRole="header" style={[large ? text.largeTitle : text.headline, { color: p.ink }]}>
      {children}
    </Text>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <Text style={[text.lead, { color: p.ink2 }]}>{children}</Text>;
}

export function Footnote({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{children}</Text>;
}

export function Tick() {
  const p = usePalette();
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M4 10.5 L8.2 14.5 L16 5.5" stroke={p.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// The four keepers standing on one ground line.
export function KeeperRow({ muted, size }: { muted?: boolean; size: number }) {
  const p = usePalette();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 4 }}>
        {KEEPER_IDS.map((id) => (
          <Keeper key={id} id={id} size={size} muted={muted} />
        ))}
      </View>
      <View style={{ height: 2, backgroundColor: p.ink, marginTop: -size * 0.075 }} />
    </View>
  );
}
