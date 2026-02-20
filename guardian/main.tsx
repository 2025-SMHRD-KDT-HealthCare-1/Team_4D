import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { registerSW } from "virtual:pwa-register";
import { PwaInstallBanner } from "./src/components/PwaInstallBanner";

registerSW({
  onNeedRefresh() {
    console.log("[PWA] New version is available. Refresh to update.");
  },
  onOfflineReady() {
    console.log("[PWA] App is ready for offline use.");
  },
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <PwaInstallBanner />
  </>
);
