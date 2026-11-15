import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { listCandidates, prepareForUpload } from "./photos";

export type ImportResult = { kind: "uploaded" } | { kind: "nothing-new" } | { kind: "no-photos" };

// Phase 1: uploads the newest screenshot Convex does not know about yet.
export async function importOneScreenshot(
  convex: ConvexReactClient,
  readAllPhotos: boolean,
): Promise<ImportResult> {
  const candidates = await listCandidates(readAllPhotos, 50);
  if (candidates.length === 0) return { kind: "no-photos" };

  const unknown = new Set(
    await convex.query(api.screenshots.unknownDeviceAssetIds, {
      deviceAssetIds: candidates.map((a) => a.id),
    }),
  );
  const asset = candidates.find((a) => unknown.has(a.id));
  if (!asset) return { kind: "nothing-new" };

  const { uri, takenAt } = await prepareForUpload(asset);
  const body = await (await fetch(uri)).blob();
  const uploadUrl = await convex.mutation(api.screenshots.generateUploadUrl, {});
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const { storageId } = await res.json();
  await convex.mutation(api.screenshots.create, { deviceAssetId: asset.id, storageId, takenAt });
  return { kind: "uploaded" };
}
