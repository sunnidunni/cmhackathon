import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useKeeperColors, Wash, type KeeperId } from "@/design/psst";

// The keeper's wash, or the muted grey wash when the room has nothing new (DESIGN 2.1: muted replaces a keeper's colors).
export function RoomWash({ keeper, muted = false, style, children }: { keeper: KeeperId; muted?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { tint } = useKeeperColors(keeper, muted);
  return (
    <Wash keeper={keeper} style={[muted && { backgroundColor: tint }, style]}>
      {children}
    </Wash>
  );
}
