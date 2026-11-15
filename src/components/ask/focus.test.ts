import { describe, expect, it } from "vitest";
import { shownQuestion, withFocus } from "./focus";

describe("withFocus", () => {
  it("names the focus item for a bare that", () => {
    expect(withFocus("When is that due?", "Pottery night")).toBe("When is that due? (about: Pottery night)");
  });
  it("handles it and this", () => {
    expect(withFocus("How much is it?", "Rent")).toBe("How much is it? (about: Rent)");
    expect(withFocus("What does this say", "Flyer")).toBe("What does this say (about: Flyer)");
  });
  it("leaves standalone questions alone", () => {
    expect(withFocus("When does the pottery sign-up close?", "Pottery night")).toBe("When does the pottery sign-up close?");
    expect(withFocus("What was that recipe?", "Pottery night")).toBe("What was that recipe?");
  });
  it("leaves the question alone without a focus item", () => {
    expect(withFocus("When is that due?", null)).toBe("When is that due?");
    expect(withFocus("When is that due?", "")).toBe("When is that due?");
  });
  it("does not rewrite twice", () => {
    expect(withFocus("When is that due? (about: A)", "B")).toBe("When is that due? (about: A)");
  });
});

describe("shownQuestion", () => {
  it("strips the rewrite", () => {
    expect(shownQuestion("When is that due? (about: Pottery night)")).toBe("When is that due?");
    expect(shownQuestion("When is that due?")).toBe("When is that due?");
  });
});
