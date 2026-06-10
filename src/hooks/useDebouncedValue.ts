/**
 * @file useDebouncedValue.ts
 * @description Hook que retrasa la propagación de un valor hasta que deje de cambiar.
 */
import { useEffect, useState } from "react";

/**
 * Devuelve una versión debounced del valor tras el retardo indicado.
 * @param value - Valor de entrada a estabilizar.
 * @param delayMs - Milisegundos de espera antes de actualizar (default 300).
 * @returns Valor debounced.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
