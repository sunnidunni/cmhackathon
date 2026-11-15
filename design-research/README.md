# Design research for Psst / Rooms (from Ryan's lead session, 2026-11-15)

**Ryan's direction (his words, paraphrased):** he loves **Town's character design and UI/UX vision**; our mobile app "needs tons of work". Use Town as the main inspiration and Quod for process + character-system rules. He wants **as many different screens and iOS pages as possible — variety, not a small redundant app.** Never copy Town's or Quod's art, names or copy; copy the patterns.

## What's here
| Folder | What | Count |
|---|---|---|
| `town/ios-app/` | Town's real iPhone app, driven live: onboarding-in-app, Townie reveal/revise/create/customize, home chat, Threads, For You, notifications, emoji sheet, Powers, Library, Invite, Settings + 9 settings sub-pages | ~85 |
| `town/web-onboarding/` | Town web onboarding (logged in) incl. dark mode, routine catalog, drill-ins, profile loading, integrations, scheduling, Townie picker | ~40 |
| `town/marketing-site/` | town.com: home, routines, integrations, pricing + calculator, sign-up/in, docs, changelog, stories, trust, careers, footer, mobile | ~157 |
| `quod/` | getquod.ai brand book (character construction spec, colour, type, logo, voice) + site, plus a frame of the brand-book video | ~67 |
| `video/` | Screen recording of Town iOS: Townie reveal, revise (AI edit), create, personality/voice | 2 mp4 (full onboarding-in-app; native app + wiki + settings) |
| `notes/` | All findings: `town-ios-app.md` (start here), `brief-06-town-native-ios.md`, `brief-02-town-quod-patterns-and-rubric.md`, `town-web-onboarding.md`, two Town site files, `quod-brand-and-site.md`, `quod-process-genue-post.md` | 9 |

All screens are included, personal ones too (Ryan said share everything): wiki pages, For You, settings with email and calendars.

## Top 12 to apply to Rooms
1. Native iOS feel: floating glass tab bar with **the user's keeper as tab 1**, separate round compose/ask button, round glass top icon buttons, glass composer pill, large titles, sheets with grabbers (expo-router native tabs, expo-glass-effect, expo-symbols, haptics).
2. Keeper reveal → keeper customize (name with shuffle, live preview, inline red validation, personality presets, revise) → full-screen **shareable "created for {name}" card**.
3. Home = a conversation with your keeper: welcome message + 3 personalized suggestions with (+).
4. Handful/For You: cards grouped by room or source, each with a **grey evidence line** ("from a flyer you saved Oct 3 · due Fri") + accept/dismiss; filter pills.
5. A **Wiki-like "What I know"** page per keeper/room: hub summary + dated "Recent updates" changelog of what was learned/corrected.
6. Notifications sheet with snooze/archive on each card.
7. Settings sheet with many grouped sub-pages (keepers, reminders, privacy, appearance, activity, run history, delete everything) — each sub-page with a designed empty state and a one-line explainer.
8. Invite: credits + contact-chip suggestions + "they get their own keeper".
9. Activity / history screens with pill filters (All / Reminders / Answers / Status).
10. Every empty state is designed (one sentence + what will appear + how to start).
11. Keeper construction spec + motion rules from Quod (`notes/quod-brand-and-site.md` §Characters).
12. Self-review rubric (`brief-02` §5): every screen ≥ 22/24.
