import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable } from "react-native";
import { ZoomViewer } from "@/components/tabs/ZoomViewer";
import { ShotSticker } from "@/design/psst";
import type { ActScenario } from "@/lib/act/types";

export function SourceThumb({ source, size }: { source: ActScenario["source"]; size: number }) {
  const [zoom, setZoom] = useState(false);
  const uri = typeof source.image === "number" ? Image.resolveAssetSource(source.image)?.uri : source.image;
  const sticker = <ShotSticker uri={source.image} title={source.title} size={size} />;
  if (!source.shotId && !uri) return sticker;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open your screenshot: ${source.title}`}
        hitSlop={8}
        onPress={() => (source.shotId ? router.push(`/shot/${source.shotId}`) : setZoom(true))}
      >
        {sticker}
      </Pressable>
      {uri ? <ZoomViewer uri={uri} visible={zoom} onClose={() => setZoom(false)} /> : null}
    </>
  );
}
