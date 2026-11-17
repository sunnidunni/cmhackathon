import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { matchAlbum } from "./lib/albumModel";
import { readText } from "./lib/shotText";

export const MAX_ALBUMS = 20;
export const NAME_MAX = 40;
export const DESCRIPTION_MAX = 140;
// A backfill reads at most SORT_BATCH * SORT_PAGES of the newest screenshots, one model call per batch.
export const SORT_BATCH = 25;
export const SORT_PAGES = 20;
const SORT_TRIES = 3;

async function ownAlbum(ctx: QueryCtx, albumId: Id<"albums">) {
  const userId = await requireUserId(ctx);
  const album = await ctx.db.get(albumId);
  if (album === null || album.userId !== userId) throw new Error("Album not found");
  return album;
}

function clean(name: string, description: string) {
  const n = name.trim().replace(/\s+/g, " ");
  const d = description.trim().replace(/\s+/g, " ");
  if (n === "") throw new Error("Give the album a name");
  if (n.length > NAME_MAX) throw new Error(`Keep the name under ${NAME_MAX} characters`);
  if (d.length > DESCRIPTION_MAX) throw new Error(`Keep the description under ${DESCRIPTION_MAX} characters`);
  return { name: n, description: d };
}

const visible = (s: Doc<"screenshots"> | null): s is Doc<"screenshots"> => s !== null && s.status === "ready" && s.hidden !== true;

async function members(ctx: QueryCtx, albumId: Id<"albums">) {
  const rows = await ctx.db
    .query("albumShots")
    .withIndex("by_album_screenshot", (q) => q.eq("albumId", albumId))
    .collect();
  const shots = await Promise.all(rows.filter((r) => !r.removed).map((r) => ctx.db.get(r.screenshotId)));
  return shots.filter(visible).sort((a, b) => b.takenAt - a.takenAt);
}

const membership = (ctx: QueryCtx, albumId: Id<"albums">, screenshotId: Id<"screenshots">) =>
  ctx.db
    .query("albumShots")
    .withIndex("by_album_screenshot", (q) => q.eq("albumId", albumId).eq("screenshotId", screenshotId))
    .unique();

// Auto-sort adds a screenshot only when there is no row yet, so a manual removal (a removed row) sticks.
export async function autoAdd(ctx: MutationCtx, userId: Id<"users">, albumId: Id<"albums">, screenshotId: Id<"screenshots">) {
  const album = await ctx.db.get(albumId);
  if (album === null || album.userId !== userId) return;
  if ((await membership(ctx, albumId, screenshotId)) !== null) return;
  await ctx.db.insert("albumShots", { userId, albumId, screenshotId, source: "auto", removed: false, addedAt: Date.now() });
}

// Applies the vision call's album matches for a screenshot that just became ready. An album that was created or
// edited while the call ran was judged on an old definition or not at all, so it gets its own one-screenshot check.
export async function sortIntoAlbums(
  ctx: MutationCtx,
  userId: Id<"users">,
  screenshotId: Id<"screenshots">,
  { seen, matched }: { seen: { albumId: Id<"albums">; run: number }[]; matched: Id<"albums">[] },
) {
  const albums = await ctx.db.query("albums").withIndex("by_user_createdAt", (q) => q.eq("userId", userId)).collect();
  for (const album of albums) {
    const current = seen.some((s) => s.albumId === album._id && s.run === album.sortRun);
    if (!current) await ctx.scheduler.runAfter(0, internal.albums.sortShot, { albumId: album._id, run: album.sortRun, screenshotId, attempt: 0 });
    else if (matched.includes(album._id)) await autoAdd(ctx, userId, album._id, screenshotId);
  }
}

async function startSort(ctx: MutationCtx, album: Doc<"albums">) {
  const run = album.sortRun + 1;
  await ctx.db.patch(album._id, { sortRun: run, sortStatus: "sorting" });
  await ctx.scheduler.runAfter(0, internal.albums.sort, { albumId: album._id, run, cursor: null, page: 0, attempt: 0 });
}

// Deletes up to `limit` of the user's albums created at or before `before`. Returns how many it deleted.
export async function deleteAlbumsBefore(ctx: MutationCtx, userId: Id<"users">, before: number, limit: number) {
  const albums = await ctx.db
    .query("albums")
    .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
    .filter((q) => q.lte(q.field("_creationTime"), before))
    .take(limit);
  for (const album of albums) await deleteAlbum(ctx, album._id);
  return albums.length;
}

