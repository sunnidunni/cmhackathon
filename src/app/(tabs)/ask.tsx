import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { AnswerBlock, FailedBlock, LookingBlock, QuestionBubble, type AskResult } from "@/components/ask/AnswerBlock";
import { Composer } from "@/components/ask/Composer";
import { demoResult, demoShots } from "@/components/ask/demo";
import { EmptyAsk } from "@/components/ask/EmptyAsk";
import { shownQuestion, withFocus } from "@/components/ask/focus";
import { useFocusMemory } from "@/components/today/focusMemory";
import { buildScreen } from "@/components/today/model";
import { text, usePalette } from "@/design/psst";
import { FIXTURES } from "@/lib/fixtures";
import { isOffline } from "@/lib/offline";
import { useSafeQuery } from "@/lib/useSafeQuery";

type Exchange = FunctionReturnType<typeof api.ask.history>[number];
type Pending = { question: string; sent: string; status: "looking" | "failed" | "done"; sentAt: number; result?: AskResult & { questionId: string }; demo?: boolean };

export default function Ask() {
  const p = usePalette();
  const history = useSafeQuery(api.ask.history, {}, []);
  const rooms = useSafeQuery(api.rooms.all, {}, { count: 0, items: [] });
  const today = useSafeQuery(api.today.get, { tzOffsetMinutes: new Date().getTimezoneOffset() }, undefined);
  const [focusMemory] = useFocusMemory();
  const { screen } = buildScreen(focusMemory === undefined ? undefined : today, new Set(), undefined, focusMemory ?? null);
  const focusTitle = screen.kind === "focus" ? screen.focus.title : null;
  const askAction = useAction(api.ask.ask);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
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

  async function send(question: string) {
    const q = question.trim();
    if (!q || pending?.status === "looking") return;
    setInput("");
    const sentAt = Date.now();
    const sent = withFocus(q, focusTitle);
    setPending({ question: q, sent, status: "looking", sentAt });
    if (isOffline()) {
      const pottery = /pottery/i.test(q);
      const result = pottery ? { ...demoResult, questionId: "demo" } : { answer: "I can't reach your screenshots right now.", found: false, sources: [], questionId: "offline" };
      setPending({ question: q, sent, status: "done", sentAt, result, demo: pottery });
      return;
    }
    setTimeout(() => setSlowFor(sentAt), 400);
    try {
      const result = await askAction({ question: sent });
      setPending({ question: q, sent, status: "done", sentAt, result });
    } catch {
      if (FIXTURES) setPending({ question: q, sent, status: "done", sentAt, result: { ...demoResult, questionId: "demo" }, demo: true });
      else setPending({ question: q, sent, status: "failed", sentAt });
    }
  }

  const exchanges: Exchange[] = history ?? [];
  const synced =
    pending !== null &&
    pending.status !== "failed" &&
    exchanges.some((ex) => ex._id === pending.result?.questionId || (ex.question === pending.sent && ex.createdAt >= pending.sentAt - 5000));
  const shownPending = synced ? null : pending;
  const empty = history !== undefined && exchanges.length === 0 && !shownPending;
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
          {empty ? <EmptyAsk count={rooms?.count} onPick={send} showSuggestions={input.length === 0} /> : null}
          {exchanges.map((ex) => (
            <View key={ex._id} style={{ gap: 14 }}>
              <QuestionBubble question={shownQuestion(ex.question)} />
              <AnswerBlock result={ex} latest={!shownPending && ex._id === lastId} />
            </View>
          ))}
          {shownPending ? (
            <View style={{ gap: 14 }}>
              <QuestionBubble question={shownPending.question} />
              {shownPending.status === "looking" && slowFor === shownPending.sentAt ? <LookingBlock count={rooms?.count} /> : null}
              {shownPending.status === "failed" ? <FailedBlock onRetry={() => send(shownPending.question)} /> : null}
              {shownPending.status === "done" && shownPending.result ? <AnswerBlock result={shownPending.result} latest demo={shownPending.demo} shots={shownPending.demo ? demoShots : undefined} /> : null}
            </View>
          ) : null}
        </ScrollView>
        <View style={{ paddingBottom: keyboardUp ? 0 : Math.max(insets.bottom, 83) - 8 }}>
          <Composer value={input} onChange={setInput} onSend={() => send(input)} busy={pending?.status === "looking"} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
