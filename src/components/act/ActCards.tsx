import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { KeeperFace, KEEPERS, text, usePalette } from "@/design/psst";
import { DEMO_ACTS } from "@/lib/act/scenarios";
import { resetActs, setReminderMoved, useActState } from "@/lib/act/store";
import type { ActScenario } from "@/lib/act/types";
import { useDetectedActs } from "@/lib/act/useDetectedActs";
import { useBigText } from "@/lib/bigText";
import { FIXTURES } from "@/lib/fixtures";
import { ActCard } from "./ActCard";
import { isReminderStep, reminderCopy } from "./pages";
import { Fade } from "./Motion";

function ActRow({ scenario }: { scenario: ActScenario }) {
  const p = usePalette();
  const big = useBigText();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${scenario.noticed} ${scenario.cta}`}
      onPress={() => router.push(`/act/${scenario.id}` as never)}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.hair }}
    >
      <KeeperFace id={scenario.keeper} size={32} />
      <Text numberOfLines={big ? undefined : 2} style={[text.bodyBold, { flex: 1, color: p.ink }]}>{scenario.noticed}</Text>
      <SymbolView
        name="chevron.right"
        size={14}
        tintColor={p.ink3}
        fallback={
          <Svg width={10} height={16} viewBox="0 0 10 16" fill="none" stroke={p.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M2 2l6 6-6 6" />
          </Svg>
        }
      />
    </Pressable>
  );
}

export function ActCards() {
  const p = usePalette();
  const { dismissed, completed, undone } = useActState();
  useEffect(() => {
    if (!FIXTURES) return;
    const sub = AppState.addEventListener("change", (st) => st === "active" && resetActs());
    return () => sub.remove();
  }, []);
  const detected = useDetectedActs();
  const acts = (FIXTURES ? DEMO_ACTS : detected).filter((a) => a.steps.length > 0);
  const [first, ...rest] = acts.filter((a) => !dismissed.has(a.id) && !completed.has(a.id));
  const moved = acts.flatMap((a) => {
    const step = a.steps.find(isReminderStep);
    return step && a !== first && !rest.includes(a) && !undone.has(a.id) ? [{ id: a.id, step, keeper: a.keeper }] : [];
  });
  if (!first && moved.length === 0) return null;
  return (
    <View style={{ gap: 16 }}>
      {first ? (
        <>
          <Text accessibilityRole="header" style={[text.caption, { color: p.ink2 }]}>Ready for you</Text>
          <Fade key={first.id}>
            <ActCard scenario={first} />
          </Fade>
        </>
      ) : null}
      {rest.length > 0 ? (
        <View>
          {rest.map((a) => (
            <ActRow key={a.id} scenario={a} />
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: p.hair }} />
        </View>
      ) : null}
      {moved.map(({ id, step, keeper }) => {
        const copy = reminderCopy(step, KEEPERS[keeper].name);
        return (
          <View key={id} style={{ gap: 0 }}>
            <Text style={[text.body, { color: p.ink }]}>{copy.done}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.undoHint}
              onPress={() => setReminderMoved(id, false)}
              style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
            >
              <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>{copy.undo}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
