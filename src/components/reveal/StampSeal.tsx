import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from "react-native-svg";
import { fonts } from "./kit";

const RUST = "#C2643A";

export function StampSeal({ count, label, size = 88 }: { count: number; label: string; size?: number }) {
  const c = 50;
  const r = 36;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={label} style={{ transform: [{ rotate: "10deg" }] }}>
      <Defs>
        <Path id="stamp-ring" d={`M ${c - r} ${c} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />
      </Defs>
      <Circle cx={c} cy={c} r={47} fill="#FFFFFF" stroke={RUST} strokeWidth={2} />
      <Circle cx={c} cy={c} r={26} fill="none" stroke={RUST} strokeWidth={1.5} />
      <SvgText fill={RUST} fontSize={8.5} fontFamily={fonts.uiBold} fontWeight="700" letterSpacing={1.1}>
        <TextPath href="#stamp-ring" startOffset="0%">{label}</TextPath>
      </SvgText>
      <SvgText x={c} y={c + 8} fill={RUST} fontSize={24} fontFamily={fonts.display} fontWeight="700" textAnchor="middle">
        {String(count)}
      </SvgText>
    </Svg>
  );
}
