import { useColorScheme } from "react-native";
import type { RoomKey } from "../theme";

export type KeeperId = "tock" | "murmur" | "penny" | "mote";

export type Palette = {
  dark: boolean;
  paper: string;
  white: string;
  ink: string;
  ink2: string;
  ink3: string;
  hair: string;
  hair2: string;
  fill: string;
  fill2: string;
  kl: string;
  cut: string;
  danger: string;
  scrim: string;
};

const light: Palette = {
  dark: false,
  paper: "#FBFAF7",
  white: "#FFFFFF",
  ink: "#211D2B",
  ink2: "rgba(33,29,43,0.68)",
  ink3: "rgba(33,29,43,0.42)",
  hair: "rgba(33,29,43,0.13)",
  hair2: "rgba(33,29,43,0.28)",
  fill: "rgba(33,29,43,0.05)",
  fill2: "rgba(33,29,43,0.09)",
  kl: "#211D2B",
  cut: "#FFFFFF",
  danger: "#A3162B",
  scrim: "rgba(33,29,43,0.46)",
};

const dark: Palette = {
  dark: true,
  paper: "#17151D",
  white: "#211E29",
  ink: "#F2EFE9",
  ink2: "rgba(242,239,233,0.68)",
  ink3: "rgba(242,239,233,0.42)",
  hair: "rgba(242,239,233,0.13)",
  hair2: "rgba(242,239,233,0.28)",
  fill: "rgba(242,239,233,0.06)",
  fill2: "rgba(242,239,233,0.1)",
  kl: "#211D2B",
  cut: "#F2EFE9",
  danger: "#FF8A9A",
  scrim: "rgba(0,0,0,0.55)",
};

export const palettes = { light, dark } as const;

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export type KeeperInfo = {
  id: KeeperId;
  name: string;
  room: RoomKey;
  main: string;
  tint: string;
  deep: string;
  tintDark: string;
  deepDark: string;
  motto: string;
};

export const KEEPERS: Record<KeeperId, KeeperInfo> = {
  tock: { id: "tock", name: "Tock", room: "deadlines", main: "#F6B23C", tint: "#FDF0D8", deep: "#704905", tintDark: "#443423", deepDark: "#F8BF5D", motto: "I'll ring first." },
  murmur: { id: "murmur", name: "Murmur", room: "chats", main: "#F58CA5", tint: "#FDE8ED", deep: "#8E1F3D", tintDark: "#432D38", deepDark: "#F8B0C1", motto: "Heard it. Kept it." },
  penny: { id: "penny", name: "Penny Pocket", room: "money", main: "#63C598", tint: "#E0F3EA", deep: "#215940", tintDark: "#263836", deepDark: "#8CD4B3", motto: "Every cent has a home." },
  mote: { id: "mote", name: "Mote", room: "ideas", main: "#9FA8F7", tint: "#ECEEFD", deep: "#2C3794", tintDark: "#323249", deepDark: "#BBC1F9", motto: "Saved for a someday." },
};

export const KEEPER_IDS: KeeperId[] = ["tock", "murmur", "penny", "mote"];

export const MUTED = { main: "#D6D4DB", mainDark: "#9C98A6", tint: "#F1F0F3", tintDark: "#3D3B43", deep: "#4A4653", deepDark: "#D6D4DB" } as const;

const ROOM_TO_KEEPER: Record<RoomKey, KeeperId> = { deadlines: "tock", chats: "murmur", money: "penny", ideas: "mote" };

export function keeperForRoom(room: RoomKey): KeeperId {
  return ROOM_TO_KEEPER[room];
}

export type KeeperColors = { main: string; tint: string; deep: string };

export function useKeeperColors(id: KeeperId, muted = false): KeeperColors {
  const isDark = useColorScheme() === "dark";
  if (muted) {
    return isDark
      ? { main: MUTED.mainDark, tint: MUTED.tintDark, deep: MUTED.deepDark }
      : { main: MUTED.main, tint: MUTED.tint, deep: MUTED.deep };
  }
  const k = KEEPERS[id];
  return isDark ? { main: k.main, tint: k.tintDark, deep: k.deepDark } : { main: k.main, tint: k.tint, deep: k.deep };
}

export const SHOT_ART = {
  ink: "#211D2B",
  white: "#FFFFFF",
  night: "#2B3046",
  sand: "#EFE4CF",
  clay: "#C8714A",
  leaf: "#5C8A5F",
  sky: "#D7E6F2",
  cream: "#FFF8EA",
  butter: "#F3D27A",
  paper2: "#F4F1EA",
} as const;

export function mix(a: string, b: string, amountA: number): string {
  const p = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const c = (x: number, y: number) => Math.round(x * amountA + y * (1 - amountA)).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}
