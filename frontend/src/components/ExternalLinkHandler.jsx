import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Makes "leave the app" links behave sensibly inside the Android WebView.
 *
 * Inside a plain browser tab, `window.open(url, '_blank')` and
 * `<a target="_blank">` open a new browser tab — normal, expected behavior.
 * Inside Capacitor's Android WebView there is no "new tab" to open: by
 * default such calls either silently do nothing or try to navigate the
 * app's own WebView away from the site entirely. Neither is what the
 * existing code intends (e.g. Treatment.jsx's "Get Directions" button uses
 * window.open(...) to send the user to Google Maps).
 *
 * This component, mounted once near the app root, makes external
 * navigation on native Android open in the system browser / an appropriate
 * app (like Google Maps) via the Capacitor Browser plugin instead:
 *
 *  - Patches `window.open` so existing calls (e.g. the Maps-directions link
 *    in Treatment.jsx) keep working unchanged.
 *  - Intercepts clicks on `<a>` tags that point to a different origin than
 *    the app itself, or that explicitly set target="_blank".
 *
 * No-op on web — browsers already handle both cases correctly on their own.
 */
export default function ExternalLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const originalOpen = window.open;
    window.open = (url, ...rest) => {
      if (typeof url === 'string' && url) {
        Browser.open({ url });
        return null;
      }
      return originalOpen(url, ...rest);
    };

    const handleClick = (event) => {
      const anchor = event.target.closest && event.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      const isExternalProtocol = /^https?:\/\//i.test(href);
      if (!isExternalProtocol) return; // in-app relative links (router routes, #anchors, mailto/tel) — leave alone

      let isDifferentOrigin = true;
      try {
        isDifferentOrigin = new URL(href, window.location.href).origin !== window.location.origin;
      } catch { /* malformed URL — treat as external */ }

      const explicitlyBlank = anchor.getAttribute('target') === '_blank';

      if (isDifferentOrigin || explicitlyBlank) {
        event.preventDefault();
        Browser.open({ url: href });
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      window.open = originalOpen;
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}
