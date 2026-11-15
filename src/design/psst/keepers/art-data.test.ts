import { describe, expect, it } from "vitest";
import { ART, AVATAR, type Part } from "./art-data";

const IDS = ["tock", "murmur", "penny", "mote"] as const;
const POSES = ["rest", "blink", "react", "holding"] as const;

const flat = (parts: Part[]) => parts.flatMap((p) => ("g" in p ? p.c : [p]));
const partCount = (parts: Part[], part: string) => flat(parts).filter((p) => p.part === part).length;
const strip = (parts: Part[], part: string) => JSON.stringify(parts.filter((p) => "g" in p || p.part !== part));

describe.each(IDS)("%s art", (id) => {
  it.each(POSES)("has drawn paths for %s", (pose) => {
    const parts = ART[id][pose];
    expect(parts).toBeDefined();
    expect(flat(parts!).filter((p) => p.t === "p" && p.d.length > 8).length).toBeGreaterThan(6);
  });

  it("rest has two eyes, two lid rects, two lid lines and one mouth", () => {
    const rest = ART[id].rest!;
    expect(partCount(rest, "eye")).toBe(2);
    expect(flat(rest).filter((p) => p.part === "lid" && p.t === "r")).toHaveLength(2);
    expect(flat(rest).filter((p) => p.part === "lid" && p.t === "p")).toHaveLength(2);
    expect(partCount(rest, "mouth")).toBe(1);
  });

  it("blink swaps eyes for two closed curves and keeps everything else", () => {
    const { rest, blink } = ART[id];
    expect(partCount(blink!, "eye")).toBe(0);
    expect(partCount(blink!, "lid")).toBe(2);
    const keep = (parts: Part[]) => JSON.stringify(parts.filter((p) => "g" in p || (p.part !== "eye" && p.part !== "lid")));
    expect(keep(blink!)).toBe(keep(rest!));
  });

  it("react only changes the mouth", () => {
    const { rest, react } = ART[id];
    expect(strip(react!, "mouth")).toBe(strip(rest!, "mouth"));
    expect(JSON.stringify(react)).not.toBe(JSON.stringify(rest));
  });

  it("holding draws an item the rest pose does not", () => {
    const item = ART[id].holding!.filter((p) => p.part === "item");
    expect(item.length).toBeGreaterThan(0);
    expect(ART[id].rest!.some((p) => p.part === "item")).toBe(false);
  });

  it.each(["rest", "blink", "react"] as const)("avatar %s is drawn", (pose) => {
    const parts = AVATAR[id][pose];
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts[0]).toMatchObject({ t: "c", part: "body", r: 19.5 });
  });
});

describe("shh", () => {
  it("exists for Murmur only", () => {
    expect(ART.murmur.shh).toBeDefined();
    expect(ART.tock.shh).toBeUndefined();
    expect(ART.penny.shh).toBeUndefined();
    expect(ART.mote.shh).toBeUndefined();
  });
});
