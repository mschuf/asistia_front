/**
 * @file mrz.ts
 * @description Utilidades para detectar y parsear MRZ (ICAO 9303) desde texto OCR.
 */

const CHECKSUM_WEIGHTS = [7, 3, 1] as const;

export interface ParsedMrz {
  documentNumber: string;
  fullName: string;
  rawLines: string[];
}

interface ParsedMrzCandidate extends ParsedMrz {
  score: number;
}

/** Convierte un carácter MRZ a su valor numérico para checksum ICAO. */
function mrzCharValue(char: string): number {
  if (char >= "0" && char <= "9") return Number(char);
  if (char >= "A" && char <= "Z") return char.charCodeAt(0) - 55;
  if (char === "<") return 0;
  return 0;
}

/** Calcula checksum ICAO (ponderación 7-3-1). */
function computeMrzChecksum(value: string): number {
  let sum = 0;
  for (let index = 0; index < value.length; index += 1) {
    const weight = CHECKSUM_WEIGHTS[index % CHECKSUM_WEIGHTS.length] ?? 1;
    sum += mrzCharValue(value[index] ?? "<") * weight;
  }
  return sum % 10;
}

/** Valida que el dígito de control coincida con el valor esperado. */
function isValidCheckDigit(value: string, checkDigit: string): boolean {
  if (!/^[0-9<]$/.test(checkDigit)) return false;
  const expected = computeMrzChecksum(value);
  const actual = checkDigit === "<" ? 0 : Number(checkDigit);
  return expected === actual;
}

/** Deja solo caracteres válidos de MRZ (A-Z, 0-9, <). */
function normalizeMrzLine(line: string): string {
  return line.toUpperCase().replace(/[^A-Z0-9<]/g, "");
}

/** Ajusta una línea al largo esperado del formato (recorta o rellena con <). */
function clampToLength(line: string, length: number): string {
  if (line.length === length) return line;
  if (line.length > length) return line.slice(0, length);
  return line.padEnd(length, "<");
}

/** Limpia rellenos y caracteres extraños del número de documento detectado. */
function normalizeDocumentNumber(raw: string): string {
  return raw.replace(/</g, "").replace(/[^A-Z0-9]/g, "");
}

