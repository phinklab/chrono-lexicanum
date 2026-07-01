---
session: 2026-06-20-163
role: implementer
date: 2026-06-20
status: complete
slug: timed-preview-access
parent: 2026-06-20-163
links: [2026-06-12-145-impl-era-art-login-gate, 2026-06-13-150-impl-polish-sweep]
commits: []
---

# Timed preview access — per-person signed invite links

## Summary

Shipped the full per-person signed-invite-link feature: a custom HMAC-SHA256
token scheme (one canonical format, three implementations — browser console,
redemption handler, gate), a signed `cl-preview` session cookie the gate now
verifies (signature + `typ` + `exp`) on every request, a tiny best-effort
`preview_invite_activations` table read back through an admin-gated
`GET /api/preview-invites`, and a committed, secret-free local HTML console
(template + build/serve scripts) that mints links and overlays activation
status. The one fact Cowork most needs: **the canonical token format is written
down below (§ Canonical token format) as the SSOT both the browser and the
server are coded against, and a byte-for-byte round-trip test
(`npm run test:preview-token`, 11 assertions) guards it.**

Worktree: `chrono-lexicanum-product`, Strang: Product/UI, Branch:
`codex/product-invite-links` (fresh from `origin/main`).

## What I did

**Crypto + gate (edge-safe):**
- `src/lib/previewToken.ts` (new) — canonical `signPreviewToken` /
  `verifyPreviewToken` / `newJti`. Pure Web Crypto + `btoa`/`atob` +
  `TextEncoder`; imports nothing server-only, so the proxy can import it. Verify
  fails closed (malformed/tampered/expired/wrong-`typ` → `null`, never throws,
  never passes).
- `src/lib/previewGate.ts` — added `previewSecret()` (reads
  `PREVIEW_INVITE_SECRET`; empty string ⇒ unset ⇒ degrade). Kept edge-safe.
- `src/proxy.ts` — the gate is now the enforcement point: when the secret is
  set it verifies the cookie as a `typ:"session"` token with future `exp`; when
  unset it falls back to the legacy `cl-preview === "1"` presence check. Added
  `api/preview-invites` to the matcher's exclusion list. The Basic-Auth admin
  block is untouched.

**Session + redemption (server-only):**
- `src/lib/previewSession.ts` (new) — `setSignedSessionCookie(exp)` (the one
  cookie shape), `setLegacySessionCookie()` (degrade), `recordActivation(jti)`
  (best-effort upsert, own try/catch — never blocks access). `import "server-only"`.
- `src/app/login/actions.ts` — `login` now mints the signed session cookie when
  the secret is set (else the legacy cookie); new `acceptInvite` action
  re-verifies the invite authoritatively, mints a session cookie carrying the
  invite's own baked `exp`, records the activation, redirects to `/`.
- `src/app/login/page.tsx` — three states (accept / invalid-expired /
  credentials) chosen from a server-validated `?invite=` token; pinned Reddit
  contact link (`target="_blank" rel="noopener noreferrer"`);
  `metadata.referrer = "no-referrer"` to keep the token out of any Referer.
- `src/app/styles/68-login.css` — styles for the invite + expired states.

**Activation store + endpoint:**
- `src/db/schema.ts` — new `preview_invite_activations` (`jti` PK,
  first/last-activated-at, `count`).
- `src/db/migrations/0014_fantastic_sister_grimm.sql` (generated) — additive
  `CREATE TABLE` only; journal updated.
- `src/app/api/preview-invites/route.ts` (new) — `GET` (admin-gated in-handler
  via `ATLAS_USER`/`ATLAS_PASS` Basic-Auth + constant-time compare) returns the
  rows as JSON; `OPTIONS` preflight returns CORS headers without auth; concrete
  `http://localhost:4178` allow-origin (no `null`).

**Local console (committed source → gitignored output):**
- `scripts/preview-console/template.html` (committed, secret-free) — the
  reviewable source: in-browser HMAC minting (same canonical format), persisted
  link list, active/expired badges, activation overlay, export/import,
  remove-row. Secret + admin credential entered at runtime, optionally remembered
  in `localStorage`.
