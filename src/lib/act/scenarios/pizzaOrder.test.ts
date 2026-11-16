import { describe, expect, it } from "vitest";
import { arrivalTime, PIZZA_ORDER } from "./pizzaOrder";

describe("pizza order", () => {
  it("formats the arrival as a 12-hour clock time", () => {
    expect(arrivalTime(new Date(2026, 10, 15, 17, 40), 32)).toBe("6:12 PM");
    expect(arrivalTime(new Date(2026, 10, 15, 23, 50), 32)).toBe("12:22 AM");
  });
  it("adds the line items up to the total", () => {
    const cents = PIZZA_ORDER.items.reduce((n, i) => n + Math.round(parseFloat(i.price.slice(1)) * 100), 0);
    expect(cents).toBe(Math.round(parseFloat(PIZZA_ORDER.total.slice(1)) * 100));
  });
});
