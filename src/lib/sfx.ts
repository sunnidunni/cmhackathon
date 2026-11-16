import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as SecureStore from "expo-secure-store";
import { useCallback, useSyncExternalStore } from "react";
import { allowSound, parseSounds, SOUNDS_DEFAULT, type SfxName } from "./sfx-plan";

export { sfxForReaction, type SfxName } from "./sfx-plan";

const SOURCES: Record<SfxName, number> = {
  "tock-filed": require("../../assets/sfx/tock-filed.m4a"),
  "murmur-filed": require("../../assets/sfx/murmur-filed.m4a"),
  "penny-filed": require("../../assets/sfx/penny-filed.m4a"),
  "mote-filed": require("../../assets/sfx/mote-filed.m4a"),
  boop: require("../../assets/sfx/boop.m4a"),
  pop: require("../../assets/sfx/pop.m4a"),
  confirm: require("../../assets/sfx/confirm.m4a"),
  sent: require("../../assets/sfx/sent.m4a"),
  celebrate: require("../../assets/sfx/celebrate.m4a"),
};

// Whether keeper and confirmation sounds play. Kept on the device; on unless the person turns it off.
const SOUNDS_KEY = "psst.sounds";
let sounds: boolean | null = null;
let loading: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export function getSounds(): Promise<boolean> {
  if (sounds !== null) return Promise.resolve(sounds);
  loading ??= SecureStore.getItemAsync(SOUNDS_KEY)
    .then(parseSounds)
    .catch(() => SOUNDS_DEFAULT)
    .then((v) => {
      sounds ??= v;
      listeners.forEach((l) => l());
      return sounds;
    });
  return loading;
}

// Applies the change for this session at once. Resolves false when the device could not save it.
export async function setSounds(on: boolean): Promise<boolean> {
  sounds = on;
  listeners.forEach((l) => l());
  return SecureStore.setItemAsync(SOUNDS_KEY, on ? "1" : "0").then(
    () => true,
    () => false,
  );
}

export function useSounds() {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void getSounds();
      return () => listeners.delete(l);
    },
    () => sounds,
  );
  const setEnabled = useCallback((on: boolean) => setSounds(on), []);
  return { enabled: value ?? SOUNDS_DEFAULT, setEnabled };
}

let players: Partial<Record<SfxName, AudioPlayer>> | null = null;
let lastAt = 0;

// All nine sounds are loaded once. playsInSilentMode stays false, so the silent switch mutes them. Any failure leaves the app silent.
export function preloadSfx() {
  void getSounds();
  if (players) return;
  players = {};
  try {
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => undefined);
    for (const name of Object.keys(SOURCES) as SfxName[]) players[name] = createAudioPlayer(SOURCES[name]);
  } catch {
    players = {};
  }
}

export function play(name: SfxName) {
  try {
    if (!(sounds ?? SOUNDS_DEFAULT)) return;
    preloadSfx();
    const now = Date.now();
    if (!allowSound(lastAt, now)) return;
    const player = players?.[name];
    if (!player) return;
    lastAt = now;
    Promise.resolve(player.seekTo(0)).catch(() => undefined);
    player.play();
  } catch {
    // Audio is optional.
  }
}
