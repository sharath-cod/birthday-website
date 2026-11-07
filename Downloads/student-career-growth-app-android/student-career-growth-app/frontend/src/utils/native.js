import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export const isNative = Capacitor.isNativePlatform();

// Runs once at startup. Does nothing in a normal browser.
export function initNative() {
  if (!isNative) return;

  // Android back button: go back in the app, and exit only from the first screen.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) window.history.back();
    else App.exitApp();
  });

  // The Android WebView cannot open new tabs, so external links open in the system browser instead.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
      e.preventDefault();
      Browser.open({ url: href });
    }
  });
}
