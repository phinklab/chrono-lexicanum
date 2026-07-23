# Launch-Runbook — Gate-off, Live-Checks, Search Console, Rollback

> **Geschrieben in Launch-Session S5** (`docs/launch-master-plan.md`
> § Session 5 Punkt 6). **Ausgeführt wird es genau einmal, im
> Launch-Readiness-Schritt** — nachdem das komplette Belegpaket
> (launch-master-plan § Launch-Readiness Punkte 1–10) erhoben ist. Es ist
> bewusst ein Maintainer-Runbook: jeder Schritt läuft über Philipps
> Vercel-/Strato-/Google-Zugänge.
>
> **Kernmechanik, die man verstanden haben muss:** `noindex` und `robots.txt`
> sind **build-gebacken** (`src/lib/site-url.ts` → `siteIndexable()`, Lever
> `PREVIEW_GATE=off`). Ein Env-Flip allein ändert am laufenden Deployment
> **nichts** — erst der **nächste Production-Build** backt `index,follow`,
> die offene robots.txt und die Sitemap-Referenz ein. Deshalb ist „Gate aus"
> immer ein Zwei-Schritt: Env ändern **→ frischer Production-Deploy**.

---

## Stufe 0 — Voraussetzungen (alle VOR diesem Runbook erledigt)

| # | Zustand | Woher |
|---|---|---|
| 1 | Launch-Readiness-Belegpaket vollständig protokolliert | launch-master-plan § Launch-Readiness |
| 2 | Finaler Content-Release durch (Snapshot-PR = Deploy, Revalidation gelaufen) | content-release-runbook |
| 3 | Vercel-Env **Production**: `SITE_URL=https://www.chrono-lexicanum.com` (seit dem S5-Merge zwingend — ohne den Wert scheitert jeder Prod-Build), `RUNTIME_DATABASE_URL` (nur noch dieses DB-Credential), `REVALIDATE_TOKEN`, `PREVIEW_USER`, `PREVIEW_PASS`, `PREVIEW_SESSION_SECRET`, `ATLAS_PASS` | S3a/S3b/S5/W4 |
| 4 | `NEXT_PUBLIC_SENTRY_DSN` in Vercel gesetzt und der Error-Tracker end-to-end belegt (erzwungener Server- + Client-Fehler sichtbar im Sentry-Dashboard) | S5-Report bzw. dieser Schritt |
| 5 | Vercel-Dashboard-Toggles **Web Analytics** und **Speed Insights** aktiviert (Project → Analytics / Speed Insights → Enable) | S5 |
| 6 | Search-Console-Zugang zu `chrono-lexicanum.com` vorbereitet (Google-Konto) | — |

## Stufe 1 — Gate aus + frischer Deploy

1. Vercel → Project → Settings → Environment Variables → **Production**:
   `PREVIEW_GATE` auf `off` setzen (bzw. anlegen). **Nur Production** — die
   Preview-Umgebung behält das Gate.
2. **Frischen Production-Deploy auslösen** (Redeploy des `main`-HEAD im
   Vercel-Dashboard, „Use existing build cache" AUS — der Build muss die neue
   Env sehen). Warten bis der Deploy READY ist.
3. Merken/notieren: die Deployment-URL des **letzten Gate-on-Deployments**
   (für den Rollback, Stufe 4).

## Stufe 2 — Live-Checks (sofort nach dem Deploy)

Alle gegen `https://www.chrono-lexicanum.com`:

1. **Gate wirklich offen:** `/` liefert 200 und die Hub-Seite, kein
   307 → `/login`.
2. **Meta-Robots:** `curl -s https://www.chrono-lexicanum.com/ | grep -i robots`
   → `index, follow` (KEIN `noindex`). Stichprobe zusätzlich auf `/archive`
   und einem `/book/<slug>`.
3. **Admin-Flächen bleiben zu:** `/login`, `/ingest`, `/book/<slug>/audit`
   tragen weiterhin `noindex`; `/ingest` antwortet 401 ohne Basic-Auth.
4. **robots.txt:** `curl -s https://www.chrono-lexicanum.com/robots.txt` →
   Disallow nur für `/api/`, `/ingest`, `/login`, `/healthz`, `/monitoring`,
   `/book/*/audit` + `Sitemap:`-Zeile. (Kein blanket `Disallow: /` mehr!)
5. **Sitemap:** `curl -s https://www.chrono-lexicanum.com/sitemap.xml` — lädt,
   URL-Anzahl plausibel (~2.300: ~900 Bücher + ~1.300 Entities + Rest), alle
   URLs auf `https://www.chrono-lexicanum.com`, Stichproben-URLs antworten 200.
6. **Canonicals:** Stichprobe `/archive?q=horus` → Canonical zeigt auf
   `/archive`; `/book/<slug>?store=de` → auf `/book/<slug>`;
   `/timeline?era=…` → auf `/timeline`.
