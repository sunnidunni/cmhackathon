/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SORT_BATCH } from "./albums";
import { parseMatches, type AlbumBrief, type ShotBrief } from "./lib/albumModel";
import { buildPrompt, parseExtraction } from "./lib/extraction";
import schema from "./schema";

const matchAlbum = vi.fn<(album: AlbumBrief, shots: ShotBrief[]) => Promise<string[]>>();
vi.mock("./lib/albumModel", async (original) => ({
  ...(await original<typeof import("./lib/albumModel")>()),
  matchAlbum: (album: AlbumBrief, shots: ShotBrief[]) => matchAlbum(album, shots),
}));
vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeMemory: vi.fn() }));

const modules = import.meta.glob("./**/*.ts");

// The stub matches a screenshot when its title contains a word from the album name, such as "Ticket" in "Concert tickets".
const byTitle = async (album: AlbumBrief, shots: ShotBrief[]) => {
  const word = album.name.split(" ").pop()!.toLowerCase().replace(/s$/, "");
  return shots.filter((s) => s.title.toLowerCase().includes(word)).map((s) => s.key);
};

beforeEach(() => {
  vi.useFakeTimers();
  matchAlbum.mockReset().mockImplementation(byTitle);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  let n = 0;
  const shot = (title: string, extra: Record<string, unknown> = {}, owner: Id<"users"> = userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId: `a${n++}`,
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: 1000 + n,
        status: "ready",
        title,
        summary: `${title} summary`,
        category: "money",
        ...extra,
      }),
    );
  const settle = () => t.finishAllScheduledFunctions(vi.runAllTimers);
  return { t, userId, otherId, shot, settle, me: t.withIdentity({ subject: `${userId}|s` }), them: t.withIdentity({ subject: `${otherId}|s` }) };
}

const titles = async (me: ReturnType<Awaited<ReturnType<typeof setup>>["t"]["withIdentity"]>, albumId: Id<"albums">) =>
  (await me.query(api.albums.get, { albumId }))?.items.map((i) => i.title);

describe("album CRUD", () => {
  test("create, rename and delete, scoped to the signed-in user", async () => {
    const { me, them, settle } = await setup();
    const id = await me.mutation(api.albums.create, { name: "  Concert   tickets ", description: "Gig and show tickets" });
    await settle();
    expect(await me.query(api.albums.list, {})).toMatchObject([{ _id: id, name: "Concert tickets", description: "Gig and show tickets", count: 0, sortStatus: "done", cover: null }]);
    expect(await them.query(api.albums.list, {})).toEqual([]);
    expect(await them.query(api.albums.get, { albumId: id })).toBeNull();
    await expect(them.mutation(api.albums.update, { albumId: id, name: "Mine", description: "" })).rejects.toThrow("Album not found");
    await expect(them.mutation(api.albums.remove, { albumId: id })).rejects.toThrow("Album not found");

    await me.mutation(api.albums.update, { albumId: id, name: "Shows", description: "" });
    expect((await me.query(api.albums.get, { albumId: id }))?.name).toBe("Shows");
    await me.mutation(api.albums.remove, { albumId: id });
    expect(await me.query(api.albums.list, {})).toEqual([]);
    expect(await me.query(api.albums.get, { albumId: id })).toBeNull();
  });

  test("rejects an empty or too long name", async () => {
    const { me } = await setup();
    await expect(me.mutation(api.albums.create, { name: "  ", description: "" })).rejects.toThrow("Give the album a name");
    await expect(me.mutation(api.albums.create, { name: "x".repeat(41), description: "" })).rejects.toThrow("under 40");
  });

  test("get returns null for a malformed id instead of throwing", async () => {
    const { me } = await setup();
    expect(await me.query(api.albums.get, { albumId: "nope" })).toBeNull();
  });
});

describe("manual membership", () => {
  test("add and remove a screenshot; removing never deletes it, and it keeps its room", async () => {
    const { t, me, them, shot, settle } = await setup();
    const albumId = await me.mutation(api.albums.create, { name: "Favorites", description: "" });
    await settle();
    const id = await shot("Bill");
    await me.mutation(api.albums.setShot, { albumId, screenshotId: id, inAlbum: true });
    expect(await titles(me, albumId)).toEqual(["Bill"]);
    expect(await me.query(api.albums.forShot, { screenshotId: id })).toEqual([{ _id: albumId, name: "Favorites", inAlbum: true }]);
    await expect(them.mutation(api.albums.setShot, { albumId, screenshotId: id, inAlbum: false })).rejects.toThrow("Album not found");

    await me.mutation(api.albums.setShot, { albumId, screenshotId: id, inAlbum: false });
    expect(await titles(me, albumId)).toEqual([]);
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({ title: "Bill", category: "money" });
  });

  test("cannot add another user's screenshot", async () => {
    const { me, otherId, shot, settle } = await setup();
    const albumId = await me.mutation(api.albums.create, { name: "Favorites", description: "" });
    await settle();
    const theirs = await shot("Theirs", {}, otherId);
    await expect(me.mutation(api.albums.setShot, { albumId, screenshotId: theirs, inAlbum: true })).rejects.toThrow("Screenshot not found");
  });

  test("hides screenshots that are hidden or not read yet", async () => {
    const { me, shot, settle } = await setup();
    const albumId = await me.mutation(api.albums.create, { name: "Favorites", description: "" });
    await settle();
    for (const [title, extra] of [["Read", {}], ["Hidden", { hidden: true }], ["Reading", { status: "processing" }]] as const) {
      await me.mutation(api.albums.setShot, { albumId, screenshotId: await shot(title, extra), inAlbum: true });
    }
    expect(await titles(me, albumId)).toEqual(["Read"]);
  });
});

