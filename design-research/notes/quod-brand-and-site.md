# getquod.ai: UI/UX and brand teardown (for Rooms)

Captured 2026-11-15 with a logged-out headless Chrome at 1440x813 and 390x844 (MOBILE=1). Screenshots are in `~/quod-ux/shots/q-NN-*.jpg` (66 files).
Pages covered: `/brand` (brand book, 14 chapters), `/` (home), `/cases`, `/cases/customer-support`, `/logo-fonts` (an unlisted preview), a 404, the "Book a call" modal and the mobile menu. Nav and footer only lead to home anchors, `/cases`, `/privacy` and mailto, so the site has no separate pricing, docs or waitlist pages. Pricing is a home section, and "Book a call" is the waitlist modal (`data-waitlist`). I did not submit it.

**Verdict first:** the brand book is better than the website. It is one of the best small-brand character systems I have seen. It covers line widths per part, a shared canvas and ground line, a blink and smile spec, a separate avatar drawing per character and a contrast table. The marketing site follows about 80% of it, then breaks its own rules in visible ways: a second font weight, off-book tints, an old-brand email domain, numbers that disagree, a default 404, and characters that disappear on the case pages. For Rooms, copy the character system. Do not copy the B2B site.

Tech: Astro (`/_astro/*.css`, nearly zero JS, 9 inline scripts, DCL 56 ms, 21 requests on home). Self-hosted Geist Variable and Geist Mono Variable. Inter Variable is declared as `--font-app` but never loads. `robots: noindex` is set on /brand. There is a print stylesheet and a `prefers-reduced-motion` query, and `lang=en`.

---

## 1. Brand system (extracted)

### Idea and voice
- **Name:** from *quod erat demonstrandum*: "Our agents take a task to the result, to the Q.E.D."
- **Pyramid** (q-02), bottom up: Trust (10+ yrs ML, used in own group), Attributes (Cloud, Durable, Real time, Any model), Benefit (control panel), Emotion ("I keep in step with the times. I use AI."), Values (Powerful for pros, Simple for everyone, Set it once), Character ("A techno-optimist. No scaremongering."), Core ("Proactive AI employees that get business tasks done"). **Each level names the exact site section that carries it** ("On the site: The hero title" links to `/#top`).
- **Audience:** companies of 50 or more people, C-level buyer, never FOMO.
- **Voice rules** (q-03): "Say what it takes, not what goes wrong", "Plain words, one idea per sentence", "Only what we can show: a number has a source, a plan is not a promise." A struck-through Not this / This table uses real edits from the home page dated 3 Nov 2026.
- **Writing rules:** sentence case with no full stop in headings, digits for quantities, a source for every number, no promises of revenue or hours saved, "Quod" in sentences and "quod" only in the logo.
- **Glossary, "four words, one meaning each":** agent (does the work), task (what you give), automation (a task on a schedule), process (how the company works).

### Logo (q-04 to q-06, q-32)
- The wordmark is "quod" in **Modulord Regular** (by Artem Grigorev), lowercase, built from square modules. One module equals the stem width and the q's tail square. The word is 6 modules high (1 ascender, 4 x-height, 1 tail). The letter gap is 1/3 module.
- Clear space is 2 modules on every side. Minimum size is 60 px on screen or 20 mm in print; below that, use the icon.
- **Icon:** the q alone in a rounded square, radius 22% of the side, q at 56% of the height. Variants: white on ink (main), ink on white, ink on a character colour, and a circle avatar.
- One colour only: ink on light, white on dark.
- **Motion:** an 8 s loop in three acts: blocks, then cuts ("each one is gone in an instant. Nothing fades"), then the d stem grows and the q's corner falls one module to become the tail. Used for video, loading and the first second of the product. Built with 21 `@keyframes` (`lm0`…`lm15`, `lm-corner`, `lm-rise`, `lm-fall`).
- **Don'ts** (collapsed in a `<details>` by default): stretch, rotate, gradient, outline, shadow or glow, change letter spacing, retype in another font, busy background.

### Colour (q-07 to q-09)
| Base | Hex | Role |
|---|---|---|
| Ink | #0A0A0A | text, logo, dark buttons |
| Dark | #161616 | dark panels and bands |
| Grey | #6B6B6B | notes, second lines (5.1:1 on paper) |
| Heading grey | #7A7A7A | second half of headings of 24 px and up (4.1:1, large text only) |
| Line | #E7E7E7 (ink at 8%) | borders |
| Paper | #FAFAFA | page |
| White | #FFFFFF | cards |

