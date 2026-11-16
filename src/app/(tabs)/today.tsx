import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { AccessibilityInfo, Alert, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ActCards } from "@/components/act/ActCards";
import { ReminderRows, RememberCard } from "@/components/today/Extras";
import { FocusCard, Headline } from "@/components/today/FocusCard";
import { HandfulRows } from "@/components/today/HandfulRows";
import { PsstButton, text, usePalette } from "@/design/psst";
import { DEMO_FLYER, DEMO_SHOTS, FIXTURES } from "@/lib/fixtures";
import { actionsFor, buildScreen, captionFor, extraReminders, toItem, type Item } from "@/components/today/model";
import { TodoSection } from "@/components/today/TodoSection";
import { previewToday, previewTodos } from "@/components/today/preview";
import { Rise } from "@/components/today/Rise";
import { DoneView, EmptyView, FailedLine, LoadingView, ReadingView } from "@/components/today/States";
import { sameMemory, withSkipped } from "@/components/today/focus";
import { useFocusMemory } from "@/components/today/focusMemory";
import { runSync } from "@/lib/sync";

// Fixtures fill a keeper line only when the card has none and FIXTURES is on.
const fixtureLine = FIXTURES
  ? (title: string) => [...DEMO_SHOTS, DEMO_FLYER].find((s) => s.title.toLowerCase() === title.toLowerCase())?.keeperLine ?? null
  : undefined;

const asId = (id: string) => id as Id<"screenshots">;

function Header() {
  const p = usePalette();
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setSolid, () => undefined);
  }, []);
  const glass = !solid && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const icon = (
    <SymbolView
      name="gearshape"
      size={22}
      tintColor={p.ink}
      fallback={
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={1.8} strokeLinecap="round">
          <Path d="M4 8h9M19 8h1M4 16h1M11 16h9" />
          <Circle cx={16} cy={8} r={2.4} />
          <Circle cx={8} cy={16} r={2.4} />
        </Svg>
      }
    />
  );
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => router.push("/settings")}
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      {icon}
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
      <Text accessibilityRole="header" allowFontScaling={false} style={[text.headline, { fontSize: 24, color: p.ink }]}>
        Psst
      </Text>
      {glass ? (
        <GlassView isInteractive style={{ width: 44, height: 44, borderRadius: 22 }}>
          {button}
        </GlassView>
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair }}>{button}</View>
      )}
    </View>
  );
}