async function deleteAlbum(ctx: MutationCtx, albumId: Id<"albums">) {
  const rows = await ctx.db
    .query("albumShots")
    .withIndex("by_album_screenshot", (q) => q.eq("albumId", albumId))
    .collect();
  for (const r of rows) await ctx.db.delete(r._id);
  await ctx.db.delete(albumId);
}

export async function forgetShot(ctx: MutationCtx, screenshotId: Id<"screenshots">) {
  const rows = await ctx.db
    .query("albumShots")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", screenshotId))
    .collect();
  for (const r of rows) await ctx.db.delete(r._id);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const albums = await ctx.db
      .query("albums")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      albums.map(async (a) => {
        const shots = await members(ctx, a._id);
        return {
          _id: a._id,
          name: a.name,
          description: a.description,
          sortStatus: a.sortStatus,
          count: shots.length,
          cover: shots[0] ? { title: shots[0].title ?? "", imageUrl: await ctx.storage.getUrl(shots[0].storageId) } : null,
        };
      }),
    );
  },
});

export const get = query({
  args: { albumId: v.string() },
  handler: async (ctx, { albumId }) => {
    const userId = await requireUserId(ctx);
    const id = ctx.db.normalizeId("albums", albumId);
    const album = id ? await ctx.db.get(id) : null;
    if (album === null || album.userId !== userId) return null;
    const shots = await members(ctx, album._id);
    return {
      _id: album._id,
      name: album.name,
      description: album.description,
      sortStatus: album.sortStatus,
      items: await Promise.all(
        shots.map(async (s) => ({
          _id: s._id,
          title: s.title ?? "",
          date: (s.dates ?? []).find((d) => d.confident)?.when ?? null,
          imageUrl: await ctx.storage.getUrl(s.storageId),
          takenAt: s.takenAt,
        })),
      ),
    };
  },
});

// Every album with whether this screenshot is in it, for the picker on the screenshot screen.
export const forShot = query({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, { screenshotId }) => {
    const userId = await requireUserId(ctx);
    const albums = await ctx.db
      .query("albums")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      albums.map(async (a) => {
        const row = await membership(ctx, a._id, screenshotId);
        return { _id: a._id, name: a.name, inAlbum: row !== null && !row.removed };
      }),
    );
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.query("albums").withIndex("by_user_createdAt", (q) => q.eq("userId", userId)).collect();
    if (existing.length >= MAX_ALBUMS) throw new Error(`You can have up to ${MAX_ALBUMS} albums`);
    const id = await ctx.db.insert("albums", { userId, ...clean(args.name, args.description), createdAt: Date.now(), sortStatus: "done", sortRun: 0 });
    await startSort(ctx, (await ctx.db.get(id))!);
    return id;
  },
});

export const update = mutation({
  args: { albumId: v.id("albums"), name: v.string(), description: v.string() },
  handler: async (ctx, { albumId, ...args }) => {
    const album = await ownAlbum(ctx, albumId);
    const next = clean(args.name, args.description);
    if (next.name === album.name && next.description === album.description) return null;
    await ctx.db.patch(albumId, next);
    await startSort(ctx, { ...album, ...next });
    return null;
  },
});

export const resort = mutation({
  args: { albumId: v.id("albums") },
  handler: async (ctx, { albumId }) => {
    await startSort(ctx, await ownAlbum(ctx, albumId));
    return null;
  },
});

export const remove = mutation({
  args: { albumId: v.id("albums") },
  handler: async (ctx, { albumId }) => {
    await ownAlbum(ctx, albumId);
    await deleteAlbum(ctx, albumId);
    return null;
  },
});

// A manual add or removal. Removal keeps the row as a tombstone so auto-sort never puts it back.
export const setShot = mutation({
  args: { albumId: v.id("albums"), screenshotId: v.id("screenshots"), inAlbum: v.boolean() },
  handler: async (ctx, { albumId, screenshotId, inAlbum }) => {
    const album = await ownAlbum(ctx, albumId);
    const shot = await ctx.db.get(screenshotId);
    if (shot === null || shot.userId !== album.userId) throw new Error("Screenshot not found");
    const row = await membership(ctx, albumId, screenshotId);
    if (row === null)
      await ctx.db.insert("albumShots", { userId: album.userId, albumId, screenshotId, source: "manual", removed: !inAlbum, addedAt: Date.now() });
    else await ctx.db.patch(row._id, inAlbum ? { source: "manual", removed: false, addedAt: Date.now() } : { source: "manual", removed: true });
    return null;
  },
});

const stale = (album: Doc<"albums"> | null, run: number) => album === null || album.sortRun !== run;