| Character | Main | Tint | Deep |
|---|---|---|---|
| Blue (main agent) | #48AEF8 | #DCEBF7 | #1D5A85 |
| Red (Finance) | #E16960 | #FBE3E0 | #7E3731 |
| Purple (Support) | #B190FA | #EBE5F6 | #4F3D7A |
| Cream (Marketing) | #FFF3D8 | #FEF8EA | #654C00 |
| Green (Operations) | #7DCA36 | #E1F2D6 | #385B1B |
| Yellow (Analytics) | #FFDF35 | #FFF5C4 | #5D4F02 |

Helpers: Pink #F774A4 (small accents), Blue for text #2456D6 (key figures), Character ink #010303 (outlines, "do not change it").
Mix per page: 70% paper and white, 15% ink and dark, 10% tints, 5% character colour. Rule: **text on a character colour is always ink.** A WCAG table shows white fails on every main colour (2.0–3.3).

### Type (q-10 to q-13)
- **Geist, Regular (400) only.** Geist Mono for labels of 14 px or less. Modulord only for the logo, section numbers, steps and one key figure ("never a word"). Its + and % are drawn from the module.
- Scale (size / line height · tracking · phone size): Display 64/64 · −5% · 34; Number 64/64 · −5% · 52; H1 56/62 · −4% · 40; H2 44/48 · −4% · 30; H3 24/30 · −2%; Title 20/28 · −1%; Lead 18/25 · −1%; Body 16/24 · 0; Small 14/19 · +1%; Tag (mono) 13/18; Label (mono caps) 12/16 · +6%.
- Rules: one weight; **two tones** (a heading starts in ink and ends in grey, and the ink part holds the claim); tracking goes from 0 at 16 px to −5% at 64 px; sentence case; about 70 characters per line.

### Pattern (q-14 to q-16)
- "Grid": a sheet of 12 px cells (8 px on phone) in 32x32 tiles. About 1 cell in 20 is marked in ink at 7% (white at 14% on dark), and about 1 in 100 is a "strong" cell in ink or a character colour. Marked cells may touch at a corner "like the q and its tail".
- Motion: marked cells come in within 1.2 s, strong cells last, then one cell moves one step about once a second. Fully still under reduced motion.
- Rules: **never on the same screen as characters**, never behind running text, hard edge with no fade, plain cells only on the site (behind the rollout chart). "If the pattern is the first thing you see, there is too much of it."

### Characters (q-17 to q-22). The part that matters most for Rooms
- **Why** (q-17): "A face for the agent", "One role, one character", "A counterweight to the serious part", then "And the short answer: we like them."
- **Cast:** six fluffy monsters, each with one body colour, **one distinguishing anatomy trait**, **one prop** and **a one-line motto**:
  - Blue: two horns, pink lips, book. "Takes any task, and brings in the right agent."
  - Red: yellow horns, long arms, scarf. "Keeps a cool head at month end."
  - Purple: round and fluffy, mug. "Knows the answer, or where to find it."
  - Cream: pink antennae and arms, megaphone. "Tells everyone what is new."
  - Green: three eyes, clipboard. "Three eyes on every checklist."
  - Yellow: one eye, five legs, monocle. "Looks at the numbers until they add up."
