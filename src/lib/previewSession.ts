/**
 * Preview session — the SERVER-ONLY half of the timed-preview-access
 * feature: set the `cl-preview` cookie and record an invite activation.
 *
 * Kept separate from `src/lib/previewGate.ts` (edge-safe constants) and
 * `src/lib/previewToken.ts` (edge-safe crypto) because this module imports
 * `next/headers` and the DB — neither of which the proxy (edge) may pull in.
 * `import "server-only"` makes a mistaken client/edge import a build error.
 */
import "server-only";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { previewInviteActivations } from "@/db/schema";
import { PREVIEW_COOKIE, previewSecret } from "./previewGate";
import { newJti, signPreviewToken } from "./previewToken";

/** Session length for the maintainer's password login (the invite path instead
 *  inherits the link's own baked `exp`). 30 days, matching the legacy behaviour. */
export const PASSWORD_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const IS_PROD = process.env.NODE_ENV === "production";

async function setPreviewCookie(value: string, maxAgeSeconds: number): Promise<void> {
  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    // Never outlive the embedded `exp`; clamp to >= 0 so an already-past exp
    // sets an immediately-expiring cookie rather than a negative maxAge.
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  });
}

/**
 * Set a signed `cl-preview = "session"` cookie carrying an absolute `exp`
 * (epoch seconds). This is the ONE cookie shape the gate verifies whenever the
 * signing secret is configured — both the password login and invite redemption
 * funnel through here. If the secret is somehow unset, falls back to the legacy
 * cookie so the caller can never strand the visitor.
 */
export async function setSignedSessionCookie(exp: number): Promise<void> {
  const secret = previewSecret();
  if (!secret) {
    await setLegacySessionCookie();
    return;
  }
  const token = await signPreviewToken({ typ: "session", exp, jti: newJti() }, secret);
  await setPreviewCookie(token, exp - Math.floor(Date.now() / 1000));
}

/**
 * Legacy fallback: the dumb unsigned `cl-preview = "1"` cookie. Used only when
 * `PREVIEW_INVITE_SECRET` is unset, so Philipp's password login still works and
 * the gate's legacy presence check lets him in. (Degrade, don't crash.)
 */
export async function setLegacySessionCookie(): Promise<void> {
  await setPreviewCookie("1", PASSWORD_SESSION_TTL_SECONDS);
}

/**
 * Best-effort activation upsert on a successful Accept. Keyed by the invite's
 * `jti`: first activation inserts (defaults fill first/last = now, count = 1);
 * a repeat bumps `lastActivatedAt` + `count`. Wrapped so a DB failure is logged
 * and swallowed — activation tracking must NEVER block access (the caller has
 * already decided to let the visitor in).
 */
export async function recordActivation(jti: string): Promise<void> {
  try {
    await db
      .insert(previewInviteActivations)
      .values({ jti })
      .onConflictDoUpdate({
        target: previewInviteActivations.jti,
        set: {
          lastActivatedAt: sql`now()`,
          count: sql`${previewInviteActivations.count} + 1`,
        },
      });
  } catch (err) {
    console.error(
      "[preview-invites] activation upsert failed; access still granted:",
      err,
    );
  }
}
