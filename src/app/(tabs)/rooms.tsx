import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { PsstButton, text, usePalette } from "@/design/psst";
import { AllRow, LimitedAccessCard, RoomCard, ROOM_KEYS, UnsortedRow } from "@/components/rooms/RoomsParts";
import { DEMO_ROWS, demoRoom, useDemoFallback } from "@/components/rooms/demo";
import { usePhotoAccess } from "@/lib/photos";
import { AlbumsSection } from "@/components/albums/AlbumsSection";

export default function Rooms() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const list = useQuery(api.rooms.list, {});
  const { access, openLimitedPicker } = usePhotoAccess();

  const demoOn = useDemoFallback();
  const real = list ? list.reduce((sum, r) => sum + r.count, 0) : null;
  const demo = demoOn && real === 0;
  const countOf = (room: string) => (demo ? demoRoom(room as never).length : list ? (list.find((r) => r.category === room)?.count ?? 0) : null);
  const demoUnsorted = demoRoom("unsorted");
  const unsorted = demo ? { count: demoUnsorted.length, newest: demoUnsorted[0] ?? null } : list?.find((r) => r.category === "unsorted");
  const total = demo ? DEMO_ROWS.length : real;
  const empty = total === 0;

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24, gap: 16, flexGrow: 1 }}>
        <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.largeTitle, { color: p.ink }]}>
          Rooms
        </Text>
        <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>{empty ? "Your rooms are empty for now." : "Your screenshots live in four rooms."}</Text>
        {access === "limited" ? <LimitedAccessCard onPress={() => openLimitedPicker()} /> : null}
        {[ROOM_KEYS.slice(0, 2), ROOM_KEYS.slice(2)].map((pair) => (
          <View key={pair[0]} style={{ flexDirection: "row", gap: 12 }}>
            {pair.map((room) => (
              <RoomCard key={room} room={room} count={countOf(room)} onPress={() => router.push(`/room/${room}`)} />
            ))}
          </View>
        ))}
        {unsorted && unsorted.count > 0 ? (
          <UnsortedRow count={unsorted.count} newest={unsorted.newest} onPress={() => router.push("/room/unsorted")} />
        ) : null}
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
