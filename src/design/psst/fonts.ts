import { Figtree_500Medium, Figtree_700Bold } from "@expo-google-fonts/figtree";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { ShantellSans_500Medium } from "@expo-google-fonts/shantell-sans";
import { useFonts } from "expo-font";
import type { TextStyle } from "react-native";

export const fonts = {
  display: "Fraunces_600SemiBold",
  ui: "Figtree_500Medium",
  uiBold: "Figtree_700Bold",
  voice: "ShantellSans_500Medium",
} as const;

export function usePsstFonts() {
  const [loaded] = useFonts({ Fraunces_600SemiBold, Figtree_500Medium, Figtree_700Bold, ShantellSans_500Medium });
  return loaded;
}

export const text = {
  headline: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  headlineCard: { fontFamily: fonts.display, fontSize: 25, lineHeight: 29, letterSpacing: -0.5 },
  largeTitle: { fontFamily: fonts.uiBold, fontSize: 30, lineHeight: 34 },
  lead: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21 },
  bodyBold: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18 },
  voice: { fontFamily: fonts.voice, fontSize: 16, lineHeight: 21 },
  voiceRow: { fontFamily: fonts.voice, fontSize: 14, lineHeight: 19 },
} satisfies Record<string, TextStyle>;
