/**
 * @file useTheme.ts
 * @description Hook y utilidades para tema claro/oscuro con persistencia en localStorage.
 */
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "ti-cket-theme";

/**
 * Lee el tema inicial desde localStorage o devuelve `light` en SSR.
 * @returns Tema almacenado o `light` por defecto.
 */
function readInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

/**
 * Aplica la clase `dark` en `document.documentElement` según el tema guardado.
 * @returns void
 */
export function initTheme(): void {
  document.documentElement.classList.toggle("dark", readInitialTheme() === "dark");
}

/**
 * Gestiona el tema de la aplicación y lo persiste en localStorage.
 * @returns Objeto con `theme` actual y función `toggleTheme`.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
