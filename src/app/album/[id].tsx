import { useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { countLabel, dateLabel } from "@/components/rooms/format";
import { PhotoGrid, ShotGridSkeleton } from "@/components/rooms/PhotoGrid";
import { AlbumForm } from "@/components/albums/AlbumForm";
import { PsstButton, Skeleton, SoftCard, text, usePalette } from "@/design/psst";

const body = { padding: 16, paddingTop: Platform.OS === "ios" ? 8 : 64, paddingBottom: 32, gap: 16, flexGrow: 1 } as const;

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePalette();
  const album = useSafeQuery(api.albums.get, { albumId: id }, undefined);
  const remove = useMutation(api.albums.remove);
  const resort = useMutation(api.albums.resort);
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const header = <Stack.Screen options={{ headerShown: true, headerTransparent: true, title: "", headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }} />;

  if (album === null)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        {header}
        <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
          <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>{"I can't find that album."}</Text>
          <Text style={[text.lead, { color: p.ink2 }]}>It may have been deleted. Its screenshots are still in their rooms.</Text>
          <PsstButton kind="filled" label="Back to Rooms" onPress={() => router.replace("/rooms")} />
        </View>
      </View>
    );

  const sorting = album?.sortStatus === "sorting";
  const top = (
    <View style={{ gap: 8 }}>
      {album ? (
        <>
          <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
            {album.name}
          </Text>
          {album.description ? <Text style={[text.lead, { color: p.ink2 }]}>{album.description}</Text> : null}
          <Text accessibilityLiveRegion="polite" style={[text.caption, { color: p.ink2 }]}>
            {sorting ? `Sorting your screenshots into this album. ${album.items.length > 0 ? `${countLabel(album.items.length)} so far.` : ""}`.trim() : countLabel(album.items.length)}
          </Text>
          {album.sortStatus === "failed" ? (
            <SoftCard style={{ gap: 8 }}>
              <Text style={[text.bodyBold, { color: p.ink }]}>Sorting stopped before it finished.</Text>
              <Text style={[text.body, { color: p.ink2 }]}>{"Shots couldn't reach the reader. The screenshots already here stay."}</Text>
              <PsstButton kind="outline" label="Try sorting again" onPress={() => resort({ albumId: album._id }).catch(() => setError("That didn't work. Try again in a moment."))} />
            </SoftCard>
          ) : null}
          <View style={{ flexDirection: "row", gap: 16 }}>
            <PsstButton kind="text" label="Edit" onPress={() => setEditOpen(true)} />
            <PsstButton kind="text" label="Delete album" onPress={() => setConfirming(true)} />
          </View>
          {confirming ? (
            <SoftCard style={{ gap: 8 }}>
              <Text style={[text.bodyBold, { color: p.ink }]}>Delete {album.name}?</Text>
              <Text style={[text.body, { color: p.ink2 }]}>The album goes. Its screenshots stay in their rooms.</Text>
              <PsstButton
                kind="outline"
                danger
                label="Delete album"
                onPress={() =>
                  remove({ albumId: album._id })
                    .then(() => router.back())
                    .catch(() => setError("That didn't delete. Try again in a moment."))
                }
              />
              <PsstButton kind="text" label="Keep it" onPress={() => setConfirming(false)} />
            </SoftCard>
          ) : null}
          {error ? <Text style={[text.caption, { color: p.danger }]}>{error}</Text> : null}
        </>
      ) : (
        <>
          <Skeleton w={200} h={28} />
          <Skeleton w={140} h={14} />
        </>
      )}
    </View>
  );

  const form = album ? <AlbumForm visible={editOpen} album={album} onClose={() => setEditOpen(false)} /> : null;

  if (album && album.items.length > 0)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        {header}
        <PhotoGrid
          keeper="mote"
          header={top}
          onOpen={(shot) => router.push(`/shot/${shot}`)}
          items={album.items.map((i) => ({ id: i._id, title: i.title, imageUrl: i.imageUrl, takenAt: i.takenAt, sub: i.date ? dateLabel(i.date) : null }))}
        />
        {form}
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      {header}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
        {top}
        {album === undefined || sorting ? (
          <ShotGridSkeleton />
        ) : album.sortStatus === "done" ? (
          <Text style={[text.body, { color: p.ink2 }]}>
            Nothing fits yet. New screenshots that do will land here. You can also add any screenshot from its page.
          </Text>
        ) : null}
      </ScrollView>
      {form}
    </View>
  );
}
