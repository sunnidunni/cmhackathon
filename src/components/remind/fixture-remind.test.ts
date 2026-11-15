
import { describe, expect, it } from "vitest";
import manifest from "../../../demo-screenshots/manifest.json";
import { demoShotPrefix } from "./ids";
import { defaultReminder, demoNow } from "./plan";

describe("fixture reminders", () => {
  it("maps demo-NN ids to the manifest prefix", () => {
    expect(demoShotPrefix("demo-01")).toBe("01");
    expect(demoShotPrefix("01-pottery-flyer")).toBeNull();
  });
  it("defaults the pottery flyer to the day before at 9:00 AM, computed from the demo clock", () => {
    const flyer = manifest.find((m) => m.file.includes("01-pottery-flyer"));
    const r = defaultReminder(flyer?.dates ?? [], demoNow(480), 480);
    expect(r?.day).toBe("Thu, Nov 19");
    expect(r?.clock).toBe("9:00 AM");
  });
});
