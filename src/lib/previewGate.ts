/**
 * Preview gate — shared environment access for src/proxy.ts (route gate) and
 * the /login server action.
 *
 * `PREVIEW_GATE=off` disables the gate entirely (launch kill-switch).
 * Otherwise the shared credentials and signing secret must all come from the
 * deployment environment. Missing values fail closed; there are no committed
 * credential defaults and no unsigned-cookie fallback.
 *
 * Edge-safe: this module reads only `process.env` and is imported by the proxy
 * runtime. It must NOT import `next/headers` or anything server-only.
 */

export const PREVIEW_COOKIE = "cl-preview";

export interface PreviewCredentials {
  user: string;
  pass: string;
}

/** The one shared preview login. Empty or incomplete configuration is unset. */
export function previewCredentials(): PreviewCredentials | null {
  const user = process.env.PREVIEW_USER;
  const pass = process.env.PREVIEW_PASS;
  return user && pass ? { user, pass } : null;
}

export const previewGateEnabled = () =>
  process.env.NODE_ENV === "production" && process.env.PREVIEW_GATE !== "off";

/**
 * HMAC signing secret for the signed preview-session cookie. The session-first
 * name is canonical; the former invite-secret name remains a temporary
 * compatibility fallback so the deployment can move without a lockout.
 * Rotating the effective secret invalidates every active preview session.
 */
export const previewSecret = (): string | undefined =>
  process.env.PREVIEW_SESSION_SECRET ||
  process.env.PREVIEW_INVITE_SECRET ||
  undefined;
