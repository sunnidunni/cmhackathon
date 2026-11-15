# town.com UX teardown, lane A (public marketing site)

Scope: homepage, the "Read more" funding story, /routines (index + 5 detail pages), /integrations (index + Gmail + Granola detail pages), plus phone width (390px).
Captured 2026-11-15, logged out, headless Chrome at 1440x813 (desktop) and 390x844 @2x (phone). Screenshots are in `~/town-ux/shots/a-*.jpg` (82 files).
Phone shots are 780px wide (true 390pt @2x). Each one was taken inside a single CDP session so the emulated size held.

---

## 0. Design system (extracted tokens)

**Fonts (3 families plus a handwriting accent)**
- Display: `slab` = **Material Upright Variable** (slab serif, custom weight axis 38–248). h1/h2 at 80px / 83px line-height, **weight 84** (on that custom axis), letter-spacing **-1.6px (-0.02em)**. Color #1C1B1B.
- UI and body: `sans` / **ABC Diatype Variable**. Body 14px / 20.3px, weight **405** (not 400), letter-spacing **+0.28px (0.02em)**. Buttons 14–18px, weight **450**.
- Accent: `handwriting` (marker-style caps) for Townie captions, 16px, colored per Townie (e.g. #B1120B red for Claus). See a-58, a-63.
- The weight changes with size: sans regular is 400 at 16px, 405 at 14px, 410 at 12px. Tracking does the same: +0.0175em at 16px, +0.02em at 14px, +0.03em at 10px. Small text gets a little heavier and wider so it stays readable. Real type craft.
- Semantic display scale: display-1 4.5rem / 1.0375 / -0.02em, display-2 4rem / 1.05 / -0.015em, display-3 2.5rem / 1.15 / -0.01em, display-4 2rem / 1.2 / -0.0025em. Body sizes: XL 1.5rem, L 1.25rem, M 1.125rem, base 1rem, small .875rem, micro .75rem. Each size has its own tuned slab, sans and handwriting line-height and weight.

**Color**
- Page background "milk" **#FDFDFC**. Text "charcoal" **#1C1B1B**. Black **#1F1F1F**. Each has a full alpha ladder (95/90/80/…/05/025) used for secondary text and borders, with no separate grays.
- Section wash: a slightly darker warm off-white panel for demo sections (a-37) and a dark #1C1B1B security block (a-11).
- Nature-named accents in LAB color space: sun, lichen, rain, butter, lake, bubblegum, grass, lavender, acorn, bluebell, fawn. Plus blue #1375A0, forest #1D853E, sage #47A866, red #DF3232.
- Routine-card stripe colors (6): espresso #49312D, orange #E34F16, teal #4E90A2, pink #EB5A96, ochre #C7862A, green #548C59.
- Links inside product mockups: muted blue (#1375A0 family).

**Shape and elevation**
- Radii are tiny: sm 2px, md 6px (buttons, nav items), lg 10px (nav container). Cards are **square (0px)** with 1px hairlines. Mock app windows get about 12px.
- Nav buttons use CSS **`corner-shape: squircle`**, an iOS-style continuous corner on the web.
- Chips and filters have **no border**. They use an inset box-shadow: `0 0 0 1px rgba(28,27,27,.2) inset`.
- Shadows are almost absent. The mock app windows sit on a very soft, wide ambient blur (a-07). Everything else is flat hairlines.

**Layout and grid**
- Custom grid: 36 columns semantic (24 at md+, 8 on phone), 1rem gutter (1.25–1.5rem at larger sizes), max width **122rem (1952px)**. Content blocks span e.g. 28 of 36 columns.
- Homepage sections are inset "sheets" (16px side margin) stacked with about 16px gaps, like cards on a desk (a-08, a-09).
- Z-index scale is named: behind 0, base 1, raised 10, sticky 20, scrim 40, panel 50.

**Motion**
- Durations: fast 100ms, base 150ms, moderate 200ms, slow 300ms. Ease-enter `cubic-bezier(.16,1,.3,1)` (expo-out), ease-exit `cubic-bezier(.4,0,1,1)`.
- Buttons: `background-color .2s, border-color .2s, color .2s`. No transform or scale on hover.
- Named keyframes: `hero-rise` (fade plus 28px rise), `pill-pop` (scale 0 to 1.1 to 1), `routine-lockup-box-jump` (squash-and-stretch hop), `brand-shimmer-text`, `brand-parallax-drift`, `brand-manifesto-fill` (scroll-linked text fill via an @property custom property), `ticker`, `task-dot-wave`, `a2a-glow`.
- Everything is gated by `prefers-reduced-motion` (`motion-safe:`). The hero video's scroll-zoom is `md:motion-safe:` only.
- Video is an `<hls-video>` custom element (streamed HLS, Mux-style), not `<video>`. No Lottie, no canvas.
- Stack: Next.js with Tailwind v4 (prefixed `brand:`), plus a full dark-mode token set already in place.

---

## 1. Homepage, https://www.town.com/

### F1. Hero headline split around two images
**What:** The h1 "Learns how you work, then gets to work." is broken into pieces. "Learns how / you [PHOTO] work," sits top-left. "then gets / to work." sits bottom-right at 80px slab. A real person's portrait (192x240) fills the gap between words, and a hand-drawn Townie stands above the second half. a-01.
**Why it works:** The layout acts out the message. The human (you) is on the left and the helper (Townie) is on the right, so the sentence becomes a diagram. The large type and white space read as editorial and confident, not SaaS-generic.
**Steal it:** In an onboarding screen, put the user's own avatar inline in the headline ("Learns how [avatar] you work"). Mixing photo and illustration inside type is cheap and very distinctive.

### F2. The whole hero is themed per Townie, and the theme rotates
**What:** About every 4–5s the hero swaps person, Townie, highlight color, name and prompt **together**: Bud is orange, Sunny pink, Cliff purple, Flip blue. The "unusually helpful" highlight, the photo background, the "Ask **Bud** anything" name, the input border and the send-button fill all switch to that Townie's color. The swap is a crossfade, and the highlight **wipes** left to right in the new color. a-17 cycle 1–3, a-65 (caught mid-crossfade: pink wiping over orange), a-01/a-02 (wipe in progress).
**Why it works:** It shows "you get *your own* character" without a word of copy. Each pass gives a new example prompt, so the hero doubles as a feature list ("Summarize the Q3 board deck", "Prepare analytics review for 2pm meeting", "Renegotiate Snowflake contract renewal", "Draft follow-ups from yesterday's demos").
**Steal it:** Give the user's assistant or pet a signature color, then theme the composer border, send button and highlights with it. On the welcome screen, rotate 3–4 sample prompts in the composer placeholder with a color crossfade.

### F3. A fake composer as the hero's second CTA
**What:** Below the CTA is a chat input, "Ask Cliff anything" (390x46px, 1px border in the Townie's color, round send button), pre-filled with a realistic task. a-01, a-03.
**Why it works:** It shows the core interaction model (you type a task) before signup. It also lowers the perceived effort: it's just a text box.
**Steal it:** Make the hero of your app store screenshots or landing page *the input box with a great example inside it*.

### F4. Hand-drawn character cast as the brand
**What:** Ten named Townies (Bo the bear, Claus the knight, Cliff the paperclip, Flip the dog, Snap the lobster, Plum the axolotl, Bud the bowtie dog, Doug the dragon, Min, Norm the robot) in a textured, colored-pencil style. Each has an email address (bud@town.com) and a handwritten name tag. They anchor every section: Bo on Wiki, Plum on Routines, Wisp the cloud on Teams. a-07, a-09, a-10, a-12.
**Why it works:** AI assistants feel cold and interchangeable. A cast of slightly odd, imperfect creatures makes the product feel warm and owned, and gives you something to pick. The pencil texture contrasts with the precise UI mockups, which makes both look better.
**Steal it:** Have the user pick a mascot or avatar for their assistant at onboarding and reuse it everywhere: empty states, notifications, loading. Commission a consistent illustration style rather than stock 3D blobs.

### F5. Townie dropped into the middle of a headline
**What:** The closing CTA reads "Meet your [Bud illustration] today." The illustration stands in for a word and rotates through the cast. On phone, "Helpful [Bo] from hello" uses the same move. a-12, a-66-1700.
**Why it works:** It's a fill-in-the-blank. The reader's brain supplies "Townie", which is memorable and playful.
**Steal it:** In a paywall or final onboarding step, use "Meet your [avatar] today" with the user's chosen avatar inline.

### F6. Announcement bar that becomes part of the page
**What:** A full-width dark bar (#1C1B1B, 14px Diatype, white 95%) reads "Town raises $108M…" with an underlined "Read more →". The white page below has rounded top corners, so the content looks like a sheet pulled over the dark bar. Once you scroll, the bar is gone and only the floating nav remains. a-01, a-04.
**Why it works:** Social proof (funding) with zero layout cost. The sheet-over-dark treatment feels physical and premium.
**Steal it:** For an in-app announcement, place a dark strip *behind* a rounded content sheet (like an iOS sheet) instead of a banner that pushes content down.

### F7. Floating, split pill navigation
**What:** The nav is three separate floating islands: logo box (border, 10px radius), center links (Features, Solutions, Routines, Integrations, Pricing) and right auth (Sign in, plus a black filled "Sign up"). Milk background, 1px hairline, no bar, no blur. Over the dark sections they turn solid white (a-12). Hover gives a soft gray-filled squircle behind the item (a-20).
**Why it works:** Content scrolls *between* the islands, so the page never loses its top 70px. The islands read as tools, not chrome.
**Steal it:** On mobile, use floating capsules (back button left, actions right) over full-bleed content instead of an opaque nav bar.

### F8. Scroll-zooming oval animation window
**What:** Under the hero, a hand-drawn animation (a finger pressing a "TOWN" key, a cat in a top hat, a village of rooftops) plays inside an **elliptical mask** in a dark frame. It scales from about 530px to 1066px wide as you scroll (`--video-scale` var, motion-safe only). a-03 then a-04, a-05.
**Why it works:** The oval reads as a peephole or old cartoon iris. It builds intrigue and turns scrolling into a "zoom in on the world" moment.
**Steal it:** Use an iris or oval mask for intro or feature videos. Scale a hero media block with scroll progress (cheap with CSS scroll-driven animation) and respect reduced motion.

### F9. Manifesto text that fills in ink as you scroll
**What:** "Your work is spread across inboxes, calendars, chats, and apps. Your Townie works in all of them…" is about 32px slab. Words go from light gray to full charcoal as they pass through the viewport, driven by the `brand-manifesto-fill` property animation. a-05 (half filled: "and voice, and gets the work done with you." still gray) then a-06 (filled).
**Why it works:** It sets a reading pace and makes the core pitch the most "experienced" text on the page.
**Steal it:** On a key onboarding statement, reveal the text word by word with a fill as the user scrolls or taps. Two sentences max.

### F10. Trust line right under the pitch
**What:** Just after the manifesto, 14px gray: "Nothing you connect trains a model, by default. SOC2 Type 2 compliant." a-05.
**Why it works:** It answers the #1 objection (privacy) at the exact moment the user has been asked to imagine connecting their inbox.
**Steal it:** Put a one-line privacy reassurance directly under any "connect your account" ask, not in a separate security page.

### F11. Section label pills
**What:** Each sheet opens with a small centered outlined pill ("Wiki", "Routines", "Town Teams"), 16px Diatype in an inset-shadow outline, then an 80px slab headline: "Helpful from hello", "Hand off the work you do over and over", "Collaborative with your team, and each other". a-06, a-08, a-09.
**Why it works:** The pill names the *feature*. The headline sells the *benefit*. Users scanning can map benefit to feature.
**Steal it:** Feature tour screens: small tag (feature name) plus big benefit headline.

### F12. Asymmetric three-column sections with a side caption
**What:** Headline top-left, a 1–2 sentence explainer in 20px slab on the far right (about 300px wide, near the Townie), and the product mock centered. A testimonial with a photo sits bottom-left ("Town completely eliminated the step of teaching it how I work." Athena Shiravi, Investor, Avra). a-07.
**Why it works:** Editorial, magazine-like layout. The proof (quote) sits next to the demo it supports.
**Steal it:** Pair each feature demo with one real user quote placed *beside* it, not in a testimonial carousel at the bottom.

### F13. Live "wiki" mock that writes itself
**What:** A realistic app window shows a sidebar (Overview, Recent updates, Goals, Projects, Profile, People) and a document about a persona ("Jess McKinney runs a residential interior design studio in Brooklyn…") with blue entity links (Jonathon D'Amore, Alexis Swanson). The text streams in with a shimmer line "Cross-referencing how she works…" (shimmer-text keyframe). Persona tabs above it switch the whole document (Business Owner, Recruiting with Noor Hassani, Sales). a-07, a-23.
**Why it works:** It shows *what the AI learned about you*, which is the abstract promise ("learns how you work") made concrete. The streaming text and the "Cross-referencing…" status make the AI feel like it's working.
**Steal it:** Show a "what I know about you" profile page the assistant writes, and stream it in with status lines ("Reading your calendar…"). Tabs for different personas make one demo serve many audiences.

### F14. Integration carousel with filter chips and quote cards
**What:** Left: category chips (All, Messaging, Calendar, Meetings, CRM, File Storage, Project Management, Data & Analytics, Development, Finance), with the black filled chip as active state. Right: a horizontally scrolling row of square, hairline-bordered cards. Each has the logo, name, a *first-person quote from the Townie* ("I've summarized 52 messages in #sales into the three questions that still need your answer.") and a category tag. A thin progress line below shows scroll position. Filtering to CRM leaves 2 cards and the progress bar fills. a-08, a-21.
**Why it works:** Each integration is sold as an *outcome in the assistant's voice*, with concrete numbers (52 messages, 3 questions, 120 unread emails, 4 that need a reply). That beats a logo wall by a mile.
**Steal it:** For each connected service, write a sample "I did X for you" message with specific numbers. Use a scroll-progress hairline instead of dots for carousels.

### F15. "Describe your own" card leads the routines carousel
**What:** The first card in the Routines row is not a template. It's "Describe your own" with an example prompt box ("Every Friday at 4pm, scan my open PRs and draft a team status update.") and a small black "Build it" button. Then the presets follow (Auto-inbox, Decline Cold Outreach, Schedule Optimizer…), each with a line icon tile and an outlined category tag. a-09.
**Why it works:** It frames templates as inspiration, not limits. The example prompt teaches the *syntax* of a routine (when, what, output).
**Steal it:** Put "Create your own" with a filled-in example **first** in any template gallery. Use the example to teach the pattern "Every [time], [do X], [deliver Y]".

### F16. Team mock: each person brings their own assistant
**What:** "Everyone gets their own Townie, not one bot shared by the whole channel." The mock shows Rivex Corp. with overlapping member avatars (11 members), team routines in colored rounded icon tiles (Celebration Announcement, Weekly Financial Summary…) and team integrations. On the left: a vertical strip of illustrated person and Townie pairs (a-10).
**Why it works:** The copy names the competitor pattern (a shared Slack bot) and rejects it in one line.
**Steal it:** Position your feature against the obvious alternative in a single "not X" sentence.

### F17. Dark security block as a mood change
**What:** A full-bleed #1C1B1B section: "Built to keep your business safe" (white slab), two outlined buttons (Security Portal, Subprocessors), and a 2x2 grid of hairline-topped facts with line icons: SOC II Type 2 / Your Townie asks first / No model training / Encrypted in transit and at rest. a-11, a-12.
**Why it works:** The only dark section on the page signals "serious now" and makes the trust content feel weighty. "Your Townie asks first" is phrased as *behavior*, not a compliance badge.
**Steal it:** Describe safety as assistant behavior ("asks before sending"), and give it one visually distinct screen.

### F18. Footer nav in big slab type
**What:** The footer's main nav is stacked and centered in about 40px slab (Features, Solutions, Routines, Integrations, Pricing), with tiny 3-column sans links (Product, Trust, Company) under it. a-13.
**Why it works:** The end of the page feels like a table of contents, an invitation to keep exploring rather than a legal dump.

### F19. Closing credits that thank the staff
**What:** Below the footer sheet (which lifts off with rounded corners) is a dark "movie credits" section: "And a thank you to the Townies who make it possible." followed by a centered list of about 40 names in slab (Apex, Basin, Bean… Zero), with Doug the dragon bottom-right and a circular TOWN monogram bottom-left. a-14, a-15. Inner pages swap this for a giant outlined "TOWN" wordmark (a-42).
**Why it works:** It's a delightful reward for scrolling to the end, humanizes the company and keeps the "Townie" vocabulary going.
**Steal it:** An easter egg at the end of settings or the about screen: credits listing the team, or the users who shaped the product.

### F20. Hover states are color-only and quick
**What:** The primary CTA "Meet your Townie" (black, 6px radius, 12px padding, 18px/450) inverts on hover to milk background with a 1px border and dark text (a-19). Nav items gain a squircle gray fill (a-20). The transition is 200ms on color, background and border. No lift, no scale.
**Why it works:** Calm and consistent. The interface never jumps.
**Steal it:** For pressed states on mobile, use a quick (100–150ms) background swap instead of bouncy scale animations, unless the moment calls for delight.

---

## 2. Story page, /stories/operate-at-the-speed-of-ai

### F21. Book-like long-form type
**What:** Body text is in the **slab** face (not sans): 18px, line-height 27.9px (1.55), letter-spacing 0.18px, about 625px measure (roughly 70 characters). The pull quote is 40px/46px slab with a hanging open-quote ("Townies that work together, so whole teams and organizations can move at the speed of AI."). a-26, a-27.
**Why it works:** A serif body plus generous leading reads like a printed essay, which is the right tone for a manifesto-style post.
**Steal it:** For any long-form reading surface in your app (summaries, digests), use a ~65–75 character measure and 1.5+ line-height. Hang the quote marks.

### F22. Split hero with a cover image and clear metadata
**What:** A left half-width cover (butter-yellow block, pink "TOWN" label, "Series B", investor logos) and a right column: "Perspectives" pill, 64px slab title, author avatars, "Published October 19, 2026", and an hourglass icon with "5 min". a-25.
**Why it works:** Read time and authorship up front set expectations. The pink-on-yellow pairing reads as a poster.

### F23. Concrete "what it does" list in the copy
**What:** Bold-led one-liners: "Draft in anyone's voice", "Find a warm connection", "Pressure-test before meeting", "Update once, apply everywhere".
**Steal it:** Feature bullets as *[verb phrase]: [one concrete scenario]*.

---

## 3. Routines index, /routines

### F24. Plain-spoken H1 plus an instructions-style subhead
**What:** "The repeat work, handled." (80px slab), then: "Pick one, tweak the prompt, and your Townie takes it from there." a-30.
**Why it works:** The three-step mental model (pick, tweak, delegate) comes before you see a single card.

### F25. Cards titled by noun, subtitled by outcome
**What:** Each routine card has a **title noun** ("Billable Hours Recap") plus an **outcome line, often first-person**: "Find the billable hours I almost left on the table", "Chase down what I delegated and never got back", "Catch what can't wait before I log off", "Never let a proposal go cold". a-31, a-32.
**Why it works:** The title is scannable. The subtitle is the user's own inner voice, a job-to-be-done. Reading them feels like recognizing your own to-do list.
**Steal it:** Template cards: short noun title plus an "I…" outcome sentence written how the user would say it.

### F26. Color-stripe cards with stacked integration avatars
**What:** Square white cards, hairline border, an **8px solid color stripe** on the left (6 colors), 18px title, 16px gray subtitle, and a row of overlapping circular integration logos with a "+5" overflow bubble. Hover turns the card background warm gray (a-34). 3 columns on desktop.
**Why it works:** The stripe gives rhythm and color to an otherwise monochrome grid without visual noise. The stacked logos answer "will this work with my tools?" at a glance.
**Steal it:** A list cell with a left accent stripe for category plus overlapping service icons (max 3, then +N).

### F27. Featured row, then browse-by-role chips with a live count
**What:** "Featured routines" (3 cards: Morning Briefing, Meeting Brief, Auto Inbox), then "Browse by role" with chips (Recruiting, Venture Capital, Chief of Staff, Consultants, Executive Assistants, Executives, Finance, Founders, Marketing, **Parents**, Sales) and a live count "76 routines". Selecting Parents gives "4 routines" and the URL becomes `?solution=parents`. a-30, a-35.
**Why it works:** Filtering is by *who you are*, not by feature. Users self-identify, which is easier than knowing what they need. The URL state makes it shareable and lets the back button work. The count gives instant feedback.
**Steal it:** Onboarding: "What describes you?" chips, then filter templates. Always show a result count.

### F28. Consumer roles sit next to B2B ones
**What:** "Parents" routines: Pickup Conflict Check, Recurring Venmo Split Request, Weekly Kids Activity Ideas, Family Event Tracker. a-35.
**Why it works:** It broadens the audience and humanizes a work tool.

---

## 4. Routine detail pages (/routines/morning-briefing, auto-inbox, pickup-conflict-check, billable-hours-recap, recurring-venmo-split-request)

### F29. The routine is presented as an email to your assistant
**What:** Under the H1 and a definition paragraph sits an email-composer card: Townie avatar, "To: your Townie", "Subject: Set up my Morning Briefing", and the full plain-English prompt as the body ("Build me a routine that starts every workday with one short brief on exactly what needs me…"). The footer reads "Sent when you sign up — works as-is, or edit anything." with a black "Get started with this routine" button. a-36, a-37, a-45.
**Why it works:** It says "automation = a message you'd send a person", which removes any sense of configuring software. The footer copy handles both fears (setup effort, lack of control) in one line.
**Steal it:** Show templates as *messages* the user sends to the assistant, editable inline. "Works as-is, or edit anything" is a perfect microcopy pattern.

### F30. The CTA deep-links with the prompt pre-filled
**What:** "Get started with this routine" goes to `/assistant?input=<entire URL-encoded prompt>&m.source=Routine-Landing-Page&m.basedOn=Morning%20Briefing…`. The prompt includes guardrails: "My default: read and summarize on your own, but don't send, reply to, or change anything without me." and "If I already have a routine that does this job… don't create a duplicate."
**Why it works:** No dead end between marketing and product. You land in the app with your intent typed in. The prompt also teaches good prompting (schedule, steps, output format, permission default).
**Steal it:** Every template, share link or notification should deep-link into the composer pre-filled. Bake the safety default into the template text.

### F31. Animated "See it work" demo: config card, then output card
**What:** "See it work: your first two minutes of the day". The left card is the routine config (title, toggle, Trigger "Every weekday at 7:00 AM", Tools and actions with app icons: "Read new email", "Read today's calendar", "Draft the brief", then the Prompt). It **assembles itself**: "Connecting tools…", then "Drafting prompt…", then the toggle flips on. Then the right card animates in with the output: a dark **Dynamic-Island-style pill** "Morning Briefing — Tuesday" with an audio waveform, then "Your Tuesday briefing" from "Your Townie, assistant@town.com", with sections like "Needs you first: ⚠️ Acme contract reply". The caption reads "The message above becomes this — edit it any time." a-40 t1–t4, a-37, a-38.
**Why it works:** It shows cause, then effect, with the time sequence played out. The pill with a waveform hints at audio and a phone-native feel. Emoji-led section labels make the output skimmable.
**Steal it:** Directly reusable in a consumer app: a "routine card" (trigger / tools / prompt / toggle) next to an "output preview". The Dynamic-Island pill is a great header for notifications or digests.

### F32. Per-routine headlines that sell the moment
**What:** "See it work: the pile, already handled" (Auto Inbox). "tomorrow's clash, caught today" (Pickup). "the week's hours, accounted for" (Billable). "the bill lands, the request is ready" (Venmo). a-44, a-46, a-48, a-50.
**Why it works:** Each is a before-to-after in under 8 words.

### F33. Guardrail microcopy under every CTA
**What:** "Drafts wait for you to send — and it's quiet on clean days." "Estimates for your review — it never generates an invoice." "It preps the request — sending it stays your call." Output demos show tags like "Checked with you first" (Venmo, a-50) and red "Draft" labels (Auto Inbox, a-44).
**Why it works:** Each routine names its own specific risk and defuses it. That's much more convincing than a generic "you're in control".
**Steal it:** For every automation, write one line saying what it will *never* do on its own. Mark AI-made items with a visible "Draft" tag.

### F34. "Quiet on clean days"
**What:** Several routines explicitly say they stay silent when there's nothing to report ("when the day is clean it stays quiet"; "On a genuinely quiet day, say so in a line instead of padding.").
**Why it works:** It addresses notification fatigue head-on and builds trust.
**Steal it:** Make "no news means no notification" an explicit, advertised default.

### F35. Numbered how-it-works next to "Works with" chips
**What:** "How the Morning Briefing works": on the left, "Works with" chips (logo plus name, outlined, 6px radius: Gmail, Google Calendar, Outlook, Slack, Notion, HubSpot, Linear, X, "And more"). On the right, 3 steps with large light numerals (about 32px, thin): "It runs before your day starts / It reads what piled up / You get one short brief". a-39.
**Why it works:** The 3-step story repeats the same arc each time: trigger, read, deliver.

### F36. FAQ accordion with +/− and objection-first questions
**What:** Hairline-separated rows, a "+" that becomes "−", answers in 16px gray. The first item is open by default. Questions: "Is my email and calendar data secure?", "Can I change what's in the briefing?", "Do I have to set anything up?" ("No. … everything else is tailoring."). a-41.
**Why it works:** The questions are real objections, and the answers are short and specific. It also doubles as SEO content.

### F37. Same template, unique content
**What:** All 5 detail pages share an identical skeleton (breadcrumb, H1, definition sentence, email prompt card, See-it-work demo, how-it-works, FAQ, More routines), but the Townie avatar, demo output format (prose brief, draft list, 2-column table) and copy change per routine. The 76 routines are generated at scale but still feel bespoke.
**Steal it:** Build one strong template detail screen and vary only the avatar, output preview and copy.

---

## 5. Integrations index, /integrations

### F38. Highlighted keyword in the H1
**What:** "Townies work **everywhere** you do." "everywhere" sits on a pale green highlight block (no rounding, full line height). a-51.
**Why it works:** The same highlight device as the homepage hero ties the brand together. One word carries the promise.

### F39. Search plus multi-select category checkboxes, all in the URL
**What:** A search field (390px, magnifier icon, "Search integrations…", with an × to clear) above a "94 integrations" count, and a **sticky** left sidebar of checkbox categories (Messaging, Calendar, Meetings, CRM, File Storage, Project Management, Data & Analytics, Development, Finance, Design, Customer Support, Social). The checkboxes are square and turn black when checked. A "Clear filters" link appears once something is selected. CRM plus Finance gives "31 integrations" and `?categories=crm%2Cfinance`. Search "cal" gives 5 results and `?q=cal`. a-54, a-56.
**Why it works:** Live counts, multi-select and shareable URL state. The sidebar stays sticky while you scroll 94 cards (a-52, a-53).

### F40. A "Don't see your tool?" card and a character empty state
**What:** At the end of the results there's always a dashed-border card with a "+" icon: "Don't see your tool? You can still connect any MCP server from a URL, or tell us what's missing." Searching "zzqx" gives "0 integrations" and a dashed card with Wisp the cloud Townie (@WISP), "Not in Town yet." and buttons "Sign up to connect it" / "Get in touch". a-54, a-55.
**Why it works:** Search never dead-ends. There's always a next action, and the empty state has a character.
**Steal it:** Empty search results should show your mascot, a friendly line, and a way forward (request it, or a workaround).

### F41. Integration cards describe actions, not features
**What:** Square hairline cards with logo, name and a verb-led one-liner: "Reads, drafts, and sends email, and keeps your inbox organized." "Drafts and edits Google Docs in your voice." A "Coming soon" outlined mini-tag sits next to Text Messaging. a-52.
**Why it works:** The verbs set expectations about permissions. "Coming soon" is honest and builds anticipation.

---

## 6. Integration detail pages (/integrations/gmail, /integrations/granola)

### F42. Each integration has a Townie mascot and a handwritten caption
**What:** The hero is the logo, then "Connect Gmail to Town" (80px slab, 3 lines), benefit subhead, black "Connect Gmail" button, and "Free to start" micro-line. On the right: a Townie illustration (Claus the knight for Gmail, Snap the lobster for Granola) with a **handwritten caption in that Townie's color**: "CLAUS SORTED YOUR INBOX AND DRAFTED THE THREE REPLIES YOU ACTUALLY OWED." (red #B1120B) / "SNAP READ THE TRANSCRIPT AND DRAFTED THE FOLLOW-UP IN YOUR VOICE." (blue). a-58, a-63.
**Why it works:** A tiny story beats a feature list. "Actually owed" is human, wry phrasing. The color-matched handwriting makes it feel like a sticky note from your assistant.
**Steal it:** Success toasts or empty states as a handwritten note from the mascot, in the mascot's color, past tense ("I sorted…").

### F43. The same config-to-output demo, tailored to the integration
**What:** "See it work: a routine built on your Granola meetings". Trigger "When a meeting ends", tools (Granola: Search notes, Get transcript; HubSpot: Update contact, log activity; Create drafts), and the output pill "📞 Call Recap — Acme Renewal" with sections "What was agreed: ✅ Renewal moving forward" and "Your action items: 📋 3 captured". Handwritten footer: "SET IT UP ONCE. APPROVE THE DRAFTS." a-64, a-59, a-60.

### F44. A 3-step connect guide that answers "how hard is this?"
**What:** "How to connect Gmail to Town": 1 Open Integrations, 2 Sign in with Google ("one click through Google's official sign-in… Nothing to install or configure."), 3 Put your inbox to work. A repeated CTA sits under the H2, and "Read the Google connection docs" is an underlined link. a-60, a-61.

### F45. "Just ask your Townie" prompt cards
**What:** Three soft gray rounded cards (about 10px radius, no border, the only rounded cards on the site). Each has a quoted user request in 18px ("Find the thread where we agreed on the discount.", "Draft a reply that says no, nicely.", "Pull the March invoices out of my email.") and a gray result line ("Dug out of months of email, with the key line quoted."). a-62.
**Why it works:** Example requests teach users what to ask. Each is paired with a concrete result. "says no, nicely" is charming.
**Steal it:** Suggested-prompt chips in your composer should be this specific and human. Show the promised result under each.

### F46. Cross-links: routines that use this integration
**What:** "Routines that use Gmail" shows a horizontal carousel of the same stripe cards with a scroll-progress hairline, plus "Browse all routines". a-61.
**Why it works:** Integrations and routines form a graph, so every page leads to 10 more.

---

## 7. Phone width (390px)

### F47. Logo shrinks to a monogram, auth stays visible, menu is a 4-dot icon
**What:** The wordmark collapses to the ✱ mark in a bordered square. The Sign in / Sign up island stays. Menu is a "⠿"-style 4-dot button (`aria-label="Open menu"`). The announcement bar wraps to 2 lines plus a link. a-66-0.

### F48. Full-screen menu in large slab type with a Townie
**What:** The menu opens to full screen: about 32px slab links (Features, Solutions, Routines, Integrations, Pricing) with thin → arrows and hairline dividers. Bud the dog waves in the empty space, and two full-width stacked CTAs sit at the bottom: black " Get the Mac app" and outlined "Sign up". The close control is an ×. a-67.
**Why it works:** Thumb-reachable CTAs at the bottom, big tap targets, and personality even in navigation. The Mac app CTA appears only here, a smart platform-aware move.
**Steal it:** Put primary actions at the bottom of mobile sheets and fill empty space with your mascot.

### F49. Desktop layouts reflow cleanly on phone
**What:** The hero becomes stacked: headline, photo, line with highlight, CTA, Townie, "then gets to work." Filter chips wrap or scroll horizontally. Carousels peek the next card (a-66-2900, a-66-4200). Routines cards go 1-column with stripes kept (a-68). On the routine detail page the email-prompt card goes full-width and the demo stacks. a-69.

---

## 8. Copywriting and voice

- **Headlines (slab, sentence case, often a full sentence ending in a period):** "Learns how you work, then gets to work." / "Helpful from hello" / "Hand off the work you do over and over" / "Collaborative with your team, and each other" / "Built to keep your business safe" / "The repeat work, handled." / "Townies work everywhere you do." / "Meet your [Townie] today."
- **Tagline:** "The unusually helpful AI work assistant." Its modesty is the hook.
- **CTAs:** "Meet your Townie" (not "Sign up"), "Get started with this routine", "Connect Gmail", "Build it", "Browse all integrations", "Sign up for Town", "Get the Mac app". Verb-first and specific to what you're about to get.
- **Assistant voice (first person, numbers, past tense = done):** "I've summarized 52 messages in #sales into the three questions that still need your answer." / "I sorted 120 unread emails and pinned the four that need a reply from you today." / "Nothing is bought until you approve the payment."
- **User voice (routine subtitles):** "Find the billable hours I almost left on the table." / "Chase down what I delegated and never got back."
- **Control and safety microcopy:** "Sent when you sign up — works as-is, or edit anything." / "Set it up once. Nothing sends without you." / "It preps the request — sending it stays your call." / "Your Townie asks first."
- **Wit, sparingly:** "Draft a reply that says no, nicely." / "Claus sorted your inbox and drafted the three replies you actually owed." / "Not in Town yet."
- **Product vocabulary is consistent:** Townie (assistant), Routine (automation), Town (workspace), Townies (staff in the credits). Every name reinforces the "town" metaphor.

---

## 9. Weaknesses and things not to copy

1. **No active-state on the current nav item.** On /routines the "Routines" link has no aria-current and no visual highlight, so you can't tell where you are.
2. **The phone sticky CTA collides with the nav.** On /routines/morning-briefing at 390px, a black "Get started…" bar renders *under and behind* the floating Sign in / Sign up island, so its label is clipped ("Get started ·"). a-69-900. It may have been a transition frame, but it looked broken.
3. **The hero auto-rotates with no pause control.** It changes every ~4s, and the crossfade frames show overlapping ghost images and half-swapped names ("Ask S̶u̶Bud anything", a-65). That's busy for reading, and a11y-unfriendly (WCAG 2.2.2 wants pause for auto-moving content over 5s).
4. **Truncated demo tables.** The Pickup and Venmo output cards cut cell text with ellipses ("Both at 3:30 — twe…", "Split 3 ways — $62…"), the most important information (a-46, a-50). The 2-column layout is too narrow for its content.
5. **Low-contrast secondary text.** Demo-card copy uses about 50–60% charcoal on off-white, and parts of the animating demos sit at ~30% during their reveal. Fine for decoration, but some of it is real content.
6. **Desktop story page wastes the left half.** The cover image is not sticky, so after the first screen about 45% of the width is empty white beside the article (a-26, a-27).
7. **Cards have almost no hover feedback** on the homepage integration carousel or the /integrations grid (a-22, a-57). Only the routine cards get a background tint.
8. **Heavy page.** 9.2k px homepage, HLS video, about 60 SVGs, plus TikTok, Reddit, Meta and HubSpot pixels. Fast on desktop, but the trackers are at odds with the "privacy-first" message.
9. **The homepage is very long, with 2 carousels using the same pattern.** The integrations and routines rows are visually nearly identical, so the second one feels repetitive.

---

## 10. Top ideas to steal for a consumer mobile app (ranked)

1. A per-assistant signature color that themes the composer, highlights and send button (F2).
2. Routines shown as an editable message to the assistant, plus the "works as-is, or edit anything" line (F29).
3. A config-card-to-output-card demo with a Dynamic-Island-style header pill (F31).
4. One-line "what it will never do on its own" guardrail under every automation (F33, F34).
5. Template gallery: "Describe your own" first, noun title plus "I…" outcome subtitle, role chips with live count and URL state (F15, F25, F27).
6. Mascot cast with handwritten, color-matched captions and mascot-led empty states (F4, F40, F42).
7. Deep links that open the composer pre-filled from any template (F30).
8. Example prompts paired with the concrete result they produce (F14, F45).
9. Size-tuned type (weight and tracking change with size) and a small 3-family type system (section 0).
10. Floating capsule nav plus a full-screen mobile menu with bottom CTAs (F7, F48).
