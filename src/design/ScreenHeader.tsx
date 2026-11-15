import { useState } from "react";
import { Text, View } from "react-native";
import { Character } from "./Character";
import { Doodle } from "./Doodle";
import { SpeechBubble } from "./SpeechBubble";
import { colors, RoomKey, spacing, type } from "./theme";

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
  const [titleWidth, setTitleWidth] = useState(0);
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ flexShrink: 1 }}>
          <View style={{ alignSelf: "flex-start" }} onLayout={(e) => setTitleWidth(Math.round(e.nativeEvent.layout.width))}>
            {titleWidth > 0 ? (
              <View style={{ position: "absolute", left: -4, bottom: -2 }}>
                <Doodle kind="underline" width={titleWidth + 10} color={colors.sun} strokeWidth={7} />
              </View>
            ) : null}
            <Text style={type.display}>{title}</Text>
          </View>
          {subtitle ? <Text style={[type.caption, { marginTop: 4 }]}>{subtitle}</Text> : null}
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
