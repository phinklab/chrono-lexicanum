/**
 * Preview invite/session token — a custom HMAC-SHA256 scheme over a tiny
 * canonical payload. Used by three independent call sites that MUST agree
 * byte-for-byte:
 *   1. the local management console (browser, Web Crypto) — mints invite links;
 *   2. the redemption server action (`/login` Accept) — verifies invite tokens
 *      and mints the signed session cookie;
 *   3. the gate (`src/proxy.ts`) — verifies the session cookie on every request.
 *
 * No JWT library: the payload is three fields, so a hand-rolled HMAC over a
 * documented canonical encoding is honest and dependency-free (CLAUDE.md "no
 * new dependency without a session-log justification"). The cost — we own the
 * crypto correctness — is contained by (a) this written-down canonical spec and
 * (b) the round-trip regression test `scripts/test-preview-token.ts`.
 *
 * CANONICAL TOKEN FORMAT (the single source of truth both implementations
 * target):
 *
 *   payloadJson  = JSON.stringify({ typ, exp, jti })   // keys in THIS order
 *   headerB64    = base64url( utf8(payloadJson) )       // RFC 4648 §5, NO '='
 *   sigBytes     = HMAC_SHA256( key = utf8(secret), msg = utf8(headerB64) )
 *   sigB64       = base64url( sigBytes )                // RFC 4648 §5, NO '='
 *   token        = headerB64 + "." + sigB64
 *
 *   - `exp` is an absolute expiry in epoch SECONDS (integer).
 *   - `typ` is part of the SIGNED bytes (domain separation): an invite token
 *     ("invite") and a session cookie ("session") share the one key but are
 *     non-interchangeable — the gate accepts only "session", redemption only
 *     "invite". A recipient cannot paste their invite token into the cookie.
 *   - `jti` is a short, non-secret unique id — the join key between a minted
 *     link and its server-side activation row. (The human label is deliberately
 *     kept OUT of the token; it lives only in the local console.)
 *   - The HMAC is computed over the ASCII bytes of `headerB64` (NOT a
 *     re-serialization of the payload), so verification re-signs the received
 *     header bytes verbatim — any token whose two halves agree under the key
 *     verifies, which is exactly what makes browser↔server round-trip robust.
 *
 * Runtime: uses only `crypto.subtle`, `btoa`/`atob`, `TextEncoder`/`Decoder`
 * and `crypto.getRandomValues` — all globals in BOTH the proxy (edge) runtime
 * and Node route handlers (`src/lib/timingSafeEqual.ts` relies on exactly the
 * same primitive). This module imports nothing server-only, so the gate can
 * import it directly.
 */
import { timingSafeEqualStr } from "./timingSafeEqual";

export type PreviewTokenType = "invite" | "session";

export interface PreviewTokenPayload {
  /** Domain tag — signed, so invite tokens and session cookies don't cross over. */
  typ: PreviewTokenType;
  /** Absolute expiry, epoch SECONDS. */
  exp: number;
  /** Short non-secret unique id; the activation-row join key. */
  jti: string;
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

/** Canonical payload serialization — keys in the fixed order typ, exp, jti. */
function serializePayload(payload: PreviewTokenPayload): string {
  return JSON.stringify({ typ: payload.typ, exp: payload.exp, jti: payload.jti });
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

function isPayload(value: unknown): value is PreviewTokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    (o.typ === "invite" || o.typ === "session") &&
    typeof o.exp === "number" &&
    typeof o.jti === "string"
  );
}

/** Mint a signed token per the canonical spec above. */
export async function signPreviewToken(
  payload: PreviewTokenPayload,
  secret: string,
): Promise<string> {
  const headerB64 = bytesToBase64Url(enc.encode(serializePayload(payload)));
  const sigB64 = bytesToBase64Url(await hmacSha256(secret, headerB64));
  return `${headerB64}.${sigB64}`;
}

/**
 * Verify a token. Returns the payload iff (signature valid) AND (typ matches
 * the expected domain) AND (exp is strictly in the future); otherwise null.
 * Fails closed — a malformed, tampered, expired or wrong-`typ` token is null,
 * never a thrown error and never a pass.
 */
export async function verifyPreviewToken(
  token: string | undefined | null,
  secret: string | undefined | null,
  expectedType: PreviewTokenType,
): Promise<PreviewTokenPayload | null> {
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
  if (payload.typ !== expectedType) return null;
  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds()) return null;

  return payload;
}

/** A short, non-secret unique id (16 hex chars from 8 random bytes). */
export function newJti(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}
