---
title: Wiki index — master catalog
type: reference
created: 2026-05-09
updated: 2026-05-26
sources: []
related:
  - ../CLAUDE.md
  - ./project-state.md
  - ./log.md
confidence: high
---

# Wiki index

> Master catalog. Every wiki page with one-line description + `updated` date. Cowork and Claude Code read this **third** on session start (after top-level [`/CLAUDE.md`](../../CLAUDE.md) and [`../CLAUDE.md`](../CLAUDE.md)). Use it to pick the 2–4 pages relevant to a query — don't brute-force load the whole tree.

Updated whenever Ingest adds/edits a page; see [`./workflows/session-end.md`](./workflows/session-end.md). Read the [`./log.md`](./log.md) operation log for chronological history.

## Overview pages (start here)

| Page                                             | Description                                                                                                                 | Updated    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [project-state.md](./project-state.md)           | "Where are we now": phase, what's running, next likely brief. Post-Merge-Koordinations-Pass post-101 + Pass 10 (2026-05-26): PR #106 (Brief 101 Guard-Reason-Split) + PR #105 (Resolver-Pass 10 HH-Bootstrap-Apply) gemergt — **DB 565 → 585** (+20 HH-Bücher), Cross-Era-ADR operativ validiert (15/20 drift_works = Aliases resolven), 20 out-of-range Constituent-Edges deferred auf Folge-Wellen. Nächster Schritt: ~5 weitere HH-Resolver-Wellen via `run-resolver-loop.sh` (operativ, kein Brief). | 2026-05-26 |
| [open-questions.md](./open-questions.md)         | Items the next architect brief must address. Post-Merge-Koordinations-Pass post-101 + Pass 10 (2026-05-26): Brief 101 + Pass 10 gemergt, keine OQ-Schließung / keine neue numerierte OQ; 2 gap_works aus Phase 4b als Watch-Item in `project-state.md` (Data-Findings, nicht numerierte OQ). Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung. | 2026-05-26 |
| [deferred-questions.md](./deferred-questions.md) | Dormant / distant questions that aren't queue-relevant. Promoted back to `open-questions.md` when their trigger fires. Post-074: enthält `chaos`-pov_side-Promote-Pass mit Promote-Trigger. | 2026-05-15 |
| [architecture.md](./architecture.md)             | High-level system shape, schema overview, module map, key types/enums, conventions inherited from top-level CLAUDE.md.      | 2026-05-09 |
| [roadmap.md](./roadmap.md)                       | Phased plan (1–7) with status per phase + sub-phase breakdown for Phase 3 + Ideas Backlog. Post-086: Phase-3-Strategie-Absatz mit Supersede-Notiz (LLM-Stage / Discovery-Crawl / Hardcover→Goodreads), Refresh-Button im Ideas Backlog. | 2026-05-20 |
| [onboarding.md](./onboarding.md)                 | First-time setup (local install + GitHub + Supabase + Vercel + optional Obsidian for Atlas).                                | 2026-05-09 |
| [pipeline-state.md](./pipeline-state.md)         | Phase-3 pipeline detail: V1 legacy + V2 SSOT authority path + resolver layer. Post-101 / Pass 10 (2026-05-26): HH-Bootstrap-Welle (`ssot-hh-001..002`) appliziert — **DB 565 → 585**, Brief 101 Guard-Reason-Split (`out-of-range` informativ / `unknown-work` scharf); 274 weitere HH-Bücher als Folge-Wellen operativ. | 2026-05-26 |
| [book-data-overview.md](./book-data-overview.md) | High-level book-data numbers (26 manuals heute, 859 SSOT-Roster ab 058, ~$0.114/book V1 / $0.0199/Buch V2 fresh-Smoke). NOT atlas — pointer to atlas for per-book detail. | 2026-05-09 |

## Decision pages (ADRs with revisit-triggers)

