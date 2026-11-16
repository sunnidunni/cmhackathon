// Drop-in playground: mount <KeepersDemo /> on any screen to see every keeper and state on a phone.
import React, { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Keeper, type KeeperHandle, type KeeperReaction, type KeeperState } from "./Keeper";
import type { KeeperName } from "./keeperArt";

const NAMES: KeeperName[] = ["tock", "murmur", "penny", "mote"];
const STATES: KeeperState[] = ["rest", "holding", "sleeping", "muted"];
const REACTIONS: KeeperReaction[] = ["filed", "tap", "celebrate", "reveal"];

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, height: 44, justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "#211D2B33" }}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function Row({ name }: { name: KeeperName }) {
  const ref = useRef<KeeperHandle>(null);
  const [state, setState] = useState<KeeperState>("rest");
  const [line, setLine] = useState("");
  return (
    <View style={{ alignItems: "center", gap: 8, paddingVertical: 12 }}>
      <Keeper ref={ref} name={name} state={state} size={160} onLine={setLine} />
      <Text style={{ minHeight: 20 }}>{line}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {STATES.map((s) => (
          <Chip key={s} label={s} onPress={() => setState(s)} />
        ))}
        {REACTIONS.map((r) => (
          <Chip key={r} label={r} onPress={() => ref.current?.play(r)} />
        ))}
      </View>
    </View>
  );
}

export function KeepersDemo() {
  const refs = useRef<(KeeperHandle | null)[]>([]);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-end" }}>
        {NAMES.map((n, i) => (
          <Keeper key={n} ref={(h) => { refs.current[i] = h; }} name={n} size={88} />
        ))}
      </View>
      <Chip label="file one in every room (queued, one at a time)" onPress={() => refs.current.forEach((h) => h?.play("filed"))} />
      {NAMES.map((n) => (
        <Row key={n} name={n} />
      ))}
    </ScrollView>
  );
}
