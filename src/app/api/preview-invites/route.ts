/**
 * Admin-gated activation read endpoint for the local preview-invite console
 * (Brief 163). Returns the `preview_invite_activations` rows as JSON so the
 * console can overlay an "activated · <first time> (×count)" badge on the links
 * it knows about, matched by `jti`.
 *
 * This route is EXCLUDED from the proxy matcher (`src/proxy.ts`), so the proxy
 * never runs for it — which means it CANNOT lean on the proxy-set
 * `x-atlas-admin` / `getIsAdmin()` signal (that would be permanently
 * unauthenticated, the trap the brief calls out). Instead it checks the admin
 * credential from the `Authorization` header IN THIS HANDLER, reusing the
 * existing admin Basic-Auth (`ATLAS_USER` / `ATLAS_PASS`) — no parallel scheme.
 *
 * CORS: the console is served on localhost (`npm run preview:console`,
 * `http://localhost:4178` by default), so this answers that concrete origin —
 * never a `null` origin (which would also admit `file://` and opaque-origin
 * frames, an anti-pattern next to an Authorization header). The OPTIONS
 * preflight returns the CORS headers WITHOUT requiring auth (browsers never send
 * credentials on a preflight); only the GET is gated.
 *
 * Has NO dependency on PREVIEW_INVITE_SECRET — it still answers when the secret
 * is unset (there is simply nothing new being recorded then).
 */
import { NextResponse, type NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { previewInviteActivations } from "@/db/schema";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";

// Admin read is never cached — it must reflect the live activation table.
export const dynamic = "force-dynamic";

// The localhost origin the console is served from (see scripts/preview-console).
// Overridable without a code change if Philipp picks another port.
const CONSOLE_ORIGIN =
  process.env.PREVIEW_CONSOLE_ORIGIN ?? "http://localhost:4178";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": CONSOLE_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization",
    Vary: "Origin",
  };
}

// Local copy of the proxy's Basic-Auth parse (src/proxy.ts) — duplicated rather
// than shared to keep the proxy's admin block untouched (Brief 163 out-of-scope).
function parseBasic(
  authHeader: string | null,
): { user: string; pass: string } | null {
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

async function isAdmin(req: NextRequest): Promise<boolean> {
  const expectedPass = process.env.ATLAS_PASS;
  // No admin password configured → the endpoint is locked (secure default,
  // same posture as the proxy's admin block).
  if (!expectedPass) return false;
  const expectedUser = process.env.ATLAS_USER ?? "philipp";
  const creds = parseBasic(req.headers.get("authorization"));
  if (!creds) return false;
  // Constant-time compares, both always run (no short-circuit) so user- and
  // pass-mismatch are indistinguishable by duration.
  const [userOk, passOk] = await Promise.all([
    timingSafeEqualStr(creds.user, expectedUser),
    timingSafeEqualStr(creds.pass, expectedPass),
  ]);
  return userOk && passOk;
}

export async function OPTIONS(): Promise<NextResponse> {
  // Preflight — no Authorization is sent by the browser here, so it must not be
  // gated. CORS headers only.
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders() },
    );
  }

  const activations = await db
    .select({
      jti: previewInviteActivations.jti,
      firstActivatedAt: previewInviteActivations.firstActivatedAt,
      lastActivatedAt: previewInviteActivations.lastActivatedAt,
      count: previewInviteActivations.count,
    })
    .from(previewInviteActivations)
    .orderBy(desc(previewInviteActivations.lastActivatedAt));

  return NextResponse.json({ activations }, { headers: corsHeaders() });
}
