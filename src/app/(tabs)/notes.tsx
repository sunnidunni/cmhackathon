import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, SectionList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { groupNotes } from "@/components/notes/group";
import { NoteCard } from "@/components/notes/NoteCard";
import { useToday } from "@/components/notes/use-today";
import { SectionLabel } from "@/components/settings/rows";
import { PsstButton, Skeleton, text, usePalette } from "@/design/psst";
import { useNotesPrefs } from "@/lib/notes-prefs";

export default function Notes() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const notes = useQuery(api.notes.list, {});
  const { byDate } = useNotesPrefs();
  const today = useToday();
  const sections = useMemo(() => (notes ? groupNotes(notes, byDate, today) : []), [notes, byDate, today]);

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
            <Text style={[text.body, { color: p.ink2 }]}>Each screenshot Shots reads becomes a note with its title, a short summary, and any dates or amounts it found.</Text>
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
