import { useId } from "react";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";
import { circleD, seedFrom, scribble, Sketch, sketch } from "./sketch";
import { colors, RoomKey, rooms } from "./theme";

export type Expression = "neutral" | "happy";

type Part = { d: string; fill: "body" | "white" | "none" };

const SHAPES: Record<RoomKey, { parts: Part[]; details?: Part[]; face: { y: number; x?: number } }> = {
  deadlines: {
    parts: [
      { d: "M50 22 C47 12 58 7 63 13 C66 17 61 21 58 18", fill: "none" },
      { d: "M36 22 H64 Q82 22 82 40 V68 Q82 86 64 86 H36 Q18 86 18 68 V40 Q18 22 36 22 Z", fill: "body" },
    ],
    details: [
      { d: circleD(50, 46, 14), fill: "white" },
      { d: "M50 46 V37 M50 46 L57 50", fill: "none" },
    ],
    face: { y: 70 },
  },
  chats: {
    parts: [
      { d: "M78 70 C86 74 92 82 87 88 C83 92 78 87 82 84", fill: "none" },
      {
        d: "M50 18 C72 18 86 32 86 49 C86 67 71 79 51 79 C45 79 41 78 37 77 L20 86 L26 71 C18 65 14 57 14 49 C14 32 28 18 50 18 Z",
        fill: "body",
      },
    ],
    face: { y: 48 },
  },
  money: {
    parts: [
      { d: circleD(43, 26, 6), fill: "body" },
      { d: circleD(57, 26, 6), fill: "body" },
      { d: "M20 52 C20 40 30 36 50 36 C70 36 80 40 80 52 L84 72 C85 83 74 88 50 88 C26 88 15 83 16 72 Z", fill: "body" },
    ],
    details: [{ d: "M30 41 Q50 31 70 41", fill: "none" }],
    face: { y: 62 },
  },
  ideas: {
    parts: [
      { d: "M84 12 Q86 23 96 25 Q86 27 84 38 Q82 27 72 25 Q82 23 84 12 Z", fill: "body" },
      { d: "M48 12 C56 30 78 44 78 64 C78 80 66 90 50 90 C34 90 22 80 22 64 C22 44 42 30 48 12 Z", fill: "body" },
    ],
    face: { y: 64 },
  },
};

type Drawn = Part & { s: Sketch; hatch: string };
const cache = new Map<RoomKey, { parts: Drawn[]; details: Drawn[] }>();

function drawn(room: RoomKey) {
  const hit = cache.get(room);
  if (hit) return hit;
  const make = (p: Part, i: number): Drawn => {
    const s = sketch(p.d, seedFrom(room, i), { amp: 1.5, wave: 18, step: 2.5 });
    return { ...p, s, hatch: p.fill === "body" ? scribble(s.box, seedFrom(room, "hatch", i), 9) : "" };
  };
  const shape = SHAPES[room];
  const out = { parts: shape.parts.map(make), details: (shape.details ?? []).map((p, i) => make(p, i + 10)) };
  cache.set(room, out);
  return out;
}

export function Character({
  room,
  size = 72,
  expression = "neutral",
  outline = true,
}: {
  room: RoomKey;
  size?: number;
  expression?: Expression;
  outline?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { parts, details } = drawn(room);
  const color = rooms[room].color;
  const fy = SHAPES[room].face.y;
  const fx = SHAPES[room].face.x ?? 50;
  const solid = (p: Drawn) => (p.fill === "none" ? p.s.main : p.s.fill);
  const fillOf = (p: Drawn) => (p.fill === "body" ? color : colors.white);
  const ink = (p: Drawn, i: number) => (
    <G key={i}>
      <Path d={p.s.main} fill="none" stroke={colors.ink} strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={p.s.echo} fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
    </G>
  );
  const colored = (p: Drawn, i: number) =>
    p.fill === "none" ? null : (
      <G key={i}>
        <Path d={p.s.fill} fill={fillOf(p)} transform="translate(2.2 1.8)" />
        {p.hatch ? (
          <>
            <Defs>
              <ClipPath id={`${uid}c${i}`}>
                <Path d={p.s.fill} transform="translate(2.2 1.8)" />
              </ClipPath>
            </Defs>
            <Path d={p.hatch} clipPath={`url(#${uid}c${i})`} fill="none" stroke={colors.ink} strokeOpacity={0.13} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </G>
    );
  return (
    <Svg width={size} height={size} viewBox="-6 -2 112 106">
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
          <Path d={`M${fx - 15} ${fy + 1} Q${fx - 11.5} ${fy - 5.5} ${fx - 7} ${fy + 0.5} M${fx + 7} ${fy} Q${fx + 10} ${fy - 4} ${fx + 14.5} ${fy + 1.5}`} fill="none" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
          <Path d={`M${fx - 7} ${fy + 5} Q${fx - 1} ${fy + 14} ${fx + 6} ${fy + 4} Q${fx} ${fy + 6.5} ${fx - 7} ${fy + 5} Z`} fill={colors.ink} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Circle cx={fx - 11} cy={fy + 0.4} r={3.1} fill={colors.ink} />
          <Circle cx={fx + 11.5} cy={fy - 0.6} r={3.9} fill={colors.ink} />
          <Path d={`M${fx - 6} ${fy + 5.5} Q${fx - 1} ${fy + 10.5} ${fx + 6} ${fy + 4}`} fill="none" stroke={colors.ink} strokeWidth={2.7} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
