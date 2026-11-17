# Shots

An iPhone app that pulls in your screenshots, reads them, sorts them into rooms, answers questions about them, and reminds you about the ones that matter. Built with Expo and Convex.

Earlier names you will still see in the code and repo: Psst, cmhackathon.

## Install on your iPhone from your Mac (free Apple ID, no paid account)

You need Xcode from the App Store, opened once, with your Apple ID added in Xcode → Settings → Accounts. You also need Node 20 or newer.

1. On the iPhone, turn on Settings → Privacy & Security → Developer Mode and restart it. Connect it to the Mac by cable and tap **Trust**.
2. Get the code and install dependencies:
   ```sh
   git clone https://github.com/sunnidunni/cmhackathon && cd cmhackathon
   npm ci
   ```
3. Build and install a standalone Release build, which bundles the JS so no dev server is needed:
   ```sh
   npx expo run:ios --device --configuration Release
   ```
   Pick your iPhone. When asked for a development team, pick your **Personal Team**.
4. On the iPhone, open Settings → General → VPN & Device Management, then trust your Apple ID's developer app. Open **Shots**.

If signing fails in step 3, open `ios/Shots.xcworkspace` in Xcode. Under the Shots target → Signing & Capabilities, set Team to your Personal Team. If Xcode says the bundle identifier is taken, change `ios.bundleIdentifier` in `app.json` to something unique and rerun step 3.

Notes:
- A free-team install expires after 7 days; rerun step 3 to refresh it.
- The app uses local notifications only, so it has no push entitlement and needs no paid account.
- A plain Release build has no sample data and no developer panel. To get both, build with `EXPO_PUBLIC_DEV_TOOLS=1` (see the developer guide).
- The backend URL comes from `.env`, which is committed and points at the shared dev deployment.

## Working on it

See [docs/DEVELOPING.md](docs/DEVELOPING.md): layout, commands, build flags, the backend's environment variables, how to test against a local Convex backend, and what to run after a deploy.
