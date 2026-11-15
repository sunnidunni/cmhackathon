import { Text, View } from "react-native";
import { Character } from "./Character";
import { colors, radii, RoomKey, rooms, type } from "./theme";

export function RoomBadge({ room, count }: { room: RoomKey; count?: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: rooms[room].tint,
        borderColor: colors.ink,
        borderWidth: 1.5,
        borderRadius: radii.pill,
        paddingLeft: 3,
        paddingRight: 10,
        paddingVertical: 2,
      }}
    >
      <Character room={room} size={24} outline={false} />
      <Text style={type.label}>{rooms[room].label}</Text>
      {count !== undefined ? <Text style={[type.label, { color: colors.inkSoft }]}>{count}</Text> : null}
    </View>
  );
}
