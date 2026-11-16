import { Pressable, Text, View } from "react-native";
import { ShotSticker, text, usePalette } from "@/design/psst";
import { filedWhen, type FiledItem } from "./filed";
import { ROOM_LABEL } from "./RoomsParts";

export function RecentlyFiled({ items, now, tz, onOpen }: { items: FiledItem[]; now: number; tz: number; onOpen: (item: FiledItem) => void }) {
  const p = usePalette();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <Text accessibilityRole="header" style={[text.caption, { color: p.ink2 }]}>Recently filed</Text>
      {items.map((item) => {
        const line = `Filed in ${ROOM_LABEL[item.category as keyof typeof ROOM_LABEL]} · ${filedWhen(item.takenAt, now, tz)}`;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${line}`}
            onPress={() => onOpen(item)}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 8, borderBottomWidth: 1, borderColor: p.hair, opacity: pressed ? 0.85 : 1 })}
          >
            <ShotSticker uri={item.imageUrl} title={item.title} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.bodyBold, { color: p.ink }]}>{item.title}</Text>
              <Text style={[text.caption, { color: p.ink2 }]}>{line}</Text>
            </View>
            <Text style={[text.body, { color: p.ink3 }]}>›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
