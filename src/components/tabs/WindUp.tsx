import { useCallback, useEffect, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";
import { Keeper, text, useKeeperColors, usePalette } from "@/design/psst";
import type { SyncResult } from "@/lib/sync";

const TICKS = 12;
const STEP_MS = 80;
const RESULT_MS = 4000;

// Tock winds the dial while Psst checks, one bright tick chasing for exactly as long as the check runs.
// His bells and hammer never move and nothing rings. Reduce Motion draws the dial still.
function Dial({ running }: { running: boolean }) {
  const c = useKeeperColors("tock");
  const p = usePalette();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce || !running) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % TICKS), STEP_MS);
    return () => clearInterval(timer);
  }, [reduce, running]);
  return (
    <Svg width={28} height={28} viewBox="-14 -14 28 28">
      {Array.from({ length: TICKS }, (_, i) => {
        const a = (i / TICKS) * 2 * Math.PI;
        const bright = !reduce && i === step;
        return (
          <Line
            key={i}
            x1={Math.sin(a) * 8}
            y1={-Math.cos(a) * 8}
            x2={Math.sin(a) * 12}
            y2={-Math.cos(a) * 12}
            stroke={reduce || bright ? c.deep : p.hair2}
            strokeWidth={bright ? 3 : 2}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

// Pull-to-refresh with Tock. check runs the sync; the banner shows while it runs, then says what happened.
export function useWindUp(check: () => Promise<SyncResult>, onError?: () => void) {
  const p = usePalette();
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (done === null) return;
    const timer = setTimeout(() => setDone(null), RESULT_MS);
    return () => clearTimeout(timer);
  }, [done]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setDone(null);
    try {
      const r = await check();
      if (r.uploaded > 0) setDone(`${r.uploaded} new ${r.uploaded === 1 ? "screenshot. Filing it" : "screenshots. Filing them"} now.`);
      else if (r.failed === 0) setDone("No new screenshots.");
    } catch {
      if (onError) onError();
      else setDone("Couldn't check for new screenshots.");
    }
    setRefreshing(false);
  }, [check, onError]);

  const control = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="transparent" colors={["transparent"]} />;
  const line = refreshing ? "Checking for new screenshots." : done;
  const banner = line ? (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {refreshing ? (
        <>
          <Keeper id="tock" size={44} mood="react" />
          <Dial running />
        </>
      ) : null}
      <Text style={[text.body, { color: p.ink2, flex: 1 }]}>{line}</Text>
    </View>
  ) : null;
  return { control, banner, refresh, refreshing };
}
