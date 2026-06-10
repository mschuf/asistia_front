/**
 * @file useEscapeKey.ts
 * @description Hook para registrar un listener global de la tecla Escape.
 */
import { useEffect } from "react";

/**
 * Escucha la tecla Escape mientras `enabled` es verdadero.
 * @param enabled - Activa o desactiva el listener.
 * @param onEscape - Callback invocado al presionar Escape.
 * @returns void
 */
export default function useEscapeKey(enabled: boolean, onEscape?: () => void): void {
  useEffect(() => {
    if (!enabled) return undefined;

    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled, onEscape]);
}
