import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { KeeperAvatar } from "@/design/keepers-v2";
import { fonts, KEEPERS, KeeperLine, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";
import { EMPTY, FILTERS, type ActivityFilter, type ActivityItem, type ActivityKind } from "./data";

const KIND_SYMBOL: Record<ActivityKind, "tray.and.arrow.down.fill" | "bell.fill" | "bubble.left.fill" | "sparkles"> = {
  filed: "tray.and.arrow.down.fill",
  reminder: "bell.fill",
  answer: "bubble.left.fill",
  action: "sparkles",
};

function useMotion() {
  const reduce = useReducedMotion();
  return reduce
    ? { entering: undefined, exiting: undefined, layout: undefined }
    : { entering: FadeIn.duration(220), exiting: FadeOut.duration(140), layout: LinearTransition.springify().damping(22).stiffness(220) };
}

function Pill({ label, selected, keeper, onPress }: { label: string; selected: boolean; keeper?: KeeperId; onPress: () => void }) {
  const pal = usePalette();
  const colors = useKeeperColors(keeper ?? "tock");
  const bg = selected ? (keeper ? colors.main : pal.ink) : pal.fill;
  const fg = selected ? (keeper ? pal.kl : pal.paper) : pal.ink2;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: selected ? "transparent" : pal.hair,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 14, lineHeight: 18, color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterPills({ value, onChange }: { value: ActivityFilter; onChange: (f: ActivityFilter) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
    >
      {FILTERS.map((f) => (
        <Pill
          key={f.key}
          label={f.label}
          keeper={f.keeper}
          selected={value === f.key}
          onPress={() => {
            if (value === f.key) return;
            Haptics.selectionAsync().catch(() => undefined);
            onChange(f.key);
          }}
        />
      ))}
    </ScrollView>
  );
}

function ResultChip({ item }: { item: ActivityItem }) {
  const colors = useKeeperColors(item.keeper);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.tint }}>
      <SymbolView
        name={KIND_SYMBOL[item.kind]}
        size={11}
        tintColor={colors.deep}
        fallback={<View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.deep }} />}
      />
      <Text maxFontSizeMultiplier={1.8} style={{ fontFamily: fonts.uiBold, fontSize: 12, lineHeight: 16, color: colors.deep }}>
        {item.result}
      </Text>
    </View>
  );
}

export function ActivityRow({ item, last }: { item: ActivityItem; last: boolean }) {
  const pal = usePalette();
  const motion = useMotion();
  return (
    <Animated.View
      {...motion}
      accessible
      accessibilityLabel={`${item.time}, ${KEEPERS[item.keeper].name}: ${item.text}. ${item.result}.`}
      style={{ flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: pal.hair }}
    >
      <KeeperAvatar name={item.keeper} size={36} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text numberOfLines={1} maxFontSizeMultiplier={2} style={[text.body, { flex: 1, color: pal.ink }]}>
            {item.text}
          </Text>
          <Text maxFontSizeMultiplier={1.6} style={[text.caption, { color: pal.ink3, fontVariant: ["tabular-nums"] }]}>
            {item.time}
          </Text>
        </View>
        <ResultChip item={item} />
      </View>
    </Animated.View>
  );
}

export function DaySection({ label, items }: { label: string; items: ActivityItem[] }) {
  const pal = usePalette();
  const motion = useMotion();
  return (
    <Animated.View {...motion} style={{ marginHorizontal: 20, marginTop: 20 }}>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.8} style={{ fontFamily: fonts.uiBold, fontSize: 13, lineHeight: 18, letterSpacing: 0.4, textTransform: "uppercase", color: pal.ink3, marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ backgroundColor: pal.white, borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: pal.hair }}>
        {items.map((item, i) => (
          <ActivityRow key={item.id} item={item} last={i === items.length - 1} />
        ))}
      </View>
    </Animated.View>
  );
}

export function EmptyActivity({ filter }: { filter: ActivityFilter }) {
  const pal = usePalette();
  const motion = useMotion();
  const e = EMPTY[filter];
  return (
    <Animated.View {...motion} style={{ alignItems: "center", gap: 10, paddingHorizontal: 40, paddingTop: 64 }}>
      <KeeperAvatar name={e.keeper} size={64} />
      <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={[text.bodyBold, { color: pal.ink, textAlign: "center" }]}>
        {e.title}
      </Text>
      <KeeperLine id={e.keeper} style={{ textAlign: "center" }}>
        {e.line}
      </KeeperLine>
    </Animated.View>
  );
}
