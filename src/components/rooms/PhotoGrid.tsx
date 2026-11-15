import { Image } from "expo-image";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { COLUMNS, groupByLevel, stepLevel, type GridLevel } from "@/components/tabs/grid";
import { ShotSticker, Skeleton, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";

export type GridItem = { id: string; title: string; imageUrl: string | null; takenAt: number; sub: string | null };

const GUTTER = 16;
const GAP = 12;

function useCell(cols: number) {
  const { width } = useWindowDimensions();
  return Math.floor((Math.min(width, 520) - GUTTER * 2 - GAP * (cols - 1)) / cols);
}

// A Photos-style library in the design's skin: date lines above each group, and a pinch moves one level (days, months, years).
export function PhotoGrid({ items, keeper, header, onOpen }: { items: GridItem[]; keeper: KeeperId; header?: React.ReactNode; onOpen: (id: string) => void }) {
  const p = usePalette();
  const { deep } = useKeeperColors(keeper);
  const [level, setLevel] = useState<GridLevel>("day");
  const cols = COLUMNS[level];
  const cell = useCell(cols);
  const [now] = useState(() => Date.now());
  const groups = groupByLevel(items, level, new Date().getTimezoneOffset(), now);

  // The gesture callback is a worklet on the UI thread, so the decision runs on JS through runOnJS.
  const onPinchEnd = (scale: number) => {
    if (scale > 1.15) setLevel((l) => stepLevel(l, "out"));
    else if (scale < 0.87) setLevel((l) => stepLevel(l, "in"));
  };
  const pinch = Gesture.Pinch().onEnd((e) => {
    runOnJS(onPinchEnd)(e.scale);
  });

  return (
    <GestureDetector gesture={pinch}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: GUTTER, paddingTop: Platform.OS === "ios" ? 8 : 64, paddingBottom: 32, gap: 16 }}
        >
          {header}
          {groups.map((g) => (
            <View key={g.key} style={{ gap: 12 }}>
              <Text accessibilityRole="header" style={[text.bodyBold, { color: p.ink }]}>
                {g.label}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: level === "day" ? 16 : GAP }}>
                {g.items.map((i) => (
                  <Pressable
                    key={i.id}
                    accessibilityRole="button"
                    accessibilityLabel={i.sub ? `${i.title}, ${i.sub}` : i.title || "Screenshot"}
                    onPress={() => onOpen(i.id)}
                    style={{ width: cell, gap: 4 }}
                  >
                    {level === "day" ? (
                      <>
                        <ShotSticker uri={i.imageUrl} title={i.title} size={cell} />
                        <Text style={[text.bodyBold, { color: p.ink, marginTop: 8 }]} numberOfLines={2}>
                          {i.title}
                        </Text>
                        {i.sub ? <Text style={[text.caption, { color: deep }]}>{i.sub}</Text> : null}
                      </>
                    ) : (
                      <View style={{ width: cell, height: Math.round(cell * 1.7), borderRadius: 6, overflow: "hidden", backgroundColor: p.fill2, borderWidth: 1, borderColor: p.hair }}>
                        {i.imageUrl ? <Image source={{ uri: i.imageUrl }} style={{ width: cell, height: Math.round(cell * 1.7) }} contentFit="cover" /> : null}
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </GestureDetector>
  );
}

export function ShotGridSkeleton() {
  const cell = useCell(2);
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
