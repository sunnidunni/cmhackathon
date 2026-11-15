// Psst motion tokens. PROPOSED for src/design/motion.ts (the motion lane does not touch src/).
// Same values as MT in motion-prototype.html. No duration, easing or spring outside this file.
// Builds on DESIGN.md 2.5: 100/150/200/300 ms and enter easing cubic-bezier(.16,1,.3,1) stay the UI ladder.
// "stage" and "develop" are the only additions. They are reserved for the orchestrated moments.

import { Easing, ReduceMotion, type WithSpringConfig, type WithTimingConfig } from "react-native-reanimated";

export const duration = {
  instant: 100,  // press feedback, label swap out
  quick: 150,    // fades, crossfades, menu in, ALL Reduce Motion fallbacks
  base: 200,     // text rise, button fill, toast out, card exit
  gentle: 300,   // layout moves, collapses, wash wipe, source card
  stage: 520,    // a screenshot's flight into its room, and the minimum gap between keeper reveals
  develop: 700,  // redraw result "develops" from blur
  blink: 180,    // 70 close + 40 hold + 70 open
  reaction: 900, // a keeper's smile, then back to rest
  undo: 6000,    // Undo window on toasts. Paused while touched; stays until dismissed under VoiceOver
} as const;

export const easing = {
  out: Easing.bezier(0.16, 1, 0.3, 1),   // everything that enters or settles
  in: Easing.bezier(0.7, 0, 0.84, 0),    // everything that leaves
  inOut: Easing.bezier(0.65, 0, 0.35, 1),// things that travel from A to B (flights, collapses)
  stamp: Easing.bezier(0.55, 0, 1, 0.45),// accelerates into impact. The share stamp only
  linear: Easing.linear,                 // drains, shimmers, finger-tracking
} as const;

// Physics mode (stiffness/damping/mass). damping = 2 * dampingRatio * sqrt(stiffness * mass).
// UI never overshoots. Only a keeper landing may overshoot, once.
export const spring = {
  ui:     { stiffness: 380, damping: 39.0, mass: 1 }, // ζ 1.00, settles ~415 ms, 0% overshoot. Toasts, zoom, toggles
  lens:   { stiffness: 320, damping: 29.3, mass: 1 }, // ζ 0.82, ~435 ms, 1.1%. Custom tab lens only (NativeTabs does its own)
  keeper: { stiffness: 420, damping: 29.5, mass: 1 }, // ζ 0.72, ~360 ms, 3.8%. Keeper pop on reveal / share card
  sheet:  { stiffness: 260, damping: 32.2, mass: 1 }, // ζ 1.00, ~500 ms. Custom sheets / full-screen card rise
} satisfies Record<string, WithSpringConfig>;

export const stagger = {
  reaction: 240, // min gap between two keepers' reaction STARTS (never the same frame)
  reveal: 520,   // min gap between two keeper reveals during import
  group: 180,    // keepers popping in a line (share card)
  list: 40,      // rows entering together
} as const;

export const distance = { nudge: 6, lift: 12, slide: 24 } as const; // pt

export const blink = {
  gapMin: 2500, gapMax: 5500, // per keeper, uniform random, re-rolled after every blink
  close: 70, hold: 40, open: 70,
  doubleChance: 1 / 7, doubleGap: 120,
  crossKeeperMin: 120, // two keepers never start a blink within 120 ms of each other
} as const;

export const stream = { wordFade: 120 } as const; // words appear when the server sends them. Never paced by a timer

// Haptics (expo-haptics). One per user action at most; none for things the app does on its own except the stamp.
export const haptic = {
  keeperReveal: "impactLight",      // each reveal during import (max 4)
  success: "notificationSuccess",   // reminder set, import done, redraw done
  dismiss: "impactLight",           // handful dismiss, archive, undo
  select: "selection",              // tab change, snooze option, menu open
  stamp: "impactMedium",            // share card stamp lands
} as const;

// Helpers
export const timing = (ms: number, ease: keyof typeof easing = "out"): WithTimingConfig => ({
  duration: ms, easing: easing[ease], reduceMotion: ReduceMotion.System,
});
// Reduce Motion: movement becomes a quick crossfade. Colour changes, haptics and stagger timing stay.
export const rm = { fade: { duration: duration.quick, easing: easing.out } } as const;