| Page | Decision | Decided | Updated |
|---|---|---|---|
| [decisions/cross-era-identities.md](./decisions/cross-era-identities.md) | Cross-Era-Identitäten (Luna Wolves ↔ Sons of Horus, Kharn ↔ Kharn the Betrayer, Magnus ↔ Magnus the Red, …) werden als **eine Canonical-Row pro Identität** modelliert, Era-spezifische Bezeichnungen wandern in `*-aliases.json`. Faction-Rename + Character-Honor-Title-Split + Primarchen-Pattern; Ausnahme echte Identitäts-Disambig → `## Needs decision`-Stop. Operative Spec im `resolver-pass-runbook.md` §4. Brief 100 (HH-Resolver-Domain-Öffnung). **Post-Pass-10:** erste HH-Welle hat die Disziplin operativ validiert (15/20 drift_works = Aliases resolven). | 2026-05-26 | 2026-05-26 |
| [decisions/why-cc-direct-curation.md](./decisions/why-cc-direct-curation.md) | V2-LLM-Stage de-facto ausgemustert; `claude -p`-Subsession produziert die Override-Datei direkt. Maintainer-Kontrolle + Modell-Qualität + Latenz vs. Reproduzierbarkeit + Field-Provenance. Effektiv entschieden seit Brief 061 (2026-05-11), formal-ADR 2026-05-15. | 2026-05-11 | 2026-05-15 |
| [decisions/faction-policy.md](./decisions/faction-policy.md) | Browse-Root vs. Tree-Root getrennt: Policy lebt in `scripts/seed-data/faction-policy.json` (19 Browse-Roots, `imperium` als Grand-Alignment-Exception), `factions.parent_id` weiter Single-Parent. `factions.json` audit-patched (Chaos-Rename + 14 Reparents), `brain:lint` neue Kategorie. **2026-05-16 (Brief 077, implemented):** Grand-Alignment-Junction-Skip — `imperium`/`chaos` werden in `work_factions` übersprungen, wenn alignment-gleiche Sub-Faction im selben Override-Block resolved ist; `redundantWhenSubPresent` in der Policy-JSON, Skip-Helper `scripts/apply-override-skip.ts` mit DI-Signatur, shared `src/lib/seed/alignment.ts`-Util, Audit-Bucket `factionsSkippedRedundant` in `book_details.notes`-`---surfaceForms---`-Block, Re-Apply 001..020 hat 165 redundante Junctions weggeputzt (`imperium 81 → 6`, `chaos 133 → 43`); Revisit-Trigger für Aeldari-Sub-Splits (Alignment-Equality → Parent-Chain) dokumentiert. | 2026-05-13 | 2026-05-16 |
| [decisions/location-policy.md](./decisions/location-policy.md) | Locations-Policy + Umbrella-Surface-Form-Skip (Brief 084, implemented 2026-05-19): Sister-Pass zu `faction-policy.md` § Grand-Alignment-Junction-Skip auf der Locations-Achse. Allowlist-basierter Skip in `scripts/seed-data/location-policy.json` → `redundantSurfaceForms` (13 Umbrella-Strings: `Imperium`-Varianten, `Chaos`/`Realm of Chaos`, `the Warp`, `Xenos`/`Aliens`). Skip-Helper `scripts/apply-override-location-skip.ts` als pure DI-Funktion, surface-form-zentriert (nicht ID-zentriert, weil Umbrellas zu `null` resolven). Notes-Bucket-Umsortierungs-Pass: `Imperium`-Surface-Forms wandern von `locationsUnresolved` nach `locationsSkippedRedundant` (Audit-Bucket), `work_locations` bleibt invariant. Erhaltungs-Pfad (Buch trägt nur Umbrella, keine andere Location resolved). Revisit-Trigger: HH-Domain-Forward-Behavior, Audit-Bucket-False-Positives ≥ 5, UI-Map-Filter-Phase. | 2026-05-19 | 2026-05-19 |
| [decisions/why-sonnet-not-haiku.md](./decisions/why-sonnet-not-haiku.md) | Supersedes Haiku-Default: Pipeline-Enrichment soll mit Sonnet (current major) laufen, weil Cockpit-Audit Datenqualitaets-Pathologien sichtbar macht und der Cost-Aufschlag im Hobby-Rahmen tragbar bleibt. **Post-2026-05-15 historisches Artefakt + Reaktivierungs-Sicherung** — die V2-LLM-Stage läuft nicht mehr (siehe `why-cc-direct-curation.md`). | 2026-05-13 | 2026-05-15 |
| [decisions/why-excel-ssot-not-crawl.md](./decisions/why-excel-ssot-not-crawl.md) | Discovery-Stage durch Maintainer-kuratierte Excel-SSOT ersetzt (859 Bücher + 191 Collections, deterministischer Loader → `book-roster.json`). Crawler bleiben im Code, ab Brief 058 nicht mehr Default-Eingang | 2026-05-10 | 2026-05-10 |
| [decisions/karpathy-reset-2026-05-08.md](./decisions/karpathy-reset-2026-05-08.md) | Brain (`brain/` in repo) + Atlas (external Obsidian vault, `~/chrono-atlas/`) — Karpathy LLM Wiki pattern, domain-split | 2026-05-08 | 2026-05-09 |
| [decisions/why-drizzle-supabase.md](./decisions/why-drizzle-supabase.md) | Next.js + TS + Tailwind + Drizzle + Supabase + Vercel + custom M-scale + string IDs / UUIDs split | 2026-04-28 | 2026-05-09 |
| [decisions/hardcover-to-goodreads-pivot.md](./decisions/hardcover-to-goodreads-pivot.md) | Rating-Quelle pivotiert von Hardcover auf Goodreads (Brief 086): Hardcover-Hit-Rate stagnierte bei 58 % wegen struktureller Katalog-Lücke; Goodreads-Einzel-Websuche (Page-Read, nicht Snippet) erreichte 197/200. Amendet `no-goodreads.md` fürs Rating-Feld; OL-Fallback + Slug/ID-Stage-6 gestrichen. | 2026-05-20 | 2026-05-20 |
| [decisions/no-goodreads.md](./decisions/no-goodreads.md) | Drop Goodreads (API discontinued 2020); use Open Library + Hardcover.app instead. **Amended 2026-05-20** fürs Rating-Feld → `hardcover-to-goodreads-pivot.md`. | 2026-05-02 | 2026-05-20 |
| [decisions/why-bulk-backfill.md](./decisions/why-bulk-backfill.md) | Bulk-backfill (lokal über Nacht, resumable, batched) + monthly maintenance, NOT daily-drift | 2026-05-02 | 2026-05-09 |
| [decisions/why-multi-source-merge.md](./decisions/why-multi-source-merge.md) | Field-by-field source priority (deterministic, debuggable, source-aware), NOT first-source-wins / consensus | 2026-05-02 | 2026-05-09 |
| [decisions/plan-reshuffle-2026-05-02.md](./decisions/plan-reshuffle-2026-05-02.md) | Phase 3 ↔ 4 swap; EntryRail dropped; Cartographer + Ask the Archive moved to Phase 5 | 2026-05-02 | 2026-05-09 |
| [decisions/why-haiku-not-sonnet.md](./decisions/why-haiku-not-sonnet.md) | Superseded by Sonnet-current-major decision; retained as story-continuity stub for the 2026-05-04 Haiku cost/quality trade-off. | 2026-05-04 | 2026-05-13 |

