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
