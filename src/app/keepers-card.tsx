import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { KEEPERS, SHOT_ART, Keeper, PsstButton, Skeleton, text, usePalette, type KeeperId } from "@/design/psst";
import { ROOM_FOR, screenshotsIn, stampLabel } from "@/components/reveal/model";
import { StampSeal } from "@/components/reveal/StampSeal";
import { DEMO_COUNTS, FIXTURES } from "@/lib/fixtures";

const GRID: KeeperId[] = ["tock", "murmur", "penny", "mote"];
const FIXTURE_COUNTS = { deadlines: DEMO_COUNTS.tock, chats: DEMO_COUNTS.murmur, money: DEMO_COUNTS.penny, ideas: DEMO_COUNTS.mote, unsorted: DEMO_COUNTS.unsorted };

export default function KeepersCard() {
  const p = usePalette();
  const dark = useColorScheme() === "dark";
  // Dev preview: /keepers-card?demo=1 skips the live queries and shows the fixture counts, only when FIXTURES is on.
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const preview = FIXTURES && demo !== undefined;
  const liveRooms = useQuery(api.rooms.list, preview ? "skip" : {});
  const progress = useQuery(api.sync.progress, preview ? "skip" : {});
  const rooms = preview ? [] : liveRooms;

  const real: Record<string, number> | null = rooms ? Object.fromEntries(rooms.map((r) => [r.category, r.count])) : null;
  const hasReal = rooms?.some((r) => r.count > 0) ?? false;
  const fixtureCounts: Record<string, number> = FIXTURE_COUNTS;
  const counts = real && (hasReal || !FIXTURES) ? real : real ? fixtureCounts : null;
  const countOf = (id: KeeperId) => (counts ? (counts[ROOM_FOR[id]] ?? 0) : null);
  const unsorted = counts?.unsorted ?? 0;
  const ready = GRID.reduce((n, id) => n + (countOf(id) ?? 0), 0) + unsorted;
  const useFixtures = FIXTURES && !hasReal;
  const read = useFixtures ? DEMO_COUNTS.read : (progress?.read ?? ready);
  const total = useFixtures ? DEMO_COUNTS.total : (progress?.total ?? ready);
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.paper }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: dark ? p.white : SHOT_ART.cream, borderColor: p.hair }]}>
          <Text style={[text.caption, { color: p.ink2, letterSpacing: 1.2 }]}>{`PSST · ${day}`}</Text>
          <Text accessibilityRole="header" style={[text.headline, { color: p.ink, fontSize: 38, lineHeight: 41, marginTop: 8, width: 160 }]}>
            Your keepers.
          </Text>
          <View style={styles.stamp}>
            {counts ? <StampSeal count={total} label={stampLabel(total, now)} /> : null}
          </View>
          <View style={styles.grid}>
            {GRID.map((id) => {
              const n = countOf(id);
              return (
                <View key={id} style={styles.cell} accessible accessibilityLabel={`${KEEPERS[id].name}, ${n === null ? "counting" : screenshotsIn(n)}`}>
                  <Keeper id={id} size={92} />
                  <Text style={[text.bodyBold, { color: p.ink, marginTop: 8 }]}>{KEEPERS[id].name}</Text>
                  {n === null ? <Skeleton w={72} h={10} style={{ marginTop: 6 }} /> : <Text style={[text.caption, { color: p.ink2 }]}>{screenshotsIn(n)}</Text>}
                </View>
              );
            })}
          </View>
          {counts ? (
            <Text style={[text.caption, { color: p.ink2, textAlign: "center", marginTop: 16 }]}>
              {`${read} read${unsorted > 0 ? ` · ${unsorted} in Unsorted` : ""}`}
            </Text>
          ) : (
            <Skeleton w={140} h={10} style={{ alignSelf: "center" }} />
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PsstButton kind="filled" label="Continue" onPress={() => router.replace("/today")} />
        <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>The card shows your keepers and counts. Never your screenshots.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingTop: 12 },
  card: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 18, paddingBottom: 20 },
  stamp: { position: "absolute", top: 8, right: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20, rowGap: 22 },
  cell: { width: "50%", alignItems: "center" },
  footer: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
});
