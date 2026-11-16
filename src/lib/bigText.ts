import { useWindowDimensions } from "react-native";

// One switch for accessibility text sizes (iOS AX1 and up, 28/17 is about 1.65). Below it the default layouts hold.
export const BIG_TEXT_SCALE = 1.6;

export function useBigText(): boolean {
  return useWindowDimensions().fontScale >= BIG_TEXT_SCALE;
}
