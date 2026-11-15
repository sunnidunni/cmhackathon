import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, ScreenshotSticker, spacing, tiltFor, type } from "@/design";
import { COLUMNS, groupByLevel, type GridLevel } from "./grid";
import { buildRows, rowLayouts, snapLevel, type Row } from "./gridRows";
import { tzOffset } from "./ui";

export type GridItem = { _id: string; title: string; imageUrl: string | null; takenAt: number; caption?: string | null };

const PAD = spacing.xl;
const HEADER_H = 48;
const TITLE_H = 44;
const CAPTION_H = 17;
const STICKER_BORDER = 5;

// Cached by screenshot id, recycled by id, with a short fade so a scroll or level change never flashes blank.
function Thumb({ item, width, height }: { item: GridItem; width: number; height: number }) {
  if (!item.imageUrl) return <View style={{ width, height, backgroundColor: colors.paperDeep }} />;
  return (
    <Image
      source={{ uri: item.imageUrl, cacheKey: item._id }}
      recyclingKey={item._id}
      cachePolicy="memory-disk"
      transition={120}
      contentFit="cover"
      style={{ width, height, backgroundColor: colors.paperDeep }}
    />
  );
}

function measure(level: GridLevel, width: number) {
  const cols = COLUMNS[level];
  const gap = level === "day" ? spacing.md : 2;
  const cell = Math.floor((width - PAD * 2 - gap * (cols - 1)) / cols);
  if (level !== "day") return { cols, gap, cell, thumbW: cell, thumbH: cell, rowH: cell + gap };
  const thumbW = Math.min(120, cell - 12);
  const thumbH = Math.round(thumbW * 1.9);
  return { cols, gap, cell, thumbW, thumbH, rowH: thumbH + STICKER_BORDER * 2 + spacing.sm + TITLE_H + CAPTION_H + spacing.xl };
}

// A Photos-style library: date lines above each group, only the rows on screen are drawn, and the
// grid follows a pinch, then settles one level up or down (days, months, years) with a fade.
export function PhotoGrid({ items, header }: { items: GridItem[]; header?: React.ReactNode }) {
  const [level, setLevel] = useState<GridLevel>("day");
  const [top, setTop] = useState(0);
  const levelRef = useRef(level);
  levelRef.current = level;
  const { width } = useWindowDimensions();
  const m = measure(level, width);

  const rows = useMemo(
    () => buildRows(groupByLevel(items, level, tzOffset(), Date.now()), m.cols),
    [items, level, m.cols],
  );
  const layouts = useMemo(() => rowLayouts(rows, { header: HEADER_H, row: m.rowH }, top), [rows, m.rowH, top]);

  const pinchScale = useSharedValue(1);
  const fade = useSharedValue(1);

  const onPinchEnd = (scale: number) => {
    const next = snapLevel(levelRef.current, scale);
    if (next === levelRef.current) return;
    fade.value = 0;
    setLevel(next);
    fade.value = withTiming(1, { duration: 220 });
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = Math.min(1.6, Math.max(0.6, e.scale));
    })
    .onEnd((e) => {
      runOnJS(onPinchEnd)(e.scale);
    })
    .onFinalize(() => {
      pinchScale.value = withTiming(1, { duration: 220 });
    });

  const animated = useAnimatedStyle(() => ({
    flex: 1,
    opacity: fade.value,
    transform: [{ scale: pinchScale.value }],
  }));

  const renderRow = ({ item: row }: { item: Row<GridItem> }) => {
    if (row.type === "header") {
      return (
        <View style={{ height: HEADER_H, justifyContent: "flex-end", paddingBottom: spacing.sm }}>
          <Text style={type.heading}>{row.label}</Text>
        </View>
      );
    }
    return (
      <View style={{ height: m.rowH, flexDirection: "row", gap: m.gap }}>
        {row.items.map((item) => (
          <Pressable
            key={item._id}
            accessibilityRole="button"
            accessibilityLabel={item.title || "Screenshot"}
            onPress={() => router.push(`/shot/${item._id}`)}
            style={{ width: m.cell, gap: spacing.sm }}
          >
            {level === "day" ? (
              <>
                <ScreenshotSticker width={m.thumbW} tilt={tiltFor(item._id)}>
                  <Thumb item={item} width={m.thumbW} height={m.thumbH} />
                </ScreenshotSticker>
                <Text style={[type.bodyBold, { height: TITLE_H }]} numberOfLines={2}>{item.title}</Text>
                {item.caption ? <Text style={type.caption} numberOfLines={1}>{item.caption}</Text> : null}
              </>
            ) : (
              <Thumb item={item} width={m.cell} height={m.cell} />
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={animated}>
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={renderRow}
          extraData={m}
          getItemLayout={(_, index) => ({ ...layouts[index], index })}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: PAD }}
          ListHeaderComponent={
            <View
              onLayout={(e) => setTop(Math.round(e.nativeEvent.layout.height))}
              style={{ paddingTop: spacing.sm, gap: spacing.lg }}
            >
              {header}
            </View>
          }
        />
      </Animated.View>
    </GestureDetector>
  );
}