## Workflow pages

| Page | Description | Updated |
|---|---|---|
| [workflows/cowork-session.md](./workflows/cowork-session.md) | What Cowork (architect) does each session; rules, tools, push-back patterns, „Simplest thing first"; post-095 sole writer of `sessions/README.md` + `brain/**`; post-2026-05-25 § „PR policy" — Cowork's doc-only output commits direct to `main` | 2026-05-25 |
| [workflows/cc-session.md](./workflows/cc-session.md) | What Claude Code (implementer) does each session; version-research workflow, report tone; post-095 worktree-self-check + strand worktrees never write `brain/**`; post-2026-05-25 § „PR policy" — code gets a PR, docs don't | 2026-05-25 |
| [workflows/sessions-format.md](./workflows/sessions-format.md) | Session log format: naming, frontmatter, status lifecycle, brief/report sections; post-095 strand reports carry the rollup conduit | 2026-05-23 |
| [workflows/session-end.md](./workflows/session-end.md) | Cowork's discipline post-CC-report (replaces pre-049 infrastructure-log discipline) | 2026-05-09 |
| [workflows/ingest.md](./workflows/ingest.md) | Karpathy operation 1/3: how new material flows into wiki synthesis pages | 2026-05-09 |
| [workflows/query.md](./workflows/query.md) | Karpathy operation 2/3: how to answer questions against the wiki | 2026-05-09 |
| [workflows/lint.md](./workflows/lint.md) | Karpathy operation 3/3: drift checks. `npm run brain:lint` (script: `scripts/brain-lint.ts`); CI runs `--no-write`. | 2026-05-09 |
| [workflows/atlas-regen.md](./workflows/atlas-regen.md) | When/how to run `npm run atlas:regen`; vault-path config; discrepancy handling | 2026-05-09 |

