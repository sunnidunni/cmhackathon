// Static renderer for the generated keeper art. Motion lives in Keeper.tsx.
import React, { useId } from "react";
import Svg, { G, Path, Circle, Ellipse, Rect, Defs, Pattern, ClipPath } from "react-native-svg";
import { ID_TOKEN, type El, type FaceState, type Layers } from "./keeperArt";

const TAGS = { path: Path, circle: Circle, ellipse: Ellipse, rect: Rect, g: G, pattern: Pattern, clipPath: ClipPath } as const;

function renderEl(el: El, key: number, prefix: string): React.ReactElement {
  const Tag = TAGS[el.t] as unknown as React.ComponentType<Record<string, unknown>>;
  const props: Record<string, unknown> = {};
  for (const k in el.p) {
    const v = el.p[k];
    props[k] = typeof v === "string" && v.includes(ID_TOKEN) ? v.split(ID_TOKEN).join(prefix) : v;
  }
  return (
    <Tag key={key} {...props}>
      {el.c?.map((c, i) => renderEl(c, i, prefix))}
    </Tag>
  );
}

export function usePrefix(name: string): string {
  return name + "-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

export const Art = React.memo(function Art({ layers, face, size, prefix, label }: { layers: Layers; face: FaceState; size: number; prefix: string; label: string }) {
  const faceEls = layers.face[face] ?? layers.face.rest;
  return (
    <Svg width={size} height={size} viewBox={layers.vb} accessibilityRole="image" accessibilityLabel={label}>
      <Defs>{layers.defs.map((d, i) => renderEl(d, i, prefix))}</Defs>
      <G>{layers.back.map((e, i) => renderEl(e, i, prefix))}</G>
      <G>{faceEls.map((e, i) => renderEl(e, i, prefix))}</G>
      <G>{layers.front.map((e, i) => renderEl(e, i, prefix))}</G>
    </Svg>
  );
});
