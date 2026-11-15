import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { Button, Character, colors, radii, rooms as roomTokens, SketchFrame, spacing, tiltFor, type } from "@/design";
import { roomName, type Room } from "@/components/tabs/helpers";
import { designRoom, InfoCard, Loading, Screen, TabHeader } from "@/components/tabs/ui";
import { usePhotoAccess } from "@/lib/photos";

type Entry = NonNullable<ReturnType<typeof useQuery<typeof api.rooms.list>>>[number];

export default function Rooms() {
  const list = useQuery(api.rooms.list, {});
  const { access, openLimitedPicker } = usePhotoAccess();

  const four = list?.filter((r) => r.category !== "unsorted") ?? [];
  const unsorted = list?.find((r) => r.category === "unsorted");

  return (
    <Screen>
      <TabHeader title="Rooms" />
      {list === undefined ? (
        <Loading label="Opening the rooms" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg }}>
          {access === "limited" ? (
            <InfoCard>
              <Text style={type.heading}>Psst can only see some of your screenshots</Text>
              <Button label="Give access to all screenshots" onPress={() => openLimitedPicker()} />
            </InfoCard>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {four.map((r) => (
              <View key={r.category} style={{ width: "48%", flexGrow: 1 }}>
                <RoomCard entry={r} />
              </View>
            ))}
          </View>
          {unsorted ? <UnsortedRow entry={unsorted} /> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

function RoomCard({ entry }: { entry: Entry }) {
  const room = designRoom(entry.category);
  const tokens = roomTokens[room];
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/room/${entry.category}`)}>
      <SketchFrame
        fill={tokens.tint}
        radius={radii.xl}
        seed={entry.category}
        shadow={{ color: colors.ink, opacity: 1, dy: 4 }}
        style={{ padding: spacing.lg, gap: spacing.sm, minHeight: 190, transform: [{ rotate: `${tiltFor(entry.category, 1)}deg` }] }}
      >
        <Character room={room} size={64} />
        <Text style={type.title}>{roomName(entry.category)}</Text>
        <Text style={[type.bodyBold, { color: colors.ink }]}>{entry.count === 0 ? "Empty for now" : `${entry.count}`}</Text>
        {entry.newest ? (
          <Text style={type.caption} numberOfLines={2}>{entry.newest.title}</Text>
        ) : null}
      </SketchFrame>
    </Pressable>
  );
}

function UnsortedRow({ entry }: { entry: Entry }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/room/${entry.category as Room}`)}>
      <SketchFrame fill={colors.white} radius={radii.lg} seed="unsorted" style={{ padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 72 }}>
        <Character size={44} outline={false} />
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>Unsorted</Text>
          <Text style={type.caption} numberOfLines={1}>{entry.count === 0 ? "Empty for now" : entry.newest?.title ?? ""}</Text>
        </View>
        <Text style={type.heading}>{entry.count > 0 ? entry.count : ""}</Text>
      </SketchFrame>
    </Pressable>
  );
}
