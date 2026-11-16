# Keepers v2 (motion)

`<Keeper name state />`: the v2 keeper cast (Tock, Murmur, Penny Pocket, Mote) on react-native-svg + Reanimated 4. The art is generated: `keeperArt.ts` comes from `design/lanes/keepers-art-v2/src/build.mjs` in Drive, so don't edit it by hand.

```tsx
import { Keeper, KeeperAvatar } from "@/design/keepers-v2";

<Keeper name="tock" />                                     // rest, with irregular blinks
<Keeper name="penny" state="holding" />                    // lifts the screenshot into view
<Keeper name="mote" state="sleeping" />                    // empty room: slow breathe
<Keeper name="murmur" reaction="filed" reactionKey={id} /> // plays once each time reactionKey changes
<Keeper name="tock" onLine={setBubble} />                  // tap: wiggle + smile, hands you one line
const ref = useRef<KeeperHandle>(null); ref.current?.play("celebrate");
<KeeperAvatar name="mote" size={24} />                     // separately drawn face, blinks
```

States: `rest | holding | sleeping | muted`. Reactions: `filed | tap | celebrate | reveal`.

| Reaction | Motion | Use |
|---|---|---|
| filed | Tock hops, Murmur squishes, Penny jingles, Mote floats (each ~0.4–0.9 s) | a screenshot lands in that keeper's room |
| tap | ±4° wiggle from the feet + 900 ms smile + one line | the person taps a keeper |
| celebrate | two small hops + smile | an item is marked done |
| reveal | scale .6 → 1 with spring.keeper from the feet, then a smile | the import reveal (show `muted` first, then switch state to `rest` and play reveal) |

Rules, from Quod's discipline:
- Rest is the default. Blinks come at random 2.5–5.5 s gaps (180 ms closed), keepers never blink within 120 ms of each other, and Penny double-blinks more often (her clasp-knob eyes are her signature).
- Only one keeper reacts at a time. Reactions go through a shared queue and start at least 240 ms after the previous one ends.
- Mote's slow float is the only always-on idle. Sleeping breathes. Nothing else loops.
- Reduce Motion (`useReducedMotion`): no blinks, no idle, no transforms. A reaction becomes an instant 900 ms smile swap, and tap lines still arrive.
- Penny reacts to filing, never to an amount.

Tokens: `tokens.ts` (keeper-specific amplitudes and timings) builds on `src/design/motion.ts` (duration, easing, spring.keeper, blink). To see everything on a phone, mount `<KeepersDemo />` from `./KeepersDemo` on any screen.

Not in this cut yet: Tock's ticking hand, Murmur's bouncing "…" dots and Mote's bulb glow. They need the generator to split those parts into their own layers.
