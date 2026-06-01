const PEM_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_FOOTER = "-----END PUBLIC KEY-----";

let cachedPublicKeyPem: string | null = null;
let cachedCryptoKey: CryptoKey | null = null;

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

async function importPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
}

export async function loadAuthPublicKey(fetchPem: () => Promise<string>): Promise<void> {
  const pem = await fetchPem();
  cachedPublicKeyPem = pem;
  cachedCryptoKey = await importPublicKey(pem);
}

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

export function clearAuthPublicKeyCache(): void {
  cachedPublicKeyPem = null;
  cachedCryptoKey = null;
}
