import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { KEEPERS, fonts, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";
import { Keeper, KeeperAvatar, type KeeperHandle } from "@/design/keepers-v2";
import { KEEPER_OF_WEEK, RECAP_TOTAL, RECAP_WEEK } from "./data";

const ROOM_LABEL: Record<KeeperId, string> = { tock: "Deadlines", murmur: "Chats", penny: "Money", mote: "Ideas" };

function Kicker({ children }: { children: string }) {
  const p = usePalette();
  return <Text style={[text.caption, styles.kicker, { color: p.ink2 }]}>{children}</Text>;
}

export function TotalCard() {
  const p = usePalette();
  return (
    <View style={styles.card}>
      <Kicker>{`YOUR WEEK · ${RECAP_WEEK.range.toUpperCase()}`}</Kicker>
      <Text style={[styles.big, { color: p.ink }]} maxFontSizeMultiplier={1.3} accessibilityLabel={`${RECAP_TOTAL} screenshots`}>
        {RECAP_TOTAL}
      </Text>
      <Text accessibilityRole="header" style={[text.headline, { color: p.ink }]} maxFontSizeMultiplier={1.6}>
        screenshots found a home this week.
      </Text>
      <Text style={[text.lead, { color: p.ink2, marginTop: 14 }]}>
        {`You were busiest on ${RECAP_WEEK.busiestDay}. Your keepers sorted each one into a room.`}
      </Text>
      <View style={styles.avatars}>
        {RECAP_WEEK.rooms.map((r) => (
          <KeeperAvatar key={r.keeper} name={r.keeper} size={44} />
        ))}
      </View>
    </View>
  );
}

function Bar({ keeper, count, max, active, order }: { keeper: KeeperId; count: number; max: number; active: boolean; order: number }) {
  const p = usePalette();
  const c = useKeeperColors(keeper);
  const reduce = useReducedMotion();
  const grow = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      grow.value = 1;
      return;
    }
    grow.value = active ? withDelay(120 + order * 90, withTiming(1, { duration: 520 })) : 0;
  }, [active, reduce, order, grow]);
  const bar = useAnimatedStyle(() => ({ width: `${(count / max) * 100 * grow.value}%` }));
  return (
    <View style={styles.barRow} accessible accessibilityLabel={`${ROOM_LABEL[keeper]}, ${count} screenshots, kept by ${KEEPERS[keeper].name}`}>
      <KeeperAvatar name={keeper} size={36} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.barLabel}>
          <Text style={[text.bodyBold, { color: p.ink }]}>{ROOM_LABEL[keeper]}</Text>
          <Text style={[styles.barCount, { color: c.deep }]}>{count}</Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: c.tint }]}>
          <Animated.View style={[styles.barFill, { backgroundColor: c.main, borderColor: p.kl }, bar]} />
        </View>
      </View>
    </View>
  );
}

export function RoomsCard({ active }: { active: boolean }) {
  const p = usePalette();
  const max = Math.max(...RECAP_WEEK.rooms.map((r) => r.count));
  return (
    <View style={styles.card}>
      <Kicker>WHERE THEY WENT</Kicker>
      <Text accessibilityRole="header" style={[text.headline, { color: p.ink, marginBottom: 28 }]} maxFontSizeMultiplier={1.6}>
        Four rooms, all a little fuller.
      </Text>
      <View style={{ gap: 22 }}>
        {RECAP_WEEK.rooms.map((r, i) => (
          <Bar key={r.keeper} keeper={r.keeper} count={r.count} max={max} active={active} order={i} />
        ))}
      </View>
    </View>
  );
}

export function KeeperOfWeekCard({ active }: { active: boolean }) {
  const p = usePalette();
  const c = useKeeperColors(KEEPER_OF_WEEK);
  const k = KEEPERS[KEEPER_OF_WEEK];
  const ref = useRef<KeeperHandle>(null);
  const count = RECAP_WEEK.rooms.find((r) => r.keeper === KEEPER_OF_WEEK)?.count ?? 0;
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => ref.current?.play("celebrate"), 350);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <View style={[styles.card, { alignItems: "center" }]}>
      <Kicker>KEEPER OF THE WEEK</Kicker>
      <View style={[styles.halo, { backgroundColor: c.tint }]}>
        <Keeper ref={ref} name={KEEPER_OF_WEEK} size={190} />
      </View>
      <Text accessibilityRole="header" style={[styles.name, { color: p.ink }]} maxFontSizeMultiplier={1.4}>
        {k.name}
      </Text>
      <Text style={[text.lead, { color: p.ink2, textAlign: "center", marginTop: 8 }]}>
        {`Kept ${count} things in ${ROOM_LABEL[KEEPER_OF_WEEK]} this week.`}
      </Text>
      <Text style={[text.voice, { color: c.deep, textAlign: "center", marginTop: 18 }]}>{`“${k.motto}”`}</Text>
    </View>
  );
}

export function ClosingCard() {
  const p = usePalette();
  return (
    <View style={[styles.card, { alignItems: "center" }]}>
      <View style={styles.cast}>
        {RECAP_WEEK.rooms.map((r) => (
          <Keeper key={r.keeper} name={r.keeper} size={74} />
        ))}
      </View>
      <Text accessibilityRole="header" style={[text.headline, { color: p.ink, textAlign: "center" }]} maxFontSizeMultiplier={1.6}>
        {"That's your week."}
      </Text>
      <Text style={[text.lead, { color: p.ink2, textAlign: "center", marginTop: 12 }]}>
        Everything you kept is waiting in its room, whenever you want it.
      </Text>
    </View>
  );
}

export function recapSummary(): string {
  const rooms = RECAP_WEEK.rooms.map((r) => `${ROOM_LABEL[r.keeper]} ${r.count}`).join(", ");
  return `My week with Psst (${RECAP_WEEK.range}): ${RECAP_TOTAL} screenshots filed. ${rooms}. Keeper of the week: ${KEEPERS[KEEPER_OF_WEEK].name}.`;
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 24 },
  kicker: { letterSpacing: 1.4, marginBottom: 12, fontFamily: fonts.uiBold },
  big: { fontFamily: fonts.display, fontSize: 132, lineHeight: 136, letterSpacing: -4 },
  avatars: { flexDirection: "row", gap: 10, marginTop: 28 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  barLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  barCount: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30 },
  barTrack: { height: 14, borderRadius: 7, overflow: "hidden" },
  barFill: { height: 14, borderRadius: 7, borderWidth: 1.5 },
  halo: { width: 250, height: 250, borderRadius: 125, alignItems: "center", justifyContent: "center", marginVertical: 18 },
  name: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1 },
  cast: { flexDirection: "row", gap: 4, marginBottom: 28 },
});
