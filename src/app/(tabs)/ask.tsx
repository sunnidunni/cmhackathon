import { useAction, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { AnswerBlock, FailedBlock, LookingBlock, QuestionBubble, type AskResult, type OnAsk, type Shots } from "@/components/ask/AnswerBlock";
import { fixtureNextAnswer } from "@/components/ask/askNext";
import { Composer } from "@/components/ask/Composer";
import { demoResult, demoShots } from "@/components/ask/demo";
import { DEMO_STARTERS, EmptyAsk } from "@/components/ask/EmptyAsk";
import { FIXTURE_SUGGESTIONS, fixtureAnswer } from "@/components/ask/fixtureAsk";
import { fixtureAnswerFits, isSamBookQuestion, shownQuestion, withFocus } from "@/components/ask/focus";
import { SuggestionChips } from "@/components/ask/SuggestionChips";
import { visibleChips } from "@/components/ask/suggestions";
import { useFocusMemory } from "@/components/today/focusMemory";
import { buildScreen } from "@/components/today/model";
import { text, usePalette } from "@/design/psst";
import { DEMO_COUNTS, DEMO_FLYER, FIXTURES } from "@/lib/fixtures";
import { isOffline } from "@/lib/offline";
import { useSafeQuery } from "@/lib/useSafeQuery";

type Exchange = FunctionReturnType<typeof api.ask.history>[number];
type About = Parameters<OnAsk>[1];
type Pending = { question: string; sent: string; status: "looking" | "failed" | "done"; sentAt: number; result?: AskResult & { questionId: string }; demo?: boolean; shots?: Shots; about?: About };

export default function Ask() {
  const p = usePalette();
  const history = useSafeQuery(api.ask.history, {}, []);
  // How many screenshots have been read. The import progress has that number, and it is a far smaller answer than the library.
  const progress = useSafeQuery(api.sync.progress, {}, { total: DEMO_COUNTS.read, read: DEMO_COUNTS.read, failed: 0, pending: 0, uploaded: DEMO_COUNTS.read });
  const today = useSafeQuery(api.today.get, { tzOffsetMinutes: new Date().getTimezoneOffset() }, undefined);
  const [focusMemory] = useFocusMemory();
  const { screen } = buildScreen(focusMemory === undefined ? undefined : today, new Set(), undefined, focusMemory ?? null);
  const focusTitle = screen.kind === "focus" ? screen.focus.title : null;
  const askAction = useAction(api.ask.ask);
  const own = useQuery(api.ask.suggestions, FIXTURES ? "skip" : {});
  const starters = FIXTURES ? DEMO_STARTERS : (own ?? []).map((s) => s.question);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [slowFor, setSlowFor] = useState<number | null>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const insets = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardUp(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Sample-data answers (fixtures on, no real answer): the flyer for pottery or a bare "that", else the chip's own screenshot.
  // A follow-up about one screenshot only takes that screenshot's own sample answer, never another one's.
  const fixtureFor = (q: string, about?: About) => {
    if (!FIXTURES) return null;
    if (about) {
      const answer = fixtureNextAnswer(q, about.shotId);
      return answer ? { result: { ...demoResult, answer }, shots: demoShots } : null;
    }
    return fixtureAnswerFits(q, focusTitle, DEMO_FLYER.title, FIXTURES) ? { result: demoResult, shots: demoShots } : fixtureAnswer(q);
  };

  // `about` is set for an Ask next chip: the question is about that answer's screenshot, not Today's focus.
  async function send(question: string, about?: About) {
    const q = question.trim();
    if (!q || pending?.status === "looking") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setInput("");
    setAsked((a) => [...a, q]);
    const sentAt = Date.now();
    const sent = about ? `${q} (about: ${about.title})` : withFocus(q, focusTitle);
    setPending({ question: q, sent, status: "looking", sentAt, about });
    const nextAnswer = about && (FIXTURES || isOffline()) ? fixtureFor(q, about) : null;
    if (nextAnswer) {
      setPending({ question: q, sent, status: "done", sentAt, result: { ...nextAnswer.result, questionId: "demo" }, demo: true, shots: nextAnswer.shots, about });
      return;
    }
    const sam = FIXTURES && !about && isSamBookQuestion(q) ? fixtureAnswer(q) : null;
    if (sam) {
      setPending({ question: q, sent, status: "done", sentAt, result: { ...sam.result, questionId: "demo" }, demo: true, shots: sam.shots });
      return;
    }
    const instant = FIXTURES && !about ? fixtureFor(q) : null;
    if (instant) {
      setPending({ question: q, sent, status: "done", sentAt, result: { ...instant.result, questionId: "demo" }, demo: true, shots: instant.shots });
      return;
    }
    if (isOffline()) {
      const fixture = fixtureFor(q, about);
      const result = fixture ? { ...fixture.result, questionId: "demo" } : { answer: "I can't reach your screenshots right now.", found: false, sources: [], questionId: "offline" };
      setPending({ question: q, sent, status: "done", sentAt, result, demo: fixture !== null, shots: fixture?.shots, about });
      return;
    }
    setTimeout(() => setSlowFor(sentAt), 400);
    try {
      const result = await askAction({ question: sent });
      const fixture = !result.found || result.sources.length === 0 ? fixtureFor(q, about) : null;
      if (fixture) {
        setPending({ question: q, sent, status: "done", sentAt, result: { ...fixture.result, questionId: "demo" }, demo: true, shots: fixture.shots, about });
        return;
      }
      setPending({ question: q, sent, status: "done", sentAt, result, about });
    } catch {
      const fixture = FIXTURES ? (fixtureFor(q, about) ?? (about ? null : { result: demoResult, shots: demoShots })) : null;
      if (fixture) setPending({ question: q, sent, status: "done", sentAt, result: { ...fixture.result, questionId: "demo" }, demo: true, shots: fixture.shots, about });
      else setPending({ question: q, sent, status: "failed", sentAt, about });
    }
  }

  const isPendingRow = (ex: Exchange) => pending !== null && ex.question === pending.sent && ex.createdAt >= pending.sentAt - 5000;
  const exchanges: Exchange[] = (history ?? []).filter((ex) => !(pending?.demo && isPendingRow(ex)));
  const synced =
    pending !== null &&
    !pending.demo &&
    pending.status !== "failed" &&
    exchanges.some((ex) => ex._id === pending.result?.questionId || (ex.question === pending.sent && ex.createdAt >= pending.sentAt - 5000));
  const shownPending = synced ? null : pending;
  const empty = history !== undefined && exchanges.length === 0 && !shownPending;
  const chips = visibleChips(FIXTURE_SUGGESTIONS, [...exchanges.map((ex) => shownQuestion(ex.question)), ...asked], input, pending?.status === "looking");
  const lastFound = (shownPending?.result ?? exchanges[exchanges.length - 1])?.found === true;
  const lastId = shownPending?.result ? undefined : exchanges[exchanges.length - 1]?._id;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: p.paper }}>
      <Text maxFontSizeMultiplier={1.67} style={[text.largeTitle, { color: p.ink, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }]} accessibilityRole="header">
        Ask
      </Text>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16, gap: 20 }}
          onContentSizeChange={() => !empty && scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {empty ? <EmptyAsk count={progress?.read} starters={starters} onPick={send} showSuggestions={input.length === 0} /> : null}
          {exchanges.map((ex) => (
            <View key={ex._id} style={{ gap: 14 }}>
              <QuestionBubble question={shownQuestion(ex.question)} />
              <AnswerBlock result={ex} latest={!shownPending && ex._id === lastId} onAsk={send} />
            </View>
          ))}
          {shownPending ? (
            <View style={{ gap: 14 }}>
              <QuestionBubble question={shownPending.question} />
              {shownPending.status === "looking" && slowFor === shownPending.sentAt ? <LookingBlock count={progress?.read} /> : null}
              {shownPending.status === "failed" ? <FailedBlock onRetry={() => send(shownPending.question, shownPending.about)} /> : null}
              {shownPending.status === "done" && shownPending.result ? <AnswerBlock result={shownPending.result} latest demo={shownPending.demo} shots={shownPending.demo ? shownPending.shots : undefined} onAsk={send} /> : null}
            </View>
          ) : null}
        </ScrollView>
        {!empty && FIXTURES && !lastFound ? <SuggestionChips items={chips} onPick={send} /> : null}
        <View style={{ paddingBottom: keyboardUp ? 0 : Math.max(insets.bottom, 83) - 8 }}>
          <Composer value={input} onChange={setInput} onSend={() => send(input)} busy={pending?.status === "looking"} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
