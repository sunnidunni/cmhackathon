import { Text, View } from "react-native";
import { Character } from "./Character";
import { SketchFrame } from "./SketchFrame";
import { colors, radii, RoomKey, rooms, type } from "./theme";

export function RoomBadge({ room, count }: { room: RoomKey; count?: number }) {
  return (
    <SketchFrame
      fill={rooms[room].tint}
      radius={radii.pill}
      strokeWidth={1.8}
      seed={room}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingLeft: 4,
        paddingRight: 12,
        paddingVertical: 3,
      }}
    >
      <View>
        <Character room={room} size={24} outline={false} />
      </View>
      <Text style={type.label}>{rooms[room].label}</Text>
      {count !== undefined ? <Text style={[type.label, { color: colors.inkSoft }]}>{count}</Text> : null}
    </SketchFrame>
  );
}
