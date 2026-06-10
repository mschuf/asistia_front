/**
 * @file useTokenTimer.ts
 * @description Hook que dispara un callback cuando expira un token JWT.
 */
import { useEffect, useRef } from "react";

/**
 * Ejecuta `onExpired` al alcanzar `expiresAt` o inmediatamente si ya venció.
 * @param expiresAt - Timestamp Unix de expiración en ms, o null para desactivar.
 * @param onExpired - Callback al expirar el token.
 * @returns void
 */
export function useTokenTimer(expiresAt: number | null, onExpired: () => void): void {
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    if (!expiresAt) return;

    if (Date.now() >= expiresAt) {
      onExpiredRef.current();
      return;
    }

    const id = setInterval(() => {
      if (Date.now() >= expiresAt) {
        onExpiredRef.current();
        clearInterval(id);
      }
    }, 1_000);

    return () => clearInterval(id);
  }, [expiresAt]);
}
