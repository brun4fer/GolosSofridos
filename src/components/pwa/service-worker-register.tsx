"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // The offline cache can retain Next.js navigation and client chunks from an
    // earlier deployment. That can leave the browser with mismatched application
    // code immediately after sign-in. Keep the site network-only until a proper
    // versioned PWA update strategy is introduced.
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames
          .filter((name) => name.startsWith("ap-goals-conceded-"))
          .map((name) => window.caches.delete(name)));
      }
    }).catch(() => {
      // The application remains fully online when browser storage is unavailable.
    });
  }, []);

  return null;
}
