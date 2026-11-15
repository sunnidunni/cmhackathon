import { useAction, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { Button, colors, radii, SketchFrame, spacing, Sticker, type } from "@/design";
import { Loading, Screen, TabHeader } from "@/components/tabs/ui";

type Exchange = FunctionReturnType<typeof api.ask.history>[number];
type Source = Exchange["sources"][number];
type Pending = { question: string; failed: boolean; sentAt: number };

const SUGGESTIONS = ["When is that due?", "My flight details", "Wi-Fi password", "That recipe"];

export default function Ask() {
  const history = useQuery(api.ask.history);
  const askAction = useAction(api.ask.ask);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const answered =
    pending !== null &&
    !pending.failed &&
    (history ?? []).some((ex) => ex.question === pending.question && ex.createdAt >= pending.sentAt - 5000);
  const shownPending = answered ? null : pending;

  async function send(question: string) {
    const q = question.trim();
    if (!q || (pending && !pending.failed)) return;
    setInput("");
    const sentAt = Date.now();
    setPending({ question: q, failed: false, sentAt });
    try {
      await askAction({ question: q });
      setPending(null);
    } catch {
      setPending({ question: q, failed: true, sentAt });
    }
  }

  const busy = pending !== null && !pending.failed;

  return (
    <Screen>
      <TabHeader title="Ask" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {history === undefined ? (
          <Loading label="Loading your questions" />
        ) : (
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.xl }}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {history.length === 0 && !shownPending ? (
              <View style={{ gap: spacing.md }}>
                <Text style={type.title}>What are you looking for?</Text>
                <Text style={type.caption}>Answers come only from your screenshots, with the screenshot shown underneath.</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable key={s} accessibilityRole="button" onPress={() => send(s)} style={{ minHeight: 44, justifyContent: "center" }}>
                      <SketchFrame fill={colors.white} radius={radii.pill} seed={s} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                        <Text style={type.label}>{s}</Text>
                      </SketchFrame>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {history.map((ex) => (
              <ExchangeView key={ex._id} exchange={ex} />
            ))}

            {shownPending ? (
              <View style={{ gap: spacing.md }}>
                <QuestionBubble text={shownPending.question} />
                {shownPending.failed ? (
                  <SketchFrame fill={colors.white} radius={radii.lg} seed="fail" style={{ padding: spacing.lg, gap: spacing.md }}>
                    <Text style={type.heading}>Couldn't get an answer</Text>
                    <Text style={type.caption}>Your question is saved above.</Text>
                    <Button label="Try again" onPress={() => send(shownPending.question)} />
                  </SketchFrame>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }} accessibilityState={{ busy: true }}>
                    <ActivityIndicator color={colors.ink} />
                    <Text style={type.caption}>Looking through your screenshots</Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper }}>
          <View style={{ flex: 1 }}>
            <SketchFrame fill={colors.white} radius={radii.pill} seed="input" style={{ paddingHorizontal: spacing.lg, justifyContent: "center", minHeight: 48 }}>
              <TextInput
                style={[type.body, { paddingVertical: spacing.sm }]}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your screenshots"
                placeholderTextColor={colors.inkFaint}
                accessibilityLabel="Ask about your screenshots"
                returnKeyType="send"
                onSubmitEditing={() => send(input)}
              />
            </SketchFrame>
          </View>
          <View style={{ justifyContent: "center", opacity: !input.trim() || busy ? 0.5 : 1 }}>
            <Button label="Ask" onPress={() => send(input)} disabled={!input.trim() || busy} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function QuestionBubble({ text }: { text: string }) {
  return (
    <View style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
      <SketchFrame fill={colors.sunTint} radius={radii.md} seed={text} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <Text style={type.body}>{text}</Text>
      </SketchFrame>
    </View>
  );
}

function ExchangeView({ exchange }: { exchange: Exchange }) {
  return (
    <View style={{ gap: spacing.md }}>
      <QuestionBubble text={exchange.question} />
      <Text style={type.body}>{exchange.answer}</Text>
      {!exchange.found && exchange.sources.length > 0 ? <Text style={type.caption}>Closest screenshots</Text> : null}
      {exchange.sources.map((s) => (
        <SourceCard key={s.screenshotId} source={s} />
      ))}
    </View>
  );
}

function SourceCard({ source }: { source: Source }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/shot/${source.screenshotId}`)} style={{ minHeight: 64 }}>
      <SketchFrame fill={colors.white} radius={radii.lg} seed={source.screenshotId} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.sm }}>
        <Sticker tilt={0} border={3} radius={radii.sm}>
          {source.imageUrl ? (
            <Image source={{ uri: source.imageUrl }} style={{ width: 40, height: 64 }} contentFit="cover" />
          ) : (
            <View style={{ width: 40, height: 64, backgroundColor: colors.paperDeep }} />
          )}
        </Sticker>
        <Text style={[type.bodyBold, { flex: 1 }]} numberOfLines={2}>{source.title ?? "Untitled screenshot"}</Text>
      </SketchFrame>
    </Pressable>
  );
}
