import type { ReactElement } from "react";
import { Platform } from "react-native";
import { Circle, G, Path, Rect } from "react-native-svg";
import { useKeeperColors, usePalette, type KeeperId } from "../tokens";
import type { Group, Leaf, Part, Role } from "./art-data";

export type RoleColors = Record<Role, string> & { cut: string };

export const HIDDEN_FROM_SCREEN_READERS =
  Platform.OS === "web"
    ? ({ "aria-hidden": true } as const)
    : ({ accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" } as const);

const CUT_PARTS = new Set(["body", "limb", "foot", "ear", "item", "sparkle", "frame"]);

export function useRoleColors(id: KeeperId, muted: boolean): RoleColors {
  const pal = usePalette();
  const { main, tint } = useKeeperColors(id, muted);
  return { m: main, t: tint, w: "#FFFFFF", kl: pal.kl, none: "none", hair2: pal.hair2, cut: pal.cut };
}

export type PartOverride = (leaf: Leaf, key: string) => ReactElement | null | undefined;

function leaf(p: Leaf, key: string, colors: RoleColors): ReactElement {
  const fill = colors[p.f ?? "none"];
  if (p.t === "r") return <Rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} fill={fill} />;
  const stroke = p.s ? colors[p.s] : undefined;
  if (p.t === "c") return <Circle key={key} cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={stroke} strokeWidth={p.sw} />;
  return (
    <Path
      key={key}
      d={p.d}
      fill={fill}
      stroke={stroke}
      strokeWidth={p.sw}
      strokeLinecap={p.lc ? "round" : undefined}
      strokeLinejoin={p.lj ? "round" : undefined}
    />
  );
}

function cutLeaf(p: Leaf, key: string, colors: RoleColors, width: number): ReactElement | null {
  if (!CUT_PARTS.has(p.part) || p.t === "r") return null;
  const fill = p.f === "none" ? "none" : colors.cut;
  if (p.t === "c") return <Circle key={key} cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={colors.cut} strokeWidth={width} />;
  return <Path key={key} d={p.d} fill={fill} stroke={colors.cut} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

const isGroup = (p: Part): p is Group => "g" in p;

export function renderParts(parts: Part[], colors: RoleColors, override?: PartOverride, prefix = "p"): ReactElement[] {
  return parts.map((p, i) => {
    const key = `${prefix}${i}`;
    if (isGroup(p)) return <G key={key} transform={p.transform}>{renderParts(p.c, colors, override, key)}</G>;
    return override?.(p, key) ?? leaf(p, key, colors);
  }).filter((el): el is ReactElement => el != null);
}

export function renderCut(parts: Part[], colors: RoleColors, width: number, prefix = "c"): ReactElement[] {
  return parts.flatMap((p, i) => {
    const key = `${prefix}${i}`;
    if (isGroup(p)) return [<G key={key} transform={p.transform}>{renderCut(p.c, colors, width, key)}</G>];
    const el = cutLeaf(p, key, colors, width);
    return el ? [el] : [];
  });
}
