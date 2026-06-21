// Encrypted local storage using Web Crypto (AES-GCM + PBKDF2)

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(password) as BufferSource, "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptJSON(password: string, data: unknown): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(JSON.stringify(data)) as BufferSource);
  return JSON.stringify({ s: b64(salt), i: b64(iv), c: b64(ct) });
}

export async function decryptJSON<T>(password: string, payload: string): Promise<T> {
  const { s, i, c } = JSON.parse(payload);
  const key = await deriveKey(password, unb64(s));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(i) as BufferSource }, key, unb64(c) as BufferSource);
  return JSON.parse(dec.decode(pt));
}

export async function hashPassword(password: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode("dns-lock:" + password) as BufferSource);
  return b64(h);
}
