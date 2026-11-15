import { useEffect, useRef } from "react";
import { AnimatedKeeper, KeeperArt, KeeperAvatarArt, type AnimatedKeeperHandle } from "./keepers";
import { KEEPERS, type KeeperId } from "./tokens";

export type KeeperMood = "rest" | "react" | "anxious";

type KeeperProps = {
  id: KeeperId;
  size: number;
  mood?: KeeperMood;
  muted?: boolean;
  sticker?: boolean;
  still?: boolean;
};

export function Keeper({ id, size, mood = "rest", muted = false, sticker = false, still = false }: KeeperProps) {
  const ref = useRef<AnimatedKeeperHandle>(null);
  const cut = sticker ? 17 : 11;
  const label = KEEPERS[id].name;

  useEffect(() => {
    if (mood === "react") ref.current?.react();
  }, [mood]);

  if (still) return <KeeperArt id={id} size={size} pose={muted ? "muted" : "rest"} cut={cut} label={label} />;
  return <AnimatedKeeper ref={ref} id={id} size={size} muted={muted} cut={cut} label={label} />;
}

type KeeperFaceProps = { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean };

export function KeeperFace({ id, size, mood = "rest", muted = false }: KeeperFaceProps) {
  return <KeeperAvatarArt id={id} size={size} pose={mood === "react" ? "react" : "rest"} muted={muted} label={KEEPERS[id].name} />;
}
