import { describe, expect, it } from "vitest";
import { allowSound, parseSounds, sfxForReaction } from "./sfx-plan";

describe("parseSounds", () => {
  it("is on by default and off only when stored as 0", () => {
    expect(parseSounds(null)).toBe(true);
    expect(parseSounds("1")).toBe(true);
    expect(parseSounds("0")).toBe(false);
  });
});

describe("allowSound", () => {
  it("allows at most one sound per 300 ms", () => {
    expect(allowSound(1000, 1299)).toBe(false);
    expect(allowSound(1000, 1300)).toBe(true);
    expect(allowSound(0, 1_700_000_000_000)).toBe(true);
  });
});

describe("sfxForReaction", () => {
  it("maps each keeper reaction to its sound", () => {
    expect(sfxForReaction("tock", "filed")).toBe("tock-filed");
    expect(sfxForReaction("murmur", "filed")).toBe("murmur-filed");
    expect(sfxForReaction("penny", "filed")).toBe("penny-filed");
    expect(sfxForReaction("mote", "filed")).toBe("mote-filed");
    expect(sfxForReaction("tock", "tap")).toBe("boop");
    expect(sfxForReaction("tock", "reveal")).toBe("pop");
    expect(sfxForReaction("tock", "celebrate")).toBe("celebrate");
  });
});
