// Dev-only switches, set at bundle time through EXPO_PUBLIC_* env vars. Off unless set to "1".
// DEV_TOOLS turns on sample data (see FIXTURES) and the developer screens. Never set it for a build that goes to real users.
export const DEV_TOOLS = process.env.EXPO_PUBLIC_DEV_TOOLS === "1";
// READ_ALL_PHOTOS makes import read every photo instead of only the Screenshots album.
// Needed on simulators, where saved images never get the screenshot subtype.
export const READ_ALL_PHOTOS_DEFAULT = process.env.EXPO_PUBLIC_READ_ALL_PHOTOS === "1";
// Builds where the developer panel and design sheets exist: debug builds, and release builds made with DEV_TOOLS.
// An App Store build is neither, so it has no way into them.
export const DEV_BUILD = DEV_TOOLS || (typeof __DEV__ !== "undefined" && __DEV__);
