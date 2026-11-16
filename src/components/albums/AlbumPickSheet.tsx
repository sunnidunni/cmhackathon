import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PsstButton, Skeleton, text, usePalette } from "@/design/psst";
import { AlbumForm } from "./AlbumForm";

// Put one screenshot in or take it out of the person's albums. Each tap saves at once.
export function AlbumPickSheet({ visible, screenshotId, onClose }: { visible: boolean; screenshotId: Id<"screenshots">; onClose: () => void }) {
  const p = usePalette();
  const albums = useQuery(api.albums.forShot, visible ? { screenshotId } : "skip");
  const setShot = useMutation(api.albums.setShot).withOptimisticUpdate((store, { albumId, inAlbum }) => {
    const list = store.getQuery(api.albums.forShot, { screenshotId });
    if (list) store.setQuery(api.albums.forShot, { screenshotId }, list.map((a) => (a._id === albumId ? { ...a, inAlbum } : a)));
  });
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (albumId: Id<"albums">, inAlbum: boolean) => {
    setError(null);
    setShot({ albumId, screenshotId, inAlbum }).catch(() => setError("That didn't save. Try again in a moment."));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: p.paper, padding: 16, paddingTop: 24, paddingBottom: 32, gap: 8 }}>
        <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink, marginBottom: 8 }]}>
          Albums
        </Text>
        <ScrollView style={{ flexGrow: 0 }}>
          {albums === undefined
            ? [0, 1].map((k) => <Skeleton key={k} w="100%" h={44} style={{ marginBottom: 12 }} />)
            : albums.map((a) => (
                <Pressable
                  key={a._id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={a.name}
                  accessibilityState={{ checked: a.inAlbum }}
                  onPress={() => toggle(a._id, !a.inAlbum)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderTopWidth: 1, borderColor: p.hair }}
                >
                  <Text style={[text.bodyBold, { color: p.ink, flex: 1 }]} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: a.inAlbum ? p.ink : p.hair2, backgroundColor: a.inAlbum ? p.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {a.inAlbum ? <Text style={[text.caption, { color: p.paper, lineHeight: 16 }]}>✓</Text> : null}
                  </View>
                </Pressable>
              ))}
        </ScrollView>
        {albums && albums.length === 0 ? <Text style={[text.body, { color: p.ink2 }]}>No albums yet. Make one and this screenshot goes in it.</Text> : null}
        <Text style={[text.caption, { color: p.ink2, borderTopWidth: 1, borderColor: p.hair, paddingTop: 12 }]}>
          {"Taking a screenshot out keeps it out. Psst won't sort it back in, and it stays in its room."}
        </Text>
        {error ? <Text style={[text.caption, { color: p.danger }]}>{error}</Text> : null}
        <View style={{ flex: 1 }} />
        <PsstButton kind="outline" label="New album" onPress={() => setFormOpen(true)} />
        <PsstButton kind="filled" label="Done" onPress={onClose} />
      </View>
      <AlbumForm visible={formOpen} onClose={() => setFormOpen(false)} onSaved={(albumId) => toggle(albumId, true)} />
    </Modal>
  );
}
