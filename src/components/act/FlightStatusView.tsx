import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { KeeperLine, PsstButton, SoftCard, text, useKeeperColors, usePalette, Wash } from "@/design/psst";
import { EU261_CLAIM_ACT_ID, FLIGHT, FLIGHT_UPDATES, UPDATE_EVERY_MS } from "@/lib/act/scenarios/flightStatus";
import { Fade } from "./Motion";

function LiveDot({ live }: { live: boolean }) {
  const c = useKeeperColors("tock");
  const p = usePalette();
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = live && !reduce ? withRepeat(withTiming(0.3, { duration: 700 }), -1, true) : withTiming(1, { duration: 150 });
    return () => cancelAnimation(o);
  }, [live, reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: live ? c.main : p.ink3 }, style]} />;
}

function Field({ label, value, was, strong }: { label: string; value: string; was?: string; strong?: boolean }) {
  const p = usePalette();
  const c = useKeeperColors("tock");
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[text.caption, { color: p.ink2 }]}>{label}</Text>
      <Text style={[text.bodyBold, { fontSize: strong ? 22 : 18, lineHeight: strong ? 27 : 23, color: strong ? c.deep : p.ink }]}>{value}</Text>
      {was ? <Text style={[text.caption, { color: p.ink2, textDecorationLine: "line-through" }]}>{was}</Text> : null}
    </View>
  );
}

export function FlightStatusView({ onClose, startAt = 0 }: { onClose: () => void; startAt?: number }) {
  const p = usePalette();
  const last = FLIGHT_UPDATES.length - 1;
  const [at, setAt] = useState(Math.min(startAt, last));
  const prev = useRef(at);
  const u = FLIGHT_UPDATES[at];
  const done = at === last;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setAt((n) => n + 1), UPDATE_EVERY_MS);
    return () => clearTimeout(t);
  }, [at, done]);

  useEffect(() => {
    if (prev.current === at) return;
    prev.current = at;
    const run = done ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    run.catch(() => undefined);
    AccessibilityInfo.announceForAccessibility(`${FLIGHT.number} now delayed ${u.delay}. Departs ${u.departs}, gate ${u.gate}.`);
  }, [at, done, u]);

  const gateWas = FLIGHT_UPDATES.slice(0, at).find((x) => x.gate !== u.gate)?.gate;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>{`${FLIGHT.number} is delayed ${u.delay}`}</Text>
        <Text style={[text.body, { color: p.ink2 }]}>{`${FLIGHT.airline} · ${FLIGHT.from.city} to ${FLIGHT.to.city}`}</Text>
      </View>

      <Wash keeper="tock" style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={[text.largeTitle, { color: p.ink }]}>{FLIGHT.from.code}</Text>
          <View style={{ flex: 1, height: 1.5, marginHorizontal: 12, backgroundColor: p.hair2 }} />
          <Text style={[text.largeTitle, { color: p.ink }]}>{FLIGHT.to.code}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Field label="New departure" value={u.departs} was={FLIGHT.scheduled} strong />
          <Field label="Gate" value={u.gate} was={gateWas} strong={!!gateWas} />
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Field label="Scheduled" value={FLIGHT.scheduled} />
          <Field label="Lands in SFO" value={u.arrives} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LiveDot live={!done} />
          <Text style={[text.caption, { color: p.ink2 }]}>{done ? "Updated just now · Tock keeps watching" : "Updated just now · checking again"}</Text>
        </View>
      </Wash>

      <SoftCard style={{ gap: 10 }}>
        {FLIGHT_UPDATES.slice(0, at + 1)
          .map((x, i) => ({ x, i }))
          .reverse()
          .map(({ x, i }) => (
            <Fade key={i}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text style={[text.bodyBold, { width: 92, color: i === at ? p.ink : p.ink2 }]}>{`+${x.delay}`}</Text>
                <Text style={[text.body, { flex: 1, color: i === at ? p.ink : p.ink2 }]}>{x.note}</Text>
              </View>
            </Fade>
          ))}
      </SoftCard>

      {done ? (
        <Fade>
          <View style={{ gap: 12 }}>
            <KeeperLine id="tock">That&apos;s 6 hours now, well past the 3-hour mark. On a flight leaving the EU, you may be able to claim compensation under EU 261.</KeeperLine>
            <PsstButton
              kind="filled"
              keeper="tock"
              label="Start an EU 261 claim"
              onPress={() => router.push(`/act/${EU261_CLAIM_ACT_ID}` as never)}
            />
            <PsstButton kind="text" label="Not now" onPress={onClose} />
          </View>
        </Fade>
      ) : null}
    </View>
  );
}
