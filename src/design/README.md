# Psst design system: hand-drawn sticker sheet

Everything lives in `src/design` and is imported from `@/design`. Live gallery: open the `/design` route (not linked from navigation). Copy layouts from its "Mock: Missed inbox" section.

## Tokens (`theme.ts`)

- `APP_NAME` = "Psst". The only place the name lives in code.
- `colors`: `paper` #FAF6EE (every screen background), `ink` #2B1D14 (text, outlines), `inkSoft` (secondary text), `sun` #FDB92E (primary action, icon, title underline), `white` (stickers, bubbles), `line`.
- `rooms[key]` for `deadlines | chats | money | ideas`: `{ label, character, color, tint }`. Tock #F59E0B, Murmur #EC6FA3, Penny Pocket #2FA37A, Wisp #8B7CF6. Unsorted uses `UNSORTED_ROOM` (ideas, Wisp).
- `spacing` (xxs 2 … xxxl 48), `radii` (sm 8, md 14, lg 20, xl 28, pill).
- `type`: `display`, `title`, `heading`, `say` (speech bubbles), `label` are Patrick Hand; `body`, `bodyBold`, `caption` stay Nunito so dates and amounts read cleanly. `fonts.hand` is the handwritten family.
- `tiltFor(id)` gives a stable -3°…3° tilt; `seedFrom(...)` gives a stable seed for anything wobbly.
- Fonts load in the root layout with `useStickerFonts()`; text falls back to the system font until they arrive.

## How the hand-drawn look works

Outlines are marker strokes computed once from a seed (never per frame): a wobbly line that overshoots where it closes, plus a thinner partial echo stroke. Fills are offset from the outline so color spills past or stops short of the line; characters also get a few scribble strokes. Frames are seeded by their size (and label or room), so a component looks the same on every render.

## Components

```tsx
import { Sticker, SpeechBubble, Character, ScreenshotSticker, RoomBadge, Button, ScreenHeader, SketchFrame, Doodle, tiltFor } from "@/design";

<Sticker tilt={-2}><Image … /></Sticker>                       // white die-cut sticker, marker outline, shadow
<SpeechBubble tail="bottom-left">Rent's due Friday.</SpeechBubble> // tail: bottom-left | bottom-right | left
<Character room="money" size={64} expression="happy" />          // neutral | happy; outline={false} drops the die-cut
<ScreenshotSticker uri={shot.url} room="chats" width={100} tilt={tiltFor(shot._id)} />
<RoomBadge room="deadlines" count={3} />
<Button label="Remind me tomorrow" onPress={…} />                 // variant="secondary" for the white one
<ScreenHeader title="Missed" subtitle="4 you forgot" room="ideas" line="Psst. A few still matter." right={…} />
<SketchFrame fill={colors.paper} radius={radii.xl} seed="card">…</SketchFrame> // any hand-drawn box or card
<Doodle kind="star" size={30} color={colors.sun} />               // star | arrow | swirl | underline (with width)
```

## Rules that keep a screen on-style

1. Paper background, ink text. No pure black, no grey UI chrome, no system blue, no straight `borderWidth` boxes: draw boxes with `SketchFrame`. Color comes only from room colors and `sun`.
2. Anything the user collected (screenshots, characters) is a sticker with a small tilt from `tiltFor`. Controls and text never tilt.
3. Characters speak only in a `SpeechBubble`, one short warm line, at most about 60 characters. One speaking character per screen region. A doodle or two per screen at most.
4. Handwriting is for titles, headings, bubbles, buttons and labels; extracted data (dates, amounts, names from screenshots) uses `type.body` or `type.caption`. Never set a raw `fontSize` or `fontFamily` in a screen. Inside `SketchFrame`, wrap a bare `<Svg>` child in a `<View>` so it paints above the frame on web.
