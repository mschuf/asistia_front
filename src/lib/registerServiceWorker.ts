/**
 * @file registerServiceWorker.ts
 * @description Registro del service worker PWA tras la carga de la ventana.
 */

/**
 * Registra `/sw.js` cuando el navegador soporta service workers.
 * @returns void; no hace nada en SSR o navegadores sin soporte.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[asistIA] No se pudo registrar el service worker", error);
    });
  });
}
