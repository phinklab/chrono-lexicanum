# Werkstatt-Fahrplan — Chrono Lexicanum

> **Die eine Wahrheit für den Rest der Werkstatt-Phase bis zum Launch — und bewusst nur das, was noch zu tun ist.** Endspurt-Schnitt 2026-07-24 (Session 263): Posten 14–32 samt Kurz-Prompts (Quellen: Maintainer-Notizen 2026-07-24 + extern reviewte Roadmap, gegen den echten Repo-/PR-Stand geprüft). Alles Erledigte (Posten 1–13, Urteils-Kurzreferenz der Runden 235–248, alte Prompts) liegt in [`werkstatt-roadmap-archive.md`](./werkstatt-roadmap-archive.md) — **nicht mitladen**, nur bei Bedarf nachschlagen; ältere Vollstände in der Git-Historie dieser Datei. Verbindliche Ober-Spec bleibt [`launch-master-plan.md`](./launch-master-plan.md) (Nachtrag W1–W6); bei Widerspruch gewinnt der Plan.

## Spielregeln (jede Session)

- **Eine Session pro Posten.** Frische CC-Session, Prompt aus dem passenden Block unten einfügen.
- Koordinations-Worktree (`C:\Users\Phil\chrono-lexicanum`, E8), frischer Branch von `origin/main`; Branch-Name steht im Prompt (`NNN` = nächste freie Session-Nummer — vorher `sessions/` auf die höchste Nummer prüfen, Lehre aus der Kollision, die PR #268 auflösen musste; Stand 2026-07-24: höchste vergebene **263** (261 blieb unbelegt und wird nicht rückwirkend vergeben), nächste freie **264**).
- **Kein Commit/PR, bis Philipp „fertig" sagt.** Philipp merged selbst; „ist gemerged" → Standard-Cleanup (Merge verifizieren, `fetch --prune`, zurück auf `main`, Task-Branch löschen).
- Bewertungsrunden fassen keinen Produktcode an. Bei Urteil **bauen** wird der Zuschnitt in der Runde besprochen; sehr kleine Posten dürfen nach Absprache direkt in derselben Session umgesetzt werden, wenn sie strang-rein bleiben.
- UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Gates pro PR: `typecheck`, `lint`, `test`, `next build`; `brain:lint` wenn `brain/**` berührt.
- Parallele Strang-Arbeit ist ok, solange die Pfade disjunkt bleiben; ein Dev-Server pro Worktree, bei zwei Worktrees Ports trennen (Koordination z. B. `PORT=3001`).
- **Nach jeder Session diese Datei nachführen** (Status-Haken im Fahrplan, neue Urteile/Backlog-Zeilen, ggf. neue Prompts) — die Änderung fährt im Session-PR mit. Erledigte Posten samt Prompt wandern beim nächsten Schnitt ins Archiv-File, nicht hierher zurück.
- Ab Posten 15 (H1) gilt **Dependency-Freeze** bis zum Launch (Ausnahme: kritische Security-Fixes).

## Fahrplan (Reihenfolge = Wahrheit)

> Posten 1–13 (Werkstatt-Runden WP/WL/WM + Bauten W3b, F1, F3, WA, WP-B1, W4-B1, Rollup, S7b) sind erledigt — Tabelle + Urteile im [Archiv](./werkstatt-roadmap-archive.md). Die Nummern 14–32 bleiben stabil.

| # | Posten | Art | Abhängigkeit | Status |
|---|---|---|---|---|
| 14 | **A0** — Timeline-Artwork-Akquise (extern, sofort anstoßen) | Koordination + Mensch | — (längster Vorlauf, W1-Gate) | ☐ |
| 15 | **H1** — Dependabot-Endspurt (#292/#269/#270 mergen, #272 schließen) | Wartung | — | ☐ |
| 16 | **H2** — Weekly Refresh W30 (#281) kuratieren | Batches (Delta-Pfad) | H1 empfohlen | ☐ |
| 17 | **B1** — Era-Anker-Backfill (`primary_era_id` 97 → 896) | Bau (Batches, M) | — | ☐ |
| 18 | **K1** — Karten-Geometrie: Ruinstorm + Ultramar | Bau (Product, S) | — | ☐ |
| 19 | **K2** — Journey-Flicker-Check (bes. Terra) | Diagnose | Gate vor K3 | ☐ |
| 20 | **K3** — Journey-Routen: Warp-Linien + Kontinuität + Sol-Texte | Bau (Product, S–M) | K2 | ☐ |
| 21 | **K4** — „Zum Buch"-Links neu lösen | Bau (Product, M) | — | ☐ |
| 22 | **P1** — `/now` entschlacken + externe Links in neuem Tab | Bau (Product, XS–S) | — | ☐ |
| 23 | **N1** — Navigation-Revisit (Bewertung) | Bewertung | — | ☐ |
| 24 | **N1-B1** — Navigation-Rework (Bau) | Bau (Product, Größe aus N1) | N1-Urteil | ☐ |
| 25 | **P2** — AI-Speech-Sweep über alle Website-Texte | Qualitätspass | nach K3 + N1-B1 (letzte Copy-Änderungen) | ☐ |
| 26 | **L1** — Logo-Einbau (BrandBeacon, Icons, OG) | Bau (Product, XS–S) | Logo von Philipp | ☐ |
| 27 | **A1** — Timeline-Artwork-Integration | Bau (Product, S–M) | A0-Assets + schriftliche Freigaben | ☐ |
| 28 | **S11-Code-PR** (pixelgleich) | Qualitätspass | 15–25 gemerged | ☐ |
| 29 | **R1** — Migration 0016 → Produktion | Release (Batches) | — | ☐ |
| 30 | **R2** — Content-Freeze + finaler Snapshot | Release (Batches) | H2, B1, K1/K3-Daten, R1 | ☐ |
| 31 | **R3** — Launch-Readiness (12 Punkte) → Gate-off | Endspiel | alles davor inkl. L1 + A1 | ☐ |
| 32 | **Stilles Fenster** (PL1, S7b-Live-Messung, S11-Doku-Rollup) → Reddit | Endspiel | R3 | ☐ |

**Kritischer Pfad (Launch bleibt blockiert, solange offen):** Artwork + Nutzungsfreigaben (A0/A1) · Store-Links laufen sichtbar ins Leere (K4) · Journey-Flicker reproduzierbar (K2) · Migration 0016 nicht produktiv belegt (R1) · finaler Content-Snapshot fehlt (R2) · 12-Punkte-Gate nicht vollständig grün (R3). SEO-/Mobile-/DB-Optimierung sind **keine** eigenen Feature-Wellen mehr — sie sind messbare Abnahmen im Gate (R3). Größtes Scope-Risiko ist N1/N1-B1 (Nav-Rework): strikt Bewertung → Urteil → begrenzter Bau, sonst driftet der Endspurt.

Posten 28–32 laufen über [`launch-session-prompts.md`](./launch-session-prompts.md) bzw. das Launch-Readiness-Kapitel des Plans — die Kurz-Prompts unten verweisen dorthin.

## Backlog (post-launch, mit Revisit-Trigger)

Volle Urteils-Begründungen im [Archiv](./werkstatt-roadmap-archive.md) § Urteils-Kurzreferenz.

- **W3b-B3 Zeitstrahl auf der Map** — auf Maintainer-Zuruf; fertiger Kickoff-Prompt (Roast-Fragephase) im Archiv.
- **W3a Charakter-Graph** (Ko-Okkurrenz-v1) — post-launch; entscheidungsreifer Zuschnitt im Archiv (Prompt § 10).
- **WL Personal Library** (+ F2 Doppelkauf-Warner) — erst bei echter Nutzer-Nachfrage; dann local-first-M-v1 (Zuschnitt in der Archiv-Kurzreferenz), Accounts allenfalls später.
- **W4 Provenienz-Badges** — konsolidiert die lokalen H/M/L-Wordings von `/now` + `/statistics`, falls je gebaut.
- **W5 Podcasts auf Buchseite · W6 Size Comparison** — post-launch; W6 braucht zuerst einen Brief (Schema).
- **WA-Reste:** Series-Status-Board (nach `seriesHint`-Promotion, eigener Batches-Posten), Verpasst-Generator (als `/now`-Erweiterung), Charakter-Dossiers (nach W3a-Bau), Spoiler-Graph (fern, Serien-Granularität).
- **WP-Reste:** Galaspar-Pin (sobald Philipp Koordinaten abgelesen hat — XS, alles andere liegt bereit), Podcast-Aliasse (175 Formen vorsortiert in `scripts/seed-data/podcast-aliases.review.md`).

---

## Prompts — Endspurt (Posten 14–32)

> Kurz-Prompts für Plan-Mode-Sessions. Die Spielregeln oben gelten für jede davon (Koordinations-Worktree, frischer Branch von `origin/main`, kein Commit/PR bis „fertig", UI-Abnahme im Browser, danach Fahrplan-Haken hier). Der Kürze halber wiederholen die Prompts das nicht.

### 14 · A0 — Timeline-Artwork-Akquise

```text
Plan-Mode: Timeline-Artwork-Akquise (W1-Gate-Blocker, längster externer Vorlauf — sofort anstoßen, läuft menschlich parallel weiter).
Inventarisiere benötigte Era-/Event-Bilder gegen vorhandene Assets + Credits (Timeline-Seeds, Era-Credits, Event-Art-Overrides), priorisiere die anzuschreibenden Künstler und formuliere versandfertige Kurz-Anfragen (Rechte, Credit, Format, Deadline) + sauberen No-Response-Fallback. Noch nichts integrieren. Branch: codex/session-NNN-artwork-akquise.
```

### 15 · H1 — Dependabot-Endspurt

```text
Dependabot-Endspurt (Stand 2026-07-24: alle vier offen und mergeable): #292 Minor/Patch-Gruppe (React/Sentry — vorher Build, Tests, Smoke auf aktuellem main), danach #269 setup-node 7 und #270 actions/cache 6 einzeln und nacheinander (je einen echten CI-Lauf beobachten), #272 ESLint 10 mit dokumentierter Begründung schließen (Lint rot, Next-/Plugin-Stack inkompatibel — kein Dauer-Ignore, post-launch neu bewerten). Erst Triage-Plan mit Merge-Empfehlung je PR vorlegen; gemergt wird erst nach meinem Go. Danach gilt Dependency-Freeze bis zum Launch (Ausnahme: kritische Security-Fixes). Branch: codex/session-NNN-dependabot-endspurt.
```

### 16 · H2 — Weekly Refresh W30 (#281)

```text
Weekly Refresh W30 (#281) vollständig verarbeiten (Weekly-Refresh-Konventionen): Detection-PR nach Review mergen (mein Go), dann kuratieren — „Ghosts of Cadia" und die Flames-of-Betrayal-Kollision entscheiden, die zwei neuen Podcast-Episoden über den Delta-Pfad, anschließend refresh:mark-reviewed -- --books (erst mergen, dann marken). Source-first — kein Produktions-Apply; der landet im finalen Content-Release (Posten 30). Branch: codex/ingest-batches-weekly-w30.
```

### 17 · B1 — Era-Anker-Backfill

```text
Werkstatt-Batch B1 — Era-Anker-Backfill (primary_era_id für den ganzen Korpus). Logischer Strang Batch/Ingestion, physisch aus dem Koordinations-Worktree (Launch-Ausnahme). Branch: codex/ingest-batches-era-anchor-backfill.
Ziel: book_details.primary_era_id ist nur auf ~97 kuratierten Büchern gesetzt (896 gesamt) — den redaktionellen Era-Anker über den gesamten Korpus nachziehen, damit Librarium (/statistics) und künftige Auswertungen nach In-Universe-Ära filtern können.
Weg (SSOT, nie direkt in die DB): (1) Feldnamen in scripts/seed-data/books/ an einem bereits geankerten Buch + apply:book-Code klären. (2) Ära pro Buch aus den stärksten Signalen ableiten, in dieser Reihenfolge: Setting-Datum (works.start_y/book-dates) → Serien-/Titelkonvention (Horus Heresy, Siege of Terra, Primarchs) → Synopsis + Lore per LLM-Batch nach F1-B1-Muster; Herkunft/Konfidenz nach SSOT-Konvention kennzeichnen. (3) Reguläre apply-Kette, dann Zähl-Validierung: Bücher pro Ära, 0 verbleibende NULL-Anker (oder begründete Restliste), ~20 Stichproben gegenlesen. Kein brain/**, kein sessions/README.md; Impl-Report als frische Session-Datei.
Abnahme-Hinweis für den Report: Nach dem Merge kann das Librarium den Recurring-Cast-Ära-Toggle bauen (Heresy vs. 41st Millennium, Radio-Toggle wie „Banners on the Shelves") — post-launch.
```

### 18 · K1 — Karten-Geometrie: Ruinstorm + Ultramar

```text
Cartographer-Geometrie-Korrektur (Product, S):
(a) Ruinstorm neu ausmessen — wenn die Ultramarines-/Guilliman-Route den Ruinstorm bei Davin passiert, muss die Zone deutlich weiter nach Westen reichen; gegen die Journey-Stationen vermessen.
(b) Ultramar nachziehen — Calth (aktuell draußen), Latona und Saramanth müssen in allen relevanten Zeitständen innerhalb der Zone liegen.
Erst Weltkoordinaten + Zonengeometrie verifizieren (src/lib/map/zones.json, Zone-Editor /map?zones=edit; im Repo-Root liegt ein möglicher Zwischenstand zones-draft-backup-2026-07-18.json — vor Beginn klären, ob der einfließen soll), dann nur die nötige Kuration ändern. SVG-/Canvas-Parität + Nachbarzonen prüfen; Formen-Abnahme durch mich im Browser. Branch: codex/product-map-zone-fixes.
```

### 19 · K2 — Journey-Flicker-Check

```text
Journey-Flicker-Diagnose (Gate vor K3): Prüfe zuerst, ob der Great-Journeys-Flicker (besonders Terra) auf aktuellem main überhaupt noch reproduzierbar ist. Falls ja: Matrix aus Journey/Station/Browser/Viewport/Zoom/Renderer, Abgrenzung gegen den Fix aus Session 245 (sessions/2026-07-17-245-impl-map-flicker-fix.md), nur den kleinsten belegten Fix planen + Desktop/iOS/Android-Abnahme. Merke: der Android-Flicker war lokal nie reproduzierbar — im Zweifel On-Device zuerst, keine Desktop-Trace-Beweise. Falls nicht reproduzierbar: Posten dokumentiert abhaken und K3 freigeben. Branch: codex/product-journey-flicker-check.
```

### 20 · K3 — Journey-Routen: Warp-Linien + Kontinuität + Sol-Texte

```text
Journey-Routen-Pass (Product, S–M; erst nach K2):
- Linien-Grammatik für Sprünge ohne gezeichnete Verbindung: zweite Linienart (z. B. gepunktet/gerade) für Warp-Sprünge, damit die Reise nachvollziehbar bleibt — betrifft mindestens Lion und Abaddon; an der Warp-Sprung-Darstellung von Yvraine orientieren, Guilliman mitprüfen. Beide Renderer (SVG + Canvas).
- Routen-Kontinuität: die Lion-Route hat viele unverbundene Sprünge — schließen oder explizit als Warp-Segmente auszeichnen; Guilliman genauso.
- Text-Fixes in src/lib/map/voyages/data/ (u. a. warmasters-web.ts): Imperial Fists „turn Sol into a Fortress" und der Death-Guard-Blurb → einheitlich „the Sol System"; Alpha-Legion-Blurb um den Sol-Punkt ergänzen („The Alpha Legion closes the Drop Site trap, delays the White Scars at Chondax and penetrates Sol at Pluto, where Dorn kills Alpharius. Omegon's later withdrawal around Ullanor and scattered cells on Terra do not restore a single Legion route.").
UI-Abnahme durch mich im Browser. Branch: codex/product-journey-routes.
```

### 21 · K4 — „Zum Buch"-Links neu lösen

```text
„Zum Buch"-/Acquire-Links neu lösen (Product, M). Die Annahme in src/lib/store-links.ts, generierte Suchlinks könnten nicht veralten, ist widerlegt: viele Amazon-Links laufen ins Leere, Black-Library-Links gehen gar nicht erst.
Erst messen: Fehlerquote für Amazon, Audible und Black Library über repräsentative Titel/Regionen; aktuelle Store-Endpunkte recherchieren. Dann Neulösung planen: kuratierter Direktlink (external_links), wenn vorhanden → verifizierter Such-Fallback → Button ausblenden oder ehrlich als Suche kennzeichnen; dazu Verfügbarkeitsstatus, automatischen Link-Validator und Backfill-Pfad bewerten. Grundsatz: kein Button verspricht Verfügbarkeit, die nicht belegt ist. Branch: codex/product-store-links.
```

### 22 · P1 — `/now` entschlacken + externe Links in neuem Tab

```text
UI-Kleinpass (Product, XS–S):
- /now entschlacken: den Textblock unter der Zeitangabe entfernen und stattdessen den „Current Era"-Text dorthin ziehen; die Rauten vor den Jahreszahlen entfernen.
- Link-Verhalten: Buch-/Podcast-Links aus Timeline-Punkten (und dieselbe Frage für Map-Popups/Journey-Karten prüfen) in neuem Tab öffnen (target="_blank" + rel="noopener"), damit man den Timeline-/Karten-Kontext nicht verliert. Normale Navigation (Nav, Archiv-Listen) bleibt im selben Tab.
UI-Abnahme durch mich im Browser. Branch: codex/product-now-links-polish.
```

### 23 · N1 — Navigation-Revisit (Bewertung)

```text
Werkstatt-Runde N1 — Navigation-Revisit (Bewertung, keine Umsetzung). Anlass: die Navigation soll als Ganzes neu gedacht werden („UI neu").
Ist-Stand nach Session 256 (Curator/Compendium) erheben: Rail, Burger, Zahl + Reihenfolge der Einträge, /now- und /statistics-Einbindung, Mobile. Dabei mitprüfen, ob der Great-Journeys-Einstieg nach WM-B1 (Session 249) noch Defizite hat oder als erledigt gelten kann — nicht doppelt bauen. 2–3 klar unterscheidbare Richtungen mit Empfehlung + grober Größe vorlegen; Design-Dauerurteile beachten (kein Glow, keine nackten Linien-Buttons, kein dicker Nav-Unterstrich, Buch-Titelblatt-Sprache). Danach mein Urteil (bauen / Backlog / verwerfen); bei „bauen" den N1-B1-Bau-Prompt hier ergänzen. Branch: codex/session-NNN-nav-bewertung.
```

### 24 · N1-B1 — Navigation-Rework (Bau)

> Prompt entsteht aus dem N1-Urteil (Zuschnitt, Größe, Scope-Grenzen). Bis dahin bewusst leer — kein Bau ohne Urteil.

### 25 · P2 — AI-Speech-Sweep über alle Website-Texte

```text
AI-Speech-Sweep (Qualitätspass; erst nach den letzten Copy-Änderungen aus K3 und N1-B1, sonst läuft der Sweep zweimal): text:lint (Em-Dash-Lint, Session 257) um weitere AI-Sprachmuster erweitern (Gedankenstrich-Ersatzmuster, „not X but Y"-Floskeln, Triaden-Rhythmus u. ä.) und über sämtliche Website-Texte laufen lassen — inkl. Journey-Blurbs, /now-Prosa, Ask-/Archiv-/Statistik-Texte. Befund zuerst vorlegen (Muster + Fundstellen), dann nach meinem Go fixen. Branch: codex/product-text-ai-sweep.
```

### 26 · L1 — Logo-Einbau

```text
Logo-Einbau (Product, XS–S; läuft, sobald mein finales Logo vorliegt — WP-Urteil: Philipp liefert): BrandBeacon-Tausch, Favicons/App-Icons/OG-Flächen aus dem logo_cl_v2.svg-Nachfolger regenerieren, kleine Größen + Hell/Dunkel prüfen. Falls das Logo doch noch nicht final ist: zuerst eine kleine Richtungs-Runde (Signet, Wortmarke, kleine Größen, BrandBeacon/Map/Favicon/OG-Flächen) — kein generisches 40K-Wappen, bestehende Typografie + Sternwarten-Sprache. Branch: codex/product-logo-integration.
```

### 27 · A1 — Timeline-Artwork-Integration

```text
Timeline-Artwork-Integration (Product, S–M; blockiert bis Assets + schriftliche Nutzungserlaubnisse aus A0 vorliegen): Assets eindeutig Era/Event + Credits zuordnen, Crop/Focal-Point definieren, WebP-Größen + responsive Darstellung + Fallbacks, Kontrast/Crossfades/Reduced-Motion/Mobile prüfen. Keine unfreigegebenen oder unzureichend belegten Bilder. Branch: codex/product-artwork-integration.
```

### 28 · S11-Code-PR

```text
S11-Code-PR (pixelgleich) nach docs/launch-master-plan.md § Session 11: Masterplan-Liste auf aktuellem main re-baselinen (vieles ist seit dem Schnitt erledigt), Scope nur belegte Reste — echte Hydration-Ursache statt suppressHydrationWarning, gemeinsame Roman-/Motion-Helfer, stale Kommentare, nachweislich toter Code. Keine neuen Abstraktionen, keine spekulativen Perf-Refactors. Der S11-Doku-Rollup bleibt im stillen Fenster (Posten 32). Branch: codex/product-s11-cleanup.
```

### 29 · R1 — Migration 0016 → Produktion

```text
Migration 0016 sicher in Produktion über den bestehenden Migrate-Workflow: vorher Repo-/DB-Head + Rehearsal prüfen; danach Migrationsparität, db:drift, Runtime-Rollen-Negativtests und Data-API-/RLS-Exposition belegen. Keine improvisierte SQL, noch kein Snapshot. Dabei die offenen Betriebs-Punkte prüfen und — soweit tatsächlich noch offen — abräumen oder terminieren: Cutover-Haltepunkt 2, NEXT_PUBLIC_SITE_URL entfernen, Sentry-Testevents + Gating, optional SMOKE_DATABASE_URL. Branch: codex/ingest-batches-migration-0016.
```

### 30 · R2 — Content-Freeze + finaler Snapshot

```text
Finaler Launch-Content-Release strikt nach scripts/runbooks/content-release-runbook.md: Content-Freeze, read-only Migrationspreflight, mein explizites DB-Go, genau EIN vollständiges db:sync (trägt Weekly W30, Era-Backfill und alle SSOT-Korrekturen aus K1/K3 in die Produktion), Snapshot-Regeneration mit Head 0016, Plausibilitäts-/Hot-ID-/Determinismusprüfung, eigener Snapshot-PR als Deploy, danach genau eine Revalidation + Live-Smoke. Voraussetzungen laut Fahrplan: H2 + B1 + K-Daten auf main, R1 belegt, Artwork komplett, alle Produkt-PRs + S11 gemerged.
```

### 31 · R3 — Launch-Readiness → Gate-off

```text
Einmaliges 12-Punkte-Launch-Readiness-Gate nach docs/launch-master-plan.md § Launch-Readiness: jeder Punkt mit konkretem Beleg, rote Punkte stoppen den Ablauf; Rollback + Abort-Kriterien vor dem Flip festlegen. Erst nach meinem Go: Gate-off, frischer Production-Deploy, Live-Prüfung — robots, Sitemap, Canonicals, Redirects, OG/JSON-LD, Analytics, Sentry, Audio, kalter/warmer Cache, echte Mobilgeräte (iPhone/Safari, Android/Chrome, Tablet, Textzoom, Reduced Motion, Tastatur), reale LCP/INP/CLS-Werte, Search-Console- + Rich-Results-Stichproben, Vercel-Env vollständig und Produktion nur mit Runtime-DB-Credential. Kein pauschales DB-Indexing — nur gemessene Queries über pg_stat_statements.
```

### 32 · Stilles Fenster → Reddit

```text
Stilles Post-Gate-Fenster vor der Ankündigung: PL1 Preview-Gate-/Login-Abbau, finale S7b-Live-Performance-Messung, separater S11-Brain-/Session-Rollup als Koordinations-PR (Rollup-Ownership). Danach ein letzter vollständiger Production-Smoke — erst bei Grün ist der Reddit-Post freigegeben.
```
