import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmPage, DonePage, EditPage, MovePage, ReplyPage, type Edit } from "@/components/act/FlowViews";
import { Fade } from "@/components/act/Motion";
import { buildPages, isFixtureAct, isReminderStep, nextLabel } from "@/components/act/pages";
import { KeeperFace, PsstButton, text, usePalette } from "@/design/psst";
import { effectLabel, realEffectEnd, runEffect, type EffectResult } from "@/lib/act/effects";
import { DEMO_ACTS } from "@/lib/act/scenarios";
import { completeAct, setReminderMoved, useActState } from "@/lib/act/store";
import { getDetectedAct } from "@/lib/act/useDetectedActs";
import { FIXTURES } from "@/lib/fixtures";

const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

export default function Act() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenario = (FIXTURES ? DEMO_ACTS.find((a) => a.id === id) : undefined) ?? getDetectedAct(id);
  const { undone } = useActState();
  const pages = useMemo(() => buildPages(scenario?.steps ?? []), [scenario]);
  const [index, setIndex] = useState(0);
  const [edits, setEdits] = useState<Record<number, Edit>>({});
  const [results, setResults] = useState<Record<number, EffectResult>>({});
  const [openLabels, setOpenLabels] = useState<Record<number, string | null>>({});
  const page = pages[index];
  const fixture = scenario ? isFixtureAct(scenario, FIXTURES) : false;
  const confirmStep = scenario && page?.kind === "confirm" ? scenario.steps[page.step] : undefined;
  const confirmIndex = page?.kind === "confirm" ? page.step : -1;

  useEffect(() => {
    if (fixture || !confirmStep) return;
    let live = true;
    effectLabel(confirmStep).then((label) => live && setOpenLabels((all) => ({ ...all, [confirmIndex]: label })));
    return () => {
      live = false;
    };
  }, [fixture, confirmStep, confirmIndex]);

  useEffect(() => {
    if (scenario && page?.kind === "done") completeAct(scenario.id);
  }, [scenario, page?.kind]);

  if (!scenario)
    return (
      <>
        <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: "center" }}>
          <Text style={[text.headlineCard, { color: p.ink }]}>This one is gone.</Text>
          <Text style={[text.body, { color: p.ink2 }]}>It is no longer on Today.</Text>
          <PsstButton kind="filled" label="Close" onPress={close} />
        </View>
      </>
    );

  const editFor = (i: number): Edit => {
    const s = scenario.steps[i];
    const base = s.kind === "draft-message" || s.kind === "email-draft" ? { body: s.body, subject: s.kind === "email-draft" ? s.subject : "" } : { body: "", subject: "" };
    return edits[i] ?? base;
  };
  const go = (n: number) => setIndex(Math.max(0, Math.min(pages.length - 1, n)));
  const feedback = (kind: "light" | "success") => {
    const run = kind === "success" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    run.catch(() => undefined);
  };

  const body = () => {
    if (page.kind === "done") {
      const lastIndex = scenario.steps.findLastIndex((s) => !isReminderStep(s));
      const end = fixture ? null : realEffectEnd(scenario.steps[lastIndex], results[lastIndex]);
      return <DonePage scenario={scenario} fixture={fixture} end={end} onClose={close} />;
    }
    const step = scenario.steps[page.step];
    if (page.kind === "move" && isReminderStep(step))
      return (
        <MovePage
          scenario={scenario}
          step={step}
          moved={!undone.has(scenario.id)}
          nextLabel={nextLabel(scenario.steps[page.step + 1])}
          onToggle={() => {
            feedback("light");
            setReminderMoved(scenario.id, undone.has(scenario.id));
          }}
          onNext={() => go(index + 1)}
        />
      );
    if (page.kind === "edit")
      return <EditPage scenario={scenario} step={step} edit={editFor(page.step)} fixture={fixture} onChange={(e) => setEdits((all) => ({ ...all, [page.step]: e }))} onNext={() => go(index + 1)} />;
    if (page.kind === "confirm")
      return (
        <ConfirmPage
          scenario={scenario}
          step={step}
          final={page.final}
          edit={editFor(page.step)}
          fixture={fixture}
          onEdit={() => go(index - 1)}
          openLabel={openLabels[page.step] ?? null}
          onConfirm={async () => {
            const live = fixture || openLabels[page.step];
            const result: EffectResult = live ? await runEffect(step, editFor(page.step)) : "fallback";
            setResults((all) => ({ ...all, [page.step]: result }));
            feedback(fixture || result === "done" ? "success" : "light");
            go(index + 1);
          }}
        />
      );
    if (page.kind === "reply" && step.kind === "draft-message") {
      const next = scenario.steps[page.step + 1];
      return <ReplyPage scenario={scenario} step={step} edit={editFor(page.step)} fixture={fixture} nextLabel={next?.kind === "order" ? "Set up the order" : nextLabel(next)} onNext={() => go(index + 1)} />;
    }
    return null;
  };

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: p.paper }}>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <KeeperFace id={scenario.keeper} size={32} />
              <Text style={[text.caption, { color: p.ink2 }]}>{fixture ? "" : page.kind === "done" ? "Finished" : `Step ${index + 1} of ${pages.length - 1}`}</Text>
            </View>
            {page.kind !== "done" ? <PsstButton kind="text" label="Close" onPress={close} /> : null}
          </View>
          <Fade key={index}>{body()}</Fade>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
