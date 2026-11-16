// Psst keepers v2 with motion: react-native-svg + Reanimated 4.
// Rest is the default. Blinks come at irregular 2.5–5.5 s gaps. Only one keeper reacts at a time.
// Under Reduce Motion nothing moves: no blinks, no idle; a reaction is an instant smile swap.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { play as playSfx, sfxForReaction } from "../../lib/sfx";
import { blink as blinkT, duration, easing, spring } from "../motion";
import { Art, usePrefix } from "./Art";
import { KEEPER_ART, type BodyPose, type FaceState, type KeeperName } from "./keeperArt";
import { doubleBlinkChance, filedReaction, keeperMotion as M, tapLines } from "./tokens";

export type { KeeperName } from "./keeperArt";
export type KeeperState = "rest" | "holding" | "sleeping" | "muted";
export type KeeperReaction = "tap" | "filed" | "celebrate" | "reveal";
export type KeeperHandle = { play: (r: KeeperReaction) => void };

// One stage for every mounted keeper: reactions queue so two never overlap, blinks keep 120 ms apart.
const stage = { busyUntil: 0, lastBlink: 0 };
function reserveReaction(length: number): number {
  const now = Date.now();
  const start = stage.busyUntil > now ? stage.busyUntil + M.queueGap : now;
  stage.busyUntil = start + length;
  return start - now;
}
const REACTION_MS: Record<KeeperReaction, number> = { tap: duration.reaction, filed: duration.reaction, celebrate: 1100, reveal: 900 };

function useBlink(name: KeeperName, enabled: boolean) {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    const closed = blinkT.close + blinkT.hold + blinkT.open;
    const once = (then: () => void) => {
      setBlinking(true);
      later(() => {
        setBlinking(false);
        then();
      }, closed);
    };
    const schedule = () => {
      let gap = blinkT.gapMin + Math.random() * (blinkT.gapMax - blinkT.gapMin);
      later(() => {
        const since = Date.now() - stage.lastBlink;
        if (since < blinkT.crossKeeperMin) gap = blinkT.crossKeeperMin - since;
        stage.lastBlink = Date.now();
        once(() => (Math.random() < doubleBlinkChance[name] ? later(() => once(schedule), blinkT.doubleGap) : schedule()));
      }, gap);
    };
    schedule();
    return () => timers.forEach(clearTimeout);
  }, [enabled, name]);
  return blinking;
}

type Props = {
  name: KeeperName;
  state?: KeeperState;
  size?: number;
  /** Plays a reaction whenever reactionKey changes (for example once per filed screenshot). */
  reaction?: KeeperReaction;
  reactionKey?: string | number;
  /** Tapping the keeper plays "tap" and hands you one line to show in a bubble. Omit to make it non-interactive. */
  onLine?: (line: string) => void;
};

