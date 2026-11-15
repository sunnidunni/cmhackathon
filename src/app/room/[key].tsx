import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { Character, colors, SpeechBubble, spacing, type } from "@/design";
import { EMPTY_BLURB, formatWhen, lineFor, ROOM_ORDER, roomName, type Room } from "@/components/tabs/helpers";
import { PhotoGrid } from "@/components/tabs/PhotoGrid";
import { designRoom, Loading, Notice, Screen } from "@/components/tabs/ui";

export default function RoomScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return key === "all" ? <AllScreen /> : <SingleRoom roomKey={key} />;
}

function AllScreen() {
  const all = useQuery(api.rooms.all, {});
  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xl }}>
        <Text style={type.label}>Back</Text>
      </Pressable>
      {all === undefined ? (
        <Loading label="Opening all screenshots" />
      ) : (
        <PhotoGrid
          items={all.items.map((i) => ({ ...i, caption: roomName(i.category) }))}
          header={
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Character size={64} />
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>All screenshots</Text>
                  <Text style={type.caption}>{all.count} {all.count === 1 ? "screenshot" : "screenshots"}</Text>
                </View>
              </View>
              {all.items.length === 0 ? <Text style={type.body}>Nothing here yet</Text> : null}
            </>
          }
        />
      )}
    </Screen>
  );
}

function SingleRoom({ roomKey: key }: { roomKey: string }) {
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
        <PhotoGrid
          items={room.items.map((i) => ({ ...i, caption: i.date ? formatWhen(i.date) : null }))}
          header={
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Character room={designRoom(category)} size={64} />
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>{name}</Text>
                  <Text style={type.caption}>{room.count} {room.count === 1 ? "screenshot" : "screenshots"}</Text>
                </View>
              </View>
              {line ? <SpeechBubble tail="bottom-left">{line}</SpeechBubble> : null}
              {room.items.length === 0 ? (
                <Notice room={designRoom(category)} title={`Nothing in ${name} yet`} body={EMPTY_BLURB[category]} />
              ) : null}
            </>
          }
        />
      )}
    </Screen>
  );
}

export { colors };
