import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

async function load(devTools: boolean) {
  vi.resetModules();
  vi.stubEnv("EXPO_PUBLIC_DEV_TOOLS", devTools ? "1" : "");
  return import("./offline");
}

describe("offline store", () => {
  test("a demo build starts online, goes offline once, and stays offline", async () => {
    const { isOffline, setOffline } = await load(true);
    expect(isOffline()).toBe(false);
    setOffline("Timed out while signing in");
    expect(isOffline()).toBe(true);
    setOffline("another reason");
    expect(isOffline()).toBe(true);
  });

  test("a build for real users never goes offline, so it never swaps in sample data", async () => {
    const { isOffline, setOffline, SAMPLE_DATA_WHEN_OFFLINE } = await load(false);
    expect(SAMPLE_DATA_WHEN_OFFLINE).toBe(false);
    setOffline("Timed out while signing in");
    expect(isOffline()).toBe(false);
  });
});
