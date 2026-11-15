# Rooms (cmhackathon)

An iPhone app that pulls in your screenshots, reads them, sorts them into rooms, answers questions about them, and reminds you about the ones that matter. Expo + Convex.

## Developer setup

Expo SDK 58 (React Native 0.88, expo-router) + Convex. App code in `src/`, backend in `convex/`.

### Layout
- `src/app/`: expo-router screens. `_layout.tsx` (Convex provider + silent anonymous sign-in), `index.tsx` (routes to priming or library by photo permission), `priming.tsx`, `library.tsx`. Add new screens as new files here; one file per screen avoids merge conflicts.
- `src/components/`: shared UI (`state-views.tsx` has LoadingView, MessageView, Button).
- `src/lib/`: client logic. `convex.ts` (client), `photos.ts` (permission, Screenshots query, resize), `import-one.ts` (upload one screenshot), `dev-flags.ts`, `secure-storage.ts`.
- `convex/`: `schema.ts` (all tables from spec section 5 + indexes), `auth.ts`, `screenshots.ts`, `users.ts`, `lib/auth.ts` (`requireUserId`: the ONE helper every function uses to get the current user), tests in `*.test.ts`.

### Auth
Convex Auth **v1** (`@convex-dev/auth@0.0.98`) with the `Anonymous` provider. v2 (the npm `latest`) has no anonymous method and no React Native guide, so do not upgrade. On first launch `_layout.tsx` calls `signIn("anonymous")`; the session lives in the keychain via expo-secure-store, so relaunches keep the same user. Every row stores `userId`; always get it through `requireUserId(ctx)`. A later real sign-up should add a provider and account linking so the anonymous `users` row is kept (see labs.convex.dev/auth/config/anonymous).
Deployment env vars already set: `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`. Do not regenerate them (it logs everyone out).

### Convex
- `CONVEX_DEPLOY_KEY` is in the machine env and points at the dev deployment `frugal-grasshopper-744`.
- Deploy: `npx convex deploy -y` (typechecks, regenerates `convex/_generated`, pushes). Commit `convex/_generated`.
- Env: `npx convex env list|set NAME -- value`. Server keys (OpenAI, Supermemory, Whop) go here, never in app code.
- Tests: `npm test` (vitest + convex-test). Typecheck: `npm run typecheck`.
- Every thread deploys to the same dev deployment. Deploy only additive schema changes, and deploy after merging main, or you will push an older schema/functions over someone else's.
- The app reads the public URL from `.env` (`EXPO_PUBLIC_CONVEX_URL`, not secret, committed).

### Build for a Revyl cloud iPhone (simulator, no signing)
Cloud machines have no Xcode. Use `tools.mobile.build`:
```
tools.mobile.build({ action: "start", platform: "ios", app: "cmhackathon", source: { type: "workspace", path: "cmhackathon", commands: [
  "npm ci",
  "npx expo prebuild --platform ios --clean",
  "set -o pipefail && EXPO_PUBLIC_DEV_TOOLS=1 xcodebuild -workspace ios/Rooms.xcworkspace -scheme Rooms -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGN_IDENTITY=- | tail -200"
], output_path: "ios/build/Build/Products/Release-iphonesimulator/Rooms.app" } })
```
- `CODE_SIGN_IDENTITY=-` ad-hoc signs the simulator app. Do not use `CODE_SIGNING_ALLOWED=NO`: an unsigned app has no keychain entitlement, expo-secure-store fails, and anonymous sign-in hangs.
- Set `EXPO_PUBLIC_CONVEX_URL` on the xcodebuild line too if you want it explicit; otherwise it comes from `.env`.
- Release config embeds the JS bundle, so the phone needs no Metro server. Every JS change needs a rebuild (about 15 min cold, faster once Xcode's cache is warm).
- `EXPO_PUBLIC_*` vars are inlined at bundle time; set them on the xcodebuild line.
- Then `tools.capy.phone({ action: "attach", platform: "ios", model: "iPhone 16" })` once, and `tools.capy.phone({ action: "install", machine, build_id })`. Sessions end after 60 min and app data is lost (new anonymous user, permission prompt again).

### Seed a photo on the simulator
`tools.capy.phone({ action: "open_url", url: "https://picsum.photos/id/237/1080/1920.jpg" })`, long-press the image (mouseDown, wait 1.5 s, mouseUp), tap "Save to Photos". The simulator also ships with a few sample photos.
Saved images are NOT screenshots: they lack the screenshot subtype, so the default (Screenshots-only) import finds nothing on a simulator. Build with `EXPO_PUBLIC_DEV_TOOLS=1` and flip "Dev: read all photos" on the library screen, or build with `EXPO_PUBLIC_READ_ALL_PHOTOS=1` to default it on. On the Revyl iPhone 16 (iOS 26) the Screenshots smart album exists but holds 0 items; the library has 6 sample photos, none with the screenshot subtype. With the flag off the app says "No screenshots found yet."; with it on, the newest photo uploads.

### Dev flags (`src/lib/dev-flags.ts`)
- `EXPO_PUBLIC_DEV_TOOLS=1`: shows the dev panel (read-all-photos switch, library diagnostics: smart albums, Screenshots album count, screenshot-subtype count, all-images count).
- `EXPO_PUBLIC_READ_ALL_PHOTOS=1`: import reads all photos by default.
Leave both unset for the demo build on the real iPhone.

### Run on a real iPhone (free personal team, needs a Mac with Xcode)
1. `npm ci`
2. `npx expo run:ios --device` and pick the phone (connected by cable, Developer Mode on).
3. If signing fails, open `ios/Rooms.xcworkspace` in Xcode, Signing & Capabilities, Team: your Personal Team. Bundle id is `com.sunnidunni.cmhackathon.rooms`; change it in `app.json` if Apple says it is taken.
4. On the phone: Settings, General, VPN & Device Management, trust the developer.
The app has no push-notification entitlement, so free signing works. Do not add remote push (expo-notifications remote) without a paid account; local notifications are fine.
