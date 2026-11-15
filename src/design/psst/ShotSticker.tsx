import { Image } from "expo-image";
import { Image as NativeImage, Text, View } from "react-native";
import { fonts } from "./fonts";
import { usePalette } from "./tokens";

const CANVAS = 180;

type Props = {
  uri: string | number | null;
  title: string;
  tilt?: boolean | number;
  size?: number;
};

export function ShotSticker({ uri, title, tilt = false, size = 120 }: Props) {
  const pal = usePalette();
  const k = size / CANVAS;
  const angle = tilt === true ? -2 : tilt || 0;
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
      {typeof uri === "string" ? (
        <Image source={{ uri }} contentFit="cover" contentPosition="top" style={{ flex: 1 }} />
      ) : uri !== null ? (
        <NativeImage source={uri} resizeMode="cover" style={{ position: "absolute", top: 0, left: 0, width: size, height: size * 2.17 }} />
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
