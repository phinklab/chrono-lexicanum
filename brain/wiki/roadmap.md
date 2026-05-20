---
title: Roadmap
type: overview
created: 2026-05-09
updated: 2026-05-20
sources:
  - ../raw/historical/2026-05-08-pre-reset/ROADMAP.md
  - ../../sessions/README.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./decisions/plan-reshuffle-2026-05-02.md
confidence: high
---

# Roadmap

> A phased plan. Each phase ends in something demoable. We do not start the next phase until the previous one is shippable.
>
> **Plan-Reshuffle 2026-05-02** ([decision page](./decisions/plan-reshuffle-2026-05-02.md)) reordered Phases 3 ↔ 4 (data ingestion forward; discovery layer follows once data exists), folded EntryRail into Phase-5 Ask-the-Archive, and moved Cartographer + Ask the Archive out of Phase 2 into Phase 5.

## Status snapshot (2026-05-09)

| Phase | Status | Notes |
|---|---|---|
| 1 — Foundation | ✅ shipped 2026-04-28 | Next.js + TS + Tailwind + Drizzle + Supabase, Vercel-deployed, schema seeded |
| 1.1 — Stack bumps | ✅ shipped 2026-04-28 | Next major + Tailwind v4, CSS-first via `@theme` |
| 1.5 — Build/deploy hygiene | ✅ shipped 2026-05-01 | CI lint+typecheck, Drizzle migrate on Vercel build, `/healthz` |
| 2 — Chronicle (Timeline) | ✅ shipped 2026-05-02 | DB-driven; DetailPanel + deep-link; Minimal-FilterRail |
| 3 — Bulk-Backfill-Pipeline | 🔄 in flight (dry-run) | 3a + 3b + 3c shipped; 3.5 dashboard live; 3d/3e/3f open |
| 3.5 — Ingestion-Dashboard | ✅ shipped 2026-05-04 | `/ingest` read-only diff inspector |
| 4 — Discovery-Layer | ⏳ queued | Timeline-Reshape + DB-Suche + Detail-Seiten + persönliche Bibliothek |
| 5 — Cartographer + Ask the Archive | ⏳ queued | The other two tools |
| 6 — Community contributions | ⏳ queued | Public submissions + admin review |
| 7 — Polish & launch | ⏳ queued | Custom domain, performance pass, Reddit launch |

## Phase 3 — Bulk-Backfill-Pipeline (current focus)

**Strategy** (post-Plan-Reshuffle and post-Bulk-Backfill-decision): all ~600–900 W40k novels with multi-source data + LLM-paraphrased synopses. Wikipedia for discovery; Lexicanum (MediaWiki API via curl-shell-out, Cloudflare-blocked on Node-native) for lore; Open Library for bibliography (ISBN, cover, pub year); Hardcover for ratings/tags; Anthropic Haiku 4.5 + Web-Search for synopsis paraphrase + soft-facets + plausibility cross-check + reader-rating capture. **Goodreads is out** — see [`./decisions/no-goodreads.md`](./decisions/no-goodreads.md).

> **Update 2026-05-20.** This paragraph describes the *original* Phase-3 strategy; several pieces are now superseded — the LLM-enrichment stage by CC-direct curation ([`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md)), the discovery-crawl by the maintainer-curated Excel-SSOT ([`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md)), and the rating axis pivoted from Hardcover to Goodreads ([`./decisions/hardcover-to-goodreads-pivot.md`](./decisions/hardcover-to-goodreads-pivot.md)). The live pipeline today is: Excel-SSOT roster → `claude -p` standing loop (Brief 061) → `apply-override.ts` → DB.

**Multi-Source-Merge** is field-by-field priority: title from Wikipedia, in-universe years from Lexicanum, cover from Open Library, rating from Hardcover. Deterministic, debuggable. See [`./decisions/why-multi-source-merge.md`](./decisions/why-multi-source-merge.md).

### Sub-Phasen

- ✅ **3 (Brainstorm + Recherche)** — sessions 031/032 + Cowork-Chat 2026-05-02
- ✅ **3a (Bulk-Backfill-Skeleton)** — sessions 034/035: Wikipedia-Discovery + Lexicanum-Crawler + Multi-Source-Engine + Field-Priority + Manual-Protection + Resumable-State + `--limit N` CLI
- ✅ **3b (Open Library + Hardcover + Schema-Erweiterung)** — sessions 036/037: Migration 0005 (`format` + `availability` enums + `isbn10` + `pageCount`); Wikipedia-Discovery erweitert auf 4 Pages (701 unique)
- ✅ **3c (LLM-Anreicherungs-Schicht)** — sessions 038/039 + Brief 040: Migration 0006 (rating fields). Test-Gate 2026-05-04 → **Haiku 4.5** locked in (3.2× günstiger als Sonnet).
- ✅ **3.5 (Ingestion-Dashboard)** — Brief 041, sessions 041/043: read-only `/ingest` route reading committed diff JSON.
- ⏳ **3d (Apply-Step)** — Diff-File → DB-Writes mit `ON CONFLICT … WHERE source_kind != 'manual'`. UNIQUE INDEX `external_links`, `junctionsLocked`-Flag, FK-Resolution für Junctions, ALTER TYPE `source_kind` (Migration 0007 wartet darauf).
- ⏳ **3e (Batched Backfill ~800 Bücher)** — 8–16 Sessions à 50–100 Bücher (Strategie-Anpassung 2026-05-04). Batch 1 (Bücher 41–90) ✅ in 044.
- ⏳ **3f (Maintenance-Crawler)** — GH-Action monthly, Wikipedia-Diff für Neureleases.

