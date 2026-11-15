import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import lines from "@/content/lines.json";
import { barFraction, failedLabel, readLine } from "@/components/onboarding/format";
import { Body, Heading, Screen } from "@/components/onboarding/ui";
import { Button, Character, colors, radii, ROOM_KEYS, rooms, SketchFrame, spacing, type } from "@/design";

const allLines: Record<string, string> = {
  ...lines.rooms.deadlines.lines,
  ...lines.rooms.chats.lines,
  ...lines.rooms.money.lines,
  ...lines.rooms.ideas.lines,
  ...lines.unsorted.lines,
};

export default function Import() {
  const progress = useQuery(api.sync.progress, {});
  const roomList = useQuery(api.rooms.list, {});
  const retryAll = useMutation(api.extract.retryAllFailed);
  const failed = progress ? failedLabel(progress.failed) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <Heading>Reading your screenshots</Heading>
        <Body>{progress ? readLine(progress) : "Checking what I have so far."}</Body>
        <View style={{ height: 14, backgroundColor: colors.paperDeep, borderRadius: radii.pill, overflow: "hidden" }}>
          <View
            style={{
              height: 14,
              width: `${Math.round((progress ? barFraction(progress) : 0) * 100)}%`,
              backgroundColor: colors.sun,
            }}
          />
        </View>
        {failed ? (
          <View style={{ gap: spacing.sm }}>
            <Body>{failed}</Body>
            <Button label="Try again" variant="secondary" onPress={() => retryAll({})} />
          </View>
        ) : null}
        {ROOM_KEYS.map((key) => {
          const room = roomList?.find((r) => r.category === key);
          const line = room?.newest?.lineKey ? allLines[room.newest.lineKey] : null;
          return (
            <Pressable key={key} accessibilityRole="button" onPress={() => router.push(`/room/${key}`)}>
              <SketchFrame
                fill={colors.white}
                radius={radii.lg}
                seed={key}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}
              >
                <Character room={key} size={48} />
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={type.heading}>
                    {rooms[key].label}
                    {room && room.count > 0 ? ` · ${room.count}` : ""}
                  </Text>
                  <Text style={type.body} numberOfLines={2}>
                    {room && room.count > 0 ? (line ?? room.newest?.title ?? "") : "Nothing yet"}
                  </Text>
                </View>
                {room?.newest?.imageUrl ? (
                  <Image
                    source={{ uri: room.newest.imageUrl }}
                    style={{ width: 44, height: 78, borderRadius: radii.sm }}
                    contentFit="cover"
                  />
                ) : null}
              </SketchFrame>
            </Pressable>
          );
        })}
      </ScrollView>
      <Button label="See today's handful" onPress={() => router.replace("/today")} />
    </Screen>
  );
}
