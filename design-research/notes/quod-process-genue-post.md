# genue's X post (Nov 11, 2026, 21.3K views, 681 bookmarks): how Quod's brand was made

## What the post claims
- Was a 40-person studio; now designs alone, earns more. Replaces a 3–5 person team. Clients pay LESS (no overhead).
- One brand delivered: naming, character design, logo, brand book, website, AND a "design skill" so future materials stay on-brand.

## The pipeline, step by step (his tools)
1. **Brand pyramid**: Figma MCP + a 2-hour meeting transcript with the client. The thinking comes from a long conversation, not from a prompt.
2. **Name options**: Claude, with the direction "clearly explained".
3. **Character ideation**: an image model asked for a **3x3 grid** of explorations per prompt (9 options at once, pick and push).
4. **Character editing**: Nano Banana Pro for details.
5. **Vectorizing**: QuiverAI for clean vectors + **Claude for consistency across characters** (same line weight, feet, eye style).
6. **Character animation**: Rive, "just blinking at the moment". Blink is the cheapest thing that makes a character feel alive.
7. **Logo**: typedump (a curated collection of open-source fonts), so the wordmark is a set font (Modulord Regular, pixel/stepped), not drawn from scratch.
8. **Pattern** and **logo animation**: Claude Code.
9. **Identity mockups**: Nano Banana Pro.
10. **Brand book assembly**: Claude Code (an Astro site, per the replies).

## What the video shows (frames x-v*.jpg, hero x-hero.jpg)
- Brand book site, "Brand book · v0.4 · 10 November 2026". Left rail: numbered TOC in 3 groups, THE IDEA (01 name, 02 core, 03 audience, 04 voice), THE LOOK (05 logo, 06 colour, 07 type, 08 pattern, 09 characters, 10 icons and images), IN USE (11 in use, 12 what stays, 13 files).
- Hero: huge pixel wordmark "quod" on a faint grid, a mono caption "quod · Modulord Regular", and a lineup of **6 monsters** (blue, red, purple, cream, green, yellow) standing shoulder to shoulder. They blink.
- Character system you can read off the lineup: identical thick black outline, flat fill + darker hatch strokes for fur, same rounded toe-feet with lighter toe pads, the same sleepy half-lidded eyes (1, 2 or 3 eyes), one distinct silhouette trick each (horns, antennae, cone head, crest). Six hues of roughly equal saturation so none dominates.
- The intro states the audience: "For anyone who writes, designs or sells for Quod." A brand book is a tool for other people (and agents).

## Notable replies (signal)
- "keep the rejected directions from that kickoff in the skill too. Saves the next agent from pitching the client an idea they already killed." <- great practice.
- "keeping later work recognisably in the same family is the part I'm curious about" — the "design skill" is his answer: a machine-readable brand file that agents follow.
- His stance: tool doesn't matter, "it is still my creativity in it".

## Lessons for Rooms (today's hackathon app)
1. Make the room characters a **family**: one outline weight, one eye style, one foot/base construction, one texture; vary only silhouette + hue. That's what makes six different monsters read as one brand.
2. Use a **3x3 grid prompt** to explore characters fast, pick one, then lock the construction rules before making the rest.
3. **Blink first.** A Rive/Lottie blink (or a 2-frame swap) on the room character is the cheapest "alive" signal; Town does the same with reveal/hover moments.
4. **Equal-weight hue set**: each room gets one of N hues at similar saturation, so the grid of rooms looks balanced (like Town's per-Townie color).
5. **Wordmark from a curated free font** rather than custom-drawn; a pixel/stepped face pairs naturally with "screenshots".
6. **Write a design skill** (DESIGN.md + tokens + character rules + rejected directions) so every Capy thread / agent produces on-brand screens. This is the single most useful process lesson for a multi-agent build.
7. Brand book structure Idea → Look → In use is a good template for Rooms' DESIGN.md.
