---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-06-13
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-06-13-150-impl-polish-sweep.md
  - ../../sessions/archive/2026-06/2026-06-09-133-arch-weekly-content-refresh.md
  - ../../sessions/archive/2026-06/2026-06-10-136-impl-book-promote-30.md
  - ../../sessions/archive/2026-06/2026-06-08-132-impl-luetin09-full-40k-apply.md
  - ../../sessions/archive/2026-06/2026-06-11-140-impl-timeline-cinematic-port.md
  - ../../sessions/archive/2026-06/2026-06-11-144-impl-technical-deep-review.md
  - ../../sessions/2026-06-12-147-impl-deep-review-fixes.md
  - ../../sessions/2026-06-12-148-impl-weekly-refresh-delta.md
related:
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Project state — 2026-06-12 (Pre-Launch: Discovery-Layer shipped, Site hinter Preview-Gate)

> The "where are we now" anchor. **Nur aktueller Stand. Historie → [`log.md`](./log.md) + git.**

## Phase

**Phase 3 (Pipeline) ist im Wartungsmodus, Phase 4/5 (Discovery + Tools) sind substanziell shipped, der Fokus liegt auf Pre-Launch-Härtung + Frontend-Polish.** Der Buchkorpus läuft additions-only über den **Weekly-Content-Refresh** (Brief 133: Cron → Detection → Rolling-PR → bestehende Apply-Pfade). Die Site trägt seit Juni das volle öffentliche Gerüst — Home (3 Bänder), `/archive`, `/compendium`, `/timeline` (Cinematic), `/ask`, `/podcasts`-in-`/archive` — und steht **hinter einem Preview-Login-Gate** (Session 145; Kill-Switch `PREVIEW_GATE=off` für den Launch). Drei Deep-Reviews (140 Backend / 141 Frontend / 144 Technical, zusammen ~290 verifizierte Findings) plus Umsetzungs-PR (147, sieben Wellen) haben Caching, Security, Resilienz und A11y auf Launch-Niveau gezogen. Phasenplan: [`roadmap.md`](./roadmap.md) (Status-Snapshot 2026-06-12).

**Arbeitsmodus:** zwei stehende Strang-Boards ([121 Product](../../sessions/2026-06-03-121-arch-product-board.md), [122 Batches](../../sessions/2026-06-03-122-arch-batches-board.md)) statt Einzel-Briefs; Briefing pro Task über Chat, kleine CC-Handoff-Docs, Cowork reviewt + archiviert. Daneben Maintainer-direkte Zwischensessions (143/145/146) für Polish.

## Branch & Worktrees

Unverändert: `origin/main` read-only für Code (Task-Branch + PR), Doc-only direkt auf `main`; drei Worktrees (Coordination/Product/Batches); Rollup-Ownership Brief 095 (nur Coordination schreibt `brain/**` + `sessions/README.md`); Cowork fasst nie `git` in der Sandbox an, git-Kommandos an Philipp **zeilenweise** (PowerShell 5, kein `&&`). **Neu seit 147:** `ci.yml` läuft auch auf `push: main` — direct-to-`main` Doc-Commits werden jetzt von CI gelintet (lokales `brain:lint -- --no-write` vor dem Push bleibt trotzdem Pflicht-Höflichkeit). **Ebenfalls neu seit 147:** der Vercel-Build migriert **nicht mehr automatisch** — Migrationen laufen via `npm run db:migrate` lokal oder `.github/workflows/migrate.yml` (workflow_dispatch, Pooler-URL).

## Latest state (2026-06-12)

**Korpus: 889 Bücher** = 859 Excel-SSOT (frozen) + 30 Weekly-Refresh-Promotions via `book-roster.extension.json` (Session 136; Override-Batches `ssot-w40k-058..060` + extended `057`/`hh-030`, alle 30 kuratiert + in der DB). Migrationen durch `0013` applied.

