import { Image } from "expo-image";
import { Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { fonts } from "./fonts";
import { SHOT_ART, usePalette } from "./tokens";

export type ShotVariant = "flyer" | "receipt";

export function shotVariantFor(idOrTitle: string): ShotVariant | undefined {
  if (/pottery|flyer/i.test(idOrTitle)) return "flyer";
  if (/greenleaf|receipt/i.test(idOrTitle)) return "receipt";
  return undefined;
}

const CANVAS = 180;

function Flyer({ k }: { k: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: SHOT_ART.cream, padding: 10 * k }}>
      <Svg width={160 * k} height={70 * k} viewBox="0 0 160 70">
        <Path d="M56 20h48l-5 38q-1 7-8 7h-22q-7 0-8-7z" fill={SHOT_ART.clay} />
        <Rect x={52} y={13} width={56} height={10} rx={4} fill={SHOT_ART.clay} />
        <Path d="M65 36q15 8 30 0" stroke={SHOT_ART.cream} strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>
      <Text style={{ fontFamily: fonts.uiBold, fontSize: 10 * k, color: SHOT_ART.clay, marginTop: 8 * k }}>Eastside Community Center</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 21 * k, lineHeight: 24 * k, color: SHOT_ART.ink, marginTop: 4 * k }}>Pottery for beginners</Text>
      <Text style={{ fontFamily: fonts.ui, fontSize: 11 * k, color: SHOT_ART.ink, marginTop: 6 * k }}>6 Tuesdays, 6 to 8 PM</Text>
      <View style={{ alignSelf: "flex-start", backgroundColor: SHOT_ART.clay, borderRadius: 4 * k, paddingHorizontal: 6 * k, paddingVertical: 3 * k, marginTop: 10 * k }}>
        <Text style={{ fontFamily: fonts.uiBold, fontSize: 10.5 * k, color: SHOT_ART.white }}>Sign up by Fri, Nov 20</Text>
      </View>
    </View>
  );
}

const RECEIPT_ROWS = [
  ["Oat milk", "4.99"],
  ["Sourdough", "6.49"],
  ["Olive oil", "12.99"],
  ["Coffee beans", "14.99"],
  ["Apples", "5.15"],
] as const;

function Receipt({ k }: { k: number }) {
  const row = { flexDirection: "row", justifyContent: "space-between" } as const;
  const font = { fontFamily: fonts.ui, fontSize: 11 * k, lineHeight: 15 * k, color: SHOT_ART.ink } as const;
  const rule = { height: 1, backgroundColor: SHOT_ART.ink, opacity: 0.3, marginVertical: 5 * k } as const;
  return (
    <View style={{ flex: 1, backgroundColor: SHOT_ART.white, padding: 12 * k }}>
      <Text style={[font, { fontFamily: fonts.uiBold, textAlign: "center", letterSpacing: 0.5 }]}>GREENLEAF MARKET</Text>
      <View style={rule} />
      {RECEIPT_ROWS.map(([name, price]) => (
        <View key={name} style={row}>
          <Text style={font}>{name}</Text>
          <Text style={font}>{price}</Text>
        </View>
      ))}
      <View style={[row, { backgroundColor: SHOT_ART.butter, marginHorizontal: -4 * k, paddingHorizontal: 4 * k, marginTop: 3 * k }]}>
        <Text style={font}>Refund pending</Text>
        <Text style={font}>-6.49</Text>
      </View>
      <View style={rule} />
      <View style={row}>
        <Text style={[font, { fontFamily: fonts.uiBold }]}>TOTAL</Text>
        <Text style={[font, { fontFamily: fonts.uiBold }]}>$38.12</Text>
      </View>
      <Text style={[font, { textAlign: "center", marginTop: 8 * k }]}>Nov 8, 6:42 PM</Text>
    </View>
  );
}

type Props = {
  uri: string | null;
  title: string;
  tilt?: boolean | number;
  size?: number;
  variant?: ShotVariant;
};

export function ShotSticker({ uri, title, tilt = false, size = 120, variant }: Props) {
  const pal = usePalette();
  const k = size / CANVAS;
  const angle = tilt === true ? -2 : tilt || 0;
  const art = variant ?? shotVariantFor(title);
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={title}
      style={{
        width: size,
        height: Math.round((size * 4) / 3),
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: pal.white,
        boxShadow: [
          { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 3, color: pal.cut },
          { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 4, color: pal.dark ? pal.scrim : pal.hair2 },
        ],
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      {uri ? (
        <Image source={{ uri }} contentFit="cover" style={{ flex: 1 }} />
      ) : art === "flyer" ? (
        <Flyer k={k} />
      ) : art === "receipt" ? (
        <Receipt k={k} />
      ) : (
        <View style={{ flex: 1, padding: 10 * k, justifyContent: "center", gap: 8 * k }}>
          <Text numberOfLines={4} style={{ fontFamily: fonts.uiBold, fontSize: Math.max(11, 13 * k), lineHeight: Math.max(14, 17 * k), color: pal.ink }}>
            {title}
          </Text>
          <View style={{ height: 4 * k, width: "80%", borderRadius: 2, backgroundColor: pal.fill2 }} />
          <View style={{ height: 4 * k, width: "55%", borderRadius: 2, backgroundColor: pal.fill2 }} />
        </View>
      )}
    </View>
  );
}
