import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KEEPER_IDS,
  KEEPERS,
  Keeper,
  KeeperFace,
  KeeperLine,
  PsstButton,
  ShotSticker,
  Skeleton,
  SoftCard,
  Wash,
  fonts,
  text,
  usePalette,
} from "@/design/psst";
import { DEMO_FLYER, DEMO_SHOTS } from "@/lib/fixtures";

export default function KitSheet() {
  const pal = usePalette();
  const insets = useSafeAreaInsets();
  const label = { ...text.caption, color: pal.ink2, marginTop: 8 };
  return (
    <ScrollView style={{ backgroundColor: pal.paper }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 48, gap: 16 }}>
      <Text style={{ ...text.headline, color: pal.ink }}>Kit sticker sheet.</Text>
      <Text style={label}>Keepers, rest / react / anxious</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {KEEPER_IDS.map((id) => (
          <Keeper key={id} id={id} size={84} />
        ))}
        <Keeper id="murmur" size={84} mood="react" />
        <Keeper id="tock" size={84} mood="anxious" />
        <Keeper id="mote" size={84} sticker />
        <Keeper id="penny" size={84} muted />
      </View>
      <Text style={label}>Faces</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {KEEPER_IDS.map((id) => (
          <KeeperFace key={id} id={id} size={40} />
        ))}
      </View>
      <Text style={label}>Type</Text>
      <Text style={{ ...text.headlineCard, color: pal.ink }}>Tock found your Tuesday booking.</Text>
      <Text style={{ ...text.largeTitle, color: pal.ink }}>Rooms</Text>
      <Text style={{ ...text.body, color: pal.ink }}>Body 15 Figtree. $1,450.00 on Dec 1.</Text>
      <Text style={{ ...text.bodyBold, color: pal.ink, fontFamily: fonts.uiBold }}>Body bold 16</Text>
      <Text style={{ ...text.caption, color: pal.ink2 }}>Caption 13</Text>
      <Wash keeper="tock">
        <View style={{ flexDirection: "row", gap: 16 }}>
          <ShotSticker uri={null} title={DEMO_FLYER.title} tilt size={110} variant="flyer" />
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ ...text.bodyBold, fontSize: 18, color: pal.ink }}>{DEMO_FLYER.title}</Text>
            <KeeperLine id="tock">{DEMO_FLYER.keeperLine}</KeeperLine>
          </View>
        </View>
      </Wash>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {DEMO_SHOTS.filter((s) => ["m4", "m3", "i1", "u1"].includes(s.id)).map((s) => (
          <ShotSticker key={s.id} uri={null} title={s.title} size={80} variant={s.variant} />
        ))}
      </View>
      <PsstButton kind="filled" keeper="tock" label="Remind me Thu 9:00 AM" onPress={() => {}} />
      <PsstButton kind="filled" label="Continue" onPress={() => {}} />
      <PsstButton kind="outline" label="Not today" onPress={() => {}} />
      <PsstButton kind="text" label="Skip ahead" onPress={() => {}} />
      <PsstButton kind="filled" label="Disabled" disabled />
      <SoftCard>
        <Text style={{ ...text.body, color: pal.ink }}>Psst sees the 12 you picked. That works.</Text>
      </SoftCard>
      <View style={{ gap: 8 }}>
        <Skeleton w="100%" h={16} />
        <Skeleton w="60%" h={16} />
      </View>
      {KEEPER_IDS.map((id) => (
        <KeeperLine key={id} id={id} row>
          {KEEPERS[id].motto}
        </KeeperLine>
      ))}
    </ScrollView>
  );
}
