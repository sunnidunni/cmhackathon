import { Stack } from "expo-router";
import { useMemo } from "react";
import { fonts, usePalette } from "@/design/psst";

// One native Stack per tab so iOS draws a large-title header (DESIGN 3.12, native-ios-spec 2.3).
// The options object is memoised: an inline object changes every render and re-applies the header.
// headerTransparent and headerStyle.backgroundColor are left alone so iOS 26 keeps its scroll-under glass header.
// On web and Android the large title is ignored and the same title shows in a plain header.
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
    }),
    [title, p.ink, p.paper],
  );
  return <Stack screenOptions={options} />;
}
