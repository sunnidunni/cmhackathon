import { useMutation, useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { lineFor, type Room } from "@/components/tabs/helpers";
import { ZoomViewer } from "@/components/tabs/ZoomViewer";
import { dateLabel, defaultReminder, monthDay, reminderLabel } from "@/components/rooms/format";
import { KeeperFace, KeeperLine, PsstButton, ShotSticker, Skeleton, SoftCard, text, useKeeperColors, usePalette, Wash, keeperForRoom, type KeeperId } from "@/components/rooms/kit";
import { MoveSheet } from "@/components/rooms/MoveSheet";
import { ROOM_LABEL } from "@/components/rooms/RoomsParts";

const UNDO_MS = 5000;
type Phase = "idle" | "pending" | "done";

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotId = id as Id<"screenshots">;
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const shot = useQuery(api.shots.detail, { id: shotId });
  const markOpened = useMutation(api.shots.markOpened);
  const markDone = useMutation(api.shots.done);
  const move = useMutation(api.shots.move);
  const retry = useMutation(api.extract.retry);
  const [moveOpen, setMoveOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const found = shot !== undefined && shot !== null;

  useEffect(() => {
    if (found) markOpened({ id: shotId }).catch(() => undefined);
  }, [found, shotId, markOpened]);

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  // There is no undo mutation, so Done waits UNDO_MS before it is written. Leaving the screen writes it at once.
  const commitDone = useCallback(async () => {
    if (phaseRef.current !== "pending") return;
    if (timer.current) clearTimeout(timer.current);
    phaseRef.current = "done";
    setPhase("done");
    await markDone({ id: shotId }).catch(() => {
      phaseRef.current = "idle";
      setPhase("idle");
      setError("That didn't save. Try again in a moment.");
    });
  }, [markDone, shotId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (phaseRef.current === "pending") markDone({ id: shotId }).catch(() => undefined);
    },
    [markDone, shotId],
  );

  const header = <Stack.Screen options={{ headerShown: true, headerTransparent: true, title: "", headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }} />;
  const top = Platform.OS === "ios" ? 8 : 64;

  if (shot === undefined)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        {header}
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingTop: top, gap: 16 }}>
          <Skeleton w="100%" h={260} style={{ borderRadius: 16 }} />
          <Skeleton w={120} h={14} />
          <Skeleton w="90%" h={28} />
          <Skeleton w="100%" h={44} />
        </ScrollView>
      </View>
    );

  if (shot === null)
    return (
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        {header}
        <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
          <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>{"I can't find that screenshot."}</Text>
          <Text style={[text.lead, { color: p.ink2 }]}>It may have been deleted.</Text>
          <PsstButton label="Back to Today" onPress={() => router.replace("/today")} />
        </View>
      </View>
    );

  const category = (shot.category ?? "unsorted") as Room;
  const isRoom = category !== "unsorted";
  const keeper: KeeperId = isRoom ? keeperForRoom(category) : "mote";
  const roomLabel = ROOM_LABEL[category as keyof typeof ROOM_LABEL] ?? "Unsorted";
  const line = lineFor(shot.lineKey);
  const dates = shot.dates.filter((d) => d.confident);
  const withReminder = dates.find((d) => d.reminder?.state === "scheduled");
  const primary = withReminder ?? dates.find((d) => defaultReminder(d.when)) ?? dates[0] ?? null;
  const suggestion = primary && !withReminder ? defaultReminder(primary.when) : null;
  const reminderRow = withReminder?.reminder
    ? reminderLabel(withReminder.reminder.dueAt, withReminder.when)
    : dates.some((d) => d.reminder?.state === "sent")
      ? "Sent"
      : "Off";
  const finished = phase !== "idle";

  const retryNode =
    shot.status === "failed" ? (
      <SoftCard style={{ gap: 8 }}>
        <Text style={[text.bodyBold, { color: p.ink }]}>{"Couldn't read this one."}</Text>
        <Text style={[text.body, { color: p.ink2 }]}>Your screenshot is still on your phone.</Text>
        <PsstButton kind="outline" label="Try reading it again" onPress={() => retry({ screenshotId: shotId }).catch(() => undefined)} />
      </SoftCard>
    ) : shot.status !== "ready" ? (
      <SoftCard>
        <Text style={[text.bodyBold, { color: p.ink }]}>Reading this one.</Text>
        <Text style={[text.body, { color: p.ink2 }]}>It will fill in here in a moment.</Text>
      </SoftCard>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      {header}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingTop: top, paddingBottom: 24, gap: 12 }}>
        <Wash keeper={finished ? "muted" : isRoom ? keeper : "muted"} style={{ paddingVertical: 20, alignItems: "center" }}>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="Open full size"
            disabled={!shot.imageUrl}
            onPress={() => setZoomOpen(true)}
          >
            <ShotSticker uri={shot.imageUrl} title={shot.title || "Screenshot"} size={150} />
          </Pressable>
        </Wash>

        {retryNode}

        {shot.status === "ready" ? (
          <>
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
                {shot.title || "Screenshot"}
              </Text>
              {shot.summary ? <Text style={[text.lead, { color: p.ink }]}>{shot.summary}</Text> : null}
              {shot.amount ? <AmountText keeper={keeper} amount={shot.amount} /> : null}
            </View>

            <View>
              {dates.map((d) => (
                <Row key={d.when + d.what} label={d.what} value={dateLabel(d.when)} />
              ))}
              <Row label="Reminder" value={reminderRow} onPress={() => router.push(`/remind/${shotId}` as never)} chevron />
              <Row
                label={`Filed in ${roomLabel}`}
                value={shot.reason ? `Because ${shot.reason.charAt(0).toLowerCase()}${shot.reason.slice(1)}`.replace(/\.?$/, ".") : shot.userMoved ? "Moved by you." : null}
                action="Move"
                onAction={() => setMoveOpen(true)}
              />
            </View>
            {shot.userMoved ? <Text style={[text.caption, { color: p.ink2 }]}>You moved it, so it stays where you put it.</Text> : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
              <KeeperFace id={keeper} size={36} />
              <View style={{ flex: 1 }}>
                <KeeperLine id={keeper}>{finished ? doneLine(keeper, primary?.when) : (line ?? "")}</KeeperLine>
              </View>
            </View>

            {!finished ? <PsstButton kind="text" label="Mark as done" onPress={() => beginDone()} /> : null}
          </>
        ) : null}
      </ScrollView>

      {shot.status === "ready" ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12), paddingTop: 8, gap: 8 }}>
          {finished ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: p.ink, borderRadius: 10, minHeight: 56, paddingHorizontal: 16, gap: 12 }}>
                <Text style={[text.body, { color: p.paper, flex: 1 }]}>Marked done.</Text>
                {phase === "pending" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (timer.current) clearTimeout(timer.current);
                      setPhaseBoth("idle");
                    }}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text style={[text.bodyBold, { color: p.paper, textDecorationLine: "underline" }]}>Undo</Text>
                  </Pressable>
                ) : null}
              </View>
              <PsstButton
                label={`Back to ${roomLabel}`}
                onPress={async () => {
                  await commitDone();
                  router.back();
                }}
              />
            </>
          ) : withReminder ? (
            <>
              <PsstButton keeper={keeper} label="Mark as done" onPress={() => beginDone()} />
              <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>Marks it done. You can undo right after.</Text>
            </>
          ) : (
            <>
              <PsstButton
                keeper={keeper}
                label={primary ? (suggestion ? `Remind me ${suggestion.short}` : "Remind me") : "Set a reminder"}
                onPress={() => router.push(`/remind/${shotId}` as never)}
              />
              <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
                {suggestion ? `One reminder, ${suggestion.long}. Change it later.` : primary ? "You pick the day and time." : "No reminder unless you set one. You pick the day and time."}
              </Text>
            </>
          )}
          {error ? <Text style={[text.caption, { color: p.danger, textAlign: "center" }]}>{error}</Text> : null}
        </View>
      ) : null}

      <MoveSheet
        visible={moveOpen}
        current={category}
        onClose={() => setMoveOpen(false)}
        onMove={(room) => {
          setMoveOpen(false);
          move({ id: shotId, category: room }).catch(() => setError("That didn't save. Try again in a moment."));
        }}
      />
      {shot.imageUrl ? <ZoomViewer uri={shot.imageUrl} visible={zoomOpen} onClose={() => setZoomOpen(false)} /> : null}
    </View>
  );

  function beginDone() {
    setError(null);
    setPhaseBoth("pending");
    timer.current = setTimeout(() => {
      commitDone();
    }, UNDO_MS);
  }
}

const doneLine = (keeper: KeeperId, when?: string) => (keeper === "tock" && when ? `Done. ${monthDay(when)} is off my mind.` : "Done. Kept, and off your list.");

function AmountText({ keeper, amount }: { keeper: KeeperId; amount: string }) {
  const { deep } = useKeeperColors(keeper);
  return <Text style={[text.bodyBold, { color: deep, fontVariant: ["tabular-nums"] }]}>{amount}</Text>;
}

function Row({ label, value, action, onAction, onPress, chevron }: { label: string; value: string | null; action?: string; onAction?: () => void; onPress?: () => void; chevron?: boolean }) {
  const p = usePalette();
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 60, paddingVertical: 10, borderTopWidth: 1, borderColor: p.hair, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={[text.bodyBold, { color: p.ink }]}>{label}</Text>
        {value ? <Text selectable={!onPress && !action} style={[text.caption, { color: p.ink2 }]}>{value}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>{action}</Text>
        </Pressable>
      ) : null}
      {chevron ? <Text style={[text.body, { color: p.ink3 }]}>›</Text> : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value ?? ""}`} onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}
