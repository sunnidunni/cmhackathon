import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Button, colors, RoomBadge, ScreenshotSticker, spacing, tiltFor, type } from "@/design";
import { buttonLabel, cardSubtitle, type CardActions, roomName } from "./helpers";
import { designRoom } from "./ui";

export type TodayCardData = FunctionReturnType<typeof api.today.get>["handful"][number];

export function TodayCard({
  card,
  caption,
  onAction,
}: {
  card: TodayCardData;
  caption?: string;
  onAction: (action: CardActions["primary"] | CardActions["secondary"], card: TodayCardData) => void;
}) {
  const room = designRoom(card.category);
  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${card.title}`}
        onPress={() => router.push(`/shot/${card._id}`)}
        style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}
      >
        <ScreenshotSticker uri={card.imageUrl ?? undefined} width={72} tilt={tiltFor(card._id)} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <RoomBadge room={room} />
          <Text style={type.heading} numberOfLines={3}>{card.title}</Text>
          <Text style={type.caption}>{cardSubtitle(card)}</Text>
          {caption ? <Text style={type.caption}>{caption}</Text> : null}
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label={buttonLabel(card.actions.primary, card.date)} onPress={() => onAction(card.actions.primary, card)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            label={buttonLabel(card.actions.secondary, card.date)}
            onPress={() => onAction(card.actions.secondary, card)}
          />
        </View>
      </View>
    </View>
  );
}

export const justInCaption = (category: string) => `Shots filed this in ${roomName(category)}`;
export { colors };
