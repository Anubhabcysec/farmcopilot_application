# Farm Copilot — Android app (Capacitor)

The existing React/Vite website (`frontend/`) is now also packaged as a native
Android app using Capacitor. This is a **wrapper**, not a rewrite: the same
React codebase, same components, same Express backend serve both the browser
and the Android app. `npm run dev` and `npm run build` inside `frontend/`
still work exactly as before.

```
frontend/ (React + Vite)  ──►  Capacitor  ──►  frontend/android/ (Android app)
        │
        └──►  same Express backend (../backend) / same database & services
```

---

## 0. Quick start — get a debug APK on your physical phone, right now

This path needs **zero configuration**: no LAN IP to find, no same-Wi-Fi
requirement, and it talks to the exact same backend + database your website
already uses — so a farm/order/soil-test created in the app shows up on the
web under the same account, and vice versa. That's because the debug APK
this produces is built with plain `npm run build` (no dev overrides), and
`frontend/src/config.js` already falls back to your deployed backend
(`https://farm-copilot-backend.onrender.com`) for any native Android build
that doesn't explicitly override it.

1. Push this project to a GitHub repo (skip if it's already on one):
   ```bash
   cd farm-copilot-android   # wherever you unzipped it
   git init
   git add .
   git commit -m "Add Capacitor Android support"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. On GitHub, open the repo's **Actions** tab → **Build Android APK** →
   **Run workflow**. (It also runs automatically on every push to `main`
   that touches `frontend/**`.)
3. Wait for the run to go green (a few minutes — first run is slower while
   it downloads the Android SDK). Open the run, scroll to **Artifacts**,
   download **farm-copilot-debug-apk** — that's a zip; unzip it once more to
   get `app-debug.apk`.
4. Get that file onto your phone (email it to yourself, upload to
   Drive/Dropbox and download on the phone, or plug the phone in via USB and
   copy it over) and tap it to install. Android will ask you to allow
   installs from that source (Files/Chrome/whichever app you used) the first
   time — that's expected for a debug build not from the Play Store.
5. Open the app. It needs internet (Wi-Fi or mobile data — no special
   network required), and it logs into / stores data on the same backend as
   the website.

**One thing to expect, not a bug:** if the backend hasn't had a request in a
while, free-tier Render services "sleep" and the first request after that
can take up to ~30–60 seconds to respond while it wakes back up. If the
app looks stuck on a loading state the very first time you open it, give it
a moment before assuming something's broken.

For live-reload development, testing against your local backend instead of
production, or running/debugging straight from Android Studio on a
USB-connected phone, see sections 5–7 below.

---

## 1. What changed

**New files**
- `frontend/capacitor.config.ts` — Capacitor config (app id, app name, web dir, dev live-reload template).
- `frontend/android/` — the generated native Android project (Gradle project, `AndroidManifest.xml`, icons, splash screens).
- `frontend/src/utils/geo.js` — drop-in `getCurrentPosition()` that routes through the native `@capacitor/geolocation` plugin on Android, and straight to `navigator.geolocation` on web (unchanged behavior there).
- `frontend/src/utils/nativeInit.js` — one-time native shell setup (status bar, splash screen), no-op on web.
- `frontend/src/components/AndroidBackButton.jsx` — wires the Android back button to React Router history.
- `frontend/src/components/ExternalLinkHandler.jsx` — sends external links (e.g. the Google Maps "Get Directions" link in Treatment.jsx) to the system browser/Maps app instead of the WebView.
- `frontend/.env.android` — the backend URL used only by Android test builds.
- `assets/icon*.png`, `assets/splash*.png` — icon/splash source images generated from your existing `farm-copilot-logo.png`, used to produce all Android density variants.

**Modified files**
- `frontend/src/config.js` — API base URL resolution now also handles the native Android case explicitly (previously only handled "web local dev" vs "web production"). See section 4.
- `frontend/src/App.jsx` — mounts `AndroidBackButton` and `ExternalLinkHandler` inside the router.
- `frontend/src/main.jsx` — calls `initNativeShell()` once on startup.
- `frontend/src/components/LocationField.jsx`, `frontend/src/components/AuthModal.jsx`, `frontend/src/pages/Weather.jsx`, `frontend/src/pages/Treatment.jsx` — swapped `navigator.geolocation.getCurrentPosition(...)` for the shared `getCurrentPosition(...)` from `utils/geo.js`. Same call signature, same success/error shape — no other logic touched.
- `frontend/src/components/AuthModal.jsx`, `frontend/src/components/LocationField.jsx` — added `maxHeight: '90vh', overflowY: 'auto'` to the sign-up modal and the two "pick location on map" overlays, so they scroll instead of getting cut off on shorter Android screens.
- `frontend/src/App.css`, `frontend/src/components/TrackerBar.jsx` — safe-area padding (`env(safe-area-inset-*)`) for the fixed navbar and the floating tracker pill.
- `frontend/android/app/src/main/AndroidManifest.xml` — added `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` (geolocation), `CAMERA` (Advisory page's photo capture), `ACCESS_NETWORK_STATE`, and `windowSoftInputMode="adjustResize"` (so the keyboard doesn't cover focused inputs).
- `frontend/android/app/src/debug/AndroidManifest.xml` (new) — enables cleartext (plain HTTP) traffic, but **only in debug builds**. Needed because Android 9+ blocks plain HTTP by default, and local testing talks to the backend over HTTP (`http://10.0.2.2:5005` / `http://<LAN-IP>:5005` — see section 7). Release builds are untouched and stay HTTPS-only, since the deployed backend is HTTPS.
- `.github/workflows/android-build.yml` (new) — a GitHub Actions workflow that builds a real, installable debug APK on GitHub's runners. See section 5.
- `frontend/package.json` — added `build:android`, `cap:sync`, `cap:open` scripts (see section 5); `npm run dev` / `npm run build` unchanged.
- `backend/index.js` — CORS is now dev/prod aware instead of a permanent `origin: '*'` (see section 6).

**Nothing was removed.** No page, component, route, or existing style was rewritten — only the targeted additions above.

**Not touched (by design):**
- `frontend/src/pages/SoilTest.jsx`'s Web Serial (`navigator.serial`) USB meter reading, and `frontend/src/pages/Advisory.jsx`'s Web Speech (`webkitSpeechRecognition`) voice input. See section 8 — these are platform limitations, not something to patch around, and your existing fallback UI (manual entry / "voice not supported" messaging) already handles their absence gracefully.

---

## 2. Capacitor configuration

`frontend/capacitor.config.ts`:

```ts
appId: 'com.farmcopilot.app'
appName: 'Farm Copilot'
webDir: 'dist'
android: { allowMixedContent: false }
```

`server.url` is present but commented out — leave it commented for normal
builds (bundled web assets); uncomment one line only for live-reload
development (see section 6/9 below).

## 3. Android configuration

| | |
|---|---|
| App name | **Farm Copilot** |
| Package ID / Application ID | **com.farmcopilot.app** |
| Android project location | `frontend/android/` |
| minSdkVersion | 24 (Android 7.0+) |
| compileSdk / targetSdk | 36 |
| Launcher icon / splash | generated from `frontend/src/assets/farm-copilot-logo.png` (see `assets/` at repo root for the source images used) |

## 4. Backend configuration — how the Android app reaches the backend

`frontend/src/config.js` resolves `API_BASE_URL` like this:

1. If `VITE_API_URL` is set at build time → use it, always (highest priority).
2. Else, if running as the **native Android app** → fall back to the deployed
   backend (`https://farm-copilot-backend.onrender.com`) — never to a relative
   URL or to `localhost`, because neither means anything inside the app.
3. Else (web) → unchanged from before: relative URL on `localhost` /
   `127.0.0.1` / `192.168.x` (so Vite's dev proxy handles it), otherwise the
   deployed backend.

**Development**
- Web: `npm run dev` → Vite dev server → its own proxy (`vite.config.js`: `/api`, `/uploads` → `http://localhost:5005`) → your local backend. Unchanged.
- Android emulator: `npm run build:android` (reads `.env.android`, `VITE_API_URL=http://10.0.2.2:5005` — the emulator's fixed alias for your host machine) → `npx cap sync android` → run from Android Studio.
- Physical Android phone: edit `.env.android`'s `VITE_API_URL` to your computer's LAN IP (e.g. `http://192.168.1.50:5005`), same build/sync steps. Phone and computer must be on the same Wi-Fi, and your backend must listen on `0.0.0.0` (Express's default `app.listen(PORT, ...)` already does this) with your OS firewall allowing inbound connections on port 5005.

**Production**
- Android release build: run the normal `npm run build` (no `VITE_API_URL` set) → `API_BASE_URL` falls back to the deployed backend automatically, same URL the production website already uses. Nothing extra to configure, and no localhost URL is ever baked into a release build.
- If/when you deploy a separate production frontend domain, add it to the backend's CORS allowlist (see below) — the app itself only needs `PRODUCTION_FALLBACK` in `config.js` updated if the backend's deployed URL ever changes.

### 4a. Verified, before you build — checklist

Confirmed by actually building and inspecting the output (not just reading the source):

- ✅ **Production API URL is not localhost.** Built the app with no `VITE_API_URL` set and grepped the output JS bundle — it contains `farm-copilot-backend.onrender.com`, no `localhost` or `10.0.2.2` anywhere.
- ✅ **The Android build does not use the Vite dev proxy.** The `/api`/`/uploads` proxy in `frontend/vite.config.js` only exists under Vite's `server` key, which is exclusive to `vite`/`npm run dev`. A production `vite build` (what both the website's deploy and the Android APK use) has no proxy code in it at all — requests go straight to the absolute `API_BASE_URL`.
- ✅ **The backend URL is correctly configured for the Android production build**, automatically, via the fallback in `config.js` — the GitHub Actions workflow builds with plain `npm run build`, so this happens with no extra steps.
- ⚠️ **API endpoints reachable from the phone over the internet — please verify this one yourself.** I can't check your backend's live status from here: this environment's own network policy blocks outbound requests to `onrender.com`, the same kind of restriction that blocks the Android SDK repos (see section 5's note). Open `https://farm-copilot-backend.onrender.com` in any browser right now — you should see "Farm Copilot backend is running..." If you get an error page instead, the service needs to be redeployed/restarted on Render before the APK will do anything useful. (If it loads but is slow the very first time, that's just Render's free tier waking a sleeping instance — not an error.)
- ⚠️ **No secrets hardcoded — mostly clean, with one thing to fix first.** `backend/.env` (real secrets: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `JWT_SECRET`, `OPENWEATHER_API_KEY`) is correctly `.gitignore`d and will never reach GitHub or the APK — confirmed with `git check-ignore`. But `frontend/.env` (which holds `VITE_GOOGLE_MAPS_API_KEY`, used by the Google Maps map-picker in `LocationField.jsx`, `AuthModal.jsx`, and `Treatment.jsx`) is *also* gitignored — which is correct practice, but means it won't exist when GitHub Actions checks out your repo. Left alone, the CI build would silently produce an APK with a blank/broken map picker (the key would resolve to an empty string, not a crash — just no map). **Fix, before you build:** add it as a GitHub Actions secret — repo **Settings → Secrets and variables → Actions → New repository secret** — name it `VITE_GOOGLE_MAPS_API_KEY`, paste the same value from your local `frontend/.env`. I've already updated `.github/workflows/android-build.yml` to read that secret and pass it into the build; you just need to add the secret itself once, before your first "Run workflow". (This key is meant to be client-embedded — that's how the Google Maps JS API works even on the live website today — so this isn't a leak, just something that has to be explicitly supplied to CI since `.env` files never are.)

## 5. Commands

```bash
# from frontend/

# install dependencies (frontend)
npm install

# run the website (unchanged)
npm run dev
npm run build

# build the web assets for an ANDROID TEST build (uses .env.android)
npm run build:android

# sync those assets + native plugins into the Android project
npx cap sync android
# (or: npm run cap:sync   — does build:android + sync in one step)

# open the Android project in Android Studio
npx cap open android
# (or: npm run cap:open)

# from Android Studio: Run ▶ to install/launch on an emulator or device,
# or Build > Generate Signed Bundle/APK for a release build.

# command-line equivalents (from frontend/android/), once you have the
# Android SDK installed locally:
./gradlew assembleDebug     # debug APK  → app/build/outputs/apk/debug/
./gradlew bundleRelease     # release AAB (for Play Store) → app/build/outputs/bundle/release/
./gradlew assembleRelease   # release APK (sideloading/testing) → app/build/outputs/apk/release/
```

> **A note on this environment:** the project was built, configured, and
> `npx cap sync android` was verified successfully in this sandbox. Running
> the actual Gradle/Android build here fails — not from a project
> misconfiguration, but because this sandbox's network policy blocks
> `dl.google.com` and `maven.google.com` (confirmed: both return `403
> Forbidden`), which is where the Android Gradle Plugin and Android SDK
> components are fetched from. That's an outbound-network restriction on
> *this cloud workspace*, not a real system's limitation — it doesn't
> reflect a restriction you'd hit on your own machine or in CI.
>
> Two ways to get a real, installable `.apk` without needing that access
> here:
>
> **Option A — Android Studio on your own machine.** Unzip the project,
> `cd frontend`, `npm install`, `npx cap open android`. Android Studio has
> normal internet access and will fetch the SDK/Gradle Plugin automatically
> the first time it opens the project.
>
> **Option B — GitHub Actions (no local Android Studio needed).** Push this
> project to a GitHub repo and either let `.github/workflows/android-build.yml`
> run automatically (it triggers on any push to `main` touching `frontend/**`),
> or trigger it manually from the repo's **Actions** tab ("Run workflow").
> GitHub's runners aren't behind this sandbox's network policy, so the same
> Gradle build that fails here succeeds there. When it finishes, open that
> workflow run and download the **farm-copilot-debug-apk** artifact — that's
> your installable `.apk`, ready to sideload onto a device (enable "Install
> unknown apps" for whatever app you transfer it with, e.g. Files/Drive/USB).

## 6. CORS — dev vs production

`backend/index.js` no longer uses a blanket `origin: '*'`:

- **Development** (`NODE_ENV` unset or not `production`): reflects any
  request origin, so the Vite dev server (any LAN IP/port) and Android dev
  builds all work without extra config.
- **Production** (`NODE_ENV=production`): explicit allowlist —
  `https://localhost` / `capacitor://localhost` (Capacitor's Android WebView
  origins) plus anything you list in the `CORS_ALLOWED_ORIGINS` env var
  (comma-separated), e.g. `CORS_ALLOWED_ORIGINS=https://your-deployed-frontend.com`.

This is a **tightening**, not a weakening: the previous `origin: '*'` allowed
literally any website to call your API from a browser; the new production
allowlist only allows your own app and whatever origins you explicitly name.

## 7. Testing against your LOCAL backend from a physical phone (optional)

Section 0's quick-start APK talks to your deployed backend and needs no LAN
setup at all. Use this section instead only when you specifically want the
phone to hit the backend running on your development machine — e.g. to test
a backend change before deploying it.

1. Find your computer's LAN IP (Windows: `ipconfig`; Mac/Linux: `ifconfig` or `ip addr`) — e.g. `192.168.1.50`.
2. Edit `frontend/.env.android`: set `VITE_API_URL=http://192.168.1.50:5005`.
3. Make sure your phone and computer are on the **same Wi-Fi network**.
4. Start the backend so it's reachable on your LAN: `cd backend && npm start` (Express's `app.listen(PORT, ...)` already binds all interfaces, not just localhost).
5. Check your computer's firewall allows inbound TCP on port 5005 (Windows Defender Firewall / `ufw` on Linux / macOS firewall settings — you may need to add an allow rule the first time).
6. `cd frontend && npm run cap:sync` (rebuilds with the new `.env.android` value and copies it into the Android project).
7. Enable Developer Options + USB debugging on the phone (Settings → About phone → tap "Build number" 7 times, then Settings → Developer options → enable USB debugging), connect it via USB, accept the "allow USB debugging" prompt on the phone, then either:
   - **From Android Studio:** `npx cap open android`, wait for it to finish indexing, select your phone from the device dropdown at the top, click the green **Run ▶** button. This installs the APK and launches it, with Logcat available for live console/error output.
   - **From the CLI:** `adb devices` (confirms your phone shows up — install [platform-tools](https://developer.android.com/tools/releases/platform-tools) if `adb` isn't found), then `npx cap run android` — it builds, installs, and launches on whichever device is connected (or prompts you to pick one if there's more than one).
8. Cable-free alternative: `npx cap open android`, then in Android Studio use **Pair Devices Using Wi-Fi** (under the device dropdown) to deploy over the same Wi-Fi network instead of USB.

For faster iteration without rebuilding for every change, uncomment the
`server.url` block in `capacitor.config.ts` pointing at
`http://<your-LAN-IP>:5173` (with `npm run dev` running), then `npx cap sync
android` once — the app will load your Vite dev server directly with hot
reload, so JS/CSS edits show up on the phone without a rebuild. Remember to
comment it back out (or delete `server`) before any release build or before
going back to section 0's quick-start APK.

## 8. Known platform gaps (not faked, not silently broken)

- **`SoilTest.jsx` — NPK meter over USB (Web Serial API).** `navigator.serial`
  has no Android WebView implementation at all (Chrome for Android and
  Android WebView don't support Web Serial — it's desktop-Chrome-only). Your
  code already feature-detects this (`serialSupported`) and falls back to
  manual entry, so the Android app will simply always show the manual-entry
  path for this feature. If live USB meter reading on Android matters to you,
  that requires a native USB-serial plugin (e.g.
  `@capacitor-community/usb-serial` or a custom native module) — a
  meaningfully bigger addition, not part of this base wrap.
- **`Advisory.jsx` — voice input (Web Speech API / `webkitSpeechRecognition`).**
  Also unsupported in Android WebView. Existing error handling
  (`"Could not start microphone..."` etc.) covers this; text/photo-based
  advisory input is unaffected. A native fix path exists
  (`@capacitor-community/speech-recognition`) if you want voice input on
  Android later.
- **`Advisory.jsx` — in-page camera capture (`getUserMedia`).** Generally
  works in Capacitor's WebView (CAMERA permission is now declared in the
  manifest), but WebView camera permission prompts can be inconsistent across
  Android OEM skins. `@capacitor/camera` is already installed as a dependency
  if you want to swap this one call to the native camera picker for
  reliability — not done here per your "minimum necessary changes" scope, but
  it's a small, isolated change if you hit issues on real devices.

## 9. Before publishing to Google Play

- **Release signing:** generate a keystore (`keytool -genkey -v -keystore farm-copilot-release.keystore -alias farmcopilot -keyalg RSA -keysize 2048 -validity 10000`), then configure `frontend/android/app/build.gradle`'s `signingConfigs`/`buildTypes.release` to use it (Android Studio's Build > Generate Signed Bundle/APK wizard can do this for you interactively and remembers the config). **Never commit the keystore or its passwords to git.**
- **Versioning:** bump `versionCode` (integer, must increase every Play Store upload) and `versionName` (human-readable, e.g. `1.0.1`) in `frontend/android/app/build.gradle` before each release.
- **App icon:** already generated from your logo (section 3) — Play Store also wants a separate 512×512 hi-res icon and a feature graphic (1024×500) for the store listing itself; those are store-listing assets, not app assets, and aren't generated by Capacitor.
- **AAB, not APK:** Play Store requires an Android App Bundle — use `./gradlew bundleRelease` (or Android Studio's "Android App Bundle" option), not a plain APK.
- **Permissions:** the manifest currently declares `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`, and `CAMERA`. Play Console's data-safety questionnaire will ask you to declare what each is used for (location: farm/field location features; camera: crop photo diagnosis) — have those descriptions ready.
- **Privacy policy:** required by Play Store for any app requesting location/camera permissions. You'll need a hosted privacy policy URL for the store listing before you can publish.
- **Store listing:** short/full description, screenshots (phone + optionally tablet), the feature graphic mentioned above, and a content rating questionnaire.
