import { describe, expect, it } from "vitest";
import { DEMO_ACTS } from "@/lib/act/scenarios";
import { buildPages, confirmFor, itemsSum, totalCents, willBe } from "./pages";

const act = (id: string) => DEMO_ACTS.find((a) => a.id === id)!;

describe("act pages", () => {
  it("pizza walks draft, confirm, pretend reply, order, confirm, done", () => {
    expect(buildPages(act("mom-pizza").steps).map((p) => p.kind)).toEqual(["edit", "confirm", "reply", "edit", "confirm", "done"]);
  });
  it("delay moves the reminder, then drafts and confirms the text", () => {
    const pages = buildPages(act("flight-delay").steps);
    expect(pages.map((p) => p.kind)).toEqual(["move", "edit", "confirm", "done"]);
    expect(pages[2]).toMatchObject({ kind: "confirm", final: true });
  });
  it("uses the scenario confirm for the last send and a derived one before it", () => {
    const pizza = act("mom-pizza");
    expect(confirmFor(pizza, pizza.steps[0], false).button).toBe("Send to Mom");
    expect(confirmFor(pizza, pizza.steps[1], true).button).toBe("Place order · $41.75");
  });
  it("order line items add up to the total", () => {
    for (const s of DEMO_ACTS.flatMap((a) => a.steps)) if (s.kind === "order") expect(itemsSum(s.items)).toBe(totalCents(s.total));
  });
  it("Today buttons review, they never act; done copy never claims a send", () => {
    for (const a of DEMO_ACTS.filter((a) => a.steps.length > 0)) {
      expect(a.cta).toMatch(/^Review /);
      expect(a.done).toMatch(/^Demo: nothing was /);
      expect(a.done).not.toMatch(/\b(sent|ordered)\b.*\bsuccess/i);
    }
    expect(willBe("Demo: nothing was sent.")).toBe("Demo: nothing will be sent.");
  });
});