export const Keeper = forwardRef<KeeperHandle, Props>(function Keeper({ name, state = "rest", size = 120, reaction, reactionKey, onLine }, ref) {
  const reduce = useReducedMotion();
  const prefix = usePrefix(name);
  const art = KEEPER_ART[name];
  const asleep = state === "sleeping" || state === "muted";
  const blinking = useBlink(name, !reduce && !asleep);
  const [smiling, setSmiling] = useState(false);
  const lineIndex = useRef(0);

  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const op = useSharedValue(1);
  const pivot = size * (M.feetY - 0.5);

  const smileFor = useCallback((ms: number, delay = 0) => {
    const t1 = setTimeout(() => setSmiling(true), delay);
    const t2 = setTimeout(() => setSmiling(false), delay + ms);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  const animate = useCallback(
    (r: KeeperReaction) => {
      if (reduce) return;
      const hop = (h: number) => withSequence(withTiming(-h, { duration: M.hop.up, easing: easing.out }), withTiming(0, { duration: M.hop.down, easing: easing.in }));
      if (r === "tap") {
        const d = M.tap.duration / 4;
        rot.set(withSequence(withTiming(-M.tap.rotate, { duration: d }), withTiming(M.tap.rotate, { duration: d }), withTiming(-M.tap.rotate / 2, { duration: d }), withTiming(0, { duration: d, easing: easing.out })));
      } else if (r === "celebrate") {
        y.set(withSequence(hop(size * M.hop.height), hop(size * M.hop.height * 0.6)));
      } else if (r === "reveal") {
        op.set(0);
        sx.set(M.reveal.from);
        sy.set(M.reveal.from);
        op.set(withTiming(1, { duration: duration.quick }));
        sx.set(withSpring(1, spring.keeper));
        sy.set(withSpring(1, spring.keeper));
      } else {
        const kind = filedReaction[name];
        if (kind === "hop") y.set(hop(size * M.hop.height));
        if (kind === "squish") {
          sx.set(withSequence(withTiming(M.squish.x, { duration: M.squish.in }), withSpring(1, spring.keeper)));
          sy.set(withSequence(withTiming(M.squish.y, { duration: M.squish.in }), withSpring(1, spring.keeper)));
        }
        if (kind === "jingle") {
          const s = M.jingle.step, a = M.jingle.rotate;
          rot.set(withSequence(withTiming(a, { duration: s }), withTiming(-a, { duration: s }), withTiming(a * 0.6, { duration: s }), withTiming(-a * 0.4, { duration: s }), withTiming(0, { duration: s, easing: easing.out })));
        }
        if (kind === "float") y.set(withSequence(withTiming(-size * M.float.height, { duration: M.float.up, easing: easing.out }), withTiming(0, { duration: M.float.down, easing: easing.inOut })));
      }
    },
    [name, op, reduce, rot, size, sx, sy, y],
  );

  const play = useCallback(
    (r: KeeperReaction) => {
      const wait = reserveReaction(reduce ? duration.reaction : REACTION_MS[r]);
      setTimeout(() => {
        playSfx(sfxForReaction(name, r));
        animate(r);
        if (r === "reveal") smileFor(duration.reaction, reduce ? 0 : M.reveal.smileAt);
        else if (r !== "filed" || reduce) smileFor(duration.reaction);
      }, wait);
    },
    [animate, name, reduce, smileFor],
  );
  useImperativeHandle(ref, () => ({ play }), [play]);

  useEffect(() => {
    if (reaction && reactionKey !== undefined) play(reaction);
  }, [reactionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Holding lifts the screenshot into view; sleeping breathes; Mote floats. Nothing loops under Reduce Motion.
  useEffect(() => {
    if (reduce) {
      y.set(0);
      sy.set(1);
      return;
    }
    if (state === "holding") {
      y.set(size * M.holding.lift);
      y.set(withTiming(0, { duration: M.holding.duration, easing: easing.out }));
    } else if (state === "sleeping") {
      sy.set(withRepeat(withTiming(M.breathe.scaleY, { duration: M.breathe.half, easing: easing.inOut }), -1, true));
      return () => {
        sy.set(withTiming(1, { duration: duration.quick }));
      };
    } else if (name === "mote" && state === "rest") {
      y.set(withDelay(400, withRepeat(withTiming(-size * M.idleBob.height, { duration: M.idleBob.half, easing: easing.inOut }), -1, true)));
      return () => {
        y.set(withTiming(0, { duration: duration.quick }));
      };
    }
  }, [name, reduce, size, state, sy, y]);

  const style = useAnimatedStyle(() => ({
    opacity: op.get(),
    transform: [{ translateY: y.get() }, { translateY: pivot }, { rotate: rot.get() + "deg" }, { scaleX: sx.get() }, { scaleY: sy.get() }, { translateY: -pivot }],
  }));

  const body: BodyPose = state;
  const face: FaceState = asleep ? "rest" : smiling ? "smile" : blinking ? "blink" : "rest";
  const view = (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Art layers={art.poses[body]} face={face} size={size} prefix={prefix} label={art.name} />
    </Animated.View>
  );
  if (!onLine) return view;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={art.name}
      onPress={() => {
        const lines = tapLines[name];
        onLine(lines[lineIndex.current++ % lines.length]);
        play("tap");
      }}
    >
      {view}
    </Pressable>
  );
});

export type AvatarState = "rest" | "smile" | "muted";

/** Face-only avatar (drawn separately, never cropped). Blinks on its own irregular timer unless Reduce Motion is on. */
export function KeeperAvatar({ name, state = "rest", size = 40 }: { name: KeeperName; state?: AvatarState; size?: number }) {
  const reduce = useReducedMotion();
  const prefix = usePrefix(name + "av");
  const art = KEEPER_ART[name];
  const blinking = useBlink(name, !reduce && state === "rest");
  if (state === "muted") return <Art layers={art.avatarMuted} face="rest" size={size} prefix={prefix} label={art.name} />;
  return <Art layers={art.avatar} face={state === "smile" ? "smile" : blinking ? "blink" : "rest"} size={size} prefix={prefix} label={art.name} />;
}

export default Keeper;
