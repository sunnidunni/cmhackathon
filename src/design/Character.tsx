import { useId } from "react";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";
import { circleD, seedFrom, scribble, Sketch, sketch } from "./sketch";
import { colors, RoomKey, rooms } from "./theme";

export type Expression = "neutral" | "happy";

type Part = { d: string; fill: "body" | "white" | "accent" | "sun" | "none" };

const BODY = "M50 22 C70 22 84 34 84 50 C84 66 70 77 51 77 C46 77 42 76 39 75 L22 85 L27 70 C20 65 16 58 16 50 C16 34 30 22 50 22 Z";

const PROPS: Record<RoomKey, { parts: Part[]; details: Part[] }> = {
  deadlines: {
    parts: [
      { d: "M78 8 V4", fill: "none" },
      { d: circleD(78, 20, 13), fill: "white" },
    ],
    details: [{ d: "M78 20 V12 M78 20 L84 23", fill: "none" }],
  },
  chats: {
    parts: [
      { d: "M84 6 C94 6 100 12 100 19 C100 26 94 31 85 31 C82 31 80 31 78 30 L70 35 L72 28 C68 26 67 23 67 19 C67 12 74 6 84 6 Z", fill: "accent" },
    ],
    details: [{ d: "M77 19 H78 M83.5 19 H84.5 M90 19 H91", fill: "none" }],
  },
  money: {
    parts: [{ d: circleD(82, 70, 13), fill: "sun" }],
    details: [{ d: circleD(82, 70, 8), fill: "none" }, { d: "M82 65 V75", fill: "none" }],
  },
  ideas: {
    parts: [{ d: "M84 2 Q86 14 98 16 Q86 18 84 30 Q82 18 70 16 Q82 14 84 2 Z", fill: "accent" }],
    details: [],
  },
};

type Drawn = Part & { s: Sketch; hatch: string };
const cache = new Map<string, { parts: Drawn[]; details: Drawn[] }>();

function drawn(room: RoomKey | undefined) {
  const key = room ?? "plain";
  const hit = cache.get(key);
  if (hit) return hit;
  const make = (p: Part, i: number): Drawn => {
    const s = sketch(p.d, seedFrom("psst", key, i), { amp: 1.4, wave: 18, step: 2.5 });
    return { ...p, s, hatch: room && p.fill === "body" ? scribble(s.box, seedFrom("psst", key, "hatch"), 10) : "" };
  };
  const extra = room ? PROPS[room] : { parts: [], details: [] };
  const out = {
    parts: [{ d: BODY, fill: "body" as const }, ...extra.parts].map(make),
    details: extra.details.map((p, i) => make(p, i + 10)),
  };
  cache.set(key, out);
  return out;
}

function mix(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

export function Character({
  room,
  size = 72,
  expression = "neutral",
  outline = true,
}: {
  room?: RoomKey;
  size?: number;
  expression?: Expression;
  outline?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { parts, details } = drawn(room);
  const accent = room ? rooms[room].color : colors.sun;
  const fills: Record<Part["fill"], string> = {
    body: room ? mix(accent, 0.45) : colors.white,
    white: colors.white,
    accent,
    sun: colors.sun,
    none: "none",
  };
  const fx = 50;
  const fy = 48;
  const solid = (p: Drawn) => (p.fill === "none" ? p.s.main : p.s.fill);
  const ink = (p: Drawn, i: number) => (
    <G key={i}>
      <Path d={p.s.main} fill="none" stroke={colors.ink} strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={p.s.echo} fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
    </G>
  );
  const colored = (p: Drawn, i: number) =>
    p.fill === "none" ? null : (
      <G key={i}>
        <Path d={p.s.fill} fill={fills[p.fill]} transform="translate(2.2 1.8)" />
        {p.hatch ? (
          <>
            <Defs>
              <ClipPath id={`${uid}c${i}`}>
                <Path d={p.s.fill} transform="translate(2.2 1.8)" />
              </ClipPath>
            </Defs>
            <Path d={p.hatch} clipPath={`url(#${uid}c${i})`} fill="none" stroke={accent} strokeOpacity={0.45} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </G>
    );
  return (
    <Svg width={size} height={size} viewBox="-6 -4 112 106">
      {outline ? (
        <>
          <G transform="translate(0.5 3)" opacity={0.16}>
            {parts.map((p, i) => (
              <Path key={i} d={solid(p)} fill={p.fill === "none" ? "none" : colors.ink} stroke={colors.ink} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
            ))}
          </G>
          {parts.map((p, i) => (
            <Path key={i} d={solid(p)} fill={p.fill === "none" ? "none" : colors.white} stroke={colors.white} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </>
      ) : null}
      {parts.map(colored)}
      {parts.map(ink)}
      {details.map((p, i) => colored(p, i + 10))}
      {details.map((p, i) => ink(p, i + 10))}
      {expression === "happy" ? (
        <>
          <Path d={`M${fx - 16} ${fy + 1} Q${fx - 12} ${fy - 6} ${fx - 7} ${fy + 0.5} M${fx + 7} ${fy} Q${fx + 10.5} ${fy - 5} ${fx + 15.5} ${fy + 1.5}`} fill="none" stroke={colors.ink} strokeWidth={3.2} strokeLinecap="round" />
          <Path d={`M${fx - 7} ${fy + 6} Q${fx - 1} ${fy + 16} ${fx + 7} ${fy + 5} Q${fx} ${fy + 8} ${fx - 7} ${fy + 6} Z`} fill={colors.ink} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Circle cx={fx - 11} cy={fy + 0.5} r={3.6} fill={colors.ink} />
          <Circle cx={fx + 11.5} cy={fy - 0.7} r={4.5} fill={colors.ink} />
          <Path d={`M${fx - 7} ${fy + 7} Q${fx - 1} ${fy + 13} ${fx + 7} ${fy + 5}`} fill="none" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
