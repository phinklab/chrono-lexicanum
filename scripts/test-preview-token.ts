/**
 * Round-trip regression guard for the preview invite/session token (Brief 163).
 *
 * The signed-token scheme is implemented TWICE — once in the server lib
 * (`src/lib/previewToken.ts`, imported below) and once, by hand, in the browser
 * console (`scripts/preview-console/template.html`). They must agree
 * byte-for-byte or a link minted in the console won't verify server-side. This
 * test pins the canonical format by:
 *
 *   1. Re-implementing the BROWSER algorithm independently here (the `btoa`-based
 *      path, mirroring the console) and asserting the SERVER verifier accepts
 *      its output — the actual cross-implementation round-trip.
 *   2. Asserting the SERVER signer's output is byte-identical to that independent
 *      browser-style reimplementation for the same payload (the strongest form
 *      of "both implementations agree").
 *   3. Domain separation: an invite token is rejected as a session and vice
 *      versa (the `typ` is part of the signed bytes).
 *   4. Expiry, tampering, and the legacy `"1"` cookie are all rejected (fail
 *      closed).
 *
 * Run: `npm run test:preview-token`
 */
import {
  newJti,
  signPreviewToken,
  verifyPreviewToken,
  type PreviewTokenPayload,
} from "@/lib/previewToken";

const SECRET = "test-secret-do-not-ship-0123456789";

let failures = 0;
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

// ── Independent "browser-style" reimplementation (mirrors template.html) ──────
const enc = new TextEncoder();
function browserBytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function browserHmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}
async function browserSign(
  payload: PreviewTokenPayload,
  secret: string,
): Promise<string> {
  const headerB64 = browserBytesToBase64Url(
    enc.encode(JSON.stringify({ typ: payload.typ, exp: payload.exp, jti: payload.jti })),
  );
  const sigB64 = browserBytesToBase64Url(await browserHmac(secret, headerB64));
  return `${headerB64}.${sigB64}`;
}

async function main(): Promise<void> {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const past = Math.floor(Date.now() / 1000) - 10;
  const jti = newJti();

  console.log("Preview-token round-trip:");

  // 1. Browser-minted invite token verifies server-side.
  const invitePayload: PreviewTokenPayload = { typ: "invite", exp: future, jti };
  const browserInvite = await browserSign(invitePayload, SECRET);
  const verified = await verifyPreviewToken(browserInvite, SECRET, "invite");
  check("browser-minted invite token verifies server-side", verified !== null);
  check(
    "verified payload round-trips (typ/exp/jti)",
    verified?.typ === "invite" && verified?.exp === future && verified?.jti === jti,
  );

  // 2. Server signer is byte-identical to the browser reimplementation.
  const serverInvite = await signPreviewToken(invitePayload, SECRET);
  check("server signer === browser signer (byte-for-byte)", serverInvite === browserInvite);

  // 3. Domain separation.
  const sessionToken = await signPreviewToken({ typ: "session", exp: future, jti }, SECRET);
  check(
    "session token rejected when verified as invite",
    (await verifyPreviewToken(sessionToken, SECRET, "invite")) === null,
  );
  check(
    "invite token rejected when verified as session (pasted-into-cookie attack)",
    (await verifyPreviewToken(browserInvite, SECRET, "session")) === null,
  );

  // 4a. Expiry.
  const expired = await signPreviewToken({ typ: "session", exp: past, jti }, SECRET);
  check("expired token rejected", (await verifyPreviewToken(expired, SECRET, "session")) === null);

  // 4b. Tampering — flip the last char of the signature.
  const flip = serverInvite.slice(0, -1) + (serverInvite.endsWith("A") ? "B" : "A");
  check("tampered signature rejected", (await verifyPreviewToken(flip, SECRET, "invite")) === null);

  // 4c. Wrong secret.
  check(
    "wrong secret rejected",
    (await verifyPreviewToken(serverInvite, "some-other-secret", "invite")) === null,
  );

  // 4d. Legacy "1" cookie + malformed shapes.
  check('legacy "1" cookie rejected', (await verifyPreviewToken("1", SECRET, "session")) === null);
  check("empty token rejected", (await verifyPreviewToken("", SECRET, "session")) === null);
  check(
    "no-dot token rejected",
    (await verifyPreviewToken("abcdef", SECRET, "session")) === null,
  );

  console.log("");
  if (failures > 0) {
    console.error(`FAILED: ${failures} assertion(s).`);
    process.exit(1);
  }
  console.log("All preview-token assertions passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
