import { describe, expect, test } from "vitest";
import { checkpointKey, chunk, findUnknown, limitKey, planUploads, QUICK_SCAN, scanSize, syncLibrary, UNCAPPED_SCAN, type SyncDeps } from "./sync-plan";

describe("planUploads", () => {
  test("uploads only unknown ids, newest first", () => {
    expect(planUploads(["n3", "n2", "n1"], ["n1", "n3"], null)).toEqual(["n3", "n1"]);
  });
  test("skips everything the server already knows", () => {
    expect(planUploads(["a", "b"], [], null)).toEqual([]);
  });
  test("the cap applies to the newest library assets, not to the unknown ones", () => {
    expect(planUploads(["a", "b", "c", "d"], ["b", "d"], 2)).toEqual(["b"]);
  });
  test("a zero cap uploads nothing", () => {
    expect(planUploads(["a"], ["a"], 0)).toEqual([]);
  });
  test("duplicate ids upload once", () => {
    expect(planUploads(["a", "a", "b"], ["a", "b"], null)).toEqual(["a", "b"]);
  });
});

describe("plan limits (DER-19)", () => {
  const library = Array.from({ length: 80 }, (_, i) => `a${i}`);
  test("a free user (limit 50) stops at the newest 50", () => {
    expect(scanSize(50)).toBe(50);
    expect(planUploads(library.slice(0, scanSize(50)), library, 50)).toEqual(library.slice(0, 50));
  });
  test("a paid user (limit null) imports past 50", () => {
    expect(scanSize(null)).toBeGreaterThan(library.length);
    expect(planUploads(library.slice(0, scanSize(null)), library, null)).toHaveLength(80);
  });
});

test("scanSize uses the cap or the ceiling", () => {
  expect(scanSize(50)).toBe(50);
  expect(scanSize(null)).toBe(UNCAPPED_SCAN);
});

test("chunk splits evenly with a short tail", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
});

describe("findUnknown", () => {
  const ids = Array.from({ length: 10 }, (_, i) => `a${i}`);
  // A fake server that does not know the ids listed in `missing`, and records what it was asked.
  const server = (missing: string[]) => {
    const asked: string[][] = [];
    const ask = async (chunk: string[]) => {
      asked.push(chunk);
      return chunk.filter((id) => missing.includes(id));
    };
    return { ask, asked };
  };

  test("a quick walk stops at the first chunk with nothing new", async () => {
    const { ask, asked } = server(["a1"]);
    expect(await findUnknown(ids, ask, true, 3)).toEqual(["a1"]);
    // Chunk one had a1; chunk two had nothing new, so chunks three and four were never asked about.
    expect(asked).toEqual([["a0", "a1", "a2"], ["a3", "a4", "a5"]]);
  });

  test("a quick walk with nothing new at all asks once", async () => {
    const { ask, asked } = server([]);
    expect(await findUnknown(ids, ask, true, 3)).toEqual([]);
    expect(asked).toHaveLength(1);
  });

  test("a quick walk keeps going while every chunk has something new, so a fresh library is walked to the end", async () => {
    const { ask, asked } = server(ids);
    expect(await findUnknown(ids, ask, true, 3)).toEqual(ids);
    expect(asked).toHaveLength(4);
  });

  test("a full walk asks about every chunk, and finds an old gap a quick walk would stop before", async () => {
    const { ask, asked } = server(["a9"]);
    expect(await findUnknown(ids, ask, false, 3)).toEqual(["a9"]);
    expect(asked).toHaveLength(4);
    const quick = server(["a9"]);
    expect(await findUnknown(ids, quick.ask, true, 3)).toEqual([]);
  });

  test("the stored limit tells a free plan from an unlimited one", () => {
    expect(limitKey(50)).toBe("50");
    expect(limitKey(null)).toBe("all");
  });
});