/** Normaliza espacios duplicados o extremos. */
function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Presenta el nombre en formato legible para UI. */
function formatPersonName(value: string): string {
  return normalizeSpaces(value)
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`;
    })
    .join(" ");
}

/** Parsea nombre MRZ (apellido<<nombres) y lo devuelve como "Nombres Apellido". */
function parseName(nameField: string): string {
  const [primary = "", ...rest] = nameField.split("<<");
  const secondary = rest.join("<<");
  const surname = normalizeSpaces(primary.replace(/</g, " "));
  const givenNames = normalizeSpaces(secondary.replace(/</g, " "));
  const combined = givenNames && surname ? `${givenNames} ${surname}` : givenNames || surname;
  return formatPersonName(combined);
}

/** Parser para MRZ TD1 (3 líneas x 30 caracteres, típico de ID cards). */
function parseTd1(lines: string[]): ParsedMrzCandidate | null {
  if (lines.length !== 3) return null;
  const [rawLine1, rawLine2, rawLine3] = lines.map((line) => clampToLength(line, 30));
  if (!(rawLine1.includes("<") && rawLine2.includes("<") && rawLine3.includes("<"))) return null;

  const documentField = rawLine1.slice(5, 14);
  const documentCheck = rawLine1[14] ?? "<";
  const optionalDocumentField = rawLine1.slice(15, 30);
  const birthField = rawLine2.slice(0, 6);
  const birthCheck = rawLine2[6] ?? "<";
  const expiryField = rawLine2.slice(8, 14);
  const expiryCheck = rawLine2[14] ?? "<";
  const compositeCheck = rawLine2[29] ?? "<";
  const fullName = parseName(rawLine3);

  const primaryDocument = normalizeDocumentNumber(documentField);
  const optionalDocument = normalizeDocumentNumber(optionalDocumentField);
  const documentNumber =
    primaryDocument.length >= 6 ? primaryDocument : optionalDocument.length >= 6 ? optionalDocument : "";
  if (!documentNumber || !fullName) return null;

  let score = 1;
  // El score favorece candidatos con más checks válidos para reducir falsos positivos OCR.
  if (isValidCheckDigit(documentField, documentCheck)) score += 3;
  if (isValidCheckDigit(birthField, birthCheck)) score += 1;
  if (isValidCheckDigit(expiryField, expiryCheck)) score += 1;

  const compositePayload =
    rawLine1.slice(5, 30) + rawLine2.slice(0, 7) + rawLine2.slice(8, 15) + rawLine2.slice(18, 29);
  if (isValidCheckDigit(compositePayload, compositeCheck)) score += 2;

  return {
    documentNumber,
    fullName,
    rawLines: [rawLine1, rawLine2, rawLine3],
    score,
  };
}

/** Parser para MRZ TD2 (2 líneas x 36 caracteres). */
function parseTd2(lines: string[]): ParsedMrzCandidate | null {
  if (lines.length !== 2) return null;
  const [rawLine1, rawLine2] = lines.map((line) => clampToLength(line, 36));
  if (!(rawLine1.includes("<") && rawLine2.includes("<"))) return null;

  const documentField = rawLine2.slice(0, 9);
  const documentCheck = rawLine2[9] ?? "<";
  const birthField = rawLine2.slice(13, 19);
  const birthCheck = rawLine2[19] ?? "<";
  const expiryField = rawLine2.slice(21, 27);
  const expiryCheck = rawLine2[27] ?? "<";
  const compositeCheck = rawLine2[35] ?? "<";
  const fullName = parseName(rawLine1.slice(5));
  const documentNumber = normalizeDocumentNumber(documentField);
  if (!documentNumber || !fullName) return null;

  let score = 1;
  if (isValidCheckDigit(documentField, documentCheck)) score += 3;
  if (isValidCheckDigit(birthField, birthCheck)) score += 1;
  if (isValidCheckDigit(expiryField, expiryCheck)) score += 1;

  const compositePayload = rawLine2.slice(0, 10) + rawLine2.slice(13, 20) + rawLine2.slice(21, 35);
  if (isValidCheckDigit(compositePayload, compositeCheck)) score += 2;

  return {
    documentNumber,
    fullName,
    rawLines: [rawLine1, rawLine2],
    score,
  };
}

/** Parser para MRZ TD3 (2 líneas x 44 caracteres, pasaportes). */
function parseTd3(lines: string[]): ParsedMrzCandidate | null {
  if (lines.length !== 2) return null;
  const [rawLine1, rawLine2] = lines.map((line) => clampToLength(line, 44));
  if (!(rawLine1.includes("<") && rawLine2.includes("<"))) return null;

  const documentField = rawLine2.slice(0, 9);
  const documentCheck = rawLine2[9] ?? "<";
  const birthField = rawLine2.slice(13, 19);
  const birthCheck = rawLine2[19] ?? "<";
  const expiryField = rawLine2.slice(21, 27);
  const expiryCheck = rawLine2[27] ?? "<";
  const personalNumber = rawLine2.slice(28, 42);
  const personalNumberCheck = rawLine2[42] ?? "<";
  const compositeCheck = rawLine2[43] ?? "<";
  const fullName = parseName(rawLine1.slice(5));
  const documentNumber = normalizeDocumentNumber(documentField);
  if (!documentNumber || !fullName) return null;

  let score = 1;
  if (isValidCheckDigit(documentField, documentCheck)) score += 3;
  if (isValidCheckDigit(birthField, birthCheck)) score += 1;
  if (isValidCheckDigit(expiryField, expiryCheck)) score += 1;
  if (isValidCheckDigit(personalNumber, personalNumberCheck)) score += 1;

  const compositePayload =
    rawLine2.slice(0, 10) + rawLine2.slice(13, 20) + rawLine2.slice(21, 43);
  if (isValidCheckDigit(compositePayload, compositeCheck)) score += 2;

  return {
    documentNumber,
    fullName,
    rawLines: [rawLine1, rawLine2],
    score,
  };
}

/** Extrae líneas candidatas con estructura MRZ desde texto OCR crudo. */
function extractCandidateLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeMrzLine(line))
    .filter((line) => line.length >= 24 && line.includes("<"));
}

/** Score mínimo aceptado para considerar una lectura MRZ confiable. */
export const MRZ_MIN_SCORE = 4;

/**
 * Devuelve el mejor candidato MRZ con su score, para comparar lecturas
 * entre varios frames (ráfaga) y quedarse con la más confiable.
 */
export function findBestMrzCandidate(text: string): ParsedMrzCandidate | null {
  const candidateLines = extractCandidateLines(text);
  if (candidateLines.length === 0) return null;

  const candidates: ParsedMrzCandidate[] = [];

  // Se prueban todos los bloques posibles para tolerar OCR con ruido o líneas extra.
  for (let index = 0; index <= candidateLines.length - 3; index += 1) {
    const td1 = parseTd1(candidateLines.slice(index, index + 3));
    if (td1) candidates.push(td1);
  }

  for (let index = 0; index <= candidateLines.length - 2; index += 1) {
    const pair = candidateLines.slice(index, index + 2);
    const td2 = parseTd2(pair);
    if (td2) candidates.push(td2);
    const td3 = parseTd3(pair);
    if (td3) candidates.push(td3);
  }

  if (candidates.length === 0) return null;
  // Se elige el mejor score; mínimo MRZ_MIN_SCORE para evitar lecturas débiles.
  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < MRZ_MIN_SCORE) return null;

  return best;
}

/**
 * Intenta detectar y parsear una MRZ desde el texto OCR.
 */
export function parseMrzFromText(text: string): ParsedMrz | null {
  const best = findBestMrzCandidate(text);
  if (!best) return null;

  return {
    documentNumber: best.documentNumber,
    fullName: best.fullName,
    rawLines: best.rawLines,
  };
}
