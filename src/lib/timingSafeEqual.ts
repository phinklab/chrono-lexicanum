/**
 * Constant-time string comparison for low-volume secret checks — the
 * Basic-Auth credentials in `src/proxy.ts` and the `/api/revalidate` bearer
 * token. A plain `===` short-circuits on the first differing character, which
 * is a (theoretical, HTTPS-jittered) timing oracle toward the secret
 * (Report 144 § S.1a).
 *
 * Strategy: SHA-256 both inputs first — the fixed 32-byte digests sidestep
 * the equal-length requirement of classic `timingSafeEqual` AND hide the
 * secret's length — then XOR-fold the digests with no early exit. Hashing
 * alone would not be enough: a leaky compare of the digests lets an attacker
 * learn the digest byte-by-byte and brute-force the secret offline. Web
 * Crypto (`crypto.subtle`) is a global in the proxy runtime and in Node
 * route handlers alike, so this one helper serves both callers.
 */
export async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const bytesA = new Uint8Array(hashA);
  const bytesB = new Uint8Array(hashB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}
