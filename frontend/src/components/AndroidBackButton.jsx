import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Wires the Android hardware/gesture back button to React Router's history,
 * instead of the default Capacitor behavior (which just closes the app).
 *
 * Behavior:
 *  - On any route other than the home page ("/"): go back one entry in the
 *    app's own navigation history (Home -> Weather -> Details, back button
 *    on Details goes to Weather, then Home) — same as a normal browser back.
 *  - On the home page: exit the app, which is the expected Android behavior
 *    for a "root" screen.
 *
 * No-op on web (desktop/browser) and inside PWA installs — @capacitor/app's
 * native listener only fires on native platforms.
 */
export default function AndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/' || location.pathname === '') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
    // Re-subscribe whenever the current path changes so the listener always
    // sees the latest location (the callback above closes over `location`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}
