import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOut, useReducedMotion } from "react-native-reanimated";
import { UndoToast } from "@/components/rooms/UndoToast";
import { filedLine, freshJustIn } from "./filed";
import type { Item } from "./model";

const HOLD_MS = 3000;

// One toast per batch: the first newly filed screenshot after Today opened. Pairs with the keeper's filed reaction on its row.
export function useFiledToast(items: Item[] | null): Item | null {
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  const [shown, setShown] = useState<Item | null>(null);
  if (items) {
    if (seen === null) setSeen(new Set(items.filter((i) => i.section === "justIn").map((i) => i.id)));
    else {
      const fresh = freshJustIn(items, seen);
      if (fresh.length > 0) {
        setSeen(new Set([...seen, ...fresh.map((i) => i.id)]));
        setShown(fresh[0]!);
      }
    }
  }
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), HOLD_MS);
    return () => clearTimeout(t);
  }, [shown]);
  return shown;
}

export function FiledToast({ item }: { item: Item | null }) {
  const reduce = useReducedMotion();
  if (!item) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, bottom: 96 }}>
      <Animated.View key={item.id} entering={reduce ? undefined : FadeInDown.duration(200)} exiting={reduce ? undefined : FadeOut.duration(150)}>
        <UndoToast message={filedLine(item)} />
      </Animated.View>
    </View>
  );
}
