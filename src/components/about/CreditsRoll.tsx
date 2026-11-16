import { Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { KEEPER_IDS, KEEPERS, fonts, text, usePalette } from "@/design/psst";

const SECTIONS: { title: string; lines: string[] }[] = [
  { title: "Made by", lines: ["Ryan Ding", "Derek Sun", "Bradley Tsou"] },
  { title: "Keepers", lines: KEEPER_IDS.map((id) => `${KEEPERS[id].name} · ${KEEPERS[id].motto}`) },
  { title: "Built with", lines: ["Expo", "Expo Router", "React Native", "Convex", "Reanimated", "React Native SVG"] },
  { title: "Type", lines: ["Fraunces", "Figtree", "Shantell Sans"] },
];

export function CreditsRoll() {
  const pal = usePalette();
  const reduce = useReducedMotion();
  let i = 0;
  const enter = () => (reduce ? undefined : FadeInDown.delay(250 + 90 * i++).duration(420));

  return (
    <View style={{ gap: 22, alignItems: "center" }}>
      {SECTIONS.map((s) => (
        <View key={s.title} style={{ alignItems: "center", gap: 6 }}>
          <Animated.Text
            entering={enter()}
            maxFontSizeMultiplier={1.6}
            accessibilityRole="header"
            style={{ fontFamily: fonts.uiBold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: pal.ink3 }}
          >
            {s.title}
          </Animated.Text>
          {s.lines.map((line) => (
            <Animated.View key={line} entering={enter()}>
              <Text maxFontSizeMultiplier={2} style={[text.body, { color: pal.ink, textAlign: "center" }]}>
                {line}
              </Text>
            </Animated.View>
          ))}
        </View>
      ))}
    </View>
  );
}
