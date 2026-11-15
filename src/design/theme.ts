export const APP_NAME = "Psst";

export const colors = {
  paper: "#FAF6EE",
  paperDeep: "#F1EADC",
  ink: "#2B1D14",
  inkSoft: "#6E5D50",
  inkFaint: "#A89A8C",
  white: "#FFFFFF",
  sun: "#FDB92E",
  sunTint: "#FFF1CC",
  line: "#E6DCCB",
} as const;

export type RoomKey = "deadlines" | "chats" | "money" | "ideas";

export const ROOM_KEYS: RoomKey[] = ["deadlines", "chats", "money", "ideas"];

export const rooms: Record<RoomKey, { label: string; character: string; color: string; tint: string }> = {
  deadlines: { label: "Deadlines", character: "Psst", color: "#F59E0B", tint: "#FEF0D2" },
  chats: { label: "Chats", character: "Psst", color: "#EC6FA3", tint: "#FCE4EE" },
  money: { label: "Money", character: "Psst", color: "#2FA37A", tint: "#DDF2EA" },
  ideas: { label: "Ideas", character: "Psst", color: "#8B7CF6", tint: "#ECE9FE" },
};

export const UNSORTED_ROOM: RoomKey = "ideas";

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const fonts = {
  regular: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  heavy: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
  hand: "PatrickHand_400Regular",
} as const;

export const type = {
  display: { fontFamily: fonts.hand, fontSize: 42, lineHeight: 46, color: colors.ink },
  title: { fontFamily: fonts.hand, fontSize: 29, lineHeight: 33, color: colors.ink },
  heading: { fontFamily: fonts.hand, fontSize: 22, lineHeight: 26, color: colors.ink },
  say: { fontFamily: fonts.hand, fontSize: 19, lineHeight: 23, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.ink },
  bodyBold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  caption: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.inkSoft },
  label: { fontFamily: fonts.hand, fontSize: 16, lineHeight: 18, color: colors.ink },
} as const;

export const stickerShadow = "0px 3px 6px rgba(43, 29, 20, 0.18)";

export function tiltFor(seed: string | number, max = 3): number {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((Math.abs(h) % (max * 20 + 1)) / 10 - max);
}
