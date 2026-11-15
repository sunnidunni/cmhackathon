import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@convex-dev/auth/react";

// Keeps the anonymous session in the iOS keychain so the same user comes back on every launch.
export const secureStorage: TokenStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};
