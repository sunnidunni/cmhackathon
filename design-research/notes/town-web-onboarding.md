# Town onboarding (logged in, Dia) — UX notes

Steps in code (`L` array in bundle): welcome → routine-catalog → preparing-assistant → team-join (skipped for solo) → integrations → scheduling → townie-picker → assistant-customization → connections → starter-tasks. 8 dots shown. Each step is a deep link `?onboardingStep=<id>` and pushes browser history, so Back/Forward and reload work.

## Layout system
- **Split screen 50/50.** Left = warm off-white "stage" (#F7F7F3-ish) with ONE big slab-serif headline per step ("Everything on your plate is about to get a lot lighter.", "Organize your Everyday.", "Here's what we know about [photo] you.", "Let your Townie [cal icon] schedule for you.", "Meet your Townie.", "Reach your Townie anywhere."). Right = white work panel. Left `<aside>` is `hidden xl:flex`, so on phones the emotional headline disappears and only the task remains. (o-00-step1, o-m-strip)
- **Inline icon/photo inside the headline.** User's own Google avatar sits inline mid-sentence ("know about [face] you."), a calendar glyph in "Let your Townie [📅] schedule", a pencil in "Make your Townie [✎] yours." Cheap, very personal. (o-05-wiki-t1, o-07-scheduling)
- **Fixed footer bar** with one dark primary on the right (`Continue >`, 36px tall, 8px radius, #262626) and a quiet secondary on the left (`Skip for now`, grey fill) or reassurance text ("ⓘ You can edit this later"). Content scrolls in its own container; CTA never moves.
- **Progress = 8 tiny dots**, top center; filled dots darken as you advance. Back chevron top-left. No step names, no "3 of 8" — low pressure.
- **Drill-in, not modals.** Gear icons and scheduling rows push a sub-page *inside the right panel*: back link becomes "‹ Routines"/"‹ Scheduling", CTA label becomes "Done". Keeps user oriented in one surface. (o-02-gear-label, o-07-sched-*)

## Type & color tokens (measured)
- Display: custom variable `slab` serif, weight **95** (thin-ish), 36px left / 24px right headings, letter-spacing **-0.025em** (-0.9px @36), line-height 1.375.
- UI: `ABC Diatype` variable at odd weights — body **405**, card titles **665** (not 400/600: tuned optical weights). Body 14px / 21px, letter-spacing **+0.02em** (0.28px). Text #1A1A16, secondary #414038.
- A third font, `townieHandwritingFont`, used only for the assistant's voice: its email (TALLY@TOWN.COM) and the "Describe your Townie…" placeholder. Character = handwriting; product = sans.
- Body bg rgb(253,253,252). Cards: 16px radius, 12px padding, no shadow, no border, ~50% warm grey fill. Primary #262626 white text.
- Dark theme toggled instantly from step 1; primary button inverts to white-on-black. (o-00-dark)

## Step 1 — Welcome
- Sets expectations: "In the next few minutes, Town will learn the basics, suggest useful routines, and let you tune what it can do." + 4 icon bullets of what will happen.
- **Trust line with emphasis**: "Town **never** sends emails or messages without your approval" — "never" is the only underlined word on the page. Addresses the #1 fear of an email agent before asking for anything.
- Time zone pre-filled (Pacific) + Theme (System) in a soft grey settings card at the bottom: confirm-don't-ask defaults.
- Full-width primary "Let's get started >" only on this first step (commitment moment); later steps use a right-aligned compact button.
- Privacy / Terms / Log out live on the left panel bottom, out of the way.

## Step 2 — Routine catalog
- "Toggle any on or off — you can change these later." Reversibility stated up front.
- **Pre-selected recommended set**, each routine a card: colored square icon (blue inbox, red sunrise, green calendar, orange checklist), title, one-line benefit ("Your inbox, organized without the work."; "Everything you owe, caught before sign-off."), iOS-style switch.
- **Progressive disclosure inside a card**: Auto-inbox expands to sub-checkboxes (Label new mail, Archive unimportant emails, Assist with scheduling → nested "CC your Townie on scheduling drafts", Draft replies). Each has an ⓘ tooltip (dark grey, plain English) and a ⚙ gear for deep config.
- **Riskier option off by default**: "Archive unimportant emails" unchecked + greyed text, the rest checked. Safe defaults for the destructive action.
- **Personalized segment generated from your data**: "For university students juggling classes and opportunities" with routines that don't exist for others: Professor Reply Chase, Coursework Deadline Board, Group Project Ledger, Letters You Are Waiting On, Financial Aid Paperwork, all ON. Feels made for you. (o-04-catalog-students)
- **On = color, off = grey**: "More routines" (Schedule Optimizer, Competitive Intel, Newsletter Digest, Weekly Briefing, Deal Spotter, Direct-Report Feedback Prep "Bring examples to feedback, not vibes.", Relationship Reconnect, Meeting Action Hand-Off) render with desaturated grey icons until switched on. Visual state is legible at a glance. Grouped by verb-led categories: Manage Your Inbox / Manage Your Calendar / Stay Informed / Nurture Relationships / Streamline Operations.
- **Gear → routine detail page**: big icon + slab title + toggle; plain paragraph; "How it works" numbered 1–5 in small circles; italic safety footnote ("Emails from people you regularly correspond with… stay in your inbox untouched. Drafts are never sent automatically."); then accordions per sub-feature. Labels list: colored swatch + name + truncated rule (new sender, awaiting reply, action needed, newsletters, promotional, orders, travel, updates) + dashed "Add a label" ghost row; "Label prefix" toggle with literal preview "Town/LabelName". Explains the AI's logic so users trust it. (o-02, o-03-autoinbox-detail-700)

## Step 3 — "Here's what we know about you" (profile/wiki)
- Loading state is honest and gives a choice: "I'm learning about you and building your wiki in the background. Stay here about 2 minutes for an initial profile, or keep going—I'll notify you when your wiki is ready." Skeleton bars + "Learning about you..." + CTA reads **"Skip ahead"** (lighter grey) until ready, then swaps to **"Continue"** with "ⓘ You can edit this later". (o-05-wiki-t1 → t4)
- Content crossfades in (blank frame between, no jarring pop).
- Wiki structure: name in slab serif; About You; Professional Identity; **Key Contacts Sample** (2 cards: pastel initials avatar, name, email, one-line "why this person matters"; promise of ~50 more after onboarding); **Communication Style** ("Write like this: short, friendly and direct…", registers, sign-offs, real quoted examples per situation); Work Patterns; Notable Preferences; **Account Context (important for agents)** — even flags "Some sent mail… is from family members and was excluded from style analysis."
- This is the magic moment: proof of intelligence BEFORE asking for more permissions. Shows the AI's model of you as an editable doc, not a black box.
- (Screens contain the user's real personal data — kept local, not published.)

## Step 4 — Integrations
- "Integrations help your Townie do more work, all optional." Connected Google account card on top with a row of 6 tiny Google product chips (Gmail, Calendar, Drive, Docs, Sheets, Slides) showing scope at a glance.
- Ranked sections with counts at right: **Integrations for you (2)** (Dropbox, GitHub — inferred from your mail), **Popular with students (5)** (Notion, Zoom, Canva, Granola, Todoist), Apps (Slack Persona, macOS), then an **"All integrations · 68 more apps · Browse all ⌄"** row with a stacked logo strip. Expanding autofocuses a search field; search matches on more than name ("cal" → Calendly, Cal.com, Attio, Fireflies, Fathom, Gong…). (o-06-*)
- Every row same shape: logo tile, name, outlined "Connect" (secondary weight so the page isn't a wall of primaries). Slack Bot gets "Remind me later" instead because it needs a team — honest constraint labeling.
- "Skip for now" + "Continue" both offered.
- Weakness: logos load late (blank tiles for ~1–2s).

## Step 5 — Scheduling
- Three summary rows (colored icon tile, title, current value, chevron): Working hours "Weekdays · 9:00 AM – 5:00 PM", Meeting distribution "Consolidate onto busier days", Recurring rules "None". Defaults visible as values = scannable + one tap to change.
- Working hours: S M T W T F S circle toggles (weekdays filled black), time pickers, "+ Add hours".
- Meeting distribution: 3 radio cards with a one-sentence consequence each ("Stack meetings onto days that are already busy, keeping other days clear for focused work.").
- Recurring rules: "Tap any that apply" multi-select chips: Avoid morning meetings, Avoid meetings after 5pm, Prefer Fridays meeting-free, Protect lunch (12–1 PM), Protect focus time in the morning, 15-min buffer. Selected = dark border + grey fill + bolder check. Natural-language presets map to structured rules in code (`{kind:"no_meeting",polarity:"avoid",days:[5]…}`).
- Copy hedges honestly: "Your townie will do its best… when your calendar allows."

## Step 6 — Meet your Townie (the delight peak)
- Arrives **blurred** with a gold pill **"🎁 Reveal Townie"** and a "For you" gift tile in the grid — a literal unboxing. Click → your matched character pops in: name in slab serif ("tally"), personality tagline ("Already solved it. Thanks!"), its email in handwriting font (TALLY@TOWN.COM), big illustrated mascot waving. (o-08-townie-picker → o-08-reveal-f2)
- **Whole panel re-themes per character**: hero bg, selected-tile border and even the Continue button take the character's color (gold for Tally, blue for Snap the lobster "Hangs on so things don't slip.", green for Bex "Sharp eye, kind voice."). Previous mascot ghosts out as the new one fades in. (o-08-pick-lobster, -human)
- Name is pre-selected text with ✎ edit and ⤨ shuffle icons — rename in one keystroke.
- Human characters show skin-tone chips **Medium / Dark / Light**.
- 20-ish hand-drawn characters (calculator, lobster, star, cloud, axolotl, dog, dragon, knight, owl, etc.) in pastel tiles; first tile is a dashed "Create" pencil.
- **Create your own**: handwriting-font textarea "DESCRIBE YOUR TOWNIE PERSONALITY, STYLE, OR VIBE...", a **Whimsical ↔ Serious slider** with tick marks and an orange thumb, CTA "Imagine Townie" disabled until you type, credits shown "10 of 10 left". (o-08-create)
- Why it works: turns an abstract AI into a named coworker you chose; gives a reason to remember it (email address), and spends delight right before the "connect your phone" ask.

## Step 7 — Make your Townie yours
- Could not load without committing a Townie; showed Town's custom loader: an SVG TOWN monogram with `town-spinner-draw` stroke-dashoffset keyframes (draws itself, holds, fades). Branded loading instead of a generic spinner.

## Step 8 — Reach your Townie anywhere
- Channels as identical rows: Slack Bot (requires a team → "Remind me later"), Text Messaging "Text your Townie and add it to group texts", WhatsApp, Telegram, iOS "Install Town for iPhone", Mac Desktop App "Access your iMessages, contacts, and voice, plus everything Town already knows about your work." Primary: "Finish setup >".
- Meets users where they already talk; the assistant is a contact, not an app you must open.

## Mobile (390px)
- Left headline panel removed; right panel becomes the page. Legal links move above the sticky CTA. Picker grid goes 4-col, footer packs Delete/Revise/credits/Continue in one row. (o-m-strip)
- Weaknesses: card subtitles truncate ("Your inbox, organized without the w…"), "10 of 10 left" wraps to 2 lines, routine icons still lazy-load.

## Weaknesses overall
- Left panel is ~50% of desktop width with only a headline — lots of dead space on wide screens (could show a live preview).
- Logos/avatars pop in late; no image placeholders with brand color.
- Steps are URL-addressable but some silently stall (customization) when a prior step wasn't committed — no error/redirect.
- 8 dots with no labels: you can't tell how much is left in time.
