import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// ---------------------------------------------------------------------------
// One-time native shell setup, called once from main.jsx. No-op on web.
//
// - StatusBar: overlay OFF, so the WebView content starts below the status
//   bar instead of underneath it — the existing fixed navbar (top: 0) would
//   otherwise render partly hidden behind the phone's status bar/notch.
//   Style is set to match the app's light navbar (dark icons/text on a
//   light bar).
// - SplashScreen: the Capacitor splash auto-hides once the WebView is ready;
//   this just makes that explicit so it never lingers if a page takes a
//   moment to render.
// ---------------------------------------------------------------------------
export async function initNativeShell() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    // Style.Dark = dark status bar icons/text, for use over a LIGHT
    // background — matches this app's light, translucent navbar.
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* StatusBar plugin not available on this platform build — safe to ignore */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* already hidden / not applicable */
  }
}
