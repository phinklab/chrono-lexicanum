---
session: 2026-07-12-201
role: implementer
date: 2026-07-12
status: complete
slug: launch-s3b-csp-login-audio-cutover
parent: docs/launch-master-plan.md § Session 3b (E8-Prompt-Betrieb, kein per-Session-Brief)
links:
  - docs/launch-master-plan.md
  - scripts/runbooks/db-roles-runbook.md
commits: []
---

# Launch S3b — CSP, Login, Health, Audio, Runtime-DB-Cutover

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang:
Product · Branch: `codex/product-csp-login-audio` (frisch von `origin/main`
@ 36ba1ae, S3a gemerged).

## Summary

Alle fünf S3b-Punkte umgesetzt: Prod-CSP ohne `unsafe-eval` + `poweredByHeader:
false` + E6-CSP-Vertrag festgeschrieben, Login timing-safe, `/healthz`
gebündelt+gedrosselt, Audio auf tokenlose Public-Bucket-URLs, Runtime-DB-Cutover
mit Vercel-gegateter Credential-Wahl und Übergangs-Fallback. **Wichtigste
Punkte für Cowork/Philipp:** (1) Der Audio-Bucket ist BEREITS public — der
angekündigte Dashboard-Flip entfällt, Range/CORS für alle drei Tracks belegt.
(2) Die Credential-Wahl in `src/db/client.ts` ist auf `VERCEL` gegated statt
eines nackten `RUNTIME_DATABASE_URL || DATABASE_URL` — die naive Variante hätte
alle 37 privilegierten lokalen Skripte sofort auf die Read-only-Rolle
downgegradet, weil `.env.local` seit dem S3a-Bootstrap beide Vars trägt.
(3) Beide Maintainer-Haltepunkte des Cutovers stehen unten als Einzelschritte.

## What I did

- `next.config.ts` — `unsafe-eval` aus der Prod-CSP (isDev-Gate wie
  `connect-src`; Prod-Header verifiziert eval-frei); `poweredByHeader: false`;
  E6-Observability-CSP festgeschrieben: dev-only
  `https://va.vercel-scripts.com` in `script-src` (Analytics/Speed-Insights-
  Debug-Skripte), Prod bleibt komplett same-origin (`/_vercel/insights/*` +
  `/_vercel/speed-insights/*` sind von `'self'` gedeckt); Kommentar-Vertrag für
  den S5-Error-Tracker (siehe Decisions).
- `src/app/login/actions.ts` — der direkte `!==`-Vergleich (Z. 25) durch
  `timingSafeEqualStr` ersetzt; beide Compares laufen immer (Promise.all, kein
  Short-Circuit), Spiegelbild des Basic-Auth-Checks in `src/proxy.ts`.
  Vorgelagerter Type-Guard (non-string → redirect) hängt nur an der
  Request-Form, nicht am Secret-Inhalt.
- `src/app/healthz/route.ts` — DB-Probe gebündelt + gedrosselt: parallele
  Requests teilen sich EINE in-flight Probe, Ergebnis wird 30 s (ok) bzw. 5 s
  (fail) wiederverwendet → maximal eine `select 1`-Query pro Fenster und
  Instanz statt eine pro Ping. Monitor-Semantik unverändert (200/503, gleiche
  JSON-Shape; `ts` ist jetzt der Probe-Zeitpunkt, im Fehlerfall neu auch
  enthalten). Per-Instanz-State ist bewusst der richtige Scope: geschützt wird
  der `max:5`-Pool derselben Instanz.
- `src/lib/audio-tracks.ts` — die drei committeten signierten URLs
  (JWT exp 2027-06) durch tokenlose `object/public/Audio/…`-URLs ersetzt;
  Header-Kommentar auf den Public-Bucket-Stand umgeschrieben (inkl.
  Anleitungs-URL für neue Tracks).
- `src/db/client.ts` — Runtime-DB-Cutover (B2): auf Vercel (`VERCEL` gesetzt)
  bevorzugt der Client `RUNTIME_DATABASE_URL` mit Übergangs-Fallback auf
  `DATABASE_URL`; lokal (Dev-Server UND alle tsx-Skripte, die dieses Modul
  importieren) bleibt es hart bei `DATABASE_URL`. Fehlermeldung beim
  Import-Throw jetzt env-spezifisch.
- `.env.example` — `DATABASE_URL`-/`RUNTIME_DATABASE_URL`-Prosa vom
  „Cutover kommt in S3b" auf den Ist-Zustand gezogen.

## Decisions I made

