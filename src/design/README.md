# Psst design system: sticker sheet

Everything lives in `src/design` and is imported from `@/design`. Live gallery: open the `/design` route (not linked from navigation). Copy layouts from its "Mock: Missed inbox" section.

## Tokens (`theme.ts`)

- `APP_NAME` = "Psst". The only place the name lives in code.
- `colors`: `paper` #FAF6EE (every screen background), `ink` #2B1D14 (text, outlines), `inkSoft` (secondary text), `sun` #FDB92E (primary action, icon), `white` (stickers, bubbles), `line`.
- `rooms[key]` for `deadlines | chats | money | ideas`: `{ label, character, color, tint }`. Tock #F59E0B, Murmur #EC6FA3, Penny Pocket #2FA37A, Wisp #8B7CF6. Unsorted uses `UNSORTED_ROOM` (ideas, Wisp).
- `spacing` (xxs 2 … xxxl 48), `radii` (sm 8, md 14, lg 20, xl 28, pill), `type` (display, title, heading, body, bodyBold, caption, label), `fonts` (Nunito 600–900).
- `tiltFor(id)` gives a stable -3°…3° tilt per item, so stickers don't wobble on re-render.
- Fonts load in the root layout with `useStickerFonts()`; text falls back to the system font until Nunito arrives.

## Components

```tsx
import { Sticker, SpeechBubble, Character, ScreenshotSticker, RoomBadge, Button, ScreenHeader, tiltFor } from "@/design";

<Sticker tilt={-2}><Image … /></Sticker>                       // die-cut white border, outline, shadow
<SpeechBubble tail="bottom-left">Rent's due Friday.</SpeechBubble> // tail: bottom-left | bottom-right | left
<Character room="money" size={64} expression="happy" />          // neutral | happy; outline={false} drops the die-cut
<ScreenshotSticker uri={shot.url} room="chats" width={100} tilt={tiltFor(shot._id)} />
<RoomBadge room="deadlines" count={3} />
<Button label="Remind me tomorrow" onPress={…} />                 // variant="secondary" for the white one
<ScreenHeader title="Missed" subtitle="4 you forgot" room="ideas" line="Psst. A few still matter." right={…} />
```

## Rules that keep a screen on-style

1. Paper background, ink text. No pure black, no grey UI chrome, no system blue. Color comes only from room colors and `sun`.
2. Anything the user collected (screenshots, characters) is a sticker: white border, ink outline, small tilt from `tiltFor`. Controls and text never tilt.
3. Characters speak only in a `SpeechBubble`, in one short warm line, at most about 60 characters. One speaking character per screen region.
4. Use the type scale and Nunito weights from `type`; never set a raw `fontSize` or `fontFamily` in a screen.
