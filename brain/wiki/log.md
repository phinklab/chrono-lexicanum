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

**Read:** [`sessions/2026-05-09-049-impl-karpathy-brain-atlas-reset.md`](../../sessions/2026-05-09-049-impl-karpathy-brain-atlas-reset.md) (the 049 implementer report — four commits `1f6da88`/`3f43f4c`/`64b47b5`/`9fa70d8` on `feat/phase-3c-llm-enrichment`, `lint` + `tsc --noEmit` + `npm run atlas:regen` all green, structural-only, nothing pipeline / app / DB).

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

---

(Future entries go below as new `## YYYY-MM-DD · <Op-type> · <short-title>` sections.)
