/**
 * Regression guard for the signed preview-session cookie.
 *
 * Pins the remaining contract after invite removal: a freshly signed session
 * verifies, while expired, tampered, wrong-secret, former invite, legacy and
 * malformed values all fail closed.
 *
 * Run: `npm run test:preview-token`
 */
import {
  signPreviewSessionToken,
  verifyPreviewSessionToken,
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

async function signHistoricalPayload(payload: object): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of encoded) binary += String.fromCharCode(byte);
  const header = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(header)),
  );
  let signatureBinary = "";
  for (const byte of signature) signatureBinary += String.fromCharCode(byte);
  const encodedSignature = btoa(signatureBinary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${encodedSignature}`;
}

async function main(): Promise<void> {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const past = Math.floor(Date.now() / 1000) - 10;

  console.log("Preview-session token:");

  const sessionToken = await signPreviewSessionToken({ exp: future }, SECRET);
  const verified = await verifyPreviewSessionToken(sessionToken, SECRET);
  check(
    "signed session verifies and preserves expiry",
    verified?.exp === future,
  );

  const expired = await signPreviewSessionToken({ exp: past }, SECRET);
  check("expired token rejected", (await verifyPreviewSessionToken(expired, SECRET)) === null);

  const flip =
    sessionToken.slice(0, -1) + (sessionToken.endsWith("A") ? "B" : "A");
  check(
    "tampered signature rejected",
    (await verifyPreviewSessionToken(flip, SECRET)) === null,
  );

  check(
    "wrong secret rejected",
    (await verifyPreviewSessionToken(sessionToken, "some-other-secret")) === null,
  );

  const historicalInvite = await signHistoricalPayload({
    typ: "invite",
    exp: future,
    jti: "legacy-invite",
  });
  check(
    "historical invite token rejected as a session",
    (await verifyPreviewSessionToken(historicalInvite, SECRET)) === null,
  );

  const historicalSession = await signHistoricalPayload({
    typ: "session",
    exp: future,
    jti: "legacy-session",
  });
  check(
    "historical signed session remains valid during env migration",
    (await verifyPreviewSessionToken(historicalSession, SECRET))?.exp === future,
  );

  check(
    'legacy "1" cookie rejected',
    (await verifyPreviewSessionToken("1", SECRET)) === null,
  );
  check("empty token rejected", (await verifyPreviewSessionToken("", SECRET)) === null);
  check(
    "no-dot token rejected",
    (await verifyPreviewSessionToken("abcdef", SECRET)) === null,
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
