import { Image } from "expo-image";
import { Text, View } from "react-native";
import { SketchFrame } from "./SketchFrame";
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
        <SketchFrame
          fill={rooms[room].color}
          radius={radii.pill}
          strokeWidth={1.7}
          seed={room}
          style={{
            position: "absolute",
            top: -9,
            right: -10,
            paddingHorizontal: 9,
            paddingVertical: 2,
            transform: [{ rotate: `${tilt + 6}deg` }],
          }}
        >
          <Text style={[type.label, { color: colors.white }]}>{rooms[room].label}</Text>
        </SketchFrame>
      ) : null}
    </View>
  );
}
