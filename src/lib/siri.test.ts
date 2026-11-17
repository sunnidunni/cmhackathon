import { describe, expect, test } from "vitest";
import { siriAddress } from "./siri";

describe("siriAddress", () => {
  test("a cloud deployment serves the Shortcut under convex.site", () => {
    expect(siriAddress("https://frugal-grasshopper-744.convex.cloud")).toBe("https://frugal-grasshopper-744.convex.site/siri/ask");
    expect(siriAddress("https://frugal-grasshopper-744.convex.cloud/")).toBe("https://frugal-grasshopper-744.convex.site/siri/ask");
  });
  test("a local deployment serves it one port up", () => {
    expect(siriAddress("http://127.0.0.1:3210")).toBe("http://127.0.0.1:3211/siri/ask");
  });
  test("a site address given outright wins", () => {
    expect(siriAddress("https://a.convex.cloud", "https://api.example.com/")).toBe("https://api.example.com/siri/ask");
  });
  test("an address it cannot work out gives none, so the screen can say so instead of showing a wrong one", () => {
    expect(siriAddress("https://db.example.com")).toBeNull();
    expect(siriAddress(undefined)).toBeNull();
  });
});
