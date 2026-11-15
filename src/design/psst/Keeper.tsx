import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { KEEPERS, palettes, useKeeperColors, usePalette, type KeeperId } from "./tokens";

export type KeeperMood = "rest" | "react" | "anxious";

type Fill = "m" | "t" | "w" | "n";
type Shape = { d: string; fill: Fill; w: number } | { face: [number, number] };

const circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const s = (d: string, fill: Fill = "n", w = 3): Shape => ({ d, fill, w });

const BODIES: Record<KeeperId, Shape[]> = {
  tock: [
    s(circle(41, 29, 10), "m"),
    s(circle(79, 29, 10), "m"),
    s("M60 30V20"),
    s("M54 19H66"),
    s("M46 100V107M74 100V107M40 108H52M68 108H80"),
    s("M44 30H76Q96 30 96 50V82Q96 102 76 102H44Q24 102 24 82V50Q24 30 44 30Z", "m"),
    s(circle(60, 82, 12), "w", 2.5),
    s("M60 82V75M60 82L65 85", "n", 2.5),
    s("M95 78Q100 79 102 74"),
    s("M98 54H113Q115 54 115 56V72Q115 74 113 74H98Q96 74 96 72V56Q96 54 98 54Z", "w", 2.5),
    s("M96 60H115V56Q115 54 113 54H98Q96 54 96 56Z", "m", 2.5),
    s("M101 51.5V56M110 51.5V56", "n", 2),
    s("M101.5 65.5H109.5", "n", 2),
    { face: [60, 50] },
  ],
  murmur: [
    s(circle(31, 52, 14), "m"),
    s(circle(89, 52, 14), "m"),
    s(circle(31, 52, 6.5), "t", 2.5),
    s(circle(89, 52, 6.5), "t", 2.5),
    s("M28 108V72a32 32 0 0 1 64 0V108Z", "m"),
    { face: [60, 70] },
    s("M67.5 94V79.5a3.25 3.25 0 0 1 6.5 0V94Z", "m", 2.5),
    s(circle(73, 96, 9), "m", 2.5),
    s("M66.5 99Q70 97.5 72.5 100", "n", 2),
  ],
  penny: [
    s("M40 48L35 30Q47.5 37 60 30Q72.5 37 85 30L80 48Z", "m"),
    s("M40 46C26 58 18 80 22 96Q25 108 40 108H80Q95 108 98 96C102 80 94 58 80 46Z", "m"),
    s("M38 48Q60 54 82 48", "n", 2.5),
    s("M82 48q9-6 11 2q-5 5-11-2M82 48q7 6 5 13", "n", 2.5),
    { face: [60, 74] },
    s("M6 66H24V100l-4.5-3l-4.5 3l-4.5-3L6 100Z", "w", 2.5),
    s("M10.5 74H19.5M10.5 80H19.5M10.5 86H16", "n", 2),
  ],
  mote: [
    s("M56 58C54 48 66 44 64 36"),
    s("M64 12Q66 23 77 25Q66 27 64 38Q62 27 51 25Q62 23 64 12Z", "m"),
    s(circle(54, 82, 26), "m"),
    { face: [54, 80] },
    s("M91 88H111V104Q111 108 107 108H95Q91 108 91 104Z", "w", 2.5),
    s("M89 83H113V88H89Z", "t", 2.5),
    s("M101 91.5Q101.8 96.2 106 97Q101.8 97.8 101 102.5Q100.2 97.8 96 97Q100.2 96.2 101 91.5Z", "m", 1.5),
  ],
};

const WHITE = "#FFFFFF";

type FaceProps = { cx: number; ey: number; scale: number; brows: boolean; main: string; blink: boolean; open: boolean; anxious: boolean };

