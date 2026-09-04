import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// ---------------------------------------------------------------------------
// Drop-in replacement for `navigator.geolocation.getCurrentPosition`, used
// by LocationField.jsx, AuthModal.jsx, Weather.jsx and Treatment.jsx.
//
// Why this exists: those pages already use the standard browser Geolocation
// API, which *is* present in Capacitor's Android WebView, but getting a
// permission prompt to actually appear (and the ACCESS_FINE_LOCATION runtime
// permission to be requested at all) is unreliable through the raw WebView
// API alone. The Capacitor Geolocation plugin talks to Android's native
// location APIs directly and handles the permission request properly.
//
// Same call signature as the original
// (successCallback, errorCallback, options), and the `position` object
// passed to successCallback has the same shape
// (`position.coords.latitude` / `.longitude`), so every existing call site
// only needed its import changed — no other logic touched.
//
// On web this just forwards straight to navigator.geolocation, unchanged.
// ---------------------------------------------------------------------------
export function getCurrentPosition(successCallback, errorCallback, options) {
  if (!Capacitor.isNativePlatform()) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    return;
  }

  (async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          errorCallback && errorCallback({ code: 1, message: 'Location permission denied' });
          return;
        }
      }
      const position = await Geolocation.getCurrentPosition(options);
      successCallback(position);
    } catch (err) {
      errorCallback && errorCallback({ code: err?.code || 2, message: err?.message || 'Unable to get location' });
    }
  })();
}
