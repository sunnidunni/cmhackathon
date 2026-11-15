import { Image } from "expo-image";
import { Text, View } from "react-native";
import { Sticker } from "./Sticker";
import { colors, radii, RoomKey, rooms, type } from "./theme";

export function ScreenshotSticker({
  uri,
  room,
  width = 110,
  tilt = 0,
  children,
}: {
  uri?: string;
  room?: RoomKey;
  width?: number;
  tilt?: number;
  children?: React.ReactNode;
}) {
  const height = Math.round(width * 1.9);
  return (
    <View style={{ alignSelf: "flex-start" }}>
      <Sticker tilt={tilt} border={5} radius={radii.md}>
        <View style={{ width, height, backgroundColor: colors.paperDeep }}>
          {uri ? <Image source={{ uri }} style={{ width, height }} contentFit="cover" /> : children}
        </View>
      </Sticker>
      {room ? (
        <View
          style={{
            position: "absolute",
            top: -8,
            right: -10,
            backgroundColor: rooms[room].color,
            borderColor: colors.ink,
            borderWidth: 1.5,
            borderRadius: radii.pill,
            paddingHorizontal: 8,
            paddingVertical: 3,
            transform: [{ rotate: `${tilt + 6}deg` }],
          }}
        >
          <Text style={[type.label, { color: colors.white }]}>{rooms[room].label}</Text>
        </View>
      ) : null}
    </View>
  );
}
