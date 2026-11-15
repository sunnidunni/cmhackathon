// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { describe, expect, test } from "vitest";

// Gesture callbacks run on the UI thread as worklets. Calling a plain JS function from one throws
// "Tried to synchronously call a non-worklet function on the UI thread", which ends a Release app.
// This compiles each gesture file the way Metro does and checks every local helper a worklet
// captures is itself marked "worklet". Anything else must go through runOnJS.
const ROOT = resolve(__dirname, "../../..");
const { transformFileSync } = createRequire(__filename)("@babel/core") as {
  transformFileSync: (file: string, options: object) => { code?: string | null } | null;
};
const FILES = ["ZoomViewer.tsx", "SwipeTabs.tsx"].map((f) => resolve(__dirname, f));

function compile(file: string) {
  return transformFileSync(file, {
    cwd: ROOT,
    filename: file,
    babelrc: false,
    configFile: false,
    presets: ["babel-preset-expo"],
    caller: { name: "metro", platform: "ios", isDev: false } as never,
  })!.code!;
}

function capturedLocalHelpers(file: string) {
  const code = compile(file);
  const modules = new Map<string, string>();
  for (const m of code.matchAll(/var (_\w+)=(?:_interopRequireDefault\()?require\("(\.\/[^"]+)"\)/g)) modules.set(m[1], m[2]);
  const found: { module: string; name: string }[] = [];
  for (const m of code.matchAll(/\}\(\[_worklet_\d+_init_data,([^\]]*)\]\)/g)) {
    for (const arg of m[1].split(",")) {
      const ref = /^(_\w+)\.(\w+)$/.exec(arg.trim());
      if (ref && modules.has(ref[1])) found.push({ module: modules.get(ref[1])!, name: ref[2] });
    }
  }
  return found;
}

function isWorkletInSource(fromFile: string, module: string, name: string) {
  const src = readFileSync(resolve(dirname(fromFile), module + ".ts"), "utf8");
  return new RegExp(`function ${name}\\([^)]*\\)[^{]*\\{\\s*"worklet";`).test(src);
}

describe("gesture worklets", () => {
  for (const file of FILES) {
    test(`${file.split("/").pop()} only calls worklet helpers on the UI thread`, () => {
      const bad = capturedLocalHelpers(file)
        .filter((h) => !isWorkletInSource(file, h.module, h.name))
        .map((h) => `${h.module}.${h.name}`);
      expect(bad).toEqual([]);
    });
  }
});