describe("cleanup", () => {
  test("deleting a screenshot removes it from its albums; deleting an album removes its memberships", async () => {
    const { t, me, shot, settle } = await setup();
    const a = await me.mutation(api.albums.create, { name: "Ticket stash", description: "" });
    const b = await me.mutation(api.albums.create, { name: "Other", description: "" });
    await settle();
    const gone = await shot("Ticket one");
    const kept = await shot("Ticket two");
    for (const albumId of [a, b]) for (const id of [gone, kept]) await me.mutation(api.albums.setShot, { albumId, screenshotId: id, inAlbum: true });

    await me.mutation(api.shots.remove, { id: gone });
    await settle();
    const rows = () => t.run((ctx) => ctx.db.query("albumShots").collect());
    expect((await rows()).map((r) => r.screenshotId).every((id) => id === kept)).toBe(true);

    await me.mutation(api.albums.remove, { albumId: a });
    expect((await rows()).map((r) => r.albumId)).toEqual([b]);
    expect(await t.run((ctx) => ctx.db.get(kept))).not.toBeNull();
  });

  test("delete everything removes albums and memberships", async () => {
    const { t, me, shot, settle } = await setup();
    const albumId = await me.mutation(api.albums.create, { name: "Favorites", description: "" });
    await settle();
    await me.mutation(api.albums.setShot, { albumId, screenshotId: await shot("Bill"), inAlbum: true });
    await me.mutation(api.shots.removeAll, {});
    await settle();
    expect(await t.run((ctx) => ctx.db.query("albums").collect())).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("albumShots").collect())).toEqual([]);
  });
});

describe("backfill sort", () => {
  test("creating an album sorts matching read screenshots in, and shows sorting until it finishes", async () => {
    const { me, shot, settle, otherId } = await setup();
    await shot("Taylor concert ticket");
    await shot("Recipe for soup");
    await shot("Movie ticket", { hidden: true });
    await shot("Their ticket", {}, otherId);
    const albumId = await me.mutation(api.albums.create, { name: "Concert tickets", description: "Gig and show tickets" });
    expect((await me.query(api.albums.get, { albumId }))?.sortStatus).toBe("sorting");
    await settle();
    expect(await me.query(api.albums.get, { albumId })).toMatchObject({ sortStatus: "done", items: [{ title: "Taylor concert ticket" }] });
    expect(matchAlbum.mock.calls[0][0]).toEqual({ name: "Concert tickets", description: "Gig and show tickets" });
    expect(matchAlbum.mock.calls[0][1].map((s) => s.title)).toEqual(["Recipe for soup", "Taylor concert ticket"]);
  });

  test("reads in batches across pages", async () => {
    const { me, shot, settle } = await setup();
    for (let i = 0; i < SORT_BATCH + 3; i++) await shot(`Ticket ${i}`);
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    expect(matchAlbum).toHaveBeenCalledTimes(2);
    expect((await titles(me, albumId))?.length).toBe(SORT_BATCH + 3);
  });

  test("a manual removal sticks through a re-sort, and a manual add survives one", async () => {
    const { me, shot, settle } = await setup();
    const ticket = await shot("Concert ticket");
    const soup = await shot("Soup recipe");
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    expect(await titles(me, albumId)).toEqual(["Concert ticket"]);

    await me.mutation(api.albums.setShot, { albumId, screenshotId: ticket, inAlbum: false });
    await me.mutation(api.albums.setShot, { albumId, screenshotId: soup, inAlbum: true });
    await me.mutation(api.albums.resort, { albumId });
    await settle();
    expect(await titles(me, albumId)).toEqual(["Soup recipe"]);
  });

  test("editing the description re-sorts: auto matches that no longer fit leave", async () => {
    const { me, shot, settle } = await setup();
    await shot("Concert ticket");
    await shot("Soup recipe");
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    await me.mutation(api.albums.update, { albumId, name: "Recipes", description: "Things to cook" });
    await settle();
    expect(await titles(me, albumId)).toEqual(["Soup recipe"]);
    expect(matchAlbum.mock.lastCall?.[0]).toEqual({ name: "Recipes", description: "Things to cook" });
  });

  test("an edit that changes nothing does not re-sort", async () => {
    const { me, settle, shot } = await setup();
    await shot("Concert ticket");
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    await me.mutation(api.albums.update, { albumId, name: " Tickets ", description: "" });
    await settle();
    expect(matchAlbum).toHaveBeenCalledTimes(1);
  });

  test("a model that keeps failing ends as failed after three tries, and a retry can finish", async () => {
    const { me, shot, settle } = await setup();
    await shot("Concert ticket");
    matchAlbum.mockRejectedValue(new Error("OpenAI 500"));
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    expect(matchAlbum).toHaveBeenCalledTimes(3);
    expect((await me.query(api.albums.get, { albumId }))?.sortStatus).toBe("failed");

    matchAlbum.mockImplementation(byTitle);
    await me.mutation(api.albums.resort, { albumId });
    await settle();
    expect(await me.query(api.albums.get, { albumId })).toMatchObject({ sortStatus: "done", items: [{ title: "Concert ticket" }] });
  });

  test("a stale run does nothing after the album changes or is deleted", async () => {
    const { t, me, shot } = await setup();
    const id = await shot("Concert ticket");
    const albumId = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    expect(await t.mutation(internal.albums.applySort, { albumId, run: 0, checked: [id], matched: [id] })).toBe(false);
    await me.mutation(api.albums.remove, { albumId });
    expect(await t.query(internal.albums.sortPage, { albumId, run: 1, cursor: null })).toBeNull();
  });
});

