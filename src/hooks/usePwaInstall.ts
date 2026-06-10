/**
 * @file usePwaInstall.ts
 * @description Hook para detectar e instalar la PWA (nativo, iOS o manual).
 */
import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type PwaInstallMode = "native" | "ios-instructions" | "manual" | null;
export type ManualInstallPlatform = "desktop-chromium" | "android";

/** @returns `true` si la app ya está en modo standalone. */
function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/** @returns `true` si el dispositivo es iOS/iPadOS. */
function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** @returns Plataforma para instrucciones manuales o null. */
function getManualInstallPlatform(): ManualInstallPlatform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return "android";
  if (/Chrome|Edg|OPR/.test(ua) && !/Android|Mobile|iPhone|iPad/.test(ua)) {
    return "desktop-chromium";
  }
  return null;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    globalDeferredPrompt = event as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export interface UsePwaInstallResult {
  canInstall: boolean;
  mode: PwaInstallMode;
  manualPlatform: ManualInstallPlatform | null;
  install: () => Promise<boolean>;
}

/**
 * Detecta si la PWA puede instalarse y expone el flujo correspondiente.
 * @returns Estado de instalación, modo y función `install`.
 */
export function usePwaInstall(): UsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt,
  );
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);
  const isIos = isIosDevice();
  const manualPlatform = getManualInstallPlatform();

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsStandalone(true);
      return;
    }

    const handlePromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(handlePromptChange);
    setDeferredPrompt(globalDeferredPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      promptListeners.delete(handlePromptChange);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const mode: PwaInstallMode = isStandalone
    ? null
    : deferredPrompt
      ? "native"
      : isIos
        ? "ios-instructions"
        : manualPlatform
          ? "manual"
          : null;

  const install = useCallback(async () => {
    if (mode === "native" && deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        setIsStandalone(true);
        return true;
      }
      return false;
    }

    return false;
  }, [deferredPrompt, mode]);

  return {
    canInstall: mode !== null,
    mode,
    manualPlatform,
    install,
  };
}
