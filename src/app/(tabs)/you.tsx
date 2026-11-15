import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { barSegments, countsLine, fromLine } from "@/components/onboarding/you";
import { designRoom, Loading, Notice, Screen, TabHeader } from "@/components/tabs/ui";
import { Button, Character, colors, radii, rooms, SketchFrame, spacing, type } from "@/design";

export default function You() {
  const you = useQuery(api.you.get, {});

  return (
    <Screen>
      <TabHeader title="You" />
      {you === undefined ? (
        <Loading label="Looking at your screenshots" />
      ) : !you.headline ? (
        <Notice title="Your vibe is coming" body="Once a few more screenshots are in, I'll tell you what they say about you." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm }}>
          <SketchFrame
            fill={colors.white}
            radius={radii.xl}
            seed="you"
            shadow={{ color: colors.ink, opacity: 1, dy: 4 }}
            style={{ padding: spacing.xl, gap: spacing.md, alignItems: "center" }}
          >
            <Text style={type.caption}>{fromLine(you.total)}</Text>
            <Text style={type.label}>So far, you look like</Text>
            <Character size={140} expression="happy" room={you.headline.lead === "mixed" ? undefined : you.headline.lead} />
            <Text style={[type.title, { textAlign: "center" }]}>{you.headline.title}</Text>
            <Text style={[type.body, { textAlign: "center" }]}>{you.headline.sentence}</Text>
            <View style={{ flexDirection: "row", height: 16, alignSelf: "stretch", borderRadius: radii.pill, overflow: "hidden", backgroundColor: colors.paperDeep }}>
              {barSegments(you.counts).map((s) => (
                <View
                  key={s.category}
                  style={{ flex: s.fraction, backgroundColor: rooms[designRoom(s.category)].color }}
                />
              ))}
            </View>
            <Text style={[type.caption, { textAlign: "center" }]}>{countsLine(you.counts)}</Text>
            <Button label="See my rooms" onPress={() => router.navigate("/rooms")} />
          </SketchFrame>
        </ScrollView>
      )}
    </Screen>
  );
}
