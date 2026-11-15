import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { countLabel, dateLabel, roomHeadline, roomLine, type Category } from "@/components/rooms/format";
import { Keeper, KeeperLine, keeperForRoom, PsstButton, Skeleton, text, usePalette, type KeeperId } from "@/design/psst";
import type { RoomKey } from "@/design/theme";
import { RoomWash } from "@/components/rooms/RoomWash";
import { PhotoGrid, ShotGridSkeleton } from "@/components/rooms/PhotoGrid";
import { ROOM_LABEL } from "@/components/rooms/RoomsParts";
import { DEMO_ROWS, demoRoom, useDemoFallback } from "@/components/rooms/demo";
import { runSync } from "@/lib/sync";

const CATEGORIES: Category[] = ["deadlines", "chats", "money", "ideas", "unsorted"];

const EMPTY: Record<RoomKey, { body: string; line: string }> = {
  deadlines: { body: "Anything with a date lands here: sign-ups, bookings, things due back. New screenshots are read each time you open Psst.", line: "No dates found yet. All 3 of my alarms are bored." },
  chats: { body: "Screenshots of conversations land here: plans, codes, addresses. New screenshots are read each time you open Psst.", line: "Nothing in Chats yet. I'll never quote one back." },
  money: { body: "Receipts, bills, tickets and things to buy land here. New screenshots are read each time you open Psst.", line: "An empty pouch. Very tidy." },
  ideas: { body: "Recipes, places, quotes and saved answers land here. New screenshots are read each time you open Psst.", line: "The jar is open. Take your time." },
};

// The glass back chevron is the native stack header's own back button, left over a transparent bar.
function HeaderOptions() {
  return <Stack.Screen options={{ headerShown: true, headerTransparent: true, title: "", headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }} />;
}

const body = { padding: 16, paddingTop: Platform.OS === "ios" ? 8 : 64, paddingBottom: 32, gap: 16, flexGrow: 1 } as const;
const open = (id: string) => router.push(`/shot/${id}`);

export default function RoomScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return key === "all" ? <AllScreen /> : <SingleRoom category={(CATEGORIES as string[]).includes(key) ? (key as Category) : "unsorted"} />;
}

function AllScreen() {
  const p = usePalette();
  const realAll = useQuery(api.rooms.all, {});
  const demoOn = useDemoFallback();
  const all =
    realAll && realAll.count === 0 && demoOn
      ? { count: DEMO_ROWS.length, items: DEMO_ROWS.map((r) => ({ _id: r.id, title: r.title, imageUrl: r.imageUrl, takenAt: r.takenAt, category: r.category })) }
      : realAll;
  const header = (
    <View style={{ gap: 4 }}>
      <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
        All screenshots
      </Text>
      {all ? <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(all.count)}</Text> : <Skeleton w={96} h={14} />}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <HeaderOptions />
      {all && all.items.length > 0 ? (
        <PhotoGrid
          keeper="mote"
          header={header}
          onOpen={open}
          items={all.items.map((i) => ({ id: i._id, title: i.title, imageUrl: i.imageUrl, takenAt: i.takenAt, sub: ROOM_LABEL[i.category as RoomKey] ?? "Unsorted" }))}
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
          {header}
          {all === undefined ? <ShotGridSkeleton /> : <Text style={[text.body, { color: p.ink2 }]}>Nothing here yet. Bring in screenshots from Rooms.</Text>}
        </ScrollView>
      )}
    </View>
  );
}

function SingleRoom({ category }: { category: Category }) {
  const p = usePalette();
  const realData = useQuery(api.rooms.get, { category });
  const list = useQuery(api.rooms.list, {});
  const libraryEmpty = list !== undefined && list.every((r) => r.count === 0);
  const demoOn = useDemoFallback();
  const demoItems = demoRoom(category);
  type Data = { items: { _id: string; title: string; date: string | null; imageUrl: string | null; takenAt: number; sub?: string | null }[] };
  const data: Data | undefined =
    realData && realData.items.length === 0 && libraryEmpty && demoOn && demoItems.length > 0
      ? { items: demoItems.map((r) => ({ _id: r.id, title: r.title, date: r.date, imageUrl: r.imageUrl, takenAt: r.takenAt, sub: r.sub })) }
      : realData;
  const [checking, setChecking] = useState(false);
  const isRoom = category !== "unsorted";
  const keeper: KeeperId = isRoom ? keeperForRoom(category) : "mote";

  const items = data?.items ?? null;
  const rows = items?.map((i) => ({ date: i.date, takenAt: i.takenAt }));
  const headline = !isRoom && items ? `${countLabel(items.length)} couldn't be read.` : roomHeadline(category);
  const isEmpty = items !== null && items.length === 0;

  const wash = (
    <RoomWash keeper={keeper} muted={!isRoom} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
          {headline}
        </Text>
        {rows ? <KeeperLine id={keeper}>{roomLine(category, rows)}</KeeperLine> : <Skeleton w={160} h={14} />}
      </View>
      <Keeper id={keeper} size={88} />
    </RoomWash>
  );

  if (items !== null && items.length > 0)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        <HeaderOptions />
        <PhotoGrid
          keeper={keeper}
          onOpen={open}
          header={
            <>
              {wash}
              <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(items.length)}</Text>
            </>
          }
          items={items.map((i) => ({ id: i._id, title: i.title, imageUrl: i.imageUrl, takenAt: i.takenAt, sub: i.sub !== undefined ? i.sub : i.date ? dateLabel(i.date) : null }))}
        />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <HeaderOptions />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
        {isEmpty && isRoom ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 8 }}>
            <Keeper id={keeper} size={128} />
            <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink, textAlign: "center", marginTop: 12 }]}>
              Nothing in {ROOM_LABEL[category]} yet.
            </Text>
            <Text style={[text.lead, { color: p.ink2, textAlign: "center" }]}>{EMPTY[category].body}</Text>
            <KeeperLine id={keeper}>{EMPTY[category].line}</KeeperLine>
          </View>
        ) : (
          <>
            {wash}
            {isEmpty ? <Text style={[text.body, { color: p.ink2 }]}>Nothing is waiting here.</Text> : <ShotGridSkeleton />}
          </>
        )}
      </ScrollView>
      {isEmpty && isRoom ? (
        <View style={{ padding: 16 }}>
          <PsstButton kind="filled"
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
