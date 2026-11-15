import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { bringInState, broughtInLine, failedLabel, type BringInResult } from "@/components/onboarding/format";
import { Body, Heading, Screen, Stack } from "@/components/onboarding/ui";
import { Button, Character, colors, spacing } from "@/design";
import { useSync } from "@/lib/sync";

export default function BringIn() {
  const progress = useQuery(api.sync.progress, {});
  const { syncNow } = useSync();
  const [result, setResult] = useState<BringInResult | null>(null);
  const [error, setError] = useState(false);
  const started = useRef(false);

  const run = useCallback(() => {
    setResult(null);
    setError(false);
    syncNow().then(setResult, () => setError(true));
  }, [syncNow]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  const state = bringInState(result, error);

  useEffect(() => {
    if (state.kind !== "done") return;
    const timer = setTimeout(() => router.replace("/today"), 1200);
    return () => clearTimeout(timer);
  }, [state.kind]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.xl }}>
        <View style={{ alignItems: "center" }}>
          <Character size={96} expression={state.kind === "done" ? "happy" : "neutral"} />
        </View>
        {state.kind === "working" ? (
          <Stack>
            <Heading>Bringing in your screenshots</Heading>
            <Body>{broughtInLine(progress?.total ?? 0)}</Body>
            <ActivityIndicator color={colors.ink} />
          </Stack>
        ) : null}
        {state.kind === "done" ? (
          <Stack>
            <Heading>Your screenshots are in</Heading>
            <Body>I'll sort them quietly while you look around.</Body>
          </Stack>
        ) : null}
        {state.kind === "failed" ? (
          <Stack>
            <Heading>{failedLabel(state.failed)}</Heading>
            <Body>Check your connection and try again. The ones already in are safe.</Body>
          </Stack>
        ) : null}
      </View>
      {state.kind === "failed" ? (
        <Stack gap={spacing.md}>
          <Button label="Try again" onPress={run} />
          <Button label="Go to Home" variant="secondary" onPress={() => router.replace("/today")} />
        </Stack>
      ) : null}
      {state.kind === "done" ? <Button label="Open Psst" onPress={() => router.replace("/today")} /> : null}
    </Screen>
  );
}
