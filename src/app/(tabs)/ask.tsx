import { useAction, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { AnswerBlock, FailedBlock, LookingBlock, QuestionBubble, type AskResult } from "@/components/ask/AnswerBlock";
import { Composer } from "@/components/ask/Composer";
import { demoResult, demoShots } from "@/components/ask/demo";
import { EmptyAsk } from "@/components/ask/EmptyAsk";
import { text, usePalette } from "@/design/psst";
import { FIXTURES } from "@/lib/fixtures";

type Exchange = FunctionReturnType<typeof api.ask.history>[number];
type Pending = { question: string; status: "looking" | "failed" | "done"; sentAt: number; result?: AskResult & { questionId: string }; demo?: boolean };

export default function Ask() {
  const p = usePalette();
  const history = useQuery(api.ask.history);
  const rooms = useQuery(api.rooms.all);
  const askAction = useAction(api.ask.ask);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || pending?.status === "looking") return;
    setInput("");
    const sentAt = Date.now();
    setPending({ question: q, status: "looking", sentAt });
    try {
      const result = await askAction({ question: q });
      setPending({ question: q, status: "done", sentAt, result });
    } catch {
      if (FIXTURES) setPending({ question: q, status: "done", sentAt, result: { ...demoResult, questionId: "demo" }, demo: true });
      else setPending({ question: q, status: "failed", sentAt });
    }
  }

  const exchanges: Exchange[] = history ?? [];
  const synced = pending?.status === "done" && exchanges.some((ex) => ex._id === pending.result?.questionId);
  const shownPending = synced ? null : pending;
  const empty = history !== undefined && exchanges.length === 0 && !shownPending;
  const lastId = shownPending?.result ? undefined : exchanges[exchanges.length - 1]?._id;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: p.paper }}>
      <Text style={[text.largeTitle, { color: p.ink, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }]} accessibilityRole="header">
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
              <QuestionBubble question={ex.question} />
              <AnswerBlock result={ex} latest={!shownPending && ex._id === lastId} />
            </View>
          ))}
          {shownPending ? (
            <View style={{ gap: 14 }}>
              <QuestionBubble question={shownPending.question} />
              {shownPending.status === "looking" ? <LookingBlock count={rooms?.count} /> : null}
              {shownPending.status === "failed" ? <FailedBlock onRetry={() => send(shownPending.question)} /> : null}
              {shownPending.status === "done" && shownPending.result ? <AnswerBlock result={shownPending.result} latest demo={shownPending.demo} shots={shownPending.demo ? demoShots : undefined} /> : null}
            </View>
          ) : null}
        </ScrollView>
        <Composer value={input} onChange={setInput} onSend={() => send(input)} busy={pending?.status === "looking"} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
