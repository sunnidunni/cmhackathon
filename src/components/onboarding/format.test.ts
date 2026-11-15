import { describe, expect, it } from "vitest";
import { bringInState, broughtInLine, failedLabel } from "./format";

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