export const sortPage = internalQuery({
  args: { albumId: v.id("albums"), run: v.number(), cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { albumId, run, cursor }) => {
    const album = await ctx.db.get(albumId);
    if (stale(album, run)) return null;
    const page = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", album!.userId))
      .order("desc")
      .paginate({ cursor, numItems: SORT_BATCH });
    return {
      album: { name: album!.name, description: album!.description },
      shots: await Promise.all(page.page.filter(visible).map(async (s) => ({ id: s._id, title: s.title ?? "", summary: s.summary ?? "", text: await readText(ctx, s) }))),
      cursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const shotForSort = internalQuery({
  args: { albumId: v.id("albums"), run: v.number(), screenshotId: v.id("screenshots") },
  handler: async (ctx, { albumId, run, screenshotId }) => {
    const album = await ctx.db.get(albumId);
    const shot = await ctx.db.get(screenshotId);
    if (stale(album, run) || !visible(shot) || shot.userId !== album!.userId) return null;
    return { album: { name: album!.name, description: album!.description }, shot: { key: "s1", title: shot.title ?? "", summary: shot.summary ?? "", text: await readText(ctx, shot) } };
  },
});

export const sortShot = internalAction({
  args: { albumId: v.id("albums"), run: v.number(), screenshotId: v.id("screenshots"), attempt: v.number() },
  handler: async (ctx, args) => {
    const { albumId, run, screenshotId, attempt } = args;
    const target = await ctx.runQuery(internal.albums.shotForSort, { albumId, run, screenshotId });
    if (target === null) return;
    let matched: string[];
    try {
      matched = await matchAlbum(target.album, [target.shot]);
    } catch {
      if (attempt + 1 < SORT_TRIES) await ctx.scheduler.runAfter(5000 * 2 ** attempt, internal.albums.sortShot, { ...args, attempt: attempt + 1 });
      return;
    }
    await ctx.runMutation(internal.albums.applySort, { albumId, run, checked: [screenshotId], matched: matched.length > 0 ? [screenshotId] : [] });
  },
});

// Applies one batch's verdict: matches are added, auto rows that no longer match leave. Manual rows and removals are kept.
export const applySort = internalMutation({
  args: { albumId: v.id("albums"), run: v.number(), checked: v.array(v.id("screenshots")), matched: v.array(v.id("screenshots")) },
  handler: async (ctx, { albumId, run, checked, matched }) => {
    const album = await ctx.db.get(albumId);
    if (stale(album, run)) return false;
    for (const screenshotId of checked) {
      const row = await membership(ctx, albumId, screenshotId);
      if (matched.includes(screenshotId)) await autoAdd(ctx, album!.userId, albumId, screenshotId);
      else if (row !== null && row.source === "auto" && !row.removed) await ctx.db.delete(row._id);
    }
    return true;
  },
});

export const finishSort = internalMutation({
  args: { albumId: v.id("albums"), run: v.number(), status: v.union(v.literal("done"), v.literal("failed")) },
  handler: async (ctx, { albumId, run, status }) => {
    const album = await ctx.db.get(albumId);
    if (stale(album, run)) return;
    await ctx.db.patch(albumId, { sortStatus: status });
  },
});

// Sorts the newest screenshots into an album one batch at a time. A newer run (an edit) or a deleted album stops it.
export const sort = internalAction({
  args: { albumId: v.id("albums"), run: v.number(), cursor: v.union(v.string(), v.null()), page: v.number(), attempt: v.number() },
  handler: async (ctx, args) => {
    const { albumId, run, cursor, page, attempt } = args;
    const batch = await ctx.runQuery(internal.albums.sortPage, { albumId, run, cursor });
    if (batch === null) return;
    if (batch.shots.length > 0) {
      const keyed = batch.shots.map((s, i) => ({ ...s, key: `s${i + 1}` }));
      let matched: string[];
      try {
        matched = await matchAlbum(batch.album, keyed);
      } catch {
        if (attempt + 1 < SORT_TRIES) await ctx.scheduler.runAfter(5000 * 2 ** attempt, internal.albums.sort, { ...args, attempt: attempt + 1 });
        else await ctx.runMutation(internal.albums.finishSort, { albumId, run, status: "failed" });
        return;
      }
      const ok = await ctx.runMutation(internal.albums.applySort, {
        albumId,
        run,
        checked: keyed.map((s) => s.id),
        matched: keyed.filter((s) => matched.includes(s.key)).map((s) => s.id),
      });
      if (!ok) return;
    }
    if (batch.isDone || page + 1 >= SORT_PAGES) await ctx.runMutation(internal.albums.finishSort, { albumId, run, status: "done" });
    else await ctx.scheduler.runAfter(0, internal.albums.sort, { albumId, run, cursor: batch.cursor, page: page + 1, attempt: 0 });
  },
});
