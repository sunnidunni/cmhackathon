import Svg, { Circle, G, Path } from "react-native-svg";
import { colors, RoomKey, rooms } from "./theme";

export type Expression = "neutral" | "happy";

type Part = { d: string; fill: "body" | "white" | "none" };

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

const SHAPES: Record<RoomKey, { parts: Part[]; details?: Part[]; face: { y: number; x?: number } }> = {
  deadlines: {
    parts: [
      { d: "M50 22 C47 12 58 7 63 13 C66 17 61 21 58 18", fill: "none" },
      { d: "M36 22 H64 Q82 22 82 40 V68 Q82 86 64 86 H36 Q18 86 18 68 V40 Q18 22 36 22 Z", fill: "body" },
    ],
    details: [
      { d: circle(50, 46, 14), fill: "white" },
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
      { d: circle(43, 26, 6), fill: "body" },
      { d: circle(57, 26, 6), fill: "body" },
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
  const shape = SHAPES[room];
  const color = rooms[room].color;
  const all = [...shape.parts];
  const fy = shape.face.y;
  const fx = shape.face.x ?? 50;
  const fillOf = (p: Part) => (p.fill === "body" ? color : p.fill === "white" ? colors.white : "none");
  return (
    <Svg width={size} height={size} viewBox="-6 -2 112 106">
      {outline ? (
        <>
          <G transform="translate(0 3)" opacity={0.16}>
            {all.map((p, i) => (
              <Path key={i} d={p.d} fill={p.fill === "none" ? "none" : colors.ink} stroke={colors.ink} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
            ))}
          </G>
          {all.map((p, i) => (
            <Path key={i} d={p.d} fill={p.fill === "none" ? "none" : colors.white} stroke={colors.white} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </>
      ) : null}
      {[...all, ...(shape.details ?? [])].map((p, i) => (
        <Path key={i} d={p.d} fill={fillOf(p)} stroke={colors.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {expression === "happy" ? (
        <>
          <Path d={`M${fx - 15} ${fy + 1} Q${fx - 11} ${fy - 5} ${fx - 7} ${fy + 1} M${fx + 7} ${fy + 1} Q${fx + 11} ${fy - 5} ${fx + 15} ${fy + 1}`} fill="none" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
          <Path d={`M${fx - 6} ${fy + 5} Q${fx} ${fy + 13} ${fx + 6} ${fy + 5} Z`} fill={colors.ink} stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Circle cx={fx - 11} cy={fy} r={3.4} fill={colors.ink} />
          <Circle cx={fx + 11} cy={fy} r={3.4} fill={colors.ink} />
          <Path d={`M${fx - 5} ${fy + 5} Q${fx} ${fy + 9} ${fx + 5} ${fy + 5}`} fill="none" stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
