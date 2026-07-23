/** Server-only setter for the signed `cl-preview` session cookie. */
import "server-only";
import { cookies } from "next/headers";
import { PREVIEW_COOKIE, previewSecret } from "./previewGate";
import { signPreviewSessionToken } from "./previewToken";

/** Session length for the shared password login: 30 days. */
export const PASSWORD_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const IS_PROD = process.env.NODE_ENV === "production";

async function setPreviewCookie(value: string, maxAgeSeconds: number): Promise<void> {
  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: Math.floor(maxAgeSeconds),
  });
}

/**
 * Set the signed preview cookie. Returns false when the deployment has no
 * signing secret so the login action can fail closed without issuing an
 * unsigned credential.
 */
export async function setSignedSessionCookie(): Promise<boolean> {
  const secret = previewSecret();
  if (!secret) return false;

  const exp = Math.floor(Date.now() / 1000) + PASSWORD_SESSION_TTL_SECONDS;
  const token = await signPreviewSessionToken({ exp }, secret);
  await setPreviewCookie(token, PASSWORD_SESSION_TTL_SECONDS);
  return true;
}
