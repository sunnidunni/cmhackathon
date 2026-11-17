import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex";
import { getReadAllPhotos, listCandidates, prepareForUpload } from "./photos";
import { File } from "expo-file-system";
import { findUnknown, limitKey, planUploads, QUICK_SCAN, scanSize } from "./sync-plan";

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
  try {
    const body = await (await fetch(uri)).blob();
    const uploadUrl = await convex.mutation(api.screenshots.generateUploadUrl, {});
    const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { storageId } = await res.json();
    // null: the server refused it, because the person removed this screenshot from Shots.
    return (await convex.mutation(api.screenshots.create, { deviceAssetId: asset.id, storageId, takenAt })) !== null;
  } finally {
    discardResized(uri);
  }
}

// prepareForUpload writes a resized JPEG to the cache for each screenshot. Delete it once the upload is over,
// or a large import leaves hundreds of megabytes behind. This is the copy, never the photo in the library.
function discardResized(uri: string) {
  try {
    new File(uri).delete();
  } catch {
    // The system clears the cache directory by itself when space runs low.
  }
}

const PARALLEL_UPLOADS = 3;
let running: Promise<SyncResult> | null = null;
let again: { quick: boolean } | null = null;

// The limit that the last complete, failure-free full sync ran under ("50", "all"), or null when there has been none.
// A quick sync is only trusted after a full one under the same limit: an import that was cut short, or an upgrade
// that lifts the limit, needs the whole library walked again.
const FULL_SYNC_KEY = "psst.fullSyncFor";
const getFullSyncFor = () => SecureStore.getItemAsync(FULL_SYNC_KEY).catch(() => null);
const setFullSyncFor = (key: string) => SecureStore.setItemAsync(FULL_SYNC_KEY, key).catch(() => undefined);

const askUnknown = (deviceAssetIds: string[]) => convex.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds });

// quick: the automatic sync when the app opens or the photo library changes. It first asks about only the newest
// few screenshots, and when none of those is new it stops there, which is the usual case and costs one small query.
// A full sync (first import, "Check now", pull to refresh) walks everything the plan allows.
async function syncOnce(wantQuick: boolean): Promise<SyncResult> {
  const { limit } = await convex.query(api.sync.importInfo, {});
  const scan = scanSize(limit);
  const quick = wantQuick && (await getFullSyncFor()) === limitKey(limit);
  if (quick) {
    const newest = await listCandidates(getReadAllPhotos(), Math.min(QUICK_SCAN, scan));
    if ((await askUnknown(newest.map((a) => a.id))).length === 0) return { uploaded: 0, failed: 0, skipped: newest.length };
  }
  const assets = await listCandidates(getReadAllPhotos(), scan);
  const ids = assets.map((a) => a.id);
  const unknown = await findUnknown(ids, askUnknown, quick);
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
  if (!quick && failed === 0) await setFullSyncFor(limitKey(limit));
  return result;
}

// Runs one sync at a time. A call while a sync runs queues exactly one more pass, so a screenshot
// taken mid-sync is still picked up. The queued pass is a full one if any caller asked for a full one.
export function runSync(opts?: { quick?: boolean }): Promise<SyncResult> {
  const quick = opts?.quick === true;
  if (running) {
    again = { quick: quick && (again?.quick ?? true) };
    return running;
  }
  setState({ status: "syncing", error: null });
  running = (async () => {
    try {
      let result = await syncOnce(quick);
      while (again) {
        const next = again;
        again = null;
        const more = await syncOnce(next.quick);
        result = { uploaded: result.uploaded + more.uploaded, failed: result.failed + more.failed, skipped: more.skipped };
      }
      setState({ status: "idle", last: result });
      return result;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
      throw e;
    } finally {
      running = null;
      again = null;
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
