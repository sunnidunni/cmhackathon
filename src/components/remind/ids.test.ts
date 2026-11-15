import { describe, expect, it } from "vitest";
import { isConvexId } from "./ids";

describe("isConvexId", () => {
  it("accepts a Convex document id", () => {
    expect(isConvexId("kg2b9x4f7m1q8n3p5r6s7t8v9w0y1z2a")).toBe(true);
  });
  it("rejects fixture ids", () => {
    expect(isConvexId("demo-01")).toBe(false);
    expect(isConvexId("01-pottery-flyer")).toBe(false);
    expect(isConvexId("f1")).toBe(false);
  });
  it("rejects empty and missing ids", () => {
    expect(isConvexId("")).toBe(false);
    expect(isConvexId(undefined)).toBe(false);
  });
});
