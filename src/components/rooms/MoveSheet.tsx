import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { KEEPERS, KeeperFace, keeperForRoom, PsstButton, text, usePalette } from "./kit";
import { ROOM_KEYS, ROOM_LABEL } from "./RoomsParts";
import type { RoomKey } from "./kit";

const BLURB: Record<RoomKey, string> = { deadlines: "keeps your deadlines", chats: "where it is now", money: "keeps your money", ideas: "keeps your ideas" };

// A quick choice, so a sheet: the native page sheet on iOS, a plain modal elsewhere.
export function MoveSheet({ visible, current, onClose, onMove }: { visible: boolean; current: string; onClose: () => void; onMove: (room: RoomKey) => void }) {
  const p = usePalette();
  const [picked, setPicked] = useState<RoomKey | null>(null);
  const target = picked && picked !== current ? picked : null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onDismiss={() => setPicked(null)}>
      <View style={{ flex: 1, backgroundColor: p.paper, padding: 16, paddingTop: 24, gap: 8 }}>
        <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink, marginBottom: 8 }]}>
          Move it to another room.
        </Text>
        {ROOM_KEYS.map((room) => {
          const id = keeperForRoom(room);
          const on = (picked ?? current) === room;
          return (
            <Pressable
              key={room}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setPicked(room)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, borderTopWidth: 1, borderColor: p.hair }}
            >
              <KeeperFace id={id} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[text.bodyBold, { color: p.ink }]}>{ROOM_LABEL[room]}</Text>
                <Text style={[text.caption, { color: p.ink2 }]}>
                  {KEEPERS[id].name} · {BLURB[room]}
                </Text>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: on ? p.ink : p.hair2, alignItems: "center", justifyContent: "center" }}>
                {on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: p.ink }} /> : null}
              </View>
            </Pressable>
          );
        })}
        <Text style={[text.caption, { color: p.ink2, borderTopWidth: 1, borderColor: p.hair, paddingTop: 12 }]}>{"It stays where you put it. Psst won't move it back."}</Text>
        <View style={{ flex: 1 }} />
        <PsstButton
          label={target ? `Move to ${ROOM_LABEL[target]}` : "Pick a room"}
          disabled={target === null}
          onPress={() => {
            if (!target) return;
            onMove(target);
            setPicked(null);
          }}
        />
        <PsstButton kind="text" label="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
}
