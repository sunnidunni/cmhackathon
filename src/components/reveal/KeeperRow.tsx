import { StyleSheet, Text, View } from "react-native";
import { Enter } from "./Enter";
import { KEEPERS, Keeper, KeeperLine, ShotSticker, Skeleton, Wash, psstLine, usePalette, text, type KeeperId } from "@/design/psst";
import { ROOM_LABEL, screenshotsIn } from "./model";

export type RowShot = { uri: string | null; title: string; id?: string };

export function SkeletonKeeperRow() {
  const p = usePalette();
  return (
    <View style={[styles.row, { borderBottomColor: p.hair }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.avatar, { backgroundColor: p.fill2 }]} />
      <View style={styles.body}>
        <Skeleton w={120} h={12} />
        <Skeleton w={200} h={10} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

export function KeeperRow({ id, count, done, active, shot }: { id: KeeperId; count: number | null; done: boolean; active: boolean; shot: RowShot | null }) {
  const p = usePalette();
  const meta = count === null ? ROOM_LABEL[id] : `${ROOM_LABEL[id]} · ${done ? count : `${count} so far`}`;
  const content = (
    <View style={[styles.row, active ? styles.rowActive : { borderBottomColor: p.hair }]}>
      <Keeper id={id} size={56} reaction="filed" reactionKey={active ? (shot?.id ?? id) : undefined} />
      <View style={styles.body}>
        <Text style={[text.bodyBold, { color: p.ink }]}>
          {KEEPERS[id].name}
          <Text style={[text.caption, { color: p.ink2, fontWeight: "400" }]}>{` · ${meta}`}</Text>
        </Text>
        <KeeperLine id={id} row>
          {psstLine(`${id}.intro`)}
        </KeeperLine>
      </View>
      {shot ? <ShotSticker uri={shot.uri} title={shot.title} size={46} /> : null}
    </View>
  );
  return (
    <Enter>
      <View accessible accessibilityLabel={`${KEEPERS[id].name}. ${ROOM_LABEL[id]}. ${count === null ? "" : screenshotsIn(count)}. ${psstLine(`${id}.intro`)}`}>
        {active ? <Wash keeper={id} style={{ padding: 0 }}>{content}</Wash> : content}
      </View>
    </Enter>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, minHeight: 76, borderBottomWidth: StyleSheet.hairlineWidth },
  rowActive: { paddingHorizontal: 12, borderBottomWidth: 0 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  body: { flex: 1, gap: 2 },
});
