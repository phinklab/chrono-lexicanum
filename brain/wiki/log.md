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

(Future entries go below as new `## YYYY-MM-DD · <Op-type> · <short-title>` sections.)
