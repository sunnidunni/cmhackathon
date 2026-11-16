# Psst sound effects (original, synthesized, no license needed)

| File | Play when | Notes |
|---|---|---|
| tock-filed.m4a | a screenshot is filed into Deadlines (with `filed` reaction) | woody tick-tock |
| murmur-filed.m4a | filed into Chats | bubbly blip-blip |
| penny-filed.m4a | filed into Money | coin jingle |
| mote-filed.m4a | filed into Ideas | sparkle shimmer |
| boop.m4a | tap/boop a keeper | soft |
| pop.m4a | keeper reveal pop-in, card appears | short |
| confirm.m4a | confirm tap on an act / reminder set | two-tone up |
| sent.m4a | after Messages/Mail/Calendar returns success, order placed (demo) | whoosh |
| celebrate.m4a | reminder done, act done, claim "Paid €600" | arpeggio |

Rules: pair every sound with the existing haptic; respect the iPhone silent switch (expo-audio default `playsInSilentMode: false`, keep it); never more than one sound per 300 ms (reuse the keeper reaction queue); a Settings toggle "Sounds" (default on); never play on app launch or for the lock screen.
