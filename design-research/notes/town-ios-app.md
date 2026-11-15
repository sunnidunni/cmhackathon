# Town iOS app — what we saw (driven live on Ryan's iPhone, 2026-11-15)
Screens: `town/ios-app/*.jpg` (filenames are numbered in the order visited). All screens are included, including personal ones (wiki pages 66-77, For You 53/63/64, settings 83-84). Videos: video/town-ios-1 (onboarding in app, reveal, revise, create, customize) and video/town-ios-3 (native app, wiki, powers, invite, settings).

## Stack verdict
- **Core app = native iOS 26 SwiftUI + Liquid Glass.** Onboarding = their web app in a WebView (pixel-identical to web; drag selects text; Safari keyboard accessory bar; offers "Install Town for iPhone" inside the iPhone app).
- Voice = OpenAI Realtime voices (Marin, Cedar, Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse).
- Spotlight shows App Shortcuts under the icon ("Start live chat", "Record"). Widgets "Ask your Townie", "Needs you". Live Activity for recording. Share Extension.

## Navigation system (copy this shape)
- **Floating glass tab bar**: tab 1 = the user's own character's face (home = chat with it), Threads (bubble), For You (lightbulb), More (…). **Separate round glass compose button** to the right.
- Top-right **round glass icon buttons** (settings hexagon, bell with red unread dot); top-left glass back chevron.
- **Glass composer pill**: + attach · "Message Wes" · mic · filled live-voice waveform button. Content scrolls blurred underneath.
- **More = glass popover**: wordmark + search, rows with line icons: Powers, Wiki, Library, Invite, Settings, Send feedback.
- **Settings = sheet** (grabber, serif title, × close): avatar + name, email row, grouped inset rows with icons — Account settings · Plan & billing ("Free trial") · Teams · Townie · Scheduling · Group texting · Email threads · Trusted contacts · Connected services · Credentials · Appearance · Help & feedback · All activity · Run history · Sign out (red). Each pushes a sub-page inside the sheet (back chevron + ×).

## Screen inventory (variety!)
- Home/chat (50, 54): character welcome message + 3 personalized suggestion rows with (+).
- Threads (51): large title, pill filters All / Routines / Archived, "Recents" with filter + more, empty state "Your latest threads will appear here."
- For You (52 loading skeleton): suggestions grouped by the user's real projects/events with "All new" tags; each row = icon + task + **grey evidence line** ("You co-host Chou Hall Monday, Nov 16, 4 PM PST") + (+) accept / (×) dismiss; filter pills All / Quick ones / Routines / Teamwork.
- Notifications (55, 60): full-screen sheet "Unread activity", cards with snooze (clock) + archive actions ("Your wiki is ready — Explore what Town has learned about you, your work, and your people.").
- Emoji sheet (58): glass sheet with serif title "Emoji", search, category tabs.
- Wiki (not exported, personal): hub page + "Recent updates" dated changelog with links; Pages sheet: Overview, Goals, Projects, Profile (Communication style, Preferences and account context, Professional background, Work patterns), Notes, People (per-person pages). Sections have "Edit ▾" controls, "Status: active.", footnote citations, "What links here" backlinks.
- Powers (80): "My powers — Connect your tools, automate repeatable work, and give Town the instructions it needs to work your way." Search, horizontal Suggestions cards (icon tile, title, "Suggested for you", description, Create button), Integrations card.
- Library (81): loading spinner (content not reached).
- Invite (82): "Earn 2,000 credits per friend referral", referral link with copy, "Email an invite", **referral suggestions as name chips from your contacts**, How it works with mini illustrations ("They get their own Townie", "+2,000 credits").
- Settings sub-pages (84-*): Townie profile (big character, "WES", "Ryan's Townie since November 15, 2026", View / Share / Change, name + assistant email with copy + safety copy), Scheduling (calendar toggles, working hours windows "+ Add window", hard-limit toggle), Group texting (policy explainer + empty state), Email threads (empty state "When you CC your Townie on an email, the thread shows up here."), Trusted contacts (search, table Name/Relationship, + Add, Email recipients groups + New), Connected services ("Open in Browser" — they punt complex OAuth to web), Appearance (System ✓ / Light / Dark with footer "Changes Town's iPhone controls. Web pages keep their web appearance setting."), All activity (pills All / Threads / Routine Results / Status), Run history (Routine / Status filters, rows with time + routine + result).
- Townie picker/customize/reveal (16–49): see brief-06; key frames 17/18 reveal, 25–29 revise ("Imagining your Townie…"), 31–33 create, 43–45 personality + voice menus, 48 the shareable "CREATED FOR …" card (photo blurred), 49 "How to reach Wes".

## Weak spots seen
- WebView seams in onboarding (text selection, keyboard bar, wrong-context rows).
- Library spinner; some loads show blank spinner screens rather than skeletons.
- Connected services kicks you to the browser.
