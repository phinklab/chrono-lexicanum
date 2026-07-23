/**
 * Preview-session token — a custom HMAC-SHA256 scheme over a tiny canonical
 * payload. The password-login action signs the cookie and the proxy verifies
 * it on every gated request.
 *
 * No JWT library: the payload is two fixed fields, so a hand-rolled HMAC over a
 * documented canonical encoding stays honest and dependency-free. The
 * regression guard is `scripts/test-preview-token.ts`.
 *
 * CANONICAL TOKEN FORMAT:
 *
 *   payloadJson  = JSON.stringify({ typ: "session", exp })
 *   headerB64    = base64url( utf8(payloadJson) )       // RFC 4648 §5, NO '='
 *   sigBytes     = HMAC_SHA256( key = utf8(secret), msg = utf8(headerB64) )
 *   sigB64       = base64url( sigBytes )                // RFC 4648 §5, NO '='
 *   token        = headerB64 + "." + sigB64
 *
 *   - `typ` is fixed by the signer, not supplied by callers. Keeping this
 *     domain tag rejects previously issued invite tokens while the old env
 *     secret remains available as a deployment-migration fallback.
 *   - `exp` is an absolute expiry in epoch SECONDS (integer).
 *   - The HMAC is computed over the ASCII bytes of `headerB64` (NOT a
 *     re-serialization of the payload), so verification re-signs the received
 *     header bytes verbatim.
 *
 * Runtime: uses only `crypto.subtle`, `btoa`/`atob` and
 * `TextEncoder`/`TextDecoder` — globals in both the proxy runtime and Node
 * route handlers. This module imports nothing server-only, so the gate can
 * import it directly.
 */
import { timingSafeEqualStr } from "./timingSafeEqual";

export interface PreviewSessionPayload {
  /** Absolute expiry, epoch SECONDS. */
  exp: number;
}

interface SignedPreviewSessionPayload extends PreviewSessionPayload {
  typ: "session";
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** base64url (RFC 4648 §5), no padding — the form the canonical spec mandates. */
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const pad = (4 - (value.length % 4)) % 4;
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Canonical payload serialization. */
function serializePayload(payload: PreviewSessionPayload): string {
  return JSON.stringify({ typ: "session", exp: payload.exp });
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

function isPayload(value: unknown): value is SignedPreviewSessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return o.typ === "session" && typeof o.exp === "number";
}

/** Mint a signed token per the canonical spec above. */
export async function signPreviewSessionToken(
  payload: PreviewSessionPayload,
  secret: string,
): Promise<string> {
  const headerB64 = bytesToBase64Url(enc.encode(serializePayload(payload)));
  const sigB64 = bytesToBase64Url(await hmacSha256(secret, headerB64));
  return `${headerB64}.${sigB64}`;
}

/**
 * Verify a session token. Returns the payload iff the signature is valid and
 * `exp` is strictly in the future; otherwise null.
 * Fails closed — a malformed, tampered or expired token is null, never a
 * thrown error and never a pass.
 */
export async function verifyPreviewSessionToken(
  token: string | undefined | null,
  secret: string | undefined | null,
): Promise<PreviewSessionPayload | null> {
  if (!token || !secret) return null;

  const dot = token.indexOf(".");
  // Exactly one separator — reject "1" (legacy cookie), empty halves, ".." etc.
  if (dot <= 0 || dot >= token.length - 1) return null;
  if (token.indexOf(".", dot + 1) !== -1) return null;

  const headerB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const expectedSigB64 = bytesToBase64Url(await hmacSha256(secret, headerB64));
  // Constant-time compare (reuses the SHA-256-fold helper) — a leaky `===`
  // would turn signature verification into a forgery oracle.
  if (!(await timingSafeEqualStr(sigB64, expectedSigB64))) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(dec.decode(base64UrlToBytes(headerB64)));
  } catch {
    return null;
  }
  if (!isPayload(payload)) return null;
  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds()) return null;

  return { exp: payload.exp };
}