function Face({ cx, ey, scale: k, brows, main, blink, open, anxious }: FaceProps) {
  const kl = palettes.light.kl;
  const r = 4 * k;
  const my = ey + 10 * k;
  const eyes = [cx - 11 * k, cx + 11 * k];
  const browPath = anxious
    ? `M${cx - 17 * k} ${ey - 7 * k}L${cx - 7 * k} ${ey - 14 * k}M${cx + 17 * k} ${ey - 7 * k}L${cx + 7 * k} ${ey - 14 * k}`
    : `M${cx - 17 * k} ${ey - 8 * k}L${cx - 7 * k} ${ey - 10.5 * k}M${cx + 17 * k} ${ey - 8 * k}L${cx + 7 * k} ${ey - 10.5 * k}`;
  return (
    <G>
      {eyes.map((x) =>
        blink ? (
          <Path key={x} d={`M${x - r - 0.5} ${ey + 0.5}q${r + 0.5} ${r * 0.7} ${2 * r + 1} 0`} stroke={kl} strokeWidth={2.5 * k} strokeLinecap="round" fill="none" />
        ) : (
          <G key={x}>
            <Circle cx={x} cy={ey} r={r} fill={kl} />
            <Rect x={x - r - 1} y={ey - r - 1} width={2 * r + 2} height={r * 0.75 + 1} fill={main} />
            <Path d={`M${x - r - 1.2} ${ey - r * 0.25}h${2 * r + 2.4}`} stroke={kl} strokeWidth={2 * k} strokeLinecap="round" />
          </G>
        ),
      )}
      {brows ? <Path d={browPath} stroke={kl} strokeWidth={2 * k} strokeLinecap="round" fill="none" /> : null}
      {open ? (
        <Path d={`M${cx - 5 * k} ${my - k}q${5 * k} ${8 * k} ${10 * k} 0Z`} fill={kl} stroke={kl} strokeWidth={1.5 * k} strokeLinejoin="round" />
      ) : (
        <Path d={`M${cx - 4 * k} ${my}q${4 * k} ${3 * k} ${8 * k} 0`} stroke={kl} strokeWidth={2.5 * k} strokeLinecap="round" fill="none" />
      )}
    </G>
  );
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function useBlink(enabled: boolean) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let wait: ReturnType<typeof setTimeout>;
    let shut: ReturnType<typeof setTimeout>;
    const schedule = () => {
      wait = setTimeout(() => {
        setBlink(true);
        shut = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 180);
      }, 2500 + Math.random() * 3000);
    };
    schedule();
    return () => {
      clearTimeout(wait);
      clearTimeout(shut);
      setBlink(false);
    };
  }, [enabled]);
  return blink;
}

function useReact(mood: KeeperMood, enabled: boolean) {
  const [spent, setSpent] = useState(false);
  useEffect(() => {
    if (!enabled || mood !== "react") return;
    const t = setTimeout(() => setSpent(true), 900);
    return () => {
      clearTimeout(t);
      setSpent(false);
    };
  }, [mood, enabled]);
  return enabled && mood === "react" && !spent;
}

type KeeperProps = {
  id: KeeperId;
  size: number;
  mood?: KeeperMood;
  muted?: boolean;
  sticker?: boolean;
  still?: boolean;
};

export function Keeper({ id, size, mood = "rest", muted = false, sticker = false, still = false }: KeeperProps) {
  const pal = usePalette();
  const { main, tint } = useKeeperColors(id, muted);
  const reduce = useReduceMotion();
  const animate = !still && !reduce;
  const blink = useBlink(animate);
  const open = useReact(mood, animate);
  const kl = pal.kl;
  const fillOf = { m: main, t: tint, w: WHITE, n: "none" } as const;
  const cutWidth = sticker ? 17 : 11;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={KEEPERS[id].name} accessibilityRole="image">
      {BODIES[id].map((shape, i) =>
        "face" in shape ? null : (
          <Path key={`c${i}`} d={shape.d} fill={pal.cut} stroke={pal.cut} strokeWidth={cutWidth} strokeLinejoin="round" strokeLinecap="round" />
        ),
      )}
      {BODIES[id].map((shape, i) =>
        "face" in shape ? (
          <Face key={i} cx={shape.face[0]} ey={shape.face[1]} scale={1} brows={id === "tock"} main={main} blink={blink} open={open} anxious={mood === "anxious"} />
        ) : (
          <Path key={i} d={shape.d} fill={fillOf[shape.fill]} stroke={kl} strokeWidth={shape.w} strokeLinejoin="round" strokeLinecap="round" />
        ),
      )}
    </Svg>
  );
}

function AvatarMark({ id, main }: { id: KeeperId; main: string }) {
  const kl = palettes.light.kl;
  if (id === "murmur")
    return (
      <G>
        <Rect x={22.6} y={23} width={4} height={10} rx={2} fill={main} stroke={kl} strokeWidth={1.4} />
        <Circle cx={26.5} cy={33.5} r={4.6} fill={main} stroke={kl} strokeWidth={1.4} />
      </G>
    );
  if (id === "penny")
    return <Path d="M11 7Q15.5 10.5 20 7Q24.5 10.5 29 7" stroke={kl} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  if (id === "mote")
    return <Path d="M30 3.5Q30.8 8 35 8.8Q30.8 9.6 30 14Q29.2 9.6 25 8.8Q29.2 8 30 3.5Z" fill={WHITE} stroke={kl} strokeWidth={1.2} strokeLinejoin="round" />;
  return null;
}

type KeeperFaceProps = { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean };

export function KeeperFace({ id, size, mood = "rest", muted = false, still = false }: KeeperFaceProps) {
  const pal = usePalette();
  const { main } = useKeeperColors(id, muted);
  const reduce = useReduceMotion();
  const animate = !still && !reduce;
  const blink = useBlink(animate);
  const open = useReact(mood, animate);
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel={KEEPERS[id].name} accessibilityRole="image">
      <Circle cx={20} cy={20} r={19.5} fill={main} stroke={pal.hair2} strokeWidth={1} />
      <Face cx={20} ey={19} scale={0.62} brows={id === "tock"} main={main} blink={blink} open={open} anxious={mood === "anxious"} />
      <AvatarMark id={id} main={main} />
    </Svg>
  );
}
