---
session: 2026-06-20-162
role: architect
date: 2026-06-20
status: open
slug: timed-preview-access
parent: null
links: [2026-06-13-145-arch-preview-gate, 2026-06-13-150-impl-polish-sweep]
commits: []
---

# Timed preview access — per-person signed invite links

## Goal

Let Philipp share the site with individual people over a rolling outreach (write one Reddit contact today, another four days later) by handing each one a **signed invite link** that grants a time-limited preview — each link carrying its own expiry, minted on demand. No per-user accounts; the only server-side state is **one tiny table that records link activations**, so the local console can show what's actually been used. One master secret signs everything; rotating it ends **every** outstanding link and session at once, which is the only revocation lever needed.

This **supersedes the global-window design** that was in an earlier draft of this brief — a single shared cutoff doesn't fit rolling outreach. The model is now: mint a link per person, each with an embedded absolute expiry (default ~3 days, configurable at mint).

## Design freedom — read before everything else

The invite link **routes to the login page**, reusing its existing console chrome (`src/app/login/page.tsx`) — Philipp specifically wants to keep that branded login experience rather than an invisible auto-redirect. The page gets an **invite state**: where the username/password fields normally sit, it shows a single accept action instead (Philipp's words: an "Accept invitation" button). Clicking it redeems the link and lets the person in. Three states share the one console:

- **Invite state** — arrived via a valid, unexpired link: show the accept action in place of the credential form. (The maintainer's normal username/password form is the default state when there's no invite.)
- **Invalid / expired link state** — arrived via a bad or expired link: a graceful "this invitation is invalid or has expired" affordance, distinct from the wrong-password error. It **must include a contact prompt** in Philipp's intent — "if you need another preview link, contact me" — where **"me" is a link to `https://www.reddit.com/user/piwireddit/`** (open in a new tab, `rel="noopener noreferrer"`). The URL is pinned; the exact wording and styling of the message are yours.
- The existing wrong-password error state stays as is.

Everything aesthetic is yours: the exact button copy and the "expired link" copy/voice (the page speaks an in-universe "RESTRICTED ARCHIVE / sealed" register — match or evolve it), markup, class shapes, styling, motion, and the route shape that carries the invite (a `?invite=` param on `/login` vs. a sibling route — your call). Nothing worded in this brief is final copy; treat "Accept invitation" as the maintainer's intent, not a pinned string.

Architectural requirement is only: **the accept action only appears for a server-validated, unexpired link; clicking it grants access; an invalid or expired link cannot grant access and shows the error state instead.** Look, copy, and route shape are your call.

## Context

The preview gate (Session 145, hardened 147/150) is the whole-site lock anonymous visitors hit:

- `src/lib/previewGate.ts` — shared constants: single shared credential (`PREVIEW_USER` / `PREVIEW_PASS`, committed defaults as a soft lock), `PREVIEW_COOKIE = "cl-preview"`, `previewGateEnabled()` (prod-only; `PREVIEW_GATE=off` is the launch kill-switch).
- `src/proxy.ts` — the route gate (Next 16 `proxy.ts`, ex-`middleware.ts`). On any matched route, if `previewGateEnabled()` and the `cl-preview` cookie isn't `"1"`, it 307s to `/login`. The Basic-Auth admin block below (`/ingest`, `/buch/*/audit`, `x-atlas-admin`) is **unrelated** and stays untouched.
- `src/app/login/actions.ts` — the `login` server action. On correct creds it sets `cl-preview = "1"`, `maxAge` 30 days, redirects to `/`.
- `src/app/login/page.tsx` — the login console.

The gap: the cookie value is a dumb `"1"` with no embedded expiry, and the gate only checks presence. There's no way to time-limit a visitor, and the only entry credential is one shared password.

The new shape (otherwise stateless; one tiny activations table is the sole server-side state):

1. **A signing secret** (new env var, `PREVIEW_*` family) signs both invite links and the session cookie. Set in Vercel (prod) and in Philipp's local `.env.local` (so minting and verifying agree).
2. **A single local management console** — one self-contained, gitignored **HTML file** Philipp opens on his own machine that is the *only* place he manages links. It does two things:
   - **Generate:** he enters a duration (default ~3 days) and an optional label and clicks a **Generate** button; the page computes `exp`, builds the signed token **in the browser** (Web Crypto HMAC over the same token format the server verifies), assembles the full absolute invite URL against the prod base, **adds it to the on-page list**, and offers a copy-to-clipboard. No command line, no separate mint step.
   - **Overview:** the list shows every link he's generated — label, **its short id (`jti`)**, minted date, expiry, the URL, and a status badge (**active vs. expired computed in-browser from `exp`**, re-evaluated on refresh). The list **persists locally** (e.g. `localStorage`) so it survives reopening the file. The `jti` is the join key between a local link and its server-side activation record.
   - **Activation overlay:** on load (and via a Refresh action) the console **fetches activation status from an admin-gated read endpoint** on the site and overlays an "activated · <first time> (×count)" badge on the links it knows about, matched by `jti`. If the fetch fails (offline, missing credential), it shows the links without the overlay plus a quiet "couldn't load activation status" hint — never a hard error.

   The signing secret **and the admin read-credential** are **entered at runtime** (and may be remembered locally), **never hardcoded into the file**. The console is operator-only: it lives on Philipp's machine, is gitignored, and is **never deployed**. It surfaces *activation* status (a link was opened+accepted, and when); what it still cannot show is whose session is *currently live* moment-to-moment.
3. **Redemption (via the login page):** the invite link routes to the login page carrying the token. The page **server-validates** the token (signature + `exp` in the future) before rendering: valid → it shows the "Accept invitation" state; invalid/expired → the error state, no accept action. On clicking Accept, a server action **re-verifies** the token authoritatively and sets a **signed `cl-preview` cookie** carrying that same `exp`, then redirects to `/`. Because `exp` is absolute and baked at mint, re-clicking the link cannot extend access past it. On a successful Accept the server **records the activation** — a best-effort upsert into a tiny `preview_invite_activations` table keyed by `jti` (first/last activation time + a count). **Best-effort means:** if the write fails, the server logs the error, still sets the cookie, and lets the person in — activation tracking must never block access. The local console reads this table back through an admin-gated endpoint (point 2's overlay).
4b. **The activation read endpoint** — a small admin-gated, read-only API (e.g. `GET /api/preview-invites`) returns the activation rows (`jti`, first/last time, count) as JSON for the console. It is **not** public: it requires an admin credential, must be excluded from the preview-cookie redirect, and must answer cross-origin requests from the local console (CORS, incl. the `file://`/`localhost` origin and an `OPTIONS` preflight).
4. **The gate** (`src/proxy.ts`) verifies the signed cookie's signature and that `exp > now` on every request; invalid/expired/absent → `/login`. This is what evicts expired sessions and rejects tampered cookies.
5. **Kill-all lever:** rotating the signing secret in Vercel instantly invalidates every outstanding link and every active cookie (they no longer verify). That is the "end every link prematurely" control Philipp asked for.

The maintainer's own password login (`PREVIEW_USER`/`PREVIEW_PASS`) stays as a convenience entry for Philipp — but it now mints the **same signed cookie format** the gate verifies (with a longer expiry of its own), so there is exactly one cookie shape to verify.

## Constraints

- **New signing-secret env var** in the `PREVIEW_*` family (e.g. `PREVIEW_INVITE_SECRET`). High-entropy, **never committed** (unlike the soft-lock password — this one is load-bearing). Document it in `.env.example` as required-in-prod with a "rotate to revoke everything" note.
- **Token + cookie are HMAC-signed** over a payload that includes an absolute `exp` (epoch). Use a keyed signature with a constant-time compare (a `timingSafeEqual`-style check already exists at `src/lib/timingSafeEqual.ts`). No new dependency — use the platform's built-in crypto.
- **Verification must run in the gate's runtime.** `src/proxy.ts` is the enforcement point; pick a signing/verification primitive that works there (e.g. Web Crypto `subtle` if the proxy runs on the edge runtime). Research the right primitive for the deployed runtime; don't assume Node `crypto` is available in the proxy.
- **The gate is the enforcement point**, not just redemption: a request whose `cl-preview` cookie fails signature **or** is past `exp` is treated as unauthenticated and redirected to `/login`. Existing pre-deploy `cl-preview = "1"` cookies therefore stop validating — current testers simply re-enter via password or a fresh link (acceptable; note it).
- **Cookie `maxAge` must not exceed time-until-`exp`.** httpOnly, `secure` in prod, `sameSite: lax`, `path: /` (as today).
- **The management console is a single self-contained, gitignored HTML file** (inline CSS/JS, no build step, no external network fetch). It both generates signed links (Generate button) and lists them with live active/expired status, overlaying activation status fetched from the admin endpoint. The link list persists client-side (`localStorage` or equivalent). Add the file (and any exported list) to `.gitignore`. The console itself is never a deployed route; it only *reads* the admin-gated activation endpoint.
- **Token payload carries a short unique id (`jti`) alongside `exp`.** It need not be secret; it is the join key between a generated link and its activation row. Keep the human label *out* of the token (it's decodable by the recipient) — the label↔`jti` mapping lives only in the local console.
- **Activation tracking = one tiny table + one admin-gated read endpoint.** New table (Drizzle schema + a generated, committed migration), minimal and PII-free: `jti` (primary key), first-activated-at, last-activated-at, activation count. On a successful Accept the redemption action **upserts** by `jti`. The write is **best-effort** — a failure is logged and must not block the cookie being set or the redirect. The read endpoint (`GET`, admin-gated, read-only) returns these rows as JSON for the console; it must be excluded from the preview-cookie redirect, require an admin credential, and send the CORS headers the local console needs (allow its `file://`/`localhost` origin + `OPTIONS` preflight + the auth header). No IP, user-agent, or other PII is stored.
- **Activation recording must not gate access.** The redemption path sets the cookie and redirects regardless of whether the DB write succeeds; the table is observability, not an authorization input.
- **One token format, two implementations that must round-trip.** The signed-token scheme (payload shape, canonical encoding, base64url, HMAC) is defined once and is the single source of truth. The browser generator (console) and the server verifier (redemption + gate) are separate implementations of it and **must agree byte-for-byte** — a token the console produces must verify server-side, and vice versa. CC must add a round-trip check.
- **The signing secret never ships in the file.** The console reads the secret at runtime (entered by Philipp, optionally remembered in `localStorage`); it is never hardcoded into the committed-or-generated HTML, and the file is gitignored and never deployed. The secret's trust level is the same as in `.env.local`.
- **Enforcement scope unchanged:** window/link logic only applies where the gate already applies — prod with `previewGateEnabled()` true. Local dev and Vercel preview bypass exactly as today. `PREVIEW_GATE=off` still disables the whole gate for launch.
- **Degrade, don't crash:** if the signing secret is unset in prod, invite redemption is disabled and the server logs an error, but the password gate still functions (matches the existing `ATLAS_PASS`-missing posture — log + degrade, never take the public site down over a misconfigured secret).
- **The only persistence is the tiny activations table; no real accounts, no per-user denylist, no new dependency.** Revocation stays rotate-the-secret-kills-all, by the maintainer's choice.
- **TypeScript strict, no `any`.** All signing/verification is server-only; the secret never reaches a client component.

## Out of scope

- The Basic-Auth **admin** block in `src/proxy.ts` (`/ingest`, `/buch/*/audit`, `x-atlas-admin`, `getIsAdmin()` plumbing) — do not touch its existing logic. **Exception:** you may extend the gate's exclusions / admin protection to cover the new read endpoint so it is admin-gated and bypasses the preview-cookie redirect; reuse the existing admin credential rather than inventing a parallel auth scheme if practical.
- The `PREVIEW_GATE=off` launch kill-switch semantics — leave intact.
- **Per-person revocation / denylist** — out of scope; the kill lever stays rotate-the-secret-kills-all. (Activation *tracking* is now in scope via the tiny table, but using it to revoke a single link — a denylist check in the gate — is not.)
- Real user accounts, the `submissions` table, or any account/identity model. The activations table stores only `jti` + timestamps + count, never identity.
- Renaming the `cl-preview` cookie or changing `PREVIEW_USER` / `PREVIEW_PASS` values.
- The open-questions queue (16b/c timeline follow-ups, OQ 18 `db:apply` deepening) stays deferred to the next board session — this is an out-of-band maintainer request, not board work.

## Acceptance

The session is done when:

- [ ] From the single local gitignored HTML console, Philipp can set the secret, enter a duration/label, click **Generate**, and get a full absolute invite URL on the production domain added to the on-page list (with copy-to-clipboard).
- [ ] A link generated in the console verifies server-side (round-trip parity between the browser generator and the server verifier is tested).
- [ ] The console's list persists across reopening the file and shows each link's label, short id (`jti`), expiry, URL, and an active/expired badge computed in-browser from `exp`. The console file is in `.gitignore` and the secret is not baked into it.
- [ ] On a successful Accept, the server upserts an activation row (`jti`, first/last time, count) in the new table; a forced DB-write failure is logged but still sets the cookie and lets the visitor in (access never blocked by tracking).
- [ ] The admin-gated read endpoint returns activation rows as JSON, rejects unauthenticated callers, is excluded from the preview-cookie redirect, and answers the local console's cross-origin request (CORS/preflight handled).
- [ ] Opening the console overlays an "activated · time (×count)" badge on the matching links, and degrades to a quiet hint (no hard error) if the endpoint is unreachable or the admin credential is absent.
- [ ] The new migration is generated and committed alongside the schema change.
- [ ] Visiting a valid, unexpired link in prod (gate on) routes to the login page in its "Accept invitation" state; clicking the accept action lands the visitor on `/` with normal browsing.
- [ ] Visiting an invalid or expired link routes to the login page showing the "invalid/expired invitation" state — **no** accept action is offered — distinct from the wrong-password error, and including a "contact me" prompt that links to `https://www.reddit.com/user/piwireddit/` (new tab, `rel="noopener noreferrer"`).
- [ ] After a link's embedded expiry passes, a logged-in visitor is redirected to `/login` on their next request (the cookie's `exp` is enforced by the gate), and re-clicking the same link does **not** grant access past its baked expiry.
- [ ] A tampered or malformed `cl-preview` cookie fails verification and is treated as unauthenticated.
- [ ] Philipp's password login still works and produces the same signed-cookie format the gate verifies.
- [ ] Rotating the signing secret invalidates all previously minted links and all active sessions (they no longer verify).
- [ ] With the signing secret **unset** in prod, the site still gates on the password (invite redemption disabled, error logged) rather than erroring out.
- [ ] `.env.example` documents the new signing secret (required-in-prod, rotate-to-revoke-all) and the admin read-credential, and the console's usage (how to open it, where the secret/credential go) is documented.
- [ ] `npm run lint` and `tsc --noEmit` green; `npm run brain:lint -- --no-write` green if any brain/doc file changed.

## Open questions

- **Runtime of `src/proxy.ts`** (edge vs. node) determines the crypto primitive for cookie verification — confirm it and note in your report which you used and why. If verifying in the proxy is awkward, a thin verified re-check in a server boundary is acceptable as long as no gated route renders for an unverified/expired cookie.
- **Secure-context for Web Crypto from a `file://` page.** `crypto.subtle` may be unavailable when the console is opened directly as a `file://` URL in some browsers. If so, the fallback is a tiny local static-serve command (e.g. `npm run preview:console` that serves the file on `localhost`, which *is* a secure context) — your call which path is cleaner. Note what you chose and how Philipp opens the console in your report.
- **Where the console file lives** and how it's produced (a committed *generator/template* that writes the gitignored console, vs. a gitignored file CC scaffolds once): your call. The gate/login code is Product-strand; keep the whole feature on one task branch / one PR (the file set spans `src/**` + the console). Announce the worktree/strand you pick per CLAUDE.md § Parallel worktrees before editing.
- Default link duration: I've said ~3 days, overridable in the console. Adjust the default if you think another value is the better baseline and note it.
- **Admin credential + CORS for the read endpoint.** Decide whether the console authenticates to `/api/preview-invites` by reusing the existing admin Basic-Auth (`ATLAS_USER`/`ATLAS_PASS`) via an `Authorization` header, or a dedicated read token. Either way it's a header (not a cookie), entered once into the console and stored locally. Work out the CORS allow-origin for the console (`file://` → origin `null`, or `localhost` if you serve it) and the preflight; note your choice. If CORS from `file://` proves painful, that's another point in favour of serving the console on `localhost`.
- Optional niceties (your discretion): export/import of the link list (so it survives a `localStorage` wipe), and a remove-from-list action — noting that removing a row is *not* revocation (revocation stays rotate-the-secret-kills-all).

## Notes

- **Operator levers** (surface in `.env.example` / console help so Philipp has them):
  - Invite someone: open the local HTML console, click Generate, copy the link, paste it to that person. Their clock is the link's baked expiry.
  - See what you've handed out: the same console lists every link with its id, expiry, and an active/expired badge.
  - See which links were activated: the console itself shows an "activated · time" badge, fetched from the admin-gated endpoint each time you open or refresh it. (Requires the admin read-credential entered once into the console.)
  - End everything now: rotate the signing-secret env var in Vercel and redeploy — all links and sessions die immediately.
  - Full public launch: `PREVIEW_GATE=off` as already designed (gate, links, and password all become irrelevant).
- **Strand:** primarily **Product** (gate + login UI + signing lib: `src/proxy.ts`, `src/lib/previewGate.ts` or a new sibling, `src/app/login/**`, the new `src/app/api/preview-invites` route, `.env.example`) plus the local HTML console, **and** the DB layer (`src/db/schema.ts` + a generated migration under `src/db/migrations/`) for the activations table. One coherent feature → one task branch / one PR (the file set spans `src/**` incl. `src/db/**` + the console). Announce the worktree/strand you pick per CLAUDE.md § Parallel worktrees before editing. Generate the migration with `npm run db:generate` and commit the SQL; the table reaches prod via the normal `db:migrate` / `migrate.yml` path (no auto-migrate on build). Code → **task branch + PR**, not direct-to-`main`. Suggested branch `codex/product-invite-links`.
- Shape sketch only (illustrative, not implementation): a small `previewToken.ts` with `sign(payload)` / `verify(token)` used by (a) the mint script, (b) the invite-redemption handler, (c) the gate's cookie check; payload `{ exp: number; jti: string }`; the login action and redemption both call the same cookie-set helper with `maxAge = secondsUntil(exp)`; the redemption action does a best-effort `upsert` into `preview_invite_activations` (`jti` PK, `firstActivatedAt`, `lastActivatedAt`, `count`) on success, wrapped so a DB error can't block the redirect; `GET /api/preview-invites` (admin-gated) selects those rows for the console. Exact code is yours.
