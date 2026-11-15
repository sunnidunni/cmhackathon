# town.com: marketing site, part B (pricing, auth, docs, learn, updates, stories, trust, careers, footer, 404)

Captured 2026-11-15, logged-out headless Chrome, 1440x813 desktop plus 390x844 phone (MOBILE=1). All screenshots are in `~/town-ux/shots/b-*.jpg`.

**Design system in one paragraph:** Off-white paper background `rgb(253,253,252)`, near-black ink `rgb(26,26,22)` / `#1C1B1B`. There are two typefaces. **"slab"** is a wide slab serif used for display text: the h1 is 80px with 83px line height, -1.6px tracking and weight 84, so it is light. **"diatype"** is a grotesk for UI and body text. A third face, "handwriting", appears in the mascot name labels. Buttons are near-black solid with a 6px radius, and secondary buttons are outlined with a 1px border at 20% ink. Thin 1px grey rules and boxed grids replace drop shadows almost everywhere. Hand-drawn watercolor mascots ("Townies": Bo the bear, the knight, Min, Sunny the star, the dragon…) appear on almost every page.

---

## 1. Pricing (`/pricing`)

**F1. A headline that removes the fear of commitment**
- **What:** "Plans and pricing" eyebrow, then the 80px slab headline "Free to start, more when you're ready." Under it in grey: "Not sure which plan? **Get a recommendation in 30 seconds**" (underlined link to `/pricing/calculator`).
- **Why it works:** It answers the visitor's first worry ("do I have to pay?") before showing a single price. The helper link is offered before the visitor feels overwhelmed, not after.
- **Steal it:** Make the first line of your paywall a promise about the free path ("Free forever. Upgrade when it earns it."). Put a "Help me choose" link above the plan list, not under it.
- Shots: b-01-pricing-hero.jpg, b-70-m-pricing.jpg

**F2. Two segmented controls side by side: who you are, and how you pay**
- **What:** Pill segmented controls. The first is "Individuals | Businesses and Teams", the second is "Pay Monthly | Pay Annually **Save 20%**". The selected segment is solid black with white text. "Save 20%" is a muted 14px suffix *inside* the annual segment, not a loud badge. Annual is selected by default. On phone the two controls stack, centered.
- **Why it works:** Each control answers one independent question. Defaulting to annual anchors the lower price, and the quiet savings label reads as a fact, not a hard sell.
- **Steal it:** Use an iOS-style segmented control for billing period, default it to annual, and put the savings as dimmed text inside the segment.
- Shots: b-01, b-09-pricing-monthly.jpg, b-70

**F3. One continuous card grid, grouped 3 + 2, with zebra columns**
- **What:** The five individual plans sit in one bordered grid with 1px grey borders, split into two clusters (Free/Starter/Pro, then a 24px gap, then Power/Power Plus). Alternate columns get a faint warm-grey fill (Free, Pro and Power Plus are shaded). Every column has the same rows: name (slab), one-line purpose, price (slab, about 48px), billing caption, CTA, "Everything in X, plus", a checklist, and a usage footer row ("5,000 credits / included monthly").
- **Why it works:** Identical rows make scanning across plans effortless, and the gap separates "normal people" plans from "power" plans without extra labels.
- **Steal it:** Use a fixed row order on your plan cards (name, purpose, price, CTA, delta, usage), so a swipe between plans on mobile compares like with like.
- Shots: b-02-pricing-cards.jpg, b-71-m-pricing-cards.jpg

**F4. One filled CTA marks the recommended plan, with no "Most popular" badge**
- **What:** Only Pro's "Try Pro" is solid black. Every other CTA is outlined: "Start free", "Try Starter", "Get started". There is no ribbon or badge.
- **Why it works:** The visual weight does the recommending. It feels calmer and more trustworthy than a neon "BEST VALUE" sticker.
- **Steal it:** Give only one plan a filled button, and drop the badge.
- Shots: b-02

**F5. Each plan's tagline is written as a stage of the relationship**
- **What:** Free "Discover what Town can do for you." → Starter "Put a few tasks on autopilot." → Pro "Make Town part of your daily routine." → Power "Let Town run more of your day for you." → Power Plus "Scale Town across everything you do."
- **Why it works:** The plans read as a progression of trust and habit, not a list of feature limits. Users pick the sentence that describes them.
- **Steal it:** Write each tier's subtitle as "what your life looks like on this tier".
- Shots: b-02

