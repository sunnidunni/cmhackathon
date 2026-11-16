import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { api } from "../../../convex/_generated/api";
import { dateLabel } from "@/components/rooms/format";
import { KeeperFace, keeperForRoom, text, usePalette } from "@/design/psst";
import type { RoomKey } from "@/design/theme";

export type NoteRow = FunctionReturnType<typeof api.notes.list>[number];

const taken = (at: number) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function NoteCard({ note }: { note: NoteRow }) {
  const p = usePalette();
  const room = note.category === "unsorted" ? null : (note.category as RoomKey);
  const points = [...note.dates.map((d) => `${d.what}: ${dateLabel(d.when)}`), ...(note.amount ? [note.amount] : [])];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[note.title, note.summary, ...points].filter(Boolean).join(". ")}
      accessibilityHint="Opens the screenshot"
      onPress={() => router.push(`/shot/${note._id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: p.hair,
        backgroundColor: pressed ? p.fill : p.white,
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {room ? <KeeperFace id={keeperForRoom(room)} size={22} /> : null}
          <Text numberOfLines={2} style={[text.bodyBold, { flex: 1, color: p.ink }]}>
            {note.title || "Untitled"}
          </Text>
        </View>
        {note.summary ? <Text style={[text.body, { color: p.ink2 }]}>{note.summary}</Text> : null}
        {points.map((pt) => (
          <Text key={pt} style={[text.caption, { color: p.ink }]}>
            {`• ${pt}`}
          </Text>
        ))}
        <Text style={[text.caption, { color: p.ink3 }]}>{`Saved ${taken(note.takenAt)}`}</Text>
      </View>
      {note.imageUrl ? (
        <Image source={{ uri: note.imageUrl }} contentFit="cover" style={{ width: 52, height: 92, borderRadius: 8, backgroundColor: p.fill2 }} accessibilityIgnoresInvertColors />
      ) : null}
    </Pressable>
  );
}

