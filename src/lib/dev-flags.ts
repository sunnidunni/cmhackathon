// Dev-only switches, set at bundle time through EXPO_PUBLIC_* env vars. Off unless set to "1".
// DEV_TOOLS shows the dev panel (photo-source toggle and library diagnostics) on the library screen.
export const DEV_TOOLS = process.env.EXPO_PUBLIC_DEV_TOOLS === "1";
// READ_ALL_PHOTOS makes import read every photo instead of only the Screenshots album.
// Needed on simulators, where saved images never get the screenshot subtype.
export const READ_ALL_PHOTOS_DEFAULT = process.env.EXPO_PUBLIC_READ_ALL_PHOTOS === "1";
