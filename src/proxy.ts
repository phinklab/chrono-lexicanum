import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, previewGateEnabled, previewSecret } from "@/lib/previewGate";
import { verifyPreviewToken } from "@/lib/previewToken";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";

// Next.js 16 file convention: `proxy.ts` is the middleware entry point.
// The matcher covers every page route (preview gate) — excluded are /login
// itself, the legal pages /imprint + /privacy (§ 5 DDG / Art. 13 DSGVO
// information must be reachable from the public /login surface, i.e. without
// a preview cookie) plus /artwork (third point of the same legal row, linked
// from /login too), Next internals, the public/ asset folders, and three
// machine endpoints that must answer without the preview cookie: /healthz
// (uptime probe), /api/revalidate (token-authed cache webhook), and
// /api/preview-invites (admin-gated activation read for the local console;
// it self-checks the admin credential in its own handler precisely BECAUSE
// the proxy is bypassed for it). Without that exclusion the preview gate
// would 307-redirect them to /login, breaking the probe, the apply-script
// webhook, and the console's cross-origin read. The admin-only paths below
// additionally run the Basic-Auth admin detection.
export const config = {
  matcher: [
    "/((?!_next/|login|imprint|privacy|artwork|healthz|api/revalidate|api/preview-invites|img/|audio/|timeline/|aquila\\.png|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};

const REALM = 'Basic realm="Chrono Atlas"';

function parseBasic(authHeader: string | null): { user: string; pass: string } | null {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = atob(authHeader.slice("Basic ".length).trim());
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return null;
  return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
}

/** Admin-only page routes, hard-401ed in prod without Basic-Auth:
 *  /ingest (internal ingestion logs + raw LLM payloads) and
 *  /buch/[slug]/audit (provenance internals). The pages additionally check
 *  `getIsAdmin()` themselves — defense in depth, in case a future matcher edit
 *  drops one of them out of this proxy. */
function isAdminPath(path: string): boolean {
  if (path === "/ingest" || path.startsWith("/ingest/")) return true;
  return /^\/buch\/[^/]+\/audit$/.test(path);
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  // Spoof guard: `x-atlas-admin` is purely a proxy→server
  // signal — a copy sent by the client must never reach `getIsAdmin()`. Strip
  // it from EVERY forwarded request first; only the verified branches below
  // re-set it. (Routes excluded from the matcher never run this strip, but
  // none of them read the header — today only /map and the admin paths do,
  // all of which are matched.)
  const forwarded = new Headers(req.headers);
  forwarded.delete("x-atlas-admin");

  // Preview gate — the whole site sits behind /login while in private
  // preview: any route without a valid preview cookie redirects there. Local
  // dev bypasses (NODE_ENV !== "production"); Vercel previews and production
  // both enforce. PREVIEW_GATE=off disables the gate for launch without a code
  // change. Runs before the Basic-Auth block because that block early-returns
  // on non-prod (which includes Vercel previews).
  //
  // When PREVIEW_INVITE_SECRET is SET, the gate is the enforcement point — it
  // verifies the cookie's HMAC signature, that `typ === "session"`, and that
  // `exp` is in the future; a tampered, expired, absent or wrong-`typ` cookie
  // fails closed → /login. This is what evicts expired sessions and rejects
  // pasted invite tokens. When the secret is UNSET the feature degrades to the
  // legacy presence check (`cl-preview === "1"`) — NOT fail-open to everyone,
  // and NOT a signature loop it has no key for (so the public site never
  // crashes or locks out over a missing secret, matching the
  // ATLAS_PASS-missing posture).
  if (previewGateEnabled()) {
    const cookie = req.cookies.get(PREVIEW_COOKIE)?.value;
    const secret = previewSecret();
    const authed = secret
      ? (await verifyPreviewToken(cookie, secret, "session")) !== null
      : cookie === "1";
    if (!authed) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Local dev and Vercel preview both bypass the Basic-Auth check:
  //   - Preview deployments sit behind Vercel's own SSO gate; a second prompt
  //     would be redundant.
  //   - Local `next dev` should not prompt for credentials when iterating on
  //     UI; the gate is purely a production safeguard.
  // In both cases we still forward `x-atlas-admin: 1` so the surviving admin
  // surfaces (/ingest, /buch/*/audit) and the Map admin tools render in their
  // authenticated shape. (The header name is kept — it is the shared admin
  // signal read by getIsAdmin().)
  const isProd = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

  if (!isProd) {
    forwarded.set("x-atlas-admin", "1");
    return NextResponse.next({ request: { headers: forwarded } });
  }

  const expectedUser = process.env.ATLAS_USER ?? "philipp";
  const expectedPass = process.env.ATLAS_PASS;

  let ok = false;
  if (expectedPass) {
    const creds = parseBasic(req.headers.get("authorization"));
    if (creds) {
      // Constant-time compares — `===` leaks a timing
      // oracle on the first differing character. Both compares always run
      // (no `&&` short-circuit), so user- and pass-mismatch are
      // indistinguishable by duration.
      const [userOk, passOk] = await Promise.all([
        timingSafeEqualStr(creds.user, expectedUser),
        timingSafeEqualStr(creds.pass, expectedPass),
      ]);
      ok = userOk && passOk;
    }
  }

  if (isAdminPath(req.nextUrl.pathname) && !ok) {
    if (!expectedPass) {
      // Without ATLAS_PASS the admin routes are unreachable in prod.
      // 401 is the secure default — surface the misconfiguration in the
      // server log instead of taking the whole public site down with a
      // boot-time throw over an admin-only secret.
      console.error(
        "[proxy] ATLAS_PASS is not set in production — admin routes (/ingest, /buch/*/audit) are locked out.",
      );
    }
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM },
    });
  }

  if (ok) {
    forwarded.set("x-atlas-admin", "1");
  }
  // Always forward the stripped header set — falling through with
  // `NextResponse.next()` on the ORIGINAL headers would let a client-sent
  // `x-atlas-admin: 1` reach /map.
  return NextResponse.next({ request: { headers: forwarded } });
}
