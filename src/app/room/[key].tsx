import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { dateLabel, countLabel, roomHeadline, roomLine, sortItems, type Category } from "@/components/rooms/format";
import { Keeper, KeeperLine, PsstButton, text, usePalette, Wash, keeperForRoom, type KeeperId, type RoomKey } from "@/components/rooms/kit";
import { ROOM_LABEL } from "@/components/rooms/RoomsParts";
import { ShotGrid, ShotGridSkeleton, type GridItem } from "@/components/rooms/ShotGrid";
import { Skeleton } from "@/components/rooms/kit";
import { runSync } from "@/lib/sync";

const CATEGORIES: Category[] = ["deadlines", "chats", "money", "ideas", "unsorted"];

const EMPTY: Record<RoomKey, { body: string; line: string }> = {
  deadlines: { body: "Anything with a date lands here: sign-ups, bookings, things due back. New screenshots are read each time you open Psst.", line: "No dates yet. I'm suspiciously relaxed." },
  chats: { body: "Screenshots of conversations land here: plans, codes, addresses. New screenshots are read each time you open Psst.", line: "Nothing to keep quiet about. Yet." },
  money: { body: "Receipts, bills, tickets and things to buy land here. New screenshots are read each time you open Psst.", line: "An empty pouch. Very tidy." },
  ideas: { body: "Recipes, places, quotes and saved answers land here. New screenshots are read each time you open Psst.", line: "The jar is open. Take your time." },
};

// The glass back chevron is the native stack header's own back button, left over a transparent bar.
function HeaderOptions() {
  return <Stack.Screen options={{ headerShown: true, headerTransparent: true, title: "", headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }} />;
}

const body = { padding: 16, paddingTop: Platform.OS === "ios" ? 8 : 64, paddingBottom: 32, gap: 16, flexGrow: 1 } as const;

export default function RoomScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return key === "all" ? <AllScreen /> : <SingleRoom category={(CATEGORIES as string[]).includes(key) ? (key as Category) : "unsorted"} />;
}

function AllScreen() {
  const p = usePalette();
  const all = useQuery(api.rooms.all, {});
  const items: GridItem[] | null = all
    ? all.items.map((i) => ({ id: i._id, title: i.title, imageUrl: i.imageUrl, sub: ROOM_LABEL[i.category as RoomKey] ?? "Unsorted" }))
    : null;
  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <HeaderOptions />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
        <Text accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
          All screenshots
        </Text>
        {all === undefined ? <Skeleton w={96} h={14} /> : <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(all.count)}</Text>}
        {items === null ? <ShotGridSkeleton /> : <ShotGrid items={items} keeper="mote" onOpen={(id) => router.push(`/shot/${id}`)} />}
        {items?.length === 0 ? <Text style={[text.body, { color: p.ink2 }]}>Nothing here yet. Bring in screenshots from Rooms.</Text> : null}
      </ScrollView>
    </View>
  );
}

function SingleRoom({ category }: { category: Category }) {
  const p = usePalette();
  const data = useQuery(api.rooms.get, { category });
  const [checking, setChecking] = useState(false);
  const isRoom = category !== "unsorted";
  const keeper: KeeperId = isRoom ? keeperForRoom(category) : "mote";

  const items = data
    ? sortItems(
        category,
        data.items.map((i) => ({ id: i._id, title: i.title, date: i.date, imageUrl: i.imageUrl, lineKey: i.lineKey, takenAt: i.takenAt })),
      )
    : null;
  const grid: GridItem[] = (items ?? []).map((i) => ({ id: i.id, title: i.title, imageUrl: i.imageUrl, sub: i.date ? dateLabel(i.date) : null }));

  const headline = !isRoom && items ? `${countLabel(items.length)} didn't fit a room.` : roomHeadline(category);

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <HeaderOptions />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
        {items !== null && items.length === 0 && isRoom ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 8 }}>
            <Keeper id={keeper} size={128} />
            <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink, textAlign: "center", marginTop: 12 }]}>
              Nothing in {ROOM_LABEL[category]} yet.
            </Text>
            <Text style={[text.lead, { color: p.ink2, textAlign: "center" }]}>{EMPTY[category].body}</Text>
            <View style={{ alignItems: "center" }}>
              <KeeperLine id={keeper}>{EMPTY[category].line}</KeeperLine>
            </View>
          </View>
        ) : (
          <>
            <Wash keeper={isRoom ? keeper : "muted"} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
                  {headline}
                </Text>
                {items ? <KeeperLine id={keeper}>{roomLine(category, items)}</KeeperLine> : <Skeleton w={160} h={14} />}
              </View>
              <Keeper id={keeper} size={88} />
            </Wash>
            {items === null ? (
              <ShotGridSkeleton />
            ) : items.length === 0 ? (
              <Text style={[text.body, { color: p.ink2 }]}>Nothing is waiting here.</Text>
            ) : (
              <>
                <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(items.length)}</Text>
                <ShotGrid items={grid} keeper={keeper} onOpen={(id) => router.push(`/shot/${id}`)} />
              </>
            )}
          </>
        )}
      </ScrollView>
      {items !== null && items.length === 0 && isRoom ? (
        <View style={{ padding: 16 }}>
          <PsstButton
            keeper={keeper}
            label={checking ? "Checking" : "Check for new screenshots"}
            disabled={checking}
            onPress={() => {
              setChecking(true);
              runSync()
                .catch(() => undefined)
                .finally(() => setChecking(false));
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
