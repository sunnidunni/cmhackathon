import { useQuery } from "convex/react";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { PsstButton, ShotSticker, Skeleton, text, usePalette } from "@/design/psst";
import { countLabel } from "@/components/rooms/format";
import { AlbumForm } from "./AlbumForm";

type Album = NonNullable<ReturnType<typeof useQuery<typeof api.albums.list>>>[number];

export const albumStatus = (a: { sortStatus: string; count: number }) =>
  a.sortStatus === "sorting" ? "Sorting your screenshots" : a.sortStatus === "failed" ? "Sorting stopped. Open to try again." : a.count === 0 ? "Empty for now" : countLabel(a.count);

// The person's own albums under the rooms. Shots fills them; a room is still where each screenshot lives.
// With no screenshots yet it stays out of the way, unless albums already exist and must stay reachable.
export function AlbumsSection({ libraryEmpty }: { libraryEmpty: boolean }) {
  const p = usePalette();
  const albums = useSafeQuery(api.albums.list, {}, []);
  const [formOpen, setFormOpen] = useState(false);
  if (libraryEmpty && (albums === undefined || albums.length === 0)) return null;

  return (
    <View style={{ gap: 4 }}>
      <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.headline, { color: p.ink, marginTop: 8, marginBottom: 4 }]}>
        Albums
      </Text>
      {albums === undefined ? (
        [0, 1].map((k) => (
          <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72 }}>
            <Skeleton w={44} h={60} style={{ borderRadius: 6 }} />
            <View style={{ gap: 6 }}>
              <Skeleton w={140} h={16} />
              <Skeleton w={90} h={12} />
            </View>
          </View>
        ))
      ) : albums.length === 0 ? (
        <Text style={[text.body, { color: p.ink2, marginBottom: 8 }]}>
          Make an album for anything you keep screenshotting, like concert tickets or recipes to try. Shots sorts the ones that fit into it, and keeps doing it for new ones.
        </Text>
      ) : (
        albums.map((a) => <AlbumRow key={a._id} album={a} />)
      )}
      <PsstButton kind="outline" label="New album" onPress={() => setFormOpen(true)} style={{ marginTop: 8 }} />
      <AlbumForm visible={formOpen} onClose={() => setFormOpen(false)} onSaved={(id) => router.push(`/album/${id}`)} />
    </View>
  );
}

function AlbumRow({ album }: { album: Album }) {
  const p = usePalette();
  const status = albumStatus(album);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${album.name}, ${status}`}
      onPress={() => router.push(`/album/${album._id}`)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 10, borderBottomWidth: 1, borderColor: p.hair, opacity: pressed ? 0.85 : 1 })}
    >
      <ShotSticker uri={album.cover?.imageUrl ?? null} title={album.cover?.title ?? album.name} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[text.bodyBold, { color: p.ink }]} numberOfLines={1}>
          {album.name}
        </Text>
        <Text style={[text.caption, { color: p.ink2 }]} numberOfLines={1}>
          {status}
        </Text>
      </View>
      <Text style={[text.body, { color: p.ink3 }]}>›</Text>
    </Pressable>
  );
}
