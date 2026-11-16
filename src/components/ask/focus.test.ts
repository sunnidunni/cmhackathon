import { describe, expect, it } from "vitest";
import { fixtureAnswerFits, shownQuestion, withFocus } from "./focus";

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

describe("fixtureAnswerFits", () => {
  const flyer = "Pottery night";
  it("answers pottery questions and a bare that on the flyer focus when fixtures are on", () => {
    expect(fixtureAnswerFits("When does pottery sign-up close?", null, flyer, true)).toBe(true);
    expect(fixtureAnswerFits("When is that due?", flyer, flyer, true)).toBe(true);
    expect(fixtureAnswerFits("When is that due?", null, flyer, true)).toBe(true);
  });
  it("stays honest with fixtures off or when the focus is something else", () => {
    expect(fixtureAnswerFits("When is that due?", flyer, flyer, false)).toBe(false);
    expect(fixtureAnswerFits("When is that due?", "Rent", flyer, true)).toBe(false);
    expect(fixtureAnswerFits("What time is the yoga class?", flyer, flyer, true)).toBe(false);
    expect(fixtureAnswerFits("What was that recipe?", flyer, flyer, true)).toBe(false);
  });
});