## Reference pages

| Page | Description | Updated |
|---|---|---|
| [glossary.md](./glossary.md) | Project-specific terms (M-scale, source_kind, work_facets, primaryEra, llm_flags, junctionsLocked, batched-3e, …) | 2026-05-09 |
| [log.md](./log.md) | Append-only operation log (chronological history of Brain edits) | 2026-05-26 |
| (this file) | Master catalog | 2026-05-26 |

> **Sessions-Catalog-Hinweis.** Diese Index-Datei listet keine einzelnen Session-Files — Sessions leben unter `sessions/` (rotierende `archive/YYYY-MM/`), die Cowork/CC-Catalog-Pflege passiert in `sessions/README.md` (Active-Threads-Tabelle) und im Archive-Sweep (Brief 099-Pattern). Brief 101 (HH-Bootstrap Guard-Reason-Split, gemergt 2026-05-26) und Resolver-Pass 10 (HH-Bootstrap-Apply, gemergt 2026-05-26) erscheinen entsprechend in `sessions/README.md` und [`./log.md`](./log.md) — nicht hier.

## Concept pages

(none planned in 049 — folded into glossary entries; if a glossary entry grows past ~3 sentences, it becomes a `concepts/<slug>.md` page in a future Ingest pass)

## Source-summary pages

(none — `raw/` files have their own banners; `wiki/` doesn't carry source-summary pages today)

## Outside the wiki

- **Raw sources** (immutable): [`../raw/historical/`](../raw/historical/), [`../raw/reviews/`](../raw/reviews/). Files there have `snapshot-*` or `review-*` frontmatter banners. Latest reviews: `2026-05-09-brain-structure-review.md` (Karpathy-Reset audit), `2026-05-09-codex-v2-pilot-review.md` (V2-Pipeline + Faction-Repräsentation).
- **Outputs** (generated, not part of executable knowledge): [`../outputs/lint/`](../outputs/lint/) for lint reports.
- **Sessions** (project history; raw form): top-level [`../../sessions/`](../../sessions/). Linked from wiki pages via `sources:` frontmatter.
- **Atlas** (external Obsidian vault, book domain): `~/chrono-atlas/` (default). Generated via `npm run atlas:regen`. **Never auto-loaded** — see [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md).

## Read-order on session-start

1. Top-level [`/CLAUDE.md`](../../CLAUDE.md) — auto-loaded; stack + conventions + version policy
2. [`../CLAUDE.md`](../CLAUDE.md) — Brain schema (Karpathy frame, three operations, frontmatter)
3. **This file** (master catalog)
4. [`./project-state.md`](./project-state.md) — "where are we now"
5. [`./open-questions.md`](./open-questions.md) — what's queued
6. Whatever's relevant to today's task (pull from this catalog by topic)

## Notes on sources

This catalog is a roll-up of every page under `brain/wiki/`; it has no external sources of its own (`sources: []`). Source-chains live on the pages it indexes.
