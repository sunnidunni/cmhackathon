import { describe, expect, it } from "vitest";
import { buildLine, connectionLine, planLine, progressLine } from "./status";

describe("dev panel status lines", () => {
  it("says unavailable until a query has answered", () => {
    expect(progressLine(undefined)).toBe("unavailable");
    expect(planLine(undefined)).toBe("unavailable");
  });

  it("formats the sync counts", () => {
    expect(progressLine({ uploaded: 12, read: 10, pending: 1, failed: 1, total: 12 })).toBe("uploaded 12 · read 10 · pending 1 · failed 1 · total 12");
  });

  it("formats the plan and import limit", () => {
    expect(planLine({ plan: "free", limit: 50 })).toBe("free, import limit 50");
    expect(planLine({ plan: "paid", limit: null })).toBe("paid, no import limit");
  });

  it("describes the connection", () => {
    expect(connectionLine({ socket: false, loading: true, authenticated: false })).toBe("not connected, signing in");
    expect(connectionLine({ socket: true, loading: false, authenticated: true })).toBe("connected, signed in");
    expect(connectionLine({ socket: true, loading: false, authenticated: false })).toBe("connected, not signed in");
  });

  it("describes the build", () => {
    expect(buildLine({ name: "Psst", version: "1.0.0", debug: false, devTools: undefined })).toBe("Psst 1.0.0 · release · EXPO_PUBLIC_DEV_TOOLS unset");
    expect(buildLine({ name: undefined, version: undefined, debug: true, devTools: "1" })).toBe("unavailable · debug · EXPO_PUBLIC_DEV_TOOLS 1");
  });
});