- **Construction:** one canvas of 1216x1024 for all six, feet on one ground line (q-21). Line widths on a 1024 canvas: outline 12, parts 11, eyes 10, brows and fur 9, eyelids 8. One ink (#010303), flat fills, fur strokes in a darker shade of the body, solid pupils with no highlight.
- **Expression:** base pose has half-closed eyes, "calm, never scared or angry". A smile is "small and calm, only the mouth changes". Characters without a mouth get one short curved line (q-20).
- **Life** (q-19): mostly still. A blink is a lid sliding down in under 0.2 s. A smile of about 3 s comes now and then, and **in a group the smile passes from one character to the next; two never start together.** Implementation (from `blue-idle.svg`, 22 KB): CSS `.lid` translateY on a **31.41 s** cycle with 7 blinks at irregular offsets (6.4%, 20.6%, 37.5%, 46%, 60.2%, 73%, 85.2%, which gives gaps of 2.7–5.3 s), plus an SMIL `<animate attributeName="d">` mouth morph on a **62 s** loop. Under `prefers-reduced-motion` the animated mouth `.mm` swaps for a static `.ms`. It is one self-contained SVG that also works as a still image.
- **Group rules:** stand close, each overlapping the next by a different amount, props in front of the neighbour, panel behind always neutral ("the character is the colour"). No shadows, gradients or glow. Never stretch, recolour, rotate or crop, except the single allowed crop: a portrait from the chest up.
- **Avatars** (q-22): a **separately drawn** face-only avatar on the body colour, not cut from the big drawing. "All faces have one eye size, so a list of agents looks even", except Yellow's single big eye.
- **Files:** each character ships as clean, with prop, smile, blink, idle (blink and smile) and avatar SVGs.

### Icons, panels, corners (q-23, q-24)
- Iconoteka: one weight (Regular stroke), ink or deep-on-tint square, 20–24 px, never under 16.
- Panels: "Blue grain", "Dark grain", "Sky to lilac", "Steel to blue" (soft gradient plus grain), "Flat dark", "Neutral".
- **Radius by role, not by size:** panel 24, block 16, tile 12, tag 8, pill 999, circle. Nested blocks follow outer minus padding ("the two corners have one centre"). Same values on phone.
- Product screens are real UI with sample data and a caption saying so. No stock photos. AI images are for mockups only and must be labelled "AI image".

### CSS tokens actually in `:root`
`--bg #fafafa --surface #fff --ink #0a0a0a --muted #6b6b6b --dark #161616 --line #0a0a0a14 --sky #45b0ff --ok #2f9e44 --err #e03131 --warn #f59f00 --lock #f76707 --ease cubic-bezier(.22,.8,.24,1) --r-panel 24 --r-block 16 --r-tile 12 --r-tag 8 --container 1176 --gutter 32 --shadow-btn 0 0 0 1px ring + 2 soft drops --shadow-win … 0 12px 32px -8px #1e3c5a24`, plus off-book tints `--pal-sage #e3ece6 --pal-sand #f3ebde --pal-steel #e4e9ee --pal-lilac #e6e4ef`.

---

## 2. /brand: findings

1. **What:** each pyramid level carries an "On the site: …" link to the exact section that expresses it (q-02). **Verdict:** good. **Why:** strategy is tied to pixels, so nobody can write a headline that floats free of the positioning. **Lesson:** the Rooms brand doc should map each value to a screen: "Funny but useful: the reaction line under every filed screenshot", "Never nags: the 'you forgot you had this' card".

2. **What:** the voice chapter uses real before/after edits from the live page, struck through and dated (q-03). **Verdict:** good. **Why:** concrete diffs teach tone faster than adjectives. **Lesson:** keep a 10-row "Not this / This" table of real character lines, e.g. "You have 400 unsorted screenshots!" → "Found a few things you saved for later".

3. **What:** the glossary "Four words, one meaning each" (agent, task, automation, process). **Verdict:** good. **Why:** it stops synonym drift that confuses users. **Lesson:** fix the Rooms nouns now: *room*, *keeper* (or character), *screenshot*, *nudge*. One meaning each, and never "folder", "album" or "collection".

4. **What:** every character has one anatomy hook (3 eyes, 1 eye and 5 legs, antennae, horns), one prop and a 5–8 word motto (q-18, q-19). **Verdict:** good. **Why:** a silhouette plus one prop is recognisable at 24 px and gives an instant job metaphor. **Lesson:** every room keeper gets one body trait, one prop tied to the room's content (a receipts keeper holds a till roll, a recipes keeper a spoon) and a motto under 8 words.

5. **What:** names are just colours: "Blue", "Red", "Cream". **Verdict:** bad. **Why:** "Blue" is not a character you bond with. The motto does all the personality work, and colour names collide with the colour tokens. **Lesson:** give Rooms keepers real proper names (short, two syllables), and keep the colour as a token name only.

6. **What:** a construction spec with a shared 1216x1024 canvas, one ground line and stroke widths per part, 12/11/10/9/8 px (q-21). **Verdict:** good, and the best thing on the site. **Why:** this is what makes six drawings read as one family and lets a new character be added by anyone. **Lesson:** before drawing keeper #2, write this table: canvas, ground line, outline width, inner-line width, eye size, fur or texture rule. Every new room character must pass it.

7. **What:** the base expression is half-closed eyes, "calm, never scared or angry", and the smile is small and comes and goes (q-20). **Verdict:** good. **Why:** a deadpan base makes the occasional smile land and suits dry humour. A grinning base would wear out. **Lesson:** Rooms keepers should rest at deadpan, deliver their funny line with a micro-change (mouth or eyebrow only) and return to rest. Reaction should be rarer than rest.

8. **What:** idle animation as a self-contained SVG with irregular blink intervals over a 31.41 s loop and a 62 s smile loop, with a reduced-motion swap. In a group the smiles are staggered. **Verdict:** good. **Why:** irregular timing reads as alive, while even timing reads as a screensaver. Staggering stops a group of characters looking cloned. **Lesson:** in Expo, use Rive or Lottie with randomised blink delays of 2.5–5.5 s and a blink of about 180 ms. Never start two on-screen keepers' reactions in the same frame. Respect `AccessibilityInfo.isReduceMotionEnabled`. Note that react-native-svg does not run SMIL, so do not ship their approach as-is.

9. **What:** avatars are drawn separately, with one shared eye size across all faces (q-22). **Verdict:** good. **Why:** a downscaled full body becomes mush at 32 px, and equal eyes make a list feel even. **Lesson:** the room list and notifications need purpose-drawn 1:1 face avatars with one eye size. Do not crop the hero art.

10. **What:** the Cream avatar is #FFF3D8 on a white card (contrast 1.1:1) and nearly vanishes, with no outline ring (q-22, q-08). **Verdict:** bad. **Why:** a pale character colour fails as a filled circle on white surfaces. **Lesson:** either give every Rooms keeper a mid-value body colour or give avatars a 1 px ink or hairline ring. Test each keeper colour on white and on the dark surface.

11. **What:** colour comes only from the characters; the UI is black, white and grey, with a 70/15/10/5 mix (q-07, q-09). **Verdict:** good. **Why:** a neutral chrome makes the characters the brand. **Lesson:** Rooms chrome stays neutral, and each room inherits its keeper's main, tint and deep colours (tag chip, room header wash, deep text). This gives colour-coded state for free.

12. **What:** the formula of main, tint and deep per character, plus a "Deep on tint" preview tile. **Verdict:** good. **Why:** one recipe means a seventh room colour is generated, not invented. **Lesson:** define the Rooms formula as a rule (tint = main at about 18% on white, deep = main darkened to 7:1 or better on tint) and generate tokens for every keeper.

13. **What:** the Cream row breaks its own grid: the "Deep on tint" slot is replaced by Pink #F774A4 (q-08). **Verdict:** bad. **Why:** it smuggles a seventh colour into a six-set table and makes Cream look incomplete. **Lesson:** keep every palette row the same shape and give accent colours their own row.

14. **What:** a contrast table where each failing "White 2.4: too low" is rendered in white on the colour (q-09). **Verdict:** ok. **Why:** the demonstration is clear, but the failing text itself is unreadable. **Lesson:** the rule "text on a keeper colour is always ink" transfers directly to Rooms. Bake it into the component, not a doc.

15. **What:** the type rule "One family, one weight. Size and tone make the order." Computed audit: 717 text nodes at 400, **117 at 500** (swatch names "Ink", "Dark", the files labels) and 1 at 700. H3 renders at 22 px, not the specified 24. Sidebar group labels are `<h2>` at 11 px, not the 12 px label spec. **Verdict:** bad. **Why:** the book breaks its own headline rule on the same page, which teaches readers the rules are optional. **Lesson:** if Rooms claims one weight, lint it. Simpler: allow two weights (400 and 600), because one weight on a small phone screen loses hierarchy.

16. **What:** two-tone headings, with the claim in ink and the continuation in #7A7A7A (q-02, q-10). **Verdict:** good. **Why:** hierarchy without bold, and it is easy to scan. #7A7A7A is 4.1:1, allowed only at 24 px and up, which the book states. **Lesson:** use it in Rooms answers: "Your wifi password is **K9-dune** · from a screenshot on 3 Oct" with the source in grey.

17. **What:** the pattern and the characters may never share a screen. **Verdict:** good. **Why:** two expressive systems at once fight, so you pick a lead per screen. **Lesson:** if Rooms uses a "sticker sheet" texture, ban it from any screen where a keeper is speaking.

18. **What:** sticker mockups (AI images) show a **pink elephant and an off-model purple** that are not in the cast, captioned "they still show three older drawings" (q-26). **Verdict:** bad, though honestly labelled. **Why:** off-model art in the brand book is exactly what a brand book exists to stop, and people will copy it. **Lesson:** never ship art of a retired keeper. The die-cut white sticker border in that mockup is the right look for "Psst + sticker sheet", though: a white 6–8% stroke around each keeper, with no drop shadow.

19. **What:** a radius scale by role (24/16/12/8/pill/circle) plus the "one centre" nesting rule (q-24). **Verdict:** good. **Why:** concentric corners are what make nested cards look machined. **Lesson:** Rooms radii are sheet 24, room card 16, screenshot thumb 12, chip 8, with inner radius = outer − padding.

20. **What:** navigation through a sticky left table of contents with mono numbers and an active pill; on mobile it becomes a "Chapters" button (q-01, q-64). **Verdict:** good. **Why:** it gives orientation on a 32,642 px page. On mobile, though, the page is **53,235 px** and the swatches render about 180 px tall in two columns (q-65), which is a lot of scrolling for hex codes. **Verdict on mobile:** ok.

21. **What:** click-to-copy swatches with `aria-label="Copy Blue main, #48AEF8"`, `cursor: copy` and a tiny "Copied" chip top-right (q-33). There is no `aria-live` region (count 0). **Verdict:** ok. **Why:** the labels are good, but the confirmation is low contrast and silent to screen readers. **Lesson:** any Rooms "copied" or "saved" confirmation must be announced and visible near the finger, not in a corner.

22. **What:** the focus ring is `2px solid #45b0ff` with an offset (q-34). **Verdict:** ok. **Why:** it is visible, but #45B0FF on white is 2.36:1, under the 3:1 needed for non-text contrast, and it is invisible on the Blue swatch. **Lesson:** use an ink focus ring or a double ring (white plus ink).

23. **What:** the logo's don'ts are collapsed behind "Do not · Show" (q-32). **Verdict:** ok. **Why:** it keeps the page calm, but the most violated rules are the ones hidden. **Lesson:** show don'ts open by default.

24. **What:** "What stays" (name, logo, characters, colour and type, voice) versus "Changes when it needs to" (headlines, order, examples) (q-29). **Verdict:** good. **Why:** it lets marketing iterate without rebranding. **Lesson:** for a hackathon app, write the same two lists today so the pivots after the hackathon do not touch the keepers.

25. **What:** /logo-fonts tests four wordmark candidates in context: nav, dark, app icon, business card, poster, stickers and badge, with sideways carousels (q-58). **Verdict:** good. **Why:** wordmarks only fail in context, at 16 px or on a sticker. **Lesson:** run every Rooms name candidate (Psst and others) through the same strip: the iOS home-screen icon at 60 pt, a notification banner, the sticker and the share sheet.

26. **What:** the ground shadow under each standing character on the cast cards (q-18) versus the rule "No shadows, no gradients, no glow" (q-21). **Verdict:** ok. **Why:** it is a contact shadow, arguably a grounding device rather than a style shadow, but the book never says so. **Lesson:** if Rooms keepers get a contact shadow, define it: one flat ellipse, ink at 6%, never blurred.

---

## 3. Home `/`: findings

27. **What:** the hero is five characters in a row with props, then the mono kicker "The AI agent platform for teams", then the H1 "Proactive AI employees **that get business tasks done**" in two tones, and the line "As capable as [ChatGPT logo] ChatGPT and [Claude logo] Claude…" (q-35, q-60). **Verdict:** good. **Why:** the characters say "friendly" before the copy says "enterprise". Inline logos inside a sentence borrow trust cheaply (the same move as Town's mascots-in-sentence). **Lesson:** in Rooms onboarding, put the keepers inline in the sentence: "[keeper] files it, [keeper] reminds you."

28. **What:** Red (Finance) is missing from the hero lineup, though the book's lineup has six. **Verdict:** ok. **Why:** probably a width choice, but it quietly demotes one character. **Lesson:** decide which keeper is the default face (Quod's is Blue) and keep the lineup rule fixed.

29. **What:** a single filled CTA: "Book a call" is the ink pill, and "See how it works" / "Email us" are white pills with a ring shadow (q-35). "Book a call" persists in the header on mobile (q-60). **Verdict:** good. **Why:** one dark button means one decision. **Lesson:** each Rooms screen gets one ink button. Everything else is a ghost or white pill.

30. **What:** the header is a floating white pill with `--shadow-btn` plus a drop shadow. Over dark bands it turns into a muddy grey gradient (q-41, q-48, q-51). **Verdict:** bad. **Why:** a translucent bar over a dark section loses its edge and fights the content. The book's flat, hairline aesthetic is contradicted by the shadow. **Lesson:** Rooms' top bar should be opaque paper with a hairline bottom border, or swap to a dark variant when over dark content.

31. **What:** the "01 / 02 / 03…" section numbers are set in Modulord, small, above each H2 (q-36, q-37). **Verdict:** good. **Why:** the logo font appears as a recurring micro-signature without ever setting a word. **Lesson:** use the Rooms wordmark letterform only for counts, such as the number of items in a room ("12") on the room tile. Never for words.

32. **What:** a key figure "+33%" in Modulord with Blue for text #2456D6, a source line in mono ("Atlassian AI Collaboration Index, 2025: 12,000 employees, 180 leaders") and a waffle of 100 dots with 3 filled (q-36). **Verdict:** good. **Why:** every number has a visible source beside it, which matches the book's rule. **Lesson:** every Rooms answer shows its source screenshot thumbnail beside the claim. That is your version of the citation.

33. **What:** the H2 icons sit inline at the end of headings (trend arrow, shield, database, building, scales). **Verdict:** ok. **Why:** they are a pleasant rhythm, but decorative and repeated six times. **Lesson:** use an inline keeper face at the end of a heading sparingly, at most once per screen.

34. **What:** team cards place the character in the card, then a mono "Support agent" chip with a colour square, then trigger chips with tiny avatars ("On new requests", "Every morning") (q-37, q-38). **Verdict:** good. **Why:** the character colour becomes the category key everywhere (avatar, square, chip). **Lesson:** room chips are the keeper's avatar plus a mono label: "[face] Receipts · 41".

35. **What:** the Support card has a 64 px headline on the left, with a large empty well under it while the right column holds the character and copy (q-37). **Verdict:** bad. **Why:** the zig-zag layout leaves dead space at desktop widths. **Lesson:** on phones, stack character, line and action tightly with no split columns.

36. **What:** product mockups animate in on scroll. At capture time the "New deals by region" window was an empty white frame (q-40), and the stats show "0+", "0%" and "0.0×" in the DOM until counted up. **Verdict:** bad. **Why:** a slow device or a quick scroll means empty frames and zeros. Zero is a wrong number in a "numbers have a source" brand. **Lesson:** render final values first and animate as an enhancement. Never show "0" as a placeholder in Rooms' count badges.

37. **What:** the proof band is a dark panel with 10+, 31%, 89% and 3.8×, each keyed by a character-colour square (q-43, q-62). **Verdict:** ok. **Why:** the colour key is nice, but the numbers are set in Geist, not Modulord as the book's "one key figure" rule suggests, and the before/after cards below use `--pal-sage` and `--pal-steel`, tints that are not in the book. **Lesson:** off-book tokens creep in within weeks. Generate room tints from the formula and fail the build on unknown hex.

38. **What:** the comparison table (Enterprise plans / Build it yourself / Quod) has the Quod column in tint #DCEBF7, with one dark cell highlighting "Our team with yours" (q-45). **Verdict:** good. **Why:** one emphasised cell tells you what the differentiator is. **Lesson:** in any Rooms comparison or settings, emphasise one row.

39. **What:** the security bento on a dark grain panel: GUARDRAILS shows an approval card "Default wants to save connector in Quod · Deny / Approve" with a yellow outline, and ACTIVITY AND SPEND shows a $2,299.83 / $3,000.00 bar (q-48). **Verdict:** good. **Why:** it shows control as real UI, not as claims. **Lesson:** Rooms' privacy screen should show the actual permission state ("Reading 1,204 screenshots · on device · never uploaded" if true) as UI.

40. **What:** the FAQ answers "Do you have security certifications? **Not yet.** We share security docs and a technical review on request." **Verdict:** good. **Why:** honest trust copy next to the ask, Town-level honesty. **Lesson:** Rooms' photo-access prompt should say what is read, where it goes and what is not done, in one line next to the button.

41. **What:** the "Book a 30-minute call" modal has the fields work email*, company*, website (optional), role*, team size (optional) and process*, with a real placeholder ("Every Monday, check last week's supplier invoices…") and a privacy line under the CTA (q-54). **Verdict:** good. **Why:** the example placeholder teaches what a good answer looks like. **Lesson:** the Rooms ask box should cycle real example questions as placeholders: "What's the wifi at Mia's?"

42. **What:** the contact email is **hello@usesigma.ai** in the nav mailto, the footer and every page. **Verdict:** bad. **Why:** a leftover old brand domain on a trust-led B2B site makes buyers ask "who is this really?". **Lesson:** grep for old names and domains before any launch (TestFlight, App Store metadata, support email).

43. **What:** the final CTA is a dark panel with "Keep your company in step with AI" and three characters cropped from the chest up at the bottom-right edge (q-51). **Verdict:** good. **Why:** it uses the single allowed crop, and the characters peek in, which feels warm. **Lesson:** the Rooms empty state or paywall can use the "peeking from the bottom edge" crop.

44. **What:** the footer is labelled "On this page" and lists home anchors, and it repeats on /cases and case pages, where those anchors are not "on this page" (q-56, q-57). **Verdict:** bad. **Why:** a copy-pasted label makes the site feel one-page and unfinished. **Lesson:** labels must be true on every screen they appear on.

## 4. `/cases` and `/cases/customer-support`

45. **What:** /cases leads with 597 people, **82%** of people who start keep using it and 5,055 scheduled runs. Home says **89%** of users are still active a month later (q-56 vs q-43). **Verdict:** bad. **Why:** two retention numbers with different definitions undercut the "a number has a source" rule. **Lesson:** one metric, one definition, everywhere. If Rooms says "you saved 41 things", every screen must agree.

46. **What:** the case pages have **no characters**, only a tiny Purple avatar in the mock chat. The grid on /cases is 5 cards in a 3-column layout with an empty sixth cell (q-56). **Verdict:** bad. **Why:** the characters vanish exactly where the product story gets concrete, and the layout feels unfinished. **Lesson:** the keeper should be present on the detail screen of its room. That is where the personality earns its keep.

47. **What:** "What changed: The agent takes the first line." and "In numbers: 88% of agent runs across the company are completed" (q-57). **Verdict:** bad. **Why:** the outcome is vague and the number is company-wide, not about this case. **Lesson:** a Rooms reminder must name the specific thing and why now ("Concert tickets for Fri · saved 3 weeks ago").

48. **What:** a breadcrumb, mono kicker, H1, lead, three pill facts ("Starts on a new request · Works in the back office · Brings in people") and a sample-data caption under the mock (q-57). **Verdict:** good. **Why:** it scans in about 3 s, and the honesty caption follows the book. **Lesson:** the room header should be the keeper, then the room name, then 2–3 fact pills (count, last added, next reminder).

## 5. Other states

49. **What:** the 404 is Astro's default unstyled "404: Not found · Path: /does-not-exist" (q-59). **Verdict:** bad. **Why:** a character brand that skips its easiest delight moment. **Lesson:** every Rooms error and empty state is a keeper moment: "Couldn't find that one. Maybe it's in Receipts?"

50. **What:** the mobile menu is a full-width white sheet under the header pill, with 20 px rows, hairline dividers and "Email us" as a pill. "Book a call" stays visible next to the X (q-63). **Verdict:** good. **Why:** the primary action is never hidden behind the burger. **Lesson:** keep "Ask" reachable on every Rooms screen, including inside sheets.

51. **What:** on mobile, the hero characters run edge to edge and Yellow's feet touch the viewport edge (q-60), and "1,300-" breaks across lines with a hyphen (q-62). **Verdict:** ok. **Why:** these are small polish misses: characters need the 16 px gutter, and numbers need `white-space: nowrap`. **Lesson:** never let a keeper touch the screen edge unless it is a deliberate peek crop. Keep numbers and their units together.

52. **What:** performance: Astro static, almost no JS, SVG characters, 21 requests, DCL 56 ms. Accessibility: `alt=""` on 103 of 135 brand images (decorative), named copy buttons, `aria-pressed` on the Clean/With prop toggle, reduced motion respected in CSS and inside the SVGs. **Verdict:** good. **Lesson:** keeper art as small vector or Rive files keeps the app light. Mark decorative keepers hidden from VoiceOver, but give the speaking keeper's line a real label.

---

## 6. Compared to Town

| Town strength | Quod |
|---|---|
| Tuned variable type with per-size weights | **Weaker.** Geist Variable is loaded but pinned to 400 "everywhere", and 117 nodes quietly use 500. Tracking is tuned per size (−5% at 64, 0 at 16), which is good, but weight does no work, so small UI loses hierarchy. |
| Strict token system | **Half.** The book's tokens are strict and documented, but the shipped CSS adds `--pal-sage/sand/steel/lilac`, `--sky #45b0ff` (the book's Blue is #48AEF8) and Open Color `--ok/err/warn` that the book never mentions. |
| Hairline, not shadow | **Mixed.** Cards use a hairline (`0 0 0 1px` ring) plus faint drops, and the header and windows add real shadows (`--shadow-win … 0 12px 32px -8px`). The book bans shadows on characters only. |
| Mascots inside sentences | **Missing.** Characters live in panels and lineups, never inline in a sentence. Third-party logos (ChatGPT, Claude) get the inline treatment instead. Town wins. |
| Honest trust copy beside every ask | **Equal on content.** "Not yet" on certifications, "Product screens on this page show sample data", "AI image" labels, a privacy line under the form. The only lapse is the usesigma.ai email. |
| One filled CTA | **Equal.** The ink "Book a call" pill is the only filled button, consistently. |
| Colour-coded state | **Good for identity, weak for state.** Colour means "which team or character", consistently. Status colours (ok, err, warn) come from an unrelated Open Color set and appear only inside product mocks (q-41 dots). |

Where Quod beats Town: the **written character system** (construction spec, expression rules, blink and smile timing, separate avatars, the "what stays" contract) and **a brand book that is itself a polished, navigable product**, including a Claude skill that generates on-brand decks.

---

## 7. Top 10 for Rooms

1. **Write the keeper construction spec before drawing keeper #2:** one canvas, one ground line, stroke widths per part, one eye size, flat fills, one ink colour. This is the single thing that makes Quod's six look like a family (q-21).
2. **One keeper, one hook:** a body trait, a prop tied to the room's content and a motto of 8 words or fewer. Give each a **real name** (Quod's "Blue/Red" is the weak spot) (q-18).
3. **Deadpan at rest, react with the mouth only, return to rest.** Keep the funny line short and the face change tiny, so the humour lands without the keeper turning into a clown (q-20).
4. **Alive, not looping:** randomised blinks every 2.5–5.5 s at about 180 ms, an occasional small smile, never two keepers reacting in the same frame, and a still frame under Reduce Motion. Build in Rive or Lottie, not SVG SMIL (finding 8).
5. **Neutral chrome, colour from keepers:** paper, white, ink and grey UI. Each room inherits its keeper's main, tint and deep colours by formula, and text on a keeper colour is always ink. Generate the tokens and reject unknown hex (findings 11, 12, 37).
6. **Purpose-drawn avatars** with one eye size and a hairline ring so pale keepers survive on white (findings 9, 10).
7. **Source beside every claim:** each answer shows the screenshot thumbnail and date in grey after the ink answer, using two-tone hierarchy (findings 16, 32).
8. **Sticker sheet, done strictly:** a white die-cut border, no drop shadow, never on the same screen as a texture pattern, and no off-model or retired art anywhere, including marketing (findings 17, 18).
9. **One ink button per screen, a radius by role (24/16/12/8, concentric) and a hairline-not-shadow top bar** that stays legible over any content (findings 19, 29, 30).
10. **Keepers own the hard moments:** the empty room, the 404 or no-match, the permission ask (with honest one-line trust copy) and the "you forgot you had this" nudge. Quod drops its characters on case pages and the 404, which is exactly where Rooms should lean in (findings 40, 46, 49).
