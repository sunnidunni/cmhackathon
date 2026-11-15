# Design upgrade brief: raise Rooms' UI/UX to Town-level quality

From Ryan's local design-research session. Apply this to Step 2 (MVP cut, screen map, DESIGN.md, clickable prototype) for direction B "Today's handful", no paywall. Ryan's words: use Town (town.com) as the main inspiration, and Quod (getquod.ai/brand) for process and character-system rules. "Help it learn to improve the designs much, much more."

The research was done hands-on: Town's full logged-in onboarding plus its marketing site (about 200 screenshots, 135 findings), and Quod's brand book plus its site (about 110 screenshots, 52 findings). Everything you need is written out below, because you can't open the screenshots. Take the *patterns*, never the art, names or copy. Town's characters and brand are off-limits to copy.

---

## 0. One fix first

Our ideas keeper is named **Wisp**. Town already has a mascot called **Wisp** (a cloud, used in its empty search state). Rename ours, e.g. Mote, Pip or Drift. Propose 3 names and pick one. Check the other names too (Tock, Murmur, Penny Pocket) and pick unusual ones.

---

## 1. Why Town feels so good (the 12 patterns to adopt)

1. **The assistant is a character you unwrap.**
   - Town's onboarding has a "Meet your Townie" step. It opens blurred, with a gold pill button "🎁 Reveal Townie" and a "For you" gift tile.
   - On reveal you get a name in the display font, a one-line personality ("Already solved it. Thanks!") and its own email address set in a handwriting font.
   - The whole panel re-themes to that character's color: hero background, selected border and **the primary button itself**.
   - **Rooms:**
     - After import, do a reveal moment for the keepers. Each room "opens" and its keeper pops in with its first line.
     - Each keeper owns a signature color, and that room's screens (header wash, chip, primary button) take it.
2. **Prove understanding before asking for more.**
   - Town builds "Here's what we know about [your photo] you." It's a structured profile written while you wait.
   - The wait is honest: "Stay here about 2 minutes, or keep going, I'll notify you." The button reads "Skip ahead" until the profile is ready, then "Continue" with "You can edit this later."
   - **Rooms:**
     - The import screen is this moment. Rooms fill live, each with the newest item and the keeper's line.
     - Show one surprising true fact ("Penny found 3 receipts from this month"). The user can leave and keep browsing while the rest are read.
3. **Personalized, not generic.**
   - Town read the inbox, decided the user was a student, and inserted a "For university students…" section of routines, switched on.
   - **Rooms:** the first handful card and the "wrapped" stretch card should name something specific from *their* screenshots.
4. **Every automation names what it will never do.**
   - Town's lines: "It preps the request, sending it stays your call." "Drafts wait for you to send, and it's quiet on clean days."
   - **Rooms:**
     - Each keeper's intro line includes its limit, e.g. "I'll remind you once. Never more than one ping a day."
     - Advertise "quiet on clean days" as a feature.
5. **Trust beside every ask.**
   - Town's step 1 underlines exactly one word: "Town **never** sends emails without your approval."
   - **Rooms:** the priming screen underlines one word, e.g. "We **only** read your Screenshots album." The privacy line sits right next to the Continue button, not in settings.
6. **The mascot sits inside sentences.**
   - "Meet your [character illustration] today." "Here's what we know about [user photo] you."
   - **Rooms:** headlines with a keeper face inline mid-sentence: "[Tock] found 2 things due this week." Do it at most once per screen.
7. **Drill in, don't pop up.**
   - In Town, settings gears push a detail page inside the same panel. The back label becomes "‹ Routines" and the CTA becomes "Done".
   - **Rooms:** Room → Detail → "Remind me" options all push within the stack. Use sheets only for quick choices (move-to).
8. **State shown as color.**
   - Town's routines that are off show grey, desaturated icons. Switching one on brings its color back.
   - **Rooms:** a handled or "Done" item fades its keeper tint to grey. Rooms with nothing new are slightly muted, and rooms with something new are full color.
9. **Defaults shown as values.**
   - Town's scheduling rows show the current value as a subtitle ("Weekdays · 9:00 AM – 5:00 PM"), so users can accept without opening them.
   - **Rooms:** the "Remind me" row shows "Thu 9:00 AM (day before)". Settings rows show the current value too.
