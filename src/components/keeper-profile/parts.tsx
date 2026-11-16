import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { KeeperAvatar } from "@/design/keepers-v2";
import { fonts, KEEPER_IDS, KEEPERS, KeeperLine, SoftCard, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";

export function SpeechBubble({ id, line }: { id: KeeperId; line: string }) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const { main } = useKeeperColors(id);
  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.duration(220)} style={{ alignItems: "center" }}>
      <View style={{ width: 14, height: 14, marginBottom: -8, transform: [{ rotate: "45deg" }], backgroundColor: pal.white, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: main }} />
      <View style={{ backgroundColor: pal.white, borderRadius: 18, borderWidth: 1.5, borderColor: main, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 300 }}>
        <KeeperLine id={id} style={{ textAlign: "center" }}>
          {line}
        </KeeperLine>
      </View>
    </Animated.View>
  );
}

function Bullet({ symbol, color }: { symbol: SFSymbol; color: string }) {
  return (
    <SymbolView
      name={symbol}
      size={18}
      weight="semibold"
      tintColor={color}
      fallback={<View style={{ width: 8, height: 8, borderRadius: 4, margin: 5, backgroundColor: color }} />}
    />
  );
}

export function ListCard({ title, items, symbol, color }: { title: string; items: string[]; symbol: SFSymbol; color: string }) {
  const pal = usePalette();
  return (
    <SoftCard style={{ gap: 12 }}>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.8} style={[text.bodyBold, { color: pal.ink }]}>
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <View style={{ paddingTop: 1 }}>
            <Bullet symbol={symbol} color={color} />
          </View>
          <Text maxFontSizeMultiplier={2.2} style={[text.body, { color: pal.ink2, flex: 1 }]}>
            {item}
          </Text>
        </View>
      ))}
    </SoftCard>
  );
}

function Chip({ id }: { id: KeeperId }) {
  const pal = usePalette();
  const { tint, main } = useKeeperColors(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Meet ${KEEPERS[id].name}`}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        router.setParams({ id });
      }}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: pressed ? main : pal.hair,
        backgroundColor: pressed ? tint : pal.white,
      })}
    >
      <KeeperAvatar name={id} size={30} />
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 15, color: pal.ink }}>
        {KEEPERS[id].name}
      </Text>
    </Pressable>
  );
}

export function KeeperChips({ current }: { current?: KeeperId }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {KEEPER_IDS.filter((k) => k !== current).map((k) => (
        <Chip key={k} id={k} />
      ))}
    </View>
  );
}
