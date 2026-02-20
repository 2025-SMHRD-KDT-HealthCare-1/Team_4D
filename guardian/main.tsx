import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { registerSW } from "virtual:pwa-register";
import { PwaInstallBanner } from "./src/components/PwaInstallBanner";

async function clearDevServiceWorkerAndCaches() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }
}

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      console.log("[PWA] New version is available. Refresh to update.");
    },
    onOfflineReady() {
      console.log("[PWA] App is ready for offline use.");
    },
  });
} else {
  void clearDevServiceWorkerAndCaches();
}

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <PwaInstallBanner />
  </>
);