describe("syncLibrary", () => {
  type Asset = { id: string };
  // A phone and a server, in memory. `library` is newest first. `failing` ids reject on upload.
  function world(opts: { library: string[]; onServer?: string[]; limit?: number | null; access?: string; checkpoint?: string | null; failing?: string[] }) {
    const state = {
      library: [...opts.library],
      server: new Set(opts.onServer ?? []),
      checkpoint: opts.checkpoint ?? null,
      failing: new Set(opts.failing ?? []),
      access: opts.access ?? "full",
      limit: opts.limit === undefined ? null : opts.limit,
      lists: [] as number[],
      asks: 0,
      uploads: [] as string[],
    };
    const deps = (): SyncDeps<Asset> => ({
      limit: state.limit,
      access: state.access,
      list: async (count) => {
        state.lists.push(count);
        return state.library.slice(0, count).map((id) => ({ id }));
      },
      askUnknown: async (ids) => {
        state.asks++;
        return ids.filter((id) => !state.server.has(id));
      },
      upload: async ({ id }) => {
        state.uploads.push(id);
        if (state.failing.has(id)) throw new Error("upload failed");
        state.server.add(id);
        return true;
      },
      getCheckpoint: async () => state.checkpoint,
      setCheckpoint: async (key) => {
        state.checkpoint = key;
      },
      parallel: 1,
    });
    const run = (quick: boolean) => {
      state.lists = [];
      state.asks = 0;
      state.uploads = [];
      return syncLibrary(deps(), quick);
    };
    return { state, run };
  }
  const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

  test("a full sync uploads everything and records that it finished", async () => {
    const { state, run } = world({ library: ids("a", 250) });
    expect(await run(false)).toEqual({ uploaded: 250, failed: 0, skipped: 0 });
    expect(state.checkpoint).toBe(checkpointKey(null, "full"));
  });

  test("after that, an automatic sync with nothing new looks at the newest hundred, asks once, and stops", async () => {
    const { state, run } = world({ library: ids("a", 250), onServer: ids("a", 250), checkpoint: checkpointKey(null, "full") });
    expect(await run(true)).toEqual({ uploaded: 0, failed: 0, skipped: QUICK_SCAN });
    expect(state.lists).toEqual([QUICK_SCAN]);
    expect(state.asks).toBe(1);
    expect(state.checkpoint).toBe(checkpointKey(null, "full"));
  });

  test("an automatic sync is a full walk when no sync has finished yet", async () => {
    const { state, run } = world({ library: ids("a", 250), onServer: ids("a", 250) });
    await run(true);
    expect(state.lists).toEqual([UNCAPPED_SCAN]);
    expect(state.asks).toBe(3);
  });

  test("a failed upload behind the newest hundred is tried again by the next automatic sync", async () => {
    // A finished library of 300, then 150 new screenshots arrive. One of the older fifty fails to upload.
    const old = ids("old", 300);
    const fresh = ids("new", 150);
    const { state, run } = world({ library: [...fresh, ...old], onServer: old, checkpoint: checkpointKey(null, "full"), failing: ["new120"] });
    expect(await run(true)).toEqual({ uploaded: 149, failed: 1, skipped: 300 });
    // The record of a finished sync is gone, so the next automatic sync cannot stop at the newest hundred.
    expect(state.checkpoint).toBeNull();

    state.failing.clear();
    expect(await run(true)).toMatchObject({ uploaded: 1, failed: 0 });
    expect(state.uploads).toEqual(["new120"]);
    expect(state.server.has("new120")).toBe(true);
    expect(state.checkpoint).toBe(checkpointKey(null, "full"));
  });

  test("a sync cut short part-way leaves no record of having finished", async () => {
    const { state, run } = world({ library: ids("a", 5), checkpoint: checkpointKey(null, "full"), failing: ids("a", 5) });
    await expect(run(true)).rejects.toThrow("upload failed");
    expect(state.checkpoint).toBeNull();
  });

  test("with limited photo access an automatic sync always walks everything, so older photos the person adds are found", async () => {
    // The newest hundred are already in. The person then shares 40 older photos through the picker.
    const newest = ids("n", 100);
    const { state, run } = world({ library: newest, onServer: newest, access: "limited", checkpoint: checkpointKey(null, "limited") });
    state.library = [...newest, ...ids("older", 40)];
    expect(await run(true)).toMatchObject({ uploaded: 40, failed: 0 });
    expect(state.lists).toEqual([UNCAPPED_SCAN]);
  });

  test("going from limited to full access makes the next automatic sync a full walk", async () => {
    const newest = ids("n", 100);
    const { state, run } = world({ library: [...newest, ...ids("older", 40)], onServer: newest, access: "full", checkpoint: checkpointKey(null, "limited") });
    expect(await run(true)).toMatchObject({ uploaded: 40 });
    expect(state.checkpoint).toBe(checkpointKey(null, "full"));
  });

  test("an upgrade that lifts the limit makes the next automatic sync a full walk", async () => {
    const library = ids("a", 200);
    const { state, run } = world({ library, onServer: library.slice(0, 50), limit: null, checkpoint: checkpointKey(50, "full") });
    expect(await run(true)).toMatchObject({ uploaded: 150 });
    expect(state.checkpoint).toBe(checkpointKey(null, "full"));
  });

  test("the free limit still holds: only the newest fifty are ever considered", async () => {
    const { state, run } = world({ library: ids("a", 80), limit: 50 });
    expect(await run(false)).toEqual({ uploaded: 50, failed: 0, skipped: 0 });
    expect(state.lists).toEqual([50]);
    expect(state.server.has("a50")).toBe(false);
  });

  test("an upload the server declines is not counted as uploaded, and is not a failure", async () => {
    const result = await syncLibrary<Asset>(
      {
        limit: null,
        access: "full",
        list: async () => [{ id: "a" }, { id: "b" }],
        askUnknown: async (list) => list,
        upload: async ({ id }) => id !== "b",
        getCheckpoint: async () => null,
        setCheckpoint: async () => undefined,
      },
      false,
    );
    expect(result).toEqual({ uploaded: 1, failed: 0, skipped: 0 });
  });
});