**F6. "Everything in X, plus" delta lists**
- **What:** Each card lists only what is new versus the tier below, in 3–6 items with check marks.
- **Why it works:** Short lists, and the price step lines up with the new items.
- **Steal it:** On mobile plan cards, show only the delta and link "See everything" to the full table.
- Shots: b-02

**F7. Plan and billing period travel with the CTA into sign-up**
- **What:** "Try Pro" links to `/sign-up?plan=personal-pro&cadence=yearly`, and sign-up passes the same parameters to its "Sign in" link (`/sign-in?plan=personal-pro&cadence=yearly`).
- **Why it works:** The choice survives authentication, so the user is not asked to pick a plan twice.
- **Steal it:** Pass the plan the user tapped through your auth and onboarding deep link, and pre-select it on the payment sheet.
- Evidence: extracted hrefs (pricing page, sign-up page)

**F8. A recommendation calculator that shows the cost of the wrong plan**
- **What:** `/pricing/calculator` is titled "Find the plan that fits", with the microcopy "No surprise bills: pay-as-you-go stays off until you turn it on, and it never passes a cap you set." Below it is a "Credits you use per month" input plus preset chips (1,000 / 3,000 / 5,000 / 12,000 / 30,000).
  - Each plan card itemizes Plan price, then Usage beyond your plan, then Estimated total. Starter says "**Doesn't fit**" in big slab type instead of a price. The winning card gets a black "**Best fit for you**" pill and a "Why we recommend Pro" box with three bullets: the fit math, social proof ("About 8 in 10 people on paid plans use less than Pro's 5,000…"), and the savings versus the next-best fit ("$50 less than… Power at $99").
  - At 30,000 credits the cards honestly show Pro at **$1,149/month** ("25,000 credits × $0.044") against Power Plus at $199.
  - Sidebar help covers both audiences: "Already using Town? Your last 30 days are under Settings → Plan." and "New here? Light-to-medium usage is typically under 5,000 credits…"
- **Why it works:** Showing the wrong choice's real cost builds trust and pushes people to upgrade by their own reasoning. Every recommendation is explained with reasons.
- **Steal it:** Build a "which plan?" sheet with 3–5 chips about usage, live-updating cards, a "Best fit" pill and a three-bullet "why". Always show the downside of the cheaper plan.
- Shots: b-12-calculator.jpg, b-13-calculator-cards.jpg, b-14-calculator-30k.jpg

**F9. Overage framed as permission, with a hand-drawn knight**
- **What:** The section heading is "When you hit your monthly limit, just keep going." The knight mascot is drawn leaning on a giant pencil. The body says "steady overage is your upgrade signal". A boxed rate table lists Pro $0.044 / Power $0.038 / Power Plus $0.032 / Team $0.038 / Team Plus $0.030, and the footer note reads "Stay in control by setting a monthly spend cap for a hard limit, with a live tally so you always see where you stand."
- **Why it works:** It turns hitting a limit into reassurance ("you won't get cut off" plus "you have a cap"). The unit prices are fully transparent.
- **Steal it:** When users hit a limit, say "keep going" first and "here is your cap" second. Make the spending cap a first-class setting with a live counter.
- Shots: b-03-pricing-overage.jpg, b-04-pricing-compare.jpg

**F10. Comparison table with a sticky header and plain-language cells**
- **What:** "Compare plans" repeats the billing toggle at top right. The plan header row (name in slab plus an underlined "Choose X" link) is `position: sticky`. Rows are grouped under slab subheads: Seats, Credits & usage, AI assistant, Routines & integrations, Team & admin, Support. Cells use words ("Daily only", "Weekly briefing", "6,000/seat pooled") and fall back to ✓ and an em-dash. Rows alternate fills.
- **Why it works:** The sticky header means you never lose track of which column is which plan, and words beat ticks for nuanced limits.
- **Steal it:** In a long comparison list, pin the plan names, and write limits as words, not numbers alone.
- Shots: b-05-pricing-compare2.jpg, b-06-pricing-faq.jpg

