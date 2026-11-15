import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";

export function useStickerFonts() {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, PatrickHand_400Regular });
  return loaded;
}
