/**
 * Preview gate — shared constants for src/proxy.ts (route gate) and the
 * /login server action.
 *
 * Credential defaults are deliberately committed (public repo — this is a
 * soft lock against drive-by visitors pre-launch, not a vault); both are
 * overridable per environment without a code change. `PREVIEW_GATE=off`
 * disables the gate entirely (launch kill-switch).
 *
 * Edge-safe: this module reads only `process.env` and is imported by the proxy
 * (edge runtime). It must NOT import `next/headers`, the DB, or anything
 * server-only — the cookie-setting + activation side lives in
 * `src/lib/previewSession.ts` (server-only), and the crypto lives in
 * `src/lib/previewToken.ts` (also edge-safe).
 */

export const PREVIEW_COOKIE = "cl-preview";

export const PREVIEW_USER = process.env.PREVIEW_USER ?? "PreviewAccount";
export const PREVIEW_PASS = process.env.PREVIEW_PASS ?? "lexipreview";

export const previewGateEnabled = () =>
  process.env.NODE_ENV === "production" && process.env.PREVIEW_GATE !== "off";

/**
 * The HMAC signing secret for invite links and the signed session cookie.
 * High-entropy, never committed; load-bearing (unlike the soft-lock
 * password defaults above). When set, links/cookies are signed and the gate
 * verifies signature + `exp`; rotating it invalidates every outstanding link
 * AND session at once (the only revocation lever).
 *
 * An empty string counts as UNSET — the whole feature then degrades to legacy
 * behaviour (gate uses the legacy `cl-preview === "1"` presence check, password
 * login sets the legacy unsigned cookie, invite redemption is disabled). See
 * the proxy gate and `src/lib/previewSession.ts` for the two halves of the
 * degrade path.
 */
export const previewSecret = (): string | undefined =>
  process.env.PREVIEW_INVITE_SECRET || undefined;
