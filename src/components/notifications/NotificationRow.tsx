import { SymbolView, type SFSymbol } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { KeeperAvatar } from "@/design/keepers-v2";
import { fonts, KEEPERS, text, useKeeperColors, usePalette } from "@/design/psst";
import { relativeTime, type PsstNotification } from "./fixtures";

type Props = {
  item: PsstNotification;
  onSnooze: (id: string) => void;
  onArchive: (id: string) => void;
};

function SwipeAction({ label, symbol, glyph, color, ink, onPress }: { label: string; symbol: SFSymbol; glyph: string; color: string; ink: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 84, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: color, opacity: pressed ? 0.8 : 1 })}
    >
      <SymbolView name={symbol} size={20} weight="semibold" tintColor={ink} fallback={<Text style={{ fontSize: 18, color: ink }}>{glyph}</Text>} />
      <Text maxFontSizeMultiplier={1.4} style={{ fontFamily: fonts.uiBold, fontSize: 13, color: ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NotificationRow({ item, onSnooze, onArchive }: Props) {
  const pal = usePalette();
  const colors = useKeeperColors(item.keeper);
  const keeper = KEEPERS[item.keeper];
  const when = relativeTime(item.minutesAgo);

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={{ borderRadius: 18, borderCurve: "continuous", backgroundColor: pal.fill2 }}
      renderRightActions={() => (
        <View style={{ flexDirection: "row" }}>
          <SwipeAction label="Snooze" symbol="moon.zzz" glyph="z" color={colors.tint} ink={colors.deep} onPress={() => onSnooze(item.id)} />
          <SwipeAction label="Archive" symbol="archivebox" glyph="✓" color={pal.ink} ink={pal.paper} onPress={() => onArchive(item.id)} />
        </View>
      )}
    >
      <View
        accessible
        accessibilityLabel={`${keeper.name}, ${when}. ${item.line}`}
        accessibilityHint="Swipe left, or use actions, to snooze or archive."
        accessibilityActions={[
          { name: "snooze", label: "Snooze" },
          { name: "archive", label: "Archive" },
        ]}
        onAccessibilityAction={(e) => (e.nativeEvent.actionName === "snooze" ? onSnooze(item.id) : onArchive(item.id))}
        style={{ flexDirection: "row", gap: 12, padding: 14, backgroundColor: pal.white, borderRadius: 18, borderCurve: "continuous", borderWidth: 1, borderColor: pal.hair }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" }}>
          <KeeperAvatar name={item.keeper} size={36} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 14, color: colors.deep }}>
              {keeper.name}
            </Text>
            <Text maxFontSizeMultiplier={1.6} style={[text.caption, { color: pal.ink3, fontVariant: ["tabular-nums"] }]}>
              {when}
            </Text>
            {item.unread ? <View style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 4, backgroundColor: colors.main }} /> : null}
          </View>
          <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink }]}>
            {item.line}
          </Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}
