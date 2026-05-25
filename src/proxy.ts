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
  // Vercel preview deployments sit behind Vercel's own SSO gate. A second
  // Basic-Auth prompt on top of that is a double prompt with no extra safety,
  // so we skip our check entirely on preview.
  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.next();
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
