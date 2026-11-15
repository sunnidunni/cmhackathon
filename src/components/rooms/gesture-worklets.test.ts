// @vitest-environment node
/// <reference types="node" />
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

// A gesture callback is a worklet on the UI thread. Calling a plain JS helper from it throws
// "Tried to synchronously call a non-worklet function on the UI thread". This compiles PhotoGrid the way
// Metro does and checks no worklet closure captures a grid helper: the level change must go through runOnJS.
const ROOT = resolve(__dirname, "../../..");
const { transformFileSync } = createRequire(__filename)("@babel/core") as {
  transformFileSync: (file: string, options: object) => { code?: string | null } | null;
};

describe("rooms PhotoGrid gesture", () => {
  test("worklets capture no grid helper, only runOnJS and the JS handler", () => {
    const file = resolve(__dirname, "PhotoGrid.tsx");
    const code = transformFileSync(file, {
      cwd: ROOT,
      filename: file,
      babelrc: false,
      configFile: false,
      presets: ["babel-preset-expo"],
      caller: { name: "metro", platform: "ios", isDev: false } as never,
    })!.code!;
    const captured = [...code.matchAll(/\}\(\[_worklet_\d+_init_data,([^\]]*)\]\)/g)].flatMap((m) => m[1].split(",").map((a) => a.trim()));
    expect(captured.length).toBeGreaterThan(0);
    expect(captured.filter((a) => /stepLevel|groupByLevel|setLevel/.test(a))).toEqual([]);
    expect(captured.some((a) => /runOnJS/.test(a))).toBe(true);
  });
});
