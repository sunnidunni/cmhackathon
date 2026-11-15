import { describe, expect, it } from "vitest";
import { barFraction, failedLabel, readLine } from "./format";

describe("onboarding format", () => {
  it("counts reads while pending", () => {
    expect(readLine({ total: 18, read: 7, failed: 0, pending: 11 })).toBe(
      "7 of 18 read. You can look around while I finish.",
    );
  });
  it("drops the hint when nothing is pending", () => {
    expect(readLine({ total: 18, read: 18, failed: 0, pending: 0 })).toBe("18 of 18 read.");
  });
  it("handles an empty import", () => {
    expect(readLine({ total: 0, read: 0, failed: 0, pending: 0 })).toBe("Waiting for your first screenshot.");
    expect(barFraction({ total: 0, read: 0, failed: 0, pending: 0 })).toBe(0);
  });
  it("fills the bar with read and failed", () => {
    expect(barFraction({ total: 10, read: 4, failed: 1, pending: 5 })).toBe(0.5);
  });
  it("words failures", () => {
    expect(failedLabel(0)).toBeNull();
    expect(failedLabel(1)).toBe("Couldn't read 1 screenshot");
    expect(failedLabel(3)).toBe("Couldn't read 3 screenshots");
  });
});
