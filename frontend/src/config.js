import { Capacitor } from '@capacitor/core';

// ---------------------------------------------------------------------------
// API base URL resolution
//
// This has to handle four environments, because "localhost" means a
// different machine in each of them:
//
//   1. Web, local dev      -> relative URL, so Vite's dev proxy
//                              (vite.config.js: /api -> localhost:5005)
//                              forwards it to your local backend.
//   2. Web, production     -> the deployed backend, hardcoded below as the
//                              existing fallback (unchanged from before).
//   3. Android, native app -> there is NO Vite proxy inside the packaged
//                              app, and "localhost" on the phone means the
//                              phone itself, not your dev machine. The
//                              native app therefore ALWAYS needs an
//                              explicit absolute backend URL.
//
// The explicit URL for case 3 is provided at build time via the
// VITE_API_URL env var (see frontend/.env.development / .env.production),
// never hardcoded here as a literal "localhost". This is what lets the
// exact same code run as:
//   - Android emulator dev build  -> VITE_API_URL=http://10.0.2.2:5005
//   - physical device dev build   -> VITE_API_URL=http://<your-LAN-IP>:5005
//   - Android release build       -> VITE_API_URL=https://farm-copilot-backend.onrender.com
// ---------------------------------------------------------------------------

const isNative = Capacitor.isNativePlatform();

const envApiUrl = import.meta.env.VITE_API_URL;

const isLocalWeb = !isNative && typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.'));

const PRODUCTION_FALLBACK = 'https://farm-copilot-backend.onrender.com';

export const API_BASE_URL = envApiUrl
  // Explicit build-time override always wins (used by native Android builds,
  // and optionally by web builds too).
  ? envApiUrl
  : isNative
    // Native app with no VITE_API_URL configured: never fall back to a
    // relative URL (there is no proxy to catch it) or to "localhost" (that
    // would point at the phone itself) — fall back to the real deployed
    // backend instead, same as the web production behavior.
    ? PRODUCTION_FALLBACK
    : isLocalWeb
      ? ''
      : PRODUCTION_FALLBACK;
