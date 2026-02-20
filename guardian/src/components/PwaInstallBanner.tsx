import React, { useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function isIosDevice(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  const iOS = /iphone|ipad|ipod/.test(ua);
  const iPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandaloneMode(): boolean {
  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaStandalone || navStandalone;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIos(isIosDevice());
    setIsStandalone(isStandaloneMode());

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const showAndroidBanner = useMemo(
    () => !dismissed && !isStandalone && !isIos && deferredPrompt !== null,
    [dismissed, isStandalone, isIos, deferredPrompt]
  );

  const showIosGuide = useMemo(() => !dismissed && !isStandalone && isIos, [dismissed, isStandalone, isIos]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('[PWA] install choice:', choice.outcome);
    setDeferredPrompt(null);
    setDismissed(true);
  };

  if (!showAndroidBanner && !showIosGuide) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        {showAndroidBanner ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold text-gray-900">Install the SOIN guardian app for faster access.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-[52px] min-w-[88px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-gray-700"
                onClick={() => setDismissed(true)}
              >
                Close
              </button>
              <button
                type="button"
                className="min-h-[52px] min-w-[88px] rounded-xl bg-[#189877] px-4 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95"
                onClick={() => void handleInstall()}
              >
                Install
              </button>
            </div>
          </div>
        ) : null}

        {showIosGuide ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold text-gray-900">
              Safari: tap Share (up arrow), then choose Add to Home Screen.
            </p>
            <button
              type="button"
              className="min-h-[52px] min-w-[88px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-gray-700"
              onClick={() => setDismissed(true)}
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