**Pipeline-Härtung 2026-05-08 (Brief 047)** zog 5 Hebel A–E vor 3d-Apply (`source_kind`-Enum + primarySource-Logik, Lore-Coverage via URL-Patterns + LLM-Junctions, Format/Availability-Validation, OL-Edition-Filter, Hardcover-Author-Hint). Acceptance-Diff `backfill-20260508-2101.diff.json` (9 Bücher) zeigt Junction-Coverage 0/50→6/6 (100%), 0 Field-Conflicts, 0 invalide Format/Availability, $0.114/Buch. Detail in [`./pipeline-state.md`](./pipeline-state.md).

### UI-Implikation für Phase 4

Phase-4-UI setzt den Default-Filter auf `availability ∈ {in_print, oop_recent}` (zeigt nur lesbare Bücher per Default), mit Toggle "auch out of print zeigen" für Sammler/Hardcore. `format` ist orthogonal — UI-Filter, der z.B. nur `novel`+`novella` zeigt und Audio-Dramas/Anthologien ausblendet wenn der User textuelle Lese-Empfehlungen will.

## Phase 4 — Discovery-Layer

> Beginnt sobald Ingestion in Phase 3 genug Daten geliefert hat, dass der Reshape-Bedarf konkret wird.

Vier Bausteine:

- **4a — Timeline-Reshape (cineastisch).** Weg vom singulären Zeitstrahl-Ribbon (zerfällt bei Hunderten Büchern pro Ära). Brainstorm-Brief am Phasen-Anfang. Mögliche Richtungen: Era-as-Diorama, zoombare Mehr-Ebenen-Timeline, Cinematic-Card-Stack, Era-Galleries.
- **4b — Pure DB-/Sortier-Seite.** Filterbare/sortierbare Tabelle aller Bücher (Era, Fraktion, Autor, Year, Length, Tone, Series), Volltextsuche, URL-shareable.
- **4c — Detail-Seiten.** `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`. Open Graph images per book. Sitemap + robots.txt.
- **4d — Persönliche Bibliothek.** Read / heard / want. Auth-Gating + Storage-Modell sind eigener Architektur-Brief.

## Phase 5 — Cartographer + Ask the Archive

Aus alter Phase 2 hierher verschoben (Plan-Reshuffle).

- **5a — Cartographer.** Galaxy-Map mit Time-Slider (filter book-pins by in-universe year). Click location → highlight all books there.
- **5b — Ask the Archive.** Empfehlungs-Trichter, scoring weights als typed `recommend(answers)` in `src/lib/recommend.ts`. URL-state für Reddit-shareability.

## Phase 6 — Community contributions

Public `/contribute` form (book / chapter / location / correction). Anonymous OK, optional email. Submissions land in `submissions` table with `status='pending'`. Maintainer dashboard at `/admin/submissions` (Supabase auth-gated). Approve → merge into canonical; Reject → store reason. Public credits page (opt-in).

## Phase 7 — Polish and launch

Custom domain. Performance pass (Lighthouse > 95). Real Open Graph images. Reddit launch post.

## Ideas Backlog (not committed)

- **Per-Buch „Rating aktualisieren"-Button** auf `/buch/[slug]` — on-demand-Refresh des Goodreads-Ratings für ein einzelnes Buch. Dieselbe Page-Read-Mechanik wie die Pipeline-Disziplin aus Brief 087: Websuche zum Auffinden der Goodreads-Buchseite, Rating + Count **von der Seite** gelesen (nie aus dem Snippet — 086-Phase-4-Verdikt). Nutzen: zu jung geseedete Bücher (noch keine aggregierte Wertung) später nachziehen, veraltete Ratings auffrischen. Validiert durch Brief 086 Phase 4 (96.3 % auf dem härtesten Residual). Eigener Brief — pro CLAUDE.md-Regel erst hier im Backlog, dann Brief; berührt UI (`/buch/[slug]`), Server-Action o. Ä., und überlappt mit der „noch keine Wertung"-Markierung aus Brief 087.
- **Book-Cover-Ständer** für Audio-Hörer — physisch oder digital, Erinnerungs-Display für gehörte Bücher. IP-sensitiv (Warhammer-Cover sind GW). Lösungspfade: eigene Cover-Render im Lexicanum-Stil, "Reading-Trophy"-Mockups, oder Lizenz-Klärung mit Black Library. Phase-7+-Bonus.
- Reading-Order-Presets ("HH chronological," "HH publication," "newcomer-friendly," "audiobook-only")
- Cross-references: "books featuring Cadia" computed live from `work_locations`
- Audiobook-Narrator-Directory
- "What's new in M42?" living timeline für aktuelle GW-Releases
- Vergleich mit den offiziellen Black Library Reading-Order-PDFs

## Plan-Reshuffle history

The current Phase-3 = Ingestion / Phase-4 = Discovery / Phase-5 = other-two-tools assignment is the result of a 2026-05-02 reshuffle ([decision page](./decisions/plan-reshuffle-2026-05-02.md)). Pre-reshuffle: Phase 3 was Detail-Seiten, Phase 4 was Ingestion. Reasons documented in the decision page. EntryRail (vormals 2a.1) was struck — function fully covered by Phase-5 Ask-the-Archive.
