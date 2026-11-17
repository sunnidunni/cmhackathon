import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex";
import { getPhotoAccess, getReadAllPhotos, listCandidates, prepareForUpload } from "./photos";
import { File } from "expo-file-system";
import { syncLibrary, type SyncResult } from "./sync-plan";

export type SyncStatus = "idle" | "syncing" | "error";
export type { SyncResult };
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

let running: Promise<SyncResult> | null = null;
let again: { quick: boolean } | null = null;

// See syncLibrary for what the checkpoint means.
const CHECKPOINT_KEY = "psst.fullSyncFor";

async function syncOnce(wantQuick: boolean): Promise<SyncResult> {
  const [{ limit }, access] = await Promise.all([convex.query(api.sync.importInfo, {}), getPhotoAccess()]);
  return syncLibrary(
    {
      limit,
      access,
      list: (count) => listCandidates(getReadAllPhotos(), count),
      askUnknown: (deviceAssetIds) => convex.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds }),
      upload: uploadOne,
      getCheckpoint: () => SecureStore.getItemAsync(CHECKPOINT_KEY).catch(() => null),
      setCheckpoint: async (key) => {
        await (key === null ? SecureStore.deleteItemAsync(CHECKPOINT_KEY) : SecureStore.setItemAsync(CHECKPOINT_KEY, key)).catch(() => undefined);
      },
    },
    wantQuick,
  );
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
