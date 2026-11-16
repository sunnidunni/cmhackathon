import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { Keeper as KeeperV2, KeeperAvatar, type KeeperHandle } from "../keepers-v2";
import type { KeeperId } from "./tokens";

// Adapter: every screen still imports Keeper/KeeperFace from "@/design/psst", but they now render the
// v2 cast with motion (src/design/keepers-v2). Old props are kept so no call site changes.
export type KeeperMood = "rest" | "react" | "anxious";

type KeeperProps = {
  id: KeeperId;
  size: number;
  mood?: KeeperMood;
  muted?: boolean;
  sticker?: boolean;
  still?: boolean;
  label?: string;
  /** Tap to boop: the v2 tap reaction, plus one selection haptic at most every 3 s. Use on keepers 72pt or larger that sit outside another button. */
  boop?: boolean;
};

const BOOP_HAPTIC_GAP_MS = 3000;

export function Keeper({ id, size, mood = "rest", muted = false, boop = false }: KeeperProps) {
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
  return <KeeperV2 ref={ref} name={id} size={size} state={muted ? "muted" : "rest"} onLine={boop && !muted ? onBoop : undefined} />;
}

type KeeperFaceProps = { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean; label?: string };

export function KeeperFace({ id, size, mood = "rest", muted = false }: KeeperFaceProps) {
  return <KeeperAvatar name={id} size={size} state={muted ? "muted" : mood === "react" ? "smile" : "rest"} />;
}
