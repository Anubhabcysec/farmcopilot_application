import type { CapacitorConfig } from '@capacitor/cli';

// ---------------------------------------------------------------------------
// Farm Copilot — Capacitor configuration
//
// This wraps the EXISTING Vite/React website (built to `dist/`) as an
// Android app. It does not replace the web build — `npm run dev` and
// `npm run build` keep working exactly as before for the browser.
//
// Two supported dev workflows on the Android side, controlled by whether
// `server.url` below is commented in or out:
//
// 1. "Bundled" dev/prod (default, server.url commented out): the app loads
//    the web assets that were copied into the Android project by
//    `npx cap sync` (from `dist/`). This is how release builds always work,
//    and it's also fine for day-to-day Android testing as long as you run
//    `npm run build && npx cap sync android` after each frontend change.
//
// 2. "Live reload" dev (uncomment server.url): the app loads your Vite dev
//    server directly over the network, so JS/CSS changes hot-reload on the
//    device/emulator without a rebuild+sync cycle. Point it at your
//    machine's LAN IP (physical device) or 10.0.2.2 (Android emulator ->
//    host machine). See ANDROID.md for the exact steps.
// ---------------------------------------------------------------------------
const config: CapacitorConfig = {
  appId: 'com.farmcopilot.app',
  appName: 'Farm Copilot',
  webDir: 'dist',

  // Uncomment ONE of these for live-reload development, then run
  // `npx cap sync android` once so the native shell picks up the setting.
  // Comment both out again (or delete `server`) before a release build.
  //
  // server: {
  //   url: 'http://10.0.2.2:5173',       // Android emulator -> host machine
  //   cleartext: true,
  // },
  // server: {
  //   url: 'http://192.168.1.50:5173',   // physical device -> your machine's LAN IP
  //   cleartext: true,
  // },

  android: {
    allowMixedContent: false,
  },
};

export default config;