**F11. FAQ grouped by topic, with a sticky-style heading column**
- **What:** A two-column layout. On the left, a 40px slab "Common questions". On the right, accordions grouped under slab subheads: "Plans & getting started", "Credits", "Billing cycles & payment"… There are 15 questions. A thin "+" icon sits at the right, rows have 1px rules, and an answer opens with a height-and-opacity animation in `rgba(28,27,27,.7)` 16/24.
- **Why it works:** Topic grouping turns 15 questions into 4 short lists. The answers ("Can I cancel any time?", "Can I delete my account and data?") pre-empt churn and privacy fears.
- **Steal it:** Group your in-app help by topic. Always include the cancel, refund and delete-data questions on the paywall.
- Shots: b-07-pricing-faq-closed.jpg, b-08-pricing-faq-open.jpg

**F12. The Teams tab: dark card for Enterprise, white CTA on black**
- **What:** Switching to "Businesses and Teams" shows "For scaling teams" (Team $71/seat/mo, Team Plus $179/seat/mo) and "For established orgs". Enterprise is the only **inverted** card: black background, a "Custom" price in slab, "Annual commitment, custom rates", and a white "Talk to sales" button.
- **Why it works:** Inversion sets the sales-led tier apart without another color.
- **Steal it:** For a "contact us" or concierge tier, invert the card rather than adding a new accent color.
- Shot: b-11-pricing-teams-cards.jpg

**F13. Restrained hover states**
- **What:** Outline buttons only change border color, from 20% ink to 100% ink (`transition: background-color .2s, border-color .2s, color .2s`). Nav items get a light pill fill on hover. The Features menu opens over a scrim that dims the page grey, with sections Product / Use Cases / Apps and a "Download for macOS" button.
- **Why it works:** Feedback is clear without anything moving or shifting layout.
- **Steal it:** For pressed states, darken the border or fill. Don't scale or bounce.
- Shots: b-15-pricing-hover-startfree.jpg, b-17-nav-features-menu.jpg

**F14. Floating "island" navigation**
- **What:** The header is three separate bordered islands: logo / five links / "Sign in + Sign up". It is sticky, and the islands sit 12px from the edges with page content visible between them. Over dark sections the islands turn solid white (b-52). On phone it becomes logo-mark island / Sign in + Sign up island / a "⋮⋮" menu.
- **Why it works:** It feels light and modern, never covers a full-width band, and stays readable on any background.
- **Steal it:** Make your top bar a set of floating capsules rather than a full-width bar, especially over hero imagery.
- Shots: b-01, b-52-trust-3.jpg, b-70

## 2. Sign-up / Sign-in (looked only, nothing submitted)

**F15. Split screen: trust panel on the left, action on the right**
- **What:** The desktop sign-up is 50/50. The left half is dark `#1C1B1B` with the slab headline "Your [avatar] Townie [icon] works for you. Just you." Below is a 2x2 grid of trust claims, each with a line icon, a title and a grey body: "SOC II Type 2 compliant", "No action without approval", "No model training", "Encrypted in transit and at rest". Privacy Policy and Terms of Service links with ↗ icons sit at the bottom. The right half is white and centered: "Start your 7-day free trial" (slab) and "Everything on your plate is about to get a lot lighter."
- **Why it works:** It answers the main objection to connecting an inbox at the moment of decision, without blocking the CTA.
- **Steal it:** On the sign-up screen, put three or four permission and privacy promises next to the button that asks for access.
- Shot: b-19-signup.jpg

**F16. An animated avatar inside the headline**
- **What:** Between "Your" and "Townie" sits a 44px circle (yellow `rgb(245,209,136)`) with a mascot (`bud.webp`) peeking in. After the word comes a 40px line icon. Both fade and transform in, and the mascot rotates.
- **Why it works:** The product's personality (you get a named character) appears before you even sign up.
- **Steal it:** Put your mascot or avatar inline in the onboarding headline: "Meet [face] your coach."
- Shots: b-19 (mid-animation, gap visible), b-22-signup-learn-data.jpg (avatar visible)

**F17. Two OAuth buttons with chevrons**
- **What:** Two full-width 448x48 buttons with an 8px radius, filled `rgb(38,38,38)`: "[G] Continue to Google ›" and "[MS] Continue with Microsoft ›". The trailing chevron implies "you'll go somewhere next". Microcopy below: "We'll send product news and tips by email. You can unsubscribe anytime." At the bottom, behind a hairline: "Already have an account? **Sign in**".
- **Why it works:** No password form and no choice overload. Disclosing the marketing email up front is honest.
- **Steal it:** Use Apple/Google only, full-width buttons, a chevron for "next step", and one line of email disclosure.
- Shots: b-19, b-21-signup-hover-google.jpg (hover lightens fill)

