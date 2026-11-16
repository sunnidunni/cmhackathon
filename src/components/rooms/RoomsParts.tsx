import { Pressable, Text, View } from "react-native";
import { Keeper, KeeperFace, ShotSticker, Skeleton, SoftCard, usePalette, text, useKeeperColors, KEEPERS, keeperForRoom } from "@/design/psst";
import type { RoomKey } from "@/design/theme";
import { RoomWash } from "./RoomWash";
import { countLabel } from "./format";

export const ROOM_LABEL: Record<RoomKey, string> = { deadlines: "Deadlines", chats: "Chats", money: "Money", ideas: "Ideas" };
export const ROOM_KEYS: RoomKey[] = ["deadlines", "chats", "money", "ideas"];

// One keeper room as a wash card. A null count means the query has not answered yet: a skeleton, never 0.
export function RoomCard({ room, count, chip, onPress }: { room: RoomKey; count: number | null; chip?: string; onPress: () => void }) {
  const p = usePalette();
  const id = keeperForRoom(room);
  const { deep } = useKeeperColors(id);
  const quiet = count === null || count === 0;
  const countText = count === null ? null : count === 0 ? "Empty for now" : countLabel(count);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ROOM_LABEL[room]}, ${KEEPERS[id].name}, ${countText ?? "loading"}${chip ? `, ${chip}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
    >
      <RoomWash keeper={id} muted={quiet} style={{ minHeight: 168, padding: 16, overflow: "hidden" }}>
        <Text style={[text.bodyBold, { color: p.ink }]}>{ROOM_LABEL[room]}</Text>
        <Text style={[text.caption, { color: p.ink2 }]}>{KEEPERS[id].name}</Text>
        {countText === null ? (
          <Skeleton w={72} h={14} style={{ marginTop: 6 }} />
        ) : (
          <Text style={[text.caption, { color: quiet ? p.ink2 : deep, marginTop: 2 }]}>{countText}</Text>
        )}
        {chip ? (
          <View style={{ alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: p.paper, zIndex: 1 }}>
            <Text numberOfLines={1} style={[text.caption, { color: deep }]}>{chip}</Text>
          </View>
        ) : null}
        <View style={{ position: "absolute", right: 8, bottom: 8 }}>
          <Keeper id={id} size={84} muted={quiet} />
        </View>
      </RoomWash>
    </Pressable>
  );
}

export function UnsortedRow({ count, newest, onPress }: { count: number; newest: { title: string; imageUrl: string | null } | null; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Unsorted, ${countLabel(count)}`}
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.hair }}
    >
      <ShotSticker uri={newest?.imageUrl ?? null} title={newest?.title ?? ""} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={[text.bodyBold, { color: p.ink }]}>Unsorted</Text>
        <Text style={[text.caption, { color: p.ink2 }]}>
          {count === 1 ? "1 screenshot couldn't be read. You decide where it goes." : `${count} screenshots couldn't be read. You decide where they go.`}
        </Text>
      </View>
      <Text style={[text.body, { color: p.ink3 }]}>›</Text>
    </Pressable>
  );
}

export function AllRow({ count, onPress }: { count: number; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`All screenshots, ${count}`}
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderBottomWidth: 1, borderColor: p.hair }}
    >
      <Text style={[text.bodyBold, { color: p.ink, flex: 1 }]}>All screenshots</Text>
      <Text style={[text.body, { color: p.ink2, fontVariant: ["tabular-nums"] }]}>{count}</Text>
      <Text style={[text.body, { color: p.ink3 }]}>›</Text>
    </Pressable>
  );
}

export function LimitedAccessCard({ onPress }: { onPress: () => void }) {
  const p = usePalette();
  return (
    <SoftCard style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <KeeperFace id="murmur" size={40} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[text.bodyBold, { color: p.ink }]}>Shots reads only the ones you picked. Your rooms work with those.</Text>
        <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>Pick more screenshots</Text>
        </Pressable>
        <Text style={[text.caption, { color: p.ink2 }]}>We only read your Screenshots album.</Text>
      </View>
    </SoftCard>
  );
}
