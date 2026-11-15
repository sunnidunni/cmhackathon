import { describe, expect, test } from "vitest";
import { tabAfterSwipe } from "./swipe";

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