**F18. A "Learn about Town and your data" pill that opens a plain-language modal**
- **What:** A soft grey pill (`rgb(244,244,240)`, fully rounded, with a lock-and-hand icon) opens a white modal over a blurred, dimmed page. It has three bold questions with plain answers: "Why does Town need access to my email and calendar?", "How is my data kept safe?", "How do I stay in control of my assistant?" One line borrows founder credibility: "built by the former CTO of Plaid and engineers from Apple, Facebook, and Stripe."
- **Why it works:** It gives a just-in-time explanation of the scary permission without moving the user away from the CTA.
- **Steal it:** Add a "Why do we need this?" pill under every permission request that opens a three-question sheet.
- Shot: b-22-signup-learn-data.jpg

**F19. On mobile, sign-up becomes a lifted card**
- **What:** At 390px the dark trust panel is dropped. The form sits in a white card with a 24px radius and a soft shadow on the grey page. The headline changes to "Welcome to Town" (this load had no plan parameter). Legal links and "Already have an account? Sign in" sit pinned at the bottom of the card. The trust content is only reachable through the "Learn about…" pill.
- **Why it works:** It focuses on the action and keeps a single thumb zone.
- **Steal it:** Same pattern for your app, but see weakness W3.
- Shot: b-74-m-signup.jpg

**F20. Sign-in is deliberately minimal**
- **What:** A centered white card about 408px wide with a 12px radius on a warm grey page. It holds the wordmark, "Sign in to Town" and two *outlined* white OAuth buttons ("Continue with Google/Microsoft"). Nothing else.
- **Why it works:** Returning users need zero persuasion. The outlined buttons signal "routine", against sign-up's filled "commitment" buttons.
- **Steal it:** Make your returning-user screen visually quieter than first-run.
- Shot: b-23-signin.jpg

## 3. Docs (`/docs`, plus /docs/safety/modes-approvals, /docs/routines/custom-routines/triggers, /docs/routines/stock-routines/webhooks)

**F21. A three-pane docs layout (Nextra)**
- **What:** The left sidebar has bold group labels (Introduction / Product / Admin & Trust), collapsible sections with chevrons, and the active page bold with an indent guide line. The center column is about 800px wide, with a 36px/700 h1 and h2s with a hairline underline. On the right, "On This Page" shows a two-level TOC. A footer in the sidebar has a "Light" theme switch and a collapse-sidebar button. A three-state theme toggle (sun / moon / laptop) sits in the top bar.
- **Why it works:** It's a familiar pattern: you always know where you are (sidebar) and what's on this page (TOC).
- **Steal it:** For long in-app help, show a pinned mini-TOC chip row at the top on mobile.
- Shots: b-24-docs-index.jpg, b-27-docs-modes-approvals.jpg, b-32-docs-dark.jpg

**F22. "Copy page" for AI**
- **What:** Each page has a top-right "Copy page" button that becomes "Copied". It copies the page as markdown, and `llms.txt` exists in the route list.
- **Why it works:** Users paste docs into ChatGPT or Claude. This meets them there.
- **Steal it:** Add a "Copy as text" or "Share to AI" action on long explanatory screens.
- Shot: b-33-docs-copy-page.jpg

**F23. Docs index written as onboarding**
- **What:** The `/docs` landing page is a product tour: a numbered "How it works" list (1 Name your Townie, 2 Connect your accounts…), clickable feature cards (Assistant, Auto-inbox, Morning Briefing), an integrations table by category, a green tip callout ("Start with Auto-inbox. It works quietly in the background and you'll see the impact immediately."), "Go deeper" links, then "Contact support". Every page ends with "Last updated on November 13, 2026" and a large "next page ›" link.
- **Why it works:** The first help page tells you the single best first action, so you aren't left reading reference material.
- **Steal it:** Your help center's first screen should say "Start with X" and give one reason.
- Shots: b-25-docs-index-cards.jpg, b-26-docs-index-bottom.jpg

