import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Keeper, KeeperLine, type KeeperId } from "@/design/psst";

const WAKE_LINE: Record<KeeperId, string> = {
  tock: "Mm. Nothing with a date yet.",
  murmur: "Mm. No chats here yet.",
  penny: "Mm. No receipts yet.",
  mote: "Mm. The jar's empty, for now.",
};

const AWAKE_MS = 6000;

// An empty room's keeper sleeps. A tap wakes it, it says one groggy line, and after six quiet seconds it dozes off again.
export function SleepyKeeper({ id, size }: { id: KeeperId; size: number }) {
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!awake) return;
    const timer = setTimeout(() => setAwake(false), AWAKE_MS);
    return () => clearTimeout(timer);
  }, [awake]);
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={() => setAwake(true)}>
        <Keeper id={id} size={size} sleeping={!awake} mood={awake ? "react" : "rest"} />
      </Pressable>
      {awake ? <KeeperLine id={id}>{WAKE_LINE[id]}</KeeperLine> : null}
    </View>
  );
}
