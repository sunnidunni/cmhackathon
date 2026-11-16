import { Pressable, Text, View } from "react-native";
import { fonts, KeeperFace, KeeperLine, PsstButton, ShotSticker, text, useKeeperColors, usePalette, Wash } from "@/design/psst";
import { actionsFor, clockLabel, dateLabel, headline, sourceLine, type Item } from "./model";

export function Headline({ item, now, tz }: { item: Item; now: number; tz: number }) {
  const p = usePalette();
  const h = headline(item, now, tz);
  return (
    <Text accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
      {h.name}
      {"  "}
      <View style={{ transform: [{ translateY: 4 }] }}>
        <KeeperFace id={item.keeper} size={30} reaction="filed" reactionKey={item.section === "justIn" && !item.handled ? item.id : undefined} />
      </View>
      {"  "}
      {h.rest}
    </Text>
  );
}

export function FocusCard({
  item,
  now,
  tz,
  onOpen,
  onPrimary,
  onSecondary,
  onRemoveReading,
}: {
  item: Item;
  now: number;
  tz: number;
  onOpen: () => void;
  onPrimary: () => void;
  onSecondary: () => void;
  onRemoveReading: () => void;
}) {
  const p = usePalette();
  const c = useKeeperColors(item.keeper);
  const a = actionsFor(item, now, tz);
  return (
    <View style={{ gap: 12 }}>
      <Wash keeper={item.keeper} style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={onOpen}>
          <ShotSticker uri={item.imageUrl} title={item.title} tilt={-2} size={104} />
        </Pressable>
        <View style={{ flex: 1, gap: 6 }}>
          {item.section === "justIn" ? (
            <View style={{ alignSelf: "flex-start", backgroundColor: p.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={[text.caption, { color: p.ink, fontFamily: fonts.uiBold }]}>{`Just in · ${clockLabel(item.takenAt, tz)}`}</Text>
            </View>
          ) : null}
          <Text style={[text.bodyBold, { fontSize: 18, lineHeight: 23, color: p.ink }]}>{item.title}</Text>
          {item.date ? <Text style={[text.bodyBold, { color: c.deep }]}>{dateLabel(item.date.when)}</Text> : null}
          {item.line ? <KeeperLine id={item.keeper}>{item.line}</KeeperLine> : null}
          <Text style={[text.caption, { color: p.ink2 }]}>{sourceLine(item)}</Text>
          {item.section === "justIn" ? (
            <Pressable accessibilityRole="button" onPress={onRemoveReading} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
              <Text style={[text.caption, { color: p.ink2, fontFamily: fonts.uiBold, textDecorationLine: "underline" }]}>Remove this reading</Text>
            </Pressable>
          ) : null}
        </View>
      </Wash>
      <PsstButton kind="filled" keeper={item.keeper} label={a.primary} onPress={onPrimary} />
      <PsstButton kind="text" label={a.secondary} onPress={onSecondary} />
      <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{a.note}</Text>
    </View>
  );
}
