import { Image } from "react-native";
import type { ShotDetail } from "@/components/ask/AnswerBlock";
import { DEMO_SHOTS, FIXTURES } from "@/lib/fixtures";
import { demoShotPrefix } from "./ids";

// react-native-web has no resolveAssetSource; there the bundler hands back the asset object or url directly.
export function assetUri(asset: unknown): string | null {
  if (typeof asset === "string") return asset;
  if (typeof asset === "object" && asset !== null && "uri" in asset) return String(asset.uri);
  return Image.resolveAssetSource?.(asset as number)?.uri ?? null;
}

// Dev-only: the shots.detail shape for a demo screenshot, so fixture ids never reach Convex.
export function fixtureShot(id: string | undefined): ShotDetail | undefined {
  const prefix = demoShotPrefix(id);
  const shot = FIXTURES ? DEMO_SHOTS.find((s) => s.id === id || (prefix !== null && s.id.startsWith(prefix + "-"))) : undefined;
  if (!shot) return undefined;
  return {
    _id: shot.id,
    status: "ready",
    title: shot.title,
    summary: shot.summary,
    reason: shot.reason,
    amount: shot.amount ?? null,
    category: shot.room,
    userMoved: false,
    lineKey: null,
    imageUrl: assetUri(shot.image),
    importance: shot.importance,
    takenAt: Date.parse(shot.savedAt),
    error: null,
    dates: shot.dates.map((d) => ({ ...d, reminder: null })),
  } as unknown as ShotDetail;
}
