# Brain operation log

> Append-only. Every Ingest / Update / Lint / Move / Decision operation gets a section. Format is loose — chronological order, dated, with affected files listed. Read [`./index.md`](./index.md) for the master catalog of pages; this is the *history of edits*, not a navigation aid.
>
> No frontmatter on this file (Brain-schema explicit). New entries go at the *bottom*.

---

## 2026-05-09 · Karpathy-Reset Initial Ingest (brief 049)

The reset itself.

**Read (raw sources):**

- `sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md` (the brief)
- `sessions/2026-05-08-047-arch-pipeline-hardening.md` + `2026-05-08-047-impl-pipeline-hardening.md`
- `sessions/2026-05-08-048-arch-doc-refresh.md` + `2026-05-08-048-impl-doc-refresh.md`
- `sessions/README.md` (pre-049)
- top-level `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `ONBOARDING.md` (pre-049)
- `docs/agents/COWORK.md`, `CLAUDE_CODE.md`, `SESSIONS.md`
- `src/db/schema.ts`, `src/db/client.ts`, `scripts/seed.ts`, `scripts/ingest-backfill.ts`, `package.json`, `drizzle.config.ts`, `tsconfig.json`
- `ingest/.last-run/backfill-20260508-2101.diff.json` (latest pipeline diff)
- Karpathy gist + Starmorph implementation guide (linked in `../CLAUDE.md`)

**Wiki pages created (26):**

- Schema: `brain/CLAUDE.md`
- Top wiki: `index.md`, `log.md` (this file), `glossary.md`, `project-state.md`, `open-questions.md`, `architecture.md`, `roadmap.md`, `onboarding.md`, `pipeline-state.md`, `book-data-overview.md`
- Decisions: `decisions/karpathy-reset-2026-05-08.md`, `decisions/why-drizzle-supabase.md`, `decisions/no-goodreads.md`, `decisions/why-bulk-backfill.md`, `decisions/why-multi-source-merge.md`, `decisions/plan-reshuffle-2026-05-02.md`, `decisions/why-haiku-not-sonnet.md`
- Workflows: `workflows/cowork-session.md`, `workflows/cc-session.md`, `workflows/sessions-format.md`, `workflows/session-end.md`, `workflows/ingest.md`, `workflows/query.md`, `workflows/lint.md`, `workflows/atlas-regen.md`

**Raw sources moved to `brain/raw/historical/`:**

- `2026-05-08-pre-reset/ARCHITECTURE.md` (was `/ARCHITECTURE.md`, 256 lines)
- `2026-05-08-pre-reset/ROADMAP.md` (was `/ROADMAP.md`, 191 lines)
- `2026-05-08-pre-reset/ONBOARDING.md` (was `/ONBOARDING.md`, 220 lines)
- `2026-05-08-pre-reset/README.md` (was `/README.md`, 72 lines, pre-slim version)
- `sessions-readme-log-pre-2026-05-08.md` — 11 of 16 Infrastructure-Log entries from `sessions/README.md` (entries 2026-05-04 Strategie-Anpassung through 2026-05-01 Repo-Transfer)

**Top-level files migrated:**

- `/ARCHITECTURE.md` → 4-line redirect (canonical now: `brain/wiki/architecture.md`)
- `/ROADMAP.md` → 4-line redirect (canonical now: `brain/wiki/roadmap.md`)
- `/ONBOARDING.md` → 4-line redirect (canonical now: `brain/wiki/onboarding.md`)
- `/README.md` → rewritten thin (pitch + Phase-3 status + brain pointer + live URL)
- `/CLAUDE.md` → added `## Brain & Atlas` section at top + fixed line 33 (Stack table Ingestion row "Phase 4: Python" → "Phase 3: TypeScript") + fixed line 99 (layout comment "Phase 4: Python crawlers" → "Phase 3 dry-run outputs") + added `brain/` entry in repo-layout block

**`sessions/README.md` surgery:**

