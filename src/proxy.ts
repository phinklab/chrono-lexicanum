import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, previewGateEnabled } from "@/lib/previewGate";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";

// Next.js 16 file convention: this file replaces the pre-v16 `middleware.ts`.
// The matcher covers every page route (preview gate, session 145) — excluded
// are /login itself, Next internals, the public/ asset folders, and two machine
// endpoints that must answer without the preview cookie: /healthz (uptime probe)
// and /api/revalidate (token-authed cache webhook). Without that exclusion the
// preview gate would 307-redirect both to /login, breaking the probe and the
// apply-script webhook (Board 121-P11). The admin-only paths below additionally
// run the Basic-Auth admin detection.
export const config = {
  matcher: [
    "/((?!_next/|login|healthz|api/revalidate|img/|audio/|timeline/|lab/|aquila\\.png|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
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

/** Admin-only page routes, hard-401ed in prod without Basic-Auth (Report 144
 *  § S.3): /ingest (internal ingestion logs + raw LLM payloads) and
 *  /buch/[slug]/audit (provenance internals). The pages additionally check
 *  `getIsAdmin()` themselves — defense in depth, in case a future matcher edit
 *  drops one of them out of this proxy. (The /atlas dashboard was removed from
 *  the deployed product in Board 121-P11 — it now 404s; admin curation moves to
 *  a local-only tool, 122-B14.) */
function isAdminPath(path: string): boolean {
  if (path === "/ingest" || path.startsWith("/ingest/")) return true;
  return /^\/buch\/[^/]+\/audit$/.test(path);
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  // Spoof guard (Report 144 § S.1b): `x-atlas-admin` is purely a proxy→server
  // signal — a copy sent by the client must never reach `getIsAdmin()`. Strip
  // it from EVERY forwarded request first; only the verified branches below
  // re-set it. (Routes excluded from the matcher never run this strip, but
  // none of them read the header — today only /map and the admin paths do,
  // all of which are matched.)
  const forwarded = new Headers(req.headers);
  forwarded.delete("x-atlas-admin");

  // Preview gate — the whole site sits behind /login while in private
  // preview: any route without the preview cookie redirects there. Local
  // dev bypasses (NODE_ENV !== "production"); Vercel previews and
  // production both enforce. PREVIEW_GATE=off disables the gate for launch
  // without a code change. Runs before the Basic-Auth block because that
  // block early-returns on non-prod (which includes Vercel previews).
  if (previewGateEnabled() && req.cookies.get(PREVIEW_COOKIE)?.value !== "1") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Local dev and Vercel preview both bypass the Basic-Auth check:
  //   - Preview deployments sit behind Vercel's own SSO gate; a second prompt
  //     would be redundant.
  //   - Local `next dev` should not prompt for credentials when iterating on
  //     UI; the gate is purely a production safeguard.
  // In both cases we still forward `x-atlas-admin: 1` so the surviving admin
  // surfaces (/ingest, /buch/*/audit) and the Map admin tools render in their
  // authenticated shape. (The header name is kept — it is the shared admin
  // signal read by getIsAdmin(); renaming it is out of P11 scope.)
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
      // Constant-time compares (Report 144 § S.1a) — `===` leaks a timing
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
      // S.7: without ATLAS_PASS the admin routes are unreachable in prod.
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
  // Always forward the stripped header set — the pre-S.1b fall-through
  // (`NextResponse.next()` with the ORIGINAL headers) is what made the
  // client-sent `x-atlas-admin: 1` reach /map.
  return NextResponse.next({ request: { headers: forwarded } });
}
