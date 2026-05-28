import { headers } from "next/headers";

// The proxy at src/proxy.ts sets `x-atlas-admin: 1` on the request when the
// caller presented valid Basic-Auth credentials. Server Components and Server
// Actions read that signal through this helper — it is the only channel
// downstream code has to know "this viewer is the admin".
export async function getIsAdmin(): Promise<boolean> {
  const h = await headers();
  return h.get("x-atlas-admin") === "1";
}
