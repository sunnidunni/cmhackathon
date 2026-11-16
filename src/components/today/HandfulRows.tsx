import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { KeeperFace, PsstButton, ShotSticker, text, usePalette } from "@/design/psst";
import { useBigText } from "@/lib/bigText";
import { rowSubtitle, type Item } from "./model";

function Bell({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3a5 5 0 0 0-5 5v3l-1.5 3h13L17 11V8a5 5 0 0 0-5-5zM10 18a2 2 0 0 0 4 0" />
    </Svg>
  );
}

function Cross({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function HandfulRows({
  rows,
  now,
  tz,
  title,
  onOpen,
  onRemind,
  onSkip,
  onMenu,
}: {
  rows: Item[];
  now: number;
  tz: number;
  title?: string;
  onOpen: (item: Item) => void;
  onRemind: (item: Item) => void;
  onSkip: (item: Item) => void;
  onMenu: (item: Item) => void;
}) {
  const p = usePalette();
  const big = useBigText();
  if (rows.length === 0) return null;
  return (
    <View>
      {title ? <Text style={[text.caption, { color: p.ink2, marginBottom: 8 }]}>{title}</Text> : null}
      {rows.map((item) => (
        <View key={item.id} style={{ flexDirection: big ? "column" : "row", alignItems: big ? "stretch" : "center", gap: 12, minHeight: 68, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.hair }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => onOpen(item)} onLongPress={() => onMenu(item)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ShotSticker uri={item.imageUrl} title={item.title} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <KeeperFace id={item.keeper} size={22} muted={item.handled} reaction="filed" reactionKey={item.section === "justIn" && !item.handled ? item.id : undefined} />
                <Text numberOfLines={big ? undefined : 2} style={[text.bodyBold, { flexShrink: 1, color: item.handled ? p.ink2 : p.ink }]}>
                  {item.title}
                </Text>
              </View>
              <Text style={[text.caption, { color: p.ink2 }]}>{rowSubtitle(item, now, tz)}</Text>
            </View>
          </Pressable>
          {item.handled && big ? null : item.handled ? (
            <View style={{ width: 44, alignItems: "center" }}>
              <KeeperFace id={item.keeper} size={28} muted />
            </View>
          ) : big ? (
            <View style={{ gap: 8 }}>
              {item.actions.primary === "remind" ? <PsstButton kind="outline" label="Remind me" onPress={() => onRemind(item)} /> : null}
              <PsstButton kind="outline" label="Not today" onPress={() => onSkip(item)} />
            </View>
          ) : (
            <View style={{ flexDirection: "row" }}>
              {item.actions.primary === "remind" ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remind me about ${item.title}`} onPress={() => onRemind(item)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                  <Bell color={p.ink2} />
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" accessibilityLabel={`Not today: ${item.title}`} onPress={() => onSkip(item)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                <Cross color={p.ink2} />
              </Pressable>
            </View>
          )}
        </View>
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: p.hair }} />
    </View>
  );
}
