/**
 * @file site-metric-bar-colors.ts
 * @description Colores de barras del gráfico de tickets abiertos por sede.
 */
import type { CSSProperties } from "react";

const COMPANY_CODE_VARIANTS: Record<string, string> = {
  FG: "fg",
  "8A": "8a",
  GR: "gr",
  EM: "em",
  CP: "cp",
  PH: "ph",
  RM: "rm",
};

const VARIANT_BACKGROUNDS: Record<string, string> = {
  fg: "#2563eb",
  "8a": "#eab308",
  gr: "#16a34a",
  em: "repeating-linear-gradient(-45deg, #2563eb, #2563eb 5px, #22c55e 5px, #22c55e 10px)",
  cp: "#ea580c",
  ph: "#38bdf8",
  rm: "hsl(357, 67%, 42%)",
  palomas: "#8a9a7b",
  irvine: "#9490a8",
  lavatt: "#a39485",
  club12: "#7a8799",
  yvoty: "#6d9494",
  default: "#94a3b8",
};

/**
 * Devuelve el estilo CSS de fondo para la barra de una sede.
 * @param name - Nombre o ruta de la sede.
 * @returns Propiedad `background` para el elemento de barra.
 */
export function getSiteMetricBarStyle(name: string): CSSProperties {
  const variant = resolveSiteMetricBarVariant(name);
  return {
    background: VARIANT_BACKGROUNDS[variant] ?? VARIANT_BACKGROUNDS.default,
  };
}

/**
 * Resuelve la variante de color según tokens y nombres conocidos.
 * @param name - Nombre de la sede.
 * @returns Clave de variante de color.
 */
function resolveSiteMetricBarVariant(name: string): string {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("hacienda las palomas") || normalized.includes("las palomas")) {
    return "palomas";
  }
  if (normalized.includes("irvine")) {
    return "irvine";
  }
  if (normalized.includes("lavatt")) {
    return "lavatt";
  }
  if (normalized.includes("club 12") || normalized.includes("12 de octubre")) {
    return "club12";
  }
  if (normalized.includes("yvoty") || normalized.includes("lp e")) {
    return "yvoty";
  }
  if (normalized.includes("conpasa")) {
    return "cp";
  }
  if (normalized.includes("global") || /\bph\b/.test(normalized)) {
    return "ph";
  }

  for (const token of extractCompanyTokens(name)) {
    const variant = COMPANY_CODE_VARIANTS[token];
    if (variant) return variant;
  }

  return "default";
}

/**
 * Extrae tokens de empresa del nombre de sede.
 * @param name - Nombre de la sede.
 * @returns Tokens en mayúsculas detectados.
 */
function extractCompanyTokens(name: string): string[] {
  const tokens = new Set<string>();

  for (const segment of name.split(/\s*>\s*|\s*\/\s*/)) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase();
    if (firstWord) tokens.add(firstWord);

    const compactCode = trimmed.match(/^([A-Za-z]{1,3}\d?)\b/)?.[1]?.toUpperCase();
    if (compactCode) tokens.add(compactCode);
  }

  return [...tokens];
}
