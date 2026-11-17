import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex";
import { getReadAllPhotos, listCandidates, prepareForUpload } from "./photos";
import { chunk, planUploads, scanSize } from "./sync-plan";

export type SyncStatus = "idle" | "syncing" | "error";
export type SyncResult = { uploaded: number; failed: number; skipped: number };
type SyncState = { status: SyncStatus; error: string | null; last: SyncResult | null };

let state: SyncState = { status: "idle", error: null, last: null };
const listeners = new Set<() => void>();
function setState(next: Partial<SyncState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Uploads one screenshot. Resolves false when the server did not take it.
async function uploadOne(asset: Awaited<ReturnType<typeof listCandidates>>[number]): Promise<boolean> {
  const { uri, takenAt } = await prepareForUpload(asset);
  const body = await (await fetch(uri)).blob();
  const uploadUrl = await convex.mutation(api.screenshots.generateUploadUrl, {});
  const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const { storageId } = await res.json();
  // null: the server refused it, because the person removed this screenshot from Shots.
  return (await convex.mutation(api.screenshots.create, { deviceAssetId: asset.id, storageId, takenAt })) !== null;
}

const PARALLEL_UPLOADS = 3;
let running: Promise<SyncResult> | null = null;
let again = false;

async function syncOnce(): Promise<SyncResult> {
  const { limit } = await convex.query(api.sync.importInfo, {});
  const assets = await listCandidates(getReadAllPhotos(), scanSize(limit));
  const ids = assets.map((a) => a.id);
  const unknown: string[] = [];
  for (const part of chunk(ids, 100)) {
    unknown.push(...(await convex.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: part })));
  }
  const plan = new Set(planUploads(ids, unknown, limit));
  const queue = assets.filter((a) => plan.has(a.id));
  let uploaded = 0;
  let failed = 0;
  let lastError: unknown = null;
  async function worker() {
    for (let asset = queue.shift(); asset; asset = queue.shift()) {
      try {
        if (await uploadOne(asset)) uploaded++;
      } catch (e) {
        failed++;
        lastError = e;
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));
  const result = { uploaded, failed, skipped: ids.length - plan.size };
  if (failed > 0 && uploaded === 0) throw lastError instanceof Error ? lastError : new Error(String(lastError));
  return result;
}

// Runs one sync at a time. A call while a sync runs queues exactly one more pass, so a screenshot
// taken mid-sync is still picked up.
export function runSync(): Promise<SyncResult> {
  if (running) {
    again = true;
    return running;
  }
  setState({ status: "syncing", error: null });
  running = (async () => {
    try {
      let result = await syncOnce();
      while (again) {
        again = false;
        const next = await syncOnce();
        result = { uploaded: result.uploaded + next.uploaded, failed: result.failed + next.failed, skipped: next.skipped };
      }
      setState({ status: "idle", last: result });
      return result;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
      throw e;
    } finally {
      running = null;
      again = false;
    }
  })();
  return running;
}

export function useSync() {
  const s = useSyncExternalStore(subscribe, () => state);
  const syncNow = useCallback(() => runSync(), []);
  return { status: s.status, error: s.error, syncNow };
}

// Whether the user has tapped "Bring in my screenshots". Kept on the device; lifecycle syncs only after it.
const IMPORT_STARTED_KEY = "psst.importStarted";
let importStarted: boolean | null = null;
const importListeners = new Set<() => void>();
let loading: Promise<boolean> | null = null;

export function getImportStarted(): Promise<boolean> {
  if (importStarted !== null) return Promise.resolve(importStarted);
  loading ??= SecureStore.getItemAsync(IMPORT_STARTED_KEY)
    .then((v) => v === "1")
    .catch(() => false)
    .then((v) => {
      importStarted ??= v;
      importListeners.forEach((l) => l());
      return importStarted;
    });
  return loading;
}

export async function markImportStarted() {
  importStarted = true;
  importListeners.forEach((l) => l());
  await SecureStore.setItemAsync(IMPORT_STARTED_KEY, "1").catch(() => undefined);
}

// started is null until read from the device.
export function useImportStarted() {
  const started = useSyncExternalStore(
    (l) => {
      importListeners.add(l);
      void getImportStarted();
      return () => importListeners.delete(l);
    },
    () => importStarted,
  );
  return { started, markStarted: markImportStarted };
}
