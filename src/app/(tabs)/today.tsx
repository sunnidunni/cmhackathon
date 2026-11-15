import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { Button, colors, ScreenshotSticker, spacing, tiltFor, type } from "@/design";
import { formatWhen, type CardActions } from "@/components/tabs/helpers";
import { Todos } from "@/components/tabs/Todos";
import { useReminders } from "@/components/tabs/reminders";
import { InfoCard, Loading, Notice, Screen, TabHeader, tzOffset, useToast } from "@/components/tabs/ui";
import { justInCaption, TodayCard, type TodayCardData } from "@/components/tabs/TodayCard";
import { TOAST_DELETED } from "@/components/tabs/helpers";

export default function Home() {
  const today = useQuery(api.today.get, { tzOffsetMinutes: tzOffset() });
  const done = useMutation(api.shots.done);
  const keep = useMutation(api.shots.keep);
  const remove = useMutation(api.shots.remove);
  const retryAll = useMutation(api.extract.retryAllFailed);
  const reminders = useReminders();
  const toast = useToast();

  async function onAction(action: CardActions["primary"] | CardActions["secondary"], card: TodayCardData) {
    try {
      if (action === "done") await done({ id: card._id });
      else if (action === "keep") await keep({ id: card._id });
      else if (action === "delete") {
        await remove({ id: card._id });
        toast.show(TOAST_DELETED);
      } else if (action === "remind") {
        await reminders.remind(card._id, card.date?.when, card.title);
      } else router.push(`/shot/${card._id}`);
    } catch {
      toast.show("That didn't work. Try again in a moment.");
    }
  }

  return (
    <Screen>
      <TabHeader title="Home" subtitle="Your handful for today" />
      {today === undefined ? (
        <Loading label="Getting today's handful" />
      ) : (
        <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.xxl }}>
          {today.reading.pending > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push("/import")}>
              <InfoCard>
                <Text style={type.heading}>Still reading: {today.reading.read} of {today.reading.total}</Text>
                <Text style={type.caption}>You can look around while I finish.</Text>
              </InfoCard>
            </Pressable>
          ) : null}
          {today.reading.failed > 0 ? (
            <InfoCard>
              <Text style={type.heading}>
                Couldn't read {today.reading.failed} new {today.reading.failed === 1 ? "screenshot" : "screenshots"}
              </Text>
              <Text style={type.body}>Your screenshot is still on your phone.</Text>
              <Button variant="secondary" label="Try again" onPress={() => retryAll({})} />
            </InfoCard>
          ) : null}

          {today.justIn.length > 0 ? (
            <Section title="Just in">
              {today.justIn.map((c) => (
                <TodayCard key={c._id} card={c} caption={justInCaption(c.category)} onAction={onAction} />
              ))}
            </Section>
          ) : null}
          {today.missed.length > 0 ? (
            <Section title="You might have missed">
              {today.missed.map((c) => (
                <TodayCard key={c._id} card={c} onAction={onAction} />
              ))}
            </Section>
          ) : null}
          {today.handful.length > 0 ? (
            <Section title="Brought to you today">
              {today.handful.map((c) => (
                <TodayCard key={c._id} card={c} onAction={onAction} />
              ))}
            </Section>
          ) : null}
          {today.thin ? (
            <Section title="Nothing urgent today">
              <TodayCard card={today.thin} onAction={onAction} />
            </Section>
          ) : null}
          <Todos />
          {today.reminders.length > 0 ? (
            <Section title="Reminders">
              {today.reminders.map((r) => (
                <Pressable
                  key={r.reminderId}
                  accessibilityRole="button"
                  onPress={() => router.push(`/shot/${r.screenshotId}`)}
                  style={{ minHeight: 64 }}
                >
                  <InfoCard>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                      <ScreenshotSticker uri={r.imageUrl ?? undefined} width={40} tilt={tiltFor(r.screenshotId)} />
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={type.heading} numberOfLines={2}>{r.title}</Text>
                        {r.when ? (
                          <Text style={type.caption}>{[formatWhen(r.when), r.what].filter(Boolean).join(", ")}</Text>
                        ) : null}
                      </View>
                    </View>
                  </InfoCard>
                </Pressable>
              ))}
            </Section>
          ) : null}
          {today.resurfaced ? (
            <Section title="Remember this?">
              <TodayCard card={today.resurfaced} onAction={onAction} />
            </Section>
          ) : null}
          {today.cleared ? (
            <View style={{ gap: spacing.lg }}>
              <Notice title="That's today's handful" body="Nothing else needs you right now." />
              <Button label="Browse your rooms" onPress={() => router.navigate("/rooms")} />
            </View>
          ) : null}
        </ScrollView>
      )}
      {reminders.sheet}
      {toast.node}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={[type.title, { color: colors.ink }]}>{title}</Text>
      {children}
    </View>
  );
}
