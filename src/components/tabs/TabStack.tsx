import { Stack } from "expo-router";
import { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { fonts, text, usePalette } from "@/design/psst";

// Web has no native large title, and expo-router draws its tab pill fixed over the top 64px of the page.
// This header clears the pill and shows the title large beneath it, so the two never overlap.
function WebLargeTitle({ options }: { options: { title?: string } }) {
  const p = usePalette();
  return (
    <View style={{ backgroundColor: p.paper, paddingTop: 72, paddingHorizontal: 16, paddingBottom: 4 }}>
      <Text maxFontSizeMultiplier={1.67} accessibilityRole="header" style={[text.largeTitle, { color: p.ink }]}>
        {options.title}
      </Text>
    </View>
  );
}

// One native Stack per tab so iOS draws a large-title header (DESIGN 3.12, native-ios-spec 2.3).
// The options object is memoised: an inline object changes every render and re-applies the header.
// headerTransparent and headerStyle.backgroundColor are left alone so iOS 26 keeps its scroll-under glass header.
export function TabStack({ title }: { title: string }) {
  const p = usePalette();
  const options = useMemo(
    () => ({
      title,
      headerLargeTitleEnabled: true,
      headerLargeTitleShadowVisible: false,
      headerLargeTitleStyle: { fontFamily: fonts.display, color: p.ink },
      headerTitleStyle: { fontFamily: fonts.uiBold, color: p.ink },
      headerTintColor: p.ink,
      headerShadowVisible: false,
      contentStyle: { backgroundColor: p.paper },
      ...(Platform.OS === "web" ? { header: WebLargeTitle } : null),
    }),
    [title, p.ink, p.paper],
  );
  return <Stack screenOptions={options} />;
}