7. **OG/Share:** `curl -s https://www.chrono-lexicanum.com/book/<slug> | grep og:` —
   og:title/og:image gesetzt; Default-Card auf `/` (`/img/og-default.jpg`).
   Optional: Karte in einem Share-Debugger (z. B. opengraph.xyz) ansehen.
8. **Redirects:** `curl -sI https://www.chrono-lexicanum.com/buch/eisenhorn-xenos?store=de`
   → 308 auf `/book/eisenhorn-xenos?store=de` (Query überlebt). Apex:
   `curl -sI https://chrono-lexicanum.com/timeline?era=m41` → 308 auf `www`
   mit Pfad+Query (Strato-seitig, S0-verifiziert).
9. **Kein zweiter indexierbarer Host (Launch-Readiness Punkt 7):**
   `curl -s https://chrono-lexicanum.vercel.app/ | grep -iE "robots|canonical"` —
   Canonical zeigt auf `www.chrono-lexicanum.com` (metadataBase = SITE_URL);
   idealerweise in Vercel einen Redirect `*.vercel.app → www` konfigurieren
   (Project → Settings → Domains → Redirect).
10. **Live-Crawl-Smoke** (aus dem Launch-Readiness-Gate): die 6 Kernrouten
    einmal im Browser öffnen (Hub, /archive, /timeline, /map, /ask,
    /archive/podcasts) — 200, gerendert, keine Console-Errors.

## Stufe 3 — Search Console + Sitemap-Submission

1. [search.google.com/search-console](https://search.google.com/search-console)
   → Property anlegen. **Domain-Property** `chrono-lexicanum.com` (deckt www +
   Apex + http/https ab); Verifizierung per DNS-TXT-Record bei Strato.
   Fallback, falls DNS-Zugriff hakt: URL-Prefix-Property
   `https://www.chrono-lexicanum.com` (Verifizierung per HTML-Datei/Meta-Tag
   ginge auch, braucht dann aber einen Mini-Deploy).
2. Search Console → Sitemaps → `https://www.chrono-lexicanum.com/sitemap.xml`
   einreichen. Status „Erfolgreich" abwarten (kann Stunden dauern; „Konnte
   nicht abgerufen werden" direkt nach dem Einreichen ist normal, einmal neu
   laden).
3. Optional (empfohlen): Bing Webmaster Tools — Import aus der Search Console.
4. **Erwartung setzen:** Indexierung ist ein Prozess von Tagen bis Wochen.
   Nichts nachjustieren, bevor die Console erste Coverage-Daten zeigt.

## Stufe 4 — Rollback / Abort

**Wann wird gezogen (Abort-Kriterien)** — eines reicht:

- Kernrouten (Hub, /archive, /timeline, /map, /ask) liefern 5xx oder leere
  Seiten, und es ist kein transienter Einzelfall (Reload + zweiter Browser).
- Datenleck-Verdacht: irgendetwas aus `submissions`/Admin-Flächen ist ohne
  Auth erreichbar.
- DB-Ausfall, der NICHT als S2-Fehlerfläche degradiert (Besucher sehen
  Rohfehler statt der Error-Boundary).
- CSP blockiert eigene App-Skripte (Console voller CSP-Violations, Seite
  funktionslos).
- Sentry meldet einen Fehlersturm auf Kernrouten (>~100 Events/h derselben
  Signatur), der sich nicht binnen ~1 h diagnostizieren lässt.

**Nicht** rollbacken wegen: einzelner 404s, Cosmetics, langsamer Indexierung,
einzelner Sentry-Events.

**Wie (zwei Hebel, je nach Fall):**

- **Hebel A — Instant Rollback (kaputter Deploy, Gate-Zustand egal):**
  Vercel-Dashboard → Project → Deployments → vorheriges funktionierendes
  Production-Deployment → ⋯ → **Instant Rollback**. (CLI-Äquivalent:
  `vercel rollback <deployment-url>`.) Rollt auch gebackenes noindex/robots
  des Ziel-Deployments zurück — nach einem Rollback auf ein
  Gate-on-Deployment ist die Site wieder zu UND noindexed; das ist der
  gewollte „Launch abbrechen"-Zustand.
- **Hebel B — Gate wieder schließen (Deploy ok, aber Launch abbrechen):**
  `PREVIEW_GATE` in Vercel-Production wieder entfernen/auf einen anderen Wert
  setzen **→ frischer Production-Deploy** (dieselbe Zwei-Schritt-Mechanik wie
  Stufe 1 — der Env-Flip allein schließt nur das Gate (Proxy liest zur
  Laufzeit), backt aber noindex/robots erst mit dem Redeploy wieder ein).

Nach jedem Rollback: kurze Notiz (Zeitpunkt, Kriterium, Hebel) in den
Session-/Readiness-Report; Search-Console-Sitemap NICHT löschen (Google
verkraftet die Pause).