**F24. Colored callouts that carry real decision advice**
- **What:** A yellow warning callout with an icon: "Incoming email triggers run on **every** email… the **Smart email trigger** below is the cheaper choice." The triggers page has 7 callouts and the modes page has 6. Copy covers cost and risk ("Auto mode can affect many emails quickly…").
- **Why it works:** Warnings sit next to the action they're about and point to the better alternative.
- **Steal it:** Show inline "heads up" banners next to costly toggles, always naming the cheaper or safer option.
- Shot: b-29-docs-triggers-callouts.jpg

**F25. Permission model explained with tables (Auto / Balanced / Strict)**
- **What:** The Modes & Approvals page uses 7 tables: Setting → What it does, and Option (Allow, …) → What it does. Concepts include "Progressive trust", "Trusted contacts" and "Instructions for one person".
- **Why it works:** Three named levels are easy to remember, and tables make the differences scannable.
- **Steal it:** Give AI autonomy or permission settings three named presets with a one-line description each. Don't expose a pile of switches.
- Shots: b-27, b-28-docs-modes-table.jpg, b-76-m-docs.jpg

**F26. Code blocks for the technical crowd**
- **What:** Syntax-highlighted blocks (on the webhooks page, 6 blocks) with a hover-revealed copy icon and a word-wrap toggle. Inline `code` pills appear in body text and even in TOC items ("Example `curl`"). Security microcopy is included: "Town returns the same `404` response. This helps prevent endpoint discovery."
- Shots: b-30-docs-webhook-code.jpg, b-31-docs-code-hover.jpg

## 4. Learn (`/learn`)

**F27. A five-lesson course with numbered steps**
- **What:** The left rail is titled "Getting Started" with five lessons, each with a small boxed number badge (1 Getting to know each other … 5 Making it yours). The current lesson is bold. The main column has a full-width rounded video poster (a real person at an iMac) with a large white circular play button, two short paragraphs, then "② Giving your assistant context ›" as the next-step link.
- **Why it works:** Short, numbered, finite lessons, with the next step always visible. Calling lesson 1 "Getting to know each other" frames setup as a relationship.
- **Steal it:** Build a five-step "learn the app" path with numbered badges and a big next-step button.
- Shots: b-34-learn.jpg, b-35-learn-2.jpg

## 5. Updates / changelog (`/updates`)

**F28. A changelog with a month rail, tag chips and filters**
- **What:** The left rail lists months (October 2026 … January 2026), with the current one bold as you scroll. The header "What's New in Town" is followed by a one-line description and pill filters "All | New | Improved | Integrations" that change the URL (`?type=new`). Entries use a date gutter ("Oct 29") plus a title and a colored tag: "Integration" peach, "New" mint, "Major release" grey. Bodies are 1–2 short paragraphs, and many have an inline demo video.
- **Why it works:** It's scannable by time and by type, and filters are shareable by URL.
- **Steal it:** Build an in-app "What's new" sheet with date, title, a tag chip and a 5-second looping clip.
- Shots: b-36-updates.jpg, b-37-updates-2.jpg, b-38-updates-3.jpg, b-40-updates-filter-new.jpg

**F29. Major releases get a bordered card**
- **What:** "Town 2.0 [Major release]" is wrapped in a rounded bordered card, while ordinary entries are borderless.
- **Why it works:** Visual weight matches importance, with one extra style and no new color.
- Shot: b-39-updates-major.jpg

**F30. Permalinks revealed on hover**
- **What:** Hovering an entry title shows a "#" anchor. Months, days and entries all have their own permalinks.
- **Steal it:** Make every release note deep-linkable from push notifications.
- Shot: b-41-updates-permalink-hover.jpg

**F31. User-benefit copy, not engineering-speak**
- **What:** "Your Townie can now sign in to sites using your 1Password logins, so tasks behind a login page get finished." … "Town can't see your credentials."
- **Why it works:** Each entry says what the user can now do, then the privacy caveat, then the limits.

## 6. Stories (`/stories` + one story)

**F32. An editorial index with a featured story**
- **What:** A 72px slab "Town Stories", then a featured split card: tags "Featured", "Customer Story" (boxed); a slab headline; a slab dek; and a meta row (✱ Town team · Published November 12, 2026 · ⌛ 4 min). The photo sits on the right. Below are filter chips "All | Perspectives | Product" (active one black) plus a "Sort ⌄" control, then a three-column grid where each card has a large thumbnail, a slab title, a tag chip and a date.
- Shots: b-42-stories.jpg, b-43-stories-2.jpg, b-44-stories-grid.jpg

