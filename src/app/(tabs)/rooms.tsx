import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { useWindUp } from "@/components/tabs/WindUp";
import { PsstButton, text, usePalette } from "@/design/psst";
import { AllRow, LimitedAccessCard, RoomCard, ROOM_KEYS, UnsortedRow } from "@/components/rooms/RoomsParts";
import { DEMO_ROWS, demoRoom, useDemoFallback } from "@/components/rooms/demo";
import { chipLabel, recentlyFiled, roomChips, type FiledItem } from "@/components/rooms/filed";
import { RecentlyFiled } from "@/components/rooms/RecentlyFiled";
import type { Category } from "@/components/rooms/format";
import { previewToday } from "@/components/today/preview";
import { usePhotoAccess } from "@/lib/photos";
import { runSync } from "@/lib/sync";
import { RECENT_SHOTS } from "@/components/rooms/useRoomPage";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { AlbumsSection } from "@/components/albums/AlbumsSection";

export default function Rooms() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const list = useSafeQuery(api.rooms.list, {}, []);
  const tz = new Date().getTimezoneOffset();
  const recent = useSafeQuery(api.rooms.recent, { limit: RECENT_SHOTS }, undefined);
  const today = useSafeQuery(api.today.get, { tzOffsetMinutes: tz }, undefined);
  const { access, openLimitedPicker } = usePhotoAccess();
  const windUp = useWindUp(runSync);

  const demoOn = useDemoFallback();
  const real = list ? list.reduce((sum, r) => sum + r.count, 0) : null;
  const demo = demoOn && real === 0;
  const countOf = (room: string) => (demo ? demoRoom(room as never).length : list ? (list.find((r) => r.category === room)?.count ?? 0) : null);
  const demoUnsorted = demoRoom("unsorted");
  const unsorted = demo ? { count: demoUnsorted.length, newest: demoUnsorted[0] ?? null } : list?.find((r) => r.category === "unsorted");
  const total = demo ? DEMO_ROWS.length : real;
  const empty = total === 0;
  const [now] = useState(() => Date.now());
  const filed: FiledItem[] = demo
    ? DEMO_ROWS.map((r) => ({ id: r.id, title: r.title, category: r.category, takenAt: r.takenAt, imageUrl: r.imageUrl }))
    : (recent ?? []).map((r) => ({ id: r._id, title: r.title, category: r.category as Category, takenAt: r.takenAt, imageUrl: r.imageUrl }));
  const handful = ((demo ? previewToday("td-2", tz).data?.handful : today?.handful) ?? []).map((c) => (c.category ?? "unsorted") as Category);
  const chips = roomChips(filed, handful, now, tz);

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView refreshControl={windUp.control} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24, gap: 16, flexGrow: 1 }}>
        <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.largeTitle, { color: p.ink }]}>
          Rooms
        </Text>
        {windUp.banner}
        <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>{empty ? "Your rooms are empty for now." : "Your screenshots live in four rooms."}</Text>
        {access === "limited" ? <LimitedAccessCard onPress={() => openLimitedPicker()} /> : null}
        {[ROOM_KEYS.slice(0, 2), ROOM_KEYS.slice(2)].map((pair) => (
          <View key={pair[0]} style={{ flexDirection: "row", gap: 12 }}>
            {pair.map((room) => (
              <RoomCard key={room} room={room} count={countOf(room)} chip={chips[room] ? chipLabel(chips[room]) : undefined} onPress={() => router.push(`/room/${room}`)} />
            ))}
          </View>
        ))}
        {unsorted && unsorted.count > 0 ? (
          <UnsortedRow count={unsorted.count} newest={unsorted.newest} onPress={() => router.push("/room/unsorted")} />
        ) : null}
        <RecentlyFiled items={recentlyFiled(filed)} now={now} tz={tz} onOpen={(item) => router.push(`/shot/${item.id}`)} />
        {total !== null && total > 0 ? <AllRow count={total} onPress={() => router.push("/room/all")} /> : null}
        {real !== null ? <AlbumsSection libraryEmpty={real === 0} /> : null}
        {empty ? (
          <View style={{ flex: 1, justifyContent: "flex-end", gap: 12 }}>
            <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
              Screenshots are sent to our server and an AI model to be read. We only read your Screenshots album. Your other photos stay on your phone. Delete everything anytime in Settings.
            </Text>
            <PsstButton kind="filled" label="Bring in my screenshots" onPress={() => router.push("/bring")} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
