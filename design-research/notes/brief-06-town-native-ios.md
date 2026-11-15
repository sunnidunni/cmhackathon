Additional research for the Wow Pack, from Ryan's lead session. I drove Town's real iPhone app today; findings below. Add these to the hi-fi screens and DESIGN.md. Don't restart anything already done; fold them into what you're making. The psychology review was already queued separately and still applies.

## How Town's iPhone app avoids looking vibecoded
1. **The core app is native iOS 26 SwiftUI with Liquid Glass.**
   - Round glass icon buttons in the top corners (back, settings, bell with a red unread dot).
   - A **floating glass tab bar**. Its first tab is the user's own character (their Townie), then three plain icon tabs. A separate round glass compose button sits beside it.
   - A glass composer: + attach, mic, and a filled circular "live voice" button.
   - Content scrolls, blurred, under all the glass.
   - Large titles: "Threads", "For You", "Wiki".
   - Native bottom sheets with a grab handle (Wiki pages, Emoji). A full-screen Notifications sheet with an × close.
   - A glass popover for "More": the wordmark at the top plus search, then a list of icon rows.
2. **Onboarding is their web app inside a WebView.**
   - It's pixel-identical to the web.
   - Giveaways: dragging selects text, a text-selection handle appears, Safari's keyboard accessory bar shows, and a row offers "Install Town for iPhone" while you're inside the iPhone app.
   - Lesson: fine for speed, but if any Rooms screen is a web view, disable text selection and the input accessory bar, and hide anything context-wrong.
3. **The "birth certificate" moment.**
   - After you confirm the character there's a full-screen cream card: the giant character, its name in huge slab serif, and a circular stamp "CREATED FOR RYAN DING" around the user's own photo.
   - Two buttons: **Share** (dark) and Continue (light).
   - This is the shareable payoff of onboarding.
   - Rooms: after the import reveal, give each user a shareable card ("Your keepers · created for {name}" with all 4 keepers and the user's counts). It's the cut "wrapped" card done as one static share sheet.
4. **Character customization depth** (all inside onboarding):
   - **Name and shuffle.** Shuffle suggests short, evocative names that are free to use ("hush", "pebble", "wes"). The email preview updates live as you type.
   - **Name validation in red, inline:** "This address is reserved" and "Choose a unique name — this one's too close to yours". The character can't share the user's name.
   - **Revise.** A text prompt that AI-edits the character (about 25s). It shows "Imagining your Townie…" with the prompt echoed in a handwriting font, plus a placeholder tile with an × to cancel. The result is added as a NEW tile, with a fresh name already selected for renaming. It costs a credit, shown as "9 of 10 left".
   - **Create** from scratch: a Whimsical ↔ Serious slider.
   - **Skin-tone chips** (Medium / Dark / Light) on human characters.
   - **Personality presets:** Balanced (default) / Warm / Direct / Concise / Sassy, plus Custom (an editable "personality document").
   - **Voice:** 10 named voices (they're OpenAI Realtime voices).
   - **Safety copy** on the address card: "Wes will only respond to {your email}. Other people cannot trigger your Townie."
   - The footer reassures: "You can change your Townie or its name anytime."
   - **The whole screen re-themes** to the character's color: background tint, primary button, selected tile.
5. **Home is a conversation with your character.**
   - The first message is a welcome from the character, ending in 3 tappable suggestions personalized from the user's data, each with a + button.
   - **For You** tab: a skeleton loader under "Task and routine suggestions for you, from Wes", then suggestions grouped by the user's real projects or events. Each row has an icon, a one-line task, and **a grey reason line citing the evidence** ("You co-host Chou Hall Monday, Nov 16, 4 PM PST"; "Four blocked deploys sat unnoticed for four days"). Each row has + accept and × dismiss. Filter pills: All / Quick ones / Routines / Teamwork. The groups get an "All new" tag.
6. **Wiki = a living profile.**
   - A hub page with a one-line summary.
   - A "Recent updates" card, a dated log of what the AI learned or corrected, with linked page names.
   - Sub-pages: Goals, Projects, Profile, Notes, People.
   - A notification arrives when it's ready.
7. **Native extras:**
   - Spotlight shows app shortcuts ("Start live chat", "Record") under the app icon.
   - Home-screen widgets ("Ask your Townie", "Needs you").
   - A Live Activity with lock-screen controls while recording.
   - A Share Extension.
8. **Notification cards** have one-tap snooze (clock) and archive buttons.

## Apply to Rooms (Expo)
- **Feel native, don't fake it.** Use expo-router native tabs and native sheets (formSheet with a grabber), `expo-glass-effect` for the tab bar, composer and top icon buttons, `expo-symbols` for SF Symbols, large titles, and haptics on confirm and done.
  - Put the user's top keeper (or a keepers cluster) as the first tab icon.
  - Make the Ask composer a glass pill: + / text / mic.
- **The handful = For You.**
  - Give every handful card a grey "why" line citing the screenshot evidence ("from a flyer you saved Oct 3 · due Fri").
  - Add + / × actions, and group cards by keeper or room with "All new" tags.
- **After import:** show a shareable "Your keepers" card with the user's name stamp. That's wow moment (d).
- **Each keeper gets a profile sheet:** name, motto, what it does and never does, its room count, and later voice and personality.
- **A Spotlight shortcut and widget** ("Ask Psst", "Forgot-this" widget) are worth a mention in the pitch even if unbuilt. Show them as a frame in the pitch assets.
- **Inline red validation** and reassurance footers ("You can change this anytime").