**F33. Real photography with the mascot drawn in**
- **What:** The customer hero is a studio portrait on saturated orange, with his Townie "Kermit" (an illustrated globe character with glasses and a hat) perched on his shoulder. The same treatment repeats in the body photos.
- **Why it works:** It ties the abstract product (an assistant) to a real person and a friendly character, which makes it memorable and shareable.
- **Steal it:** In testimonials, composite your mascot or avatar into the user's photo.
- Shots: b-46-story-top.jpg, b-48-story-body2.jpg

**F34. Long-form typography**
- **What:** The *body* is set in the slab serif at 20/28. Pull quotes are 40px slab with **hanging punctuation** (text-indent -18px, so the opening quote mark sits outside the text column). The story ends with a soft CTA section, "Explore Town for nonprofits" with an inline link, rather than a hard button.
- **Why it works:** It reads like a magazine, not a SaaS case study.
- Shots: b-47-story-body.jpg, b-49-story-end-cta.jpg

## 7. Trust (`/trust`)

**F35. Trust page structure: a promise, two audiences, then proof**
- **What:** The hero is "You can trust your Townie." with the knight mascot. The body: "security part of the product, not a footnote… Here's exactly what we do, what we don't, and where to find every resource." A boxed two-column table follows: **Individuals** (4 ✓ items: training off by default, no action without approval, never sell your data, delete anytime with "soft-delete immediately and permanently remove all data within 30 days") and **Teams & compliance** (SOC 2 Type 2, DPA, US-hosted) with a "Request security documentation" CTA.
- **Why it works:** Consumers and buyers each get their own column, and the promises are concrete (30 days, named hosts).
- **Steal it:** Your privacy screen should be a list of four checkmarked promises with numbers in them.
- Shot: b-50-trust.jpg

**F36. A dark section answering the single scariest question**
- **What:** A full-bleed dark band headed "Do we train AI on your data?" On the left: "By default, Town never trains on your data." plus a boxed comparison: "On a personal subscription, models like Claude and ChatGPT may train on your conversations by default. Through Town, they can't… Same model, very different default." On the right: a 2x2 grid of line icons, "Google data is always off-limits", "For everything else, training is off by default" (with the exact settings path "Settings → Privacy → 'Improve Town for everyone'"), and so on.
- **Why it works:** It names the fear in the user's own words, compares against the alternative, and gives the exact setting path.
- **Steal it:** Write privacy FAQ headings as the user's literal question, and include the settings path.
- Shot: b-51-trust-2.jpg

**F37. Self-serve access to the scary documents**
- **What:** "Need the full security package? Audit reports are shared under a mutual NDA. Gain access in less than 1 minute…" followed by a CTA and the list of reports. Six "Key resources" link cards follow (Security Practices, Privacy Policy, ToS, DPA, Sub-processors, AI Model Providers), each with a one-line description, then a 10-question FAQ.
- Shots: b-52-trust-3.jpg, b-53-trust-nda.jpg, b-54-trust-faq.jpg

## 8. Careers (`/careers`)

**F38. A careers page with personality and salary transparency**
- **What:** The eyebrow "Now hiring · 17 open roles" is a live count. The knight mascot holds a "WE'RE HIRING!" handwritten label. Founders get black-and-white portraits. Five numbered values in a 3-column grid ("02 Let's gooooo. Decide at 70%, not 90%."). The roles list has filter dropdowns (Team / Location), group headers with counts ("Business 4"), a slab role title, a meta line with **salary ranges** ("$150K – $225K"), "Apply ↗", and a full-row hover fill.
- Shots: b-55-careers.jpg, b-57-careers-3.jpg, b-58-careers-values.jpg, b-60-careers-role-hover.jpg

## 9. Global footer (on every brand page)

**F39. A closing CTA with a rotating mascot**
- **What:** "Meet your [mascot] today." The mascot in the middle of the sentence cycles through the Townies (bo, claus, cliff, flip, snap, plum, bud, doug, min, norm), each with a handwritten name label. The **email address** for each (bo@town.com) is in the DOM. A single outlined "Sign up for Town" button follows.
- **Why it works:** It ends every page on the brand's emotional hook, a character that could be yours.
- **Steal it:** End onboarding or marketing screens with a rotating avatar inside a sentence.
- Shots: b-62-footer-meet-later.jpg (b-61 shows it before the lazy fade-in)

