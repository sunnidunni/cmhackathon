import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { fonts, usePalette } from "@/design/psst";

// The solid "Back" pill shown in the native stack header on the screenshot and room screens.
export function BackButton() {
  const pal = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      onPress={() => router.back()}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingLeft: 10,
        paddingRight: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: pal.hair,
        backgroundColor: pressed ? pal.paper : pal.white,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <SymbolView
        name="chevron.left"
        size={17}
        weight="semibold"
        tintColor={pal.ink}
        fallback={
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={pal.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        }
      />
      <Text maxFontSizeMultiplier={1.6} style={{ fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 20, color: pal.ink }}>
        Back
      </Text>
    </Pressable>
  );
}
