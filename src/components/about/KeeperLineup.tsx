import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { KEEPER_IDS, KEEPERS, KeeperLine, text, usePalette, type KeeperId } from "@/design/psst";
import { Keeper } from "@/design/keepers-v2";

export function KeeperLineup() {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const [said, setSaid] = useState<{ id: KeeperId; line: string; key: number } | null>(null);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        {KEEPER_IDS.map((id) => (
          <View key={id} style={{ alignItems: "center", flex: 1 }}>
            <Keeper
              name={id}
              size={78}
              onLine={(line) => {
                Haptics.selectionAsync().catch(() => {});
                setSaid((prev) => ({ id, line, key: (prev?.key ?? 0) + 1 }));
              }}
            />
            <Text maxFontSizeMultiplier={1.6} numberOfLines={1} style={[text.caption, { color: pal.ink2, marginTop: 4 }]}>
              {KEEPERS[id].name}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }} accessibilityLiveRegion="polite">
        {said ? (
          <Animated.View key={said.key} entering={reduce ? undefined : FadeIn.duration(180)}>
            <KeeperLine id={said.id} style={{ textAlign: "center" }}>
              {said.line}
            </KeeperLine>
          </Animated.View>
        ) : (
          <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink3, textAlign: "center" }]}>
            Tap a keeper to say hello.
          </Text>
        )}
      </View>
    </View>
  );
}
