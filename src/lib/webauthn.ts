import { BIO_KEY } from "./store";

function b64u(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isBiometricSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function enrollBiometric(username: string): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge as BufferSource,
        rp: { name: "DNS Lock" },
        user: { id: userId as BufferSource, name: username, displayName: username },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { userVerification: "required" },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    localStorage.setItem(BIO_KEY, b64u(cred.rawId));
    return true;
  } catch {
    return false;
  }
}

export async function verifyBiometric(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  const id = localStorage.getItem(BIO_KEY);
  if (!id) return false;
  try {
    const raw = Uint8Array.from(atob(id.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge as BufferSource,
        allowCredentials: [{ id: raw as BufferSource, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export function hasBiometricEnrollment(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem(BIO_KEY);
}
