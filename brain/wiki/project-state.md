---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-06-26
sources:
  - ../../sessions/README.md
  - ../../sessions/archive/2026-06/2026-06-17-154-impl-book-reviewer.md
  - ../../sessions/archive/2026-06/2026-06-18-155-impl-book-review-web-pass.md
  - ../../sessions/archive/2026-06/2026-06-18-158-impl-gate-fl-materialize.md
  - ../../sessions/archive/2026-06/2026-06-18-159-impl-universal-search-aliases.md
  - ../../sessions/archive/2026-06/2026-06-18-160-impl-bg-scroll-polish.md
  - ../../sessions/archive/2026-06/2026-06-19-161-impl-perceived-latency-feedback.md
  - ../../sessions/archive/2026-06/2026-06-19-162-impl-entity-isr-hot-subset.md
  - ../../sessions/2026-06-20-163-impl-timed-preview-access.md
  - ../../sessions/archive/2026-06/2026-06-18-157-impl-incremental-apply-default.md
related:
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Project state — 2026-06-26 (Pre-Launch: Discovery-Layer + Buch-Reviewer shipped, Ask-Overhaul (164) live, Site hinter Preview-Gate, Invite-Links live)

> The "where are we now" anchor. **Nur aktueller Stand. Historie → [`log.md`](./log.md) + git.**

## Phase

**Phase 3 (Pipeline) ist im Wartungsmodus, Phase 4/5 (Discovery + Tools) sind substanziell shipped, der Fokus liegt auf Pre-Launch-Härtung + Frontend-Polish.** Der Buchkorpus läuft additions-only über den **Weekly-Content-Refresh** (Brief 133: Cron → Detection → Rolling-PR → bestehende Apply-Pfade). Die Site trägt seit Juni das volle öffentliche Gerüst — Home (3 Bänder), `/archive`, `/compendium`, `/timeline` (Cinematic), `/ask`, `/podcasts`-in-`/archive` — und steht **hinter einem Preview-Login-Gate** (Session 145; Kill-Switch `PREVIEW_GATE=off` für den Launch). Drei Deep-Reviews (140 Backend / 141 Frontend / 144 Technical, zusammen ~290 verifizierte Findings) plus Umsetzungs-PR (147, sieben Wellen) haben Caching, Security, Resilienz und A11y auf Launch-Niveau gezogen. Phasenplan: [`roadmap.md`](./roadmap.md) (Status-Snapshot 2026-06-12).

**Arbeitsmodus:** zwei stehende Strang-Boards ([121 Product](../../sessions/2026-06-03-121-arch-product-board.md), [122 Batches](../../sessions/2026-06-03-122-arch-batches-board.md)) statt Einzel-Briefs; Briefing pro Task über Chat, kleine CC-Handoff-Docs, Cowork reviewt + archiviert. Daneben Maintainer-direkte Zwischensessions (143/145/146) für Polish.

## Branch & Worktrees

