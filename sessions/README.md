# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

Only open / `needs-decision` briefs and the last just-closed session. Cowork updates this list during session-end; older sessions archive to [`archive/YYYY-MM/`](./archive/).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-09-054](2026-05-09-054-impl-pipeline-v2-pilot.md) | implementer | complete | Pipeline V2 Pilot shipped — TLBranson + Wikipedia discovery, infobox-only Lexicanum + sanity-checked OL + silent-skip Hardcover, 5 deterministic validators, slim LLM (no rating/availability, max_uses=3), BookV2Record diff at `ingest/.last-run/v2-pilot-20260509-1934.diff.json`. 4/5 acceptance bullets clean; garro pagecount empirical-only. |
| [2026-05-09-054](2026-05-09-054-arch-pipeline-v2-pilot.md) | architect | implemented | Pipeline V2 Pilot — Discovery-Spine (Wikipedia + TLBranson), Lexicanum-Body-Year-Regex raus, deterministische Validators, Slim-LLM ohne Rating/Availability, BookV2Record mit Provenance-pro-Feld. Pilot auf 5 Büchern als committed Diff. |
| [2026-05-09-053](2026-05-09-053-impl-brain-lint.md) | implementer | complete | Brain Lint shipped — `scripts/brain-lint.ts` + `npm run brain:lint` + CI gate; first report at `brain/outputs/lint/2026-05-09.md` (0 blocking, 1 intentional warning); 4 deterministic fixes mit-shipped. |
| [2026-05-09-053](2026-05-09-053-arch-brain-lint.md) | architect | implemented | Brain Lint - einmal sauber bauen: deterministische Brain-Hygiene, high-signal stale-claim warnings, Report-Output und CI-Guardrail in einer Session. |
| [2026-05-09-052](2026-05-09-052-arch-ingest-retention-strategy.md) | architect | implemented | Ingest-Retention — Decision: Option A (alles bleibt committed, Re-evaluate-Trigger gesetzt, Brain-Inline-Quote-Verbot). Cowork-only, kein CC. |
| [2026-05-09-051](2026-05-09-051-arch-brain-slim-pass.md) | architect | implemented | Brain Slim Pass — README/ADRs/Queue/Sessions/Ingest verschlanken. |
| [2026-05-09-051](2026-05-09-051-impl-brain-slim-pass.md) | implementer | complete | Brain Slim Pass implementer report — 22 sessions archived, 3 stale `open` corrected, `docs/agents/*` stubbed, ADRs cut, `open-questions.md` split, ingest-retention policy documented. |
| [2026-05-09-050](2026-05-09-050-arch-brain-hygiene-pass.md) | architect | implemented | Brain Hygiene Pass — Link-Audit, Frontmatter-Sources-Normalisierung, Read-Order-Fix, `.gitattributes`. |

For everything else, see [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history at the page level lives in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
