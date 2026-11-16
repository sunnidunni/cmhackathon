import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { computeInsights } from "@/components/you/insights";
import { barSegments, countsLine, fromLine } from "@/components/onboarding/you";
import { KEEPERS, keeperForRoom, KeeperFace, MUTED, PsstButton, Skeleton, SoftCard, text, usePalette } from "@/design/psst";
import type { RoomKey } from "@/design/theme";

const isRoom = (room: string): room is RoomKey => room === "deadlines" || room === "chats" || room === "money" || room === "ideas";

export default function You() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const tz = new Date().getTimezoneOffset();
  const you = useQuery(api.you.get, {});
  const all = useQuery(api.rooms.all, {});
  const todos = useQuery(api.todos.list, {});
  const today = useQuery(api.today.get, { tzOffsetMinutes: tz });

  const [now] = useState(() => Date.now());
  const insights = useMemo(() => {
    if (!all) return [];
    return computeInsights({
      items: all.items.map((i) => ({ _id: i._id, takenAt: i.takenAt, category: i.category, title: i.title })),
      now,
      tzOffsetMinutes: tz,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      openTodos: todos ? todos.filter((t) => !t.done).length : 0,
      reminders: today ? today.reminders.length : 0,
    });
  }, [all, todos, today, tz, now]);

  const lead = you?.headline && isRoom(you.headline.lead) ? you.headline.lead : null;
  const colorOf = (room: string) => (isRoom(room) ? KEEPERS[keeperForRoom(room)].main : dark ? MUTED.mainDark : MUTED.main);

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24, gap: 16, flexGrow: 1 }}>
        <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.largeTitle, { color: p.ink }]}>
          You
        </Text>
        {you === undefined ? (
          <View style={{ gap: 12 }}>
            <Skeleton w="100%" h={260} style={{ borderRadius: 16 }} />
            <Skeleton w="100%" h={64} style={{ borderRadius: 16 }} />
            <Skeleton w="100%" h={64} style={{ borderRadius: 16 }} />
          </View>
        ) : !you.headline ? (
          <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>
            {"Once a few more screenshots are in, I'll tell you what they say about you."}
          </Text>
        ) : (
          <>
            <SoftCard style={{ gap: 12, alignItems: "center", padding: 20 }}>
              <Text style={[text.caption, { color: p.ink2 }]}>{fromLine(you.total)}</Text>
              <Text style={[text.caption, { color: p.ink2 }]}>So far, you look like</Text>
              <KeeperFace id={keeperForRoom(lead ?? "deadlines")} size={96} muted={!lead} />
              <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink, textAlign: "center" }]}>{you.headline.title}</Text>
              <Text style={[text.body, { color: p.ink2, textAlign: "center" }]}>{you.headline.sentence}</Text>
              <View style={{ flexDirection: "row", height: 12, alignSelf: "stretch", borderRadius: 6, overflow: "hidden", backgroundColor: p.fill2 }}>
                {barSegments(you.counts).map((s) => (
                  <View key={s.category} style={{ flex: s.fraction, backgroundColor: colorOf(s.category) }} />
                ))}
              </View>
              <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{countsLine(you.counts)}</Text>
              <PsstButton kind="outline" label="See my rooms" onPress={() => router.navigate("/rooms")} style={{ alignSelf: "stretch" }} />
            </SoftCard>
            {all === undefined ? (
              <Skeleton w="100%" h={64} style={{ borderRadius: 16 }} />
            ) : (
              insights.map((i) => {
                const body = (
                  <SoftCard>
                    <Text style={[text.body, { color: p.ink }]}>{i.text}</Text>
                  </SoftCard>
                );
                return i.shotId ? (
                  <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={i.text} onPress={() => router.push(`/shot/${i.shotId}`)}>
                    {body}
                  </Pressable>
                ) : (
                  <View key={i.id}>{body}</View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
