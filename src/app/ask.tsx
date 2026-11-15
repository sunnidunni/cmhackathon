import { useAction, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Button, LoadingView } from "@/components/state-views";

type Exchange = FunctionReturnType<typeof api.ask.history>[number];
type Source = Exchange["sources"][number];
type Pending = { question: string; failed: boolean };

const SUGGESTIONS = ["When is that due?", "My flight details", "Wi-Fi password", "That recipe"];

export default function Ask() {
  const history = useQuery(api.ask.history);
  const askAction = useAction(api.ask.ask);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || (pending && !pending.failed)) return;
    setInput("");
    setPending({ question: q, failed: false });
    try {
      await askAction({ question: q });
      setPending(null);
    } catch {
      setPending({ question: q, failed: true });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Ask", headerBackTitle: "Back" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        {history === undefined ? (
          <LoadingView label="Loading your questions…" />
        ) : (
          <ScrollView
            ref={scroll}
            style={styles.flex}
            contentContainerStyle={styles.content}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {history.length === 0 && !pending ? (
              <View style={styles.empty}>
                <Text style={styles.h1}>What are you looking for?</Text>
                <Text style={styles.cap}>
                  Answers come only from your screenshots, with the screenshot shown underneath.
                </Text>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
                      <Text style={styles.chipText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {history.map((ex) => (
              <ExchangeView key={ex._id} exchange={ex} />
            ))}

            {pending ? (
              <View style={styles.exchange}>
                <Text style={styles.question}>{pending.question}</Text>
                {pending.failed ? (
                  <View style={styles.failCard}>
                    <Text style={styles.failTitle}>Couldn't get an answer</Text>
                    <Text style={styles.cap}>Your question is saved above.</Text>
                    <Button label="Try again" onPress={() => send(pending.question)} />
                  </View>
                ) : (
                  <View style={styles.row} accessibilityState={{ busy: true }}>
                    <ActivityIndicator />
                    <Text style={styles.cap}>Looking through your screenshots</Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your screenshots"
            accessibilityLabel="Ask about your screenshots"
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.send, (!input.trim() || (pending && !pending.failed)) && styles.dim]}
            onPress={() => send(input)}
          >
            <Text style={styles.sendText}>Ask</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExchangeView({ exchange }: { exchange: Exchange }) {
  return (
    <View style={styles.exchange}>
      <Text style={styles.question}>{exchange.question}</Text>
      <Text style={styles.answer}>{exchange.answer}</Text>
      {!exchange.found && exchange.sources.length > 0 ? (
        <Text style={styles.cap}>Closest screenshots</Text>
      ) : null}
      {exchange.sources.map((s) => (
        <SourceCard key={s.screenshotId} source={s} />
      ))}
    </View>
  );
}

function SourceCard({ source }: { source: Source }) {
  return (
    <View style={styles.source}>
      {source.imageUrl ? (
        <Image source={{ uri: source.imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumb} />
      )}
      <Text style={styles.sourceTitle} numberOfLines={2}>
        {source.title ?? "Untitled screenshot"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  flex: { flex: 1 },
  content: { padding: 20, gap: 20 },
  empty: { gap: 12 },
  h1: { fontSize: 24, fontWeight: "700" },
  cap: { fontSize: 14, color: "#666" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 14,
  },
  chipText: { fontSize: 14, fontWeight: "700" },
  exchange: { gap: 8 },
  question: {
    alignSelf: "flex-end",
    backgroundColor: "#3D5AFE",
    color: "white",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    overflow: "hidden",
    maxWidth: "85%",
  },
  answer: { fontSize: 16, color: "#111" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  failCard: { backgroundColor: "#FDECEE", borderRadius: 12, padding: 12, gap: 8 },
  failTitle: { fontSize: 16, fontWeight: "600" },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 8,
  },
  thumb: { width: 40, height: 64, borderRadius: 6, backgroundColor: "#EEE" },
  sourceTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  send: {
    backgroundColor: "#3D5AFE",
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  dim: { opacity: 0.5 },
  sendText: { color: "white", fontSize: 16, fontWeight: "600" },
});
