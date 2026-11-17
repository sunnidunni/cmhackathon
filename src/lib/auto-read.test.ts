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
  test("says so when the device can't save a change, and still applies it this session", async () => {
    store.get.mockResolvedValue(null);
    store.set.mockRejectedValue(new Error("no keychain"));
    const { getAutoRead, setAutoRead } = await import("./auto-read");
    expect(await setAutoRead(false)).toBe(false);
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
