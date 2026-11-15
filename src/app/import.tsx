import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { bringInState, failedLabel, type BringInResult } from "@/components/onboarding/format";
import { KeeperRow, SkeletonKeeperRow, type RowShot } from "@/components/reveal/KeeperRow";
import { RefundCard } from "@/components/reveal/RefundCard";
import { PsstButton, KEEPERS, text, usePalette, type KeeperId } from "@/components/reveal/kit";
import { ROOM_FOR, REACTION_GAP_MS, REVEAL_ORDER, keepersDue, screenshotsIn } from "@/components/reveal/model";
import { DEV_TOOLS as FIXTURES } from "@/lib/dev-flags";
import { useSync } from "@/lib/sync";

const FIXTURE_SHOT: Record<KeeperId, string> = {
  tock: "Pottery class sign-up",
  penny: "Greenleaf grocery receipt",
  murmur: "Dinner Saturday",
  mote: "Olive butter pasta",
};

const FIXTURE_COUNTS = { deadlines: 3, money: 4, chats: 4, ideas: 4, unsorted: 1 };

export default function BringIn() {
  const p = usePalette();
  // Dev preview: /import?demo=<0..16> drives the reveal from fixtures, only when FIXTURES is on.
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const demoRead = FIXTURES && demo !== undefined ? Math.min(16, Math.max(0, Number(demo) || 0)) : null;
  const liveProgress = useQuery(api.sync.progress, demoRead === null ? {} : "skip");
  const liveRooms = useQuery(api.rooms.list, demoRead === null ? {} : "skip");
  const progress = demoRead === null ? liveProgress : { total: 16, read: demoRead, failed: 0, pending: 16 - demoRead, uploaded: 16 };
  const rooms =
    demoRead === null
      ? liveRooms
      : (Object.entries(FIXTURE_COUNTS).map(([category, count]) => ({ category, count, newest: null })) as NonNullable<typeof liveRooms>);
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

  const state = demoRead === null ? bringInState(result, error) : ({ kind: demoRead >= 16 ? "done" : "working" } as const);
  const total = progress?.total ?? 0;
  const read = progress?.read ?? 0;
  const done = state.kind === "done" && progress !== undefined && progress.pending === 0 && total > 0;

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
    return FIXTURES ? { uri: null, title: FIXTURE_SHOT[id] } : null;
  };
  const unsorted = rooms?.find((r) => r.category === "unsorted")?.count ?? 0;
  const activeId = !done && shown > 0 ? REVEAL_ORDER[shown - 1] : null;
  const barColor = activeId ? KEEPERS[activeId].main : p.ink;
  const allShown = shown >= REVEAL_ORDER.length;

  if (state.kind === "failed") {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
        <View style={styles.center}>
          <Text style={[text.headline, { color: p.ink }]}>{failedLabel(state.failed)}.</Text>
          <Text style={[text.body, { color: p.ink2 }]}>Check your connection and try again. The ones already in are safe.</Text>
        </View>
        <View style={styles.footer}>
          <PsstButton label="Try again" onPress={run} />
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
          <Text style={[text.headline, { color: p.ink }]}>No screenshots to read yet.</Text>
          <Text style={[text.body, { color: p.ink2 }]}>Take a screenshot and Psst reads it.</Text>
        </View>
        <View style={styles.footer}>
          <PsstButton label="Continue" onPress={() => router.replace("/today")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
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
            <RefundCard />
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
              ? `${unsorted} ${unsorted === 1 ? "waits" : "wait"} in Unsorted. You can meet the keepers again in Rooms.`
              : "You can meet the keepers again in Rooms."
            : "Stay, or skip ahead and they keep reading."}
        </Text>
        <PsstButton
          label={done ? "Continue" : "Skip ahead"}
          onPress={() => router.replace(done ? "/keepers-card" : "/today")}
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
