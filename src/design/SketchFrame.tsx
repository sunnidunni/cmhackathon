import { useMemo, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { roundedRectD, seedFrom, sketch, Tail } from "./sketch";
import { colors } from "./theme";

const M = 16;

export function SketchFrame({
  fill,
  radius,
  stroke = colors.ink,
  strokeWidth = 2,
  tail,
  shadow,
  seed = "",
  style,
  children,
}: {
  fill: string;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
  tail?: Tail;
  shadow?: { color: string; opacity: number; dy: number };
  seed?: string | number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const paths = useMemo(
    () =>
      size
        ? sketch(roundedRectD(size.w, size.h, radius, tail), seedFrom(seed, Math.round(size.w), Math.round(size.h)), {
            amp: 1.1,
            wave: 26,
            step: 4,
          })
        : null,
    [size, radius, tail, seed],
  );
  return (
    <View
      style={style}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((s) => (s && Math.abs(s.w - width) < 0.5 && Math.abs(s.h - height) < 0.5 ? s : { w: width, h: height }));
      }}
    >
      {paths && size ? (
        <Svg pointerEvents="none" width={size.w + 2 * M} height={size.h + 2 * M} style={{ position: "absolute", left: -M, top: -M }}>
          <G transform={`translate(${M} ${M})`}>
            {shadow ? <Path d={paths.fill} fill={shadow.color} opacity={shadow.opacity} transform={`translate(1 ${shadow.dy})`} /> : null}
            <Path d={paths.fill} fill={fill} transform="translate(1.6 1.4)" />
            <Path d={paths.main} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d={paths.echo} fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.55} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          </G>
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
