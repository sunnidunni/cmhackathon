import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { fonts, text, usePalette } from "@/design/psst";

type Props = {
  index: number;
  symbol: SymbolViewProps["name"];
  title: string;
  caption: string;
  last?: boolean;
  children?: ReactNode;
};

export function FlowStep({ index, symbol, title, caption, last = false, children }: Props) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.delay(150 + index * 140).duration(420)}
      accessible
      accessibilityLabel={`Step ${index + 1}. ${title}. ${caption}`}
      style={{ flexDirection: "row", gap: 16 }}
    >
      <View style={{ alignItems: "center", width: 52 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pal.white,
            borderWidth: 1.5,
            borderColor: pal.hair2,
          }}
        >
          <SymbolView
            name={symbol}
            size={22}
            weight="semibold"
            tintColor={pal.ink}
            fallback={
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={6} fill={pal.ink} />
              </Svg>
            }
          />
        </View>
        {!last && <View style={{ flex: 1, width: 2, minHeight: 28, marginVertical: 6, borderRadius: 1, backgroundColor: pal.hair2 }} />}
      </View>
      <View style={{ flex: 1, paddingTop: 4, paddingBottom: last ? 0 : 28, gap: 4 }}>
        <Text maxFontSizeMultiplier={2} style={{ fontFamily: fonts.uiBold, fontSize: 12, letterSpacing: 0.6, color: pal.ink3 }}>
          STEP {index + 1}
        </Text>
        <Text maxFontSizeMultiplier={2} style={[text.bodyBold, { color: pal.ink }]}>
          {title}
        </Text>
        <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink2 }]}>
          {caption}
        </Text>
        {children}
      </View>
    </Animated.View>
  );
}
