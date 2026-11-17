# Developing Shots

Expo SDK 58 (React Native 0.88, expo-router) and Convex. App code is in `src/`, the backend in `convex/`.

Read `AGENTS.md` before touching Expo APIs: they change every SDK release.

## Commands

```sh
npm ci                 # install
npm test               # vitest: backend (convex-test) and pure app logic
npm run typecheck      # app and backend
npx expo lint          # lint
npx expo-doctor        # dependency and config checks
npx expo export --platform ios --output-dir /tmp/shots-export   # proves the production bundle builds
```

CI runs the first five on every pull request (`.github/workflows/ci.yml`).

## Layout

- `src/app/`: expo-router screens. Every file here is a route, so components and tests live elsewhere.
  - `_layout.tsx`: Convex provider, silent anonymous sign-in, the root stack.
  - `(tabs)/`: Today, Rooms, Ask. Notes and You exist but are hidden from the tab bar.
  - `welcome`, `priming`, `bring`, `import`, `keepers-card`: first run.
  - `shot/[id]`, `room/[key]`, `album/[id]`, `remind/[id]`, `act/[id]`: detail screens and sheets.
  - `settings`, `privacy`, `about`, `siri`, `upgrade`.
  - Demo-only and developer-only routes are wrapped in `onlyWhen(...)` and redirect home in other builds.
- `src/components/`: UI, grouped by screen.
- `src/design/psst/`: the design system in use (tokens, keepers, buttons). `src/design/` at the top level is the older one, still used by `upgrade.tsx` and the `/design` sheet.
- `src/lib/`: app logic. Files named `*-plan.ts` are pure and unit tested; their neighbours wrap native modules.
- `convex/`: the backend. `schema.ts` has every table. `lib/` holds helpers and pure logic.
- `demo-screenshots/`: the sample screenshots used by demo builds and by tests.

## Build flags

Set at bundle time. `EXPO_PUBLIC_*` values are inlined into the JS, so a change needs a rebuild.

| Flag | Effect |
|---|---|
| `EXPO_PUBLIC_CONVEX_URL` | The Convex deployment the app talks to. Comes from `.env` unless set. |
| `EXPO_PUBLIC_DEV_TOOLS=1` | **Demo build.** Sample screenshots when the library is empty or the server can't be reached, scripted "act" flows, the developer panel (long press at the top, or Settings → Developer), and the fixture-only screens. Never set it for a build that goes to real users. |
| `EXPO_PUBLIC_READ_ALL_PHOTOS=1` | Import reads every photo, not only screenshots. Needed on simulators. Ignored unless the build is a debug build or has `DEV_TOOLS`. |
| `EXPO_PUBLIC_SIRI_SHORTCUT_URL` | An iCloud link to a ready-made "Ask Shots" Shortcut. When set, the Siri screen offers it instead of the build-it-yourself steps. |

A build with none of these shows real data only. If the server can't be reached it shows a retry screen, never sample data.

## Accounts

Convex Auth **v1** (`@convex-dev/auth@0.0.98`) with the `Anonymous` provider. v2 has no anonymous sign-in, so don't upgrade. The first launch creates an anonymous user; the session lives in the keychain and lasts ten years (`convex/auth.ts`). There is no way to sign back in, so losing the session means losing the library. Reinstalling the app creates a new user.

Every function gets the current user through `requireUserId(ctx)` (`convex/lib/auth.ts`) and checks that a row belongs to that user before reading or changing it.

## The backend

### Deployments

There is one shared dev deployment, `frugal-grasshopper-744`, which `.env` and every EAS profile point at. There is no production deployment yet.

- `npx convex deploy -y` typechecks, regenerates `convex/_generated`, and pushes **every** function and the schema. Deploy only from an up-to-date `main`, or you push an older backend over someone else's.
- Keep schema changes additive. A removed or tightened field fails validation against existing rows.
- Commit `convex/_generated`.

### Testing against a local backend

You can run a real Convex backend on your own machine, with no account and without touching the shared deployment:

