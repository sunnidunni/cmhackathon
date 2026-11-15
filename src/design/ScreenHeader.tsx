import { Text, View } from "react-native";
import { Character } from "./Character";
import { SpeechBubble } from "./SpeechBubble";
import { RoomKey, spacing, type } from "./theme";

export function ScreenHeader({
  title,
  subtitle,
  room,
  line,
  right,
}: {
  title: string;
  subtitle?: string;
  room?: RoomKey;
  line?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={type.display}>{title}</Text>
          {subtitle ? <Text style={[type.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {room && line ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <View style={{ flexShrink: 0 }}>
            <Character room={room} size={52} />
          </View>
          <SpeechBubble tail="left" style={{ marginBottom: 0, flexShrink: 1 }}>
            {line}
          </SpeechBubble>
        </View>
      ) : null}
    </View>
  );
}
