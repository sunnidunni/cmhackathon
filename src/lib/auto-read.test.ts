import { beforeEach, describe, expect, test, vi } from "vitest";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("expo-secure-store", () => ({ getItemAsync: store.get, setItemAsync: store.set }));

beforeEach(() => {
  vi.resetModules();
  store.get.mockReset();
  store.set.mockReset();
  store.set.mockResolvedValue(undefined);
});

describe("parseAutoRead", () => {
  test("is on when nothing is stored", async () => {
    const { parseAutoRead } = await import("./auto-read");
    expect(parseAutoRead(null)).toBe(true);
  });
  test("is off only for the stored off value", async () => {
    const { parseAutoRead } = await import("./auto-read");
    expect(parseAutoRead("0")).toBe(false);
    expect(parseAutoRead("1")).toBe(true);
  });
});

describe("removed assets", () => {
  test("starts empty and ignores unreadable stored values", async () => {
    const { parseRemovedAssets } = await import("./auto-read");
    expect(parseRemovedAssets(null)).toEqual([]);
    expect(parseRemovedAssets("not json")).toEqual([]);
    expect(parseRemovedAssets('{"a":1}')).toEqual([]);
    expect(parseRemovedAssets('["a",2,"b"]')).toEqual(["a", "b"]);
  });
  test("remembers a removed asset once and persists the list", async () => {
    store.get.mockResolvedValue('["a"]');
    const { getRemovedAssets, markRemovedAsset } = await import("./auto-read");
    await markRemovedAsset("b");
    await markRemovedAsset("b");
    expect(await getRemovedAssets()).toEqual(["a", "b"]);
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith("psst.removedAssets", '["a","b"]');
  });
  test("keeps only the newest 200", async () => {
    store.get.mockResolvedValue(JSON.stringify(Array.from({ length: 200 }, (_, i) => `id${i}`)));
    const { getRemovedAssets, markRemovedAsset } = await import("./auto-read");
    await markRemovedAsset("new");
    const ids = await getRemovedAssets();
    expect(ids).toHaveLength(200);
    expect(ids[0]).toBe("id1");
    expect(ids.at(-1)).toBe("new");
  });
});

describe("getAutoRead", () => {
  test("defaults to on when the device has no value", async () => {
    store.get.mockResolvedValue(null);
    const { getAutoRead } = await import("./auto-read");
    expect(await getAutoRead()).toBe(true);
  });
  test("defaults to on when the device can't be read", async () => {
    store.get.mockRejectedValue(new Error("no keychain"));
    const { getAutoRead } = await import("./auto-read");
    expect(await getAutoRead()).toBe(true);
  });
  test("returns the stored off value", async () => {
    store.get.mockResolvedValue("0");
    const { getAutoRead } = await import("./auto-read");
    expect(await getAutoRead()).toBe(false);
  });
  test("remembers a change and writes it to the device", async () => {
    store.get.mockResolvedValue(null);
    const { getAutoRead, setAutoRead } = await import("./auto-read");
    await setAutoRead(false);
    expect(store.set).toHaveBeenCalledWith("psst.autoRead", "0");
    expect(await getAutoRead()).toBe(false);
  });
});