```sh
CONVEX_AGENT_MODE=anonymous npx convex dev
```

It serves the client API at `http://127.0.0.1:3210` and HTTP routes at `:3211`, and writes `.env.local` (ignored by git), which overrides `EXPO_PUBLIC_CONVEX_URL` for local builds. Delete `.env.local` to point local builds back at the shared deployment. Sign-in needs `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` set on it with `npx convex env set`; any freshly generated key pair works locally.

### Environment variables (set with `npx convex env set NAME -- value`)

| Name | Needed for | Notes |
|---|---|---|
| `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` | Sign-in | Regenerating them on a deployment signs everyone out, and an anonymous user cannot sign back in. |
| `OPENAI_API_KEY` | Reading screenshots, Ask, album sorting | |
| `OPENAI_VISION_MODEL`, `OPENAI_ASK_MODEL` | Optional | Model names. A default is used when unset (`convex/lib/openai.ts`). |
| `SUPERMEMORY_API_KEY` | Ask's memory | One namespace per user id, so separate deployments need separate keys. |
| `WHOP_API_KEY`, `WHOP_ACCOUNT_ID`, `WHOP_WEBHOOK_SECRET` | Upgrade | |
| `WHOP_ENVIRONMENT` | Upgrade | Must be `sandbox` or `production`. Unset or anything else turns checkout off. |
| `DEV_UNLIMITED_IMPORT=1` | Testing | Lifts the free plan's import limits for everyone on the deployment. |

The Whop webhook (`POST /whop`) must be subscribed to `payment.succeeded`, `refund.created` and `refund.updated`.

### After deploying these changes for the first time

```sh
npx convex run textMigration:run   # moves existing screenshots' text into screenshotTexts
npx convex run siri:revokeAll      # ends the hand-made Siri keys from the hackathon
```

Both are safe to run more than once.

### Things worth knowing

- **Screenshot text** is stored in `screenshotTexts`, not on the screenshot, so that listing screenshots does not read it (`convex/lib/shotText.ts`).
- **Removed screenshots** are remembered in `removedAssets`, so a sync does not bring them back. "Delete everything" clears that list.
- **Delete everything** runs in passes of 200 (`convex/shots.ts`).
- **Reminders** are local notifications. The server holds the reminder; the phone schedules the notification and re-syncs the two each time the app opens (`src/lib/notifications.ts`).
- **Reading** runs at most 10 screenshots at a time for the whole deployment, shared out between users in turns (`convex/extract.ts`).
- **Free plan**: the app offers the newest 50 screenshots; the server allows 150 imports per 24 hours (`convex/lib/importPlan.ts`).

## Running on a device or simulator

Real iPhone: see the README.

Revyl cloud iPhone (simulator build, no signing). This is the recipe from the hackathon; it has not been re-run since the app was renamed:

```
tools.mobile.build({ action: "start", platform: "ios", app: "cmhackathon", source: { type: "workspace", path: "cmhackathon", commands: [
  "npm ci",
  "npx expo prebuild --platform ios --clean",
  "set -o pipefail && EXPO_PUBLIC_CONVEX_URL=https://frugal-grasshopper-744.convex.cloud EXPO_PUBLIC_DEV_TOOLS=1 EXPO_PUBLIC_READ_ALL_PHOTOS=1 xcodebuild -workspace ios/Shots.xcworkspace -scheme Shots -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGN_IDENTITY=- | tail -200"
], output_path: "ios/build/Build/Products/Release-iphonesimulator/Shots.app" } })
```

- `CODE_SIGN_IDENTITY=-` ad-hoc signs the simulator app. An unsigned app has no keychain entitlement, so secure storage fails and sign-in hangs.
- A simulator has no screenshots: saved images lack the screenshot subtype. Use `EXPO_PUBLIC_READ_ALL_PHOTOS=1` with `EXPO_PUBLIC_DEV_TOOLS=1`.
- The app has no push-notification entitlement, so free signing works. Don't add remote push without a paid Apple developer account.