**F40. Giant serif nav, then a curtain-reveal "credits roll"**
- **What:** The primary nav is repeated at about 48px slab (Features / Solutions / Routines / Integrations / Pricing). Under it are small columns (Product / Trust / Company), a huge outlined "TOWN" wordmark, and a legal row with a language select (9 languages), Terms / Privacy / Cookie links and a small SOC badge. Then the whole white footer card (rounded corners) **scrolls up off a sticky dark layer** (`aside` sticky bottom-0, z-behind, bg #1C1B1B) to reveal "And a thank you to the Townies who make it possible." followed by a movie-credits list of about 40 Townie names in slab, fading out at the bottom, with the dragon mascot and a circular "TOWN" seal.
- **Why it works:** It's a delightful Easter egg that rewards scrolling to the end and turns the mascots into a cast.
- **Steal it:** At the bottom of your settings or about screen, add a credits roll of characters or contributors, revealed by over-scroll.
- Shots: b-63-footer-links.jpg, b-64-footer-thanks.jpg, b-65-footer-bignav.jpg, b-66-footer-reveal.jpg

---

## Weaknesses (be honest)

- **W1. No real 404 page.** `/does-not-exist` silently redirects to `/sign-in?redirect_url=%2Fdoes-not-exist`. A logged-out visitor with a typo lands on a login wall. `/stories/x` and `/docs/x` show a bare, unbranded "Not Found / Could not find the requested resource" with no nav, no search and no mascot. That is a waste for a brand this playful. (b-67-404.jpg, b-68-404-docs.jpg, b-69-404-stories.jpg)
- **W2. Docs have no search.** There is no search input, and Cmd+K and "/" do nothing (tested). With 50+ integration pages this hurts. The docs also drop the brand: generic Nextra with a bold grotesk h1, not the slab and mascots. The sidebar footer still says "Light" after switching to dark. (b-24, b-32)
- **W3. Mobile sign-up hides every trust signal** behind one pill. Desktop gets four trust tiles. Phones, where people are most cautious about granting mail access, get none inline. (b-74 vs b-19)
- **W4. The "Save 20%" claim is overstated.** Annual against monthly is $49 vs $59, $99 vs $119 and $199 vs $239, which is roughly 17% savings, not 20%. Starter also has no annual option but still sits under an "annual" toggle that says "Billed monthly". (b-02 vs b-09)
- **W5. Wording is inconsistent.** Sign-up says "Continue **to** Google" next to "Continue **with** Microsoft". Sign-in says "with" for both. The careers hero has a grammar slip ("an assistant that make it easy"). The trust copy says "not used… unless you opt-in" on sign-up but "never… by default" elsewhere.
- **W6. Wasted columns.** The story page's left 45% is empty after the hero photo. The FAQ "Common questions" heading column on pricing and trust is empty, not sticky, beside a long list. (b-47, b-07)
- **W7. Mobile comparison table.** Seven plan columns at phone width overflow to the right with no visible scroll affordance or pinned first column, and the billing toggle disappears there. (b-72-m-pricing-compare.jpg)
- **W8. Changelog uses native `<video>` controls** with loading spinners, which looks unpolished next to the custom UI. The latest entry is Oct 29, so the log looks stale by mid-November. (b-36, b-37)
- **W9. Heavy lazy-loading and fade-ins** leave large blank areas mid-scroll (footer mascot, story hero, sign-up inline avatar). Fast scrollers and screenshots see empty boxes. (b-61, b-45 vs b-42)

## Top takeaways to port into a consumer mobile app
1. A plan picker that shows the honest cost of the wrong plan and explains "why this one" (F8).
2. One filled CTA as the recommendation, with no badges (F4). Taglines written as relationship stages (F5).
3. Trust promises sitting next to the permission ask, plus a "Why do we need this?" sheet (F15, F18, F36).
4. Spending cap and "keep going" framing for limits (F9).
5. Plan choice carried through auth via deep link (F7).
6. Named autonomy presets: Auto / Balanced / Strict (F25).
7. Mascot inside sentences, credits-roll Easter egg (F16, F39, F40).
8. What's new: date, tag chip, short clip, filter, deep links (F28–F30).
