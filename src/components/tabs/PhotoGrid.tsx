import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { colors, radii, ScreenshotSticker, spacing, tiltFor, type } from "@/design";
import { COLUMNS, groupByLevel, stepLevel, type GridLevel } from "./grid";
import { tzOffset } from "./ui";

export type GridItem = { _id: string; title: string; imageUrl: string | null; takenAt: number; caption?: string | null };

const PAD = spacing.xl;
const GAP = spacing.sm;

// A Photos-style library: date lines above each group, and a pinch moves one level (days, months, years).
export function PhotoGrid({ items, header }: { items: GridItem[]; header?: React.ReactNode }) {
  const [level, setLevel] = useState<GridLevel>("day");
  const { width } = useWindowDimensions();
  const cols = COLUMNS[level];
  const cell = Math.floor((width - PAD * 2 - GAP * (cols - 1)) / cols);
  const groups = groupByLevel(items, level, tzOffset(), Date.now());

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
        <ScrollView contentContainerStyle={{ padding: PAD, paddingTop: spacing.sm, gap: spacing.lg }}>
          {header}
          {groups.map((g) => (
            <View key={g.key} style={{ gap: spacing.md }}>
              <Text style={type.heading}>{g.label}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: level === "day" ? spacing.lg : GAP }}>
                {g.items.map((item) => (
                  <Pressable
                    key={item._id}
                    accessibilityRole="button"
                    accessibilityLabel={item.title || "Screenshot"}
                    onPress={() => router.push(`/shot/${item._id}`)}
                    style={{ width: cell, gap: spacing.sm }}
                  >
                    {level === "day" ? (
                      <>
                        <ScreenshotSticker uri={item.imageUrl ?? undefined} width={Math.min(120, cell - 12)} tilt={tiltFor(item._id)} />
                        <Text style={type.bodyBold} numberOfLines={2}>{item.title}</Text>
                        {item.caption ? <Text style={type.caption}>{item.caption}</Text> : null}
                      </>
                    ) : (
                      <View style={{ width: cell, height: Math.round(cell * 1.7), borderRadius: radii.sm, overflow: "hidden", backgroundColor: colors.paperDeep }}>
                        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: cell, height: Math.round(cell * 1.7) }} contentFit="cover" /> : null}
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