- Infra-log shrunk: 16 → 5 entries (kept top 5 from 2026-05-08–04; older 11 migrated to historical)
- Carry-over body replaced with single pointer to [`brain/wiki/open-questions.md`](./open-questions.md). 9 carry-over items + 2 new from 047-impl migrated as numbered items 1–11 in `open-questions.md`.
- Active-threads table: untouched (Cowork's job)

**Cosmetic stale-reference fixes (4):**

- `next.config.ts:7-11` — refreshed Goodreads-API-stilllegung 2020 note + replaced commented Goodreads pattern with Open Library example
- `src/app/page.tsx:15` — removed stale "Phase 4 ingestion hasn't run yet" parenthetical
- `scripts/seed-data/README.md:101` — "Phase 4 (the ingestion pipeline)" → updated to reflect Phase-3 live + apply-step pending
- `CLAUDE.md:33+99` — already covered above

**Atlas-regen skeleton:**

- `scripts/atlas-regen.ts` — TBD (next commit, this session)
- `package.json` `atlas:regen` script — TBD (next commit)

**Skeleton placeholders:**

- `brain/raw/reviews/README.md` — pointer for future external reviews
- `brain/outputs/lint/README.md` — pointer for future lint reports

**Out-of-scope per brief 049:**

- App / pipeline / DB code untouched
- Migration 0007 still committed-but-not-applied
- `.env.example:43+56-58` and `ROADMAP.md:90` Sonnet-pin references kept (defer to next model-decision brief, per brief)
- Atlas full rendering (only proof-of-render in 049)
- Lint script (workflow page documents what would be checked; script is follow-up brief)

---

## 2026-05-09 · Update · Session-end after 049-impl

First real run of [`./workflows/session-end.md`](./workflows/session-end.md).

**Read:** [`sessions/archive/2026-05/2026-05-09-049-impl-karpathy-brain-atlas-reset.md`](../../sessions/archive/2026-05/2026-05-09-049-impl-karpathy-brain-atlas-reset.md) (the 049 implementer report — four commits `1f6da88`/`3f43f4c`/`64b47b5`/`9fa70d8` on `feat/phase-3c-llm-enrichment`, `lint` + `tsc --noEmit` + `npm run atlas:regen` all green, structural-only, nothing pipeline / app / DB. Moved to archive in 051 Slim Pass.).

**Updated wiki:**

- [`./project-state.md`](./project-state.md) — 049-impl flipped from "(in flight, this commit)" to `complete` in the Recently-shipped table; Branch detail captures the four commit hashes; new "What's running" entry for `npm run atlas:regen` (manual trigger, default `~/chrono-atlas/`, `--out=` and `ATLAS_PATH` overrides, proof-of-render verified DB-counts 26/29); sources frontmatter adds 049-impl.
- [`./decisions/karpathy-reset-2026-05-08.md`](./decisions/karpathy-reset-2026-05-08.md) — two small accuracy fixes: item 5 now mentions `ATLAS_PATH` env override (CC implemented both paths) plus cross-platform reasoning; item 6 corrected from "~25" to "26" pages and notes "no stub-fallback was needed".

**Updated outside the wiki:**

- [`sessions/README.md`](../../sessions/README.md) — Active threads: 049-arch flipped `open` → `implemented`; new top row for 049-impl (`complete`). Footnote: Phase-3 status line "049 (Karpathy-Reset Brain+Atlas, open)" → `complete`.

**No new decision pages.** 049-impl confirmed all eight brief recommendations; they were already documented in [`./decisions/karpathy-reset-2026-05-08.md`](./decisions/karpathy-reset-2026-05-08.md) under "Initial concrete decisions resolved during 049". The two drift fixes above are accuracy patches, not new decisions.

**No new external reviews.** Section 6 of the workflow is n/a this session.

**No structural change to schema / pipeline / roadmap.** [`./architecture.md`](./architecture.md), [`./pipeline-state.md`](./pipeline-state.md), [`./roadmap.md`](./roadmap.md) stay as-is — 049 explicitly left those domains untouched.

**[`./open-questions.md`](./open-questions.md): no edits.** No items resolved by 049 (structural-only). Items 1, 2, 3, 10, 11 explicitly reaffirmed by CC's "For next session" section. No new items surfaced.

**[`./index.md`](./index.md): no edits.** All pages I touched were already dated 2026-05-09 (the date of the initial Ingest); the date stays the same after this session-end update pass.

**Lint / atlas / sessions-archive: skipped.** Lint script is still TBD per brief 049's defer; atlas-regen was verified green by 049-impl itself; no archive-move warranted (Phase 3 still open).

**Meta-observation from CC's "For next session":** "first real session-end-routine test … if painful or has gaps, brief 051 should be a workflow-tweak". This run completed cleanly inside the workflow's 5–15-minute realistic budget. The only friction point was that the workflow's Step 5 implicitly assumed a structural change ("if the report changed: schema → architecture.md, pipeline → pipeline-state.md, roadmap → roadmap.md") and didn't cleanly handle the structural-only case where the report introduces an artefact that's NOT a schema/pipeline/roadmap change but IS a project-state.md change (here: `npm run atlas:regen` — a new "What's running" entry on the project-state-page, not a structural update). I handled that by routing the artefact mention into [`./project-state.md`](./project-state.md)'s "What's running" section, which is the obvious home; logging it here so a future workflow-tweak (if needed) can decide whether Step 2 of [`./workflows/session-end.md`](./workflows/session-end.md) should explicitly call out "new operational artefacts" as a project-state subitem. Not blocking; not worth a workflow-tweak brief today.

## 2026-05-09 · Lint-Hygiene-Pass · Brain Hygiene Pass (Brief 050)

Response to external review now archived at [`../raw/reviews/2026-05-09-brain-structure-review.md`](../raw/reviews/2026-05-09-brain-structure-review.md). Review found Brain architecturally sound but flagged five hygiene gaps; this session addressed gaps 1–4. Gap 5 (lint script) is queued as Brief 051.

**What was corrected:**

- **Class A — broken `sessions/archive/*` paths.** ~27 references corrected across 6 wiki pages, all pointing to `sessions/archive/2026-05/<id>.md` for sessions that actually live directly under `sessions/<id>.md`. Sessions affected: 031, 032, 034, 035, 037, 038, 039. (033 + 046 are the only sessions actually archived; their archive-paths stay.)
- **Class B — phantom filename `2026-05-02-033-arch-daily-drift-RETRACTED.md`.** Two `sources:`-entries (in [`./decisions/why-multi-source-merge.md`](./decisions/why-multi-source-merge.md) and [`./decisions/why-bulk-backfill.md`](./decisions/why-bulk-backfill.md)) referenced a file that doesn't exist on disk. Corrected to the actual archived 033 filename `2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md`.
- **Class C — directory-target body links.** Three `(.../sessions/archive/2026-05/)`-only links (no specific file) repointed to concrete files: 033 (retracted) in two decisions pages, plus the `[025/026-impl]` link in [`./open-questions.md`](./open-questions.md) item 5 expanded to two explicit links (025-arch + 026-impl).
- **Class D — `sources:` frontmatter normalization.** Four entries with parens-comments or free text rewritten to pure paths (or `sources: []` + body note for the catalog). Files: [`./index.md`](./index.md), [`./onboarding.md`](./onboarding.md), [`./open-questions.md`](./open-questions.md), [`./decisions/plan-reshuffle-2026-05-02.md`](./decisions/plan-reshuffle-2026-05-02.md). A future `brain:lint` (Brief 051) can now treat `sources:` as a list of literal paths.
- **Class E — read-order phrasing.** [`./index.md`](./index.md) line ~17 now correctly says read **third** (after top-level `/CLAUDE.md` and `brain/CLAUDE.md`), matching the read-order list in the same file (~lines 81–88) and in [`../CLAUDE.md`](../CLAUDE.md) (lines 11–16).
- **Class F — `.gitattributes`.** New file at repo root with `brain/raw/** text eol=lf`. Stops the LF/CRLF churn on the immutable `brain/raw/historical/` snapshots that was undermining the snapshot-contract on Windows clients.

**Pages touched (wiki):** [`./glossary.md`](./glossary.md), [`./onboarding.md`](./onboarding.md), [`./index.md`](./index.md), [`./open-questions.md`](./open-questions.md), [`./decisions/why-haiku-not-sonnet.md`](./decisions/why-haiku-not-sonnet.md), [`./decisions/why-multi-source-merge.md`](./decisions/why-multi-source-merge.md), [`./decisions/why-bulk-backfill.md`](./decisions/why-bulk-backfill.md), [`./decisions/no-goodreads.md`](./decisions/no-goodreads.md), [`./decisions/plan-reshuffle-2026-05-02.md`](./decisions/plan-reshuffle-2026-05-02.md), this `log.md`. All `updated:` already at 2026-05-09 (pages were created in the 2026-05-09 ingest pass); no date bumps needed.

**Out of scope (per brief):** lint script (Brief 051); re-synthesis of any wiki content; path fixes inside `sessions/*.md`; pipeline / app / DB / migrations.

**Audit was wider than the brief listed:** the brief named glossary, why-haiku-not-sonnet, why-multi-source-merge, open-questions; an exhaustive grep over `brain/wiki/**/*.md` surfaced two additional files with the same pattern ([`./decisions/why-bulk-backfill.md`](./decisions/why-bulk-backfill.md) and [`./decisions/no-goodreads.md`](./decisions/no-goodreads.md)). Brief explicitly authorized this ("audit-exhaustiv, nicht nur diese vier"). Same fix pattern; mitfixed.

---

## 2026-05-09 · Slim · Brain Slim Pass (Brief 051)

Second cut after the 050-Hygiene pass. Goal: keep Brain not just correct but *light*. Six work items, all docs/brain/sessions only — no app / pipeline / DB / migration touches.

**`sessions/README.md` rewrite.** Cut from ~30 active-thread rows + a 5-entry infra-log + a paragraphed carry-over down to: quick-reference + three pointer bullets + a 2-row active-threads table (only 050 + 051 — everything else moved to archive). Now scannable in under 30 seconds.

**Session archive sweep + status fixes.**

- Stale `status: open` corrected on three closed briefs: `034` → `implemented`, `038` → `implemented`, `045` → `answered`.
- Moved 22 closed Phase-3 sessions from `sessions/` root to `sessions/archive/2026-05/`: 031, 032, 034, 035, 036, 037, 038, 039, 040, 041, 042, 043, 044 (arch + impl), 045 (arch + impl), 047 (arch + impl), 048 (arch + impl), 049 (arch + impl). Root now holds only 050-arch (recent + parent of 051) and 051-arch (open).
- New archive rule documented in [`./workflows/sessions-format.md`](./workflows/sessions-format.md) § Archiving: root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else archives promptly (don't wait for a phase to wrap).

**`docs/agents/*` → redirect stubs.** [`docs/agents/COWORK.md`](../../docs/agents/COWORK.md), [`docs/agents/CLAUDE_CODE.md`](../../docs/agents/CLAUDE_CODE.md), [`docs/agents/SESSIONS.md`](../../docs/agents/SESSIONS.md) reduced to ~10-line pointer stubs ("canonical now: `brain/wiki/workflows/<page>`"). Top-level [`/CLAUDE.md`](../../CLAUDE.md) read-order intro updated to point at brain workflows directly.

**ADR rule + slim ADRs.** New "ADR shape" section in [`../CLAUDE.md`](../CLAUDE.md) (Brain schema): Context / Decision / Why / Revisit triggers, no chronological history or running batch numbers. [`./decisions/karpathy-reset-2026-05-08.md`](./decisions/karpathy-reset-2026-05-08.md) cut from ~94 lines to ~45; [`./decisions/why-haiku-not-sonnet.md`](./decisions/why-haiku-not-sonnet.md) cut from ~70 lines to ~45. Numbers and report-style narrative absorbed into [`./pipeline-state.md`](./pipeline-state.md) and the session logs / [`./log.md`](./log.md).

**`open-questions.md` split into Queue + Deferred + Sub-phase backlog.**

- `open-questions.md` reduced from 11 items to 5 actionable: (1) Phase-3e Modell-Entscheidung, (2) Vokabular-Erweiterung, (3) Hand-Check-Workflow, (4) Anthologie-Re-Test für Hebel E, (5) Lexicanum-Junction-Lücke. Items renumbered (10→4, 11→5).
- New [`./deferred-questions.md`](./deferred-questions.md) catches the dormant items: `secondary_era_ids`, redirect-307-mechanism, Sonnet-`no_rating_found`-flag, `series_total_mismatch` observation, cost-tuning mini-brief, and the "distant" half of original item 9 (engine-friction findings, Lexicanum apiSearchFallback, OL Format/Availability heuristic).
- Original item 9's 3d / 3e / 3f reminders absorbed into [`./pipeline-state.md`](./pipeline-state.md) as a new "Sub-phase backlog (concrete to-dos)" section, organized by sub-phase.

**Ingest-diff retention policy** documented in [`./pipeline-state.md`](./pipeline-state.md) "Ingest-diff retention". Hard rule: no committed diff under `ingest/.last-run/` may be deleted until the `/ingest` dashboard read-path has been audited (it enumerates the directory at request time). Acceptance diffs stay; throwaway diffs are allowed to leave in a future cleanup brief; per-batch payloads may eventually move to a cold-store keeping only summary blocks. As of 051: policy documented, **no diffs deleted**.

**Pages touched (wiki):** [`./index.md`](./index.md), [`./open-questions.md`](./open-questions.md), [`./deferred-questions.md`](./deferred-questions.md) (new), [`./pipeline-state.md`](./pipeline-state.md), [`./decisions/karpathy-reset-2026-05-08.md`](./decisions/karpathy-reset-2026-05-08.md), [`./decisions/why-haiku-not-sonnet.md`](./decisions/why-haiku-not-sonnet.md), [`./workflows/sessions-format.md`](./workflows/sessions-format.md), [`../CLAUDE.md`](../CLAUDE.md), this `log.md`. Outside wiki: top-level [`/CLAUDE.md`](../../CLAUDE.md), [`/docs/agents/COWORK.md`](../../docs/agents/COWORK.md), [`/docs/agents/CLAUDE_CODE.md`](../../docs/agents/CLAUDE_CODE.md), [`/docs/agents/SESSIONS.md`](../../docs/agents/SESSIONS.md), [`/sessions/README.md`](../../sessions/README.md), 22 archived sessions (path-only).

**Out of scope (per brief 051):** lint script (Brief 052); pipeline / app / DB / migration code; existing diff JSON deletion (dashboard-coupled); raw historical snapshots; old session content rewriting.

---

## 2026-05-09 · Decision · Ingest-Retention Option A (Brief 052)

Cowork-only Decision-Session (kein CC-Turn). Storage-Strategie für `ingest/.last-run/*.diff.json` festgelegt: **Option A — alle Diff-Files bleiben committed**, bis ein expliziter Trigger feuert. Begründung: Pipeline-Daten-Erhebung noch nicht ausgereift, Voll-Diffs sind Apply-Input + Audit + Triage-Material, Repo bei 808 KB ohne akuten Druck.

**Re-evaluate-Trigger** (auch im neuen Pipeline-State-Abschnitt verankert):

- `ingest/.last-run/` > 5 MB
- 3d-Apply gelaufen + stabil
- Vor 3e-Voll-Lauf falls Hochrechnung > 5 MB
- Wiki-Inline-Quote-Verstoß

**Brain-Regel** (neu, universell): Wiki-Pages zitieren Diff-Files nur per `sources:`-Frontmatter-Pfad — niemals inline. Aggregate gehören in [`./pipeline-state.md`](./pipeline-state.md). Sobald das Lint-Skript existiert, wird der „Inline-Diff-Quote"-Check Teil davon.

**Pages touched (wiki):** [`./pipeline-state.md`](./pipeline-state.md) § "Ingest-diff retention" auf Option-A-Sprache umgestellt + Re-evaluate-Trigger + Brain-Regel ergänzt; this `log.md`. Outside wiki: [`../../sessions/archive/2026-05/2026-05-09-052-arch-ingest-retention-strategy.md`](../../sessions/archive/2026-05/2026-05-09-052-arch-ingest-retention-strategy.md), [`../../sessions/README.md`](../../sessions/README.md).

**Out of scope (per brief 052):** Code-Änderung jeder Art, Datei-Verschiebung in `ingest/.last-run/`, `.gitignore`-Änderung, Dashboard-Refactor, Manifest-/Summary-File-Einführung. Folge-Brief für CC erst, wenn ein Trigger feuert.

**Pre-Decision-Fassung in Git-Historie.** Eine ausführliche Vor-Analyse mit Vergleich aller sechs Optionen (A–F), 11-Regel-Policy-Vorschlag und Folge-Brief-Stub lebt in der Git-Historie von [`../../sessions/archive/2026-05/2026-05-09-052-arch-ingest-retention-strategy.md`](../../sessions/archive/2026-05/2026-05-09-052-arch-ingest-retention-strategy.md). Bei Re-evaluate-Trigger dort als Startpunkt graben.

---

## 2026-05-09 · Lint-Skript · Brain Lint shipped (Brief 053)

Karpathy operation 3/3 (Lint) is now real. `scripts/brain-lint.ts` implements ten check categories per [`./workflows/lint.md`](./workflows/lint.md); CI calls `npm run brain:lint -- --no-write` after `npm run check:eras`.

**First-run findings (4 blocking, 32 warning) triaged + fixed in-session:**

- **Sources × 3.** Date typo in [`./book-data-overview.md`](./book-data-overview.md) (`2026-05-02-021-...` → `2026-05-01-021-...`); wrong-depth relative paths in [`./decisions/plan-reshuffle-2026-05-02.md`](./decisions/plan-reshuffle-2026-05-02.md) and [`./decisions/why-drizzle-supabase.md`](./decisions/why-drizzle-supabase.md) (`../raw/historical/...` → `../../raw/historical/...`).
- **Internal link × 1.** Date typo in [`./deferred-questions.md`](./deferred-questions.md) line 29 (`2026-05-01-024-impl-era-anchor.md` → `2026-05-02-024-impl-era-anchor.md`).
- **Stale-claim warnings (32 → 1 after script tuning + lint-page rewrite).** Initial run was noisy with placeholder paths (`<slug>`, `YYYY-MM-DD-NNN`, `X.md`) and gitignored `ingest/.X/` cache subdirs. The script now skips `[<>{}]` / date-template segments / known gitignored paths, and exempts `log.md` from path-claim (its bullets are journal entries, not current claims). The full-rewrite of [`./workflows/lint.md`](./workflows/lint.md) removed the last placeholder examples. Final remaining warning is one Phase-5 forward reference (see below).

**Pages touched (wiki):** [`./workflows/lint.md`](./workflows/lint.md) (full rewrite — replaces "script TBD" with real flags / severity / categories / out-of-scope), [`./index.md`](./index.md) (lint-row description), [`./book-data-overview.md`](./book-data-overview.md), [`./decisions/plan-reshuffle-2026-05-02.md`](./decisions/plan-reshuffle-2026-05-02.md), [`./decisions/why-drizzle-supabase.md`](./decisions/why-drizzle-supabase.md), [`./deferred-questions.md`](./deferred-questions.md), this `log.md`. **Outside wiki:** [`../CLAUDE.md`](../CLAUDE.md) (lint-bullet now points at the real command), [`../outputs/lint/README.md`](../outputs/lint/README.md), [`../../scripts/brain-lint.ts`](../../scripts/brain-lint.ts) (new), [`../../package.json`](../../package.json) (`brain:lint` script), [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (CI step).

**Out of scope (per brief 053):** auto-fix, weekly GitHub Action / Issue creation, Atlas lint, LLM-driven heuristic checks, code-symbol greps under `src/`, rewriting raw session content. Future-anker for the LLM-driven heuristic pass (Astro-Han pattern) is named in the workflow page so a later brief doesn't reinvent.

**Remaining warning (1, intentional):** [`./roadmap.md`](./roadmap.md) line 76 references `src/lib/recommend.ts` — Phase-5 architectural design statement (typed `recommend(answers)` for Ask the Archive). Resolves when Phase 5 ships; not a defect today.

---

## 2026-05-09 · Session-End nach 054-impl (V2-Pilot) + Codex-Review-Landung

054-impl-Report durchgelesen ([`../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md`](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md)): V2-Pilot trägt, 4/5 hard acceptance bullets clean, $0.062/Buch (vs. V1 $0.114/Buch — fast Halbierung), `false-gods` `startY=39000` korrekt durch `year_outlier`-Validator gedroppt, *tales-of-heresy* deterministisch als `format=anthology` über Validator 4 erkannt, *chem-dog* aus TLBranson (Wikipedia-Frische-Lücke gepatcht). Schwächen: *eisenhorn-xenos* musste über `synthesizeMissingBook`-Fallback (Discovery-Merge-Edge-Case), `garro` `pagecount_outlier` nur per Inspektion verifiziert (OL gab keinen `pageCount=2` zurück), 8 statt ≤7 Web-Searches.

**Codex-Review** in Cowork-Chat eingegangen, zwei Fragen — Faction-Repräsentation (Names vs IDs) und V2-Pipeline-Gesamteinschätzung. Verbatim als externes Review gelandet unter [`../raw/reviews/2026-05-09-codex-v2-pilot-review.md`](../raw/reviews/2026-05-09-codex-v2-pilot-review.md) mit Banner `review-source: codex` / `review-target: sessions/2026-05-09-054`. Codex-Verdikt zur V2-Pipeline: „klar die bessere Pipeline-Basis, aber noch nicht die Pipeline, die ich ohne 055-Test direkt auf 700+ Bücher loslassen würde."

**Updated wiki:**

- [`./project-state.md`](./project-state.md) — Phase-Sektion auf „V2-Pilot abgeschlossen" + V2 in „What's running" (parallel zu V1) + komplett neue „Latest pipeline state (post-054, V2-Pilot)"-Sektion mit V2-Stack-Beschreibung + Acceptance-Numbers + Codex-Verdikt-Quote. „What's open"-Liste auf Post-054-Stand reduziert (alte Anthologie- und Lexicanum-Body-Lore-Items raus, Resolver + Unresolved-Queue rein). „Recently shipped" um 050–054 erweitert. „Next likely brief" auf 055/056/057-Sequenz umgestellt. „What's NOT open in 049"-Sektion entfernt (veraltet).
- [`./pipeline-state.md`](./pipeline-state.md) — Titel auf „post-054", Header-Block dokumentiert V1+V2-Parallelpfade, neue große Sektion „V2-Pipeline (Pilot, post-054)" mit Stage-Architektur (0–4), V2-Modul-Layout, Acceptance-Numbers-Tabelle, Bekannte Schwächen. „What's next"-Liste umgestellt auf 055/056-vor-Apply-Sequenz. „3d (Apply-Step) backlog" um Junction-Resolver und Codex-geschärfte FK-Resolution-Anforderungen erweitert. „3e backlog" um TLBranson-Maintenance-Sicherung + V2-Single-Slug-Form ergänzt.
- [`./open-questions.md`](./open-questions.md) — neuer Migrations-Hinweis im Header (Anthologie + Body-Lore raus, Resolver + Queue rein). Items 4 + 5 ersetzt: (4) Junction-Resolver für 3d-Apply (Codex-geschärft, mit allen vier Anforderungen aus Codex' Antwort), (5) Unresolved-Queue-Strategie (drei Optionen A/B/C, Cowork-Empfehlung Option C). Items 1 (Modell-Entscheidung) + 2 (Vokabular) + 3 (Hand-Check) bleiben, mit Post-054-Updates: Cost-Argument für Haiku noch stärker durch V2-$0.062/Buch, Querverbindung `legion`-Faceten ↔ Junction-Resolver explizit, V2-`FieldRecord.override` als Hand-Check-Override-Slot dokumentiert.
- [`./deferred-questions.md`](./deferred-questions.md) — zwei neue Einträge oben: „Anthologie-Re-Test für Hebel E (Hardcover-Author-Hint) — bestanden in V2-Pilot" (closed mit Promote-when-Trigger) und „Lexicanum-Body-Lore-Pass — V2 hat strukturell entschieden" (closed mit Promote-when-Trigger).
- [`./index.md`](./index.md) — Beschreibungen für `open-questions.md`, `deferred-questions.md`, `pipeline-state.md` aktualisiert; Reviews-Hinweis um Codex-Review erweitert.

**Outside wiki:** [`../../sessions/README.md`](../../sessions/README.md) Active-Threads-Tabelle wird im selben Zug aufgeräumt (50–53 archiviert; nur noch 054 + ggf. Pointer auf 055).

**No new decision pages.** V2-Architektur ist in [`./pipeline-state.md`](./pipeline-state.md) dokumentiert, nicht als separate ADR — die zugrunde liegenden Entscheidungen (Multi-Source-Merge, why-haiku-not-sonnet, why-bulk-backfill) bleiben gültig; V2 ist eine Implementierungs-Schärfung, keine Strategie-Wende. Falls 055-Voll-Lauf trägt und V2 Default wird, könnte ein „why-validators-not-llm-sanity"-ADR sinnvoll werden — heute noch nicht.

**Out of scope:** keine App-/Pipeline-Code-Änderungen, keine Migration, keine Diff-Datei-Verschiebung. Strukturell-only Wiki-Hygiene + Brief-055-Vorbereitung.

---

## 2026-05-10 · Implementer · V2 Voll-Lauf Decision Gate (Brief 055)

CC-Implementation des V2-Voll-Lauf-Briefs. Zwei Pre-Lauf-Code-Fixes gelandet, Batch-Orchestrator gebaut, Voll-Lauf vom 100→50→20-Bücher pivotiert (Maintainer-Direktive mid-session wegen Lexicanum-Throttle-Latenz; siehe „For next session"-Folge-Brief 055.5).

**Pre-Lauf code fixes:**

- `src/lib/ingestion/discovery/merge.ts` — deterministic `genericityScore(seriesHint)` + `pickBetterSeriesHint(a, b)`. Master-list seriesHints lose to sub-page seriesHints regardless of folding order, lex-smaller as tie-break. `scripts/test-discovery-merge.ts` (new) covers all three brief-mandated cases (11/11 passing). Added `npm run test:discovery-merge` script.
- `src/lib/ingestion/v2/llm/prompt.ts` — strict Web-Search-Discipline: Search 1 mandatory, Search 2 only when supplied data + Search 1 yields zero structured-array entities AND book is narrative, Search 3 only when two sources directly contradict on a structured field. User-prompt `# Reminder` footer reinforces. `PROMPT_VERSION_HASH_V2` bumped automatically (`305ed8d37ce0` → `034110f668c5`). 20-book post-055 batch shows perfect 1.00 web_search/book.

**Engine refactor + batch orchestrator:**

- `src/lib/ingestion/v2/run-engine.ts` (new) — shared Stage 0 (discovery) + Stage 1–4 (per-book) + diff-writer extracted from `run-pilot.ts`. Exports `discoverV2Roster()`, `processBookV2(book)`, `writeV2DiffFile(diff, prefix, startedAt)`.
- `src/lib/ingestion/v2/run-pilot.ts` — refactored to thin pilot wrapper around the engine. PILOT_V2_TRYOUT_1 + PILOT_HINTS + fuzzyMatch + synthesizeMissingBook stay; everything else moved.
- `src/lib/ingestion/v2/run-batch.ts` (new) — batch orchestrator. Sorts merged discovery roster by slug ascending, takes first N. Filename prefix `v2-batch-`. One name registered (`v2-tryout-2`).
- `scripts/ingest-backfill.ts` — `--batch=<name>` flag added. CLI dispatches `--pipeline=v2 --pilot=<name>` to pilot, `--pipeline=v2 --batch=<name> [--limit=N]` (default 100) to batch. Mutual exclusion enforced.

**Discovery-quality fixes (out-of-brief, narrowly justified):**

- `src/lib/ingestion/wikipedia/parse.ts` — `BOOK_INDEX_RE` extended to `^(?:Book\s+)?(\d{1,3})\s*[-–:]\s*(.+)$/i`. Wikipedia's master list adopted bare-numeric-prefix (`001: Title`) in late 2025; pre-fix the first slug-sort books were polluted with `001-...` slugs.
- `src/lib/ingestion/tlbranson/parse.ts` — `NAV_TITLE_RE` rejects bullets whose title matches `\b(ways?\s+to\s+read|books?\s+in\s+order|reading\s+order|guide\s+to)\b`. Without this filter, the first slug-sort entries included nav-article titles (`2-ways-to-read-the-halo-books-in-order`).

**Surface-form analysis tooling:**

- `scripts/analyze-v2-surfaces.ts` (new) — reads V2 diff, emits Markdown report (Top-N + Direct-Match/Alias/Unknown breakdown vs `seed-data/{factions,locations,persons}.json`) + sibling JSON full-frequency dump. Added `npm run analyze:v2-surfaces` script.
- `scripts/synthesize-v2-batch-diff.ts` (new) — synthesizes a real `V2DiffFile` from LLM-cache entries when the live batch is halted mid-run. Walks discovery, picks first N by slug-sort, builds BookV2Records using cached LLM payloads + discovery-side fields. Source-claim-derived fields (ISBN, page count, infobox years) null; `validations[]` empty; `errors[]` carries explicit synthesis disclaimer.

**Diff:**

- `ingest/.last-run/v2-batch-20260510-1109.diff.json` — canonical 50-book batch diff, slug-window `13th-legion → ascension`. **Note:** the live batch survived `TaskStop` (the bash wrapper was killed but the underlying `tsx` child kept executing) and completed all 50 books, overwriting any in-progress synthesis attempts. Real source claims, real validator data: year_outlier 1, edition_isbn_conflict 1, author_editor_suspicion 2, lexicanum_missing 20. Web-search avg 1.06/book.
- `ingest/.last-run/v2-batch-20260510-1109-surfaces.json` — full-frequency surface-form dump for Brief 056 Resolver-tooling-Konsumption. Factions: 133/60, 46.7% Direct-Match. Locations: 101/76, 13.2% Direct-Match. Characters: 183/146, 0% Direct-Match (no canonical in-universe character table exists).

**Brain hygiene (incidental):**

- `brain/wiki/log.md` — fixed two stale link targets pointing at `sessions/2026-05-09-052-arch-ingest-retention-strategy.md` (the file moved to archive post-051). Caught by `npm run brain:lint`; brief required green.

**Pages touched (wiki):** [`./pipeline-state.md`](./pipeline-state.md) (V2-Voll-Lauf Acceptance-Numbers section + new modules + V2-Bekannte-Schwächen status flips + What's-next-list mit 055.5er-Brief), this `log.md`. Project-state.md / open-questions.md left to Cowork's session-end pass — they involve interpretive decisions about phase advancement and item pruning beyond raw fact recording.

**Out of scope (per brief 055):** Resolver-Code (Brief 056), Schema-Änderungen, 3d-Apply-Logik, V1-Deprecation, Vokabular-Erweiterung, Modell-Entscheidung, Atlas-Regen, Phase-3.5-Dashboard-Code, Hardcover-Title-Variation, Lexicanum-Body-Lore-Walker. Discovery-quality fixes (Wikipedia parser regex + TLBranson nav filter) were CC-judgment-calls — strictly out-of-brief but materially affected 055 outcome quality (without them, ~40% of any slug-window batch is non-W40k garbage).

**Maintainer-Direktive mid-session (deserves session-format reminder):** the original 100-book Voll-Lauf attempt blew through reasonable session runtime due to per-book Lexicanum URL-probing latency (`CRAWL_DELAY_MS = 5_000` × 11-pattern probe per `lexicanum_missing` book ≈ 60s/book floor). Maintainer pivoted to 50, then to "stop and use what we have" at ~25 books processed. The synthesis-from-cache fallback bridged to a usable diff. Forward principle: ≥50-book batches are not session-completable until per-page Lexicanum cache + per-book diff checkpointing land (Brief 055.5).

---

## 2026-05-10 · Implementer · V2 Pre-Roster Fixes (Brief 056)

Drei isolierte V2-Pipeline-Fixes + Aufräum-Operation auf `ingest/.last-run/`. Alle vier Akzeptanz-Blöcke landeten ohne V2-Architektur-Änderungen.

**Fix 1 — Per-page Lexicanum-Cache (24h TTL + negative caching).** New `src/lib/ingestion/lexicanum/cache.ts` mirrors die TLBranson-Cache-Pattern (`tlbranson/fetch.ts:37–50`), aber als JSON-Envelope mit diskriminierter Union (`{ kind: "hit" | "miss", url, fetchedAt, status, html?, reason? }`) — Negative-Caching obligatorisch, weil 4xx-Rates auf `lexicanum_missing` Büchern den Latenz-Hebel dominieren. Cache-File-Pfad `ingest/.cache/lexicanum/<slugified-pagename>.json`. Filename-Konvention: `[^a-zA-Z0-9._-] → _`, Längen-Cap 200 Chars + sha256-8-hex-Suffix bei Pathologien. Integration in `fetchLexicanumArticle` *vor* `throttle()` — Cache-Hit überspringt das 5 s-Crawl-Delay. `searchLexicanumByTitle` (opensearch) bleibt uncached (1 Call/Buch, kein Latenz-Hebel).

**Fix 2 — Per-book Diff-Checkpointing in `run-batch.ts`.** Atomic-Write-Helper (`writePartialDiff`) + GC-on-start + Snapshot-Closure (`buildDiff()`) hoist `activeSources` ahead of loop, schreibt nach jedem Buch `ingest/.state/v2-batch-<batchName>.partial.diff.json` (overwrite via `.tmp + rename`, mirrors V1 `state.ts:28–30`). End-of-Loop: `writeV2DiffFile` schreibt nach `ingest/.last-run/`, dann wird das Partial-File via `rm({force:true})` gelöscht. Mid-run-Abort lässt Partial-File für Hand-Promotion liegen. Pilot-Loop bleibt unangetastet (5 Bücher = klein genug).

**Fix 3 — Cost-Recompute auf Cache-Hits.** `readCacheV2` in `v2/llm/enrich.ts` widened: returns `{ payload, model }` statt nur `payload`. Cache-Hit-Branch recomputes `estUsdCost` via `estimateUsdCost(audit.tokenUsage, entry.model)` — entry.model statt currently-configured model, damit ein Haiku-Cache-Eintrag unter Haiku-Pricing bleibt. Cache-File wird nicht zurückgeschrieben; Recompute ist read-time only und fließt durch das bestehende `EnrichV2Result.estUsdCost` → `runCost` → `V2DiffFile.llmCostSummary`. Pattern direkt aus `scripts/synthesize-v2-batch-diff.ts:207–214`.

**Fix 4 — Diff-Archivierung + Brain-Sources-Pointer.** `ingest/.archive/{v1,v2-pilot,v2-batch}/` neu (per-Pipeline-Sub-Struktur statt per-Month — die zwei Audit-Anker-Files sind Pipeline-Generation-discriminiert, nicht Datum). 7 V1-Backfill-Diffs (Mai 3, 5, 8) → `archive/v1/`; V2-Pilot → `archive/v2-pilot/`; intermediate `v2-batch-20260510-1059.diff.json` → `archive/v2-batch/`; `047-test-stdout.log` (gitignored *.log) gelöscht. `ingest/.last-run/` enthält jetzt nur `.gitkeep` + `v2-batch-20260510-1109.diff.json` + `v2-batch-20260510-1109-surfaces.json`. Dashboard-Read-Path (`src/lib/ingestion/diff-reader.ts:84`) ist non-recursive auf `last-run/`, picks die Archive nicht auf.

**Brain-Pointer aktualisiert.** Frontmatter `sources:` (lint-blocking via `scripts/brain-lint.ts:541–551` `existsSync`-Check): [`./pipeline-state.md`](./pipeline-state.md) Z 19+20, [`./book-data-overview.md`](./book-data-overview.md) Z 10. Prosa-Erwähnungen (Frische, nicht lint-blocking): [`./pipeline-state.md`](./pipeline-state.md) Z 108+198, [`./book-data-overview.md`](./book-data-overview.md) Z 31+46, [`./project-state.md`](./project-state.md) Z 50+76, [`./roadmap.md`](./roadmap.md) Z 54, this `log.md` Z 22.

**Pages touched (wiki):** [`./book-data-overview.md`](./book-data-overview.md), [`./pipeline-state.md`](./pipeline-state.md), [`./project-state.md`](./project-state.md), [`./roadmap.md`](./roadmap.md), this `log.md`. **Outside wiki:** `src/lib/ingestion/lexicanum/cache.ts` (new), `src/lib/ingestion/lexicanum/fetch.ts`, `src/lib/ingestion/v2/run-batch.ts`, `src/lib/ingestion/v2/llm/enrich.ts`, 9 file-moves under `ingest/.archive/`.

**Out of scope (per brief 056):** V2-Architektur-Änderungen (`BookV2Record`, `Validation[]`, Discovery-Spine, Slim-LLM bleiben unangetastet); Pilot-Loop-Checkpointing (Brief schreibt explizit `run-batch.ts` only); `searchLexicanumByTitle`-Cache (kein Latenz-Hebel); Cache-File-Schreib-back von Cost-Recompute (read-time only); `--resume`-Modus (Partial-File ist Output, kein Auto-Resume); Master-Liste-Erstellung (Brief 057); V2-Pilot-Re-Run; TaskStop-Harness-Issue (Plattform-Limitation).

---

## 2026-05-10 · Implementer + Decision · Excel-SSOT-Import (Brief 057)

CC-Implementation des Excel-SSOT-Imports + neue Decision-Page für den Discovery-Pivot. 057-arch hatte den Maintainer-Pivot 2026-05-10 dokumentiert (statt Crawler-Discovery eine extern gepflegte Excel-SSOT mit 859 Büchern + 192 Collection-Beziehungen); 057-impl hat das Schema + Loader + Truncate-Skript code-fertig gelandet. Migration-Apply + Truncate-Smoke deferred zu Maintainer-Trigger (lokales `.env.local` zeigt auf prod-Supabase).

**Code (CC-Output):**

- `src/db/schema.ts` — vier atomare Adds: `bookFormat`-Enum +3 (`collection`/`artbook`/`scriptbook`), `sourceKind`-Enum +1 (`ssot`), `works.externalBookId varchar(16) UNIQUE`, `bookDetails.notes text`, neue `workCollections`-Junction (composite PK auf `(collection_work_id, content_work_id)`, beide FKs `cascade`, `display_order int NOT NULL DEFAULT 0`, `confidence numeric(3,2)`, `basis text`, Sekundär-Index auf `content_work_id`). `worksRelations` um `containedIn` + `contains` mit expliziten `relationName`-Strings ergänzt; neue `workCollectionsRelations`.
- `src/db/migrations/0008_ssot_schema.sql` — generiert via `npm run db:generate -- --name=ssot_schema`. 19 Zeilen DDL; händisch auditiert (Enum-Adds vor Table-Create, FK-Cascade beidseitig, UNIQUE auf `external_book_id`).
- `scripts/db-reset-for-ssot.ts` (new) — `parseArgs` für `--confirm`, ODER `DB_RESET_CONFIRM=1`-ENV. Loud-Abort sonst mit Hilfetext. `TRUNCATE works CASCADE` (kein `RESTART IDENTITY`, weil `works.id` UUID). Pre/Post-Counts für 12 works-Domain-Tabellen + 10 Reference-Tabellen, mit Assert dass Targets=0 und References unverändert.
- `scripts/seed-data/types.ts` (new) — `RosterBook`, `RosterCollection`, `RosterFile`, `BookFormat`. Always-present-with-null-or-empty-Convention.
- `scripts/import-ssot-roster.ts` (new) — Loader mit Two-Layer-Architektur (pure parsers + I/O-Entry). `read-excel-file` 9.0.9 mit `{ trim: false }`-Workaround (Library-Bug auf bestimmten leeren String-Cells; eigenes Trimming via `toTrimmedString`-Helper). Issue-Collector sammelt alle Failures, druckt am Ende, exit 1.
- `scripts/seed.ts` — TRUNCATE-Liste defensiv um `work_collections` erweitert.
- `scripts/seed-data/book-roster.json` (new, generiert) — 421 KB, 859 Books + 191 Collections. SHA256 `49e0237c575cbaf12cf6817c9fd4bb1b2b048234cecc9137c8e7786d17734f45`.
- `package.json` — `read-excel-file ^9.0.9` als devDep + zwei npm-Scripts: `db:reset-for-ssot`, `import:ssot-roster`.

**Filesystem moves:**

- `mv` (untracked) `docs/data/Warhammer_Books_SSOT_enriched.xlsx` → `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (`_enriched`-Suffix raus).

**CC-Erweiterungen ggü. Brief-Acceptance** (Cowork akzeptiert): RosterBook trägt zusätzlich `editors: string[]` + `editorialNote: "various" | null` (Konsequenz aus den zwei OQ-Antworten); `external_book_id` UNIQUE ohne separaten Index; `work_collections` nur ein Sekundär-Index (Composite-PK reicht für leading-column); Year-`null` → warn statt error; Migration mit explizitem `--name=ssot_schema`; `RESTART IDENTITY` weggelassen (UUIDs only).

**Brain (Cowork-Output, this session):**

- [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md) (**new**) — ADR mit Context (drei strukturelle 055-Probleme + Maintainer-Excel als bessere Alternative), Decision (Excel-SSOT in repo, Loader, Schema-Migration 0008, Hard-Delete der 26, Pipeline-Refactor in Brief 058), Why (Curatorial-Decisions bekommen Slot, Latenz-Drop, Pipeline-Maschinerie unverändert), Revisit-Trigger (Maintenance-Burden, Quality-Divergenz, 3d-Apply-Direct-Load, Excel-Größenwachstum).
- [`./project-state.md`](./project-state.md) — Phase-Sektion auf Excel-SSOT-Pivot umgeschrieben; Branch-Liste um 056+057 erweitert; What's running (DB-Sektion mit Migration 0008 committed-but-NOT-applied + Excel-SSOT-Roster-Sektion); Latest-pipeline-state-Sektion komplett neu (post-057, mit CC-Erweiterungen + Author-Splitting-Empirie); What's-open neu sortiert (Maintainer-Trigger zuerst, dann Brief 058); Recently-shipped um 056+057 ergänzt; Next-likely-brief auf Maintainer-Trigger → 058 → 059+ Sequenz.
- [`./pipeline-state.md`](./pipeline-state.md) — Header `post-055` → `post-057` mit SSOT-Pivot-Pointer; neue Excel-SSOT-Layer-Sektion (Inputs/Outputs, CC-Erweiterungen, Schema-DDL, Type-Map, display_order-Hybrid, Author-Splitting-Empirie, Excel-Workflow, bekannte Schwächen); What's-next-Sektion neu nummeriert (056 + 057 als ✅, 058 als nächst-queued, 059+ als 10er-Batch-Reihe); 3d-Backlog um Migration-0008-Apply + work_collections-Population erweitert.
- [`./open-questions.md`](./open-questions.md) — Migrations-History-Note kompakter formuliert; OQ7 + OQ8 als closed/verschoben markiert (mit ADR-Cross-Link); OQ4-Note um Post-057-Pointer erweitert (Excel ändert die Resolver-Frage nicht).
- [`./index.md`](./index.md) — `updated:` auf 2026-05-10 gebumpt für project-state, open-questions, pipeline-state, log, deferred-questions, plus neue Decision-Page why-excel-ssot-not-crawl.md.

**Outside wiki:** [`../../sessions/README.md`](../../sessions/README.md) Active-Threads-Tabelle geleert (056+057 archiviert); 056-arch + 056-impl + 057-arch + 057-impl von `sessions/` root nach `sessions/archive/2026-05/` verschoben (4 git mv).

**No new external reviews.**

**Out of scope (per brief 057):** V2-Pipeline-Refactor (Brief 058 — Discovery-Stage-0-abschalten, Validators trimmen, LLM-Tool-Schema schrumpfen, erster 10er-Batch), DB-Writes aus dem Loader, DetailPanel "Auch enthalten in:"-UI, Junction-Resolver, Author-/Person-Resolver, Series-ID-Mapping, Migration-Apply auf prod, `docs/data/`-Aufräumung, Vokabular-Erweiterung (OQ2), Brain-Lint-Konvention "Brain ↔ Buch-Daten" (gehört in späteren Hygiene-Brief, nicht in Schema-Migration-Brief).

---

## 2026-05-13 · Update · Resolver applied + SSOT loop ready

- Read: sessions/archive/2026-05/2026-05-12-063-impl-resolver-50-books.md, sessions/archive/2026-05/2026-05-12-067-impl-resolver-apply-readiness.md, sessions/archive/2026-05/2026-05-12-069-impl-resolver-apply-evidence.md
- Updated wiki: project-state.md (post-069 anchor), pipeline-state.md (SSOT authority + resolver layer), open-questions.md (OQ4/OQ5 closed for first 50 W40K books), index.md (catalog dates/descriptions)
- Session hygiene in same cleanup pass: archived 058/060 session logs, added 059 archive note, committed missing 061/062 architect briefs.
- Other: local Git `core.autocrlf=false` set for this repo to avoid Windows LF/CRLF churn; local/generated artefacts moved to `.scratch/cleanup-2026-05-13/` outside Git.

## 2026-05-13 · Update · Resolver branch/main alignment

- Read: current Git comparison `origin/main..session-063-resolver-50-books` after fetch, plus the existing post-069 Brain Ingest.
- Updated wiki: project-state.md (Branch / What's open / Next likely brief wording), pipeline-state.md (next-axis wording).
- New decision: (none)
- Other: `origin/main` already has the resolver code as patch-equivalent commits; the resolver branch now carries only Brain/session hygiene that should land before `ssot-w40k-006` resumes.

---

## 2026-05-13 · Implementer · Faction Policy & Hierarchie-Hygiene (Brief 070)

Parallele Hygiene-Spur zur SSOT-Loop. Browse-Root-Konzept (UI-Filter-Ebene) sauber von Tree-Root (`parent_id IS NULL`) getrennt; Policy lebt in einer JSON-Datei plus einer Decision-Page — kein Schema-Touch. Audit-Pass auf `factions.json` fixt langgetragene Lore-Bugs: `chaos`-Row `name` von „Chaos Undivided" auf „Chaos", Heresy-Traitor-Legionen (`sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `alpha_legion`) reparented von `imperium` auf `chaos`, alle Loyalist-Astartes-Chapters (Ultramarines, Blood Angels, Space Wolves, Dark Angels, Raven Guard, Salamanders, Imperial Fists, Black Templars) reparented von `imperium` auf `adeptus_astartes`. Grey Knights → `adeptus_astartes` (CC-Wahl mit Begründung). 14 Reparents + 1 Rename + Alignment-Felder auf 14 Rows.

**Update-Mechanik** = Option A aus Brief-Notes Tabelle 4: `seed-resolver-extensions` Faction-Insert geliftet auf `onConflictDoUpdate` (nur JSON-stammende Spalten: `name`, `parent_id`, `alignment`, `tone`, `glyph`). Sectors/Locations/Characters bleiben insert-only — dort wird Maintainer-Anreicherung erwartet, JSON ist nicht alleinige Wahrheit. Verify-SELECT (8 Rows: chaos, sons_of_horus, ultramarines, world_eaters, tanith_first, grey_knights, alpha_legion, imperium) bestätigt prod-DB-Stand. `db:seed-resolver-extensions`-Output: `+0 new, 52 updated` für Factions; Junctions unverändert (kein Apply-Sweep nötig).

**Brain-Lint** kriegt eine neue Kategorie „Faction policy" (11 Kategorien total): Regel 1 (warn) auf parent-null-Faction-Rows die weder in `browseRoots` noch in `knownTopLevelExceptions` der Policy-JSON stehen; Regel 2 (error) auf dangling `parent`-FKs. Post-Patch-Lauf: 0 Findings in der neuen Kategorie; 4 pre-existing Warnings unverändert.

**Pages touched (wiki):** [`./decisions/faction-policy.md`](./decisions/faction-policy.md) (new, Type `decision`, Sections: Context · Drei Ebenen · Browse-Root-Whitelist · Sonderfälle · Was wir bewusst NICHT entscheiden · Revisit-Trigger · Aftermath), [`./project-state.md`](./project-state.md) (Recently-shipped neue Top-Zeile, „What's running" neuer Faction-Policy-Bullet + brain-lint auf 11 Kategorien gehoben, frontmatter `sources:` + `related:` erweitert), [`./index.md`](./index.md) (Decisions-Tabelle neue Zeile), [`./open-questions.md`](./open-questions.md) (Migration-History-Note + `sources:`/`related:`), this `log.md`. **Outside wiki:** [`scripts/seed-data/factions.json`](../../scripts/seed-data/factions.json), [`scripts/seed-data/faction-policy.json`](../../scripts/seed-data/faction-policy.json) (new), [`scripts/seed-resolver-extensions.ts`](../../scripts/seed-resolver-extensions.ts), [`scripts/brain-lint.ts`](../../scripts/brain-lint.ts), [`docs/resolver-apply-runbook.md`](../../docs/resolver-apply-runbook.md), [`sessions/README.md`](../../sessions/README.md), [`sessions/2026-05-13-070-arch-faction-policy-hygiene.md`](../../sessions/2026-05-13-070-arch-faction-policy-hygiene.md) (status flip), [`sessions/2026-05-13-070-impl-faction-policy-hygiene.md`](../../sessions/2026-05-13-070-impl-faction-policy-hygiene.md).

**Decisions reaffirmed durch CC:** (a) Update-Mechanik = Option A (Cowork-Empfehlung), (b) Grey Knights Parent = `adeptus_astartes` (Books klassifizieren GK als Marines, nicht als Inquisition-Apparat), (c) Alpha Legion Parent = `chaos` (post-Heresy-Default, Cabal-Twist ist HH-Domain-Sorge), (d) `imperium` als `knownTopLevelExceptions` (Grand-Alignment-Konzept, keine UI-Filter-Wahl — sonst dauerhafte Lint-Warning).

**For-next-session aus dem Report:** Tone-Anreicherung (eigenes Brief, kosmetisch), `chaos`-Alias kann später aufgeräumt werden (Direct-Match hat Priorität, harmlos), Reverse-Lint-Direction `browseRoots → factions.id` (Future, falls UI-Code das einfordert), UI-Rollup-Vorarbeit (Trigger: ≥100 Bücher resolved + UI-Polish-Phase aktiv — bereits in Decision-Page „Revisit triggers" verankert).

**Out of scope (per brief 070):** UI-Rollup, Schema-Migration, `kind`-Feld in der DB, neue Faction-Rows (Khorne/Tzeentch/Nurgle/Slaanesh/Sisters of Silence/Aeldari-Split/`chaos_undivided`), Alias-Refactor, Re-Apply existierender Batches, HH-Domain-Audit.

(Future entries go below as new `## YYYY-MM-DD · <Op-type> · <short-title>` sections.)

---

## 2026-05-14 · Implementer · Resolver-Pass 2 für `ssot-w40k-006..010` (Brief 072)

Zweite Resolver-Welle. CC hat in einem Branch (`session-072-resolver-batch-2` o. ä., Merge auf `main` steht aus) die im Brief vereinbarte Surface-Form-Crystallization umgesetzt — 54 neue Factions inkl. `heretic_astartes`-Mid-Knoten (parent=`chaos`, alignment=`chaos`) und Reparent von `sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `word_bearers`, `iron_warriors`, `lords_of_unholy_host` (+ optional `alpha_legion`, CC hat reparented) plus die ehemals fehlenden `death_guard` und `emperors_children` als Heretic-Astartes-Kinder. 45 neue Locations + `great_rift`-In-place-Mutate (zusätzlicher Tag `era_frame`). 38 neue Characters (16 freq≥2 + 22 lore-iconic freq=1). Aeldari-/Drukhari-/Khârn-/Czevak-Aliase ergänzt. `faction-policy.json` um `heretic_astartes`, `adeptus_titanicus`, `officio_assassinorum` als Browse-Roots erweitert.

**Cross-Batch-Collection-Refactor:** `apply-override.applyCollections` löst `external_book_id`-Endpunkte primär aus dem Batch-Map, bei Miss per DB-Lookup gegen `works.external_book_id`. Forward-Refs (`0`) loud-warned. Same-batch-Baseline 17 → Refactor 35 `work_collections`-Rows.

**Counts nach Re-Apply `001..010`:** `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`. Coverage `factions=650/657`, `locations=239/258`, `characters=475/552`. Smoke-Slugs: `the-anarch=9/3/11`, `calgars-fury=7/3/1`, `the-emperors-gift=8/2/1`, `storm-of-iron=6/1/6`, `celestine=5/1/1`, `spear-of-the-emperor=8/3/2`. Collection-Spotcheck: `W40K-0040` enthält `first-and-only`, `ghostmaker`, `necropolis`; `W40K-0061` enthält `storm-of-iron`, `iron-warrior`.

**Disziplin-Notizen:**

- Pre-Apply-DB-Counts wurden nicht als Tabelle reportet, nur Post-Counts — Brief-Acceptance hatte beide verlangt. Nächste Resolver-Welle: Tabelle erzwingen.
- Per-Batch-Counts pro Re-Apply-Iteration fehlen ebenfalls — Global + Smoke + Coverage reichen für die Konsistenz-Story, aber die 10-Zeilen-Tabelle wäre die saubere Form.
- Character-Junction-Wachstum (+112 für 50 Bücher vs. +363 in erster Welle) ist auffällig niedrig. Passt zur Long-Tail-Hypothese (`characters=475/552`, 77 unresolved). Wird der erste Cockpit-Triage-Datenpunkt.
- CC hat zwei Brain-Dateien angefasst (`brain/wiki/index.md`, `brain/wiki/decisions/why-sonnet-not-haiku.md`), um `brain:lint -- --no-write` grün zu kriegen. Ursache: Cowork hatte vor dem Brief-Commit dirty Brain-Edits im Worktree, die den Lint blockierten. CC hat das Minimum-Fix gefahren und transparent gemeldet; `project-state.md` / `open-questions.md` / `why-haiku-not-sonnet.md` / Brief-Drafts bewusst nicht angefasst. Disziplin-Punkt für Cowork: vor jedem Brief-Commit `brain:lint -- --no-write` lokal grünziehen.

**Pages touched (wiki):** `project-state.md` (post-072 anchor, Branch-Note, Counts, Latest-pipeline-state-Block, What's-open, Recently-shipped, Next-likely-brief), `open-questions.md` (OQ2-(b) Status-Update, OQ9 scharfgeschaltet, Migration-History-Note erweitert, frontmatter), `index.md` (Datum-Bump auf 2026-05-14, post-072-Note), this `log.md`.

**Outside wiki:** `scripts/seed-data/factions.json`, `scripts/seed-data/locations.json`, `scripts/seed-data/characters.json`, `scripts/seed-data/faction-aliases.json`, `scripts/seed-data/location-aliases.json`, `scripts/seed-data/character-aliases.json`, `scripts/seed-data/faction-policy.json`, `scripts/seed-resolver-extensions.ts`, `scripts/apply-override.ts`, `scripts/test-resolver.ts`, `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts`, `sessions/2026-05-14-072-arch-resolver-batch-2.md` (status flip), `sessions/2026-05-14-072-impl-resolver-batch-2.md`, `sessions/README.md`.

**Out of scope (per Brief 072):** Schema-Migration, UI-Arbeit, neues Test-Framework, HH-Domain-Resolver, Cockpit-Audit-Route, Hardcover-Rating-Promotion, Anreicherungs-Brief für Reference-Rows, Logical-Work-ID / `superseded_by`, `canonicity`-Facet, `primaris`-/`firstborn`-Facet, Hierarchy-Rollup-Filter in der UI.

## 2026-05-14 · Architect · Brief 073 — Maintainer-Audit-Cockpit (OQ9)

OQ9 in einen Brief gefaltet. Brief 073 (`sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md`) trennt `/buch/[slug]` (public-lean) von neuer Sub-Route `/buch/[slug]/audit` (Read-only Server Component, alle DB-Felder inkl. `raw_name`, `work_collections.confidence`/`basis`, `external_links`, `notes`) und gibt `/buecher` einen Audit-Modus mit vier kombinierbaren Filter-Pillen: **Drift** (`raw_name ≠ canonical`), **Junction-Lücke** (0 Rows in einer der drei Junctions), **SSOT** (`source_kind=ssot`), **In mehreren Collections** (`content_work_id`-Count ≥ 2). AND-Logik bei Multi-Select. Default-Sort im Audit-Modus: `updatedAt desc`. Audit-Route trägt `noindex`. Keine Schema-Migration. `confidence < 0.7` bewusst nicht in die Pflicht-Filter — heute steht im SSOT-Layer fast alles auf 1.00, der Filter wird erst scharf, wenn der Sonnet-Pipeline-Lauf wieder läuft (post-OQ2-(c)).

Triage-Material aus 072, das das Cockpit sichtbar machen muss: Character-Long-Tail (+112 für 50 Bücher vs. +363 für die ersten 50), Iyanden-Doppel-Pfad, Aeldari-/Drukhari-Alias-Drift, 35 Cross-Batch-Collections.

**AskUserQuestion-Lock-In 2026-05-14:**

- Filter-Set: `Drift + Junction-Lücke + SSOT + Bonus 'In mehreren Collections'`.
- Sub-Route-Pfad: `/buch/[slug]/audit` (Sub-Segment).
- Audit-Tiefe: vollumfänglich pro Achse, was die Schicht hergibt (`work_factions`/`work_locations`/`work_characters` haben `role+raw_name`, `work_collections` hat zusätzlich `confidence+basis+displayOrder`, `works` trägt `confidence+sourceKind+externalBookId`).
- Default-Sort: `updatedAt desc` (letzter Apply zuerst).

**Design-Freedom-Block** zwischen Goal und Context übergibt explizit Pillen-Shape, Drift-Markierung, Audit-Section-Frame, Public-↔-Audit-Link-Position+Copy, Animations-Timings, oklch-Werte und Spacing-Skala an Claude Code. Architektur bleibt bei Cowork (welche Routen, welche Felder, welche Filter, AND-Logik, noindex-Intent).

**Sessions hygiene mitkommutiert:** `2026-05-12-063-arch-resolver-50-books.md`, `063-impl`, `067-impl`, `069-impl` nach `sessions/archive/2026-05/` verschoben (per Cowork-Direktive — closed + nicht mehr load-bearing). Pfad-Referenzen aktualisiert in `brain/wiki/project-state.md`, `brain/wiki/open-questions.md`, `brain/wiki/pipeline-state.md`, `brain/wiki/log.md` (alle Source-Listen + dieser Log-Eintrag). 062-arch/-impl + 064 + 065 + 066 + 068 bleiben bewusst in `sessions/-Root` (nicht in der Cowork-Direktive).

**Pages touched (wiki):** `project-state.md` (Next-likely-brief auf 073-arch umgestellt, Source-Pfade), `open-questions.md` (OQ9 auf folded-into-073 reduziert, Source-Pfade, Frontmatter-Note), `pipeline-state.md` (Source-Pfade), `index.md` (project-state + open-questions Tabellen-Rows), this `log.md`.

**Outside wiki:** `sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md` (neu), `sessions/README.md` (073-Row, Maintainer-Bedienung-Satz), `sessions/archive/2026-05/2026-05-12-063-arch-resolver-50-books.md` + `063-impl` + `067-impl` + `069-impl` (verschoben).

**Out of scope (per Brief 073):** Inline-Edit-Pfad in der UI, Auth/Login, `ssot-w40k-011`-Loop-Resume, Brief 071 (Loop-Driver), OQ2-(c) `chaos`-pov_side-Prompt-Härtung, Hardcover-Rating-Promotion (OQ6), Schema-Migration, Cartographer-/Timeline-Audit-Filter, Reference-Entity-Audit-Pages (`/fraktion/[slug]/audit` etc.), Site-weit-Robots-Policy.

**Codex-Review-Pass 2026-05-14 (vor Commit):** Codex hat den 073-Brief vor Hand-Off durchgegangen und fünf konkrete Schärfungen geliefert, alle übernommen.

1. **Drift-Filter falsch definiert.** Brief schrieb erst `raw_name IS NOT NULL` → würde fast alle SSOT-Bücher matchen, weil `scripts/apply-override.ts` (line ~363) `rawName` unconditional aus der Surface-Form setzt (auch wenn `raw_name == reference.name`). Korrigiert auf `raw_name IS NOT NULL AND raw_name <> {reference}.name` an allen drei Stellen: `/buecher`-Filter-Definition (Acceptance), Drift-Markierung pro Section in der Audit-View (Acceptance), und Design-Freedom-Beschreibung der Drift-Sichtbarkeit.
2. **Goal-Paragraph-Widerspruch.** Erstfassung las „Detail-Seite ist nicht Reddit-Public, sondern Cockpit", aber `/buch/[slug]` ist im Brief klar public-lean. Korrigiert auf „die bisherige Detail-Seite soll nicht länger Audit und Public mischen — die neue Audit-Sub-Route wird das Cockpit".
3. **Public-Constraints kollidierte mit Pillen.** Constraints-Block sagte „Sichtbare Felder ausschließlich Cover/Titel/...", Acceptance erlaubte aber Faction-/Location-/Character-Pillen. Konsolidiert: Pillen + Facet-Tags sind explizit in der erlaubten Public-Liste. „Nicht sichtbar" zählt nur den Audit-Layer auf (raw_name, confidence, sourceKind, externalBookId, notes, rating, work_collections.confidence/basis, external_links als Liste).
4. **Drukhari-Alias-Beispiel.** Brief schrieb fälschlich „Drukhari → `dark_eldar`". `scripts/seed-data/faction-aliases.json` line 13–14 mappt sowohl „Drukhari" als auch „Dark Eldar" auf `eldar` (kein eigener `dark_eldar`-Row im Seed). Beispiel an beiden Stellen korrigiert; bonus: der Fall ist jetzt der saubere Drift-Demo (`raw_name = "Drukhari"` ≠ `factions.name = "Eldar"`).
5. **`brain:lint` in Hygiene-Acceptance.** AGENTS.md verlangt `npm run brain:lint -- --no-write` bei Code-Änderungen. Acceptance ergänzt zwischen `npm run lint` und `npm run dev`.

Operativ-Punkt: 073-Brief liegt aktuell untracked auf `codex/session-072-resolver-batch-2`. Maintainer muss vor CC-Start commit/push (oder 072 sauber auf main landen) — sonst sieht CC den Brief je nach gewählter Cwd nicht.

## 2026-05-15 · Architect · Brief 074 Green-Tide-Collection-Gap-Addendum

Maintainer-Review hat die Green-Tide-Entscheidung aus Brief 074 geschärft: *The Green Tide* (`W40K-0147`) bleibt vollständig in scope als normales Buch für Resolver-Apply (Facets / Factions / Locations / Characters), aber bleibt vorerst out of scope als vollständige `work_collections`-Struktur. Grund: Einige Constituents existieren bereits als Roster-Works (`W40K-0128` *Warboss*, `W40K-0118` *Catachan Devil*, `W40K-0249` *Iron Resolve*, `W40K-0565` *Prisoners of Waaagh!*), Short-Story-Constituents sind aber noch nicht als eigene Roster-Works modelliert. Partielle Collection-Kanten würden im UI später leicht wie Vollständigkeit aussehen.

Brief 074 verlangt deshalb neu ein maschinenlesbares Ledger `scripts/seed-data/collection-gaps.json`: Green Tide wird dort als `needs_constituent_roster_entries` festgehalten, inklusive bekannter existierender Constituents und bekannter fehlender Short-Story-Titel. `book-roster.json` bleibt in 074 unangetastet; ein späterer Collection-Gap-Resolve-Pass ergänzt fehlende Works/Roster-Rows und schreibt dann vollständige `roster.collections`.

**Pages touched (wiki):** `project-state.md` (Green-Tide-Status auf Collection-Gap-Ledger statt Report-only-Handoff), `pipeline-state.md` (dauerhafte Collection-gap policy), `index.md` (Katalogzeilen), this `log.md`.

**Outside wiki:** `sessions/2026-05-15-074-arch-resolver-batch-3.md` (Erratum/Goal/Context/Acceptance/Open-Questions geschärft), `scripts/seed-data/README.md` (Policy-Hinweis für `collection-gaps.json`).
