import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { KEEPER_ART } from "@/design/keepers-v2/keeperArt";
import type { KeeperId } from "@/design/psst";
import { confettiFor, confettiPieces, type Piece, type PieceShape } from "./confettiPattern";

const TOTAL_MS = 1100;

function Shape({ shape, size, color }: { shape: PieceShape; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      {shape === "tick" ? <Rect x={5} y={0.5} width={2.4} height={11} rx={1.2} fill={color} /> : null}
      {shape === "bubble" ? <Path d="M2.5 1.5h7a2 2 0 0 1 2 2v3.6a2 2 0 0 1-2 2H6.2L3.4 11.6V9.1H2.5a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2Z" fill={color} /> : null}
      {shape === "sparkle" ? <Path d="M6 0.4 7.3 4.7 11.6 6 7.3 7.3 6 11.6 4.7 7.3 0.4 6 4.7 4.7Z" fill={color} /> : null}
    </Svg>
  );
}

// One shared value drives every piece: burst out fast, then fall 40pt and fade.
function PieceView({ piece, p, shape, color }: { piece: Piece; p: SharedValue<number>; shape: PieceShape; color: string }) {
  const style = useAnimatedStyle(() => {
    const out = interpolate(p.get(), [0, 0.55], [0, 1], "clamp");
    const eased = 1 - (1 - out) * (1 - out);
    const fall = interpolate(p.get(), [0.55, 1], [0, 40], "clamp");
    return {
      opacity: interpolate(p.get(), [0, 0.05, 0.6, 1], [0, 1, 1, 0], "clamp"),
      transform: [
        { translateX: Math.cos(piece.angle) * piece.distance * eased },
        { translateY: Math.sin(piece.angle) * piece.distance * eased + fall * fall * 0.025 },
        { rotate: piece.spin * p.get() + "deg" },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: "absolute", left: -piece.size / 2, top: -piece.size / 2 }, style]}>
      <Shape shape={shape} size={piece.size} color={color} />
    </Animated.View>
  );
}

/** Confetti in the keeper's own shapes and colours, bursting from the top-left corner of its parent (position the parent at the keeper's chest). Plays each time `fireKey` changes to a value. Nothing under Reduce Motion, and never for Penny. */
export function Confetti({ keeper, fireKey, dueToday }: { keeper: KeeperId; fireKey: string | number | undefined; dueToday?: boolean }) {
  const reduce = useReducedMotion();
  const shape = confettiFor(keeper, { dueToday });
  const p = useSharedValue(0);
  const pieces = useMemo(() => (fireKey === undefined ? [] : confettiPieces()), [fireKey]);
  const colors = KEEPER_ART[keeper].colors;
  const palette = [colors.main, colors.fur, colors.deep];

  useEffect(() => {
    if (fireKey === undefined || reduce || !shape) return;
    p.set(0);
    p.set(withTiming(1, { duration: TOTAL_MS, easing: Easing.linear }));
  }, [fireKey, reduce, shape, p]);

  if (fireKey === undefined || reduce || !shape) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
      {pieces.map((piece, i) => (
        <PieceView key={`${fireKey}-${i}`} piece={piece} p={p} shape={shape} color={palette[piece.shade]!} />
      ))}
    </View>
  );
}
