import { useMemo } from "react";
import Svg, { Path } from "react-native-svg";
import { seedFrom, sketch } from "./sketch";
import { colors } from "./theme";

const SHAPES = {
  star: "M50 8 L61 38 L93 39 L67 58 L77 90 L50 71 L23 90 L33 58 L7 39 L39 38 Z",
  arrow: "M10 30 C30 80 60 88 88 70 M70 62 L90 69 L84 88",
  swirl: "M50 52 C56 52 56 44 50 44 C40 44 40 60 52 60 C66 60 66 36 50 36 C30 36 30 68 54 68 C76 68 78 30 50 26",
  underline: "M4 10 C30 4 60 12 96 6",
} as const;

export function Doodle({
  kind,
  size = 40,
  width,
  color = colors.ink,
  strokeWidth = 3,
}: {
  kind: keyof typeof SHAPES;
  size?: number;
  width?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const w = width ?? size;
  const h = kind === "underline" ? 14 : size;
  const d = kind === "underline" ? `M3 ${h * 0.7} C${w * 0.3} ${h * 0.25} ${w * 0.6} ${h * 0.9} ${w - 3} ${h * 0.35}` : SHAPES[kind];
  const s = useMemo(() => sketch(d, seedFrom(kind, w), { amp: kind === "underline" ? 1 : 1.6, wave: 14, step: 2.5 }), [d, kind, w]);
  const sw = kind === "underline" ? strokeWidth : (strokeWidth * 100) / size;
  return (
    <Svg width={w} height={h} viewBox={kind === "underline" ? `0 0 ${w} ${h}` : "0 0 100 100"}>
      <Path d={s.main} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={s.echo} fill="none" stroke={color} strokeWidth={sw * 0.55} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
