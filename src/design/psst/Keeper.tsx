import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Keeper as KeeperV2, KeeperAvatar, type KeeperHandle, type KeeperReaction } from "../keepers-v2";
import { duration, easing } from "../motion";
import type { KeeperId } from "./tokens";

// Adapter: every screen still imports Keeper/KeeperFace from "@/design/psst", but they now render the
// v2 cast with motion (src/design/keepers-v2). Old props are kept so no call site changes.
export type KeeperMood = "rest" | "react" | "anxious";

// reaction plays each time reactionKey changes to a defined value (and once on mount when it starts defined).
type Reactive = { reaction?: KeeperReaction; reactionKey?: string | number };

type KeeperProps = Reactive & {
  id: KeeperId;
  size: number;
  mood?: KeeperMood;
  muted?: boolean;
  sticker?: boolean;
  still?: boolean;
  label?: string;
  /** Tap to boop: the v2 tap reaction, plus one selection haptic at most every 3 s. Use on keepers 72pt or larger that sit outside another button. */
  boop?: boolean;
  /** The sleeping pose: three slow breaths, then still. */
  sleeping?: boolean;
};

const BOOP_HAPTIC_GAP_MS = 3000;

export function Keeper({ id, size, mood = "rest", muted = false, boop = false, sleeping = false, reaction, reactionKey }: KeeperProps) {
  // "react" plays the tap reaction once each time the mood flips to react.
  const ref = useRef<KeeperHandle>(null);
  useEffect(() => {
    if (mood === "react") ref.current?.play("tap");
  }, [mood]);
  const lastHaptic = useRef(0);
  const onBoop = useCallback(() => {
    const now = Date.now();
    if (now - lastHaptic.current < BOOP_HAPTIC_GAP_MS) return;
    lastHaptic.current = now;
    Haptics.selectionAsync().catch(() => undefined);
  }, []);
  return <KeeperV2 ref={ref} name={id} size={size} state={muted ? "muted" : sleeping ? "sleeping" : "rest"} onLine={boop && !muted ? onBoop : undefined} reaction={reaction} reactionKey={reactionKey} />;
}

type KeeperFaceProps = Reactive & { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean; label?: string };

// The v2 avatar has no reactions of its own, so a reaction here is a 900 ms smile and, unless Reduce Motion is on, a small hop.
export function KeeperFace({ id, size, mood = "rest", muted = false, reaction, reactionKey }: KeeperFaceProps) {
  const reduce = useReducedMotion();
  const [smiling, setSmiling] = useState(false);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!reaction || reactionKey === undefined || muted) return;
    const hop = (h: number) => withSequence(withTiming(-h, { duration: 110, easing: easing.out }), withTiming(0, { duration: 140, easing: easing.in }));
    if (!reduce) y.set(reaction === "celebrate" ? withSequence(hop(size * 0.2), hop(size * 0.12)) : hop(size * 0.2));
    const on = setTimeout(() => setSmiling(true), 0);
    const off = setTimeout(() => setSmiling(false), duration.reaction);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [reaction, reactionKey, muted, reduce, size, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return (
    <Animated.View style={style}>
      <KeeperAvatar name={id} size={size} state={muted ? "muted" : smiling || mood === "react" ? "smile" : "rest"} />
    </Animated.View>
  );
}
