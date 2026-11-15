import { describe, expect, test } from "vitest";
import { pageAfterDrag, tabAfterSwipe } from "./swipe";

describe("tab swipe", () => {
  test("left goes forward, right goes back", () => {
    expect(tabAfterSwipe("today", -120, -100)).toBe("rooms");
    expect(tabAfterSwipe("ask", -120, 0)).toBe("you");
    expect(tabAfterSwipe("rooms", 120, 0)).toBe("today");
  });

  test("the ends do not wrap", () => {
    expect(tabAfterSwipe("today", 200, 900)).toBeNull();
    expect(tabAfterSwipe("you", -200, -900)).toBeNull();
  });

  test("short slow drags and unknown tabs do nothing", () => {
    expect(tabAfterSwipe("today", -30, -100)).toBeNull();
    expect(tabAfterSwipe("nope", -200, -900)).toBeNull();
  });

  test("a quick flick counts even when short", () => {
    expect(tabAfterSwipe("today", -40, -900)).toBe("rooms");
  });
});

describe("pageAfterDrag", () => {
  const W = 400;
  test("past a third of the screen settles on the neighbour", () => {
    expect(pageAfterDrag(0, -150, 0, W, 4)).toBe(1);
    expect(pageAfterDrag(2, 150, 0, W, 4)).toBe(1);
  });
  test("a short slow drag springs back", () => {
    expect(pageAfterDrag(1, -100, -100, W, 4)).toBe(1);
  });
  test("a fast flick commits even when short", () => {
    expect(pageAfterDrag(1, -40, -700, W, 4)).toBe(2);
    expect(pageAfterDrag(1, 40, 700, W, 4)).toBe(0);
  });
  test("never past the ends", () => {
    expect(pageAfterDrag(0, 300, 900, W, 4)).toBe(0);
    expect(pageAfterDrag(3, -300, -900, W, 4)).toBe(3);
  });
});
