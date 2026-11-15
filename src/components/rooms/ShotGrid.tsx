import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ShotSticker, Skeleton, text, useKeeperColors, usePalette, type KeeperId } from "./kit";

export type GridItem = { id: string; title: string; imageUrl: string | null; sub: string | null };

const GUTTER = 16;
const GAP = 16;

function useCell() {
  const { width } = useWindowDimensions();
  return Math.floor((Math.min(width, 520) - GUTTER * 2 - GAP) / 2);
}

// Two columns of stickers. The date or amount sits under the title in the keeper's deep and never truncates.
export function ShotGrid({ items, keeper, onOpen }: { items: GridItem[]; keeper: KeeperId; onOpen: (id: string) => void }) {
  const cell = useCell();
  const p = usePalette();
  const { deep } = useKeeperColors(keeper);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
      {items.map((i) => (
        <Pressable
          key={i.id}
          accessibilityRole="button"
          accessibilityLabel={i.sub ? `${i.title}, ${i.sub}` : i.title}
          onPress={() => onOpen(i.id)}
          style={{ width: cell, gap: 4 }}
        >
          <ShotSticker uri={i.imageUrl} title={i.title} size={cell} />
          <Text style={[text.bodyBold, { color: p.ink, marginTop: 8 }]} numberOfLines={2}>
            {i.title}
          </Text>
          {i.sub ? <Text style={[text.caption, { color: deep }]}>{i.sub}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function ShotGridSkeleton() {
  const cell = useCell();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
      {[0, 1, 2, 3].map((k) => (
        <View key={k} style={{ width: cell, gap: 8 }}>
          <Skeleton w={cell} h={Math.round(cell * 1.4)} style={{ borderRadius: 8 }} />
          <Skeleton w={cell * 0.7} h={14} />
          <Skeleton w={cell * 0.45} h={12} />
        </View>
      ))}
    </View>
  );
}
