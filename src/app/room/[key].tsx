import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { Character, colors, ScreenshotSticker, SpeechBubble, spacing, tiltFor, type } from "@/design";
import { EMPTY_BLURB, formatWhen, lineFor, ROOM_ORDER, roomName, type Room } from "@/components/tabs/helpers";
import { designRoom, Loading, Notice, Screen } from "@/components/tabs/ui";

export default function RoomScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const category = (ROOM_ORDER as string[]).includes(key) ? (key as Room) : "unsorted";
  const room = useQuery(api.rooms.get, { category });
  const name = roomName(category);
  const line = lineFor(room?.newestLineKey);

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xl }}>
        <Text style={type.label}>Back</Text>
      </Pressable>
      {room === undefined ? (
        <Loading label={`Opening ${name}`} room={designRoom(category)} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Character room={designRoom(category)} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{name}</Text>
              <Text style={type.caption}>{room.count} {room.count === 1 ? "screenshot" : "screenshots"}</Text>
            </View>
          </View>
          {line ? <SpeechBubble tail="bottom-left">{line}</SpeechBubble> : null}
          {room.items.length === 0 ? (
            <Notice
              room={designRoom(category)}
              title={`Nothing in ${name} yet`}
              body={EMPTY_BLURB[category]}
            />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "space-between" }}>
              {room.items.map((item) => (
                <Pressable
                  key={item._id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/shot/${item._id}`)}
                  style={{ width: "46%", gap: spacing.sm }}
                >
                  <ScreenshotSticker uri={item.imageUrl ?? undefined} width={120} tilt={tiltFor(item._id)} />
                  <Text style={type.bodyBold} numberOfLines={2}>{item.title}</Text>
                  {item.date ? <Text style={type.caption}>{formatWhen(item.date)}</Text> : null}
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

export { colors };
