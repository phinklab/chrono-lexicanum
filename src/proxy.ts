import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 file convention: this file replaces the pre-v16 `middleware.ts`.
// The matcher covers both /atlas (gated) and /map (public, but credentials are
// detected so the optional admin signal can be forwarded).
export const config = {
  matcher: ["/atlas/:path*", "/map/:path*"],
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

export function proxy(req: NextRequest): NextResponse {
  // Local dev and Vercel preview both bypass the Basic-Auth check:
  //   - Preview deployments sit behind Vercel's own SSO gate; a second prompt
  //     would be redundant.
  //   - Local `next dev` should not prompt for credentials when iterating on
  //     UI; the gate is purely a production safeguard.
  // In both cases we still forward `x-atlas-admin: 1` so the Atlas pages and
  // Map admin tools render in their authenticated shape.
  const isProd = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

  if (!isProd) {
    const forwarded = new Headers(req.headers);
    forwarded.set("x-atlas-admin", "1");
    return NextResponse.next({ request: { headers: forwarded } });
  }

  const expectedUser = process.env.ATLAS_USER ?? "philipp";
  const expectedPass = process.env.ATLAS_PASS;

  let ok = false;
  if (expectedPass) {
    const creds = parseBasic(req.headers.get("authorization"));
    if (creds && creds.user === expectedUser && creds.pass === expectedPass) {
      ok = true;
    }
  }

  const path = req.nextUrl.pathname;
  const isAtlas = path === "/atlas" || path.startsWith("/atlas/");

  if (isAtlas && !ok) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM },
    });
  }

  if (ok) {
    const forwarded = new Headers(req.headers);
    forwarded.set("x-atlas-admin", "1");
    return NextResponse.next({ request: { headers: forwarded } });
  }

  return NextResponse.next();
}
