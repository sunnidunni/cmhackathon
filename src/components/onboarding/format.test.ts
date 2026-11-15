import { describe, expect, it } from "vitest";
import { bringInCount, bringInHeadline, bringInState, broughtInLine, failedLabel, howManyLine } from "./format";

describe("bring in count", () => {
  it("caps the phone's count at the plan limit", () => {
    expect(bringInCount(80, 50)).toBe(50);
    expect(bringInCount(16, 50)).toBe(16);
    expect(bringInCount(80, null)).toBe(80);
  });
  it("words the headline and the how-many line", () => {
    expect(bringInHeadline(16)).toBe("Bring in your 16 newest screenshots.");
    expect(bringInHeadline(1)).toBe("Bring in your newest screenshot.");
    expect(bringInHeadline(0)).toBe("Bring in your screenshots.");
    expect(howManyLine(16, 50)).toBe("All 16 on this phone (up to 50) · about 1 minute");
    expect(howManyLine(16, null)).toBe("All 16 on this phone · about 1 minute");
  });
});

describe("bring in", () => {
  it("is working until the sync result arrives", () => {
    expect(bringInState(null, false)).toEqual({ kind: "working" });
  });
  it("is done when nothing failed", () => {
    expect(bringInState({ uploaded: 18, failed: 0, skipped: 0 }, false)).toEqual({ kind: "done" });
  });
  it("is done when everything was already in", () => {
    expect(bringInState({ uploaded: 0, failed: 0, skipped: 18 }, false)).toEqual({ kind: "done" });
  });
  it("fails on partial failure and on a rejected sync", () => {
    expect(bringInState({ uploaded: 15, failed: 3, skipped: 0 }, false)).toEqual({ kind: "failed", failed: 3 });
    expect(bringInState(null, true)).toEqual({ kind: "failed", failed: 0 });
  });
  it("words the count without saying anything was read", () => {
    expect(broughtInLine(0)).toBe("Looking for your screenshots.");
    expect(broughtInLine(1)).toBe("1 screenshot brought in.");
    expect(broughtInLine(7)).toBe("7 screenshots brought in.");
  });
  it("words failures", () => {
    expect(failedLabel(0)).toBe("Couldn't bring in your screenshots");
    expect(failedLabel(1)).toBe("Couldn't bring in 1 screenshot");
    expect(failedLabel(3)).toBe("Couldn't bring in 3 screenshots");
  });
});
