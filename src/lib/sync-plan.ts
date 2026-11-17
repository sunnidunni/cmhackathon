// Pure decisions for album sync. No React Native imports, so it runs under vitest.

// candidateIds are the library's asset ids, newest first. The cap applies to the newest assets in the
// library (free plan: latest 50), so an older unknown asset never displaces a newer known one.
export function planUploads(
  candidateIds: readonly string[],
  unknownIds: Iterable<string>,
  limit: number | null,
): string[] {
  const window = limit === null ? candidateIds : candidateIds.slice(0, Math.max(0, limit));
  const unknown = new Set(unknownIds);
  const seen = new Set<string>();
  const plan: string[] = [];
  for (const id of window) {
    if (!unknown.has(id) || seen.has(id)) continue;
    seen.add(id);
    plan.push(id);
  }
  return plan;
}

// How many library assets to read: the cap when there is one, else a generous ceiling.
export const UNCAPPED_SCAN = 2000;
export function scanSize(limit: number | null): number {
  return limit === null ? UNCAPPED_SCAN : Math.max(0, limit);
}

// unknownDeviceAssetIds takes the ids as query args; keep each call small.
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// How many of the newest library assets a quick sync looks at first.
export const QUICK_SCAN = 100;

// Asks the server, a chunk at a time and newest first, which of these ids it does not have.
// A quick walk stops at the first chunk with nothing new in it. Screenshots are brought in newest first,
// so once a whole chunk is already known, the older ones behind it are too. A full walk asks about every chunk.
export async function findUnknown(ids: readonly string[], ask: (ids: string[]) => Promise<string[]>, quick: boolean, size = 100): Promise<string[]> {
  const unknown: string[] = [];
  for (const part of chunk(ids, size)) {
    const found = await ask(part);
    unknown.push(...found);
    if (quick && found.length === 0) break;
  }
  return unknown;
}

// The import limit as a stored value: the number, or "all" when there is none.
export const limitKey = (limit: number | null) => (limit === null ? "all" : String(limit));

// What a checkpoint records: the plan limit and the photo access a complete sync ran under.
// A quick sync is only trusted while both are unchanged.
export const checkpointKey = (limit: number | null, access: string) => `${limitKey(limit)}:${access}`;

export type SyncResult = { uploaded: number; failed: number; skipped: number };

// Everything a sync needs from outside, so the logic below runs under test with fakes.
export type SyncDeps<A extends { id: string }> = {
  // The plan's import limit; null means none.
  limit: number | null;
  // Photo access right now: "full" or "limited".
  access: string;
  // The newest `count` library assets, newest first.
  list: (count: number) => Promise<A[]>;
  // Of these ids, the ones the server does not have.
  askUnknown: (ids: string[]) => Promise<string[]>;
  // Uploads one asset. Resolves false when the server declined it; rejects when the upload failed.
  upload: (asset: A) => Promise<boolean>;
  // The stored checkpoint (see checkpointKey), or null. set(null) clears it.
  getCheckpoint: () => Promise<string | null>;
  setCheckpoint: (key: string | null) => Promise<void>;
  parallel?: number;
};

// One sync of the photo library into Shots.
//
// wantQuick is the automatic sync when the app opens or the library changes. It asks about only the newest few
// screenshots first and stops there when none is new, which is the usual case and costs one small query.
// A full sync (first import, "Check now", pull to refresh) walks everything the plan allows.
//
// A quick sync is only trusted when all of these hold; otherwise it does a full walk:
// - the last sync finished with every upload in (the checkpoint), under the same plan limit and the same access;
// - access is "full". With "limited" access the person can add older photos at any time, and those would sit
//   behind an unchanged newest hundred where a quick sync never looks.
// The checkpoint is cleared before any upload starts and put back only when every upload went through, so a failed
// or interrupted upload makes the next automatic sync walk everything and try it again.
export async function syncLibrary<A extends { id: string }>(deps: SyncDeps<A>, wantQuick: boolean): Promise<SyncResult> {
  const key = checkpointKey(deps.limit, deps.access);
  const quick = wantQuick && deps.access === "full" && (await deps.getCheckpoint()) === key;
  const scan = scanSize(deps.limit);
  if (quick) {
    const newest = await deps.list(Math.min(QUICK_SCAN, scan));
    if ((await deps.askUnknown(newest.map((a) => a.id))).length === 0) return { uploaded: 0, failed: 0, skipped: newest.length };
  }
  const assets = await deps.list(scan);
  const ids = assets.map((a) => a.id);
  const unknown = await findUnknown(ids, deps.askUnknown, quick);
  const plan = new Set(planUploads(ids, unknown, deps.limit));
  const queue = assets.filter((a) => plan.has(a.id));
  if (queue.length > 0) await deps.setCheckpoint(null);
  let uploaded = 0;
  let failed = 0;
  let lastError: unknown = null;
  async function worker() {
    for (let asset = queue.shift(); asset; asset = queue.shift()) {
      try {
        if (await deps.upload(asset)) uploaded++;
      } catch (e) {
        failed++;
        lastError = e;
      }
    }
  }
  await Promise.all(Array.from({ length: deps.parallel ?? 3 }, worker));
  if (failed > 0 && uploaded === 0) throw lastError instanceof Error ? lastError : new Error(String(lastError));
  if (failed === 0) await deps.setCheckpoint(key);
  return { uploaded, failed, skipped: ids.length - plan.size };
}