- **Credential-Wahl auf `VERCEL` gegated statt nacktem `||`-Fallback.** Die
  Spec verlangt „Runtime liest RUNTIME_DATABASE_URL, lokal + Skripte
  unverändert privilegiert". Beides zugleich geht nicht mit einem
  environment-blinden `RUNTIME_DATABASE_URL || DATABASE_URL`: der
  S3a-db-roles-Runbook legt `RUNTIME_DATABASE_URL` ausdrücklich in `.env.local`
  ab (dort liegt es bei Philipp bereits mit Wert), und 37 Skripte unter
  `scripts/**` importieren `@/db/client` via `tsx --env-file=.env.local` — die
  naive Variante hätte Apply/Ingest/Migration lokal still auf die
  SELECT-only-Rolle gesetzt. Der Gate kodiert die Spec-Klammer im Code statt
  per Konvention. `VERCEL=1` ist eine Vercel-System-Env-Var (Build + Runtime,
  default exposed); CI/GitHub Actions bleibt dadurch automatisch auf dem
  unveränderten lokalen Pfad.
- **E6-CSP-Vertrag: Error-Tracker MUSS same-origin tunneln.** Die Paketwahl
  liegt in S5, die CSP soll aber hier final sein („S5 aktiviert nur noch").
  Auflösung: Vercel Analytics + Speed Insights sind in Prod komplett
  same-origin (dokumentiert im Config-Kommentar, dev-only
  `va.vercel-scripts.com`), und für den Tracker ist als Vertrag festgeschrieben:
  gebündeltes SDK (`script-src 'self'`) + Report über eine same-origin
  Tunnel-Route (z. B. Sentry `tunnelRoute`) — `connect-src` bleibt `'self'`,
  es kommt nie ein Dritt-Ingest-Origin dazu. Das constrainted die S5-Paketwahl
  bewusst: ein Tracker ohne Same-Origin-Tunnel ist raus.
- **Healthcheck: Bündeln+Throtteln statt Readiness-Abtrennung.** Die Spec ließ
  beides zu. Ein separates `/readyz` hätte die Semantik des bestehenden
  Monitor-Endpoints geändert (onboarding.md dokumentiert `/healthz` als
  DB-Check für Uptime-Monitore). Coalesce+TTL behält die Semantik und löst das
  eigentliche Problem (unauthentifizierter Endpoint × 1 DB-Query pro Ping auf
  einem `max:5`-Pool). Fail-TTL 5 s < Ok-TTL 30 s, damit Monitore einen Flip
  schnell sehen.
- **Audio: kein Bucket-Flip mehr nötig.** Der Range-/CORS-Check gegen die
  tokenlosen URLs lief VOR der Umstellung — alle drei Tracks antworten auf dem
  `object/public/…`-Pfad bereits mit `206 Partial Content`, korrektem
  `Content-Range` und `Access-Control-Allow-Origin: *`. Der Bucket ist also
  schon public (vermutlich beim S3a-/Storage-Aufräumen passiert). Die alten
  signierten URLs bleiben bis zu ihrem JWT-Expiry parallel gültig — harmlos.
- **Login: Type-Guard vor den Compares.** `formData.get()` liefert
  `FormDataEntryValue | null`; non-string → sofortiger Redirect wie bisher
  (hängt nur an der Request-Form, kein Timing-Kanal Richtung Secret), danach
  beide `timingSafeEqualStr`-Compares unconditional via `Promise.all`.

## Verification

- `npm run lint` — grün. `npm run typecheck` — grün. `npm run test` — 37 Suiten
  grün. `npm run build` — grün (vier PR-Gates).
- **Prod-CSP eval-frei belegt:** `next start` auf dem Prod-Build, Header via
  curl: `script-src 'self' 'unsafe-inline'` — kein `unsafe-eval`, kein
  `va.vercel-scripts.com`; `X-Powered-By` nicht mehr vorhanden.
- **healthz-Throttle belegt:** 5 schnelle Requests → fünfmal identisches
  `ts` (ein einziger DB-Roundtrip), alle 200.
- **Audio 200/206 + Range + CORS belegt:** alle drei Public-URLs mit
  `Range: bytes=0-…` + `Origin`-Header gecurlt → `206 Partial Content`,
  korrektes `Content-Range: bytes 0-…/<size>`, `Access-Control-Allow-Origin:
  *`, `Content-Type: audio/mpeg`.
- **Cutover-Fallback belegt (beide Richtungen, echtes Credential):**
  `.env.local` temporär beiseite, dann (C1) `VERCEL=1` + NUR
  `RUNTIME_DATABASE_URL` → Boot grün, `/healthz` 200 über die echte
  `chrono_runtime`-Rolle; (C2) `VERCEL=1` + NUR `DATABASE_URL` → Boot grün,
  `/healthz` 200. Zusätzlich kompletter `next build` mit NUR
  `RUNTIME_DATABASE_URL` (`VERCEL=1`, ohne `.env.local`) — grün; das ist der
  Zustand nach Haltepunkt 2. `.env.local` danach verifiziert wiederhergestellt.
- **Lokaler Pfad unverändert belegt:** der normale `next start` (ohne `VERCEL`,
  `.env.local` mit BEIDEN Vars) lief auf `DATABASE_URL` — Test A oben.
- Nicht von mir geprüft (per Auftrag Philipp im Browser): Login-Flow und
  MediaPlayer-Wiedergabe.

## Cutover — die zwei Maintainer-Haltepunkte (Einzelschritte)

**Haltepunkt 1 — VOR dem Merge dieses PRs (Philipp, Vercel-Dashboard):**

1. Vercel → Project → Settings → Environment Variables:
   `RUNTIME_DATABASE_URL` anlegen **bzw. verifizieren** — der S3a-Runbook
   staged das Credential bereits in Vercel, dann ist dieser Schritt nur noch
   ein Check. Wert = die vom S3a-Bootstrap gedruckte Pooler-URL (identisch mit
   dem Wert in deiner lokalen `.env.local`; Username
   `chrono_runtime.<project-ref>`, Port 6543).
2. Environments: **Production UND Preview** ankreuzen (Previews laufen sonst
   nach Haltepunkt 2 in den Import-Throw).
3. `DATABASE_URL` in Vercel noch NICHT anfassen.

**Merge + Deploy** (Fallback-Code ist aktiv — mit beiden Vars bevorzugt die
Runtime bereits `chrono_runtime`). Deploy verifizieren: `/healthz` 200,
Archiv/Timeline laden, Login funktioniert, Player spielt (Invite-Aktivierungen
brauchen das `preview_invite_activations`-Upsert-Grant — im S3a-Negativtest
abgedeckt).

**Haltepunkt 2 — NACH verifiziertem Deploy (Philipp, Vercel-Dashboard):**

1. `DATABASE_URL` aus den Vercel-Environment-Variables entfernen
   (Production + Preview; das privilegierte Credential existiert danach nur
   noch lokal + als `MIGRATION_DATABASE_URL`-Secret des Migrate-Workflows).
2. **Redeploy auslösen** (Env-Änderungen wirken erst im nächsten Deploy).
3. Verifizieren: `/healthz` 200 → die Runtime läuft nachweislich nur noch auf
   `chrono_runtime`. Falls stattdessen 500: prüfen, ob „Automatically expose
   System Environment Variables" aktiv ist (der Gate liest `VERCEL=1`;
   Rollback = `DATABASE_URL` wieder anlegen + Redeploy).