- `scripts/preview-console/build.mjs` + `serve.mjs` (committed) — generate the
  gitignored `console.html` and serve it on `http://localhost:4178`.
- `.gitignore` — ignores `scripts/preview-console/console.html`.

**Tests + docs:**
- `scripts/test-preview-token.ts` (new) + `npm run test:preview-token`.
- `package.json` — `test:preview-token`, `preview:console`,
  `preview:console:build`.
- `.env.example` — documented `PREVIEW_INVITE_SECRET` (required-in-prod,
  rotate-to-revoke-all), `PREVIEW_CONSOLE_ORIGIN`, the admin-credential reuse,
  and the operator levers.

## Canonical token format (SSOT)

The single source of truth both the browser console and the server target:

```
payloadJson  = JSON.stringify({ typ, exp, jti })   // keys in THIS fixed order
headerB64    = base64url( utf8(payloadJson) )        // RFC 4648 §5, NO '=' padding
sigBytes     = HMAC_SHA256( key = utf8(secret), msg = utf8(headerB64) )
sigB64       = base64url( sigBytes )                 // RFC 4648 §5, NO '=' padding
token        = headerB64 + "." + sigB64
```

- `typ`: `"invite"` | `"session"` — **part of the signed bytes** (domain
  separation: an invite token cannot be pasted into the `cl-preview` cookie).
- `exp`: absolute expiry, **epoch seconds**, integer.
- `jti`: 16 hex chars (8 random bytes) — non-secret join key to the activation row.
- base64url = standard base64 with `+`→`-`, `/`→`_`, trailing `=` stripped.
- The HMAC is over the **ASCII bytes of `headerB64`** (not a re-serialization), so
  verification re-signs the received header bytes — any token whose halves agree
  under the key verifies. The signer's byte output is identical across the
  browser (`btoa`) and server (`btoa`) paths; the round-trip test asserts
  `serverSign === browserSign` byte-for-byte plus full cross-verification.

## Decisions I made

- **Proxy runtime = Edge (default for `proxy.ts`/middleware in Next 16).** No
  `runtime` override is declared, so it runs on the edge runtime. `crypto.subtle`,
  `btoa`, `atob`, `TextEncoder`, `crypto.getRandomValues`, `Date.now` are all
  globals there — confirmed by the pre-existing `timingSafeEqualStr` (crypto.subtle)
  and the proxy's own `atob` use. I verify the cookie **in the gate directly**;
  no separate server re-check boundary was needed.
- **Referrer-Policy via page `metadata.referrer = "no-referrer"`, not an HTTP
  header.** Adding a `/login` header source in `next.config.ts` would emit a
  *duplicate* `Referrer-Policy` next to the global `strict-origin-when-cross-origin`
  one. The page-scoped meta tag is clean, overrides for that document only, and
  achieves the brief's intent (the `?invite=` token can't leak via Referer on the
  contact link). Belt-and-suspenders with the link's `rel="noopener noreferrer"`.
- **Admin credential for the read endpoint = reuse `ATLAS_USER`/`ATLAS_PASS`
  Basic-Auth** (Open question), checked **in the route handler** (the proxy is
  bypassed for this path). I duplicated the ~8-line `parseBasic` from `proxy.ts`
  into the route rather than refactor the proxy's admin block (out of scope) —
  small, low-risk duplication, commented as such.
- **Console served on `localhost:4178`** (Open question — fixed default). Picked
  4178 as an uncommon port; overridable via `PREVIEW_CONSOLE_PORT` (serve) /
  `PREVIEW_CONSOLE_ORIGIN` (endpoint CORS). A tiny Node `http` static server —
  **no new dependency** (vs. `npx serve`, which would fetch a package).