10. **One filled button per screen.**
    - Town's pricing has only one solid CTA, with no "most popular" badge. Everything else is outlined or ghost.
    - **Rooms:** one ink, or keeper-colored, primary per screen. Secondary actions are outline or text.
11. **Examples with concrete numbers, in the assistant's voice.**
    - "I sorted 120 unread emails and pinned the four that need a reply."
    - **Rooms:** the keeper lines in the line bank should carry real counts and specifics via placeholders: "{n} receipts, one's a refund you never chased."
12. **Delight for the curious.**
    - Town's footer slides away to reveal movie credits listing about 40 mascot names. Its empty search shows a mascot saying "Not in Town yet." with two ways forward.
    - **Rooms:** every empty, error and no-match state is a keeper moment with a next action ("Couldn't find that. Maybe it's in Money?"). Optional easter egg: an "About" screen with keeper credits.

## 2. Town's visual system (tokens to emulate in spirit)

- **Type:**
  - A light slab-serif display face (weight about 84–95, tracking -0.02em) carries one big emotional headline per screen.
  - A grotesk does the UI, with weights tuned per size (405 body, 665 titles; tracking +0.02em at 14px, +0.03em at 10px).
  - A **handwriting face only for the character's own voice** (its email, captions, placeholders).
  - **Rooms:**
    - Keeper lines in a handwriting or marker face.
    - UI in one clean sans with 2 weights.
    - Headlines in one characterful display face (pick a free Google font).
- **Color:**
  - Off-white paper #FDFDFC and near-black ink #1C1B1B. Greys come from an alpha ladder of the ink, not separate grey hexes.
  - The color comes from the characters (one hue each, similar saturation).
- **Shape:**
  - Hairlines, not shadows.
  - Onboarding cards use a 16px radius with a soft fill and no border. The primary button is 8px, #262626.
  - Small icon tiles: a colored rounded square with a white glyph.
- **Motion:**
  - Durations 100/150/200/300ms, enter easing cubic-bezier(.16,1,.3,1). Hovers and presses change color only, with no bounce.
  - One orchestrated moment per flow: the reveal, or a crossfade between characters.
  - Everything gated by Reduce Motion.
- **Copy:**
  - Headlines are full sentences ending in a period.
  - Reversibility is stated up front ("you can change these later").
  - The riskiest option is off by default.

## 3. Quod's process and character rules (the supplement)

Quod is one designer plus AI tools. Its brand book is the best small character system we found. Copy these rules.

**A. Keeper construction spec.** Write this into DESIGN.md before drawing keeper #2. Our keepers are vector shapes in code, so this is easy to enforce.
- One SVG viewBox for all keepers (e.g. 0 0 120 120), with feet or base on one ground line (e.g. y=108).
- One outline color (ink). Stroke widths per part: outline 3, inner parts 2.5, eyes 2.5, brows 2, eyelids 2 (scale to taste, but keep the ladder).
- **One eye size for all keepers.** Flat fills, no gradients, no shadows, no highlights in pupils.
- Each keeper gets one silhouette trick, one prop tied to its room and one motto of 8 words or fewer. For example, Tock: clock-face belly, holds a tiny pin, "Early is on time.". Penny Pocket: coin pouch, receipt roll. Murmur: big ears, finger on lips. The ideas keeper (renamed): jar of sparkles. These are suggestions; pick your own, but one each.
- Separately drawn **face-only avatars** (1:1) for chips, notifications and lists, with a 1px hairline ring so pale keepers show on white.
- Sticker look (if "Psst + sticker sheet" wins): a white die-cut border around the keeper at about 6–8% of its width, no drop shadow. Never put a texture pattern on the same screen as a speaking keeper.

**B. Expression and motion.**
- Rest face is deadpan or calm (half-lidded is fine), "never scared or angry". Exception: Tock is "anxious but helpful" per spec, so show it through brows only.
- Reactions change the **mouth (or brows) only**, then return to rest. Rest is more common than reaction.
- Blink at **irregular** intervals of 2.5–5.5s, about 180ms long. Use a random delay per keeper; a fixed interval looks like a screensaver.
- **Never start two keepers' reactions in the same frame.** Stagger them.
- `AccessibilityInfo.isReduceMotionEnabled` gives a still face. Reanimated or Animated on SVG props is fine; react-native-svg won't run SMIL.

