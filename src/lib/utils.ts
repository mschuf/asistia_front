/**
 * @file utils.ts
 * @description Utilidades generales de clases CSS, HTML y normalización de texto.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales con `clsx` y resuelve conflictos de Tailwind con `twMerge`.
 * @param inputs - Lista de clases, objetos condicionales o arrays de clases.
 * @returns Cadena final de clases CSS fusionadas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae texto plano de un fragmento HTML eliminando etiquetas.
 * @param html - Cadena HTML de entrada.
 * @returns Texto visible sin etiquetas ni espacios extremos; cadena vacía si no hay contenido.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  const element = document.createElement("div");
  element.innerHTML = html;
  return element.textContent?.trim() ?? "";
}

/**
 * Normaliza texto para búsquedas: minúsculas, sin acentos y sin espacios extremos.
 * @param value - Valor arbitrario a normalizar.
 * @returns Texto normalizado listo para comparación insensible a acentos.
 */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
