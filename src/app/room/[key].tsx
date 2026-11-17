import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { countLabel, dateLabel, roomHeadline, roomLine, type Category } from "@/components/rooms/format";
import { Keeper, KeeperLine, keeperForRoom, PsstButton, Skeleton, text, usePalette, type KeeperId } from "@/design/psst";
import type { RoomKey } from "@/design/theme";
import { SleepyKeeper } from "@/components/keepers/SleepyKeeper";
import { RoomWash } from "@/components/rooms/RoomWash";
import { PhotoGrid, ShotGridSkeleton } from "@/components/rooms/PhotoGrid";
import { ROOM_LABEL } from "@/components/rooms/RoomsParts";
import { DEMO_ROWS, demoRoom, useDemoFallback } from "@/components/rooms/demo";
import { useRoomPage } from "@/components/rooms/useRoomPage";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { runSync } from "@/lib/sync";

const CATEGORIES: Category[] = ["deadlines", "chats", "money", "ideas", "unsorted"];

const EMPTY: Record<RoomKey, { body: string; line: string }> = {
  deadlines: { body: "Anything with a date lands here: sign-ups, bookings, things due back. New screenshots are read each time you open Shots.", line: "No dates found yet. All 3 of my alarms are bored." },
  chats: { body: "Screenshots of conversations land here: plans, codes, addresses. New screenshots are read each time you open Shots.", line: "Nothing in Chats yet. I'll never quote one back." },
  money: { body: "Receipts, bills, tickets and things to buy land here. New screenshots are read each time you open Shots.", line: "An empty pouch. Very tidy." },
  ideas: { body: "Recipes, places, quotes and saved answers land here. New screenshots are read each time you open Shots.", line: "The jar is open. Take your time." },
};

const body = { padding: 16, paddingTop: Platform.OS === "ios" ? 8 : 64, paddingBottom: 32, gap: 16, flexGrow: 1 } as const;
const open = (id: string) => router.push(`/shot/${id}`);

export default function RoomScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return key === "all" ? <AllScreen /> : <SingleRoom category={(CATEGORIES as string[]).includes(key) ? (key as Category) : "unsorted"} />;
}

function AllScreen() {
  const p = usePalette();
  const page = useRoomPage();
  // The count comes from the import progress, which every tab already watches: the grid itself only holds the pages loaded so far.
  const progress = useSafeQuery(api.sync.progress, {}, undefined);
  const demoOn = useDemoFallback();
  const demo = page.items !== undefined && page.items.length === 0 && demoOn;
  const all: { count: number | undefined; items: { _id: string; title: string; imageUrl: string | null; takenAt: number; category: string }[] } | undefined = demo
    ? { count: DEMO_ROWS.length, items: DEMO_ROWS.map((r) => ({ _id: r.id, title: r.title, imageUrl: r.imageUrl, takenAt: r.takenAt, category: r.category })) }
    : page.items
      ? { count: progress?.read, items: page.items }
      : undefined;
  const header = (
    <View style={{ gap: 4 }}>
      <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
        All screenshots
      </Text>
      {all?.count !== undefined ? <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(all.count)}</Text> : <Skeleton w={96} h={14} />}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      {all && all.items.length > 0 ? (
        <PhotoGrid
          keeper="mote"
          header={header}
          onOpen={open}
          onEndReached={page.loadMore}
          loadingMore={page.loadingMore}
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
  const page = useRoomPage(category);
  const list = useSafeQuery(api.rooms.list, {}, []);
  const libraryEmpty = list !== undefined && list.every((r) => r.count === 0);
  const demoOn = useDemoFallback();
  const demoItems = demoRoom(category);
  type Data = { items: { _id: string; title: string; date: string | null; imageUrl: string | null; takenAt: number; sub?: string | null }[] };
  const demo = page.items !== undefined && page.items.length === 0 && libraryEmpty && demoOn && demoItems.length > 0;
  const data: Data | undefined = demo
    ? { items: demoItems.map((r) => ({ _id: r.id, title: r.title, date: r.date, imageUrl: r.imageUrl, takenAt: r.takenAt, sub: r.sub })) }
    : page.items
      ? { items: page.items }
      : undefined;
  const [checking, setChecking] = useState(false);
  const isRoom = category !== "unsorted";
  const keeper: KeeperId = isRoom ? keeperForRoom(category) : "mote";

  const items = data?.items ?? null;
  // The room's full count comes from the rooms list. The grid holds only the pages loaded so far.
  const count = items === null ? null : demo ? items.length : (list?.find((r) => r.category === category)?.count ?? items.length);
  // The keeper's line is worked out from the newest page, which is where upcoming dates are.
  const rows = items?.map((i) => ({ date: i.date, takenAt: i.takenAt }));
  const headline = !isRoom && count !== null ? `${countLabel(count)} couldn't be read.` : roomHeadline(category);
  const isEmpty = items !== null && items.length === 0;

  const wash = (
    <RoomWash keeper={keeper} muted={!isRoom} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
          {headline}
        </Text>
        {rows ? <KeeperLine id={keeper}>{roomLine(category, rows)}</KeeperLine> : <Skeleton w={160} h={14} />}
      </View>
      <Keeper id={keeper} size={88} boop />
    </RoomWash>
  );

  if (items !== null && items.length > 0)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        <PhotoGrid
          keeper={keeper}
          onOpen={open}
          onEndReached={page.loadMore}
          loadingMore={page.loadingMore}
          header={
            <>
              {wash}
              <Text style={[text.caption, { color: p.ink2 }]}>{countLabel(count ?? items.length)}</Text>
            </>
          }
          items={items.map((i) => ({ id: i._id, title: i.title, imageUrl: i.imageUrl, takenAt: i.takenAt, sub: i.sub !== undefined ? i.sub : i.date ? dateLabel(i.date) : null }))}
        />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={body}>
        {isEmpty && isRoom ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 8 }}>
            <SleepyKeeper id={keeper} size={128} />
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
