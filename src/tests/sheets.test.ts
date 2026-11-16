import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = (p: string) => readFileSync(resolve(__dirname, "../app", p), "utf8");

// A <Stack.Screen options={{...}}> inside a screen builds a new object every render. expo-router calls
// navigation.setOptions(options) in an effect keyed on that object, the navigator re-renders the screen, and the
// loop ends in "Maximum update depth exceeded". Sheet routes declare stable options in the root layout instead.
describe("formSheet routes", () => {
  const sheets = ["remind/[id].tsx", "act/[id].tsx", "settings.tsx"];
  it.each(sheets)("%s sets no inline Stack.Screen options", (file) => {
    expect(src(file)).not.toMatch(/<Stack\.Screen/);
  });
  it("the root layout declares the sheets with memoized options", () => {
    const layout = src("_layout.tsx");
    for (const name of ["remind/[id]", "act/[id]", "settings"]) expect(layout).toContain(`name="${name}"`);
    expect(layout).toMatch(/const sheet = useMemo<SheetOptions>\(/);
    expect(layout).toMatch(/const settingsSheet = useMemo<SheetOptions>\(/);
  });
});
