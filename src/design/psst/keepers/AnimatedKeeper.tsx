import { useEffect, useImperativeHandle, type Ref } from "react";
import Svg, { G, Line, Path, Rect } from "react-native-svg";
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { blink, duration, timing } from "@/design/motion";
import type { KeeperId } from "../tokens";
import { ART, type Leaf } from "./art-data";
import { registerBlink } from "./blink-scheduler";
import { HIDDEN_FROM_SCREEN_READERS, renderCut, renderParts, useRoleColors, type RoleColors } from "./parts";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const BLINK_MIN_SIZE = 64;

export type AnimatedKeeperHandle = { react: () => void };

type AnimatedKeeperProps = {
  id: KeeperId;
  size: number;
  pose?: "rest" | "holding" | "shh";
  muted?: boolean;
  cut?: number;
  label?: string;
  ref?: Ref<AnimatedKeeperHandle>;
};

type RectLeaf = Extract<Leaf, { t: "r" }>;
type PathLeaf = Extract<Leaf, { t: "p" }>;

const isPath = (p: unknown): p is PathLeaf => (p as Leaf).t === "p";

function LidRect({ rect, lid, fill }: { rect: RectLeaf; lid: SharedValue<number>; fill: string }) {
  const props = useAnimatedProps(() => ({ height: rect.h + (rect.w - rect.h) * lid.value }));
  return <AnimatedRect x={rect.x} y={rect.y} width={rect.w} fill={fill} animatedProps={props} />;
}

function LidEdge({ edge, curve, lid, colors }: { edge: PathLeaf; curve: PathLeaf; lid: SharedValue<number>; colors: RoleColors }) {
  const [, x, y, w] = /^M([\d.]+) ([\d.]+)h([\d.]+)/.exec(edge.d) ?? [];
  const line = useAnimatedProps(() => ({ opacity: 1 - interpolate(lid.value, [0.5, 1], [0, 1], "clamp") }));
  const closed = useAnimatedProps(() => ({ opacity: interpolate(lid.value, [0.5, 1], [0, 1], "clamp") }));
  return (
    <G>
      <AnimatedLine x1={Number(x)} y1={Number(y)} x2={Number(x) + Number(w)} y2={Number(y)} stroke={colors.kl} strokeWidth={edge.sw} strokeLinecap="round" animatedProps={line} />
      <AnimatedPath d={curve.d} fill="none" stroke={colors.kl} strokeWidth={curve.sw} strokeLinecap="round" animatedProps={closed} />
    </G>
  );
}

function MouthPath({ mouth, smile, kind, colors }: { mouth: PathLeaf; smile: SharedValue<number>; kind: "rest" | "react"; colors: RoleColors }) {
  const props = useAnimatedProps(() => ({ opacity: kind === "react" ? smile.value : 1 - smile.value }));
  return (
    <AnimatedPath
      d={mouth.d}
      fill={mouth.f === "kl" ? colors.kl : "none"}
      stroke={colors.kl}
      strokeWidth={mouth.sw}
      strokeLinecap={mouth.lc ? "round" : undefined}
      strokeLinejoin={mouth.lj ? "round" : undefined}
      animatedProps={props}
    />
  );
}

export function AnimatedKeeper({ id, size, pose = "rest", muted = false, cut = 11, label, ref }: AnimatedKeeperProps) {
  const colors = useRoleColors(id, muted);
  const reduce = useReducedMotion();
  const lid = useSharedValue(0);
  const smile = useSharedValue(0);
  const blinking = !reduce && size >= BLINK_MIN_SIZE;

  useEffect(() => {
    if (!blinking) return;
    return registerBlink(() => {
      lid.value = withSequence(
        withTiming(1, timing(blink.close, "in")),
        withDelay(blink.hold, withTiming(0, timing(blink.open, "out"))),
      );
    });
  }, [blinking, lid]);

  useEffect(
    () => () => {
      cancelAnimation(lid);
      cancelAnimation(smile);
    },
    [lid, smile],
  );

  useImperativeHandle(
    ref,
    () => ({
      react: () => {
        if (reduce) return;
        smile.value = withSequence(
          withTiming(1, timing(duration.instant, "out")),
          withDelay(duration.reaction - 2 * duration.instant, withTiming(0, timing(duration.instant, "in"))),
        );
      },
    }),
    [reduce, smile],
  );

  const parts = ART[id][pose] ?? ART[id].rest!;
  const curves = ART[id].blink!.filter((p) => isPath(p) && p.part === "lid") as PathLeaf[];
  const happy = ART[id].react!.find((p) => isPath(p) && p.part === "mouth") as PathLeaf;
  let eye = 0;

  const override = (p: Leaf, key: string) => {
    if (blinking && p.part === "lid" && p.t === "r") return <LidRect key={key} rect={p} lid={lid} fill={colors[p.f ?? "m"]} />;
    if (blinking && p.part === "lid" && p.t === "p") return <LidEdge key={key} edge={p} curve={curves[eye++]} lid={lid} colors={colors} />;
    if (!reduce && p.part === "mouth" && p.t === "p") {
      return (
        <G key={key}>
          <MouthPath mouth={p} smile={smile} kind="rest" colors={colors} />
          <MouthPath mouth={happy} smile={smile} kind="react" colors={colors} />
        </G>
      );
    }
    return undefined;
  };

  const a11y = label ? ({ accessible: true, accessibilityRole: "image", accessibilityLabel: label } as const) : HIDDEN_FROM_SCREEN_READERS;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" {...a11y}>
      {cut > 0 ? renderCut(parts, colors, cut) : null}
      {renderParts(parts, colors, override)}
    </Svg>
  );
}