describe("sorting new screenshots during extraction", () => {
  const reply = { title: "Concert ticket", amount: "", text: "Row F", summary: "A ticket", category: "money", reason: "r", dates: [], todos: [], importance: 3, reactionKey: "money_01" };

  test("the single vision call returns album keys, and the screenshot joins those albums", async () => {
    const { t, me, shot, settle } = await setup();
    const tickets = await me.mutation(api.albums.create, { name: "Concert tickets", description: "Gig and show tickets" });
    const recipes = await me.mutation(api.albums.create, { name: "Recipes", description: "" });
    await settle();
    const fetch = vi.fn(async () => new Response(JSON.stringify({ output_text: JSON.stringify({ ...reply, albums: ["album1", "album9"] }) })));
    vi.stubGlobal("fetch", fetch);
    const id = await shot("", { status: "processing", startedAt: Date.now() });
    await t.action(internal.extract.run, { screenshotId: id });

    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    const prompt: string = body.input[0].content[0].text;
    expect(prompt).toContain("album1: Concert tickets (Gig and show tickets)\nalbum2: Recipes");
    expect(await titles(me, tickets)).toEqual(["Concert ticket"]);
    expect(await titles(me, recipes)).toEqual([]);
    expect((await t.run((ctx) => ctx.db.get(id)))?.category).toBe("money");
  });

  test("complete skips a manual removal and another user's album", async () => {
    const { t, me, them, shot, settle } = await setup();
    const mine = await me.mutation(api.albums.create, { name: "Tickets", description: "" });
    const theirs = await them.mutation(api.albums.create, { name: "Tickets", description: "" });
    await settle();
    const id = await shot("Concert ticket", { status: "processing" });
    await me.mutation(api.albums.setShot, { albumId: mine, screenshotId: id, inAlbum: false });
    const { amount: _a, ...rest } = reply;
    await t.mutation(internal.extract.complete, { screenshotId: id, ...rest, category: "money", albumIds: [mine, theirs] });
    expect(await t.run((ctx) => ctx.db.query("albumShots").collect())).toMatchObject([{ albumId: mine, removed: true }]);
  });
});

describe("parsing album matches", () => {
  test("parseMatches keeps only keys that were asked about, once each", () => {
    expect(parseMatches(JSON.stringify({ matches: ["s2", "s9", "s2", 4] }), ["s1", "s2", "s3"])).toEqual(["s2"]);
    expect(parseMatches(JSON.stringify({}), ["s1"])).toEqual([]);
  });

  test("parseExtraction keeps only known album keys, and the prompt says empty when there are no albums", () => {
    const raw = JSON.stringify({ title: "Bill", category: "money", albums: ["album2", "albumX"] });
    expect(parseExtraction(raw, undefined, Date.now(), ["album1", "album2"]).albums).toEqual(["album2"]);
    expect(parseExtraction(raw).albums).toEqual([]);
    expect(buildPrompt("2026-11-15")).toContain("- albums: always an empty array.");
  });
});
