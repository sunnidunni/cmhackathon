import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  APP_NAME,
  Button,
  Character,
  colors,
  radii,
  ROOM_KEYS,
  RoomBadge,
  RoomKey,
  rooms,
  ScreenHeader,
  ScreenshotSticker,
  Doodle,
  SketchFrame,
  SpeechBubble,
  spacing,
  Sticker,
  tiltFor,
  type,
} from "@/design";

const LINES: Record<RoomKey, string> = {
  deadlines: "Rent's due Friday. Want a nudge Thursday?",
  chats: "Maya asked you something on Tuesday.",
  money: "You saved a receipt for $48.20.",
  ideas: "That app idea is still waiting for you.",
};

function FakeShot({ room }: { room: RoomKey }) {
  const accent = rooms[room].color;
  return (
    <View style={{ flex: 1, backgroundColor: "#16110D", padding: 8, gap: 6 }}>
      <View style={{ height: 6, width: 40, borderRadius: 3, backgroundColor: "#3A302A", alignSelf: "center", marginBottom: 6 }} />
      {[60, 42, 70, 36, 54].map((w, i) => (
        <View
          key={i}
          style={{
            height: 14,
            width: `${w}%`,
            borderRadius: 7,
            alignSelf: i % 2 ? "flex-end" : "flex-start",
            backgroundColor: i % 2 ? accent : "#3A302A",
          }}
        />
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
      <Text style={type.title}>{title}</Text>
      {children}
    </View>
  );
}

function MissedRow({ room, index }: { room: RoomKey; index: number }) {
  const flip = index % 2 === 1;
  return (
    <View style={{ flexDirection: flip ? "row-reverse" : "row", alignItems: "center", gap: spacing.md }}>
      <ScreenshotSticker room={room} width={92} tilt={tiltFor(room + index)}>
        <FakeShot room={room} />
      </ScreenshotSticker>
      <View style={{ flex: 1, alignItems: flip ? "flex-end" : "flex-start", gap: spacing.xs }}>
        <SpeechBubble tail={flip ? "bottom-right" : "bottom-left"}>{LINES[room]}</SpeechBubble>
        <View style={{ flexDirection: flip ? "row-reverse" : "row", alignItems: "center", gap: spacing.sm }}>
          <Character room={room} size={64} expression={index === 0 ? "happy" : "neutral"} />
          <Text style={type.caption}>{index + 2} days ago</Text>
          {index === 0 ? <Doodle kind="star" size={30} color={colors.sun} strokeWidth={3} /> : null}
        </View>
      </View>
    </View>
  );
}

export default function DesignGallery() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxxl }}>
      <ScreenHeader title={`${APP_NAME} design`} subtitle="Sticker sheet: every token and component" />

      <Section title="Colors">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {(["paper", "ink", "inkSoft", "sun", "line"] as const).map((k) => (
            <View key={k} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors[k], borderWidth: 1.5, borderColor: colors.ink }} />
              <Text style={type.caption}>{k}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {ROOM_KEYS.map((r) => (
            <View key={r} style={{ flexDirection: "row", borderRadius: radii.md, overflow: "hidden", borderWidth: 1.5, borderColor: colors.ink }}>
              <View style={{ width: 36, height: 36, backgroundColor: rooms[r].color }} />
              <View style={{ width: 36, height: 36, backgroundColor: rooms[r].tint }} />
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type">
        <Text style={type.display}>Display 42</Text>
        <Text style={type.title}>Title 29</Text>
        <Text style={type.heading}>Heading 22</Text>
        <Text style={type.body}>Body 16. Screenshots you forgot about, sorted for you.</Text>
        <Text style={type.caption}>Caption 13</Text>
        <Text style={type.say}>Say 19, for speech bubbles</Text>
        <Text style={type.label}>Label 16</Text>
      </Section>

      <Section title="Characters">
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.lg }}>
          {ROOM_KEYS.map((r) => (
            <View key={r} style={{ width: "48%", alignItems: "center", gap: spacing.xs }}>
              <View style={{ flexDirection: "row" }}>
                <Character room={r} size={84} />
                <Character room={r} size={84} expression="happy" />
              </View>
              <Text style={type.heading}>{rooms[r].character}</Text>
              <Text style={type.caption}>{rooms[r].label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Sticker">
        <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "center" }}>
          <Sticker tilt={-3}>
            <View style={{ width: 90, height: 60, backgroundColor: rooms.deadlines.tint }} />
          </Sticker>
          <Sticker tilt={2}>
            <Character room="money" size={60} outline={false} />
          </Sticker>
        </View>
      </Section>

      <Section title="Speech bubble">
        <SpeechBubble>Psst. You have three things waiting.</SpeechBubble>
        <View style={{ alignItems: "flex-end" }}>
          <SpeechBubble tail="bottom-right">Tail on the right.</SpeechBubble>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Character room="chats" size={56} />
          <SpeechBubble tail="left" style={{ marginBottom: 0 }}>Tail on the left, next to a character.</SpeechBubble>
        </View>
      </Section>

      <Section title="Screenshot sticker">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, rowGap: spacing.xl, paddingTop: spacing.sm }}>
          {ROOM_KEYS.slice(0, 3).map((r, i) => (
            <ScreenshotSticker key={r} room={r} width={88} tilt={tiltFor(r + i)}>
              <FakeShot room={r} />
            </ScreenshotSticker>
          ))}
        </View>
      </Section>

      <Section title="Room badge">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {ROOM_KEYS.map((r, i) => (
            <RoomBadge key={r} room={r} count={i + 2} />
          ))}
        </View>
      </Section>

      <Section title="Doodles">
        <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "center" }}>
          <Doodle kind="star" size={44} color={colors.sun} strokeWidth={3.5} />
          <Doodle kind="arrow" size={48} />
          <Doodle kind="swirl" size={44} color={rooms.chats.color} />
          <Doodle kind="underline" width={90} color={colors.sun} strokeWidth={7} />
        </View>
      </Section>

      <Section title="Button">
        <Button label="Remind me tomorrow" />
        <Button label="Not now" variant="secondary" />
      </Section>

      <Section title="Mock: Missed inbox">
        <SketchFrame fill={colors.paper} radius={radii.xl} strokeWidth={2.2} seed="missed" style={{ paddingBottom: spacing.xl }}>
          <ScreenHeader title="Missed" subtitle="4 screenshots you forgot about" room="ideas" line="Psst. A few of these still matter." />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
            {ROOM_KEYS.map((r, i) => (
              <RoomBadge key={r} room={r} count={[3, 5, 2, 7][i]} />
            ))}
          </View>
          <View style={{ gap: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
            {ROOM_KEYS.map((r, i) => (
              <MissedRow key={r} room={r} index={i} />
            ))}
          </View>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}>
            <View style={{ position: "absolute", left: spacing.sm, top: -4, transform: [{ rotate: "20deg" }] }}>
              <Doodle kind="arrow" size={40} />
            </View>
            <Button label="Catch up on all 4" />
          </View>
        </SketchFrame>
      </Section>
    </ScrollView>
  );
}
