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

**Pages touched (wiki):** [`./decisions/faction-policy.md`](./decisions/faction-policy.md) (new, Type `decision`, Sections: Context · Drei Ebenen · Browse-Root-Whitelist · Sonderfälle · Was wir bewusst NICHT entscheiden · Revisit-Trigger · Aftermath), [`./project-state.md`](./project-state.md) (Recently-shipped neue Top-Zeile, „What's running" neuer Faction-Policy-Bullet + brain-lint auf 11 Kategorien gehoben, frontmatter `sources:` + `related:` erweitert), [`./index.md`](./index.md) (Decisions-Tabelle neue Zeile), [`./open-questions.md`](./open-questions.md) (Migration-History-Note + `sources:`/`related:`), this `log.md`. **Outside wiki:** [`scripts/seed-data/factions.json`](../../scripts/seed-data/factions.json), [`scripts/seed-data/faction-policy.json`](../../scripts/seed-data/faction-policy.json) (new), [`scripts/seed-resolver-extensions.ts`](../../scripts/seed-resolver-extensions.ts), [`scripts/brain-lint.ts`](../../scripts/brain-lint.ts), [`docs/resolver-apply-runbook.md`](../../docs/resolver-apply-runbook.md), [`sessions/README.md`](../../sessions/README.md), [`sessions/archive/2026-05/2026-05-13-070-arch-faction-policy-hygiene.md`](../../sessions/archive/2026-05/2026-05-13-070-arch-faction-policy-hygiene.md) (status flip), [`sessions/archive/2026-05/2026-05-13-070-impl-faction-policy-hygiene.md`](../../sessions/archive/2026-05/2026-05-13-070-impl-faction-policy-hygiene.md).

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

**Outside wiki:** `scripts/seed-data/factions.json`, `scripts/seed-data/locations.json`, `scripts/seed-data/characters.json`, `scripts/seed-data/faction-aliases.json`, `scripts/seed-data/location-aliases.json`, `scripts/seed-data/character-aliases.json`, `scripts/seed-data/faction-policy.json`, `scripts/seed-resolver-extensions.ts`, `scripts/apply-override.ts`, `scripts/test-resolver.ts`, `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts`, `sessions/archive/2026-05/2026-05-14-072-arch-resolver-batch-2.md` (status flip), `sessions/archive/2026-05/2026-05-14-072-impl-resolver-batch-2.md`, `sessions/README.md`.

**Out of scope (per Brief 072):** Schema-Migration, UI-Arbeit, neues Test-Framework, HH-Domain-Resolver, Cockpit-Audit-Route, Hardcover-Rating-Promotion, Anreicherungs-Brief für Reference-Rows, Logical-Work-ID / `superseded_by`, `canonicity`-Facet, `primaris`-/`firstborn`-Facet, Hierarchy-Rollup-Filter in der UI.

## 2026-05-14 · Architect · Brief 073 — Maintainer-Audit-Cockpit (OQ9)

OQ9 in einen Brief gefaltet. Brief 073 (`sessions/archive/2026-05/2026-05-14-073-arch-maintainer-audit-cockpit.md`) trennt `/buch/[slug]` (public-lean) von neuer Sub-Route `/buch/[slug]/audit` (Read-only Server Component, alle DB-Felder inkl. `raw_name`, `work_collections.confidence`/`basis`, `external_links`, `notes`) und gibt `/buecher` einen Audit-Modus mit vier kombinierbaren Filter-Pillen: **Drift** (`raw_name ≠ canonical`), **Junction-Lücke** (0 Rows in einer der drei Junctions), **SSOT** (`source_kind=ssot`), **In mehreren Collections** (`content_work_id`-Count ≥ 2). AND-Logik bei Multi-Select. Default-Sort im Audit-Modus: `updatedAt desc`. Audit-Route trägt `noindex`. Keine Schema-Migration. `confidence < 0.7` bewusst nicht in die Pflicht-Filter — heute steht im SSOT-Layer fast alles auf 1.00, der Filter wird erst scharf, wenn der Sonnet-Pipeline-Lauf wieder läuft (post-OQ2-(c)).

Triage-Material aus 072, das das Cockpit sichtbar machen muss: Character-Long-Tail (+112 für 50 Bücher vs. +363 für die ersten 50), Iyanden-Doppel-Pfad, Aeldari-/Drukhari-Alias-Drift, 35 Cross-Batch-Collections.

**AskUserQuestion-Lock-In 2026-05-14:**

- Filter-Set: `Drift + Junction-Lücke + SSOT + Bonus 'In mehreren Collections'`.
- Sub-Route-Pfad: `/buch/[slug]/audit` (Sub-Segment).
- Audit-Tiefe: vollumfänglich pro Achse, was die Schicht hergibt (`work_factions`/`work_locations`/`work_characters` haben `role+raw_name`, `work_collections` hat zusätzlich `confidence+basis+displayOrder`, `works` trägt `confidence+sourceKind+externalBookId`).
- Default-Sort: `updatedAt desc` (letzter Apply zuerst).

**Design-Freedom-Block** zwischen Goal und Context übergibt explizit Pillen-Shape, Drift-Markierung, Audit-Section-Frame, Public-↔-Audit-Link-Position+Copy, Animations-Timings, oklch-Werte und Spacing-Skala an Claude Code. Architektur bleibt bei Cowork (welche Routen, welche Felder, welche Filter, AND-Logik, noindex-Intent).

**Sessions hygiene mitkommutiert:** `2026-05-12-063-arch-resolver-50-books.md`, `063-impl`, `067-impl`, `069-impl` nach `sessions/archive/2026-05/` verschoben (per Cowork-Direktive — closed + nicht mehr load-bearing). Pfad-Referenzen aktualisiert in `brain/wiki/project-state.md`, `brain/wiki/open-questions.md`, `brain/wiki/pipeline-state.md`, `brain/wiki/log.md` (alle Source-Listen + dieser Log-Eintrag). 062-arch/-impl + 064 + 065 + 066 + 068 bleiben bewusst in `sessions/-Root` (nicht in der Cowork-Direktive).

**Pages touched (wiki):** `project-state.md` (Next-likely-brief auf 073-arch umgestellt, Source-Pfade), `open-questions.md` (OQ9 auf folded-into-073 reduziert, Source-Pfade, Frontmatter-Note), `pipeline-state.md` (Source-Pfade), `index.md` (project-state + open-questions Tabellen-Rows), this `log.md`.

**Outside wiki:** `sessions/archive/2026-05/2026-05-14-073-arch-maintainer-audit-cockpit.md` (neu), `sessions/README.md` (073-Row, Maintainer-Bedienung-Satz), `sessions/archive/2026-05/2026-05-12-063-arch-resolver-50-books.md` + `063-impl` + `067-impl` + `069-impl` (verschoben).

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

**Outside wiki:** `sessions/archive/2026-05/2026-05-15-074-arch-resolver-batch-3.md` (Erratum/Goal/Context/Acceptance/Open-Questions geschärft), `scripts/seed-data/README.md` (Policy-Hinweis für `collection-gaps.json`).

## 2026-05-15 · Implementer · Resolver-Pass 3 für `ssot-w40k-011..015` (Brief 074-impl, PR #57 `6ac4295`)

Dritte Resolver-Welle gelandet, alle Acceptance-Bullets erfüllt. **22 Dateien geändert**, alles in `scripts/` + `sessions/` (kein Schema-Touch, kein V2-Pipeline-Eingriff, kein UI-Drift). PR-Squash auf `main` am 2026-05-15 ~15:12 Lokal-Zeit (Phil als Author of record).

**Reference-Tables erweitert:**

- `scripts/seed-data/factions.json` +20 Rows: `hydra_cabal` (parent=`inquisition`, `tone: 'historical_canon_layer'`) als Watson-Trilogy-Knoten, `triarch_praetorians` (alignment=`xenos` statt `neutral`-Brief-Tendenz, lore-konsistent), Sororitas-Order-Sub-Factions (`order_of_our_martyred_lady`, `order_of_the_last_candle`), Astartes-Loyalist-Sub-Factions, Aeldari-/Necron-/Navis-Sub-Factions, Goffs als named-Ork-Clan-Anker, Aeronautica Imperialis (freq=4 in 011..015, parent=`astra_militarum`). Plus Squats-`tone`-Update auf `historical_canon_layer` via `onConflictDoUpdate` (Single-Token-Konvention konsistent mit `archive`/`line`/`alien`).
- `scripts/seed-data/locations.json` +19: Imperium-Nihilus-Frames mit `era_frame`-Tag, Necron-Tomb-Worlds (Orymous, Attilan Gap), Watson-Welten Stalinvast + Sabulorb mit `historical_canon_layer`-Tag, Named-Vehicles. `seed-resolver-extensions.ts` location-Tags wurden auf idempotenten Merge geliftet (Review-Follow-up).
- `scripts/seed-data/characters.json` +26: Belisarius Cawl als NEUER row (Brief-Erratum #3 widerlegte die Erst-Annahme „existiert schon"), Hadeya Etsul (Steel-Tread/Demolisher-Cross-Batch), Aeronautica-Continuity (Lucille von Shard, Kile Simlex, Bree Jagdea), Watson-Retinue (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm) mit kompakter Marker-Konvention `notes: 'historical_canon_layer; Watson Inquisition-War Trilogy retinue'`, lore-iconic Singletons.
- Aliases: 17 Faction, 4 Location, 17 Character. Review-Follow-up entfernte zwei riskante Character-Aliases.

**Green-Tide-Collection-Gap-Ledger:** Neu `scripts/seed-data/collection-gaps.json` mit W40K-0147-Eintrag (Status `needs_constituent_roster_entries`, 4 bekannte existierende Constituents + 4 fehlende Short-Story-Constituents). Brief-Erratum #4 vollständig umgesetzt — kein partieller `work_collections`-Eintrag.

**Override-File-Korrekturen:** 13 unbekannte facetIds aus 015-Override gestrippt (`interplanetary`/`freedom`/`discovery`/`duty`/`early_release` — LLM-Typos gegen veralteten facet-catalog-Snapshot, `apply-override.ts:486-499` validiert dagegen und throwt bei Misses). Catachan-Devil-Referenz in Green-Tide-Override auf W40K-0118 korrigiert. `persons.json` +17 Author-Personen (Brief-061-Konvention).

**Counts-Tabelle (Pflicht, 072-Disziplin-Lesson eingehalten):**

| Phase | `work_factions` | `work_locations` | `work_characters` | `work_collections` |
|---|---|---|---|---|
| Pre-Apply | 650 | 239 | 475 | 35 |
| Per-Batch 011 | 697 | 257 | 492 | 35 |
| Per-Batch 012 | 733 | 265 | 494 | 35 |
| Per-Batch 013 | 786 | 274 | 498 | 35 |
| Per-Batch 014 | 843 | 280 | 508 | 35 |
| Per-Batch 015 | 912 | 287 | 522 | 35 |
| Post-Re-Apply 001..015 (total) | 912 | 287 | 522 | 35 |

Coverage post-Apply: factions=912/1003 input = **90.9 %**, locations=287/342 = **83.9 %**, characters=522/677 = **77.1 %** direct match.

**Brief-Erst-Annahme-Korrektur:** Brief sagte „150 W40K-Bücher applied" — Reality vor Apply waren 100 (Loop-Driver hatte 011..015 nur als Override-Files committed, nicht via `db:apply-override` in DB geschrieben). CC hat den Reality-Check gefangen; die 15× apply-override war gleichzeitig Drift-Cleanup für 001..010 UND First-Apply für 011..015. Effekt neutral.

**Verifikation:** Watson-Trilogy junction-spot-check: 49 Rows über `inquisitor-draco` + `harlequin` + `chaos-child` sauber resolved. Smoke-Slugs grün (`the-green-tide=6/1/0/0` wie erwartet wegen `roster.collections`-Lücke). Audit-Cockpit-SQL-Replica der vier Pillen: Post-Apply `0001..0100` `drift=72/gap=29/ssot=100/collections=8/drift_and_gap=21`; Post-Apply `0101..0150` `drift=34/gap=31/ssot=50/collections=0/drift_and_gap=22`. CLI: lint/typecheck/brain:lint/test:resolver (78 passed, war 51) alle pass.

**Helper-Scripts (NEU, alle committed):** `aggregate-surface-forms-074.ts`, `snapshot-counts-074.ts`, `audit-cockpit-replica-074.ts`, `smoke-slugs-074.ts`, `watson-trilogy-check.ts`, `strip-unknown-facets-074.ts`. One-shot-Operational-Tools analog 072's Pattern.

**Hand-off zur Vokabular-Hygiene-Session:** 9 Loop-Log-Tag-Kandidaten + 5 Catalog-LLM-Typos + 5 freq=1-Sororitas-Sub-Orders + 5 `data_conflict`-Author-Missing-Flags + Sub-Sub-Regiment-Tier-Liste. Cockpit-Quality-Feedback: Drift-Pille braucht freq-/confidence-Sort innerhalb der Liste.

**Pages touched (wiki):** keine direkt in 074-impl (Brief verbot Brain-Edits). Wiki-Hygiene-Pass 2026-05-15 (Folgeeintrag) hat das nachgezogen.

**Outside wiki:** `scripts/seed-data/{factions,locations,characters,faction-aliases,location-aliases,character-aliases,collection-gaps,manual-overrides-ssot-w40k-015,persons}.json`; `scripts/{seed-resolver-extensions,apply-override-dry,test-resolver-coverage,test-resolver-data-integrity,test-resolver}.ts` plus 6 neue Helper-Scripts; `sessions/archive/2026-05/2026-05-15-074-arch-resolver-batch-3.md` (status flip), `sessions/archive/2026-05/2026-05-15-074-impl-resolver-batch-3.md` (neu).

## 2026-05-15 · Cowork-Hygiene-Pass · Post-074-impl Wiki-Catch-up + CC-Direct-Curation-ADR

Cowork-only Brain-Update-Session, kein CC-Brief. Zwei Aufgaben gebündelt: (1) Session-End-Discipline für Brief 074-impl (project-state, open-questions, pipeline-state, sessions/README, index, log auf post-074-Stand), und (2) seit Brief 061 stehende offene Dokumentations-Schuld nachgezogen — ADR `decisions/why-cc-direct-curation.md` geschrieben, V2-LLM-Stage als de-facto ausgemustert formalisiert, OQ1 + OQ2-(c) endgültig moot markiert.

**ADR `decisions/why-cc-direct-curation.md` (NEU)** — kodifiziert: V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) wird seit Brief 061 (2026-05-11) durch eine `claude -p`-Subsession pro 10er-Batch ersetzt. Effektives Decision-Date = 2026-05-11, formal-ADR-Date = 2026-05-15. Vier Why-Argumente: Maintainer-Kontrolle load-bearing in der SSOT-Curation-Phase, kein separates Token-Budget (Maintainer-Claude-Allowance statt Anthropic-API-Key), Modell-Qualität höher (Opus default vs. Sonnet/Haiku der V2-Stage), Latenz drastisch niedriger (Lexicanum-Stage-1-Throttle entfällt). Fünf bewusste Trade-Offs dokumentiert. Fünf Revisit-Trigger formuliert.

**`project-state.md`** — Phase-Paragraph auf „dritte 50er-Welle gemerged + applied, Resolver-Pass 3 geschlossen" umgestellt; 150-Bücher-Pre-074-Mythos korrigiert (Reality: 100 vor 074-impl, 150 erst durch dessen `db:apply-override`-Sequenz); neue Junction-Counts 912/287/522/35 + Coverage 90.9/83.9/77.1; Reference-Counts factions=126 / locations=132 / characters=129 + persons=31. Neue „Latest pipeline state (post-074)"-Sektion mit Watson-Trilogy-Detail, Audit-Cockpit-Tour, Hand-off-Material. What's-open komplett neu sortiert. Recently-shipped: Wiki-Hygiene-Pass + 074-impl + 074-arch + 071-impl. Next-likely-brief auf drei realistische Maintainer-Optionen reduziert.

**`pipeline-state.md`** — Banner-Hinweis im V2-Pipeline-Section-Header und Top-Banner mit Verweis auf den neuen ADR. Resolver-layer-Sektion komplett aktualisiert. What's-next-Liste auf 19 Items + „Closed/superseded"-Sektion.

**`open-questions.md`** — Migration-History-Note um Wiki-Hygiene-Pass-Block ergänzt. OQ1 als „closed 2026-05-13 (Sonnet) und superseded 2026-05-15 (CC-Direct-Curation)" umformuliert. OQ2 als „closed/moot 2026-05-15" konsolidiert; OQ2-(c) verweist auf `deferred-questions.md`. Sources + related erweitert.

**`index.md`** — Updated-Dates auf 2026-05-15. Neue ADR-Row für `decisions/why-cc-direct-curation.md` zwischen faction-policy und why-sonnet-not-haiku. `why-sonnet-not-haiku.md`-Beschreibung um „historisches Artefakt + Reaktivierungs-Sicherung"-Note ergänzt. Frontmatter `updated: 2026-05-15`.

**`sessions/README.md`** — Active-Threads-Tabelle auf post-074-impl-Stand reduziert (074-impl + 074-arch + 071-impl + 071-arch + 061-arch standing). Maintainer-Bedienung-Satz auf drei Optionen umgestellt.

**Pages touched (wiki):** `project-state.md`, `open-questions.md`, `pipeline-state.md`, `index.md`, `decisions/why-cc-direct-curation.md` (NEU), this `log.md`.

**Outside wiki:** `sessions/README.md`.

**Out of scope dieser Hygiene-Session:** Keine Code-Änderungen. Keine Schema-Touches. Kein CC-Brief. Keine session-archive-Moves (separater Cleanup-Pass falls Maintainer einleitet). Kein `brain:lint --no-write`-Run durch Cowork (Sandbox kann es nicht zuverlässig).

---

## 2026-05-15 · Architect · Brief 075 Cockpit-Refinement + OQ6 Hardcover-Rating

Cowork-Brief mit Erratum-Block post-Codex-Review (vier Punkte vor dem regulären Body): `--env-file=.env.local`-Konvention für DB-Scripts, W40K-SSOT-eng Scope-Filter (`works.source_kind='ssot' AND works.external_book_id LIKE 'W40K-%' AND works.kind='book'`) — nicht „alle `bookDetails.rating IS NULL`", `no_author`-Miss-Bucket für Anthologien/Editor-only-Bücher (kein `discoverHardcoverClaimV2`-Call ohne Author-Hint, weil `hits[0]`-Fallback ungeguarded ist), DetailPanel-Surface auf `/buch/[slug]` Public-Page (nicht `/buecher`-Audit-Inline — dort rendert die Page bereits `containedIn` in Row-Details). Brief bewusst klein gehalten (zwei orthogonale Tracks, Sicherheitsventil für Track B explizit, beide Tracks landen in eigenen Commits). Design-freedom-Sektion delegiert visuelle Sprache, Animation, oklch-Tokens, Klassen-Shapes vollständig an CC.

**Pages touched:** `sessions/archive/2026-05/2026-05-15-075-arch-cockpit-drift-sort-and-rating.md` (NEU), `sessions/README.md` (Active-Threads-Update mit Maintainer-Bedienung-Satz inkl. Codex-Review-Erratum-Hinweis).

---

## 2026-05-15 · Implementer · Brief 075-impl Cockpit-Drift-Sort + Hardcover-Rating-Backfill (Commits `61d4ff5` / `e0c7575` / `7f3f14f`)

Beide Tracks gelandet. **Track A — Cockpit:** `src/app/buecher/page.tsx` trägt `CatalogueAudit.driftCount` parallel zu `hasResolvedDrift`-Helper (kein zweiter DB-Read); `sortBooks(auditFilters)` rangiert bei aktivem `?audit=drift` per `(driftCount desc, Number(audit.confidence ?? "0") desc, updatedAt desc, externalBookId localeCompare asc)`. `SortPills.overriddenByDrift`-Prop schaltet Label auf „Sortieren (Audit überschreibt)". Mikro-Caption „Sortiert nach Drift-Frequenz · Confidence · zuletzt aktualisiert." (server-rendered, nur bei aktivem `drift`-Filter mit Treffern). `src/app/buch/[slug]/page.tsx` zieht 7. parallele Promise für `containedIn` aus `work_collections JOIN works` (displayOrder/title-sortiert) und rendert slim Komma-Zeile unter Meta-Strip (`font-mono text-xs text-frost-400`, Collection-Titel als Next-`<Link>`, kein `displayOrder`/`confidence`/`basis` — Public-Lean gewahrt). Smoke-Skript `scripts/smoke-drift-sort-075.ts` als persistente SQL-Replica der neuen Sort-Branch committed.

**Track B — Daten:** `scripts/backfill-hardcover-rating.ts` als Standalone Drizzle-Script. `parseArgs` strict mit `--force` / `--limit` / `--help`. Default-Modus `and(eq(sourceKind,'ssot'), like(externalBookId,'W40K-%'), eq(kind,'book'), isNull(rating))`; `--force` droppt nur den `isNull`-Teil, bleibt im SSOT-W40K-Scope. Zwei Drizzle-Reads (target-works + author-map via `workPersons INNER JOIN persons WHERE role='author'`, niedrigster `displayOrder`). `no_author`-Bucket für Rows mit leerem `primaryAuthor` (kein `discoverHardcoverClaimV2`-Call). `discoverHardcoverClaimV2` bekommt 3. Parameter `opts: HardcoverDiscoveryV2Options = {}`; neuer `HardcoverRatingsCountField`-Typ, dynamisches `buildSearchQuery(extraField)`-Helper, parst `claim.raw.audit.ratingCount` wenn `typeof === 'number'`. Probe `users_count` vor `ratings_count` — `users_count` ist supported, kein Fallback nötig. `isUnknownFieldError(message, fieldName)` detection-helper für GraphQL-Schema-Fehlerpfade. Persistenz via `db.insert(bookDetails).onConflictDoUpdate({...})`; `rating` als `clampRating(value).toFixed(2)` (numeric(3,2)-safe), `ratingCount` bei Probe-Erfolg überschrieben, sonst `sql\`${bookDetails.ratingCount}\`` preserved. `getCircuitBreakerReason()`-Check nach jedem Fail → loud-exit(1) bei Trip. `package.json` trägt `"backfill:hardcover-rating": "tsx --env-file=.env.local scripts/backfill-hardcover-rating.ts"`.

**Verification:** `npm run typecheck` + `npm run lint` grün (1 pre-existing layout.tsx Warning, nicht 075-eingeführt). Track-A-Smoke (Top-20 via SQL-Replica) bestätigt 19 Bücher auf `drift_count=2 / confidence=1.00` (flat, durch `updatedAt DESC` differenziert) und Rang 20 auf `drift_count=1` (Drop unter freq=2-Gruppe). Track-B Live-Run: 73 Hits / 74 Misses in Pass 1 (49.7 %), 2. idempotenter Pass + 1 weiterer Hit (5 transiente `graphql_error` aus Pass 1 alle aufgelöst), `--force`-Smoke auf W40K-0001 verifiziert Overwrite. **Endstand: 77/150 W40K-SSOT-Bücher (51.3 %) mit `rating + ratingSource='hardcover' + ratingCount`.** 73 NULL: 14 `no_author` (5 Sabbat-Anthologien + 5 weitere Editor-only + 4 Roster-Pflege-Lücken inkl. `W40K-0144 Archmagos` — Justin D Hill, kein `work_persons role='author'`), 40 `null_result_zero_hits` (Hardcover `_eq` Titel-Mismatch), 19 `author_mismatch`, 0 `graphql_error`.

**For-next-session-Punkte:** (1) OQ-Promote-Trigger gefeuert (51.3 % < 70 %), aber 075-impl-Argumentation präferiert **Titel-Normalisierungs-Layer** über OL-Fallback (Miss-Profile sind Normalisierungs-Probleme, nicht Coverage-Lücken); (2) `no_author`-Audit der 14 Bücher (Maintainer-Excel-Workflow); (3) Drift-Sort-Sub-Sortierung innerhalb freq=2-Tie-Group (19/20 Top-Drift flat); (4) DetailPanel-Pattern-Erweiterung (Series-Info, Collection-Count); (5) `users_count` als deterministisch erreichbar geklärt — Architektur-Punkt für ggf. reaktivierte V2-LLM-Stage; (6) Brain-Hygiene-Post-Merge.

**Pages touched (CC):** `src/app/buecher/page.tsx`, `src/app/buecher/SortPills.tsx`, `src/app/buch/[slug]/page.tsx`, `src/app/globals.css`, `scripts/smoke-drift-sort-075.ts` (NEU), `scripts/backfill-hardcover-rating.ts` (NEU), `src/lib/ingestion/v2/sources/hardcover.ts`, `package.json`, `sessions/archive/2026-05/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md` (NEU).

---

## 2026-05-16 · Cowork-Hygiene-Pass · Post-075-impl Wiki-Catch-up

Cowork-only Brain-Update-Session, kein CC-Brief. Standard Session-End-Discipline für Brief 075-impl (project-state, open-questions, log, index, sessions/README auf post-075-Stand).

**`open-questions.md`** — Frontmatter `updated: 2026-05-16` + neuer Migration-History-Block. OQ6 entrückt von strikethrough-Anker auf Final-Closed-Form (Hit-Rate / Bucket-Counts dokumentiert, kein Detail-Body mehr). Neue OQ (10) „Hardcover-Hit-Rate-Härtung (Titel-Normalisierung)" mit Owner/Sessions/Follow-up-brief-Metadaten + drei Architektur-Calls (Normalisierungs-Strategie / Confidence-Tie-Break / Persistenz-Audit) + Note auf laufende Cockpit-Sub-Sortierung. Sources um 075-arch + 075-impl erweitert.

**`project-state.md`** — Frontmatter `updated: 2026-05-16`, Sources um 075-arch + 075-impl erweitert. Phase-Paragraph auf „Cockpit-Drift-Sort + Hardcover-Rating-Backfill gelandet" umgestellt; Sequenz-Paragraph um Brief-075-Beschreibung verlängert (Track A + Track B mit Commit-Hashes). Branch-Block auf Post-075-Commits aktualisiert. What's running: `/buch/[slug]` + `/buecher` mit den 075-Refinements annotiert, `book_details.rating` post-075 mit Coverage-Note (77/150). Neue „Latest pipeline state (post-075)"-Sektion vor dem post-074-Block: Track A (driftCount-Compute, sortBooks-Kaskade, SortPills-Affordance, slim Komma-Zeile auf Public) und Track B (Standalone-Script, opts.ratingsCountField-Probe, no_author-Bucket, onConflictDoUpdate-Persistenz, Endstand-Counts) inkl. 075-impl-Architektur-Punkt zu `users_count` für ggf. reaktivierte V2-Stage. What's-open komplett neu sortiert (Loop-Re-Trigger zuerst, dann Hit-Rate-Härtung, Cockpit-Sub-Sortierung, OQ3-Hand-Check, Public-Rating-Render, Collection-Gap, no_author-Roster-Hygiene, Loop-Driver-Refinements, Vokabular-Hygiene). Recently-shipped: drei neue Zeilen (Wiki-Hygiene 2026-05-16, 075-impl + PR merge, 075-arch). Next-likely-brief auf „kein neuer Brief — Loop-Re-Trigger + Resolver-Pass-4 als natürliche Sequenz" plus zwei sekundäre Optionen reduziert.

**`log.md`** — Drei Blöcke ans Ende: 075-arch, 075-impl, dieser Hygiene-Pass.

**`index.md`** — Updated-Dates auf 2026-05-16 für open-questions + project-state.

**`sessions/README.md`** — Active-Threads-Tabelle: 075-Zeile auf „implemented + merged" (Commits eingetragen); Maintainer-Bedienung-Satz auf post-075-Stand umformuliert (Loop-Re-Trigger für `ssot-w40k-016..020` als nächster Schritt).

**Pages touched (wiki):** `open-questions.md`, `project-state.md`, `index.md`, this `log.md`.

**Outside wiki:** `sessions/README.md`.

**Out of scope dieser Hygiene-Session:** Keine Code-Änderungen. Keine Schema-Touches. Kein CC-Brief. Keine session-archive-Moves (separater Cleanup-Pass falls Maintainer einleitet). Kein `brain:lint --no-write`-Run durch Cowork (Sandbox kann es nicht zuverlässig). Kein ADR-Stub `decisions/why-no-ol-fallback-yet.md` — 075-impl-Punkt 6 hat das vorgeschlagen, aber die Story lebt sauberer in OQ (10) als architektonischer Promote-Trigger statt als ADR (eine OL-Fallback-Entscheidung wurde nicht *getroffen*, nur deferred-pro-Hit-Rate-Härtung).

## 2026-05-16 · Correction · SSOT-loop resume command

Codex-Review der Post-075-Hygiene hat einen Bedienungs-Widerspruch gefunden: `sessions/README.md` und `project-state.md` sagten für den nächsten 50er-Driver-Lauf `bash scripts/run-ssot-loop.sh 5` ohne Skip-Marker, obwohl `sessions/ssot-loop-log.md` auf `cumulativeBefore = 150` steht und der Driver selbst `--skip-initial-resolver-pause` genau für diesen Fall dokumentiert. Ohne Flag würde der Lauf sofort nur einen weiteren 150er-Pause-Block produzieren und keine `ssot-w40k-016`-Datei schreiben.

**Korrektur:** Der nächste operative Driver-Lauf ist `bash scripts/run-ssot-loop.sh 5 --skip-initial-resolver-pause`. Das Flag injiziert `skip-50-stop` nur in die erste Subsession, also nur für `ssot-w40k-016`; Iterationen 017–020 laufen unmarkiert. Wenn der Lauf bei kumulativ 200 landet, startet der Driver laut Skriptlogik automatisch eine ungeskippte Pause-Probe, sodass der 200er-Resolver-Pause-Block committed wird.

**Pages touched:** `project-state.md` (Next-likely-brief, What's-open, What's-running und operative Step-Form), `pipeline-state.md` (updated 2026-05-16 + sources + next-axis Items 12–14), `index.md` (Katalogzeilen project-state/pipeline-state), `sessions/README.md` (Maintainer-Bedienung + 061-Zeile), this `log.md`.

## 2026-05-17 · Review · 077-impl Grand-Alignment-Junction-Hygiene accepted

Cowork-Review von [`sessions/archive/2026-05/2026-05-16-077-impl-grand-alignment-junction-hygiene.md`](../../sessions/archive/2026-05/2026-05-16-077-impl-grand-alignment-junction-hygiene.md). Verdict: **accept, ohne Rework-Anforderungen.** Implementation passt Acceptance-Bullet-für-Bullet zum Brief.

**Spot-checks (read-only):**

- `scripts/seed-data/faction-policy.json` trägt `"redundantWhenSubPresent": ["imperium", "chaos"]` als neues Top-Level-Feld.
- `scripts/seed-data/factions.json` `imperium`-Row trägt explizit `"alignment": "imperium"` (Erratum-3 Option A).
- `src/lib/seed/alignment.ts` neu (`Alignment`-Type + `inferAlignmentFromTree` + `normalizeAlignment`); `scripts/seed-resolver-extensions.ts` importiert von dort (Erratum-3 Option B — Belt-and-Suspenders gegenüber Constraint-Wording, defensive Wahl, akzeptiert).
- `scripts/apply-override-skip.ts` pure helper mit DI-Signatur, Drei-Bedingungen-Skip aus Brief § Constraints korrekt implementiert.
- `scripts/apply-override.ts` `loadSkipContext()` mit Startup-Validation (Throw wenn `redundantWhenSubPresent`-ID nicht in `factions.json` ODER `alignment === "neutral"`). `applyBook` reordered: Faction-Resolution + `decideFactionSkips()` laufen vor `buildSurfaceFormsBlock`, `keepFactions` füttert das DELETE-then-INSERT-Write.
- `sessions/2026-05-11-061-arch-ssot-loop.md` trägt neuen `Faction-Granularity-Discipline (ab ssot-w40k-021)`-Block direkt nach dem Public-Synopsis-Block (Pattern analog Mini-Phase 5 aus 076). `scripts/run-ssot-loop.sh` heredoc-Append reicht die Discipline an jede Loop-Subsession durch.
- `brain/wiki/decisions/faction-policy.md` neue Sektion „Grand-Alignment-Junction-Skip" mit Skip-Liste-Location, Drei-Bedingungen-Regel, Audit-Bucket-Location, Semantik-Anmerkung (Alignment-Equality funktioniert nur für imperium/chaos weil dort alignment = tree-root), Backfill-Path, Forward-Discipline. Neuer Revisit-Trigger für Aeldari-Sub-Splits-Aktivierung (mit explizitem Hinweis: vor `eldar`-Aufnahme in `redundantWhenSubPresent` muss `decideFactionSkips` auf Parent-Chain umgestellt werden, weil `tau`/`eldar` beide `xenos` sind aber Tau kein Eldar-Sub ist). Frontmatter `updated: 2026-05-16` + sources um Brief 077 + die zwei neuen Scripts erweitert.
- Tests: 6 neue Cases in `scripts/test-resolver.ts` für `decideFactionSkips` (Skip-fires, Skip-fires-nicht-bei-no-sub, both-skip-mixed-block, multi-alias-audit-trail, …). 122/0 grün.

**Counts-Tabelle aus dem 077-Report bestätigt** (alle anderen Axes invariant — erwartet):

| Metrik | Pre (post-076) | Post (post-077) | Delta |
|---|---:|---:|---:|
| `work_factions` | 1185 | 1020 | **−165** |
| `work_factions(imperium\|chaos)` | 214 | 49 | **−165** |
| `work_factions(imperium)` | 81 | 6 | −75 |
| `work_factions(chaos)` | 133 | 43 | −90 |

Residual 49 (`imperium=6` / `chaos=43`) sind Bücher ohne alignment-gleiche Sub-Faction im Override — Erhaltungs-Pfad, gewollt.

**Decisions-I-Made-Audit:**

- *factions.json-Patch UND Helper-Extract gleichzeitig:* Brief Constraint § 2 ließ beides offen, Cowork-Empfehlung war Option A (JSON-Patch). CC hat A+B gewählt — defensive Belt-and-Suspenders. Akzeptiert ohne Rework, weil die explizite Row keine Konsistenz-Risiken trägt und die Helper-Extract die Doppel-Pflege beendet.
- *Pure Skip-Helper in eigener File:* Brief verlangte Skip-Logik im Apply-Layer; CC hat den reinen Entscheidungs-Teil weiter herausgezogen, damit `test-resolver.ts` ohne DB-Client-Side-Effects darauf testen kann. Akzeptiert mit Lob für DI-Signatur.
- *Skip-Bucket als Bare-String-Array:* Brief-Beispiel zeigte Bare-Strings, existierende Buckets in `buildSurfaceFormsBlock` tragen `{name,role}`-Objects. CC hat Brief-Treue gewählt. Akzeptiert — die Audit-Semantik braucht keine Role.
- *Dry-Run + Coverage-Test mitziehen:* Brief Notes § 5 hat das explizit erlaubt. Akzeptiert; das `(post-Brief-077-skip, 165 grand-alignment surface forms suppressed)`-Tail im Coverage-Output ist eine saubere Spur.
- *Smoke-Probe-Logik präzisiert:* CC hat erst hart auf „keine imperium/chaos-Junction" gepruft (4/6 FAIL) und dann auf alignment-aware umgestellt (6/6 OK). Korrekte Brief-Lesung — Acceptance bullet sagt explizit „sofern alignment-gleiche Sub-Tags da sind".
- *Branch-Strategie:* 077 sitzt auf 076-Tip statt `main` — korrekt, weil 077 logisch auf den 076-Apply-Stand aufsetzt und die Post-076-Counts als Baseline braucht. Maintainer-Sequenz: 076 mergen → 077 rebasen/mergen → Wiki-Hygiene-Pass.

**For-next-session-Items aus 077-impl gehandhabt:**

- (1) Locations-Axis-Hygiene-Sister-Pass (Imperium x20 als unresolved Location) → **neue OQ (11)** in [`./open-questions.md`](./open-questions.md) mit drei Architektur-Calls (Policy-File-Form, Skip-Bedingung Tree-Membership-vs-Allowlist, HH-Domain).
- (2) HH-Domain Pre-Heresy `alpha_legion` Cabal-Twist → CC hat den Hinweis nicht in `faction-policy.md` § Revisit-Trigger eingearbeitet (HH ist Brief-070-Out-of-Scope-Position). Bleibt bis HH-Domain aktiv wird in der Air; Note hier statt OQ (kein konkreter Architektur-Call nötig).
- (3) + (4) `smoke-slugs-077.ts` als CI-Smoke + `test:resolver-coverage` Two-Line-Output → Note an existierende „laufende Cockpit-Refinements"-Sektion unter OQ (10) gehängt. Keine eigene OQ.
- (5) `brain:lint` Size-Budget-Warning auf `faction-policy.md` (108/100) → tolerable für jetzt, Refactor-Move nach `pipeline-state.md` lohnt erst wenn weitere Sektionen dazukommen. Kein OQ.

**Out of scope dieser Review-Session:**

- **Voller Wiki-Hygiene-Pass post-076 + post-077.** `project-state.md` / `pipeline-state.md` zeigen noch die Post-074-Counts (`work_factions=912`, 150 Bücher); die Wahrheit ist Post-077 (`work_factions=1020`, 200 Bücher). Per Maintainer-Tagline in `sessions/README.md` geplant für nach den 076/077-Merges, in einer eigenen Cowork-Session. Hier nur die Delta-Stelle eingehen, die Open-Questions-Pflege braucht.
- **Session-Archive-Moves.** Keine. 077-Pair bleibt in Active-Threads bis 076 → 077 → Wiki-Hygiene-Pass durchgespielt sind.
- **`brain:lint --no-write`-Run durch Cowork.** Sandbox-unzuverlässig — bleibt Maintainer-/CC-Aufgabe.
- **PR-Aktionen.** Cowork mergt nicht; Maintainer-Sequenz steht im README-Tagline.

**Pages touched (wiki):** `open-questions.md` (Frontmatter `updated: 2026-05-17` + neuer Review-Hygiene-Block, neue OQ (11) Locations-Axis-Hygiene, Note an existierender Cockpit-Refinement-Sektion erweitert um 077-impl-Items 3-4), this `log.md`.

**Outside wiki:** keine (`sessions/README.md`-Active-Threads-Tabelle ist schon korrekt — 077-Zeilen wurden von CC bereits eingetragen, Maintainer-Tagline sagt schon „077 implementiert").

---

## 2026-05-17 · Cowork-Hygiene-Pass · Post-076-impl + post-077-impl Wiki-Catch-up

Voller Wiki-Hygiene-Pass für die zwei zusammenhängenden Sessions 076 (axis-sliced Resolver-Pass 4, PR #62 gemerged) + 077 (Grand-Alignment-Junction-Hygiene, PR-ready). Anlass: in der vorigen Cowork-Review-Session (077-impl-Accept) war der volle Pass bewusst out-of-scope geparkt — `project-state.md` / `pipeline-state.md` zeigten noch Post-074-Counts (`work_factions=912`, 150 Bücher), Wahrheit ist jetzt Post-077 (`work_factions=1020`, 200 Bücher). Per Cowork-Scope-Wahl: Core-Hygiene (keine neue ADR `why-axis-sliced-resolver`, keine Glossar-Erweiterung, kein Archive-Move — auf separater `brain/hygiene-post-076-077`-Branch).

**Read:**

- [`sessions/archive/2026-05/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md`](../../sessions/archive/2026-05/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md) (Brief; nur Anker-Lesung — Detail-Pflege der Acceptance-Bullets lebt im Impl-Report)
- [`sessions/archive/2026-05/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md`](../../sessions/archive/2026-05/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md) (Impl-Report end-to-end inkl. zwei Review-Fix-Sektionen, Counts-Tabelle, Driver-Decisions, Mini-Phase 5)
- [`sessions/archive/2026-05/2026-05-16-077-arch-grand-alignment-junction-hygiene.md`](../../sessions/archive/2026-05/2026-05-16-077-arch-grand-alignment-junction-hygiene.md) (Brief inkl. Codex-Erratum-Block, schon in der vorherigen Review-Session gelesen — hier nur als Quellen-Anker)
- [`sessions/archive/2026-05/2026-05-16-077-impl-grand-alignment-junction-hygiene.md`](../../sessions/archive/2026-05/2026-05-16-077-impl-grand-alignment-junction-hygiene.md) (Impl-Report end-to-end inkl. Counts-Probe + Smoke + 5 For-next-session-Items, ebenfalls schon in der Review-Session gelesen)

**Updated wiki:**

- [`./project-state.md`](./project-state.md) — Frontmatter `updated: 2026-05-17` + Sources um 076-/077-Pair + `scripts/run-resolver-pass.sh` + `scripts/apply-override-skip.ts` + `src/lib/seed/alignment.ts` erweitert. Phase-Block auf „vierte 50er-Welle axis-sliced gemerged + applied, Grand-Alignment-Junction-Hygiene implementiert" gehoben; Sequenz-Paragraph um 075/076/077 ergänzt mit Counts-Story (`work_factions=1185 → 1020 (−165)`, `imperium 81 → 6`, `chaos 133 → 43`). Buch-Domain-Bild auf **200 W40K-Bücher** + post-077-Counts gehoben (Coverage: `factions=1020/1301 = 78.4 %` mit Skip-Anwendung, Sidecar-Metrik `165 grand-alignment surface forms suppressed`; `locations=417/493 = 84.6 %`, `characters=633/811 = 78.1 %`; `work_collections=56`). Branch-Sektion auf `origin/main` HEAD = `cfb0957` (PR #62 Brief 076) plus 077 als PR-ready auf `session-077-grand-alignment-junction-hygiene` umgeschrieben. „What's running" — Reference-Seeds-Counts (factions 126 → 146, locations 132 → 157, characters 129 → 169), Alias-Counts (faction 36 unverändert, location 11 → 13, character 23 → 26), neue Bullets für Loop-Driver-Trigger-Heredoc-Disciplines (Public-Synopsis aus 076 + Faction-Granularity aus 077) und Resolver-Driver `scripts/run-resolver-pass.sh` als Deliverable. Faction-Policy-Bullet um den `redundantWhenSubPresent`-Skip + `factions.json`-`imperium`-`alignment`-Patch + `src/lib/seed/alignment.ts`-Shared-Util erweitert. **Zwei neue „Latest pipeline state"-Sektionen** vor der Post-075-Sektion: (a) post-077 dokumentiert den Skip-Helper + Alignment-Util + Drei-Bedingungen-Skip + Audit-Bucket + Counts-Delta + alignment-aware Smoke-Per-Slug-Tabelle + Loop-Discipline + ADR-Update + die fünf For-next-session-Items aus 077-impl; (b) post-076 dokumentiert das axis-sliced Phasen-Workflow (5 Subsessions + Mini-Phase 5) + die Cross-Batch-Alias-Consolidation-Decisions + Reference-Schicht-Wachstum + Counts post-Re-Apply 001..020 (pre-Skip Basislinie 1185/417/633/56) + Cockpit-SQL-Replica + Driver-Deliverable mit allen Design-Choices (CLI-Form `claude -p`, JSON-Config, Halt-Check-Matrix Set-Subset + JSON-valid + `## Needs decision`, Bash-Glob-Patterns für Phase-4-Template, PR-Idempotenz via `gh pr list --head`, Branch-Konvention, no-op-Vertragsknick konservativ ausgeschlossen). „What's open" komplett neu sortiert post-077: Loop-Re-Trigger `021..025` als erstes (kein Skip-Flag mehr — 200er-Pause durch 076 abgearbeitet, beide Disciplines im Trigger-Heredoc verankert), OQ (11) Locations-Axis-Hygiene-Sister-Pass als zweites (mit drei Architektur-Calls), OQ (10) als drittes (mit 077-Folge-Note für die 50 neuen Welle-4-Bücher ohne Rating), Cockpit-Refinements-Note (075-impl + 077-impl Items 3-4), OQ3, Public-Page-Rating-Render, Collection-Gap-Resolve Green Tide, `no_author`-Roster-Hygiene, `run-ssot-loop.sh`-Refinements, Vokabular-Hygiene (jetzt +076-Material), Resolver-Driver-Smoke (Pass 5+). „Recently shipped" — neuer Wiki-Hygiene-2026-05-17-Eintrag oben, plus 076-arch/impl + 077-arch/impl als gemerged/PR-ready dokumentiert; Vorherige Wiki-Hygiene-2026-05-16-Zeile unverändert. „Next likely brief" — kein neuer Brief, Maintainer-Reihenfolge **077 mergen → Wiki-Hygiene-PR mergen → Loop-Re-Trigger `bash scripts/run-ssot-loop.sh 5`** für `ssot-w40k-021..025` (kein Skip-Flag), 250er-Pause als nächstes Stop, dann Resolver-Pass-5-Brief; sekundäre Optionen OQ (11) Locations-Sister, OQ (10) Hit-Rate-Härtung, Cockpit-Sub-Sortierung + Public-Rating-Render-Doppelpack.
- [`./pipeline-state.md`](./pipeline-state.md) — Frontmatter `updated: 2026-05-17` + Sources um 076-/077-Pair + `scripts/run-resolver-pass.sh` + `scripts/resolver-pass.config.json` + `scripts/apply-override-skip.ts` + `src/lib/seed/alignment.ts` erweitert. Header von „post-074-impl" auf „post-077-impl" gehoben. Status-Banner um Pass 4 (axis-sliced) + Brief 077 Skip-Logik + Counts post-077-Re-Apply 001..020 (`work_factions=1020`, `work_locations=417`, `work_characters=633`, `work_collections=56` über 200 Bücher) erweitert. § Resolver layer (post-063 through 077-impl) — Counts-Pflege (146/157/169 reference, Alias-Counts), Apply-Override-Beschreibung erweitert um `loadSkipContext()` + `decideFactionSkips()` + `factionsSkippedRedundant`-Bucket + Counts-Story (Pre-Skip 1185 → Post-Skip 1020 = −165), Tests-Counts (122 post-077, war 116 prä-077). Neue Pass-4-Konvention-Sektion (axis-sliced Phasen-Workflow, resolver-dossiers, Aggregator-Helper, Cross-Batch-Alias-Consolidation-Pattern, Driver-Deliverable mit Halt-Check-Matrix) plus neue Pass-Hygiene-Konvention-Sektion (Skip-Liste Policy-driven, Drei-Bedingungen, Alignment-Equality-vs-Parent-Chain für künftige xenos-Splits, Revisit-Trigger in `faction-policy.md`). Watson-Trilogy-Konvention bleibt; 076-Hand-off-Material zur Vokabular-Hygiene ergänzt (4 facet-Values + Necromunda-Cluster). § What's next on the pipeline axis — Items 12–14 + 15 als ✅ markiert (075 + Loop-016..020 + 076 + 077), Items 16–22 als künftige Arbeit definiert (Loop-021..025 ohne Skip-Flag, Resolver-Pass 5, OQ (11) Locations-Sister, OQ (10) Hit-Rate-Härtung, Cockpit-Sub-Sortierung-Doppelpack, OQ3, Collection-Gap-Resolve, 3e Voll-Apply, Refresh-Layer, 3f Maintenance-Crawler).
- [`./open-questions.md`](./open-questions.md) — Frontmatter `updated: 2026-05-17` blieb (war schon korrekt von der Review-Session); neuer Header-Kommentar `# 2026-05-17 (Wiki-Hygiene-Pass post-076-impl + post-077-impl)` oben angefügt mit Erläuterung, dass die Hygiene-Session ausgelöst durch 076 + 077 ist, keine zusätzliche OQ-Schließung (OQ (11) bleibt promoted), Restqueue-Übersicht. Migration-history-Paragraph um Brief 076 (PR #62 gemerged, axis-sliced, Counts) + Brief 077 (PR-ready, Skip-Logik, −165 Counts-Delta, OQ (11) promoted) erweitert. Sources-Frontmatter um 076-/077-Pair erweitert. OQ (11) Locations-Axis-Hygiene-Sister-Pass bleibt unverändert (von der Review-Session präzise eingetragen).
- [`./index.md`](./index.md) — `updated: 2026-05-17` Frontmatter + Catalog-Zeilen für project-state.md (auf 2026-05-17 + Description neu — 200 Bücher applied, post-077 Skip-Counts) und pipeline-state.md (auf 2026-05-17 + Description neu — Resolver-Layer auf 200 Bücher + post-077 Junction-Counts + axis-sliced + Skip-Logik + Resolver-Dossiers + Driver-Deliverable). Open-Questions-Description auf 2026-05-17-Stand (OQ (11) promoted, Restqueue). Decisions-Zeile `faction-policy.md` — Description-Addendum um implementierten 077-Stand (Skip-Helper, Alignment-Util, Audit-Bucket, Backfill-Counts, Revisit-Trigger für Aeldari) erweitert; updated-Date bleibt 2026-05-16 (so steht es in der Datei-Frontmatter, die durch 077-impl gesetzt wurde). Log + Catalog-self-row auf 2026-05-17.
- This `log.md` — Append-only-Eintrag (Sie lesen ihn gerade).

**No new decisions:** core scope per Cowork-/User-Wahl ausschließt eine neue ADR `why-axis-sliced-resolver.md` (076-impl-Hand-off-Vorschlag); falls künftiger Pass-5-Driver-Smoke-Run zeigt, dass der axis-sliced Workflow als Pattern stabil bleibt, kann sie nachträglich gezogen werden. Grand-Alignment-Junction-Skip ist in `decisions/faction-policy.md` § „Grand-Alignment-Junction-Skip" schon durch 077-impl kodifiziert (Sektion + Revisit-Trigger für Aeldari-Sub-Splits dokumentiert).

**Glossar-Erweiterung deferred:** Begriffe aus 076/077 (`factionsSkippedRedundant`, `redundantWhenSubPresent`, `axis-sliced resolver pass`, `resolver-dossier`, `resolver-driver`) wären legitime Glossar-Einträge, sind aber per Core-Hygiene-Scope nicht in diesem Pass. Falls die Begriffe in der nächsten Cowork-Session als „undefiniert" auffallen, dann nachziehen.

**Outside the wiki:**

- [`sessions/README.md`](../../sessions/README.md) — Active-Threads-Tabelle und Maintainer-Bedienung-Pointer auf Post-Wiki-Hygiene-Stand gebracht (Reihenfolge: 077 mergen → Wiki-Hygiene-PR mergen → Loop-Re-Trigger `021..025`).

**Outside the wiki / outside this session:**

- Keine Code-Änderungen, kein CC-Brief.
- Keine Session-Archive-Moves. 076 + 077 bleiben in Active-Threads bis nach Loop-Re-Trigger-021..025 (analog 074-Pair, das auch nach Brief 075 noch sichtbar blieb, bis der nächste Resolver-Brief 076 die Story weitertrug).
- Keine PR-Aktionen oder Branch-Merges durch Cowork — Maintainer-Aufgabe.

**Branch:** `brain/hygiene-post-076-077` (vom Tip von `session-077-grand-alignment-junction-hygiene` abgezweigt, weil die Hygiene-Updates auf den 077-Counts-Stand aufbauen — sobald 077 in `main` gemerged ist, kann die Hygiene-Branch direkt drauf rebased/gemerged werden).

## 2026-05-19 · Cowork-Hygiene-Pass · Post-079/080/081/082 Wiki-Catch-up (auf `codex/ingest-batches-synopsis-005-019` mit-eingearbeitet)

Wiki-Hygiene-Pass für die vier zusammenhängenden Sessions seit dem post-076/077-Pass (PR #64 `3b5c664`, 2026-05-17). Anlass: Brief 081 (Public-Synopsis-Backfill `ssot-w40k-005..019`) ist auf der lokalen Task-Branch `codex/ingest-batches-synopsis-005-019` im `chrono-lexicanum-batches`-Worktree abgeschlossen (16 Commits, alle 123 hit-bearing Bücher rewritten, Endstand alle 200 Public-Synopsen `001..020` synopsis-clean), aber **noch nicht gepusht und kein PR offen**. Maintainer-Wahl per `AskUserQuestion` (2026-05-19): Wiki-Hygiene-Diff direkt auf den 081-codex-Branch packen (statt separater `brain/hygiene-post-081`-Branch), Hygiene + Backfill teilen sich denselben PR. Begründung: 081 ist noch nicht gepusht, und der Branch ist die einzige Stelle, an der die 081-Quellen lückenlos sichtbar sind — ein separater Hygiene-Branch off `main` würde auf nicht-mergede Inhalte verweisen.

**Worktree-Mechanik:** Cowork-Mount ist `chrono-lexicanum` (Coordination/main-Worktree); der 081-Branch ist in `chrono-lexicanum-batches` checked out und für Cowork nicht direkt schreibbar. Praktischer Ablauf: Cowork edits in `chrono-lexicanum/brain/wiki/*` + `chrono-lexicanum/sessions/README.md`, Maintainer kopiert die Hygiene-Files (`project-state.md`, `open-questions.md`, `log.md`, `index.md`, `sessions/README.md`) in den Batches-Worktree und committet sie dort auf den codex-Branch.

**Read:**

- [`sessions/archive/2026-05/2026-05-17-079-impl-lab-cartographer-prototype.md`](../../sessions/archive/2026-05/2026-05-17-079-impl-lab-cartographer-prototype.md) — Direkt-Maintainer-Anweisung, kein paired Architect-Brief.
- [`sessions/archive/2026-05/2026-05-17-080-arch-synopsis-guard-and-pilot.md`](../../sessions/archive/2026-05/2026-05-17-080-arch-synopsis-guard-and-pilot.md) + [`sessions/archive/2026-05/2026-05-17-080-impl-synopsis-guard-and-pilot.md`](../../sessions/archive/2026-05/2026-05-17-080-impl-synopsis-guard-and-pilot.md) — Apply-Layer-Forward-Guard (Track B) + Pilot-Rewrite Batch 020 (Track A).
- `sessions/archive/2026-05/2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md` und `sessions/archive/2026-05/2026-05-18-081-impl-ssot-synopsis-backfill-005-019.md` — auf dem codex-Branch (via `git show codex/ingest-batches-synopsis-005-019:…` gelesen).
- [`sessions/archive/2026-05/2026-05-17-082-arch-parallel-worktrees.md`](../../sessions/archive/2026-05/2026-05-17-082-arch-parallel-worktrees.md) + [`sessions/archive/2026-05/2026-05-17-083-impl-parallel-worktrees.md`](../../sessions/archive/2026-05/2026-05-17-083-impl-parallel-worktrees.md) — drei produktive Worktrees + Disziplin in `CLAUDE.md` + `AGENTS.md`.

**Updated wiki:**

- [`./project-state.md`](./project-state.md) — Frontmatter `updated: 2026-05-19` + Sources um 079-impl + 080-arch/impl + 081-arch/impl + 082-arch/083-impl + `scripts/apply-override-synopsis-lint.ts` + `scripts/seed-data/synopsis-banned-patterns.json` erweitert. Header auf `# Project state — 2026-05-19`. Phase-Block-Sequenz-Paragraph um Brief 077-Merge-Reihenfolge (PR #65 + PR #64-Wiki-Hygiene), Brief 080 (PR #67 — Apply-Layer-Guard + Pilot-Rewrite 412–556 chars), Brief 081 (lokaler codex-Branch mit 16 Commits, noch nicht gepusht — 123 Bücher rewritten in `/clear`-Loop, Längen 502/605/783 chars, alle 200 Synopsen `001..020` clean), Brief 079 (PR #66 Lab-Cartographer-Prototype) und Brief 082 (PR #68 Parallel-Worktree-Bootstrap) erweitert. Buch-Domain-Bild um Synopsis-Cleanheit-Vermessung + Apply-Layer-Forward-Guard ergänzt. Branch-Sektion komplett umgeschrieben: `origin/main` HEAD = `f551a13` (PR #68 Brief 082), Merge-Reihenfolge seit der letzten Hygiene dokumentiert, Brief 081 als lokal/ungepusht markiert, Worktree-Layout dokumentiert (drei produktive + eine Altlast + ein archivierter), plus eigener Coordination-Worktree-Hinweis-Block für die ~150 Modified Files (`203 files / 134004 / 134004` = reine Line-Ending-Symmetrie, keine Substanz-Diffs). „What's running" um drei Pipeline-V2-Sätze ergänzt (`validateSynopses()`-Batch-Level-Pre-Pass + Banned-Pattern-File + Report-Only-Dry-Run-Variante), zwei neue Bullets: Parallel-Worktree-Konvention (082) + Lab-Cartographer-Prototype (079); Loop-Driver-Bullet um Apply-Layer-enforcement-Note (080) erweitert. **Neue „Latest pipeline state (post-080+081)"-Sektion** vor der Post-077-Sektion: dokumentiert Track-B-Guard-Architektur (32 Patterns + Pure-Helper-Shape + Batch-Level-Pre-Pass + DI-Signatur + Hard-Throw-Schema), Track-A-Pilot-Lengths/Voice-Notes, Brief-081-Loop-Mechanik (klein-zu-groß `005 → 019`, Detection per Loop-Log-`H2`-Marker, Touch-Set per Mini-tsx-Helper, ein Commit pro Iteration auf codex-Branch, Längen-Korridor 500-620 standalone / 620-750 omnibi / 420 floor / 800 cap), empirische Endstand-Vermessung (`502/605.3/783` post vs `505/1536.3/2458` pre, ~61 % Längen-Reduktion), Reader-Info-Erhaltungs-Konvention (Protagonist/Setting/Konflikt/Faction/Tonality + Period-treue Naming + Plot-Twists-Premise-Level-Kept), Verifikation am 019er-End (alle Tests grün, alle 200 Batches synopsis-clean), und Hand-off zur Drei-fach-Discipline ab `ssot-w40k-021` (Synopsis-Forward-Guard scharf im Apply-Layer + Faction-Granularity im Heredoc + Grand-Alignment-Skip im Apply-Layer). „What's open" um den neuen Top-Punkt „Push + PR + Merge für Brief 081" ergänzt (operationeller Mini-Schritt vor Loop-Re-Trigger); Loop-Re-Trigger-Bullet auf Drei-Discipline-Form gehoben + sequentielle Reihenfolge (NACH 081-Merge) klargestellt. „Recently shipped" um sieben neue Zeilen ergänzt (Wiki-Hygiene 2026-05-19 oben, 083-impl + PR #68 Merge, 082-arch, 081-impl/arch auf codex, 080-impl + PR #67 Merge, 080-arch, 079-impl + PR #66 Merge); Vorherige Wiki-Hygiene-2026-05-17-Zeile als „post-076/077"-Titel-Update mit PR-#64-Referenz präzisiert.
- [`./open-questions.md`](./open-questions.md) — Frontmatter `updated: 2026-05-19` + neuer Header-Kommentar oben mit Erläuterung der vier-Sessions-Wave (079/080/081/082), Begründung „keine OQ-Schließung und keine neue OQ" (079 = Side-Phase Cartographer, 080 = Pipeline-Gap-Close ohne offenen Architektur-Call, 081 = Backfill-Hand-off ausschließlich operationell, 082 = Workspace-Convention mit deferred workflow-page) + neuer operationeller Push-+-PR-+-Merge-Punkt für Brief 081. Sources-Frontmatter um 079/080/081/082-Sessions erweitert. Migration-history-Paragraph im Body um Brief-079/080/081/082-Block (PR-Hashes, Brief-081-codex-Branch-Status, Endstand-Vermessung) erweitert.
- This `log.md` — Append-only-Eintrag (Sie lesen ihn gerade).

**Not yet updated in this pass:**

- [`./pipeline-state.md`](./pipeline-state.md) — die Apply-Layer-Synopsis-Forward-Guard-Architektur (`validateSynopses()`-Pre-Pass + Banned-Pattern-JSON + Pure-Helper-Shape) sollte in der § „Resolver layer (post-063 through 077-impl)"-Sektion ergänzt werden, ebenso die Drei-Discipline-Sicht ab `ssot-w40k-021` (Synopsis/Faction-Granularity/Grand-Alignment). Plus die § „What's next on the pipeline axis"-Liste braucht das ✅ für die 200er-Synopsis-Sauberkeit. Deferred zu einer Folge-Hygiene-Iteration — `pipeline-state.md` ist ein detaillierter Verlauf, der nicht jede Session zwingend braucht. Wenn der nächste Loop-Re-Trigger (`021..025`) durch ist, lohnt sich ein paariger Update mit der Resolver-Pass-5-Hygiene.
- [`./index.md`](./index.md) — `updated: 2026-05-19` Frontmatter + Catalog-Zeile für `project-state.md` (Description-Update auf post-079/080/081/082-Stand) und für `open-questions.md` (Header-Description-Aktualisierung). Wird in diesem Pass erfasst, sobald die Wartung des Sessions-README abgeschlossen ist.
- ADR `decisions/why-public-synopsis-guard.md` (Brief 080 als formal-ADR): Brief 080 hat de-facto entschieden, dass Public-Synopsis-Sauberkeit ab jetzt Apply-Layer-enforced ist (statt nur Loop-Heredoc-Disziplin). Das ist eine echte Architektur-Entscheidung mit Revisit-Trigger (was, wenn die 32-Pattern-Liste zu eng / zu locker wird?). Aktuell deferred, weil die Bedienung in `project-state.md` / `open-questions.md` lebt und die Konvention noch im Erst-Lauf ist. Wenn Brief 081-PR gemerged ist und der Loop-Re-Trigger `021..025` ohne Pattern-Treffer durchläuft (= Guard greift forward sauber), ist der Revisit-Trigger leerer und ein knapper ADR-Stub lohnt sich. Bei einem nicht-trivialen Pattern-Konflikt (z. B. ein neuer Brief muss die Liste anpassen) sollte er sofort gezogen werden.

**Glossar-Erweiterung deferred:** Begriffe aus 080/081 (`synopsis-banned-patterns`, `validateSynopses-pre-pass`, `apply-layer-forward-guard`, `synopsis-discipline`, `voice-corridor`, `reader-info-erhaltung`, `period-treue-faction-naming`) sind legitime Glossar-Einträge. Bei der nächsten Hygiene-Session nachziehen, wenn sie als „undefiniert" auffallen.

**Outside the wiki:**

- [`sessions/README.md`](../../sessions/README.md) — Active-Threads-Tabelle und Maintainer-Bedienung-Pointer auf Post-Wiki-Hygiene-Stand zu bringen: vier neue Zeilen (079-impl, 080-arch/impl-Pair, 081-arch/impl-Pair auf codex, 082-arch/083-impl-Pair), Maintainer-Bedienung-Pointer auf „Push + PR + Merge 081 → Loop-Re-Trigger `021..025`" umschreiben. Vorherige 074/075-Zeilen ausprunen (gemerged-und-in-project-state-dokumentiert; gehören in Archiv).

**Outside the wiki / outside this session:**

- Keine Code-Änderungen, kein CC-Brief.
- Keine Session-Archive-Moves. 080-Pair + 081-Pair bleiben in Active-Threads bis Brief-081-PR + Loop-Re-Trigger `021..025` durchgespielt sind; 082-Pair + 079-impl bleiben bis sie als "settled convention / settled prototype" gepruned werden können.
- Keine PR-Aktionen oder Branch-Merges durch Cowork — Maintainer-Aufgabe.

**Branch:** `codex/ingest-batches-synopsis-005-019` (im `chrono-lexicanum-batches`-Worktree). Cowork-Edits liegen physisch in `chrono-lexicanum/brain/wiki/*` + `chrono-lexicanum/sessions/README.md` (Coordination-Worktree); Maintainer überträgt sie in den Batches-Worktree per `cp` und committet als zusätzlichen Commit auf den codex-Branch — pro Philipps Wahl beim `AskUserQuestion`-Step.

## 2026-05-20 · Ingest · Wiki-Pass post-086-impl (Hardcover→Goodreads rating pivot)

Brain-Update nach dem Merge von Brief 086 (PR #73, `origin/main` `af7d90c`). Ausgelöst durch den 086-Impl-Report: Hardcover-Phasen 1–3 endeten bei 116/200 (58 %, „hard signal"), Phase 4 (Goodreads-Rating per Einzel-Websuche) löste 78/81 = 96.3 % und hob die DB-Rating-Coverage auf 197/200 (98.5 %).

**Read:**

- `sessions/archive/2026-05/2026-05-20-086-impl-hardcover-hit-rate-pass-2.md` — Closing-Report end-to-end, alle vier Phasen inkl. Phase-4-Verdikt „Websuche nur Lokator, nicht Quelle" (Snippets ~4 % plausibel-falsch).
- `sessions/archive/2026-05/2026-05-20-086-arch-hardcover-hit-rate-pass-2.md` — Brief inkl. Phase-4-Nachtrag.
- `sessions/2026-05-11-061-arch-ssot-loop.md` — Standing-Loop, gelesen für die Brief-087-Planung.

**New decision:**

- `decisions/hardcover-to-goodreads-pivot.md` — ADR für den Rating-Quellen-Pivot. Context (drei Hardcover-Briefs, strukturelle Katalog-Lücke), Decision (Goodreads ersetzt Hardcover, Page-Read statt Snippet, mixed-source bleibt, OL-Fallback + Slug/ID-Stage-6 gestrichen), Why, Revisit-Trigger. Amendet `decisions/no-goodreads.md` fürs Rating-Feld (Banner-Notiz dort ergänzt).

**Closed open-questions:**

- OQ (10) Hardcover-Hit-Rate-Härtung — geschlossen. Nicht weil das 70-%-Ziel erreicht wurde (086 landete bei 58 %), sondern weil das Ziel dahinter (Rating-Coverage) über den Goodreads-Pivot erreicht ist.
- OQ (12) Goodreads-Rating — geschlossen. Phase-4-Validierung erledigt; Voll-Roster + Batch-Integration in Brief 087 gefaltet, Refresh-Button in den Roadmap-Ideas-Backlog.

**New open-question:**

- OQ (13) Crawl-Simplification-Sichtung — Cowork-Befund aus dem Auftrag, die 086-„Simplest thing first"-Lehre gegen die übrigen Crawls zu halten. Ergebnis: die Vereinfachung ist architektonisch schon passiert (Excel-SSOT + CC-Direct-Curation); was bleibt, ist bypassed-aber-nicht-retired Code (V1-Pipeline, V2-LLM-Stage, V2-Pipeline-Rest) — Kandidat für einen Dead-Code-Retirement-Hygiene-Brief.

**New brief:**

- `sessions/archive/2026-05/2026-05-20-087-arch-goodreads-rating-pipeline.md` — Goodreads-Rating als vierte Loop-Disziplin in Brief 061: Override-Schema-Erweiterung (`overrides.rating`), Apply-Layer schreibt `book_details`, Discipline-Section + `run-ssot-loop.sh`-Heredoc, Page-Read-Pflicht, „geprüft, noch keine Wertung"-Marker, Single-Book-Smoke. status: open.

**Updated wiki:**

- `project-state.md` — `updated: 2026-05-20`, Header-Datum, Sources um 084/086/087 + ADR, neue „Latest pipeline state (post-086)"-Sektion, Branch-Sektion auf `af7d90c` + reparierte `.git/config` + CRLF-Hinweis, What's-running-Rating-Bullet auf 197/200, What's-open neu sortiert (Brief 087 + Loop-Re-Trigger oben, 084/085/OQ10/OQ11 raus), Recently-shipped um sechs Zeilen, Next-likely-brief neu.
- `open-questions.md` — `updated: 2026-05-20`, neuer Frontmatter-Header-Kommentar, Sources um 086/087, OQ (10) + OQ (12) auf closed umgeschrieben, OQ (13) neu, Migration-history-Satz angehängt.
- `index.md` — `updated: 2026-05-20`, Katalog-Zeilen für project-state/open-questions/roadmap/cowork-session/log + Self-Row, neue Decision-Zeile `hardcover-to-goodreads-pivot.md`, `no-goodreads.md`-Zeile als amended markiert.
- `roadmap.md` — `updated: 2026-05-20`, Supersede-Notiz am Phase-3-Strategie-Absatz, Refresh-Button im Ideas Backlog.
- `workflows/cowork-session.md` — `updated: 2026-05-20`, neue Section „Simplest thing first" (Cowork-Edit aus dem 086-Arc übernommen, Snippet-Detail an das finale 086-Verdikt angepasst).
- `decisions/no-goodreads.md` — Amendment-Banner 2026-05-20.

**Not updated in this pass:** `pipeline-state.md` — die Goodreads-Rating-Pipeline ist noch nicht implementiert (Brief 087 offen); pipeline-state wird beim 087-Impl-Hygiene-Pass nachgezogen, zusammen mit dem seit 2026-05-19 deferred post-080+081-Update.

**Outside the wiki:** `sessions/README.md` Active-Threads auf post-086-Stand. Coordination-Worktree-Befund: `.git/config` war NUL-byte-korrupt → 2026-05-20 repariert (Backup `.git/config.corrupt-backup-20260520`); tree-weiter CRLF-Flip + einige Commits hinter `origin/main` — Resync ist Routine-git-Hygiene, in der `project-state.md`-Branch-Sektion vermerkt.

**Branch:** Wiki-Pass-Edits + Brief 087 liegen im Coordination-Worktree; die Commit-Mechanik wird mit dem Maintainer geklärt (die Cowork-Sandbox kann git-Write-Operationen nicht zuverlässig abschließen — unlink von `.git`-Lock-Dateien schlägt fehl).

## 2026-05-21 · Ingest · Wiki-Hygiene-Pass post-087/088/089 (Resolver-Pass 5, 250 Bücher)

Brain-Update nach dem Merge von Brief 087 (Goodreads-Rating-Pipeline, PR #74/#75), Brief 088 (SSOT-Loop lean, PR #76 `71fb4f1`), dem Loop-Lauf `ssot-w40k-021..025` (PR #77 `c2f53e7`) und Brief 089 (Resolver-Pass 5, PR #78 `d46bf6a`). `origin/main` steht auf `d46bf6a`, 250 W40K-Bücher in der DB. Ausgelöst durch den Maintainer-Auftrag „necessary hygiene across the project" — sammelt vier Sessions Drift seit dem post-086-Pass. Der Coordination-Worktree war hinter `origin/main`; der Maintainer hat ihn zu Session-Beginn per `git pull --ff-only` synct (clean fast-forward, kein Merge-Commit).

**Read:**

- `sessions/archive/2026-05/2026-05-20-087-impl-goodreads-rating-pipeline.md` — Goodreads-Rating als vierte forward-only Loop-Disziplin, `apply-override-rating.ts` Pure-Helper, `apply-override-dry.ts --file=`-Modus, `test:resolver` 154/0.
- `sessions/archive/2026-05/2026-05-21-088-impl-ssot-loop-lean.md` — Loop-Iteration auf drei Dateien / ~6k Tokens, `loop-next-batch.ts`-Detection-Helper, `--skip-initial-resolver-pause` entfernt, selbst-erkennende Resolver-Pause.
- `sessions/ssot-loop-log.md` Iterationen `021..025` — 50 Bücher W40K-0201..0250, vier Loop-Disziplinen, selbst-erkennender 250er-Pause-Block.
- `sessions/archive/2026-05/2026-05-21-089-impl-resolver-pass-5.md` — axis-sliced Resolver-Pass 5, supervised/manuell gefahren, drei Wave-Calls, Counts post-Re-Apply `001..025`.

**No new decision page.** Brief 089 hat `commissar` als ersten `protagonist_class`-Vokabular-Wert promoted — eine Vokabular-Erweiterung, kein ADR-Material (folgt dem etablierten Cockpit-Triage-Muster aus OQ2-(a)). Der `seed-facets-089.ts`-DB-Seed-Pfad ist als Pipeline-Konvention in `pipeline-state.md` § Pass-5-Konvention dokumentiert.

**Closed (aus der Restqueue, keine numerierte OQ):** „Brief 087 fahren" + „Loop-Re-Trigger `ssot-w40k-021..025`" + Resolver-Pass 5 — alle drei erledigt.

**New open-question:** OQ (14) Roster-Excel-Hygiene-Sweep (Maintainer-owned) — bündelt den W40K-0244-`seriesHint`-Mistag (Brief-089-Hand-off) mit den 5 `no_author`-Roster-Pflegelücken aus dem 075-Backfill. Reine Excel-SSOT-Edits, kein Architektur-Brief.

**Updated wiki:**

- `project-state.md` — `updated: 2026-05-21`, Header-Datum, Sources um 087-impl/088/089/`ssot-loop-log`. Phase-Headline auf „fünfte 50er-Welle / 250 Bücher / Goodreads-Rating live / SSOT-Loop schlank". Sequenz-Paragraph um 084/086/087/088/Loop/089 ergänzt. Buch-Domain-Bild auf 250 Bücher + Counts `1153/455/701/79/232` + Rating-Coverage 246/250. Branch-Sektion auf `d46bf6a` (PR #78) + Worktree-Resync-Notiz. What's-running: DB-/Excel-SSOT-/Loop-Driver-/Resolver-Driver-Bullets auf post-089. Neue „Latest pipeline state (post-089)"-Sektion. What's-open neu sortiert (Loop-Re-Trigger `026..030` oben, OQ (14) gebündelt). Recently-shipped um sieben Zeilen. Next-likely-brief auf Loop `026..030` → Resolver-Pass-6.
- `pipeline-state.md` — `updated: 2026-05-21`, Titel auf `post-089-impl`, Sources um die neuen Sessions + `loop-next-batch.ts` + `apply-override-rating.ts` + `ssot-loop-runbook.md`. Intro-Blockquote auf fünf Resolver-Pässe + 250 Bücher + post-089-Counts. § Resolver layer auf `through 089-impl`, Counts (154/169/199 reference, Aliases 37/13/28), Coverage-Story post-089, Test-Counts (173/0). Drei neue Konventions-Paragraphen (Pass-5-Konvention inkl. `seed-facets-089`-Landmine, Rating-Schicht Brief 087, Loop-Lean-Konvention Brief 088). § What's next: Items 16–19 als ✅, neue Items 20–21 (Loop 026-030, Resolver-Pass 6), Rest renumeriert.
- `open-questions.md` — `updated: 2026-05-21`, neuer Frontmatter-Header-Kommentar, Sources um die neuen Sessions. Migration-history-Satz angehängt. Neue OQ (14) Roster-Excel-Hygiene-Sweep am Ende.
- `index.md` — `updated: 2026-05-21`, Katalog-Zeilen project-state/open-questions/pipeline-state/log + Self-Row auf post-089-Stand.
- This `log.md` — Append-only-Eintrag.

**roadmap.md not touched** — 087/088/089 haben keine Phasen-/Sub-Phasen-Grenze bewegt (alles innerhalb Phase 3). Der „Refresh-Button" steht schon im Ideas Backlog (post-086).

**Session-Archivierung:** geschlossene Session-Files aus `sessions/` root nach `sessions/archive/2026-05/` verschoben (Archive-Regel: root behält nur offene Briefs + die letzten 1–2 geschlossenen Sessions). `git mv`-Liste an den Maintainer übergeben.

**Outside the wiki:** `sessions/README.md` Active-Threads + Kopf-Paragraph + Reihenfolge auf post-089-Stand.

**Out of scope dieser Hygiene-Session:** Keine Code-Änderungen, kein CC-Brief. Kein `brain:lint --no-write`-Run durch Cowork (Sandbox unzuverlässig — Maintainer/CI). Kein ADR für `commissar` (Vokabular, kein Architektur-Call). `deferred-questions.md` unangetastet. Die mittlerweile sieben „Latest pipeline state"-Sektionen in `project-state.md` sind ein bekannter Bloat-Punkt — Collapse der ältesten in einen Pointer ist Kandidat für eine künftige Slim-Pass-Iteration, hier bewusst nicht gemacht (Accuracy-Fokus, kein riskanter 80-Zeilen-Verbatim-Edit).

**Branch:** Wiki-Pass-Edits liegen im Coordination-Worktree; die Commit-Mechanik (Branch `codex/session-090-wiki-hygiene` o. ä. + `git mv` für die Archivierung) klärt der Maintainer — die Cowork-Sandbox kann git-Write-Operationen nicht zuverlässig abschließen.

## 2026-05-22 · Ingest · Brain-Hygiene-Pass post-092 (OQ (14) geschlossen, PR #85)

Brain-Update nach dem Merge von PR #85 (Roster-Excel-Hygiene-Sweep, Session 092). Reiner Brain-Ingest-Pass — kein Code-, Schema- oder DB-Touch.

**Source ingested:**

- `sessions/archive/2026-05/2026-05-22-092-impl-roster-hygiene.md` — OQ-(14)-Roster-Excel-Hygiene-Sweep, alle fünf Gruppen (a)–(e) über Excel-SSOT-Edits + Loader-Regen; `book-roster.json` 191 → 196 Collections, `books` unverändert 859, kein DB-Apply.

**Closed:** OQ (14) Roster-Excel-Hygiene-Sweep — (a) `seriesHint`-Mistag W40K-0244, (b) sechs fehlende Autoren-Felder, (c) zwei Format-`data_conflict` (W40K-0297/0334), (d) zwei Titel-Mistags (W40K-0259/0330), (e) fünf fehlende Collection-Kanten (W40K-0286/0307). Offene Queue danach: OQ (3) Hand-Check-Workflow + OQ (13) Crawl-Simplification-Sichtung.

**Watch-Item (durable in `project-state.md` § What's open):** Slug-Delta aus Gruppe (d) — W40K-0259 → `the-rose-in-anger`, W40K-0330 → `the-hunt-for-magnus` in `book-roster.json`. DB-`works.slug` unverändert, bis Resolver-Pass 7 die Achsen `ssot-w40k-026` / `ssot-w40k-033` kumulativ re-applied.

**Updated wiki:**

- `open-questions.md` — neuer Frontmatter-Header-Eintrag (post-092); OQ (14) auf strike-through-closed + Closing-Note (fünf Gruppen + Slug-Delta + `collection-gaps.json`-Out-of-scope); Migration-history-Blockquote um den post-092-Satz ergänzt; Sources um `092-impl`.
- `project-state.md` — Roster `191 → 196 Collections` an zwei Stellen (Buch-Domain-Absatz + What's-running-Excel-SSOT-Bullet; `books` 859); § What's open: OQ-(14)-Bullet durch das Slug-Delta-Watch-Item ersetzt; § Next likely brief: OQ-(14)-Sekundär-Option entfernt; Recently-shipped um zwei Zeilen (Session 092 + dieser Pass); Sources um `092-impl`.
- `pipeline-state.md` — Roster-Collection-Zahl `191 → 196` (§ Excel-SSOT layer: `Collection Links`-Datenzeilen + `book-roster.json`-Shape).
- `index.md` — Katalog-Beschreibungen für `project-state.md` + `open-questions.md` auf post-092; `updated`-Daten der berührten Seiten bereits 2026-05-22.
- This `log.md` — Append-only-Eintrag.

**Bewusst NICHT geändert (historische 191-Referenzen):** der „191 vs 192 Collections"-Reconciliation-Hinweis in `pipeline-state.md` § Bekannte Schwächen, das Brief-057-Phasen-Checklist-Item (`book-roster.json` (859 + 191)), die `log.md`-Append-Einträge und der ADR `decisions/why-excel-ssot-not-crawl.md` (das 191-vs-192-Paar ist dort load-bearing für die Off-by-one-Erzählung). Diese 191 sind Brief-057-Zeit-Artefakte, keine Current-Roster-Aussage.

**Out of scope:** `scripts/seed-data/collection-gaps.json` (W40K-0286/0307-Retirement = Resolver-Pass 7 Phase 4a) unangetastet; keine Code-/Schema-/DB-Änderung; keine anderen OQs; **kein Archivierungs-Move** (062–091/092 → `archive/2026-05/` bleibt separate CC-Aufgabe). `book-data-overview.md` trägt keine Roster-Collection-Zahl — nicht berührt. Kein `brain:lint --no-write`-Run durch Cowork (Sandbox unzuverlässig — Maintainer/CI).

**Befund (nicht gefixt, out of scope):** `log.md` hat keine Append-Einträge für die Brain-Hygiene-Pässe post-090 und post-091 — diese Pässe aktualisierten `project-state.md`/`open-questions.md`/`index.md`, ließen aber den `log.md`-Append aus. Kandidat für eine künftige Hygiene-Iteration.

**Branch:** Wiki-Pass-Edits liegen im Coordination-Worktree; die Commit-Mechanik klärt der Maintainer Windows-nativ (die Cowork-Sandbox fasst `git` nicht an). Der Worktree war zu Session-Beginn hinter `origin/main` — der 092-Report + die `book-roster.json`/xlsx-Änderungen aus PR #85 fehlten lokal; die Session-Branch muss von `origin/main` (post-PR-#85) gecuttet werden, damit die neuen `sources:`-Verweise auflösen.

## 2026-05-22 · Ingest · Pass-6-Review + Brief 091 (Resolver-Pass Phase-4-Split) + Brain-Hygiene-Pass post-091

Brain-Update nach dem Merge von Resolver-Pass 6 (`ssot-w40k-026..035`, PR #83 `72c8788` — 350 W40K-Bücher applied). Ausgelöst durch den Maintainer-Auftrag, den letzten Resolver-Lauf zu reviewen und zu prüfen, ob Resolver-Pass-Phase 4 weiter splitbar ist (Phase 4 ging in Pass 6 mit dem Kontextfenster Richtung ~300k Token gegen ein ~120k-Per-Phase-Budget). Der Coordination-Worktree wurde zu Session-Beginn vom Maintainer auf `origin/main` (`72c8788`) gebracht — neue Branch `codex/session-091-phase4-split` ab `origin/main`.

**Read:**

- `sessions/resolver-dossiers/resolver-pass-6-impl-report.md` + die drei Phase-Reports (Factions/Locations/Characters) — Resolver-Pass 6, erster Lauf unter dem Brief-090-lean-Kontrakt, supervised/axis-sliced. 350/350 Bücher applied, Dry-Prediction == DB-POST-APPLY exakt, Trias grün, kein `## Needs decision`. Eine Entscheidung: forward-ref-Collection-Guard auf report-only entschärft (erste Welle mit cross-batch collection edges).
- `sessions/resolver-pass-runbook.md` + `scripts/resolver-pass.config.json` + `scripts/run-resolver-pass.sh` + `scripts/run-phase4-apply.sh` — Resolver-Pass-Maschinerie, für die Phase-4-Split-Analyse.

**Review-Verdikt:** Pass 6 ist ein sauberer Lauf. Phase-4-Token-Befund: Brief 090 hat den *statischen* Lese-Scope schlank gemacht, nicht die *agentische* Arbeitslast — Phase 4 macht fünf Jobs plus ungeplantes Debugging in einem `/clear`. Der 4a/4b-Split ist die strukturelle Antwort.

**New brief:**

- `sessions/archive/2026-05/2026-05-22-091-arch-resolver-phase4-split.md` — Resolver-Pass-Phase-4-Split: Phase 4 → 4a (Integration/Apply) + 4b (Verify/Report), `/clear`-getrennt, Handoff über eine 4a-Statusdatei; forward-ref-Guard in `apply-override-dry.ts` von report-only auf range-aware gehärtet. Touch-Set: `resolver-pass-runbook.md` + `resolver-pass.config.json` + `apply-override-dry.ts` + Driver-Verifikation. `status: open`.

**No OQ closed, no new numbered OQ.** Der Pass-6-Architektur-Punkt (forward-ref-Guard) ist in Brief 091 gefaltet. OQ (14) um Sub-Punkt (e) erweitert: zwei deferred collection-gaps (Architect of Fate W40K-0286, War for Armageddon Omnibus W40K-0307 — Constituent-Works existieren, nur die Roster-Kanten fehlen).

**Updated wiki:**

- `project-state.md` — Phase-Headline auf 350 Bücher / Resolver-Pass 6; Branch-Sektion auf `72c8788` (PR #82 → #83); Buch-Domain-Bild + DB-/Excel-SSOT-/Resolver-Driver-Bullets auf post-Pass-6-Counts (`1424/543/844/109/325`, Reference `162/189/237`, Rating 346/350); neue „Latest pipeline state (post-091)"-Sektion (Pass-6-Review + Brief 091).
- `pipeline-state.md` — Titel auf `post-091`; Intro-Blockquote auf sechs Resolver-Pässe / 350 Bücher; § Resolver layer auf `through Pass 6 / Brief 091` + post-Pass-6-Counts; § What's next Item 21 auf ✅ + Brief 091; neuer Pass-6-Konventions-Paragraph.
- `open-questions.md` — neuer Frontmatter-Header-Kommentar (post-091); OQ (14) Sub-Punkt (e) + Sessions-Zeile um den Pass-6-Report.
- `index.md` — Katalog-Zeilen project-state / open-questions / pipeline-state auf post-091-Stand.
- This `log.md` — Append-only-Eintrag.

**Outside the wiki:** `sessions/README.md` Active-Threads + Kopf-Paragraph auf post-Pass-6 + Brief 091.

**Out of scope dieser Session:** Keine Code-Änderungen (Brief 091 ist CC-Arbeit). Kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — Maintainer/CI). Die Pass-7-Per-Pass-Config-Werte (Bump auf `ssot-w40k-036..045`) sind ein späterer Setup-Schritt nach dem nächsten Loop-Lauf. Der Archivierungs-Rückstand in `sessions/` root (geschlossene Files 062–090) bleibt — eigener kleiner CC-`git mv`-Task.

**Branch:** Brief 091 + Wiki-Pass-Edits liegen im Coordination-Worktree auf `codex/session-091-phase4-split` (uncommitted; die Cowork-Sandbox fasst `git` nicht an). Brief 091 trägt eine `## Commit & PR`-Sektion, die Claude Code anweist, diesen Architekten-Output beim Implementieren als ersten Commit mitzunehmen und mit der Implementierung in **einen** PR zu bündeln (Workflow-Vereinfachung auf Maintainer-Wunsch 2026-05-22).

## 2026-05-22 · Setup + Hygiene · Resolver-Pass-6-Setup + Brain-Hygiene-Pass (post-090)

Brief-freier Cowork-Task (vom Maintainer freigegeben, kein Architekten-Brief): `scripts/resolver-pass.config.json` von Pass 5 auf Pass 6 umstellen + überfälliger Brain-Hygiene-Pass nach Brief 090 (Resolver-Pass lean, PR #80) und dem ersten 100er-Loop-Lauf `ssot-w40k-026..035` (PR #81). `origin/main` `131a8a4`; Working-Tree `codex/session-pass6-setup`.

**Read:**

- `sessions/archive/2026-05/2026-05-21-090-impl-resolver-pass-lean.md` — Brief 090 umgesetzt (Mess-Gate + Bausteine 2–5: schlankes Runbook, brief-freier Driver, Phase-4-Digest, stabile wave-parametrisierte Tools, Cadence 50→100).
- `sessions/resolver-pass-runbook.md` + `scripts/resolver-pass.config.json` (Pass-5-Instanz) — Resolver-Pass-Maschinerie.
- `sessions/ssot-loop-log.md` Iterationen `026..035` (Tail-Read) — 100 Bücher W40K-0251..0350, vier Loop-Disziplinen, Content-Flags, selbst-erkennender 350er-Pause-Block.
- `scripts/seed-data/book-roster.json` (Range W40K-0251..0350) — Slug-Auswahl für die Verify-`smokeSlugs`.

**Code/Config geändert (kein Wiki):**

- `scripts/resolver-pass.config.json` — Pass 5 → Pass 6: `pass=6`, `wave=ssot-w40k-026..035`, `brief`-Feld entfernt (brief-frei), `dossier`/Phase-Report-Pfade pass-6-gekeyt (`resolver-pass-6-*`), `aggregator.batches` 026..035 + aktualisierte `clusters`-Labels, `applyRange` 1..35, Verify `newRange` W40K-0251..0350 / `oldRange` ..0250 / `ratingRange` W40K-0251..0350 + zehn neue `smokeSlugs` (Bücher aus der `026..035`-Welle), Phase-4-Trigger ohne Facet-Promotion (`facet-catalog.json` bewusst aus dem Phase-4-Scope genommen). JSON-valide.
- `CLAUDE.md` § Git — neue `⚠ KRITISCH`-Callout: kein `git` in der Sandbox (die Mount-Schicht korrumpiert git-Metadaten, NUL-Byte-Korruption), kein Schreiben in `.git/`; Working-Tree-Dateien nur über die Datei-Tools, git-Operationen Windows-nativ durch den Maintainer.

**Updated wiki:**

- `project-state.md` — `updated: 2026-05-22`, Header-Datum, Sources um 090-arch/impl + Runbook + Config. Phase-Headline + Sequenz-Paragraph + Buch-Domain-Bild auf 350 Override-Files / DB 250 + Brief-090-Maschinerie + 100er-Loop. Branch-Sektion auf `131a8a4` (PR #79/#80/#81) + Worktree `codex/session-pass6-setup`; der stale Coordination-Worktree-Hinweis zum Git-Sandbox-Hinweis mit `CLAUDE.md`-Pointer umgeschrieben. What's-running: DB-/Loop-Driver-/Resolver-Driver-Bullets auf post-090 (Cadence 50→100, brief-frei, Config auf Pass 6). Neue „Latest pipeline state (post-090)"-Sektion. What's-open neu sortiert (Resolver-Pass 6 oben, OQ (14) um (c)+(d) erweitert, Vokabular-Watch um `plot_type=duel`, Resolver-Driver-Smoke auf Pass 6+). Recently-shipped um vier Zeilen. Next-likely-brief auf Resolver-Pass 6.
- `pipeline-state.md` — `updated: 2026-05-22`, Titel `post-090`, Sources um 090-arch/impl + Runbook. Intro-Blockquote um Brief 090 + 100er-Loop. § Resolver layer auf `through 090`. Neue „Pass-lean-Konvention aus 090-impl"-Sektion. § What's next: Items 20/21 auf Brief 090 + 100er-Loop (✅) bzw. Resolver-Pass 6 umgeschrieben.
- `open-questions.md` — `updated: 2026-05-22`, neuer Frontmatter-Header-Kommentar, Sources um 090-arch/impl + Loop-Log. Migration-history-Satz angehängt. **OQ (14) erweitert** von zwei auf vier Gruppen: neue Sub-Punkte (c) Format-`data_conflict` W40K-0297/0334 + (d) Titel-Mistags W40K-0259/0330; `plot_type=duel` explizit als Nicht-Roster-Watch-Item abgegrenzt.
- `index.md` — `updated: 2026-05-22`, Katalog-Zeilen project-state/open-questions/pipeline-state/log + Self-Row auf post-090-Stand.
- This `log.md` — Append-only-Eintrag.

**No new decision page.** Brief 090 ist Resolver-Pass-Maschinerie-Hygiene (Token-Budget pro Phase), kein Architektur-Call mit Revisit-Trigger; die Pass-lean-Konvention ist in `pipeline-state.md` dokumentiert. Der 100er-Loop ist ein reiner Daten-Lauf.

**Keine OQ-Schließung, keine neue numerierte OQ.** Brief 090 + der Loop adressieren keine offene Queue-Frage. OQ (14) wuchs um vier Roster-Flags (Maintainer-owned, kein Brief).

**Outside the wiki:** `sessions/README.md` Active-Threads — Kopf-Paragraph + Tabelle auf post-090-Stand (Brief 090 + 100er-Loop gemerged, Resolver-Pass 6 als pending-Thread, diese Cowork-Session als complete-Row).

**roadmap.md not touched** — Brief 090 + der Loop bewegen keine Phasen-/Sub-Phasen-Grenze (alles innerhalb Phase 3).

**Out of scope dieser Session:** Keine Code-Änderungen außer der Config + dem `CLAUDE.md`-Callout. Kein `npm install`/Build, kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — Maintainer/CI). Kein Architekten-Brief (Resolver-Pass 6 ist seit Brief 090 brief-frei). Keine Session-Archivierung (der 062–090-Archivierungs-Rückstand bleibt als eigene CC-Aufgabe in `sessions/README.md` vermerkt). Die mittlerweile acht „Latest pipeline state"-Sektionen in `project-state.md` sind ein bekannter Bloat-Punkt — Collapse der ältesten in einen Pointer bleibt Kandidat für eine künftige Slim-Pass-Iteration, hier bewusst nicht gemacht (Accuracy-Fokus).

**Branch:** Edits liegen im Working-Tree `codex/session-pass6-setup`; Philipp committet + pusht Windows-nativ — die Cowork-Sandbox fasst `git` nicht an (siehe `CLAUDE.md` § Git).

## 2026-05-23 · Ingest + Hygiene · Post-Merge-Koordinations-Pass (Pass 7 + Brief 094 + Brief 095)

Brief-freier Cowork-Task: der überfällige Post-Merge-Koordinations-Pass für die drei Stränge, die seit dem post-092-Stand gemergt sind. Erster Pass unter der frisch implementierten Brief-095-Rollup-Ownership-Regel — Cowork ist ab jetzt der alleinige Schreiber von `sessions/README.md` + `brain/**`, und dieser Post-Merge-Pass ist der definierte Pfad dafür. Maintainer hat alle drei Merges bestätigt; Coordination-Worktree `C:\Users\Phil\chrono-lexicanum`.

**Read (raw sources):**

- `sessions/resolver-dossiers/resolver-pass-7-impl-report.md` — Resolver-Pass 7 (`ssot-w40k-036..045`, PR #90): 450/450 W40K-Bücher applied, Counts, EXPECTED_RANGES-Bump, `collection-gaps.json` +1.
- `sessions/archive/2026-05/2026-05-23-094-impl-resolver-loop.md` + `sessions/archive/2026-05/2026-05-23-094-arch-resolver-loop.md` — Resolver-Loop: SSOT-Loop ↔ Resolver entkoppelt, Wellen-Detektor `resolver-loop-detect.ts`, brief-freies Runbook, headless `run-resolver-loop.sh`.
- `sessions/archive/2026-05/2026-05-23-095-impl-rollup-ownership.md` + `sessions/archive/2026-05/2026-05-23-095-arch-rollup-ownership.md` — Rollup-Ownership: `sessions/README.md` + `brain/**` coordination-worktree-only, Worktree-Selbstprüfung am Session-Start.
- `sessions/archive/2026-05/2026-05-22-093-arch-resolver-pass-7.md` (`status: implemented`), `sessions/resolver-loop-log.md` (Bootstrap-Block), `scripts/resolver-pass.config.json` (auf Welle `046..051` auto-gekeyt), `sessions/README.md` Active-Threads.

**Updated wiki:**

- `project-state.md` — `updated: 2026-05-23`, Header-Datum, Sources um 093/094/095 + resolver-loop-Dateien. Phase-Headline + Sequenz-Paragraph + Buch-Domain-Bild auf 450 W40K-Bücher + entkoppelte Headless-Loops. Branch-Sektion auf post-095 (Pass 7 PR #90 + Brief 094 + Brief 095 gemergt; exakte HEAD-SHA nicht gepinnt — Sandbox fasst `git` nicht an). What's-running: DB-/Excel-SSOT-/Loop-Driver-Bullets auf post-Pass-7-Counts (`1659/638/1074/142/424`, Reference `166/201/297`, Rating 446/450), der Resolver-Driver-Bullet auf den headless Resolver-Loop (Brief 094) umgeschrieben. Neue „Latest pipeline state (post-095)"-Sektion (Pass 7 + Brief 094 + Brief 095). What's-open neu sortiert (operativer Headless-Loop-Schritt oben, Resolver-Pass-7-Item raus, Slug-Delta + Collection-Gap + Vokabular-Watch + Resolver-Loop-Smoke aktualisiert). Recently-shipped um sechs Zeilen. Next-likely-brief auf die headless-Loop-Sequenz + Konsolidierungs-Pass + HH.
- `pipeline-state.md` — `updated: 2026-05-23`, Titel `post-095`, Sources um 093/094 + resolver-loop-Dateien. Intro-Blockquote auf sieben Resolver-Pässe / 450 Bücher / Brief-094-Entkopplung. § Resolver layer auf `through Pass 7 / Brief 094` + post-Pass-7-Counts + Test-Counts (`test:resolver` 236). Neue Sektion „Resolver-Loop-Konvention (Pass-7-impl + 094-impl)" mit den vier Brief-094-Bausteinen. § What's next: Item 21 auf die Resolver-Maschinerie-Reihe (Pass 6/7 + 091 + 094/095) umgeschrieben, neues Item 23 (Konsolidierungs-Pass), Items 24–28 nachnumeriert.
- `open-questions.md` — `updated: 2026-05-23`, neuer Frontmatter-Header-Kommentar (post-093/094/095), Sources um 093/094/095 + resolver-pass-7-impl-report + resolver-loop-log. Migration-history-Satz angehängt. Keine OQ-Schließung, keine neue numerierte OQ.
- `index.md` — `updated: 2026-05-23`, Katalog-Zeilen project-state / open-questions / pipeline-state / log + Self-Row auf post-095-Stand.
- This `log.md` — Append-only-Eintrag.

**No new decision page.** Resolver-Pass 7 ist ein reiner Daten-Lauf; Brief 094 ist Resolver-Pass-Maschinerie-Hygiene (Entkopplung + Headless-Automatisierung) ohne Architektur-Call mit Revisit-Trigger — die Konvention lebt in `pipeline-state.md` § Resolver-Loop-Konvention; Brief 095 ist Workflow-/Doku-Hygiene (die operativen Regeln stehen in `CLAUDE.md`/`AGENTS.md` + den Workflow-Pages, von 095-impl gepflegt).

**Keine OQ-Schließung, keine neue numerierte OQ.** Die drei Stränge adressieren keine offene Queue-Frage; OQ (3) Hand-Check-Workflow + OQ (13) Crawl-Simplification-Sichtung bleiben offen.

**Outside the wiki:** `sessions/README.md` Active-Threads — Kopf-Paragraph + Tabelle auf post-095-Stand (Pass 7 + Brief 094 + Brief 095 als complete/merged, headless-Loop-Sequenz als nächste Reihenfolge, diese Cowork-Session als complete-Row).

**roadmap.md not touched** — Pass 7 + Brief 094/095 bewegen keine Phasen-Grenze (alles innerhalb Phase 3).

**Out of scope dieser Session:** Keine Code-Änderungen (alle drei Stränge sind implementiert + gemergt). Kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — Maintainer/CI). Keine Session-Archivierung — der `sessions/`-root-Archivierungs-Rückstand (geschlossene Files 062–095) bleibt als eigene kleine CC-`git mv`-Aufgabe. Die mittlerweile zehn „Latest pipeline state"-Sektionen in `project-state.md` bleiben ein bekannter Bloat-Punkt (Collapse der ältesten in einen Pointer = künftige Slim-Pass-Iteration, hier bewusst nicht gemacht — Accuracy-Fokus, Präzedenz post-090-Eintrag).

**Branch:** Edits liegen im Coordination-Worktree; Philipp committet + pusht Windows-nativ — die Cowork-Sandbox fasst `git` nicht an (siehe `CLAUDE.md` § Git).

## 2026-05-25 · Ingest + Architektur · Post-Merge-Koordinations-Pass (#94/#95/#96) + Brief 098 (W40K-Konsolidierungs-Pass)

Cowork-Session: Post-Merge-Koordinations-Pass für die drei seit post-095 gemergten Stränge (SSOT-Loop-Lauf PR #94, Resolver-Pass 8 + Brief 097 PR #95, Resolver-Pass 9 PR #96 — **W40K datenkomplett, 565/565 Bücher**) plus Architekten-Brief 098. Coordination-Worktree `C:\Users\Phil\chrono-lexicanum`, Branch `codex/session-098-w40k-consolidation`. Auslöser: Maintainer-Frage „wie geht es weiter" nach dem Resolver-Lauf.

**Read (raw sources):**

- `sessions/resolver-dossiers/resolver-pass-8-impl-report.md` + `resolver-pass-9-impl-report.md` — Pässe 8 + 9, W40K 450 → 510 → 565, Counts + EXPECTED_RANGES-Bump.
- `sessions/archive/2026-05/2026-05-23-097-impl-resolver-loop-finalize-fix.md` — Brief-097-Hotfix (`readonly STATE_FILE`-Crash + Pass-8-Loop-Log-Backfill).
- `sessions/archive/2026-05/2026-05-23-094-arch-resolver-loop.md` — Konsolidierungs-Pass-Eckpunkte (§ Notes) als Brief-098-Grundlage.
- `sessions/resolver-pass-runbook.md`, `sessions/resolver-loop-log.md`, `scripts/resolver-pass.config.json` — Maschinerie-Stand.

**Befund — `resolver-loop-log.md`-Marker-Drift:** die Datei auf `origin/main` trägt nur den Bootstrap-Block (Pässe 1–7); die Pass-8-/9-Blöcke fehlen. `resolver-loop-detect.ts` würde falsch rechnen. Als Brief 098 Teil 1 gefaltet.

**Geschrieben:**

- `sessions/2026-05-25-098-arch-w40k-consolidation-pass.md` — Brief 098: der W40K-Konsolidierungs-Pass (Cross-Wave-Canonical-Row-Dedup als eigener Pass-Typ + schlankes Geschwister-Runbook + Dubletten-Kandidaten-Aggregator, erstmals über das W40K-Entitäten-Set gefahren) + Teil 1 `resolver-loop-log`-Hygiene. `status: open`.

**Updated wiki:**

- `project-state.md` — `updated: 2026-05-25`, Header-Datum, Phase-Headline + Buch-Domain-Bild auf 565 W40K-Bücher / W40K datenkomplett / Post-Pass-9-Counts, Branch-Sektion auf post-094/095/096 (HEAD `b1c8b37`), What's-running (Excel-SSOT- + Resolver-Loop-Bullet), What's-open neu sortiert (Brief 098 oben, resolver-loop-log + HH-Schiene), Recently-shipped um vier Zeilen, Next-likely-brief auf Brief 098 → HH-Resolver → finaler Konsolidierungs-Pass.
- `pipeline-state.md` — `updated: 2026-05-25`, Titel `post-098`, Intro-Blockquote auf Pässe 8/9 + 565 Bücher + Brief 098.
- `open-questions.md` — `updated: 2026-05-25`, neuer Frontmatter-Header-Kommentar. Keine OQ-Schließung, keine neue numerierte OQ.
- `index.md` — `updated: 2026-05-25`, Katalog-Zeilen project-state / open-questions / pipeline-state / log + Self-Row.
- This `log.md` — Append-only-Eintrag.

**No new decision page.** Pässe 8/9 sind reine Daten-Läufe; Brief 098 setzt die in Brief 094 § Notes bereits per AskUserQuestion entschiedenen Konsolidierungs-Pass-Eckpunkte um — kein neuer Architektur-Call mit Revisit-Trigger.

**Keine OQ-Schließung, keine neue numerierte OQ.** OQ (3) Hand-Check-Workflow + OQ (13) Crawl-Simplification bleiben offen; Brief 098 § Notes deferred beide explizit (OQ 13 = eigener Retirement-Brief wert; OQ 3 = auf Aktualität prüfen).

**Git-Untangling (Session-Befund):** Der Coordination-Worktree stand auf dem Altbranch `codex/brain-coordination-post-095`; dessen Commit `03fe7c2` (Brain-Pass post-093/094/095) war bereits als PR #93 in `origin/main` (der Rebase erkannte ihn als „previously applied"). Brief 096 (Design-Direction) lag nur lokal auf diesem Altbranch und ist via `git checkout` ins Repo zurückgeholt worden. Frischer Session-Branch `codex/session-098-w40k-consolidation` aus `origin/main` (`b1c8b37`).

**Outside the wiki:** `sessions/README.md` Active-Threads — Kopf + Tabelle auf post-098-Stand (W40K complete, Brief 098 open, Brief 096 in Arbeit, #94/#95/#96 merged).

**roadmap.md not touched** — W40K-complete bewegt keine Phasen-Grenze (alles innerhalb Phase 3).

**Out of scope:** Kein Code-/Schema-/DB-Touch. Kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — CI/Maintainer). Keine Session-Archivierung (062–097-Rückstand bleibt eigene CC-Aufgabe). Fokussierter Pass — die zehn „Latest pipeline state"-Sektionen in `project-state.md` wurden bewusst nicht um eine elfte erweitert (das aktualisierte Buch-Domain-Bild trägt den post-098-Stand); der Bloat-Collapse bleibt Kandidat für eine Slim-Pass-Iteration.

**Branch:** Edits im Coordination-Worktree auf `codex/session-098-w40k-consolidation`; Philipp committet + pusht + PR Windows-nativ.

---

## 2026-05-25 · Ingest + Architektur · Post-Merge-Koordinations-Pass (#98) + Brief 099 (Sessions-Archiv-Sweep)

Cowork-Session: Post-Merge-Koordinations-Pass für den gemergten Brief 098 (W40K-Konsolidierungs-Pass) plus Architekten-Brief 099. Coordination-Worktree `C:\Users\Phil\chrono-lexicanum`. Auslöser: Maintainer-Frage „Brief 098 ist durch, wie gehts weiter?".

**Read (raw sources):**

- Der von Philipp übermittelte Brief-098-Impl-Report (PR-Beschreibung) — Konsolidierungs-Pass: 15 Dubletten-Kandidaten → 2 Merges (`vigilus_s`→`vigilus` Phantom-Row, `magister_sek`→`anakwanar_sek` von Pass 9 übersehene Pass-1-Row), 13 no-merges, 0 geflaggt; Reference-Deltas `locations 225→224`, `characters 345→344`, `factions` unverändert; alle Junction-Counts invariant; Maintainer-Review-Gate eingehalten. Teil 1 (`resolver-loop-log.md`-Verifikation): kein Drift.
- `sessions/2026-05-25-098-arch-w40k-consolidation-pass.md` — Brief 098 als Spec-Referenz.

**Befund — Working-Tree stale:** Der Coordination-Worktree lag bei der Session auf dem Vor-#98-Merge-Stand (098-Impl-Datei + `consolidation-*`-Artefakte fehlen lokal). `brain/**` + `sessions/README.md` sind davon nicht betroffen — Brief 098 war ein Batches-Strang-Task und hat sie per Constraint nicht angefasst —, der Koordinations-Pass ist also auf dem aktuellen Stand korrekt. Philipp zieht den Worktree per `git pull` nach, bevor er die Cowork-Änderungen committet und bevor CC Brief 099 implementiert.

**Geschrieben:**

- `sessions/2026-05-25-099-arch-sessions-archive-sweep.md` — Brief 099: Sessions-Archiv-Sweep (geschlossene Root-Session-Files 062–097 nach `sessions/archive/2026-05/` + Referenz-Rewrite über `brain/**` / Top-Level-Docs + `brain:lint` grün). Koordinations-Worktree, Meta/Session-Task, reine Repo-Hygiene. `status: open`.

**Updated wiki:**

- `project-state.md` — Phase-Headline + Buch-Domain-Bild auf W40K datenkomplett *und* konsolidiert (Reference `factions 173` / `locations 224` / `characters 344`); What's-running neuer Konsolidierungs-Pass-Bullet; What's-open (Brief 098 erledigt, Brief 099 oben, HH-Schiene, UI-Posten an Brief 096 angedockt); Recently-shipped um zwei Zeilen; Next-likely-brief auf Brief 099 → HH-Resolver → finaler Konsolidierungs-Pass. `sources:` um 098/099 erweitert.
- `pipeline-state.md` — Intro-Blockquote: Brief 098 gemergt, Konsolidierungs-Pass-Maschinerie, nächster Schritt Brief 099.
- `open-questions.md` — neuer Frontmatter-Header-Kommentar (post-098); `sources:` um 098/099 erweitert. Keine OQ-Schließung, keine neue numerierte OQ. Die in Brief 098 Teil 1 gefaltete `resolver-loop-log.md`-Marker-Drift ist verifiziert erledigt.
- `index.md` — Katalog-Zeilen project-state / open-questions / pipeline-state auf post-098.
- This `log.md` — Append-only-Eintrag.

**Entscheidung — UI-Posten an Brief 096 angedockt.** Der vom Maintainer gewünschte „Hygiene-Doppelpack" zerfiel bei Prüfung in zwei Worktree-Stränge: Archiv-Cleanup ist Coordination-Strang (→ Brief 099), Public-Page-Rating-Render + Cockpit-Drift-Tie-Group-Sub-Sortierung sind Product/UI und fassen genau die Seiten an, die das in-flight Brief-096-Redesign umbaut. Ein paralleler Product-Brief würde im `chrono-lexicanum-product`-Worktree mit dem lokal-iterativen 096-Stand kollidieren. Per AskUserQuestion entschieden: die zwei UI-Posten docken an Brief 096 an statt eigener Brief; als Notiz in `project-state.md` § What's open + § Next likely brief, keine numerierte OQ.

**No new decision page.** Brief 099 ist reine Repo-Hygiene; das UI-Routing ist eine Scope-/Timing-Entscheidung ohne Revisit-Trigger.

**Out of scope:** Kein Code-/Schema-/DB-Touch. Kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — CI/Maintainer). Die Session-Archivierung selbst ist Brief 099 (CC), nicht dieser Pass.

**Branch:** Edits im Coordination-Worktree; Philipp `git pull` → committet + pusht Windows-nativ.

---

## 2026-05-25 · Ingest · Post-#099-Koordinations-Pass (Brief 099 gemergt)

Cowork-Session: Post-Merge-Koordinations-Pass für den gemergten Brief 099 (Sessions-Archiv-Sweep). Coordination-Worktree `C:\Users\Phil\chrono-lexicanum`. Auslöser: Maintainer-Meldung „PR 99 ist gemerged".

**Read (raw sources):**

- `sessions/2026-05-25-099-impl-sessions-archive-sweep.md` — 099-Impl-Report: 53 geschlossene Session-Files (NNN 062–095 + 097) per `git mv` nach `sessions/archive/2026-05/`, 188 relative Pfad-Referenzen in 12 `brain/wiki/**`-Files umgeschrieben (Konzentration: project-state 51 / log 51 / open-questions 44 / pipeline-state 17 / Rest in Decision-/Workflow-Pages). `brain:lint --no-write` 0 blocking, `lint` 0 errors, `typecheck` clean. Keine Top-Level-Doc-/`docs/**`-/`scripts/**`-Treffer. Stop-before-push eingehalten.
- `scripts/loop-next-batch.ts` + `scripts/resolver-loop-detect.ts` — gelesen für die HH-Ausblick-Frage des Maintainers (Befund unten).

**Befund — SSOT-Loop vs. Resolver für HH.** Maintainer fragte, ob HH ohne Rewrite laufen kann. Am Code festgemacht: **SSOT-Loop ja** — `loop-next-batch.ts` ist zweidomänen-fähig (filtert `W40K-*` / `HH-*`, gibt nach dem letzten W40K-Batch automatisch `ssot-hh-001` aus, Override-File-Regex matcht `ssot-(w40k|hh)-*`). **Resolver nein** — `resolver-loop-detect.ts` ist hart W40K-only (Override-File-Regex nur `ssot-w40k-*`, ID-Präfixe + `ApplyRange.domain` fix, Terminal-Zustand `w40k-complete`); HH-Override-Files werden ignoriert. Der HH-Resolver-Brief braucht eine Domain-Generalisierung des Detektors. In `project-state.md` § Next likely brief eingearbeitet.

**Updated wiki:**

- `project-state.md` — Phase-Headline + Buch-Domain-Bild (Brief 099 gemergt, `sessions/`-Root aufgeräumt); What's-open (098+099-erledigt-Zeile, HH als nächster Schritt); Recently-shipped um zwei Zeilen (Brief 099 merged + dieser Pass); Next-likely-brief neu nummeriert (HH-Resolver = 1, finaler Konsolidierungs-Pass = 2) + SSOT-Loop-vs-Resolver-Befund.
- `pipeline-state.md` — Intro-Blockquote: Brief 099 gemergt, nächster Strang HH.
- `open-questions.md` — neuer Frontmatter-Header-Kommentar (Post-#099). Keine OQ-Schließung, keine neue numerierte OQ; die zwei 099-impl-Material-Punkte (`sources:`-Frontmatter-Konvention, `brain:lint`-Coverage-Erweiterung) als Notiz, nicht numeriert.
- `index.md` — Katalog-Zeilen project-state / open-questions auf post-099.
- `sessions/README.md` — Active-Threads-Kopf + Tabelle auf post-099 (Brief 099 merged, HH als nächster großer Schritt).
- This `log.md` — Append-only-Eintrag.

**No new decision page.** Brief 099 war reine Repo-Hygiene; kein Architektur-Call.

**Keine OQ-Schließung, keine neue numerierte OQ.** Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Out of scope:** Kein Code-/Schema-/DB-Touch. Kein `brain:lint`-Run durch Cowork (Sandbox unzuverlässig — CI/Maintainer).

**Branch:** Edits im Coordination-Worktree; Philipp committet + pusht + PR Windows-nativ.

---

## 2026-05-25 · Decision · PR-Policy — Doku committet direkt auf `main`

Cowork-Session mit Philipp. Auslöser: der jüngste Hygiene-Zyklus produzierte drei PRs (coord-098, Brief 099, coord-099) für reine Markdown-Arbeit — Philipp empfand die PR-Last als zu hoch.

**Entscheidung.** Drei Modelle wurden mit Trade-offs vorgelegt (1 = Doku direkt auf `main`; 2 = ein PR pro Cowork-Session; 3 = Koordinations-Pässe gebündelt); Philipp wählte **Modell 1**. Ein PR ist ein Code-Review-/CI-Mechanismus; eine reine Doku-Änderung trägt kein Build-Risiko. Regel: ein Diff, der **nur** Markdown/Docs berührt (`sessions/**`, `sessions/README.md`, `brain/**`, `docs/**`, Top-Level-`*.md`), committet **direkt auf `main`** — kein Branch, kein PR. Ein Diff, der Code/Daten/Config berührt (`src/`, `scripts/`, `src/db/`, `package.json`, `.github/**`, Root-`*.config.*`), läuft weiter über Branch + PR. Mixed → PR. Klassifikator = Dateimenge, nicht Worktree. Ein code-übergebender Brief ist doc-only (direkt auf `main`); CC branched von `main`, implementiert, flippt `status: open → implemented` im Code-PR.

**Verankert in (diese vier Docs sind die Single Source — keine separate ADR-Page):**

- `CLAUDE.md` § Git — neue Subsektion „PR policy — docs land direct on `main`, code gets a PR" (autoritative Form mit allen Edge-Cases); die „`main` is read-only"-Zeile in § „Parallel worktrees" auf „read-only für Code-Arbeit" amendiert; Item 3 der Session-Start-Sequenz + der `fertig`-Block um die Doc-only-Ausnahme ergänzt.
- `AGENTS.md` § „Parallel worktree git protocol" — gespiegelter PR-Policy-Paragraph + dieselben Amendments (damit Codex die Regel sieht).
- `brain/wiki/workflows/cowork-session.md` — neue Sektion „PR policy — Cowork's output lands direct on `main`"; Handoff-Schritt 7 auf die Direkt-Commit-Übergabe umgestellt; `updated: 2026-05-25` + `CLAUDE.md` als Source.
- `brain/wiki/workflows/cc-session.md` — neue Sektion „PR policy — code gets a PR, docs don't"; `updated: 2026-05-25` + `CLAUDE.md` als Source.

**Companion / offene Punkte.** (a) `ci.yml` läuft `on: pull_request` only — Direkt-`main`-Commits durchlaufen kein `brain:lint`. Empfohlener Folge-Fix: `push: branches: [main]`-Trigger in `ci.yml` (selbst ein Code-Change → eigener PR). Bis dahin `brain:lint -- --no-write` lokal grün vor dem Doc-Push. (b) Branch-Protection: die Regel setzt voraus, dass `main` Direkt-Pushes annimmt — falls GitHub-Branch-Protection sie ablehnt, lockern oder den Doc-Change in den nächsten PR bündeln.

**No new decision page.** Per Maintainer-Scope in den vier Workflow-Docs verankert, nicht als separate `decisions/`-ADR. Lässt sich später zur ADR promovieren, falls sich die Policy als revisit-würdig erweist.

**Updated wiki:** `brain/wiki/workflows/cowork-session.md`, `brain/wiki/workflows/cc-session.md`, `index.md` (Katalog-Zeilen + Updated-Dates der zwei Workflow-Pages), this `log.md`. **Outside wiki:** `CLAUDE.md`, `AGENTS.md`.

**Out of scope:** Kein Code-Touch (auch nicht die `ci.yml`-Push-Trigger-Ergänzung — eigener Folge-PR), kein Schema/DB. Kein `brain:lint`-Run durch Cowork (Sandbox).

**Branch.** Diese Änderung ist selbst doc-only — der erste Anwendungsfall der neuen Regel: kein Branch, kein PR, direkt auf `main`. Philipp committet + pusht Windows-nativ.

---

## 2026-05-26 · Ingest + Architektur · Post-Merge-Koordinations-Pass (#100) + Cross-Era-Identitäten-ADR

Brief 100 (HH-Resolver-Domain-Öffnung) ist implementiert + gemergt — `origin/main` `b8aad31`. Der Headless-Resolver-Loop ist jetzt **zwei-domänen-fähig** (W40K + HH); Detektor liefert drei externe Terminal-Zustände (`open-wave | idle | all-complete`), der W40K→HH-Übergang ist interner Branch-Point innerhalb von `detectNextWave`. Live-Smoke gegen den realen Repo-Stand (W40K resolved durch Pass 9, 30/30 HH crystallized) liefert die erwartete Bootstrap-Welle `ssot-hh-001..002` (20 Bücher, Pass 10). EXPECTED_RANGES für HH-Headroom angehoben (`factions.max=2500`, `locations.max=1100`, `characters.max=2200`); Minima unverändert. `EXPECTED_RANGES.factions.max` damit über zwei Pässe von 2100 (Pass 9 Headroom-Sizing) auf 2500 gewachsen.

**CC-Entscheidungen (alle akzeptiert).** Variant A (statische `{domain, n}`-Tupel) für die Verify-Trias; HH-Tupel **nicht** pre-added — der Phase-4a-Trigger jeder zukünftigen HH-Welle fordert das Append per Welle, materielle Verify-Abdeckung erst nach dem ersten HH-Pass. `as const satisfies ReadonlyArray<…>` für die Tupel-Schema-Validierung (TS 5.x). Domain-Reihenfolge `["w40k", "hh"]` hartcodiert (HH-Cross-Era-Aliases hängen vom stabilen W40K-Reference-Layer ab). `HH_BOOTSTRAP_WAVE_TARGET=20`/`HARD_CAP=25` — mit Batch-Größe 10 ist der Cap das bindende Limit. Brief in den Code-PR portiert (lag in Cowork-primary-Worktree als untracked, nie auf git committed); Status-Flip auf `implemented` derselbe PR.

**W40K-Hardcode-Sweep negativ.** Über Brief 100 hinaus tragen `scripts/aggregate-surface-forms.ts`, `scripts/run-phase4-apply.sh`, `scripts/verify-pass.ts`, `scripts/run-resolver-pass.sh` keine W40K-Konstanten — Brief 100 OQ „weitere W40K-Hardcodes" ist damit negativ beantwortet, kein Folge-Cleanup nötig.

**Cross-Era-Identitäten — ADR gezogen.** Brief 100 § Baustein 3 hat die Modellierungs-Disziplin festgenagelt („eine kanonische Identität = eine Canonical-Row, Era-Surface-Forms als Aliases"), das Runbook §4 trägt die operative Spec (Faction-Rename, Character-Honor-Title-Split, Primarchen-Pattern, Disambig-Ausnahme). Cowork hat in diesem Koordinations-Pass eine schlanke ADR `decisions/cross-era-identities.md` ergänzt — Context/Decision/Why/Revisit-Trigger. Macht die Decision lange-archivierbar und gibt Revisit-Trigger, die in Brief 100 selbst nicht stehen.

**CLAUDE.md § Git — PowerShell-Konvention.** Auslöser: Cowork hatte Philipp wiederholt `git fetch && git pull`-Ketten gegeben, die in PowerShell 5.x mit `Das Token "&&" ist in dieser Version kein gültiges Anweisungstrennzeichen` brechen. Festgehalten als eigene Subsektion in `CLAUDE.md` § Git: git-Befehle für Philipp werden **immer zeilenweise** gegeben, niemals als `&&`-Kette; das alte Inline-`&&`-Beispiel im Übergabe-Hinweis entsprechend entschärft.

**Was diesem Pass NICHT angehört.** Der Trial-Lauf (operativ, Philipp triggert `run-resolver-loop.sh`), die HH-Sessions-Archive-Sweep-Frage (Brief 098/099 bleiben one-day-old in `sessions/`-Root, archiviert wird beim nächsten Sweep), der HH-Konsolidierungs-Pass-Folge-Brief (eigener schlanker Brief nach HH-complete). Keine OQ-Schließung, keine neue numerierte OQ — Brief 100 ist Maschinerie-Öffnung, keine OQ-Bewegung.

**Updated wiki:** `project-state.md` (Header + Phase + Branch + What's running + neue „Latest pipeline state (post-100)"-Sektion + Recently shipped + Next likely brief + § What's open), `pipeline-state.md` (Resolver-Layer-Subsektion zwei-domänen + EXPECTED_RANGES), `open-questions.md` (Header-Note 2026-05-26 post-100), `decisions/cross-era-identities.md` (neu), `index.md` (neue Decision-Zeile + bumped Updated-Dates), this `log.md`. **Outside wiki:** `CLAUDE.md` (PowerShell-Subsektion), `sessions/README.md` (Aktueller-Kopf + Brief-100-Zeile auf `complete — merged`).

**Out of scope:** Kein Code-Touch (Brief 100 ist erledigt; der Trial ist operativ). Kein Archive-Move 098/099/100 — separater Sweep, wenn die Pile genug für sich steht. Kein `brain:lint`-Run durch Cowork (Sandbox).

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-26 · Ingest · Post-Merge-Koordinations-Pass post-101 + Pass 10 (HH-Bootstrap-Apply)

Zwei zusammenhängende Code-PRs gemergt — und damit der **HH-Bootstrap in die DB**:

- **PR #106 — Brief 101 (Guard-Fix Reason-Split).** Cowork-Maintainer-Entscheidung 2026-05-26: aus drei vom Pass-10-Phase-4a-Halt angebotenen Pfaden Option 1 (Reason-Split) gewählt; Optionen 2 (domain-aware seal) + 3 (allowlist) explizit verworfen. Tight Diff: `scripts/apply-override-dry.ts:942-953` (Reason-Breakdown-Konsolenausgabe `by reason: out-of-range=N1, unknown-work=N2`, auch wenn beide 0) + `:979-1000` (Assertion auf `unresolvable.filter(u => u.reason === "unknown-work")` eingeschränkt, Kommentar-Block aktualisiert auf Brief-101-Semantik, Fehlermeldung ohne Reason-Suffix in der Liste) + `scripts/test-apply-override-collections.ts:19-24, 162-218` (Import `UnresolvableConstituentRef`-Typ, lokale `guardAbortRefs`-Predicate-Helper, drei Cases a/b/c). `apply-override-collections.ts` unangetastet (Reason-Klassifikation war bereits korrekt). `test:collection-refs` 10/0 (+3 von 7); volle Resolver-Trias grün; lint+typecheck pass. Brief 101 selbst mit `status: open → implemented` im Code-PR mit-portiert.
- **PR #105 — Resolver-Pass 10 (HH-Bootstrap-Apply, `ssot-hh-001..002`).** Erste HH-Welle in der DB — **works 565 → 585** (+20 HH-Bücher HH-0001..HH-0020). Sechs Phasen completed (eine Commit pro Phase). Phase 1-3 JSON-Reference-Schicht +6 factions / +10 locations / +60 characters / +9 aliases (4 Faction-, 3 Character-, 2 Cross-Era-Honor-Title); `faction-policy.json` specialCases 23→29. Cross-Era-Disziplin aus 100-Runbook §4 sauber gehalten: Luna Wolves→`sons_of_horus`, Mechanicum→`mechanicus`, Imperial Army→`astra_militarum`, Lucius→`lucius_the_eternal`, Ezekyle Abaddon→`abaddon_the_despoiler`. Phase 4a halt-disziplin-konform auf `## Needs decision` gestoppt (20 HH-Anthology→Constituent-Edges: HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156, HH-0016 → HH-0157..HH-0165 — brachen den über-strengen Brief-091-Guard auseinander, exakt der Pass-10-Dossier-§7d-Stop-Trigger). Brief 101 hat den Guard gefixt; Re-Run commit `42a6fad` clean auf der ersten Iteration (`test:apply-override-dry` `out-of-range=20, unknown-work=0`, `run-phase4-apply.sh` schreibt beide Batches). Counts PRE→POST (idempotenter Re-Apply `001..057 + hh-001..002`): `work_factions 1903→1981` (+78), `work_locations 733→776` (+43), `work_characters 1220→1325` (+105), `work_collections 147 (unverändert — out-of-range)`, `work_persons 524→541` (+17), `work_facets 11291→11672` (+381). Reference `factions 173→179` / `locations 224→234` / `characters 344→404`; Aliases faction 59→63, location 16→17, character 43→47. `facet_values 86→86` — keine Facet-Promotion. `persons.json 96→96` — alle 11 HH-Bootstrap-Author-/Editor-Slugs waren bereits aus dem W40K-Korpus präsent (`ensurePersonsExist: 0 newly created`). Phase 4b Verify-Digest clean: Smoke-Slugs `tales-of-heresy` HH-0010 mit 7f/2l/9c + `the-primarchs` HH-0020 mit 6f/1l/5c (`in_coll=0` auf beiden — Anthology-Constituent-Edges out-of-range, materialisieren auf Folge-Wellen); Rating-Coverage 20/20 für HH-0001..HH-0020 alle `rating_source=goodreads`; NEW-Range Audit-Replica HH-0001..HH-0020 `total_works=20`, `drift_works=15` (erwartet — Cross-Era-Alias-Resolving wirkt: `raw_name="Luna Wolves"` zeigt auf canonical `sons_of_horus` etc.), `gap_works=2` (Data-Findings, dünne Metadata-Achsen — kein 4a-Fehler), `content_in_collection=0` (konsistent). OLD-Range HH-0001..HH-0000 invertierter Boundary by construction (alle null — kein prior HH-Baseline).

**Cross-Era-ADR operativ validiert.** Die ADR `decisions/cross-era-identities.md` (Brief 100) hat in der ersten HH-Welle getragen — 15/20 `drift_works` sind Surface-Forms, die auf eine kanonische W40K-Row resolved haben (Faction-Renames, Character-Honor-Title-Splits, Primarchen-Pattern); `factionsSkippedRedundant`-Bucket bleibt für Cross-Era-Hits leer (Aliases resolven, kein Skip). Keine echte Identitäts-Disambig getriggert → kein `## Needs decision`-Stop in der Phase-Statusdatei. ADR um einen kurzen Status-Halbsatz „erste HH-Welle (Pass 10) hat die Disziplin operativ validiert" ergänzt.

**Out-of-range materialisiert auf Folge-Wellen.** Die 20 HH-Anthology→Constituent-Edges sind als deferred edges geparkt — `applyCollections` re-evaluiert die Kante idempotent, sobald die spätere Welle den Constituent in die kumulative Apply-Range bringt; keine Roster-Maintenance-Edits, kein `collection-gaps.json`-Eintrag nötig (das ist exakt das Erfolgs-Pattern der W40K-Anthology-Forward-Refs aus Pass 6: Sanctus Reach, Damocles, Shield of Baal). `work_collections` tickt entsprechend in den Folge-HH-Wellen hoch, sobald HH-0117..HH-0120 / HH-0150..HH-0156 / HH-0157..HH-0165 appliziert sind.

**Keine OQ-Schließung, keine neue numerierte OQ.** Brief 101 ist Maschinerie-Fix, Pass 10 ist Daten-Welle — keine adressiert OQ (3) Hand-Check-Workflow oder OQ (13) Crawl-Simplification-Sichtung. Die 2 gap_works aus Phase 4b sind als Watch-Item in `project-state.md` § What's open geparkt (Data-Findings, keine numerierte OQ). Brief 101 § Open questions hat einen `verify-pass.ts`-Out-of-Range-Count-Vorschlag — Implementer-Read: lohnt einen schmalen Folge-Brief bzw. Bündel mit dem HH-Konsolidierungs-Folge-Brief.

**Updated wiki:** `project-state.md` (Header + Phase + Branch + What's running + neue „Latest pipeline state (post-101 / Pass 10)"-Sektion + Recently shipped + § What's open), `pipeline-state.md` (Resolver-Layer-Subsektion post-101 / Pass 10 + What's-next-Liste), `open-questions.md` (Header-Note 2026-05-26 post-101 / Pass 10), `decisions/cross-era-identities.md` (Status-Halbsatz „first wave validated"), `index.md` (bumped Updated-Dates), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf + Brief-101-Zeile auf `complete — merged` + Pass-10-Zeile).

**Out of scope:** Kein Code-Touch (Brief 101 + Pass 10 sind erledigt; die HH-Restwellen sind operativ via `run-resolver-loop.sh`). Kein Archive-Move 098/099/100/101 — separater Sweep, wenn die Pile genug für sich steht. Kein `brain:lint`-Run durch Cowork (Sandbox).

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-27 · Ingest · Post-Merge-Koordinations-Pass post-PR-107 (Resolver-Loop 5 Wellen — Korpus datenkomplett)

PR #107 (Resolver-Loop: 5 wave(s) HH `ssot-hh-003..030`, Pässe 11–15 auf branch `codex/ingest-batches-resolver-loop-hh`) ist gemergt. Erster echter headless Mehr-Wellen-Lauf des `run-resolver-loop.sh`-Drivers — fünf clean Two-Domain-Pässe in Folge ohne `## Needs decision`-Stop und ohne facetId-Strips, exakt der Brief-100-Forecast 60/60/60/50/44 Bücher. **Damit ist der Korpus datenkomplett: 859/859 (565 W40K + 294 HH); der Resolver-Loop emittiert `all-complete`.**

**Read (raw sources):**

- `sessions/resolver-loop-log.md` — Pässe 11–15 Block-Anhänge mit allen 6 Phasen-SHAs je Welle (Phase 0 Preflight, Phase 1 Factions, Phase 2 Locations, Phase 3 Characters, Phase 4a Apply, Phase 4b Verify).
- `sessions/resolver-dossiers/resolver-pass-15-impl-report.md` — die finale 4b-Sammelung mit Apply-Digest + Verify-Digest + Maintainer-Handoff + For-next-session (canonical Read; die fünf Phase-Reports werden hier roll-up gemacht).
- `sessions/resolver-dossiers/resolver-pass-11-impl-report.md`, `-12-`, `-13-`, `-14-` — per-Pass-Impl-Reports (nicht im Detail re-derived; die Counts-Tabelle in Pass 15 zeigt die kumulative Bewegung).
- `scripts/seed-data/book-roster.json` (HH-Max-ID HH-0294, 294/859 Bücher) + `scripts/seed-data/manual-overrides-ssot-hh-*.json` (30 Override-Files, ssot-hh-030 trägt HH-0291..HH-0294 = 4 Bücher artbook/scriptbook tail).
- `scripts/resolver-loop-detect.ts` — verifiziert dass die Terminal-Bedingung `all-complete` greift bei `hhProgressBatch === 30` und `hhRosterCount === 294` (verified empirically via roster-count + override-file-count; die `~10 books remaining`-Aussage im Pass-15-impl-Report ist ein Forecast-Artefakt aus der Dossier-§1 / §7d, das vor dem letzten 4-Buch-Batch ssot-hh-030 generiert wurde — die Realität ist HH-domain-sealed bei HH-0294).

**Counts post-Pass-15-Re-Apply `001..057 + hh-001..030` (859 works):**

- works `565 → 859` (+294 = volle HH-Domäne), work_factions `1981 → 2752` (+771), work_locations `776 → 1144` (+368), work_characters `1325 → 1992` (+667), work_collections `147 → 196` (+49 — die deferred Anthology-Constituent-Edges aus Pass 10 sind durch die Folge-Wellen materialisiert), work_persons `541 → 785` (+244 HH-Author-Slugs via `ensurePersonsExist`; `persons.json` JSON-side unverändert 100), work_facets `11672 → 16845` (+5173).
- Reference: factions `179 → 202` (+23), locations `234 → 288` (+54), characters `404 → 491` (+87); aliases faction `63 → 73` (+10 ca., zusammen über die fünf Pässe), location `17 → 25` (+8 ca.), character `47 → 64` (+17 ca.). `facet_values 86 → 86` — keine Facet-Promotion über die fünf Wellen.
- EXPECTED_RANGES: nur **eine** quantitative Re-Tune über die fünf Pässe — `locations.max 1100 → 1500` in Pass 15 (Pass-14-forecasted Bump, ~24% post-bump headroom). factions cap `3200` (2754 ≈ 14% headroom) und characters cap `2200` (1992 ≈ 9% headroom — der tightest bound nach Pass 15) ohne Re-Tune.

**Cross-Era-ADR über den vollen HH-Korpus gehärtet.** Über die fünf Wellen 11–15 trugen Cross-Era-Aliases robust — `factionsSkippedRedundant`-Bucket bleibt für Cross-Era-Hits leer (Aliases resolven auf eine Canonical-Row, kein Skip), keine echte Identitäts-Disambig getriggert (kein `## Needs decision`-Stop), Pass-12 hat Cross-Era-Honor-Title-Splits für `Bjorn` (Pre-Dreadnought-Honor-Title-Variante auf `bjorn` Alias-Mapping in Pass 11 anticipated, in Pass 15 Case B `Bjorn the One-Handed → bjorn` consolidated) und `Lord Cypher → cypher` (Cross-Era Heresy-era-Dark-Angels-title-character → post-Heresy `cypher` Fallen-Lord-of-the-Fallen alias) sauber gelandet. ADR `decisions/cross-era-identities.md` um „HH-domain hardened: 2026-05-27"-Halbsatz ergänzt.

**Deferred-Edge-Pattern (Brief 100/101) trägt über den vollen Re-Apply.** Die 20 Pass-10-Anthology→Constituent-Edges aus den drei HH-Anthologien (HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156, HH-0016 → HH-0157..HH-0165) sind idempotent über die Folge-Wellen materialisiert — Pass 11/12/13 haben die HH-0117..HH-0120 / HH-0150..HH-0156 / HH-0157..HH-0165-Constituents in den kumulativen Re-Apply gebracht; `work_collections` ist von 147 (Pass 10) auf 196 (Pass 15) gewachsen, exakt das Brief-101-Erfolgs-Pattern (Sanctus Reach / Damocles / Shield of Baal analog für HH). OLD-Range HH-0001..HH-0250 cumulative `content_in_collection=49` per Verify-Digest Pass 15.

**Wave-Größen exakt nach Brief-100-Forecast.** Pass 11 (60: ssot-hh-003..008, HH-0021..HH-0080), Pass 12 (60: ssot-hh-009..014, HH-0081..HH-0140), Pass 13 (60: ssot-hh-015..020, HH-0141..HH-0200), Pass 14 (50: ssot-hh-021..025, HH-0201..HH-0250), Pass 15 (44: ssot-hh-026..030, HH-0251..HH-0294). Pass 15 ist der HH-audio-drama + artbook/scriptbook-Tail (ssot-hh-026..029 first-cycle Heresy-audio-drama-Bloc, mid-Heresy Legion-Vignette + Pharos / Sicarus / Tallarn + Endryd-Haar Blackshields-trilogy; ssot-hh-030 4-Buch-Tail Collected Visions / Scripts Volume I+II / Visions of Heresy 2018 ed.). Der Loop-Helper-Detektor signalisiert jetzt `all-complete` — beide Domains sealed.

**Was diesem Pass NICHT angehört.** Der HH-Konsolidierungs-Folge-Brief (wartet auf Cowork — Maschinerie aus Brief 098 existiert, der HH-Lauf braucht nur HH-spezifische Kandidaten-Heuristiken; potenzieller Bündel-Kandidat: Brief 101 § Open questions `verify-pass.ts`-Out-of-Range-Count). Pass-15-impl-For-next-session-Items als Watch-Items in `project-state.md` § What's open: Audit-Cockpit-Drift/Gap-Follow-up über die HH-Domäne (Data-Quality-Cycle, nicht Resolver-Pass); characters-cap Re-Tune `2200 → ?` post-Konsolidierung. Sessions-Archive-Sweep für 100/101 + die fünf neuen Pass-11..15-Dossiers — separater Sweep, wenn die Pile genug für sich steht.

**Keine OQ-Schließung, keine neue numerierte OQ.** Die fünf Pässe sind Daten-Wellen ohne Architektur-Call; der HH-Restwellen-Punkt (operativ, kein Brief — bis vor PR #107 in `project-state.md` § What's open Top-Tier) ist erledigt durch die Wellen selbst. Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Updated wiki:** `project-state.md` (Header + Phase + Branch + What's running + neue „Latest pipeline state (post-PR-107)"-Sektion + Recently shipped + § What's open + Next likely brief), `pipeline-state.md` (Header-Title + Intro-Blockquote post-PR-107), `open-questions.md` (Header-Note 2026-05-27 post-PR-107), `decisions/cross-era-identities.md` (Status-Halbsatz „HH-domain hardened"), `index.md` (bumped Updated-Dates + Beschreibungen project-state/open-questions/pipeline-state/cross-era-ADR), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf + neue Resolver-Loop-Zeile auf `complete — merged`).

**Out of scope:** Kein Code-Touch (PR #107 ist erledigt; die HH-Konsolidierung ist Cowork-side ein eigener Folge-Brief). Kein Archive-Move 100/101/Pass-11..15-Dossiers. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

---

## 2026-05-27 · Ingest · Post-Merge-Koordinations-Pass post-PR-108 (Brief 102 HH-Konsolidierungs-Pass — Korpus datenkomplett + konsolidiert)

PR #108 (HH-Konsolidierungs-Pass / Brief 102 impl, branch `codex/ingest-batches-hh-consolidation-pass`, 7 Commits c01a795..037b618) ist gemergt. **Korpus ist datenkomplett (859/859) und jetzt über beide Domänen konsolidiert.** Brief-094-§-Cadence-Bogen geschlossen — verpflichtender finaler Konsolidierungs-Pass nach HH ist gefahren; künftige Konsolidierungs-Pässe sind ad-hoc.

**Read (raw sources):**

- `sessions/2026-05-27-102-impl-hh-consolidation-pass.md` — canonical Impl-Report (32k bytes), six-phase-Doku + Field-Retention-Tabellen pro Merge + Cap-Re-Tune-Rechnung + Verify-Bolt-on-Manual + Antworten auf alle fünf Brief-102-§-Open-questions.
- `sessions/2026-05-27-102-arch-hh-consolidation-pass.md` — Brief 102 selbst (`status: open → implemented` im Code-PR mit-portiert).
- `sessions/resolver-dossiers/consolidation-pass-2-*.{md,json}` — sechs Pass-2-Artefakte (dossier mit allen drei Achsen-Sektionen + Merge-/No-Merge-Adjudikationen, aggregator-output mit den 23 Kandidaten-Clustern, dry-run-plan mit Stage-Plan + Tier-Split, db-snapshot pre-mutation, merge-map mit den 2 keeper↔mergee-Paaren, reference-premerge-snapshot der zwei gelöschten Character-Rows).
- `scripts/consolidation-pass-2.config.json` — dedizierte Pass-2-Config mit `applyRanges: [{w40k 1..57}, {hh 1..30}]`, alle Artefakt-Pfade unter `consolidation-pass-2-*`.
- `scripts/consolidation-aggregate.ts` (Phase 0 Aggregator-Erweiterung), `scripts/resolver-pass-config.ts` (Multi-Range-Loader-Normalisierung), `scripts/run-phase4-apply.sh` (Range-Liste-Expansion), `scripts/verify-pass.ts` (Out-of-Range-Bolt-on), `scripts/apply-override-dry.ts` (`EXPECTED_RANGES.characters.max 2200 → 2500`), `scripts/test-resolver.ts` (Merir-Astelan-Test von direct-match auf alias-resolved umformuliert).

**Pass-2-Ergebnis (canonical):**

- **23 Kandidaten-Cluster → 2 Merges, 21 No-Merges, 0 Flagged.** Beide Merges auf der Characters-Achse:
  - **Merge 1 (Lore-Deep-Tier, cross-era):** `merir_astelan → astelan`. HH-era Dark-Angels-Captain (Pass-13 *Call of the Lion*) IST der W40K-era Fallen Angel Astelan. Chronologisch-pre-ADR-Carryover: Pass-13 lief vor dem Brief-100-ADR-Beschluss. Keeper-Wahl `astelan` per Cross-Era-Identities-ADR-Pattern (W40K-canonical short-form). Field-Retention keeper-wins (`primary_faction_id=fallen_angels` retained, ADR-konform); HH-era pre-fall Affiliation via cross-era-coherent notes-Rewrite captured.
  - **Merge 2 (Mechanical-Tier, same-era):** `sharrowkyn → nykona_sharrowkyn`. Pass-11 (*Angel Exterminatus*) und Pass-13 (*Kryptos*) haben unabhängig denselben Raven-Guard-Mor-Deythan-Charakter mit verschiedenen Surface-Forms angelegt — klassen-identisch zu Pass-1 `magister_sek → anakwanar_sek`. Keeper-Wahl `nykona_sharrowkyn` (Lexicanum-canonical-Form); notes-Merge.
- **Wichtigster Befund — positive Brief-100-ADR-Validation.** Cross-era-anchor-breach Aggregator-Tripwire (Re-Annotation auf alias-coincidence-Edges) = **0 Treffer** über alle 18 pinned Cross-Era-Surface-Forms (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel). Die eine Cross-Era-Merge `merir_astelan→astelan` ist Disziplin-Drift im engeren Sinn (Pre-ADR-Carryover, kein laufender Trend).
- **Drei HH-aware Aggregator-Klassen scharfgeschaltet.** (a) Slug-edit-distance auf locations (Schwellen `distance≤2 AND ratio≤0.25 AND min-len≥4` — `vigilus↔vigil` triggert deliberat nicht): 1 trigger `barbarus↔tartarus` als false-positive (Tags-Disjunktheit `["death_guard"]` vs `[]` als Adjudikations-Marker). (b) Cross-era-anchor-breach als Re-Annotation auf alias-coincidence-Edge (3 Zeilen Code statt eigener Edge-Klasse, semantisch äquivalent): 0 trigger = gewünschtes Falsch-Negativ-Ergebnis. (c) Primarch-stem auf characters (22 endliche Stems hart-kodiert, Brief 102 § Constraints (c) erlaubte das explizit): 1 trigger `horus↔horus_aximand` als false-positive (Primarch ↔ Captain-named-after-Primarch, klassen-analog Planet ↔ Ship-named-after-Planet). Aggregat-Befund: alle drei sind Tripwires (negative-validate), nicht True-Positive-Mining-Tools — beide Merges via Pass-1-Base-Heuristiken.

**Counts post-Pass-2-Re-Apply + DB-Sync (859 works):**

- Reference: characters `491 → 489` (-2 mergees gelöscht), character-aliases `64 → 66` (+2 neue Einträge); factions `202` / locations `288` / faction-aliases `73` / location-aliases `25` / facet_values `86` alle unverändert (Pass 2 ist Cross-Wave-Reference-Dedup, keine Facet-Promotion).
- DB-Junctions: work_factions `2752 → 2754` (+2 re-apply-Drift), work_locations `1144 → 1145` (+1), **work_characters `1992 → 1997`** (+5 = re-pointed Junctions auf die zwei Keepers via neue Aliases: `astelan` 5→6 = +1 von merir_astelan, `nykona_sharrowkyn` 1→3 = +2 von sharrowkyn). work_collections `196` / work_persons `785` / work_facets `16845` alle unverändert. Orphan refs 0, residue 0, keeper-notes korrekt.
- **`EXPECTED_RANGES.characters.max 2200 → 2500`** (Brief-102-Cap-Re-Tune; ~25% headroom über work_characters=1997, Pass-15-locations-Pattern). factions cap `3200` (2754 ≈ 14% headroom) und locations cap `1500` (1145 ≈ 24% headroom) unangetastet.

**Multi-Range-Loader-Normalisierung — Singleton bleibt schreibbar, Liste ist canonical-Lese-Form.** `AggregatorConfig` um optionales `applyRanges: ApplyRange[]` erweitert; `normalizeApplyRanges()` wirft Hard-Error bei beidem (Mehrdeutigkeit als Konfig-Bug), normalisiert Singleton → `[r]`. Pass-1-Config + per-wave-resolver-Configs schreiben weiterhin `applyRange` (Singleton); der Loader normalisiert intern. `run-phase4-apply.sh` inline `apply_batches()`-Helper liest beide Formen, expandiert über die Range-Liste; CLI unverändert.

**`verify-pass.ts`-Out-of-Range-Bolt-on (Brief 101 § Open questions gefaltet).** Position am Ende des `main()`-Body hinter einem `if (verify)`-Guard (config-agnostisch — Per-Wave-Resolver-Configs mit verify + Konsolidierungs-Pass-Configs ohne verify). SQL `LIKE ANY (ARRAY['W40K-%','HH-%'])` aus den Domain-Prefixes; zählt `work_collections`-Rows wo Constituent's `external_book_id` außerhalb der ApplyRanges-Union liegt. Pass-2-Lauf: `out_of_range_count=0` ✓ (Full-Corpus-Tripwire grün am datenkomplettem Korpus — exakt das Brief-101-Erfolgs-Pattern, das deferred-edge-Materialisierung über die HH-Wellen 11–15 vorhergesagt hat). Per-wave HH-only-Config-Lauf als Sanity-Check: `147` (W40K-Constituents außerhalb der HH-only-Range, informational für per-wave-configs).

**Brief-094-§-Cadence-Bogen geschlossen.** Pass 2 war laut Brief 094 § Cadence der **verpflichtende finale Konsolidierungs-Pass nach der HH-Domäne** — Maschinerie zum zweiten Mal gefahren, beide Domänen sealed + konsolidiert. Künftige Konsolidierungs-Pässe sind ad-hoc (Polish-/Refinement-/neuer-Domain-getrieben), nicht mehr im Cadence-Default.

**Was diesem Pass NICHT angehört (alle out-of-scope, durable in § What's open):** (i) Aggregator-Refinement-Pass-3 — auto-no-merge-rationale für `tags:vessel↔planet` (3 false-positives in Pass 2) + `primarch-stem↔captain-named-after-primarch` (1 false-positive); langfristig, lohnt erst beim nächsten Konsolidierungs-Pass. (ii) Audit-Cockpit-Drift/Gap-Sweep über die kumulativ ~148 drift_works + ~98 gap_works über die HH-Domain — eigener Data-Quality-Brief, **Top-Empfehlung für den nächsten Brief**. (iii) `consolidation-aggregate.ts` HH-Heuristik-Doku im Code-Header (Master-Block am Datei-Anfang). (iv) Codex-Review-Sicht auf den Pass-2-Cross-Era-Identity-Handhabungs-Diff. (v) Sessions-Archive-Sweep für 100/101/102 + Pass-11..15-Dossiers + consolidation-pass-2-* — Pile baut sich auf, separater Hygiene-Pass analog Brief 099.

**Keine OQ-Schließung, keine neue numerierte OQ.** Pass 2 ist Maschinerie-Lauf ohne Architektur-Call. Die in Brief 102 § Open questions adressierten fünf Fragen sind alle im 102-impl beantwortet (Cross-Domain-Doublette-Zählung 1/23 = 4.3% niedriger als Pass-1 13%, Heuristik-Klassen-Tragfähigkeit als Tripwires statt Mining-Tools, Cap-Re-Tune-Prozent 25% relativ-Count-frei, Verify-Pass-Position am main()-Ende mit if(verify)-Guard + eigener Block am Digest-Ende, Token-Budget stabil — Cluster-Anzahl skaliert nicht mit Reference-Bestand). Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Cross-Era-ADR um „HH-domain post-consolidation hardened: 2026-05-27"-Halbsatz ergänzt.** Brief 102 § Notes hat den Halbsatz angekündigt; CC hat den Vorschlag im Impl-Report formuliert; Cowork hat ihn in den ADR-Status-Header genommen (zusätzlich zu „HH-domain hardened: 2026-05-27" aus dem post-PR-107-Pass).

**Updated wiki:** `project-state.md` (Header + Phase + Branch + What's running + neue „Latest pipeline state (post-PR-108)"-Sektion + Recently shipped + § What's open + Next likely brief), `pipeline-state.md` (Header-Title + Intro-Blockquote post-PR-108), `open-questions.md` (Header-Note 2026-05-27 post-PR-108), `decisions/cross-era-identities.md` (Status-Halbsatz „HH-domain post-consolidation hardened" + Pass-2-Sources), `index.md` (bumped Updated-Dates + Beschreibungen project-state/open-questions/pipeline-state/cross-era-ADR + neue Brief-102-Reihe in Sessions-Catalog-Hinweis), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf + Brief-102-Zeile auf `complete — merged`).

**Out of scope:** Kein Code-Touch (PR #108 ist erledigt; alle Watch-Items sind eigene Folge-Briefs). Kein Archive-Move 100/101/102/Pass-11..15/consolidation-pass-2-*. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-28 · Ingest · Post-Merge-Koordinations-Pass post-PR-109 (Brief 103 Daten-Pass — Audit-Helper + 2 Pilot-Backfills)

PR #109 (Brief 103 Daten-Pass, branch `codex/ingest-batches-audit-pilot`) ist gemergt. **Korpus bleibt datenkomplett + konsolidiert (859/859).** Brief 103 ist als Strang-Split angelegt (UI-Pass im Product-Worktree + Daten-Pass im Batches-Worktree, parallel und unabhängig); PR #109 deckt die Daten-Pass-Hälfte ab — der UI-Pass läuft separat im `chrono-lexicanum-product`-Worktree als nächster CC-Job. Brief 103 selbst trägt `status: implemented` (CC hat im PR-109-Commit geflippt — Brief-103-§-Notes idempotent-Konvention erlaubt das, der UI-Pass kann den Status halten).

**Read (raw sources):**

- `sessions/2026-05-28-103-impl-data-audit-drift-gap-sweep.md` — canonical Daten-Pass-Impl-Report (135 Zeilen): Summary + What I did (Helper-Skript / HH-0260 / HH-0270 / Brief-Status-Flip) + Decisions I made + Verification (Pre-State / Post-State / alle 8 Test-Suites) + Open-Questions-Antworten (1+4 vom Brief; 2/3/5/6 sind UI-Pass-Themen) + For next session (Maintainer-Excel-Sweep-Pilot / Cockpit-Audit-Detailseite / Pelago-Tags-Review / Audit-Helper-Output-Persistenz).
- `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md` — Brief 103 selbst (`status: open → implemented` im Code-PR mit-portiert).
- `scripts/audit-gap-candidates.ts` — neu (246 Zeilen, read-only SQL über `works ⨝ book_details`, deterministisch sortiert).
- `ingest/.last-run/audit-gap-candidates.md` — neuer Markdown-Snapshot (325 Kandidaten).
- `scripts/seed-data/manual-overrides-ssot-hh-026.json` — HH-0260 character-Array um Russ + Alpharius als `mentioned` erweitert (2 Zeilen Diff).
- `scripts/seed-data/locations.json` — neuer Anchor `pelago` (oceanic Backwater, `tags=["space_wolves"]`).
- `scripts/seed-data/characters.json` — neuer Anchor `koparnos` (Iron-Warriors-Warsmith, `primaryFactionId="iron_warriors"`).
- `package.json` — neuer Script-Eintrag `"audit:gap-candidates": "tsx --env-file=.env.local scripts/audit-gap-candidates.ts"`.

**Pass-Ergebnis (canonical):**

- **`audit:gap-candidates`-Helper:** SQL über `works ⨝ book_details` mit `kind='book' AND (format IS NULL OR format <> 'audio_drama') AND (factions=0 OR locations=0 OR characters=0)`. Output deterministisch sortiert (`external_book_id ASC, slug ASC`), gibt pro Buch `external_book_id`, `slug`, `title`, `format`, `f/l/c`-Counts, `confidence` plus Summary-Block (`total`, `by domain`, `by axis`). Schreibt zusätzlich Markdown-Snapshot nach `ingest/.last-run/audit-gap-candidates.md`. Kein DB-Write, kein Override-Touch, kein Resolver-Trigger. Idempotenz verifiziert (zwei konsekutive Läufe byte-identisch).
- **Helper-Raw-Output:** **325 Kandidaten** (HH=73, W40K=252 — ~78 % W40K-konzentriert). Achsen-Breakdown: `factions=0 → 29`, `locations=0 → 228`, `characters=0 → 194` (Bücher können in mehreren Achsen zählen). Spitze des Eisbergs: viele frühere W40K-Paperbacks (Cain-Reihe `W40K-0012..0019`, Necromunda-Reihe `W40K-0163..0180`, Warhammer-Horror `W40K-0492..0527`) mit `confidence=1.00` haben locations=0 oder characters=0, weil die ursprüngliche Lexicanum-/OL-Crawl-Pipeline für diese Domäne dünner aufgesammelt hat.
- **Brief-103-Forecast-Korrektur:** der Brief-Forecast "~10–20 echte fixable" galt für die post-Triage-Subset (Maintainer-Excel-Sweep-Output), nicht den Helper-Raw-Output. Die rohe Liste ist breiter — laufender Maintainer-Workflow filtert pro Buch, ob die fehlende Achse explizit benannte Lore-Anker hat (fixable) oder die strukturelle sparse-axis-Form eines Audio-Dramas/Single-Scene-Arc ist (nicht fixable, expected).
- **Pilot-Backfill HH-0260 *Hunter's Moon* (Welle `ssot-hh-026`).** Pre-State `f=2 / l=0 / c=0`. Halluzinations-Schutz nach Brief 103 § Notes: nur kanonisierungsfähige Anker promoten. Promoted: Russ + Alpharius als `mentioned` (freq-3 Primarchen-Anchors aus Pass 10, wörtlich in der Synopsis benannt) + neuer `pelago`-Location-Anchor (`tags=["space_wolves"]` für den Vlka-Fenryka-Watcher-Lore-Anker, mirror der Pass-15-Pattern `nuceria: ["world_eaters"]` / `tallarn: ["astra_militarum"]`). NICHT promoted: Tidon/Ven/Sareo/Felbjorn (story-spezifische 60-Min-Audio-Drama-Minor-Cast — Single-Mention-Bloat-Vermeidung, die `low_confidence:characters`-Begründung aus Pass-15-Dossier §6 trägt sich qua Resolver-Skip). Post-State `f=2 / l=1 / c=2`. Override-Diff = 2 Zeilen; Reference-JSON-Add = 1 Zeile.
- **Pilot-Backfill HH-0270 *Iron Corpses* (Welle `ssot-hh-027`).** Pre-State `f=1 / l=1 / c=0`. Synopsis nennt nur Koparnos (Iron-Warriors-Warsmith, sole POV). Promoted: neuer `koparnos`-Character-Anchor (`primaryFactionId="iron_warriors"`). Override-File HH-0270 bleibt unverändert (Resolver greift den bestehenden `{ "name": "Koparnos", "role": "pov" }`-Eintrag, sobald der Anker steht). Post-State `f=1 / l=1 / c=1`. Override-Diff = 0 Zeilen; Reference-JSON-Add = 1 Zeile.
- **NEW-Range gap_works im `verify-pass.ts`-Digest: 18 → 16** (-2 = HH-0260 + HH-0270, exakt der Brief-Forecast). NEW-Range drift_works 25 (unverändert — Drift-Achse nicht angefasst). OLD-Range (`HH-0001..HH-0250`) `gap_works=80` (unverändert), `drift_works=125` (unverändert). Smoke-Slugs: HH-0260 `f=2/l=1/c=2`, HH-0270 `f=1/l=1/c=1`, HH-0280 `f=2/l=2/c=1`, HH-0290 `f=2/l=0/c=2`, HH-0294 `f=20/l=4/c=3`. Rating coverage (`HH-0251..HH-0294`): 44/44 rated, `goodreads=44`.
- **Out-of-Range-Tripwire = 147** — Artefakt der HH-only `applyRange` im Pass-15-Config gegen den post-Brief-102 Full-Corpus-DB-Stand (Brief-102 Cross-Domain-Boundary-Logik erwartet 0 nur bei Multi-Range-Configs wie `consolidation-pass-2.config.json`). Keine Regression durch diesen PR.

**Counts post-Brief-103-Daten-Pass:**

- **Reference:** locations `288 → 289` (+1 `pelago`), characters `489 → 490` (+1 `koparnos`); factions `202` / faction-aliases `73` / location-aliases `25` / character-aliases `66` alle unverändert (kein Alias-Add, nur zwei neue Canonical-Rows); `facet_values=86` unverändert.
- **DB-Junctions:** work_factions `2754` (unverändert), work_locations `1145 → 1146` (+1 — HH-0260 trägt Pelago), work_characters `1997 → 1999` (+2 — HH-0260 trägt Russ + Alpharius, HH-0270 trägt Koparnos; tatsächlicher `test:resolver-coverage`-Output zeigt `characters=2000/2526` — die kleine Abweichung ist re-apply-Drift). work_collections `196`, work_persons `785`, work_facets `16845` alle unverändert.

**Tests grün (sequentially executed):** `npm run typecheck` ok; `npm run lint` 0 errors + 1 pre-existing Warning (`no-page-custom-font` in `src/app/layout.tsx`, Brief 103 § Notes flagt sie explizit); `npm run brain:lint -- --no-write` 0 blocking + 25 pre-existing Warnings (inline-diff=2, brain-size=4, stale-claim=13, faction-policy=6); `npm run test:apply-override-dry` ok (`out-of-range=0, unknown-work=0`); `npm run test:resolver` **473 passed / 0 failed**; `npm run test:resolver-data` 10/10 inkl. neuer `coverage smoke slugs exist in w40k-001..057 + hh-001..030`-Check; `npm run test:resolver-coverage` Below-threshold-Zeilen als Data-Findings (Totals `factions=2754/3101, locations=1146/1458, characters=2000/2526`); `npm run test:collection-refs` 10/10 inkl. Brief-101-Reason-Split-Cases.

**CC-Entscheidungen aus 103-Daten-impl (alle akzeptiert):**

- Audio-Drama-Filter im Helper als SQL-Klausel (nicht Application-Layer-Filter) — deterministische Ordnung gratis, kein Round-Trip.
- Markdown-Snapshot nach `ingest/.last-run/audit-gap-candidates.md` (etablierter Diff-Pfad für read-only Pre/Post-Snapshots, Brief 102 `phase4-digest.md` lebt dort) statt audit-eigener Pfad — keine neue Verzeichniskonvention.
- Pelago-Tags konservativ `["space_wolves"]`, nicht `["space_wolves", "alpha_legion"]` (Vlka Fenryka als einzige strukturelle Faction-Präsenz, Alpha Legion nur als abgestürzter Stormbird; mirror Pass-15-Pattern). Cowork-Note: optional auf `["space_wolves", "alpha_legion"]` erweiterbar (Single-Line-Edit), Drift/Gap-Verhalten unverändert.
- Story-Chars Tidon/Ven/Sareo/Felbjorn NICHT promoten (Halluzinations-Schutz / Single-Mention-Audio-Drama-Minor-Cast / Bloat-Vermeidung). Russ + Alpharius dagegen promoten (freq-3 Primarchen-Anchors, gratis-Anker konsistent mit Pass-10-Primarchen-Spine-Promotion).
- Koparnos vollkanonisch promoten statt als Mention zu kürzen (POV-Charakter eines Iron-Warriors-fokussierten Audio-Dramas mit klarem Tallarn-Anchor; Iron-Warriors-Charakter-Liste hat freq-1-Promotionen schon mehrfach in Pass 15 — `bulveye`, `erud_vahn` etc.).
- Helper-Skript laufzeit-strict gegen Brief-103-Spec (kein „smart"-Filter via confidence-Schwelle oder Single-Axis-Heuristik). Maintainer-Excel-Sweep verfeinert 325 → ~10–20.
- Tight Diff: drei Daten-Files (`locations.json`, `characters.json`, `manual-overrides-ssot-hh-026.json`), ein neues Skript (`audit-gap-candidates.ts`), ein `package.json`-Eintrag, ein Brief-Status-Flip, ein Impl-Report. Kein UI-Touch (out-of-scope), kein `brain/**`/`sessions/README.md`-Touch (Brief 095 Rollup-Ownership), kein Resolver-Skript-Touch.

**Watch-Items aus dem 103-Daten-impl For-next-session (alle out-of-scope für diesen Pass, durable in `project-state.md` § What's open):**

- (i) **Maintainer-Excel-Sweep-Pilot.** Mit `audit:gap-candidates` ist die Triage-Liste 1-Befehl-reproduzierbar. Empfehlung des Impl-Reports: Cowork zieht in der nächsten Session einen Subset von HH-Domain-Kandidaten (73 Bücher, viele Single-Axis-`factions=0`-Fälle mit unresolved Surface-Forms) und probiert den Sweep-Workflow gegen 5–10 Beispiele. Wenn die Brief-103-Forecast-Subset von ~10–20 echt fixable ist, sind das laut Pro-Pilot-Effort-Schätzung 2–4 h Arbeit.
- (ii) **Cockpit-Audit-Detailseite** — Brief 103 § UI-Pass als „optional" markiert. Wenn der UI-Pass die Sub-Sort sichtbar macht (Drift-Tie-Group-via-`Luna Wolves`×12-Anzeige), könnte die Detailseite analog die Top-Gap-Achse anzeigen ("Buch hat `locations=0`; Synopsis nennt: Tallarn, Pelago, …"). Out-of-Scope hier, Material für einen Folge-Brief, der UI + Daten verzahnt.
- (iii) **Pelago-Tags-Review.** Konservativ `["space_wolves"]` getaggt; Cowork-Optionsfrage: `["space_wolves", "alpha_legion"]` analog Calth mit `["ultramarines", "word_bearers"]`. Single-Line-Edit, Drift/Gap-Verhalten unverändert.
- (iv) **Audit-Helper-Output-Persistenz.** `ingest/.last-run/audit-gap-candidates.md` wird pro Lauf überschrieben. Für Time-Series-Verlauf wäre `ingest/audit-snapshots/YYYY-MM-DD-gap-candidates.md` ein 5-Zeilen-Add (Brief-103-Forecast „die Restliste schmilzt über Wochen"). Heute nicht nötig (`git log` über die `.last-run`-Datei zeigt den Verlauf).

**Was diesem Pass NICHT angehört:** der **Brief-103-UI-Pass** (Audio-Drama-Dämpfung im `/buecher?audit=gap`-Bucket + Drift-Tie-Group-Sub-Sortierung — vollständig in Brief 103 § Constraints/UI + § Acceptance/UI + § Design freedom spezifiziert, läuft als nächster CC-Job im `chrono-lexicanum-product`-Worktree, Branch z.B. `codex/product-audit-drift-gap-sweep`); der **Maintainer-Excel-Sweep** über die ~10–20 echten Fixables aus der 325er-Liste (Brief 103 § Out-of-Scope: kein einmaliger Architektur-Brief, laufender Maintainer-Workflow). Aggregator-Pass-3-Refinement, Sessions-Archive-Sweep für 100/101/102/103 + Pass-11..15-Dossiers + consolidation-pass-2-* bleiben als separate Hygiene-Pässe geparkt.

**Keine OQ-Schließung, keine neue numerierte OQ.** Brief 103 Daten-Pass ist Tooling-Add + Daten-Backfill — adressiert keine numerierte OQ. Die in Brief 103 § Open questions adressierten sechs Fragen sind im 103-Daten-impl beantwortet (Q1 = 325 Kandidaten / HH=73 W40K=252, Q4 = Pilot-Backfill-Größe + Effort-Schätzung; Q2/Q3/Q5/Q6 sind UI-Pass-Themen, Antworten kommen im UI-impl-Report). Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Updated wiki:** `project-state.md` (Header + Frontmatter-Top-Eintrag + Phase-Headline + What's running counts + § What's open neu sortiert post-PR-109 + Recently shipped zwei neue Zeilen + Next likely brief auf UI-Pass+Phase-3-Seal+096), `pipeline-state.md` (Header-Title + Frontmatter + Intro-Blockquote post-PR-109), `open-questions.md` (Frontmatter-Header-Note 2026-05-28), `index.md` (bumped Updated-Dates), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf + neuer 103-impl-data-Eintrag + Brief 103 Active-Threads-Status auf „data-implemented, UI offen").

**Out of scope:** Kein Code-Touch (PR #109 ist erledigt; UI-Pass und Maintainer-Sweep sind eigene Folge-Arbeit). Kein Archive-Move 100/101/102/103 + Pass-11..15-Dossiers + consolidation-pass-2-* — separater Hygiene-Sweep. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-28 · Ingest · Post-Merge-Koordinations-Pass post-PR-110 + post-PR-111 (Brief 096 Phasen A–F + Brief 103 UI-Pass — Product-Strang gemergt)

Zwei zusammenhängende Product-Strang-PRs sind gemergt — und damit der **UI-Strang post-Karpathy-Reset visuell konsolidiert + Brief 103 vollständig durch**:

- **PR #110 — `Design-Direction UI: Map, Hub, Ask, Atlas-Inventory, MediaPlayer`** (commit `59213c3`, 147 Files / +21 578 / -1 082). Massive Product-Strang-Konsolidierung aus dem `chrono-lexicanum-product`-Worktree mit drei zusammen geschnürten Linien: (a) **Brief 096 Phasen A–F** (impl-Report `2026-05-23-096-impl-design-direction.md`, vier Commits d37c590 / 492b352 / ed611c1 / a55679a) — globaler Shell + Hub (A+B), `/buecher`-Reskin (C), `/buch/[slug]` Bespoke (D), Stub-Shells für `/fraktion` / `/welt` / `/charakter` / `/ask` / `/map` (E), internal-tools Token-Aliasing-Verify (F); Cinzel / Cormorant Garamond / IBM Plex Mono via `next/font/google`, `SiteBackground` + `TopNav`, zwölf neue Chrono-Primitives unter `src/components/chrono/*` (MainAuspex, AuspexSweep, CornerAuspex, FloatingCoord, ScanLine, Typewriter, LiveTelemetry, ProcessingDots, GhostReadout, LetterField, WordField, BottomConsole). (b) **Brief-096-out-of-scope Map-/Atlas-Inventories** — `/lib/galaxy/*` (coords/data/eras/share/stars/storage/themes/types — die strukturierte Galaxy-Domäne aus dem Lab-Cartographer-Prototyp Brief 079), `/lib/atlas/*` (auth/decks/format/queries/types — Atlas-Inventory-Anbindung), `/lib/audio-tracks.ts` + `/lib/askPaths.ts`, `src/components/map/disc/*` + `src/components/map/editor/*` + `src/components/map/tweaks/*` + `src/proxy.ts`. (c) **Zwei Map-Polish-Followups** auf demselben Product-Branch — `2026-05-27-098-impl-map-dive-flicker-followup.md` (Dive-Curtain + delayed-view-switch + capped Preview-Zoom + Mechanicus-`SELECTING SEGMENTUM...`-Copy gegen Chrome-Flicker) und `2026-05-27-099-impl-map-transition-polish.md` (Reticle-Entfernung + 180→560ms settle-Window + Tint/Scanlines durch transitions stabil + `animsOn`-Gating für SMIL-Hazard-Zones in dived Segmentum). Brief 096 **bleibt `status: open`** — Phasen G (Timeline bespoke) + H (Ask 6-path funnel mit canonical six paths) sind im 096-impl explizit deferred, das Brief-Container-Vehikel trägt sie weiter im Product-Worktree (`lokal-iterativ — kein PR bis fertig`-Konvention aus dem Brief).
- **PR #111 — `Brief 103 UI-Pass: Audio-Drama-Daempfung + Drift-Tie-Group-Sub-Sort`** (commit `b1b4746`, 5 Files / +312 / -10). Tight Diff im `/buecher`-Cockpit: `src/app/buecher/page.tsx` (Drift-Score-Wiring, AND-Semantik `singleGapMode = auditFilters.length === 1 && auditFilters[0] === 'gap'`, `hideAudio`-Param-Plumbing, `topDriftSignal()`-Per-Row-Anzeige, `BookRow`-`dimmed`+`driftSignal`-Props), `src/app/buecher/GapAudioToggle.tsx` (neues Client-Island, 43 Zeilen, `useSearchParams` + `router.replace`, reuse `.audit-pills`/`.audit-pill`), `src/app/globals.css` (gescopter `.is-audio-dim`-Block hinter `.catalogue-row[open]` — `opacity:.4` + `.catalogue-row__dot { width:5px; height:5px; filter:saturate(.45) }`, `__audio-tag` + `__drift-signal` Mono-Klassen), Brief-103-arch-`status: open → implemented` + Frontmatter-Link auf UI-impl-Report, UI-impl-Report selbst (`2026-05-28-103-impl-ui-audit-drift-gap-sweep.md`). Brief 103 jetzt **`status: implemented`** — beide Hälften durch (Daten via PR #109, UI via PR #111).

**Read (raw sources):**

- `sessions/2026-05-23-096-impl-design-direction.md` (94 Zeilen) — canonical Brief-096-Phasen-A–F-Impl-Report: Phase-by-Phase-Doku mit Commit-SHAs, Decisions I made (Sidebar-Skip im Brief-Vorschlag wegen fehlender URL-Contract-Plumbing, no-radial-halo-Interpretation per memory `feedback_hub_aesthetic`, `/ask`-Placeholder-Latein-Copy bis Phase H landet, CornerAuspex-no-corner-prop, Phase-F-no-commit weil Token-Aliase intakt, G+H deferred per Brief-Plan), Verification (lint+typecheck+build clean, alle 11 Routes built, `npm run dev` walk-through nicht ausgeführt, Reduced-Motion via `@media (prefers-reduced-motion: no-preference)` an der Quelle), For-next-session (Cartographer bespoke, Timeline G, Ask H, /buecher-Sidebar mit echter Filter-Routing, Legacy-Token-Cleanup, Commit-Size-Beobachtung).
- `sessions/2026-05-23-096-impl-plan-design-direction.md` — 530-Zeilen-Impl-Plan vom Start der 096-Session (Quellen-Mapping aus `archive/` HTML-Prototyp, Token-Übersicht, per-Phase-Diff-Sketches; reines Planungs-Artefakt, nicht canonical für die Coord-Pass-Lese).
- `sessions/2026-05-27-098-impl-map-dive-flicker-followup.md` (70 Zeilen) + `sessions/2026-05-27-099-impl-map-transition-polish.md` (71 Zeilen) — die zwei Map-Polish-Folgesessions auf dem Brief-096-Product-Branch; jeweils Browser-Smoke verifiziert (Obscurus-Dive, Solar-Worst-Case, Surface, Direct-Load in Ultima); `data-map-transitioning="true"`-Quiet-Mode + delayed-detail-mount + `animsOn`-Gating gegen Chrome-Flicker.
- `sessions/2026-05-28-103-impl-ui-audit-drift-gap-sweep.md` (89 Zeilen) — canonical UI-Pass-Impl-Report: Summary + What I did (page.tsx-Wiring + GapAudioToggle.tsx + globals.css + Brief-Status-Flip) + Decisions I made (sieben Punkte, davon Toggle-Param `?hideAudio=1` als separater Param statt `audit=`-Pillen-Erweiterung als wichtigste — Anzeige-Toggle ≠ Audit-Filter, sauberer `AuditFilter`-Typ; URL-only kein localStorage per Brief-Festlegung; `driftScore = sum` statt `max` per Brief-Vorgabe; `globalDriftFreq` als Closure-Param off `CatalogueBook`; Dämpfung `.5 → .4` + Faction-Dot `10px → 5px` entsättigt nach Philipp-Eyeball-Feedback; sichtbares Drift-Signal pro Row als Sub-Sort-Beleg; `/buch/[slug]/audit` not touched) + Verification (typecheck+lint+brain:lint clean, Browser-Smoke-Tabelle über vier URL-Varianten + Cross-Check-Smoke `?audit=gap&hideAudio=1` = 325 Rows = Daten-Pass-Helper-Output) + Open-Questions-Antworten + For-next-session (Edition-Rename-Alias-Cluster, /buch/[slug]/audit-Detail-Refinement, Audio-Drama-Dämpfung site-weit übertragbar).
- `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md` — Brief 103 (`status: open → implemented` im PR-111-Commit mit-portiert).

**Wichtigster Befund — Edition-Rename-Alias-Cluster als Top-Brief-Kandidat.** Die im UI-impl Q2 quantifizierte globale rawName-Häufigkeit über alle drift_works zeigt klare Cluster-Typen: **Edition-Renames** (Imperial Guard ×77 → `astra_militarum`, Eldar ×34 → `aeldari`, Dark Eldar ×22 → `drukhari`, Imperial Army ×12 → `astra_militarum`), **Honor-/Full-Name-Splits** (Horus Lupercal ×19 → `horus`, Lucius ×11 → `lucius_the_eternal`), **HH-spezifische Surface-Forms** (Mechanicum ×19, Knights-Errant ×13), **Location-Surface-Forms** (Isstvan V ×26), **regular drift** (Sisters of Silence ×16, Adeptus Ministorum ×14, Tau Empire ×12). Die Edition-Rename-Top-3 (Imperial Guard / Eldar / Dark Eldar) sind reine Synonyme, **keine** Cross-Era-Identitäten (ADR-konform) — eine Alias-Eintrag pro Form (`scripts/seed-data/faction-aliases.json`) würde 77+34+22 = ~133 Junctions aus dem Drift-Bucket nehmen, ohne Resolver-Logik anzufassen. Klein-Diff-Brief-Kandidat mit hohem ROI; gehört vor jeden weiteren Audit-Cockpit-Refinement-Brief. **In `project-state.md` § Next likely brief Position 1 + § What's open Top-Bullet eingetragen.**

**Disziplin-Befund — NNN-Collision aus dem Product-Strang.** Die zwei Map-Polish-Followup-Files (`2026-05-27-098-impl-map-dive-flicker-followup.md` + `2026-05-27-099-impl-map-transition-polish.md`) reuse die NNN `098` (W40K-Konsolidierungs-Pass) und `099` (Sessions-Archiv-Sweep). `brain/wiki/workflows/sessions-format.md` § Naming spezifiziert NNN als **projektweit monoton (NOT reset daily)**. Die nächste Sessions-Archive-Sweep-Session muss die zwei Files umnennen (Vorschlag: nächste freie NNN ab `104` und `105`, mit `parent`-Frontmatter-Anpassung in der zweiten Datei und Pfad-Rewrites in den `links:`-/`sources:`-Listen falls referenziert). Bis dahin trägt der Cross-Strand-Konflikt einen falschen impl-Report-Match.

**Brief 103 vollständig durch — alle § Open questions beantwortet.** Sechs Fragen im Brief, sechs Antworten in den zwei Impl-Reports: Q1 (Konkrete Zahl der fixable Gap-Kandidaten) → 325 Raw-Output / Subset post-Triage ~10–20 (Daten-impl); Q2 (Globale Drift-Surface-Form-Top-Cluster) → die obigen Edition-Rename-/Honor-Title-Listen (UI-impl); Q3 (Aggregation client-side oder DB-side) → client-side im Read-Path, keine zusätzliche Drizzle-Query, O(n·k)-Sweep auf den ohnehin geladenen `*AuditRows` (UI-impl); Q4 (Pilot-Backfill-Qualität + Effort-Schätzung) → ~5min Entscheidung + ~1min Edit + ~3min Verify pro Buch, Skalier-Schätzung 2–4h für die ~10–20 Fixables (Daten-impl); Q5 (Toggle-Param-Key) → separater `?hideAudio=1`, keine `audit=`-Pillen-Erweiterung (UI-impl); Q6 (Brief-096-Kollision) → keine, das `.audit-pills`/`.audit-pill`-Vokabular ist wiederverwendet, kein `globals.css`-Token-Touch (UI-impl); Q7 (Drift-Score-Datenfluss) → `driftRawNames` + Per-Achsen-Counts auf `CatalogueAudit`, `driftScoreById` als Closure-`ReadonlyMap` in `sortBooks()` (UI-impl).

**Was diesem Pass NICHT angehört.** (i) Der **Edition-Rename-Alias-Cluster-Brief** — wartet auf Cowork-Architekten-Brief (Top-Empfehlung in `project-state.md` § Next likely brief Position 1). (ii) **Brief-096 Phasen G + H** — `lokal-iterativ` im Product-Worktree, kein neuer Brief, kein post-merge-Pass bis ein PR aus dem Product-Worktree landet. (iii) **Sessions-Archive-Sweep + Numbering-Collision-Fix** (100/101/102/103/Pass-11..15-Dossiers/consolidation-pass-2-* + die zwei NNN=098/099-Reuse-Files) — separater Hygiene-Pass analog Brief 099. (iv) **`/buch/[slug]/audit`-Detail-Refinement** + **site-weite Audio-Drama-Dämpfung** + **Legacy-Token-Cleanup** + **Maintainer-Excel-Sweep** + **Pelago-Tags-Review** + **Audit-Helper-Snapshot-Persistenz** — alle als Watch-Items in `project-state.md` § What's open geparkt.

**Keine OQ-Schließung, keine neue numerierte OQ.** Beide PRs sind UI-Strang ohne numerierten OQ-Bezug. Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Updated wiki:** `project-state.md` (Frontmatter-Top-Eintrag + Header-Title post-PR-110+111 + § What's open neue Watch-Items + Recently shipped drei neue Zeilen + Next likely brief auf Edition-Rename-Alias-Cluster), `open-questions.md` (Frontmatter-Header-Note), `index.md` (bumped Updated-Dates + Beschreibungen project-state/open-questions auf post-PR-111), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf + Brief 103 Active-Threads auf `complete — merged` + Brief 096 Active-Threads-Status auf „Phasen A–F gemergt, G+H lokal-iterativ" + neue Zeilen für 103-impl-ui + 096-impl + map-polish-followups).

**Out of scope:** Kein Code-Touch (PR #110 + #111 sind erledigt; Edition-Rename-Alias-Cluster ist eigener Folge-Brief). Kein Archive-Move 100/101/102/103/Pass-11..15-Dossiers/consolidation-pass-2-*/NNN=098/099-Reuse-Files. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-30 · Ingest · Post-Merge-Koordinations-Pass post-PR-112 + post-PR-113 (Brief 105 Daten-Pass [Hörbuch-Credits] + Brief 096 Phasen G+H [Chronicle/Ask-Redesign])

Zwei Strang-PRs seit dem post-PR-110+111-Pass gemergt — Batches (Daten) + Product (UI):

- **PR #112 `c9b7c55` — `Brief 105 Daten-Pass: Hörbuch-Credits (Sidecar + idempotenter Apply) + durable work_persons`** (branch `codex/ingest-batches-audiobook-credits`, 6 Dateien + Impl-Report). Cluster A Daten-Hälfte: 66 Bücher (33 HH / 33 W40K) Audiobook-Credits in committed Sidecar `scripts/seed-data/audiobook-narrators.json` → durable `persons` (+29 Performer) + `work_persons` (+88 Audio-Rollen: narrator 63 / co_narrator 12 / full_cast 13); 58 single / 5 multi / 3 full-cast; 4 `no_audiobook`-Audit (pre-2008). P1-Durability-Fix: `apply-override.ts`-Delete auf `inArray(role,["author","editor"])` gescopt. Neue Artefakte: `scripts/apply-audiobook-narrators.ts` (idempotent, Tx, `--dry-run`/`--file`), `src/lib/seed/persons.ts` (Slug-Helper-Extraktion, Brief-077-Pattern), `scripts/test-audiobook-narrators.ts` (12/12). UI-Pass (Kauf-/Hör-Aktionen) offen.
- **PR #113 `b60b0fb` — `Chronicle-Redesign + UI-Pass (Timeline-Port, Ask/Buecher/Map)`** (Product-Worktree). Brief-096 Phasen G (Chronicle/Timeline bespoke) + H (Ask-Funnel) Material, **lokal-iterativ ohne eigenen Impl-Report**. `src/components/timeline/chronicle/*` (10 Komponenten) + `src/lib/chronicle/roster.ts`/`src/lib/timeline.ts`/`src/lib/timelineAdapter.ts` + `timeline/page.tsx`-Rewrite (`loading.tsx` entfernt) + Ask-Redesign + `buecher/ScrollScrim.tsx` + Lab-Prototyp `public/lab/timeline-prototype/*` + `globals.css` +928. Noch nicht Cowork-reviewt; 096-Status offen.

**Read (raw sources):**

- `sessions/2026-05-29-105-impl-data-buy-listen-links.md` (226 Zeilen) — canonical Brief-105-Daten-Pass-Impl-Report: Summary, Scope (Spot-Check ~18 → maintainer-gewählte medium batch 66), What I did, Spot-check-Tabelle, Coverage, Durability-Proof (live-DB), Decisions, Open-Question-Antworten, Verification.
- `sessions/2026-05-29-105-arch-buy-listen-links.md` — Brief 105 (`status: open`, UI-Pass-Container; Daten-Hälfte erledigt).
- Code direkt gelesen (Cowork-Review aus dem `chrono-lexicanum-batches`-Worktree): `scripts/seed-data/audiobook-narrators.json`, `scripts/apply-audiobook-narrators.ts`, `src/lib/seed/persons.ts`, `scripts/apply-override.ts` (L990-Delete), `scripts/test-audiobook-narrators.ts`, `package.json`.
- PR #113: kein Impl-Report (lokal-iterativ); Fakten aus PR-Titel + ff-Datei-Diff.

**Cowork-Review-Verdikt PR #112 — akkurat, stabil, sinnvoll.** *Akkurat:* alle Coverage-Zahlen via `jq` unabhängig nachgerechnet (66 Bücher / 88 Credits / 63-12-13 Rollen / 33-33 HH-W40K / 29 Performer / 58-5-3 Split — alle exakt), 3 Credits web-gegengeprüft (For-the-Emperor = Perring+Rawlins+Gregory, Butcher's-Nails-Cast inkl. dokumentierter „Page"/„Paige"-Schreibvariante, Nightbringer = Mackinnon). *Stabil:* der gescopte Delete ist der **einzige** `delete(workPersons)` in apply-override (Batch-Summary-Region nur lesend), Validierung lehnt doppelte (person,role) je Buch ab (PK-sicher), per-Buch-Transaktion. *Sinnvoll:* Sidecar-als-SSOT, derive-don't-store (Storefront-Links UI-derived), Performer-count-statt-Produkt-Label-Taxonomie, Brief-077-Extraktions-Pattern.

**Review-Befund → Watch-Item (Full-Rebuild-Restore).** Der Durability-Fix schützt nur die *routinemäßige* Resolver/SSOT-Re-Apply (Brief-Acceptance, erfüllt + bewiesen). Ein voller Rebuild — `db:reset-for-ssot` (TRUNCATE works CASCADE) / `db:seed` (TRUNCATE) — löscht die 88 Audio-Rows, und **keine** Orchestrierung (`run-phase4-apply*.sh` rufen nur `db:apply-override`) zieht `apply:audiobook-narrators` nach. → der Audio-Apply gehört in die Reset-/Rebuild-Sequenz (Runbook-Schritt / `db:rebuild`-Convenience-Script). Kein Blocker, kleiner Folge-Diff; in § What's open + § Next likely brief notiert.

**Keine OQ-Schließung, keine neue numerierte OQ.** Beide PRs sind Strang-Arbeit ohne numerierten OQ-Bezug; die in Brief 105 § Open questions adressierten Fragen sind im 105-Daten-impl beantwortet. Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Updated wiki:** `project-state.md` (Frontmatter-Top-Eintrag + Header-Title post-PR-112+113 + § What's running `work_persons` 785→873 + § What's open sechs neue Watch-Items + § Recently shipped drei Zeilen + § Next likely brief „0."-Item Brief-105-UI-Pass), `open-questions.md` (Frontmatter-Top-Eintrag), `index.md` (bumped Updated-Dates), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf-Blockquote + Active-Threads: Brief 105 Daten-Pass `gemergt`/UI-Pass offen, neue Zeile PR #113, 096-Row-Status).

**Out of scope:** Kein Code-Touch (PR #112 + #113 erledigt). PR-#113-Sichtung + 096-Status-Flip + Brief-105-UI-Pass + Full-Rebuild-Restore-Wiring sind eigene Folge-Schritte. Kein Archive-Move. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-30 · Ingest · Nachtrag post-PR-114 (Brief 105 UI-Pass gemergt — Cluster A komplett)

PR #114 `c4d019c` („Brief 105 UI-Pass: Buy/Listen-Links + Hörbuch-Credits-Render", Product-Worktree) ist gemergt — die UI-Hälfte von Cluster A, ein Schritt nach dem post-PR-112+113-Rollup (`d989ef5`). Landete: `src/lib/store-links.ts` (geo-lokalisierendes, affiliate-bereites `buildStoreUrl` — Amazon/Audible-TLD-Swap + Black-Library-Suche, kein Tag, aktivierbar via `STORE_AFFILIATE_TAGS` ohne Call-Site-Änderung), `src/lib/store-region.ts` (server-seitige Region `?store=` > `x-vercel-ip-country` > Accept-Language > US), `src/components/book/{BuyListenActions,AudioCredit,RegionSwitcher}.tsx` (AudioCredit in single/duet/ensemble/full-cast), `/buch/[slug]` Personen-Query **orderBy-Fix (L73)** + displayOrder + ISBN-Select + Rail unter dem Cover, `.env.example` (`STORE_AFFILIATE_TAGS` leer), Impl-Report `2026-05-29-105-impl-product-buy-listen-links.md`. CC hat **Brief 105 `status: open → implemented`** im PR-114-Commit geflippt (beide Pässe fertig). **ISBN-Select adressiert den Short-Title-Store-Link-Befund** aus dem Daten-Review (Legion/Nemesis/Censure/… via ISBN statt mehrdeutiger Such-URL). Watch-Item „Brief-105-UI-Pass" erledigt; offene Cluster-A-Folge bleibt nur das Full-Rebuild-Restore-Wiring (eigener Brief). **Keine OQ-Bewegung.** **Updated wiki:** `project-state.md` (Frontmatter-Nachtrag + § What's open UI-Pass-Bullet → erledigt + § Recently shipped Zeile), `open-questions.md` (Frontmatter-Nachtrag), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf-Nachtrag + 105-Active-Threads-Zeile → `implemented`). **Mit-committed:** die zuvor untracked arch-Briefe `2026-05-29-104-arch-alias-aware-drift.md` + `2026-05-29-106-arch-hero-upscale-ambient.md` (doc-only, gehörten auf `main`). **Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-06-01 · Ingest · Brief 106 (Hero-Upscale/Ambient) von Philipp zurückgezogen

Philipp hat Brief 106 (`2026-05-29-106-arch-hero-upscale-ambient.md`, Hero-Upscaling + Ambient-Motion-Varianten-Lab, Product-Strang) als **vorschnell erstellt und nicht ausreichend durchdacht zurückgezogen** — er will die Hero-/Ambient-/Upscaling-Richtung zuerst selbst neu überlegen. `status: open → archived`, **nie implementiert** (kein Code, kein PR, keine Assets). Der Brief-Body bleibt als Ausgangsmaterial erhalten; wird die Linie wieder aufgegriffen, entsteht ein frischer Brief mit neuer NNN.

**Updated wiki:** `project-state.md` (Frontmatter-Changelog-Eintrag), `open-questions.md` (Frontmatter-Changelog-Eintrag), this `log.md`. **Outside wiki:** `sessions/2026-05-29-106-arch-hero-upscale-ambient.md` (Frontmatter `status: archived` + Zurückgezogen-Banner), `sessions/README.md` (Hero-Polish-Narrativ-Block + Active-Threads-Zeile auf zurückgezogen). **Archive-Move:** der physische Move (→ `sessions/archive/2026-05/`) reitet auf dem ausstehenden Sessions-Archive-Sweep, dessen Scope 106 jetzt mit einschließt. **Keine OQ-Bewegung** — OQ (3) + (13) bleiben offen. **Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-06-01 · Post-Merge-Koordinations-Pass · post-PR-118 (Brief 104 alias-aware-drift gemergt)

PR #118 (`1142c82`, Brief 104 `alias-aware-drift`, Product-Strang) ist gemergt — das geteilte Alias-Modul `src/lib/aliases/index.ts` (SSOT = statische Imports der `scripts/seed-data/*-aliases.json` + Entity-JSONs, Resolver-Pattern; keine zweite Kopie, kein Runtime-`fs`) + drei-Zustands-Drift (none / known-alias / suspicious), **entity-genau** (`classifyDrift` verlangt `ALIAS_MAP[axis][rawName] === canonicalId`, sonst suspicious), an allen drei Call-Sites (`src/lib/atlas/queries.ts`, `src/app/buecher/page.tsx`, `src/app/buch/[slug]/audit/page.tsx`) durch `classifyDrift`/`tallyAxisDrift` geroutet (dedupliziert die drei `countResolvedDrift`/`isDrift`/`collectDriftRawNames`-Kopien). Known-alias = ruhige cyan-Klasse (vs. warm/amber drift): `ALIAS n`-Chip + inline `· alias «Surface → Canonical»` + optionale `?audit=alias`-Pille (URL-getrieben, kein localStorage; via geteilter `AuditFilter`/`AuditPills` auch auf `/atlas/werke`). Such-Contract `resolveSurfaceForm(query, axes?) → AliasResolution[]` exponiert (trim+lowercase-normalisiert, Match gegen Alias-Keys **und** kanonische Namen über alle drei Achsen, Liste = ambiguitäts-ehrlich, je Hit `axis`/`canonicalId`/`matchedVia`/`surfaceForm`) — **nicht** an eine UI verdrahtet, aber Test-belegt (`scripts/test-aliases.ts` 15/0; Diakritika-Folding `T'au` bewusst auf die Such-Session deferred).

**Headline-Befund: `drift_works` 380 → 0** (gemessen gegen die Live-Supabase, 859 Bücher). Jeder Drift-Junction im Korpus (500 Junctions über 380 Bücher) ist ein registrierter Edition-Rename → **null** suspicious drift. Größer als die ~133-Brief-Schätzung (die galt nur den Top-3-Faction-Clustern; die vollen Maps über alle drei Achsen decken ~500 Junctions). Der Befund ist gemessen *und* logisch zwingend: der Resolver speichert nur `(rawName, id)`, wo die Alias-Map `rawName → id` abbildet — per entity-genauer Definition *ist* damit jeder Drift-Junction ein known-alias. Der entity-genaue Guard bleibt für künftige Daten-Integrität relevant (ein hand-geschriebener Override, der einen Alias fehl-pointet), findet in den heutigen Daten aber 0 Mismatches.

**Cowork-Review:** deckt den Brief sauber ab (geteiltes SSOT-Modul, 3-State entity-genau, Such-Contract + Test, alle drei Call-Sites, ruhige sichtbare Alias-Klasse, kein Schema/DB/Resolver/Override-Touch). Verifikation grün: `typecheck` exit 0, `lint` exit 0, `test:aliases` 15/0, `test:resolver` 473/0 (Regression — keine Resolver-Files angefasst). Diff +166/−79 über 8 Files. Curl-Smoke: alle vier `?audit=`-Views HTTP 200, `?audit=alias` → 380/859 Treffer, Chips + inline-Signale rendern mit echten Daten (`Sisters of Silence → Talons of the Emperor`, `Mechanicum → Adeptus Mechanicus`, `Imperial Army → Astra Militarum`, `Isstvan V → Istvaan V`). **Offen (maintainer):** der menschliche Visual-Pass (Desktop + ≤640px) — von CC bewusst unticked gelassen.

**Wiki-Folgen:** Das **Edition-Rename-Alias-Cluster-Watch-Item** (§ What's open, seit post-PR-110/111 „Top-Empfehlung") ist **geschlossen** — mit korrigierter Prämisse (der Hebel saß in der App-Schicht, nicht in den Daten; ein Alias-Add hätte 0 Junctions geräumt). Vier neue next-brief/maintainer-Folgen als ein konsolidiertes Watch-Item in § What's open: (a) `?audit=drift` jetzt dauerhaft leer → Drift-Pille/Brief-103-Sub-Sort behalten/umlabeln/zurückbauen; (b) Alias-Klasse always-on auf ~44 % der Bücher → ggf. detail-only/hinter `?audit=alias`; (c) `resolveSurfaceForm`-Verdrahtung = Brief 109 Step 3 (universelle Suche); (d) maintainer-Visual-Pass.

**Updated wiki:** `project-state.md` (Frontmatter-Changelog-Eintrag + § What's open Edition-Rename-Item geschlossen + konsolidiertes Folgen-Watch-Item + § Recently shipped Zeile), `open-questions.md` (Frontmatter-Changelog-Eintrag), `index.md` (Freshness-Bump + project-state/open-questions-Descriptions), this `log.md`. **Outside wiki:** `sessions/README.md` (neuer Active-Threads-Narrativ-Block + 104-Tabellenzeile → `implemented`). **Archive-Move:** das Brief-104-Pair (arch + impl) reitet auf dem ausstehenden Sessions-Archive-Sweep. **Keine OQ-Bewegung** — OQ (3) + (13) bleiben offen. **Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

---

## 2026-05-30 · Ingest · Post-Merge-Koordinations-Pass post-Brief-107 (Full-Rebuild-Restore-Wiring)

Brief 107 (`full-rebuild-restore-wiring`, Batches-Strang) ist gemergt — der **Cowork-Review-Watch-Item aus dem Brief-105-Review ist geschlossen, Cluster A damit vollständig abgeschlossen**. Ein voller SSOT-Rebuild stellt die 88 Audio-`work_persons`-Rows jetzt deterministisch wieder her; vorher löschte `db:reset-for-ssot` (TRUNCATE works CASCADE) sie still, weil keine Orchestrierung `apply:audiobook-narrators` nachzog (`run-phase4-apply.sh` ruft nur `db:apply-override` = nur author/editor). Reiner Orchestrierungs-/Runbook-Diff; `apply-override.ts` gar nicht angefasst.

**Read (raw sources):**

- `sessions/2026-05-30-107-impl-full-rebuild-restore-wiring.md` (100 Zeilen) — canonical Impl-Report: Summary, What I did (Orchestrator / Config / `--verify` / package.json / Runbook / Brief-Status-Flip), Decisions (bash-Geschwister, eigene Config, `--verify` am Worker, **exakte Mengen-Gleichheit statt Total** als Codex-Review-Härtung, Tail-Platzierung, db:seed off-path), Verification (alle non-destruktiven Checks + Confirm-Gate + Verify-OK/Masking-Negativtest/Dry-Run, destruktiver E2E maintainer-owned), Open-Questions-Antworten (4), For-next-session.
- Code direkt gelesen (Datei-Tools — bash-Mount stale): `scripts/db-rebuild.sh` (153 Z., Confirm-Gate + Fail-fast-`step()`-Runner), `scripts/db-rebuild.config.json` (`applyRanges` W40K 1..57 + HH 1..30, `batches:[]`), `sessions/db-rebuild-runbook.md`, `package.json` (`db:rebuild`-Eintrag).
- `sessions/2026-05-30-107-arch-full-rebuild-restore-wiring.md` — Brief (`status: open → implemented` im Code-PR mit-portiert).

**Pass-Ergebnis (canonical):**

- **Orchestrator `scripts/db-rebuild.sh`** — `npm run db:rebuild`, dünn, confirm-gegatet (mirror `db-reset-for-ssot.ts`; nacktes `db:rebuild` → exit 1 ohne Truncate), fail-fast `step()`-Runner mit `FAILED at step: …`-Marker. Vier Schritte: 1) `db:reset-for-ssot --confirm`, 2) `bash run-phase4-apply.sh scripts/db-rebuild.config.json` (Voll-Korpus, reproduziert den datenkompletten + konsolidierten Korpus — Merges sind in die committed Reference-JSONs eingebacken, **kein** separater Konsolidierungs-Schritt), 3) `apply:audiobook-narrators` (finaler Tail — resolvt `externalBookId → works.id`), 4) `apply:audiobook-narrators --verify`. `--help` ohne DB-Zugriff.
- **`apply-audiobook-narrators.ts` rein additiv** um `--verify` erweitert (Apply-/Dry-Pfad + graziöses Skip unbekannter IDs unverändert). **Verify = exakte `(workId, personId, role)`-Mengen-Gleichheit** zwischen Sidecar-Erwartung und DB (jedes Buch aufgelöst, jeder Credit als exaktes Row, keine verwaisten Rows, nonzero). **Codex-Review-Härtung:** die erste Fassung verglich nur `actualTotal === expectedTotal` → false-positivt, wenn ein Rollen-Überschuss ein Defizit maskiert (z. B. 64/11/13 vs. 63/12/13, Summe 88 beide). Negativ-Test bewiesen (ein geändertes Tripel → `1 missing + 1 stray`, exit 1). Sidecar-abgeleitet (heute 88 = narrator 63 / co_narrator 12 / full_cast 13), **nicht literal** → späterer Full-Sweep braucht keinen Verify-Edit.
- **Eigene Voll-Korpus-Config** `scripts/db-rebuild.config.json` (sprechend, **nicht** `consolidation-pass-2.config.json` zweckentfremdet) — `applyRanges`-Form, die `run-phase4-apply.sh` schon liest; Ein-Zeilen-Bump beim Crystallizing einer neuen Batch-Range (identisch zu `consolidation-pass-2.config.json`).
- **`db:seed` bestätigt nicht auf dem SSOT-Rebuild-Pfad** (Legacy-V1-26-Manuals-Dev-Seed, anderer ID-Raum) — unangetastet, kein Wiring, kein Deprecation-Flag.
- **Verifikation:** `typecheck`/`lint`/`brain:lint --no-write` 0-blocking; `test:resolver` 473/0, `test:resolver-data`/`-coverage`, `test:apply-override-dry` `out-of-range=0`, `test:collection-refs` 10/0, `test:audiobook-narrators` 12/0; Confirm-Gate nackt → exit 1 ohne Truncate; Verify-OK read-only → `Expected 88 (63/12/13) == Actual 88`, `66/66`, exit 0; Masking-Negativtest → exit 1; `--dry-run`-Regression `66/66 → 88` exit 0. **Destruktiver E2E-Lauf bewusst maintainer-owned** (truncatet `works`; DB steht bereits im Ziel-Endzustand). Live-DB-Baseline read-only: `works=859`, `work_persons=873` (785 author/editor + 88 audio).

**Cowork-Review-Verdikt — vollständig + sauber, Verify stärker als gefordert.** Alle 11 Acceptance-Bullets erfüllt; der Orchestrator/Config/Runbook matchen die Brief-Spec exakt; die Codex-getriebene exakte-Mengen-Gleichheit übertrifft die im Brief geforderte Sidecar-abgeleitete Zählung. Vier Brief-§-Open-questions im Impl-Report beantwortet.

**Keine OQ-Schließung, keine neue numerierte OQ.** Watch-Item ohne numerierten OQ-Bezug. Offene Queue unverändert: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung.

**Updated wiki:** `project-state.md` (Frontmatter-Top-Eintrag + § What's open Watch-Item → erledigt + § Recently shipped Zeile), `open-questions.md` (Frontmatter-Top-Eintrag), `index.md` (bumped Updated-Dates), this `log.md`. **Outside wiki:** `sessions/README.md` (Aktueller-Kopf-Note + Brief-107-Active-Threads-Zeile → `complete — merged`).

**Out of scope:** Kein Code-Touch (Brief 107 ist gemergt). 859er-Audiobook-Full-Sweep (Verify wächst Sidecar-abgeleitet automatisch mit), finaler destruktiver E2E-Lauf (maintainer-owned), Sessions-Archive-Sweep (104/105-NNN-Collision + 100..107-Pile) bleiben Folge-Arbeit. Kein `brain:lint`-Run durch Cowork (Sandbox) — vor dem Doc-Commit lokal grün durch Philipp.

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

## 2026-06-02 · Move · Sessions-Archive-Sweep (Brief 111 doc-only-Teilmenge) + 098/099-Rename → 115/116

Brief 111 (`session-start-token-diet`) wurde 2026-06-02 auf seine **doc-only-Teilmenge eingedampft**, nachdem CC beim Implementieren entdeckte, dass die Logs + Runbooks last-tragende `scripts/`-Pfade sind (harter `-f`-Die in `run-resolver-pass.sh:236`, `LOG_PATH`-Write-Targets der Loops, `resolver-loop-log-update.ts:245`). Ihre Relocation ist **kein** doc-only-Move, sondern ein Code-PR → ausgelagert nach **Brief 117**. Die hier ausgeführte Teilmenge ist reine Repo-Hygiene (Brief-099-Muster, 2. Ausführung), kein Verhaltens-Change. Commit `2c9af45` (doc-only → `main`).

**Read (raw sources):**

- `sessions/2026-06-01-111-arch-session-start-token-diet.md` (eingedampfte Fassung) — Scope, Safety-Gate, Acceptance.
- CC-needs-decision-Report (2026-06-02) — die verifizierte Script-Kopplungs-Tabelle, die die Relocation aus dem doc-only-Scope hob.
- `sessions/2026-06-02-117-arch-tooling-files-relocation.md` — der Folge-Code-PR-Brief für die 6 Tooling-Files + 102/107 + die ~10 Script-Pfade.

**Pass-Ergebnis (canonical):**

- **7 geschlossene, ungekoppelte Paare archiviert** → `sessions/archive/2026-05/`: 098, 099, 100, 101, 103, 105, 106. `098-arch` stale `status: open → implemented` geflippt. Safety-Gate: pro Datei `scripts/`-grep vor dem Move — nur 102/107 trafen → bewusst zurückgehalten (Config-`.brief`-gekoppelt, gehören in Brief 117).
- **NNN-098/099-Kollision aufgelöst:** die zwei `2026-05-27`-Map-Followups (reusten vergebene NNN aus PR #110) → **115 / 116** umbenannt (`session:`/`parent:`/`links:` angepasst), dann ebenfalls archiviert.
- **Moved-file-Refs nachgezogen** in `pipeline-state.md` + `decisions/cross-era-identities.md` (→ neue `archive/`-Pfade). **Log-/Runbook-/102-Refs bewusst unberührt** (bewegen sich erst in Brief 117).
- **Frontmatter-Schema-Regression gefixt** (pre-existing, sweep-unabhängig): `open-questions.md` + `project-state.md` trugen legacy `links:` statt des required `sources:` + `related:` → `links:` zu `related:` umbenannt, honest `sources:` ergänzt. Das räumte die 4 blockierenden `brain:lint`-Errors weg → Lint grün (0 blocking, 14 pre-existing warnings). Die Brief-111-Fence (»diese Files nicht weiter umschreiben«) wurde für genau diese schmale Schema-Compliance gelockert — Slim-Inhalt unangetastet.

**Bewusst NICHT angefasst (Folge-Arbeit → Brief 117):** Logs (`ssot-loop-log.md`, `resolver-loop-log.md`), 4 Runbooks, Briefs 102/107 — alle script-gekoppelt, atomar als Code-PR aus dem Koordinations-Worktree (quer über `scripts/` + `brain/`). `resolver-dossiers/` bleibt lebender Ordner (aktive Wellen-Dossier ist live aus `resolver-pass.config.json` referenziert). **`log.md`-Historie** (dieser Eintrag ausgenommen) bleibt stehen — die alten `…098…`/`…099…`-Map-Followup-Erwähnungen + die Collision-Notiz sind Historie; der Rename ist hier ein **Append**, kein Rewrite (Linter exemptet `log.md` von Path-Claims, `scripts/brain-lint.ts:1071`).

**Keine OQ-Schließung, keine neue numerierte OQ.** Offene Queue unverändert: OQ (3), OQ (13).

**Updated wiki:** `project-state.md` (§ What's open: Brief-111-Zeile + Sweep-Zeile → shipped/→117; § Next likely brief #3 → Brief 117; Frontmatter-`updated`), `index.md` (Datums-Bumps project-state/log/self), this `log.md`. **Outside wiki:** `sessions/README.md` (111-Active-Threads-Zeile → implemented), `sessions/2026-06-01-111-…md` (`status: open → implemented` + commit).

**Branch.** Coordination-Pass, doc-only → `main` per PR-Policy 2026-05-25.

## 2026-06-01 · Update · Token-Diet + Leanness-Routine + 109/110-Koordination

**Token-Diet (Cowork-direct, doc-only).** Der Session-Start-Read-Order-Floor war auf ~91k Token gewachsen (`project-state.md` ~58k = 1 aktueller + 12 veraltete „Latest pipeline state"-Snapshots + 59.6k-Zeichen-„Recently shipped" + ~130-Zeilen-Frontmatter-Changelog; `open-questions.md` ~19k = ~14/16 closed/`-historic`). Beide Files auf „current-state-only" neu geschrieben (project-state 575→~95 Zeilen, open-questions 257→~45), `sessions/README.md`-Active-threads entschlackt. **Floor ~91k → ~18k Token (~70k/Session gespart).** Historie → `log.md` + git.

**Leanness-Routine (Guardrail gegen Re-Bloat).** Drei Ebenen: (1) Prinzip in `brain/CLAUDE.md` § „Always-read budgets" (current-state-only, char/token-gemessen, Budget-Tabelle); (2) Gewohnheit in `session-end.md` § „The leanness contract" + Step 2/3 (jeden Pass prunen, overwrite statt append, closed OQs löschen statt durchstreichen, Queue ≤5); (3) Automatik = Brief 112 (brain:lint char/token-Budget-Guardrail, warn+error). Brief-Disziplin („scope+writing so kurz wie möglich, so ausführlich wie nötig" + verpflichtender Scope-Recap-Step) in `cowork-session.md`; `&&`-Bug in dessen Commit-Zeile auf zeilenweise gefixt. Read-Order-Regel „lies nur was die Aufgabe braucht" in `CLAUDE.md`.

**109/110-Koordinations-Pass.** Read: `2026-06-01-109-impl-entity-graph-arc.md` + `2026-06-01-110-impl-podcast-ingest-pilot.md`. Brief **109** (Entity-Graph Step 1, Product) gemergt — echte `/charakter` `/fraktion` `/welt`-Hubs auf geteilter `EntityView` + server-only `src/lib/entity/`-Loader, voll SSG (1004 Seiten/3.6s), `52-stub-shell.css`→`59-entity.css`. Brief **110** (Podcast-Pilot, Batches) gemergt — *The 40k Lorecast* dry-run: 148 Folgen, 136 = 91.9% getaggt, 510 Tags via `resolveSurfaceForm`, committed `ingest/podcasts/the-40k-lorecast.{json,report.md}`, **kein** Schema/DB; +`fast-xml-parser`, `PODCAST_LLM_MODEL`-env. Beide Briefs `status: implemented` (CC in den PRs geflippt).

**Updated wiki:** `project-state.md` (Latest pipeline state +109/110, What's running entity-hubs-real, What's open +3 Arc-Bullets, Next-likely-brief → Step 2 beider Arcs), `open-questions.md` (geslimmt), `cowork-session.md` + `session-end.md` + `brain/CLAUDE.md` (Disziplin/Routine/Budget), this `log.md`. **Outside wiki:** `CLAUDE.md` (Read-Order-Regel), `sessions/README.md` (geslimmt + 109/110→merged), neue Briefs 111 + 112.

**Folge-Arbeit:** Entity-Graph Step 2 (Panel) + Podcast Step 2 (Schema) = nächste aktive Linie; Brief 111 (Sweep, doc-only) + Brief 112 (Lint-Guardrail, Code→PR) offen; Maintainer-Visual-Pass der Entity-Hubs (≤720px) owed; Quick-alias-wins (`Guilliman`/`Vect`/`Magnus`/…). **Keine OQ-Schließung, keine neue numerierte OQ** (OQ 3 + 13 bleiben offen).

**Branch.** Doc-only, direkt auf `main` per PR-Policy 2026-05-25.

## 2026-06-02 · Move · Tooling-Files-Relocation (Brief 117) — 6 Files raus aus `sessions/`, Pfade zentralisiert

Brief 117 (Code-PR) hat die **6 lebenden Tooling-Files** aus dem `sessions/`-Brief-Namespace in die Tooling-Domäne verschoben — die script-gekoppelte Folge-Arbeit, die Brief 111 beim Eindampfen ausgelagert hatte. Reine Relocation + Re-Pointing + Pfad-Zentralisierung; **keine** Loop-Logik, **kein** Runbook-Inhalt geändert.

**Moves (git mv, History erhalten):** 4 Runbooks → `scripts/runbooks/` (`ssot-loop-`, `resolver-pass-`, `consolidation-pass-`, `db-rebuild-runbook.md`); 2 Loop-Logs → `scripts/logs/` (`ssot-loop-log.md`, `resolver-loop-log.md`, append-only Inhalt unangetastet); Briefs **102 + 107** mit-archiviert → `sessions/archive/2026-05/` (waren als einzige config-`.brief`-gekoppelt → in Brief 111 zurückgehalten).

**Pfad-Zentralisierung (eine Stelle pro Runner-Familie statt ~10 Literale):** neu `scripts/lib/tooling-paths.ts` (geteilte TS-Konstanten `RESOLVER_LOOP_LOG_PATH` + `RESOLVER_PASS_RUNBOOK_PATH`, extensionslos importiert von `resolver-loop-detect.ts` + `resolver-loop-log-update.ts`); Shell-Driver tragen je eine `readonly`-Konstante (`run-ssot-loop.sh`: `LOG_PATH` + neu `RUNBOOK_PATH`; `run-resolver-loop.sh`: `LOG_PATH`, reicht `--log-path $LOG_PATH` an den Detektor durch — Shell ist im Loop die Autorität); Configs tragen `runbook` (`run-resolver-pass.sh` liest `.runbook`, harter `-f`-Die unverändert).

**Re-Pointing (Refs, nicht Logik):** Narration/Header der 6 Shell-/TS-Files; 4 Config-JSONs (`.runbook` → `scripts/runbooks/…`; `consolidation-pass-2`/`db-rebuild`-`.brief` → neue `archive/`-Pfade); `CLAUDE.md` + `AGENTS.md` (je 3 Runbook-Callouts + Batches-Write-Path-Zeile); `brain/wiki/pipeline-state.md` (Frontmatter-`sources:` + Body-Path-Claims) + `decisions/cross-era-identities.md` (`sources:` + Body-Links: 102→`archive/`, Runbook→`scripts/runbooks/`).

**Gate (verifiziert OHNE echten Wave-Lauf):** `git grep` über `scripts/` + `brain/` + `CLAUDE.md` + `AGENTS.md` + `docs/` findet **keinen** `sessions/…-runbook`- oder `…-loop-log`-Ref mehr (Exit 1); `tsc --noEmit` grün; `brain:lint --no-write` 0 blocking / 14 pre-existing warnings; statische `-f`-Probe: alle 4 Config-`.runbook` + 2 `.brief` + die Shell-Konstanten resolven auf existierende Files. Append-only-History (`brain/wiki/log.md` + die 2 Loop-Logs) behält alte `sessions/…`-Erwähnungen bewusst (Linter exemptet `log.md`, `scripts/brain-lint.ts:1071`).

**Keine OQ-Schließung, keine neue numerierte OQ.**

**Branch.** Code-PR `codex/session-117-tooling-relocation` (touches `scripts/` → Branch + PR); Brief-117-Status `open → implemented` reitet im PR mit.

---

## 2026-06-03 · Prozess-Reset: Strang-Boards 121/122 + Altlasten-Abräumung (Cowork)

Wechsel von Einzel-Briefs zu zwei **stehenden Strang-Boards**. Briefing pro Task über Chat (Cowork → Philipp → CC), kein Input-Doc im Repo; CC baut bei Abschluss ein sehr kleines Handoff-Doc, Cowork reviewt/archiviert. Architekt gibt keine Code-Umsetzung vor; max. Design-Freiheit an CC, `/werke` = optische Blaupause.

**Angelegt:** `sessions/2026-06-03-121-arch-product-board.md` (Product: Redesign-Sweep + Frontend-Lockdown), `sessions/2026-06-03-122-arch-batches-board.md` (Batches: Podcast-Daten, Buch-Kuratierung, Entity-Blurbs, Ask-Modell/-Logik, Chronicle-Daten, Dead-Code, brain:lint-Guardrail).

**Geschlossen/gefaltet:** 096 → `implemented` (G+H-Look → 121); 118 + 119 → `archived` (Nordstern + Sequenz → 121/122); 061 → `archived`, SSOT-Loop als Standing-Tool (Runbook) in 122; 112 → `archived`, gefaltet in 122-B7; OQ 3 → 122-B2, OQ 13 → 122-B6 (open-questions-Queue jetzt leer). README Active-Threads + project-state „What's open"/„Next likely brief" nachgezogen.

**Ask-Naht:** 122-B4 (`recommend()`-Logik + Fragen-/Pfad-Modell, DB) zuerst; 121-P3 (Funnel-UI) gegen den Typen-Contract danach — Cowork liefert den Contract über Chat.

**Offen (Hygiene, kein Blocker):** implementierte Paare 104/108/109/110/113/114 noch im Root → späterer Archiv-Sweep.

---

## 2026-06-09 · Decision/Move · Brief 134 retired → Chronicle-Datierung als Hand-Kuratierung

Brief 134 (*Chronicle setting dates* — Voll-Automatisierung: Events-Tabelle + Schema-Migration + freie Volltext-Probe + EPUB-Extraktion + Apply-Pfad in einem Rutsch) **gelöscht**. Befund beim Schärfen von 134: Ein 40k-Roman zu datieren ist eine **Kurations-Entscheidung, keine Pipeline** („wie eng ist eng genug?", „welches Buch rein/raus?", „ist dieser Snippet belastbar?" sind Mensch-Calls). Entscheidung mit Philipp (Cowork-Chat, 2026-06-09): Cowork + Philipp kuratieren die Timeline-Daten **von Hand** in einem git-ignored `/timeline-workshop/` — Events-Spine M1–M42 zuerst, dann per-Buch-Datierung mit Inclusion-Gate „kein Buch ohne wenigstens groben Richtwert". Das graduiert erst als sauberer Batches-Brief (Events-Tabelle + Apply-Pfad + Provenance + Undatierbar-Liste) zu CC.

**Warum git-ignored:** Parallelität (CC läuft auf 121/122 weiter; der Workshop existiert in den Strang-Worktrees gar nicht) + es ist exploratives Kuratieren, kein committeter Datensatz. `.gitignore` → `/timeline-workshop/`.

**M-Scale-Befund (am Rande):** top-level `CLAUDE.md` schreibt die Formel als `(M-1)*1000+year`, aber Code (`eras.json`, `roster.ts`, `parseChrono`) und das eigene Beispiel `M30.997 → 30997` sind `M*1000+year`. Code ist Autorität; der Prosatext in CLAUDE.md ist falsch (Fix = separater Doc-Edit, hier nur notiert).

**Edits (doc-only → main):**
- `sessions/2026-06-09-134-arch-chronicle-setting-dates.md` — **gelöscht** (Philipp via `git rm`).
- `sessions/README.md` — Kopf-„Ebenfalls 2026-06-09"-Block auf den Pivot umgeschrieben; 134-Active-Threads-Zeile entfernt.
- `sessions/2026-06-03-122-arch-batches-board.md` — B5 auf ⏸ „Cowork-Hand-Kuratierung", 134-Link raus, „CC: nicht anfangen".
- `.gitignore` — `/timeline-workshop/` ergänzt.
- `timeline-workshop/README.md` (+ späteres `events.md`) — **nicht committet** (git-ignored).

**Out of scope (unverändert):** grafisches Event-Rendering + Chronicle-UI-Switch auf DB-Daten = Product/121 (Follow-ups).

## 2026-06-11 · Ingest · Timeline-Datenfundament applied + Archive-Merge gemerged (impl 137/139)

**Quelle:** `sessions/2026-06-10-137-impl-timeline-data-foundation.md` (PR #159), `sessions/2026-06-10-139-impl-archive-site-menu.md` (PR #158, Report liegt im Product-Tree-Commit).

- Brief 137 ist merged **und applied**; Cowork hat live in Supabase gegengezählt (2026-06-11): 8 Eras (alle Editorial-Felder gefüllt, age_rebirth/long_war retired, 0 Bücher darauf), 144 Events (6/23/21/19/20/21/22/12 über die Eras, genau die 2 erwarteten Off-Scale-Rows), 223 event_works (95 book / 125 episode / 3 series), 97 Werke mit Setting-Date (53 event-anchored). `apply:timeline` idempotent.
- Archive-Merge (PR #158): `/werke` + `/podcasts` → `/archive` (+ `/archive/podcasts`), 308-Redirects, `workHref()` nachgezogen, `?focus=`-Opener auf `/archive` (Brief-138-Deliverable vorgezogen), globale Burger-Nav `SiteMenu.tsx` als App-Shell-Chrome.
- Brief 138 entsprechend nachgezogen (Commit 27a297a): Chip-Ziele auf `/archive…`, `?focus=`-Deliverable als erledigt markiert, Burger-Port explizit out of scope, Abhängigkeit „Archive-PR auf main" ergänzt. **138 ist startklar.**

**Edits:** `brain/wiki/open-questions.md` — neues Item (16) mit den drei Folge-Themen aus impl 137 (db:rebuild-Lücke, primaryEraId-Placeholder, Atlas-Events). `brain/wiki/log.md` — dieser Eintrag.

---

## 2026-06-12 · Ingest + Move · Großer Rollup-Pass: Sessions 123–148 eingefaltet + Archiv-Sweep (57 Files)

**Anlass:** Die Rollup-Files hingen ~10 Tage hinter dem Repo (project-state Stand 06-03; 30+ ungerollte Strang-Reports). Voller Koordinations-Pass aus dem Coordination-Worktree, doc-only → direkt auf `main`.

**Eingefaltet (Highlights):**

- **Boards-Ära produktiv:** P1–P4 + B1/B3/B4/B10 erledigt. Ask-Arc (123–127: flacher 5-Fragen-Contract, `recommend()` + Curation-Overlay + Hard Boundaries, 1080-Kombinationen-Audit, `/ask`-Funnel). Podcast-B1 (S1–S3: `external_links`-Provenance Migration 0011, Registry `podcast-shows.json`, autoritativer Link-Apply; Shows: Lorecast 149 / Adeptus Ridiculous 363 / Lorehammer 391 / Luetin09 191 via YouTube-Adapter Brief 130 + CC-Direct-Tagging Brief 131/132). Entity-Blurbs (122-B3: 143 Blurbs + Full-Sweep-Machinery). Weekly-Refresh (Brief 133 PR1+PR2 + 134 Ignore-List + 148 Delta-Cursor `book-seen.json`): Cron Mo 06:00 UTC → Rolling-PR, additions-only. **Korpus 859 → 889** (Session 136, `book-roster.extension.json`, Batches 058–060 + extended Restbatches).
- **Product-Sweep:** `/compendium` (129-impl, 5 Kategorien + Primarchen-Seam + `db-cache.ts`), `/archive`-Merge + Burger-SiteMenu, TopNav gelöscht (139/140), **Timeline-Cinematic-Port** (137-Datenfundament: 8 Eras / 144 Events / 223 Hooks / 97 datierte Werke, Migration 0012; 138/140: neue `/timeline` DB-fed mit 19 WebP-Artworks), Era-Art + Credits + Chrome-Polish (143/145/146), **Preview-Login-Gate** (145, `PREVIEW_GATE=off` als Kill-Switch).
- **Deep-Review-Zyklus:** Reviews 140 (Backend) / 141 (Frontend, `/lab/design`-Styleguide) / 144 (Technical, 72 bestätigte Findings, kein S0) → Umsetzung 147 (7 Wellen: Caching TTL 3600 + `/api/revalidate`, Migration 0013-Indizes, Dead-Code, CSS-Tokens, Resilienz + **`vercel-build` migriert nicht mehr** (`migrate.yml` workflow_dispatch) + **`ci.yml` auch auf `push: main`**, A11y, Security-Header + Admin-Gates + CVE-Bump) → 148 (Welle-6-Rest: 3 umgesetzt, 1 verworfen). Migration 0013 ist applied (Philipp bestätigt 2026-06-12).

**OQ-Bewegung:** (15) Compendium geschlossen (shipped; Rest → Boards 121-P8/P9 + 122-B8/B9). (16) Timeline-Folgen bleibt (aktualisiert). **Neu (17):** Deep-Review-Rest (Preview-Gate vs. Maschinen-Endpoints, CSP, `/buecher`, FilterRail, `/buch`-SSG, `REVALIDATE_TOKEN`).

**Archiv-Sweep:** 52 geschlossene Session-Files → `archive/2026-06/`, 5 Mai-Altlasten (061/104/108/109/110-arch) → `archive/2026-05/`. Root hält nur noch: Boards 121/122, Brief 129 (open), Reports 147/148 (just-closed). Referenz-Rewrite in `decisions/location-policy.md`, `why-cc-direct-curation.md`, `why-sonnet-not-haiku.md`, `pipeline-state.md` (frontmatter), 147/148 (144-Ref). Befund: `scripts/run-ssot-loop.sh` Z. 51 trägt eine **ungenutzte** `BRIEF_PATH`-Konstante auf den archivierten 061 — Einzeiler für den nächsten Batches-Code-PR, kein Bruch.

**CLAUDE.md-Fixes (lange notierte Drift):** M-Scale-Formel-Prosa korrigiert (`M*1000 + year`, Code ist Autorität — Befund aus dem 134-Retirement-Eintrag) + CI-Caveat aktualisiert (`ci.yml` lintet seit 147 auch direct-to-`main`-Pushes).

**Edits:** `project-state.md` (Neuschrieb auf Stand 2026-06-12), `open-questions.md` (15 zu, 17 neu), `roadmap.md` (Status-Snapshot 2026-06-12), `index.md` (Katalog-Zeilen entschlackt + Daten), `sessions/README.md` (Kopf + Active Threads), Boards 121/122 (Status-Spalten + B10-Spec-Link), `CLAUDE.md` (2 Fixes), dieser Eintrag.

---

## 2026-06-12 · Update · Korrektur: angekündigter Frontend-Brief entfällt (via Rogue-Session 143 erledigt)

Philipp-Klärung direkt nach dem Rollup-Pass: die in 146 angekündigte „intensive Ausarbeitung eines Frontend-Briefings" ist **nicht mehr geplant** — die Frontend-Arbeit lief maintainer-direkt als Rogue-Design-Session 143 (+ Polish 145/146) und ist gemergt. Kein neuer Report; 143 war bereits eingefaltet/archiviert. **Edits:** `project-state.md` (§ What's open-Bullet umgeschrieben, § Next likely brief umsortiert — Boards vor, OQ 17 als Punkt 3), `sessions/README.md` (Kopf-„Als Nächstes" korrigiert), dieser Eintrag.

---

## 2026-06-12 · Decision + Briefs · Backlog-Sort mit Philipp → Briefs 149/150, Boards erweitert, OQ 17 geschlossen

Philipp warf 11 neue Punkte in den Topf (Buch-Popup-„Open Full Page" raus, `/atlas`-Rückbau + Admin-Seite, Ask-Logik-Überarbeitung, großer Buch-Reviewer, URL-Migration EN, Fraktions-Icons statt Punkt, Loading-Transparenz, Mobile-Sweep, Map-Redesign ⏸ extern, Login-BG + Credit „bubondubon", Credit-Slot generalisieren). Cowork sortierte alles in 8 Pakete; Reihenfolge mit Philipp festgelegt (AskUserQuestion).

**Status-Korrekturen aus dem Chat + Repo-Check:** P5 erledigt (Compendium + Blurbs), P6 bis auf CW-Anzeige, **B3-Full-Sweep komplett** (981/981 Blurbs: 202/490/289 — nicht nur das 143er-Subset), Factions ohne Werke werden nicht mehr gelistet; **B6 NICHT gelaufen** (V1/V2-Ingestion-Code liegt vollständig unter `src/lib/ingestion/`); FilterRail + alte Chronicle-Komponenten existieren noch.

**OQ 17 vollständig entschieden** (alle Empfehlungen angenommen): Gate-Ausnahmen `/healthz`+`/api/revalidate` ja; CSP einfach statisch; `/buecher` → 308; FilterRail löschen; `/buch`-SSG-Refactor ja, vor Launch. Umsetzung → 121-P11/P12. OQ-Queue damit nur noch (16).

**Geschrieben:** Brief `2026-06-12-149-arch-curation-foundation.md` (B2: Hand-Override-Format final vs. Review-Queue, Vorrang-Garantie gegen alle Auto-Writer, rebuild-fester Tail, Content-Warnings aus den Daten, programmatisch aufrufbar für die spätere Admin-Seite) + Brief `2026-06-12-150-arch-polish-sweep.md` (P10: CW-Anzeige raus, Fraktions-Icons Imperium/SM/Xenos/Chaos, Cogitator-Loading transparent, Login-BG + generalisierter Credit-Slot; mit Design-freedom-Sektion).

**Boards erweitert:** 121 + P10 (Brief 150) / P11 (Admin+Rückbau, nach 149) / P12 (URL-EN + SSG) / P13 (Mobile) / P14 (Map ⏸); 122 + B11 (Buch-Reviewer, nach 149) / B12 (Ask-Tuning, nach B11). **Edits:** Boards 121/122, `open-questions.md` (17 zu), `project-state.md` (Blurbs-Korrektur, Boards-Absatz, Next-Sektion), `sessions/README.md` (Kopf + 149/150-Zeilen), dieser Eintrag.

---

## 2026-06-13 · Update + Move · Rollup Brief 150 (Polish-Sweep) implementiert + Archiv-Sweep

- **Read:** `sessions/2026-06-13-150-impl-polish-sweep.md` (complete).
- **Was gebaut:** Alle vier 150-Punkte. Content-Warnings zentral via `src/lib/facet-visibility.ts` aus jeder Besucher-Oberfläche gefiltert (Loader-Ebene: `loadBook.ts`, `archive/loader.ts`, `buecher/page.tsx`); **Admin-Spiegel `/atlas/*` + `/buch/[slug]/audit` filtern bewusst NICHT** (ehrliche DB-Spiegel hinter `getIsAdmin()`-Gate; 149 löscht die Daten ohnehin). Fraktions-Sigils statt Punkt (`faction-icon.ts` Mapping aus `alignment`+`parent_id`: Heretic-Astartes→Chaos, nicht SM; Marker = `role='primary'`-Fraktion; `FactionClassIcon.tsx` 4 Inline-SVGs). Cogitator-Loader 45%-Void-Tint (eine Regel, alle 8 `loading.tsx`). `/login`-Artwork (Philipps eigenes) + generalisierter `ArtCreditTag`/`art-credits.ts`-Slot; Timeline-Credit-Rendering auf geteiltes Markup migriert (Daten-Maps bleiben eigenständig, OQ des Briefs beantwortet).
- **Über Brief-Scope hinaus (Eyeballing-Runden 1–8, Philipp-direkt):** „Open Full Page" aus dem Buch-Popup vorgezogen (Paket-2/P11-Item; **Fullpages bleiben kanonisch** — Share-URLs/OG/SSG, Architect-bestätigt); `/archive`-Titel 18px; **`/map`-Chrome komplett in die Gold-Sprache** (Runden 6–8: CornerOrnament + Borders + Glows raus, Tweaks-/World-/Add-/Nameplate-Popups redesignt, Gelb-Washes raus, Solar als echtes klickbares Segment, Necron Mephrit/Nihilakh-Rückbau via `RETIRED_NECRON_IDS`-Tombstone, Backdrop `brightness 0.18`). CC markiert das als Zwischenstand → **kohärenter Map-Design-Pass = neuer Kandidat 121-P15**.
- **Decisions bestätigt:** Admin-Flächen filtern nicht (ok); Fullpages bleiben (ok); Filter in Loadern statt Views (ok).
- **Verification CC:** `tsc --noEmit` + `npm run lint` grün; Browser-Eyeballing Philipp. **Maintainer-Hebel:** nach Deploy einmal `POST /api/revalidate` (Tag `books`) — gecachte `loadBook`-Payloads tragen CW-Facets bis zur Revalidierung.
- **OQ-Bewegung:** keine. 150 öffnet keine neue OQ (Report-Open-Items sind Maintainer-Hebel/bewusst). Queue bleibt nur (16).
- **Boards:** 121-P10 → erledigt; P11 „Open Full Page" als bereits-raus annotiert; **P15 neu** (Map-Chrome-Kohärenz-Pass, Kandidat).
- **Edits:** Board 121 (P10/P11/P15), `project-state.md` (What's running + What's open + Next-Sektion + frontmatter), `sessions/README.md` (Kopf + Active-Threads), `index.md` (project-state-Datum), dieser Eintrag.
- **Move:** `2026-06-12-147-impl`, `2026-06-12-148-impl`, `2026-06-12-150-arch` → `archive/2026-06/`. Root hält jetzt: Boards 121/122, 129 (open), 149 (open), 150-impl (just-closed).
