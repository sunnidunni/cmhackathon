import Svg from "react-native-svg";
import type { KeeperId } from "../tokens";
import { ART, AVATAR, type ArtPose, type AvatarPose } from "./art-data";
import { HIDDEN_FROM_SCREEN_READERS, renderCut, renderParts, useRoleColors } from "./parts";

export type KeeperArtPose = ArtPose | "muted";

type KeeperArtProps = {
  id: KeeperId;
  size: number;
  pose?: KeeperArtPose;
  cut?: number;
  label?: string;
};

export function poseParts(id: KeeperId, pose: ArtPose) {
  return ART[id][pose] ?? ART[id].rest!;
}

export function KeeperArt({ id, size, pose = "rest", cut = 11, label }: KeeperArtProps) {
  const muted = pose === "muted";
  const colors = useRoleColors(id, muted);
  const parts = poseParts(id, muted ? "rest" : pose);
  const a11y = label ? { accessible: true, accessibilityRole: "image", accessibilityLabel: label } as const : HIDDEN_FROM_SCREEN_READERS;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" {...a11y}>
      {cut > 0 ? renderCut(parts, colors, cut) : null}
      {renderParts(parts, colors)}
    </Svg>
  );
}

type KeeperAvatarArtProps = {
  id: KeeperId;
  size: number;
  pose?: AvatarPose;
  muted?: boolean;
  label?: string;
};

export function KeeperAvatarArt({ id, size, pose = "rest", muted = false, label }: KeeperAvatarArtProps) {
  const colors = useRoleColors(id, muted);
  const a11y = label ? { accessible: true, accessibilityRole: "image", accessibilityLabel: label } as const : HIDDEN_FROM_SCREEN_READERS;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" {...a11y}>
      {renderParts(AVATAR[id][pose], colors)}
    </Svg>
  );
}