export default function Today() {
  const p = usePalette();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const tz = new Date().getTimezoneOffset();
  const live = useQuery(api.today.get, { tzOffsetMinutes: tz });
  const demo = FIXTURES && preview ? previewToday(preview, tz) : null;
  const today = demo ? demo.data : live;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const now = demo ? demo.now : clock;
  const done = useMutation(api.shots.done);
  const keep = useMutation(api.shots.keep);
  const remove = useMutation(api.shots.remove);
  const retryAll = useMutation(api.extract.retryAllFailed);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [focusMemory, saveFocus] = useFocusMemory();
  const { screen, memory } = buildScreen(focusMemory === undefined ? undefined : today, skipped, fixtureLine, focusMemory ?? null);
  useEffect(() => {
    if (!demo && memory && !sameMemory(memory, focusMemory)) saveFocus(memory);
  }, [demo, memory, focusMemory, saveFocus]);
  const rendered = screen.kind === "focus" ? [screen.focus, ...screen.rows] : screen.kind === "reading" || screen.kind === "done" ? screen.rows : [];
  const reminderRows = today ? extraReminders(today, rendered) : [];
  const resurfaced = today?.resurfaced && !skipped.has(today.resurfaced._id) ? toItem(today.resurfaced, "thin", fixtureLine) : null;

  const checkForNew = async () => {
    setRefreshing(true);
    await runSync().catch(() => setFailed(true));
    setRefreshing(false);
  };

  const run = async (work: () => Promise<unknown>) => {
    setFailed(false);
    setRemoved(false);
    if (demo) return;
    try {
      await work();
    } catch {
      setFailed(true);
    }
  };
  const skip = (item: Item) => {
    setSkipped((s) => new Set(s).add(item.id));
    if (!demo && today) saveFocus(withSkipped(focusMemory, today.day, item.id));
  };
  const open = (item: Item) => router.push(`/shot/${item.id}`);
  const remind = (item: Item) => router.push(`/remind/${item.id}` as never);
  const act = (item: Item, kind: ReturnType<typeof actionsFor>["primaryKind"] | ReturnType<typeof actionsFor>["secondaryKind"]) => {
    if (kind === "remind") return remind(item);
    if (kind === "see") return open(item);
    if (kind === "skip") return skip(item);
    if (kind === "keep") return run(() => keep({ id: asId(item.id) }));
    return run(() => done({ id: asId(item.id) }));
  };
  const confirmRemove = (item: Item, title: string) =>
    Alert.alert(title, "This takes it out of Rooms, Ask and reminders. Your original screenshot stays in Photos.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          run(async () => {
            await remove({ id: asId(item.id) });
            setRemoved(true);
          }),
      },
    ]);
  const menu = (item: Item) =>
    Alert.alert(item.title, undefined, [
      item.actions.primary === "remind" ? { text: "Remind me", onPress: () => remind(item) } : { text: "Not today", onPress: () => skip(item) },
      { text: "Delete from Psst", style: "destructive" as const, onPress: () => confirmRemove(item, "Delete from Psst?") },
      { text: "Cancel", style: "cancel" as const },
    ]);

  const rows = rendered.filter((i) => screen.kind !== "focus" || i !== screen.focus);
  const rowTitle = screen.kind === "focus" || screen.kind === "reading" ? "Also in today's handful" : undefined;
  const footer =
    screen.kind === "done" ? (
      <PsstButton kind="filled" label="Browse your rooms" onPress={() => router.navigate("/rooms")} />
    ) : screen.kind === "empty" ? (
      <View style={{ gap: 12 }}>
        <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
          {"We only read your Screenshots album. Your other photos stay on your phone. Delete everything anytime in Settings."}
        </Text>
        <PsstButton kind="filled" label="Pick screenshots" onPress={() => router.push("/bring")} />
        <PsstButton kind="text" label="Check for new screenshots" onPress={checkForNew} />
      </View>
    ) : null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={checkForNew} />}
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16, justifyContent: footer ? "space-between" : "flex-start" }}>
        <View style={{ gap: 16 }}>
          <Header />
          {screen.kind === "loading" ? <LoadingView /> : null}
          {screen.kind === "reading" ? (
            <Pressable accessibilityRole="button" accessibilityHint="Shows reading progress" onPress={() => router.push("/import")}>
              <ReadingView pending={screen.pending} />
            </Pressable>
          ) : null}
          {screen.kind === "empty" ? <EmptyView /> : null}
          {screen.kind === "focus" ? (
            <Rise key={screen.focus.id}>
              <View style={{ gap: 8, marginBottom: 16 }}>
                <Headline item={screen.focus} now={now} tz={tz} />
                <Text style={[text.body, { color: p.ink2 }]}>{captionFor(screen)}</Text>
              </View>
              <FocusCard
                item={screen.focus}
                now={now}
                tz={tz}
                onOpen={() => open(screen.focus)}
                onPrimary={() => act(screen.focus, actionsFor(screen.focus, now, tz).primaryKind)}
                onSecondary={() => act(screen.focus, actionsFor(screen.focus, now, tz).secondaryKind)}
                onRemoveReading={() => confirmRemove(screen.focus, "Remove this reading?")}
              />
            </Rise>
          ) : null}
          {screen.kind === "done" ? <DoneView /> : null}
          <HandfulRows rows={rows} now={now} tz={tz} title={rowTitle} onOpen={open} onRemind={remind} onSkip={skip} onMenu={menu} />
          <ActCards />
          <ReminderRows rows={reminderRows} now={now} tz={tz} onOpen={(id) => router.push(`/shot/${id}`)} />
          {resurfaced ? (
            <RememberCard item={resurfaced} onOpen={() => open(resurfaced)} onKeep={() => act(resurfaced, "keep")} onDelete={() => confirmRemove(resurfaced, "Delete from Psst?")} />
          ) : null}
          <TodoSection day={today?.day} shown={rendered.map((i) => i.id)} demo={FIXTURES && preview ? previewTodos(preview) : null} />
          {removed ? <Text accessibilityLiveRegion="polite" style={[text.caption, { color: p.ink2, textAlign: "center" }]}>Reading removed from Psst. Your original screenshot stays in Photos.</Text> : null}
          {failed ? <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{"That didn't work. Try again in a moment."}</Text> : null}
          {today && today.reading.failed > 0 ? <FailedLine count={today.reading.failed} onRetry={() => run(() => retryAll({}))} /> : null}
        </View>
        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}
