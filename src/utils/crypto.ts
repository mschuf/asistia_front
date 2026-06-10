/**
 * @file crypto.ts
 * @description Utilidades de cifrado RSA-OAEP para autenticación con clave pública del backend.
 */
const PEM_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_FOOTER = "-----END PUBLIC KEY-----";

let cachedPublicKeyPem: string | null = null;
let cachedCryptoKey: CryptoKey | null = null;

/**
 * Convierte una clave pública PEM a `ArrayBuffer` para Web Crypto API.
 * @param pem - Clave pública en formato PEM.
 * @returns Buffer binario con la clave decodificada.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(PEM_HEADER, "")
    .replace(PEM_FOOTER, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

/**
 * Importa una clave pública RSA-OAEP desde PEM para operaciones de cifrado.
 * @param pem - Clave pública en formato PEM.
 * @returns Clave criptográfica usable con `crypto.subtle.encrypt`.
 * @throws Propaga errores de `crypto.subtle.importKey` si el PEM es inválido.
 */
async function importPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
}

/**
 * Obtiene y cachea la clave pública de autenticación del servidor.
 * @param fetchPem - Función que devuelve el PEM desde el backend.
 * @returns Promesa que resuelve cuando la clave queda lista en caché.
 * @throws Propaga errores de red o de importación de la clave.
 */
export async function loadAuthPublicKey(fetchPem: () => Promise<string>): Promise<void> {
  const pem = await fetchPem();
  cachedPublicKeyPem = pem;
  cachedCryptoKey = await importPublicKey(pem);
}

/**
 * Cifra la contraseña en texto plano con la clave pública cacheada.
 * @param plainPassword - Contraseña sin cifrar del usuario.
 * @returns Contraseña cifrada codificada en Base64.
 * @throws {Error} Si la clave pública no fue cargada previamente.
 * @throws Propaga errores de `crypto.subtle.encrypt`.
 */
export async function encryptPassword(plainPassword: string): Promise<string> {
  if (!cachedCryptoKey || !cachedPublicKeyPem) {
    throw new Error("La clave pública de autenticación no está cargada.");
  }

  const encoded = new TextEncoder().encode(plainPassword);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cachedCryptoKey, encoded);
  const bytes = new Uint8Array(encrypted);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Limpia la clave pública y el material criptográfico en caché de memoria.
 * @returns void
 */
export function clearAuthPublicKeyCache(): void {
  cachedPublicKeyPem = null;
  cachedCryptoKey = null;
}
