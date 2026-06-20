"use server";

import { redirect } from "next/navigation";
import { PREVIEW_PASS, PREVIEW_USER, previewSecret } from "@/lib/previewGate";
import { verifyPreviewToken } from "@/lib/previewToken";
import {
  PASSWORD_SESSION_TTL_SECONDS,
  recordActivation,
  setLegacySessionCookie,
  setSignedSessionCookie,
} from "@/lib/previewSession";

/**
 * The maintainer's password login. On correct creds it mints the SAME signed
 * session-cookie shape the gate verifies (Brief 163) — with a long 30-day
 * expiry of its own — so there is exactly one cookie shape whenever the secret
 * is set. When the secret is unset it sets the legacy unsigned `cl-preview="1"`
 * cookie (the gate's degrade path then accepts it), so Philipp can always get in.
 */
export async function login(formData: FormData): Promise<void> {
  const user = formData.get("user");
  const pass = formData.get("pass");

  if (user !== PREVIEW_USER || pass !== PREVIEW_PASS) {
    redirect("/login?error=1");
  }

  if (previewSecret()) {
    const exp = Math.floor(Date.now() / 1000) + PASSWORD_SESSION_TTL_SECONDS;
    await setSignedSessionCookie(exp);
  } else {
    await setLegacySessionCookie();
  }
  redirect("/");
}

/**
 * Redeem an invite link from the /login "Accept invitation" state. Re-verifies
 * the token AUTHORITATIVELY (signature + `typ === "invite"` + `exp` in the
 * future) — the page's render-time check is not trusted here. On success it
 * mints the signed session cookie carrying the invite's OWN absolute `exp`
 * (so re-clicking a link can never extend access past its baked expiry), records
 * the activation best-effort, then lands the visitor on `/`. On any failure —
 * bad/expired/wrong-`typ` token, or the secret being unset (redemption disabled)
 * — it bounces back to /login with the token so the page renders the
 * invalid/expired state; access is never granted.
 */
export async function acceptInvite(formData: FormData): Promise<void> {
  const raw = formData.get("invite");
  const token = typeof raw === "string" ? raw : "";
  const secret = previewSecret();
  const payload = secret ? await verifyPreviewToken(token, secret, "invite") : null;

  if (!payload) {
    if (!secret) {
      console.error(
        "[preview-invites] invite redemption attempted while PREVIEW_INVITE_SECRET is unset — disabled.",
      );
    }
    redirect(`/login?invite=${encodeURIComponent(token)}`);
  }

  await setSignedSessionCookie(payload.exp);
  // Best-effort observability; cannot block access (own try/catch inside).
  await recordActivation(payload.jti);
  redirect("/");
}
