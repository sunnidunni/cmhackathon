import { Pressable, Text, View } from "react-native";
import { KeeperFace, PsstButton, ShotSticker, SoftCard, text, usePalette } from "@/design/psst";
import { useBigText } from "@/lib/bigText";
import { whenLabel, type Item, type ReminderRow } from "./model";

export function ReminderRows({ rows, now, tz, onOpen }: { rows: ReminderRow[]; now: number; tz: number; onOpen: (id: string) => void }) {
  const p = usePalette();
  const big = useBigText();
  if (rows.length === 0) return null;
  return (
    <View>
      <Text style={[text.caption, { color: p.ink2, marginBottom: 8 }]}>Reminders</Text>
      {rows.map((r) => (
        <Pressable
          key={r.reminderId}
          accessibilityRole="button"
          accessibilityLabel={`Open ${r.title}`}
          onPress={() => onOpen(r.screenshotId)}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.hair }}
        >
          <ShotSticker uri={r.imageUrl} title={r.title} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={big ? undefined : 2} style={[text.bodyBold, { color: p.ink }]}>{r.title}</Text>
            <Text style={[text.caption, { color: p.ink2 }]}>{`Reminder set · ${whenLabel(r.dueAt, now, tz)}`}</Text>
          </View>
        </Pressable>
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: p.hair }} />
    </View>
  );
}

export function RememberCard({ item, onOpen, onKeep, onDelete }: { item: Item; onOpen: () => void; onKeep: () => void; onDelete: () => void }) {
  const p = usePalette();
  const big = useBigText();
  return (
    <SoftCard style={{ gap: 12 }}>
      <Text style={[text.caption, { color: p.ink2 }]}>Remember this?</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ShotSticker uri={item.imageUrl} title={item.title} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <KeeperFace id={item.keeper} size={22} />
            <Text numberOfLines={big ? undefined : 2} style={[text.bodyBold, { flexShrink: 1, color: p.ink }]}>{item.title}</Text>
          </View>
          {item.line ? <Text style={[text.caption, { color: p.ink2 }]}>{item.line}</Text> : null}
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PsstButton kind="outline" label="Keep it" onPress={onKeep} />
        </View>
        <View style={{ flex: 1 }}>
          <PsstButton kind="text" label="Delete from Psst" onPress={onDelete} />
        </View>
      </View>
    </SoftCard>
  );
}
