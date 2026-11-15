import { useEffect, useRef } from "react";
import { AnimatedKeeper, KeeperArt, KeeperAvatarArt, type AnimatedKeeperHandle } from "./keepers";
import type { KeeperId } from "./tokens";

export type KeeperMood = "rest" | "react" | "anxious";

type KeeperProps = {
  id: KeeperId;
  size: number;
  mood?: KeeperMood;
  muted?: boolean;
  sticker?: boolean;
  still?: boolean;
  label?: string;
};

export function Keeper({ id, size, mood = "rest", muted = false, sticker = false, still = false, label }: KeeperProps) {
  const ref = useRef<AnimatedKeeperHandle>(null);
  const cut = sticker ? 17 : 11;

  useEffect(() => {
    if (mood === "react") ref.current?.react();
  }, [mood]);

  if (still) return <KeeperArt id={id} size={size} pose={muted ? "muted" : "rest"} cut={cut} label={label} />;
  return <AnimatedKeeper ref={ref} id={id} size={size} muted={muted} cut={cut} label={label} />;
}

type KeeperFaceProps = { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean; label?: string };

export function KeeperFace({ id, size, mood = "rest", muted = false, label }: KeeperFaceProps) {
  return <KeeperAvatarArt id={id} size={size} pose={mood === "react" ? "react" : "rest"} muted={muted} label={label} />;
}