**Podcasts/YouTube: 4 Shows, ~1094 `podcast_episode`-Works.** The 40k Lorecast (149 Ep.), Adeptus Ridiculous (363), Lorehammer (391, „(Video)"-Twins dedupliziert), Luetin09 (YouTube-Adapter Brief 130; 191 Lore-Episoden aus 1854 Uploads, `source_kind=youtube`). Show-/Episode-Links autoritativ in `external_links` (Provenance `sourceKind`+`confidence`, Migration 0011); Tagging über `resolveSurfaceForm`; **CC-Direct-Tagging** (`--tagging=cc-direct`, Brief 131/132: `claude -p`-Subsessions auf der Max-Allowance, byte-identisch zum API-Pfad) ist der bewährte Null-Kosten-Pfad.

**Timeline-Daten (Brief 137, live verifiziert):** 8 kuratierte Eras, 144 Events, 223 `event_works`-Hooks (95 Buch / 125 Episode / 3 Serie), 97 datierte Werke (53 event-anchored). Migration 0012; `apply:timeline` idempotent. Quelle war die Cowork+Philipp-Hand-Kuratierung im git-ignorierten `/timeline-workshop/` (Board 122-B5, weiter ⏸ für die Rest-Bücher).

**Entity-Blurbs (Board 122-B3): Full-Coverage 981/981** (202 Factions / 490 Characters / 289 Worlds) als seed-data-JSON mit per-Row-Provenance — Subset + Machinery via Handoff (2026-06-09), Full-Sweep maintainer-direkt nachgezogen. Live im `/compendium`; Factions ohne Werke werden nicht mehr gelistet.

**Ask-Modell (122-B4 + 121-P3):** flacher 5-Fragen-Contract, server-only `recommend()` mit Curation-Overlay (`ask-curation.json`) und Hard Boundaries (Faction-Gate, Single-Book-Format-Gate); alle 1080 Kombinationen liefern ≥1 Empfehlung (Audit `npm run audit:ask-combinations`).

## What's running

- **App auf Vercel** — <https://chrono-lexicanum.vercel.app/>, **anonyme Besucher sehen nur `/login`** (httpOnly-Cookie, Default-Creds committed = bewusster Soft-Lock; `PREVIEW_GATE=off` zum Launch). Routen: Home (3-Bänder-IA, Brief 120/129), `/archive` + `/archive/podcasts` (ex `/werke`+`/podcasts`, 308-Redirects, `?focus=`-Opener), `/compendium` (5 Kategorien; Primarchen-Seam wartet auf 122-B9-Kuration) + `/person/[slug]`, `/timeline` (Cinematic+Index, DB-fed, 19 WebP-Era/Event-Artworks mit Artist-Credits, Brief 138/140 + Polish 145/146), `/ask` (Funnel), `/buch/[slug]`, `/map`, Entity-Hubs. Globales Chrome: Burger-`SiteMenu` (TopNav gelöscht, Session 139/140).
- **Caching/Hardening (147):** `READ_CACHE_TTL` 3600 s, `/api/revalidate` (Bearer `REVALIDATE_TOKEN`), Teaser-Synopsis senkt `/archive`-Payload 16,45→2,21 MB, `loading.tsx` auf 7 Routen, Security-Header, `/audit`+`/ingest` admin-ge-gatet, timing-safe Auth-Vergleiche, Next-CVE-Bump.
- **CI:** `lint-and-typecheck` + `brain:lint --no-write` auf PRs **und** `push: main`; `migrate.yml` (workflow_dispatch) für DB-Migrationen; `weekly-refresh.yml` Cron Mo 06:00 UTC → Rolling-PR `automation/weekly-refresh` (detection-only, keine DB-Secrets), Delta-Reporting via `book-seen.json`-Cursor + `book-ignore.json` (133/134/148).
- **DB auf Supabase** — Pooler 6543, prod; Pool `max:5` ist bewusst und bleibt (Review-144-Schiedsspruch: Hebel ist Caching, nicht Pool-Size).
- **Standing tools (dormant):** SSOT-Loop + Resolver-Loop (Ad-hoc-Roster-Erweiterungen), Konsolidierungs-Pass, Atlas-Regen, Brain-Lint.
- **`/lab/design`** — Styleguide-Deliverable aus Review 141 (Palette, Typoskala, Kern-Bausteine, Do/Don'ts); Grundlage für den angekündigten Frontend-Brief.
- **Polish-Sweep shipped (Brief 150, impl 2026-06-13):** Content-Warnings an einer zentralen Stelle (`facet-visibility.ts`) aus jeder Besucher-Oberfläche gefiltert (Admin-Spiegel `/atlas`+`/buch/[slug]/audit` filtern bewusst nicht); Fraktions-Sigils statt Punkt (Imperium/Space-Marines/Xenos/Chaos, `faction-icon.ts` + `FactionClassIcon`); Cogitator-Loader auf 45%-Void-Tint; `/login` mit neuem Artwork (Philipps eigenes → Credit „piwireddit") + generalisiertem `ArtCreditTag`/`art-credits.ts`-Slot (Timeline-Credits migriert aufs geteilte Markup, Daten-Maps bleiben). „Open Full Page"-Reiter aus dem Buch-Popup vorgezogen (Paket-2-Item; Fullpages bleiben kanonisch). **Über Scope hinaus (Eyeballing-Runden 6–8, Philipp-direkt):** `/map`-Chrome in die Gold-Sprache gezogen (Ornamente/Borders/Glows raus, Popups redesignt, Gelb-Washes raus, Solar klickbar, Backdrop 0.18, Necron-Rückbau) — Zwischenstand, kohärenter Map-Design-Pass als Kandidat 121-P15.

## What's open

Strang-Arbeit trackt in den Boards (Status-Spalten = Wahrheit, erweitert 2026-06-12 um den Backlog-Sort): **121** offen P7(teilw. via 147)/P8/P9 + **P11** Admin-Seite+Rückbau (nach 149; inkl. Gate-Ausnahmen, CSP, `/buecher`-Redirect, FilterRail-Löschung — „Open Full Page" bereits via 150 raus) / **P12** URL-Migration EN + `/buch`-SSG / **P13** Mobile-Sweep / **P14** Map ⏸ extern / **P15** Map-Chrome-Kohärenz-Pass (Kandidat aus 150). **122** offen B2 (Brief 149 liegt)/B5(⏸ Hand)/B6 (geprüft 2026-06-12: **nicht** gelaufen, V1/V2-Code liegt komplett)/B7/B8/B9 + **B11** Großer Buch-Reviewer (nach 149) / **B12** Ask-Logik-Tuning (nach B11). Erledigt: P1–P6, **P10 (Brief 150, impl 2026-06-13)**, B1, B3 (Full 981/981), B4, B10. Queue: [`open-questions.md`](./open-questions.md) (nur noch 16 Timeline-Folgen; 17 am 2026-06-12 entschieden → P11/P12).

Kleinkram außerhalb Boards/OQs:

- **Frontend lief maintainer-direkt statt als Brief** (Philipp, 2026-06-12): Rogue-Session 143 (+ 145/146) deckt den in 146 angekündigten Frontend-Brief ab. Rest-Substanz: Boards P7–P13 + Farbsprachen-Konsolidierung aus Review 141, falls Philipp sie noch will.
- **Batches-Tail:** Resolver-Welle `ssot-w40k-058..060` + extended Restbatches (custom Config nötig — Auto-Detection-Blind-Spot, Session 136); Lorehammer-Twin-Filter für Cold-Reingest; Podcast-Alias-Backlog (~63 Luetin- + ~212 Lorehammer-Surface-Forms); S4 YouTube-Episode-Matching (abgegrenzt, Session 128); `book-seen.json` entsteht beim ersten `refresh:mark-reviewed -- --books` (bewusst nicht initial committed, Session 148).
- **Tote Konstante:** `scripts/run-ssot-loop.sh` Z. 51 `BRIEF_PATH` zeigt auf den jetzt archivierten Brief 061 (ungenutzt; Einzeiler im nächsten Batches-Code-PR mitnehmen).
- **Maintainer-Hebel:** `REVALIDATE_TOKEN` in Vercel setzen (sonst `/api/revalidate` 503); Primarchen-Kuration (122-B9) schaltet die Compendium-Primarchen-Kategorie frei; Repo-Setting „Allow Actions to create PRs" muss ON bleiben.

## Next likely brief

Backlog-Sort 2026-06-12 (Cowork-Chat); Brief 150 ist seit 2026-06-13 implementiert (P10 erledigt):

1. **Brief [149](../../sessions/2026-06-12-149-arch-curation-foundation.md) (Batches, B2)** — Kurations-Fundament: Hand-Override-Format + Apply-Pfad + Content-Warnings aus den Daten. **Liegt handoff-reif, nächster Handoff.** Entsperrt P11 (Admin-Seite) + B11 (Reviewer).
2. Danach: **P11** Admin+Rückbau → **P12** URL-EN+SSG → **B11** Reviewer → **B12** Ask-Tuning → **P13** Mobile; B6 dazwischen, wann Luft ist; **B5** läuft als Hand-Kuratierung weiter; **P14** Map ⏸ bis Redditor-Daten; **P15** Map-Chrome-Kohärenz-Pass als eigener Kandidat, wenn Philipp den akkumulierten Map-Look kohärent ziehen will.

Session-end-Disziplin: [`workflows/session-end.md`](./workflows/session-end.md); Rollup-Files ändern sich ausschließlich über den Koordinations-Pass (Brief 095).
