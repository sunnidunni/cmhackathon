import { useEffect, useRef } from "react";
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
};

export function Keeper({ id, size, mood = "rest", muted = false }: KeeperProps) {
  // "react" plays the tap reaction once each time the mood flips to react.
  const ref = useRef<KeeperHandle>(null);
  useEffect(() => {
    if (mood === "react") ref.current?.play("tap");
  }, [mood]);
  return <KeeperV2 ref={ref} name={id} size={size} state={muted ? "muted" : "rest"} />;
}

type KeeperFaceProps = { id: KeeperId; size: number; mood?: KeeperMood; muted?: boolean; still?: boolean; label?: string };

export function KeeperFace({ id, size, mood = "rest", muted = false }: KeeperFaceProps) {
  return <KeeperAvatar name={id} size={size} state={muted ? "muted" : mood === "react" ? "smile" : "rest"} />;
}
