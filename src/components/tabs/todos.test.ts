import { describe, expect, it } from "vitest";
import { cleanTodoText, splitTodos } from "./todos";

describe("todos", () => {
  it("trims and rejects empty text", () => {
    expect(cleanTodoText("  buy stamps  ")).toBe("buy stamps");
    expect(cleanTodoText("   ")).toBeNull();
  });
  it("caps text at 200 characters", () => {
    expect(cleanTodoText("a".repeat(250))).toHaveLength(200);
  });
  it("splits open from done, keeping order", () => {
    const items = [
      { _id: "1", done: false },
      { _id: "2", done: true },
      { _id: "3", done: false },
    ];
    expect(splitTodos(items)).toEqual({ open: [items[0], items[2]], done: [items[1]] });
  });
});
