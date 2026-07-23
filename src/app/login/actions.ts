"use server";

import { redirect } from "next/navigation";
import { previewCredentials } from "@/lib/previewGate";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";
import { setSignedSessionCookie } from "@/lib/previewSession";

/**
 * Shared preview password login. Both fields are checked in constant time and
 * successful authentication always mints the signed cookie the gate verifies.
 * Missing deployment credentials or signing secret fail closed.
 */
export async function login(formData: FormData): Promise<void> {
  const user = formData.get("user");
  const pass = formData.get("pass");

  // Missing/non-string fields fail before any secret is involved — this check
  // depends only on the request shape, not on credential content.
  if (typeof user !== "string" || typeof pass !== "string") {
    redirect("/login?error=1");
  }

  const credentials = previewCredentials();

  // Both compares always run, including when configuration is incomplete.
  // Empty expected values are only timing-safe stand-ins; `credentials` must
  // still be non-null before access can be granted.
  const [userOk, passOk] = await Promise.all([
    timingSafeEqualStr(user, credentials?.user ?? ""),
    timingSafeEqualStr(pass, credentials?.pass ?? ""),
  ]);
  if (!credentials || !userOk || !passOk) {
    if (!credentials) {
      console.error(
        "[preview-login] PREVIEW_USER and PREVIEW_PASS must both be set while the preview gate is enabled.",
      );
    }
    redirect("/login?error=1");
  }

  if (!(await setSignedSessionCookie())) {
    console.error(
      "[preview-login] PREVIEW_SESSION_SECRET is not set; refusing to issue an unsigned preview cookie.",
    );
    redirect("/login?error=1");
  }
  redirect("/");
}
