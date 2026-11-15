import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, Character, colors, radii, SpeechBubble, spacing, Sticker, type } from "@/design";
import { formatWhen, lineFor, ROOM_ORDER, roomName, type Room } from "@/components/tabs/helpers";
import { useReminders } from "@/components/tabs/reminders";
import { designRoom, InfoCard, Loading, Notice, Screen, Sheet, useToast } from "@/components/tabs/ui";
import { DEV_TOOLS } from "@/lib/dev-flags";

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotId = id as Id<"screenshots">;
  const shot = useQuery(api.shots.detail, { id: shotId });
  const markOpened = useMutation(api.shots.markOpened);
  const move = useMutation(api.shots.move);
  const retry = useMutation(api.extract.retry);
  const toast = useToast();
  const reminders = useReminders();
  const [moveOpen, setMoveOpen] = useState(false);
  const found = shot !== undefined && shot !== null;

  useEffect(() => {
    if (found) markOpened({ id: shotId }).catch(() => undefined);
  }, [found, shotId, markOpened]);

  const back = (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
      style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xl }}
    >
      <Text style={type.label}>Back</Text>
    </Pressable>
  );

  if (shot === undefined)
    return (
      <Screen>
        {back}
        <Loading label="Opening your screenshot" />
      </Screen>
    );
  if (shot === null)
    return (
      <Screen>
        {back}
        <Notice title="I can't find that one" body="It may have been deleted." actionLabel="Back to Today" onAction={() => router.replace("/(tabs)")} />
      </Screen>
    );

  const category = (shot.category ?? "unsorted") as Room;
  const room = designRoom(category);
  const line = lineFor(shot.lineKey);

  return (
    <Screen>
      {back}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.xl }}>
        <View style={{ alignItems: "center" }}>
          <Sticker tilt={-1} border={6} radius={radii.md}>
            {shot.imageUrl ? (
              <Image source={{ uri: shot.imageUrl }} style={{ width: 240, height: 420 }} contentFit="contain" />
            ) : (
              <View style={{ width: 240, height: 200, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperDeep }}>
                <Text style={type.caption}>Image not available</Text>
              </View>
            )}
          </Sticker>
        </View>

        {shot.status === "failed" ? (
          <InfoCard>
            <Text style={type.heading}>Couldn't read this one</Text>
            <Text style={type.body}>Your screenshot is still on your phone.</Text>
            <Button label="Try again" onPress={() => retry({ screenshotId: shotId })} />
          </InfoCard>
        ) : shot.status !== "ready" ? (
          <Notice room={room} title="Reading this one" body="It will fill in here in a moment." />
        ) : (
          <>
            <View style={{ gap: spacing.sm }}>
              <Text style={type.title}>{shot.title ?? "Screenshot"}</Text>
              {shot.summary ? <Text style={type.body}>{shot.summary}</Text> : null}
            </View>

            <InfoCard>
              <Text style={type.body}>
                Filed in <Text style={type.bodyBold}>{roomName(category)}</Text>
                {shot.reason ? ` because: ${shot.reason}` : ""}
              </Text>
              {shot.userMoved ? <Text style={type.caption}>Moved by you, it will stay where you put it.</Text> : null}
              <Button variant="secondary" label="Move" onPress={() => setMoveOpen(true)} />
            </InfoCard>

            {shot.dates
              .filter((d) => d.confident)
              .map((d) => {
                const on = d.reminder?.state === "scheduled";
                return (
                  <InfoCard key={d.when + d.what}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={type.bodyBold}>{formatWhen(d.when)}</Text>
                        <Text style={type.body}>{d.what}</Text>
                        <Text style={type.caption}>{on ? "Reminder set" : "Remind me"}</Text>
                      </View>
                      <Switch
                        value={on}
                        trackColor={{ true: colors.sun, false: colors.line }}
                        thumbColor={colors.white}
                        accessibilityLabel={`Remind me about ${d.what}`}
                        onValueChange={async (next) => {
                          try {
                            if (next) await reminders.remind(shotId, d.when);
                            else if (d.reminder) await reminders.cancel(d.reminder.id);
                          } catch {
                            toast.show("That didn't work. Try again in a moment.");
                          }
                        }}
                      />
                    </View>
                    {DEV_TOOLS && on ? (
                      <Button
                        variant="secondary"
                        label="Fire now"
                        onPress={async () => {
                          const res = await reminders.fireNow(shotId);
                          Alert.alert("Psst", res.text);
                        }}
                      />
                    ) : null}
                  </InfoCard>
                );
              })}

            {shot.dates.some((d) => !d.confident) ? (
              <Text style={type.caption}>
                Possible date: {shot.dates.filter((d) => !d.confident).map((d) => d.when).join(", ")}. I'm not sure enough to remind you.
              </Text>
            ) : null}

            {line ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Character room={room} size={52} />
                <SpeechBubble tail="left" style={{ flexShrink: 1 }}>{line}</SpeechBubble>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Sheet visible={moveOpen} onClose={() => setMoveOpen(false)} title="Move to">
        {ROOM_ORDER.filter((r) => r !== category).map((r) => (
          <Button
            key={r}
            variant="secondary"
            label={roomName(r)}
            onPress={async () => {
              setMoveOpen(false);
              await move({ id: shotId, category: r }).catch(() => toast.show("That didn't work. Try again in a moment."));
            }}
          />
        ))}
      </Sheet>
      {reminders.sheet}
      {toast.node}
    </Screen>
  );
}
