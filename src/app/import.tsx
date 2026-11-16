import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { bringInState, failedLabel, type BringInResult } from "@/components/onboarding/format";
import { KeeperRow, SkeletonKeeperRow, type RowShot } from "@/components/reveal/KeeperRow";
import { FoundCard } from "@/components/reveal/FoundCard";
import { PsstButton, KEEPERS, text, usePalette, type KeeperId } from "@/design/psst";
import { FIXTURE_SHOT } from "@/components/reveal/demo-shots";
import { ROOM_FOR, REACTION_GAP_MS, REVEAL_ORDER, keepersDue, screenshotsIn } from "@/components/reveal/model";
import { DEMO_COUNTS, FIXTURES } from "@/lib/fixtures";
import { useSync } from "@/lib/sync";


const FIXTURE_COUNTS = { deadlines: DEMO_COUNTS.tock, money: DEMO_COUNTS.penny, chats: DEMO_COUNTS.murmur, ideas: DEMO_COUNTS.mote, unsorted: DEMO_COUNTS.unsorted };

export default function BringIn() {
  const p = usePalette();
  // Dev preview: /import?demo=<0..24> drives the reveal from fixtures, only when FIXTURES is on.
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  // /import?demo=play counts 0 to 24 on its own, about 0.7s per screenshot, for the onboarding replay.
  const [played, setPlayed] = useState(0);
  const playing = FIXTURES && demo === "play";
  useEffect(() => {
    if (!playing || played >= DEMO_COUNTS.total) return;
    const timer = setTimeout(() => setPlayed((n) => n + 1), 700);
    return () => clearTimeout(timer);
  }, [playing, played]);
  const demoRead = FIXTURES && demo !== undefined ? (playing ? played : Math.min(DEMO_COUNTS.total, Math.max(0, Number(demo) || 0))) : null;
  const liveProgress = useQuery(api.sync.progress, demoRead === null ? {} : "skip");
  const liveRooms = useQuery(api.rooms.list, demoRead === null ? {} : "skip");
  const progress = demoRead === null ? liveProgress : { total: DEMO_COUNTS.total, read: demoRead, failed: 0, pending: DEMO_COUNTS.total - demoRead, uploaded: DEMO_COUNTS.total };
  const rooms =
    demoRead === null
      ? liveRooms
      : (Object.entries(FIXTURE_COUNTS).map(([category, count]) => ({ category, count: Math.ceil((count * demoRead) / DEMO_COUNTS.total), newest: null })) as NonNullable<typeof liveRooms>);
  const { syncNow } = useSync();
  const [result, setResult] = useState<BringInResult | null>(null);
  const [error, setError] = useState(false);
  const started = useRef(false);

  const run = useCallback(() => {
    setResult(null);
    setError(false);
    syncNow().then(setResult, () => setError(true));
  }, [syncNow]);

  useEffect(() => {
    if (started.current || demoRead !== null) return;
    started.current = true;
    run();
  }, [run, demoRead]);

  const state = demoRead === null ? bringInState(result, error) : ({ kind: demoRead >= DEMO_COUNTS.total ? "done" : "working" } as const);
  const total = progress?.total ?? 0;
  const read = progress?.read ?? 0;
  const done = state.kind === "done" && progress !== undefined && progress.pending === 0 && total > 0;

  useEffect(() => {
    if (done) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [done]);

  const due = keepersDue(read, done);
  const [shown, setShown] = useState(0);
  const lastPop = useRef(0);
  useEffect(() => {
    if (shown >= due) return;
    const wait = shown === 0 ? 0 : Math.max(0, lastPop.current + REACTION_GAP_MS - Date.now());
    const timer = setTimeout(() => {
      lastPop.current = Date.now();
      setShown((n) => n + 1);
    }, wait);
    return () => clearTimeout(timer);
  }, [shown, due]);

  const roomFor = (id: KeeperId) => rooms?.find((r) => r.category === ROOM_FOR[id]);
  const shotFor = (id: KeeperId): RowShot | null => {
    const newest = roomFor(id)?.newest;
    if (newest) return { uri: newest.imageUrl, title: newest.title };
    return FIXTURES ? FIXTURE_SHOT[id] : null;
  };
  const unsorted = rooms?.find((r) => r.category === "unsorted")?.count ?? 0;
  const activeId = !done && shown > 0 ? REVEAL_ORDER[shown - 1] : null;
  const barColor = activeId ? KEEPERS[activeId].main : p.ink;
  const allShown = shown >= REVEAL_ORDER.length;

  if (state.kind === "failed") {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
        <View style={styles.center}>
          <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>{failedLabel(state.failed)}.</Text>
          <Text style={[text.body, { color: p.ink2 }]}>Check your connection and try again. The ones already in are still here.</Text>
        </View>
        <View style={styles.footer}>
          <PsstButton kind="filled" label="Try again" onPress={run} />
          <PsstButton kind="text" label="Go to Today" onPress={() => router.replace("/today")} />
        </View>
      </SafeAreaView>
    );
  }

  const empty = state.kind === "done" && progress !== undefined && progress.pending === 0 && total === 0;
  if (empty) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
        <View style={styles.center}>
          <Text maxFontSizeMultiplier={1.67} style={[text.headline, { color: p.ink }]}>No screenshots to read yet.</Text>
          <Text style={[text.body, { color: p.ink2 }]}>Take a screenshot and Psst reads it.</Text>
        </View>
        <View style={styles.footer}>
          <PsstButton kind="filled" label="Continue" onPress={() => router.replace("/today")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
          {done ? `${screenshotsIn(total)} in.\nMeet your keepers.` : "Reading your screenshots."}
        </Text>
        {done ? null : (
          <>
            <Text style={[text.body, { color: p.ink2, marginTop: 8 }]}>{progress ? `${read} of ${total} read.` : " "}</Text>
            <View style={[styles.track, { backgroundColor: p.fill2 }]}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: barColor, width: `${total > 0 ? Math.round((read / total) * 100) : 0}%` }} />
            </View>
          </>
        )}
        {done && allShown && FIXTURES ? (
          <View style={{ marginTop: 20 }}>
            <FoundCard />
          </View>
        ) : null}
        <View style={{ marginTop: done ? 20 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.hair }}>
          {REVEAL_ORDER.map((id, i) =>
            i < shown ? (
              <KeeperRow key={id} id={id} count={roomFor(id)?.count ?? null} done={done} active={activeId === id} shot={shotFor(id)} />
            ) : (
              <SkeletonKeeperRow key={id} />
            ),
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
          {done
            ? unsorted > 0
              ? unsorted === 1 ? "1 couldn't be read. It's in Unsorted, and you decide where it goes." : `${unsorted} couldn't be read. They're in Unsorted, and you decide where they go.`
              : "You can meet the keepers again in Rooms."
            : "You can go to Today while they read. No notification is sent when it finishes."}
        </Text>
        <PsstButton kind="filled"
          label={done ? "See your keepers card" : "Skip to Today"}
          onPress={() => router.replace(done ? (demoRead === null ? "/keepers-card" : "/keepers-card?demo=1") : "/today")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingTop: 24 },
  track: { height: 4, borderRadius: 2, marginTop: 14 },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: 16, gap: 12 },
  footer: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
});