- **Default link duration: 3 days** (brief's suggestion), unit-selectable
  (hours/days/weeks) in the console. Kept the brief's baseline.
- **Console generator = placeholder substitution** (`__PROD_BASE_URL__` →
  `https://chrono-lexicanum.vercel.app`, also overridable in-page). Gives the
  committed template a real reason to exist as a generator while staying
  secret-free; the gitignored `console.html` is what Philipp opens.
- **jti also on the session cookie** (fresh random per cookie). The session
  payload reuses the one `{typ,exp,jti}` shape; its `jti` is inert (only invite
  `jti`s become activation rows). One payload shape, no special-casing.
- **No new dependency** — custom HMAC over `crypto.subtle`, as the brief decided
  over a JWT lib. The round-trip test + written-down canonical format contain the
  byte-agreement risk.

## Verification

- `npm run test:preview-token` — **pass** (11/11: browser↔server round-trip,
  byte-identical signers, domain separation both directions, expiry, tampering,
  wrong secret, legacy `"1"` + malformed shapes all rejected).
- `tsc --noEmit` — **pass**.
- `npm run lint` (`eslint .`) — **pass**.
- `npm run db:generate` — produced `0014_fantastic_sister_grimm.sql` (additive
  `CREATE TABLE` only); journal updated to idx 14.
- `npm run preview:console:build` — builds the gitignored `console.html`;
  `git check-ignore` confirms it is ignored.
- `npm run brain:lint -- --no-write` — **2 blocking findings, both pre-existing
  on `origin/main`** (verified by a clean-tree stash run: identical counts).
  They are (a) one internal-link blocker = the **brief's own** `links:` slug
  `2026-06-13-145-arch-preview-gate`, which doesn't exist (the real session 145
  is archived as `2026-06-12-145-impl-era-art-login-gate`), and (b) a
  catalog-freshness blocker unrelated to this strand. My doc changes (impl report
  + the one-line brief status flip) introduce **zero** new findings — my report's
  `links:` point at real session stems. The brief's broken slug is Cowork's to
  fix in a coordination pass (Product strand must not rewrite the brief body).
- **Not run:** `npm run db:migrate` (DB-mutating against Supabase — left for
  Philipp; the table reaches prod via the normal `db:migrate` / `migrate.yml`
  path, no auto-migrate on build). No dev-server / browser walkthrough (per the
  manual-verify-over-headless-loops convention — Philipp eyeballs the three login
  states + a real mint→accept→activation cycle in the browser).

## Open issues / blockers

None blocking. Two things Philipp must do for the feature to be live in prod:

1. **Set `PREVIEW_INVITE_SECRET`** (same value) in Vercel **and** local
   `.env.local` — `openssl rand -hex 32`. Until then prod runs the degrade path
   (legacy presence check; invites disabled) — by design.
2. **Apply migration 0014** (`npm run db:migrate` locally; prod via the
   `migrate.yml` path) so the activations table exists. The activation upsert is
   best-effort, so a missing table only means "no activation overlay", never a
   blocked login — but the overlay needs the table.

Note: when the secret is first set in prod, existing testers' `cl-preview="1"`
cookies stop validating (signed-cookie mode) — they simply re-enter via password
or a fresh link. Expected, per the brief.

## For next session

- The gate now runs one HMAC verify per gated request in prod (sub-ms,
  `crypto.subtle`). Fine at this scale; noted in case a future perf pass profiles
  the edge path.
- If a custom domain replaces `chrono-lexicanum.vercel.app`, rebuild the console
  with the new base (`npm run preview:console:build https://<domain>`) or just
  edit the base field in the console UI — no code change.
- Per-link revocation (a denylist check in the gate keyed by `jti`) remains out
  of scope; the activations table is the natural place to hang it if ever wanted.

## References

- Brief `sessions/2026-06-20-163-arch-timed-preview-access.md`.
- Existing primitives reused: `src/lib/timingSafeEqual.ts` (constant-time
  compare + crypto.subtle-in-both-runtimes precedent), `src/proxy.ts` Basic-Auth
  block, `src/app/api/revalidate/route.ts` (admin-gated route handler shape).