4. End-Verifikation „nur Runtime-Credential in Produktion" bleibt formal
   Launch-Readiness Punkt 6.

## Open issues / blockers

Keine Blocker.

## For next session

- `scripts/runbooks/db-roles-runbook.md` (Z. 18) sagt noch „Consumer-Wechsel
  in `src/db/client.ts` + Vercel-Cutover sind S3b" — als Herkunftsangabe nicht
  falsch, aber ein Batches-/Koordinations-Pass kann es auf „seit S3b: Vercel-
  Runtime bevorzugt `RUNTIME_DATABASE_URL` (VERCEL-gegated)" ziehen.
  Strang-Reinheit hat es aus diesem Product-PR herausgehalten.
- **S5-Constraint aus dem E6-CSP-Vertrag:** die Tracker-Paketwahl muss ein
  Same-Origin-Tunnel-Setup unterstützen (Sentry `tunnelRoute` erfüllt das);
  CSP wird in S5 nicht mehr angefasst.
- Die alten signierten Audio-URLs bleiben bis JWT-Expiry (2027-06) gültig;
  wer sie tot haben will, rotiert den Storage-Signing-Key — kein Handlungsbedarf.
- `brain/wiki/onboarding.md` § healthz beschreibt den Endpoint ohne die neue
  Throttle-Semantik (`ts` = Probe-Zeitpunkt, ≤ 30 s alt) — Rollup-Kandidat für
  den nächsten Koordinations-Pass (Brain ist coordination-only, dieser PR
  fasst es absichtlich nicht an).

## References

- Vercel Docs — `@vercel/analytics` advanced config (same-origin
  `/_vercel/insights/*`-Pfade, `va.vercel-scripts.com` als Debug-Quelle):
  https://vercel.com/docs/analytics/package
- Vercel Docs — Speed Insights Troubleshooting (`/<unique-path>/script.js`
  same-origin, Proxy-Hinweis): https://vercel.com/docs/speed-insights/troubleshooting
- docs/launch-master-plan.md § Session 3b (Spec) + § Session 3a Punkt 3
  (Credential-Trennung, Zielbild).