**PR-Policy (Brief 165, ab 2026-06-25):** **jede** Änderung — Code wie Docs — erreicht `main` nur über einen **CC-authored Task-Branch + PR**; **kein direct-to-`main` mehr** (löst die 2026-05-25-„doc-only→`main`"-Regel ab). **Cowork fasst nie `git` an und committet nie** — Cowork-Deliverable sind *Dateien im Working-Tree* (Brief + `brain/**` + `sessions/README.md`), die uncommitted liegen, bis ein CC-PR sie trägt: der Brief reitet im Strang-Code-PR mit (CC flippt dort `status: open → implemented`), die `brain/**`+`README`-Rollups committet CC aus dem Koordinations-Worktree (Brief-095-Single-Writer). Drei Worktrees (Coordination/Product/Batches); Rollup-Ownership Brief 095 unverändert (nur Coordination schreibt `brain/**` + `sessions/README.md`). git läuft Windows-nativ über Philipp/CC, in PowerShell 5 **zeilenweise** (kein `&&`). `ci.yml` läuft auf PRs **und** als Safety-Net auf `push: main`; lokales `brain:lint -- --no-write` vor jedem `brain/**`-Branch bleibt Pflicht. Vercel-Build migriert **nicht** automatisch — Migrationen via `npm run db:migrate` lokal oder `.github/workflows/migrate.yml` (workflow_dispatch, Pooler-URL).

## Latest state (2026-06-12)

**Korpus: 889 Bücher** = 859 Excel-SSOT (frozen) + 30 Weekly-Refresh-Promotions via `book-roster.extension.json` (Session 136; Override-Batches `ssot-w40k-058..060` + extended `057`/`hh-030`, alle 30 kuratiert + in der DB). Migrationen durch `0014` applied (0014 = `preview_invite_activations`, Brief 163).

**Buch-Reviewer (122-B11) voll gelaufen + appliziert.** Pilot + Voll-Lauf über alle 889 Bücher (Brief 154, PR #180): 639 roh → 608 bestätigt → 31 widerlegt (~4,9 %); **96 hand-promoviert** (`reviewQueue` → `curation-overlay.final`) + **Drukhari-Split** in die Referenz-Daten. **Stage 3 (Brief 155)** reicherte die 166 strukturellen Sentinels per Web-Enrichment an (Opus + Web, read-only `new-entity-proposals.json`, kein Apply-Pfad): Factions 100 %, Locations 99 %; **0 echte Koordinaten** (Lexicanum/Fandom geben für tiefe Roman-Welten keine her — der „nie raten"-Guard hielt), aber **53 Welten sektor-zugeordnet** = die Map-Kurations-Worklist. **Gate F/L (Brief 158)** materialisierte **+20 Factions + 142 Locations** + Aliases in die Seed-Kataloge; **alle Korrekturen (96-Promotions, Drukhari, Gate F/L) sind via `db:sync` in der Prod-DB** (Maintainer-bestätigt 2026-06-24). Character-Long-Tail (315 Sentinels) bleibt geparkt.

**Podcasts/YouTube: 4 Shows, ~1094 `podcast_episode`-Works.** The 40k Lorecast (149 Ep.), Adeptus Ridiculous (363), Lorehammer (391, „(Video)"-Twins dedupliziert), Luetin09 (YouTube-Adapter Brief 130; 191 Lore-Episoden aus 1854 Uploads, `source_kind=youtube`). Show-/Episode-Links autoritativ in `external_links` (Provenance `sourceKind`+`confidence`, Migration 0011); Tagging über `resolveSurfaceForm`; **CC-Direct-Tagging** (`--tagging=cc-direct`, Brief 131/132: `claude -p`-Subsessions auf der Max-Allowance, byte-identisch zum API-Pfad) ist der bewährte Null-Kosten-Pfad.

**Timeline-Daten (Brief 137 + Rebuild-Tail 152):** 8 kuratierte Eras, 144 Events, 223 `event_works`-Hooks (95 Buch / 125 Episode / 3 Serie), 97 datierte Werke (53 event-anchored). Migration 0012; `apply:timeline` idempotent und seit Brief 152 mit read-only `--verify` (exakte Set-/Wert-Gleichheit via purem `diffTimelineState`, DB-frei getestet). Der Timeline-Restore ist ein Tail-Schritt der Apply-Kette (`apply:timeline` + `--verify`), bewusst **nach** Podcast und **vor** Curation, damit Hand-Kuration bei `primary_era_id` zuletzt gewinnt; die Kette lebt seit Brief 157 in `db:sync` (siehe DB-Apply-Modell unten). OQ 16(a) ist geschlossen; echter DB-Verify gegen Prod bleibt Post-Freeze.

**Entity-Blurbs (Board 122-B3): Full-Coverage 981/981** (202 Factions / 490 Characters / 289 Worlds) als seed-data-JSON mit per-Row-Provenance — Subset + Machinery via Handoff (2026-06-09), Full-Sweep maintainer-direkt nachgezogen. Live im `/compendium`; Factions ohne Werke werden nicht mehr gelistet.

**Ask-Modell (122-B4 + 121-P3):** flacher 5-Fragen-Contract, server-only `recommend()` mit Curation-Overlay (`ask-curation.json`) und Hard Boundaries (Faction-Gate, Single-Book-Format-Gate); alle 1080 Kombinationen liefern ≥1 Empfehlung (Audit `npm run audit:ask-combinations`).

## What's running

- **App auf Vercel** — <https://chrono-lexicanum.vercel.app/>, **anonyme Besucher sehen nur `/login`**. Zwei Zugangswege seit Brief 163: Passwort (Soft-Lock, Default-Creds committed) **und per-Person signierte Invite-Links** (`PREVIEW_INVITE_SECRET` gesetzt → Gate verifiziert HMAC-Token pro Request; Secret rotieren = alle Links+Sessions sofort tot). `PREVIEW_GATE=off` zum Launch. Routen: Home (3-Bänder-IA, Brief 120/129), `/archive` + `/archive/podcasts` (ex `/werke`+`/podcasts`, 308-Redirects, `?focus=`-Opener), `/compendium` (5 Kategorien; Primarchen-Seam wartet auf 122-B9-Kuration) + `/person/[slug]`, `/timeline` (Cinematic+Index, DB-fed, 19 WebP-Era/Event-Artworks mit Artist-Credits, Brief 138/140 + Polish 145/146), `/ask` (Funnel), `/buch/[slug]`, `/map`, Entity-Hubs. Globales Chrome: Burger-`SiteMenu` (TopNav gelöscht, Session 139/140).
- **Caching/Hardening (147):** `READ_CACHE_TTL` 3600 s, `/api/revalidate` (Bearer `REVALIDATE_TOKEN`), Teaser-Synopsis senkt `/archive`-Payload 16,45→2,21 MB, `loading.tsx` auf 7 Routen, Security-Header, `/audit`+`/ingest` admin-ge-gatet, timing-safe Auth-Vergleiche, Next-CVE-Bump.
- **CI:** `lint-and-typecheck` + `brain:lint --no-write` auf PRs **und** `push: main`; `migrate.yml` (workflow_dispatch) für DB-Migrationen; `weekly-refresh.yml` Cron Mo 06:00 UTC → Rolling-PR `automation/weekly-refresh` (detection-only, keine DB-Secrets), mit PR-Review-Prompt, degraded≠noop-Guard, gebootstrapptem `curation-state.json`/`book-seen.json` und lokalem read-only `refresh:audit-artifacts` aus Brief 151.
- **DB auf Supabase** — Pooler 6543, prod; Pool `max:5` ist bewusst und bleibt (Review-144-Schiedsspruch: Hebel ist Caching, nicht Pool-Size).
- **DB-Apply-Modell (Brief 157, ab 2026-06-18):** der dokumentierte Default für „Änderung in die DB bringen" ist `npm run db:sync` — ein **nicht-destruktiver, idempotenter** Voll-Roster-Re-Apply (= der alte `db:rebuild`-Chain **minus Truncate**, plus Podcast-Step; Scope auto-abgeleitet aus dem committeten Roster mit Preflight-Guard, der bei Lücke/Stray laut anhält). Mentales Modell für jede Änderung: *Datei ändern → PR/Merge → `db:sync`*. `db:rebuild` ist auf **Disaster-Recovery** degradiert (= `db:sync` + vorangestelltes confirm-gegatetes Truncate) — im Normalbetrieb nie nötig. `npm run db:drift` ist ein read-only Health-Check (Tail-`--verify`s + Counts + Batch-Contiguity + Podcast-Artifact-Drift; schreibt nie), der sagt, *ob* ein Rebuild überhaupt gerechtfertigt ist. Die hand-gepinnte `db-rebuild.config.json` (die `to:57`-Fehlerquelle aus dem 96+Drukhari-Vorfall) ist gelöscht.
- **Standing tools (dormant):** SSOT-Loop + Resolver-Loop (Ad-hoc-Roster-Erweiterungen), Konsolidierungs-Pass, Atlas-Regen, Brain-Lint.
- **`/lab/design`** — Styleguide-Deliverable aus Review 141 (Palette, Typoskala, Kern-Bausteine, Do/Don'ts); Grundlage für den angekündigten Frontend-Brief.
- **Product-Wave 159–163 (alle gemergt, #186–#191):** **159** Universal Search — Factions/Characters/Worlds als First-Class-Suggestions aus den Compendium-Loadern, Alias-Surfaces (`Crimson Sabres → Crimson Slaughter`) routen auf Canonical, Worlds-Threshold 2; Home-/Archive-Copy-Politur. **160** neuer geteilter Hintergrund (`main-bg.webp`, Credit `phil kuenzler`/`phinklabs`), Full-Viewport-Masthead + `NEXT`-Scroll-Cue auf Archive/Compendium/Ask. **161** Perceived-Latency — jede server-/DB-gebundene Navigation signalisiert sofort (geteilter `useTransition` → globaler Gold-Beam + wiederverwendete `loading.tsx`-Boundaries, anti-flash-gated). **162** Entity-ISR — die vier Entity-Routen prerendern nur noch eine kuratierte **96-ID-Hot-Subset** (war ~1300), Rest on-demand via ISR (24 h-Backstop) + `revalidatePath` in `/api/revalidate`; **Build-Egress-Problem (Supabase-5-GB-Free-Limit) entschärft** (Build-Zeit-Tail bleibt die `max:5`-Pool-Contention aus Review 144, separates Thema). **163** Timed-Preview-Invite-Links (siehe App-Bullet; Custom-HMAC-SHA256, kein neuer Dependency, Migration 0014, lokale secret-freie HTML-Konsole mintet Links + zeigt Activation-Status).
- **Polish-Sweep shipped (Brief 150, impl 2026-06-13):** Content-Warnings an einer zentralen Stelle (`facet-visibility.ts`) aus jeder Besucher-Oberfläche gefiltert (Admin-Spiegel `/atlas`+`/buch/[slug]/audit` filtern bewusst nicht); Fraktions-Sigils statt Punkt (Imperium/Space-Marines/Xenos/Chaos, `faction-icon.ts` + `FactionClassIcon`); Cogitator-Loader auf 45%-Void-Tint; `/login` mit neuem Artwork (Philipps eigenes → Credit „piwireddit") + generalisiertem `ArtCreditTag`/`art-credits.ts`-Slot (Timeline-Credits migriert aufs geteilte Markup, Daten-Maps bleiben). „Open Full Page"-Reiter aus dem Buch-Popup vorgezogen (Paket-2-Item; Fullpages bleiben kanonisch). **Über Scope hinaus (Eyeballing-Runden 6–8, Philipp-direkt):** `/map`-Chrome in die Gold-Sprache gezogen (Ornamente/Borders/Glows raus, Popups redesignt, Gelb-Washes raus, Solar klickbar, Backdrop 0.18, Necron-Rückbau) — Zwischenstand, kohärenter Map-Design-Pass als Kandidat 121-P15.

## What's open

Strang-Arbeit trackt in den Boards (Status-Spalten = Wahrheit): **121** offen P7(teilw. via 147)/P8/P9 (Themen/Galerie, warten auf 122-B8/B9) / **P12** URL-Migration EN + `/buch`-SSG / **P13** Mobile-Sweep / **P14** Map ⏸ — jetzt mit Inhalt: **53 sektor-zugeordnete Welten aus Stage 3** sind die Platzierungs-Worklist, und der **Redditor liefert eine Sternenkarte-Koordinaten-Excel** (Stand 2026-06-24: angekündigt, Reconciliation auf das interne `gx`/`gy`-0–1000-Raster ist die eigentliche Arbeit) / **P15** Map-Chrome-Kohärenz-Pass (Kandidat aus 150). **122** offen B5(⏸ Hand)/B6 (geprüft: **nicht** gelaufen, V1/V2-Code liegt komplett)/B7/B8/B9 / **B12** Ask-Logik-Tuning — **erledigt via Brief 164** (Ask-Overhaul gemergt + gepullt; Impl-Report war vergessen, im 2026-06-26-Pass nachgetragen). **B14 Local-only Curation Admin Tool am 2026-06-17 verworfen**: Hand-Kuration läuft per Codex-Auftrag an `curation-overlay.json` + Dry-Run/Verify. Erledigt: P1–P6, **P10 (150)**, **P11 (Seiten-Rückbau/Security-Rest, Report 153, gemergt)**, Product-Wave **159/160/161/162/163**, B1, **B2 (149)**, B3 (Full 981/981), B4, B10, **B11 Buch-Reviewer voll gelaufen + appliziert (154 + Stage 3 155 + Gate F/L 158)**, **B13 (151)**, **OQ 16(a) (152)**. Queue: [`open-questions.md`](./open-questions.md) (nur noch 16b/c Timeline-Folgen + 18a/b Apply-Vertiefungen). Character-Sentinels (315) geparkt.

Kleinkram außerhalb Boards/OQs:

- **Frontend lief maintainer-direkt statt als Brief** (Philipp, 2026-06-12): Rogue-Session 143 (+ 145/146) deckt den in 146 angekündigten Frontend-Brief ab. Rest-Substanz: Boards P7–P13 + Farbsprachen-Konsolidierung aus Review 141, falls Philipp sie noch will.
- **Batches-Tail:** Resolver-Welle `ssot-w40k-058..060` + extended Restbatches (custom Config nötig — Auto-Detection-Blind-Spot, Session 136); Lorehammer-Twin-Filter für Cold-Reingest; Podcast-Alias-Backlog (~63 Luetin- + ~212 Lorehammer-Surface-Forms); S4 YouTube-Episode-Matching (abgegrenzt, Session 128). `book-seen.json` + `curation-state.json` sind seit Brief 151 gebootstrappt; vor Vertrauen auf den Wochenlauf einmal `npm run refresh:audit-artifacts` lokal read-only ziehen.
- **Tote Konstante:** `scripts/run-ssot-loop.sh` Z. 51 `BRIEF_PATH` zeigt auf den jetzt archivierten Brief 061 (ungenutzt; Einzeiler im nächsten Batches-Code-PR mitnehmen).
- **Maintainer-Hebel:** `REVALIDATE_TOKEN` + `PREVIEW_INVITE_SECRET` sind in Vercel gesetzt (Maintainer-bestätigt 2026-06-24), Migration 0014 appliziert; Primarchen-Kuration (122-B9) schaltet die Compendium-Primarchen-Kategorie frei; Repo-Setting „Allow Actions to create PRs" muss ON bleiben. Nach Daten-Applies bei Bedarf `POST /api/revalidate` für gecachte Payloads.

## Next likely brief

Aktualisiert 2026-06-26: **Brief 164 (Ask-Overhaul) ist gemergt + gepullt** (Impl-Report war vergessen — im 2026-06-26-Koordinations-Pass nachgetragen); die Wave 154–163 ist gemergt und DB-seitig appliziert. **Neu gebrieft: [166](../../sessions/2026-06-26-166-arch-ask-hub-one-faction-one-book.md)** — `/ask` wird „Find your next book"-Hub mit Fragebogen + neuem Tool „1 Faction, 1 Book" (maintainer-gepflegte Kurations-JSON, Reshuffle) + Diamond-Glyph-Rückbau; Product-Strang, wartet auf CC. Forward-Queue mit Philipp (2026-06-26):

1. **Brief 166 — Ask-Hub + „1 Faction, 1 Book" (gebrieft, wartet auf CC).** Philipp pflegt die Faction→Buch-Liste; CC liefert Schema + Loader + UI + Validierung. Product-Worktree, ein PR.
2. **P14 Map / Sternenkarte (entsperrt).** Der Redditor liefert eine Koordinaten-Excel; Stage 3 hinterlässt **53 sektor-zugeordnete Welten** als Platzierungs-Worklist. Architektonischer Kern eines Briefs: das Koordinatensystem der Excel auf das interne `gx`/`gy`-0–1000-Canvas-Raster mappen (Reconciliation), Roh-Quelle nach `scripts/seed-data/source/` (Präzedenz: `Warhammer_Books_SSOT.xlsx`), Apply read-only-vorschlagend → Hand-Gate. **Voraussetzung: die Excel sichten, bevor der Brief geschnitten wird.**
3. **P12 URL-Migration EN + `/buch`-SSG** — reiner Architektur-Schnitt, keine Daten nötig.
4. **P13 Mobile-Sweep.** Dazwischen wann Luft ist: B6 (Dead-Code), B7 (brain:lint-Guardrail); **B5** läuft als Hand-Kuratierung weiter; **P15** Map-Chrome-Kohärenz als eigener Kandidat. Optional `npm run db:drift` gegen Prod als read-only Bestätigung nach den Applies.

Session-end-Disziplin: [`workflows/session-end.md`](./workflows/session-end.md); Rollup-Files ändern sich ausschließlich über den Koordinations-Pass (Brief 095).
