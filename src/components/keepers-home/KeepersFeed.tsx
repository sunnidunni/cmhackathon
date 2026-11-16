import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { text, usePalette } from "@/design/psst";
import { FEED, FEED_DAY } from "./fixtures";
import { KeeperThread } from "./KeeperThread";

const TYPING_MS = 750;
const GAP_MS = 240;

export function KeepersFeed() {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const last = FEED.length * 2;

  useEffect(() => {
    if (reduce || phase >= last) return;
    const t = setTimeout(() => setPhase((n) => n + 1), phase % 2 === 1 ? TYPING_MS : GAP_MS);
    return () => clearTimeout(t);
  }, [reduce, phase, last]);

  const step = reduce ? last : phase;
  const shown = Math.floor(step / 2);
  const typing = step % 2 === 1;

  const visible = FEED.slice(0, Math.min(FEED.length, shown + (typing ? 1 : 0)));
  const done = shown >= FEED.length;

  return (
    <View style={{ paddingHorizontal: 16, gap: 22 }}>
      <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2, textAlign: "center", fontVariant: ["tabular-nums"] }]}>
        {FEED_DAY}
      </Text>
      {visible.map((thread, i) => (
        <KeeperThread key={thread.id} thread={thread} typing={typing && i === shown} />
      ))}
      {done ? (
        <Animated.View entering={reduce ? undefined : FadeIn.duration(300)} style={{ alignItems: "center", paddingTop: 4 }}>
          <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink3 }]}>
            That&apos;s everyone for now.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
