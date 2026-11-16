import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, SectionList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { groupNotes } from "@/components/notes/group";
import { dateLabel } from "@/components/rooms/format";
import { SectionLabel } from "@/components/settings/rows";
import { KeeperFace, keeperForRoom, PsstButton, Skeleton, text, usePalette } from "@/design/psst";
import type { RoomKey } from "@/design/theme";
import { useNotesPrefs } from "@/lib/notes-prefs";

type NoteRow = NonNullable<ReturnType<typeof useQuery<typeof api.notes.list>>>[number];

const taken = (at: number) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function NoteCard({ note }: { note: NoteRow }) {
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

export default function Notes() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const notes = useQuery(api.notes.list, {});
  const { byDate } = useNotesPrefs();
  const sections = useMemo(() => (notes ? groupNotes(notes, byDate) : []), [notes, byDate]);

  const header = (
    <View style={{ gap: 4, marginBottom: 8 }}>
      <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.largeTitle, { color: p.ink }]}>
        Notes
      </Text>
      {notes === undefined ? (
        <Skeleton w={140} h={14} />
      ) : (
        <Text style={[text.caption, { color: p.ink2 }]}>
          {notes.length === 0 ? "No notes yet." : `${notes.length} ${notes.length === 1 ? "note" : "notes"}, by ${byDate ? "date" : "room"}`}
        </Text>
      )}
    </View>
  );
  const pad = { paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 } as const;

  if (notes === undefined || notes.length === 0)
    return (
      <ScrollView style={{ backgroundColor: p.paper }} contentContainerStyle={[pad, { gap: 12, flexGrow: 1 }]}>
        {header}
        {notes === undefined ? (
          [0, 1, 2].map((i) => <Skeleton key={i} w="100%" h={96} style={{ borderRadius: 16 }} />)
        ) : (
          <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
            <Text style={[text.headline, { color: p.ink }]}>Your notes write themselves.</Text>
            <Text style={[text.body, { color: p.ink2 }]}>Each screenshot Psst reads becomes a note with its title, a short summary, and any dates or amounts it found.</Text>
            <PsstButton kind="filled" label="Bring in my screenshots" onPress={() => router.push("/bring")} />
          </View>
        )}
      </ScrollView>
    );

  return (
    <SectionList
      style={{ backgroundColor: p.paper }}
      contentContainerStyle={pad}
      sections={sections}
      keyExtractor={(n) => n._id}
      ListHeaderComponent={header}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <SectionLabel>{`${section.title} · ${section.data.length}`}</SectionLabel>
        </View>
      )}
      renderItem={({ item }) => <NoteCard note={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}