**C. Color formula.**
- Each keeper has main, tint and deep shades.
  - **Main:** the chip and avatar fill.
  - **Tint:** the room header wash, around 15–20% of main on white.
  - **Deep:** text on tint, darkened to at least 7:1 contrast.
- **Text on a keeper color is always ink, never white** (Quod measured white failing on every main, at 2.0–3.3:1).
- The rest of the UI is neutral: paper, white, ink and grey. As a page mix, about 70% neutral, 15% ink, 10% tints and 5% keeper main.
- Put these in a tokens file. No hex values outside it.

**D. Voice rules.**
- Keep a 10-row "Not this → This" table of real keeper lines, e.g. "You have 400 unsorted screenshots!" → "Found a few things you saved for later."
- Lock the nouns, one meaning each: room, keeper, screenshot, handful, reminder. Never "folder", "album" or "collection" in the UI.
- Answers in Ask are plain, with no jokes. Use two-tone: the answer in ink, then the source in grey ("· from a screenshot, 3 Oct").

**E. Process.**
- DESIGN.md has three parts: **Idea** (one paragraph, audience, voice), **Look** (tokens, type, keepers spec, motion) and **In use** (screen patterns, what stays and what changes, **rejected directions**).
- Record rejected directions (A "Rooms with a held item" and C "Ask first", plus the moods we don't pick), so no later thread re-pitches them.
- For keeper art: explore a 3x3 grid of options for keeper #1, lock the spec, then make the other three against it.
- Test the app name and icon in context: a 60pt iOS icon, a notification banner, a sticker and the share sheet.

## 4. Anti-patterns we saw (don't do these)

- **Placeholders shown as content.** Quod shows "0%" counters and empty windows until animation runs. Render real values first, then animate. Never show 0 on a count badge while loading; use a skeleton.
- **Characters vanishing on the important screens.** Quod drops its characters on detail pages and the 404. Keepers must appear on their room's detail and on every empty or error state.
- **Truncating the key info.** Town's phone layout cut "Your inbox, organized without the w…". Item titles max 5 words (the spec already says this); allow 2 lines; never ellipsize dates or amounts.
- **Auto-rotating content with no pause.**
- **Pale colors without an outline.**
- **Off-system colors creeping in.**
- **Two numbers that disagree.** The counts on Home, Room and the handful must come from one query.

## 5. Quality bar: self-review loop (do this before showing Ryan)

For every prototype screen, render it at 390×844 (iPhone), screenshot it, and score it 0–2 on each line below. Fix anything under 2, re-render, and repeat until every screen scores at least 20/24. Include the final scores table in your reply.

1. One clear job per screen; the headline says it in one sentence.
2. Exactly one filled primary button.
3. Keeper present where it helps (empty/loading/handful/room header), absent where it would block (Ask answers).
4. Keeper construction spec followed: same stroke ladder, eye size, ground line.
5. Room color formula followed; text on keeper color is ink; no stray hex.
6. Type: display for one headline, sans with 2 weights for UI, handwriting only for keeper voice.
7. Trust line next to every permission/automation ask; one underlined key word on the priming screen.
8. Defaults visible as values; risky actions off by default; reversibility stated.
9. Real content (demo screenshots: flyer with deadline, recipe, product page, receipt, chat), no lorem, no "0" placeholders.
10. Touch targets ≥44pt, 16pt side gutters, nothing touching screen edges except a deliberate keeper "peek" crop.
11. States designed: loading (skeleton), empty (keeper + next action), error (keeper + retry), partial photo access (gentle card).
12. Motion: one orchestrated moment per flow (import reveal), irregular blinks, staggered reactions, Reduce Motion fallback.

## 6. What to send back

- Updated DESIGN.md (Idea / Look / In use, keeper spec, tokens, voice table, rejected directions).
- The prototype link, with the reveal-after-import moment, the handful Home with themed cards, Room, Detail (drill-in), Ask (two-tone answer + source card) and the empty states.
- The self-review scores table, with a before/after note for the 3 biggest fixes.
- The 3 proposed names for the ideas keeper.
