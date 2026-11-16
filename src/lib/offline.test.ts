import { describe, expect, test, vi } from "vitest";

describe("offline store", () => {
  test("starts online, goes offline once, and stays offline", async () => {
    vi.resetModules();
    const { isOffline, setOffline } = await import("./offline");
    expect(isOffline()).toBe(false);
    setOffline("Timed out while signing in");
    expect(isOffline()).toBe(true);
    setOffline("another reason");
    expect(isOffline()).toBe(true);
  });
});
