import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@convex-dev/auth/react";

// Keeps the anonymous session in the iOS keychain so the same user comes back on every launch.
// If the keychain fails (for example an unsigned simulator build has no keychain entitlement),
// the session falls back to memory for this launch instead of hanging sign-in, and the error is kept
// in storageError so the UI can show it.
const memory = new Map<string, string>();
export let storageError: string | null = null;

function fail(e: unknown) {
  storageError = e instanceof Error ? e.message : String(e);
}

export const secureStorage: TokenStorage = {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      fail(e);
      return memory.get(key) ?? null;
    }
  },
  async setItem(key, value) {
    memory.set(key, value);
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      fail(e);
    }
  },
  async removeItem(key) {
    memory.delete(key);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      fail(e);
    }
  },
};
