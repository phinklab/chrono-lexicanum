---
session: 2026-05-09-053
role: implementer
date: 2026-05-09
status: complete
slug: brain-lint
parent: 2026-05-09-053
links:
  - 2026-05-09-050
  - 2026-05-09-051
  - 2026-05-09-052
commits: []
---

# Brain Lint - einmal sauber bauen

## Summary

`scripts/brain-lint.ts` ships as the Karpathy operation 3/3, wired through `npm run brain:lint` and into CI. First run was clean after fixing four deterministic blocking findings in the same session — `2026-05-09.md` lint report ends at `0 blocking, 1 warning` (the warning is a Phase-5 forward reference, intentional).

## What I did

### New files

- `scripts/brain-lint.ts` — single-file TypeScript lint, no new dependencies, hand-rolled YAML-frontmatter parser (small subset: scalars / `[]` / block arrays / inline `# comment`). Implements the ten check categories from the brief; cross-platform path handling (forward-slash normalization, `path.relative`/`path.resolve`); CLI flags `--date=YYYY-MM-DD` / `--no-write` / `--strict` / `--help`; exit `0` clean, `1` blocking (or warnings under `--strict`), `2` internal error. Body-line counts use the brief's calibrated soft limits (`SIZE_LIMITS` constant block at the top — adjustment in one place).
- `brain/outputs/lint/2026-05-09.md` — first generated report.

### Wired

- `package.json` — added `"brain:lint": "tsx scripts/brain-lint.ts"`.
- `.github/workflows/ci.yml` — added `npm run brain:lint -- --no-write` step after `npm run check:eras`.

### Brain doc updates

- `brain/wiki/workflows/lint.md` — full rewrite. Replaces the "script TBD; humans run by eye" prose with the real command surface, severity policy, ten-category index, exemption list, what-lint-does-NOT-do, and a "Distant: heuristic-LLM extension" anchor that names the Astro-Han pattern so a future brief doesn't reinvent.
- `brain/CLAUDE.md` — the Lint section's bullet now points at `npm run brain:lint` and the `--no-write` CI form instead of saying "follow-up brief".
- `brain/outputs/lint/README.md` — describes the run modes, categories recap, and the first-report context.
- `brain/wiki/index.md` — lint-row description updated (no longer "script TBD").
- `brain/wiki/log.md` — appended `2026-05-09 · Lint-Skript · Brain Lint shipped (Brief 053)` entry covering findings, fixes, remaining warning, and the script's noise-filtering rules.

### Deterministic blocking fixes (4 found, 4 fixed)

All caught by the new lint, all real defects pre-existing in the wiki:

- `brain/wiki/book-data-overview.md` `sources:` — `2026-05-02-021-arch-rich-seed-2b.md` corrected to `2026-05-01-021-arch-rich-seed-2b.md` (date typo; the file exists in archive under the 05-01 date).
- `brain/wiki/decisions/plan-reshuffle-2026-05-02.md` `sources:` — `../raw/historical/...` corrected to `../../raw/historical/...` (wrong-depth relative path; the decision page lives one level deeper).
- `brain/wiki/decisions/why-drizzle-supabase.md` `sources:` — same wrong-depth fix.
- `brain/wiki/deferred-questions.md:29` markdown link — `2026-05-01-024-impl-era-anchor.md` corrected to `2026-05-02-024-impl-era-anchor.md` (date typo).

## Decisions I made

- **No new dependency.** Hand-rolled the YAML subset and the markdown link / inline-code / fenced-code scanning. The brief's existing wiki uses simple frontmatter (scalars + block arrays + `[]` + occasional `# comment`); a 60-line parser covers it. `gray-matter` would have been ~2 KB of dep but adds an opaque code path for something we control fully here.
- **Single-file script.** No `scripts/lib/` modules, no checks-as-plugins. ~700 lines flat. The brief is explicit about "no new deps if avoidable" and the script is well within readable-as-one-unit territory; module splitting would cost diff-readability without real reuse.
- **Folded the orphan check into Catalog freshness.** Brief §7 says "mindestens ein inbound Link aus `brain/wiki/index.md`" — that's exactly the catalog membership check. Implementing both separately would emit duplicate findings for the same defect (page missing from index → orphan AND uncatalogued). One bucket, one finding.
- **Path-claim warnings exempt `log.md`.** Brief §12 didn't explicitly exempt it, but `log.md` is an append-only operation log — its bullets document files *as they were at the time of the entry*. Sessions move to `archive/` after entries are written; rewriting historical bullets would falsify the journal. So path-claim skips `log.md` (frontmatter check and orphan check were already exempt by spec). Documented in the new lint.md page so the rationale survives.
- **Glossary inline-code carve-out.** `brain/wiki/glossary.md` defines `rawLlmPayload`, `llm_flags`, `fieldOrigins` etc. as bold-prose terms with backticked field-names alongside. Strict inline-code-warnings would fire ~10 times against the glossary. Glossary still gets the fenced/JSON blocking checks but skips the inline-code-warning bucket — token mentions are reference-style there by definition. Documented in the lint.md page's "Pages exempt" subsection.
- **Placeholder filter heuristic.** Filtered tokens with `[<>{}]` plus segments matching `Y{2,}|M{2,}|D{2,}|H{2,}|N{3,}` (date templates: `YYYY`, `MMMM`, `DD`, `HH`, `NNN`). Kept it conservative — single-`X` placeholders (e.g. `sessions/X.md`) aren't auto-detected because `X` is a common single character in real filenames; the lint.md rewrite removed the only two `X.md` placeholder examples in the wiki, so this isn't a recurring source of noise today. If it becomes one, tightening the regex is one-line.
- **Gitignored ingest subdirs skipped.** `ingest/.cache/`, `ingest/.llm-cache/`, `ingest/.state/`, plus the `.run-state.json` file under `ingest/` — all documented as gitignored in `pipeline-state.md` "Cache and state directories". The script skips path-claim warnings for any token matching `ingest/.X/`; `.gitignore` is the source of truth, but for a single dotted-subdir-pattern under one folder the in-script literal is simpler than parsing `.gitignore`.
- **CI runs the script, doesn't `npm install` it specially.** `tsx` is already a devDependency (used by `npm run db:migrate`, `npm run check:eras`, `npm run ingest:backfill`). No new tooling needed for CI.
- **Brief's `--strict` flag deferred-not-default.** Brief explicitly asks for `--strict` to exist but stay non-default; CI uses default-blocking-only mode. After the warning channel proves stable (2–3 weeks of real reports), a follow-up brief can flip CI to `--strict` to ratchet the bar.

## Verification

- `npm run brain:lint` — exit `0`. Wrote `brain/outputs/lint/2026-05-09.md` (0 blocking, 1 warning).
- `npm run brain:lint -- --no-write` — exit `0`. Same summary, no file written. (CI mode.)
- `npm run brain:lint -- --date=2026-05-09` — exit `0`. Reproduced the same report against an explicit date. (Useful for replay/test.)
- `npm run brain:lint -- --help` — prints usage, exits `0`.
- Pre-fix run (with the four deterministic findings present) — exit `1`, listed all four blocking findings with file/line/evidence/suggestion. Behaved as designed.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run check:eras` — pass.

## Open issues / blockers

None. Script is production-ready for daily-use; CI gate is live; first-report is clean.

## For next session

Briefs to consider after this lands and a few weeks of CI runs surface real signal:

- **Flip CI to `--strict` once warnings prove stable.** Today the only warning channel signal is `roadmap.md:76` → `src/lib/recommend.ts` (Phase-5 forward reference). Once the warning channel sees 2–3 weeks of clean reports under PR-driven activity, promoting `--strict` in CI raises the bar with low risk.
- **Heuristic-LLM extension.** The Astro-Han-pattern second pass — an LLM reads wiki claims against code-reality and flags drift suspects (`pickPrimarySource` was renamed, `INGEST_LLM_MODEL` env var no longer exists, etc.). The lint.md "Distant" section is the placeholder; CC skill or MCP tool wrapping `claude` over a shaped context would be the shape. Not urgent until the wiki ages enough that "did we rename that?" becomes a real question. Cost-aware design needed.
- **Lint scheduled GH-Action (weekly).** Brief 053 explicitly excluded weekly actions / Issue creation. The need would surface if PRs become rare and the wiki rots between active-development bursts. For now the PR gate is enough.
- **Code-symbol path-claim heuristic.** Backticked tokens that look like `CONSTANT_NAME`, `functionName()`, or `TypeName` could be greppable against `src/`. Brief 053 deferred this to v2 due to false-positive risk in glossary / concept pages. Reconsider once 2–3 weeks of reports demonstrate the warning channel is high-signal.

## Answers to the brief's open questions

- **Welche Stale-claim-Heuristik war beim echten Brain-Run nuetzlich?** Both v1 heuristics were directly useful. The npm-script check found nothing missing (all `npm run X` references resolve), confirming the scripts are stable. The repo-path check, after placeholder/gitignored filtering, yielded one true-positive warning (`src/lib/recommend.ts` Phase-5 forward reference) — that's the model: surface real things, ignore template noise.
- **Welche waere zu noisy gewesen?** Without the placeholder filter, the unfiltered first run flagged 32 stale-claim warnings — most were `<slug>` / `YYYY-MM-DD-NNN` / `X.md` template syntax in workflow pages. Without the gitignored-subdir filter, mentions of `ingest/.llm-cache/<slug>.json` etc. would have produced 5+ warnings about by-design-absent files. Both filters are critical for the warning channel's signal-to-noise ratio. The brief's deferral of code-symbol greps (`functionName()`-style) was correct — given the glossary / concept pages mention symbols by name extensively, those would have produced large noise.
- **Soll `--strict` in einer spaeteren Session fuer CI aktiviert werden?** Recommended yes after 2–3 weeks of CI experience, conditional on the warning channel staying high-signal. Today's one warning is informative, not gate-worthy. If a future brief promotes a warning category to blocking-grade, CI-strict becomes natural at the same time.
- **Hat der Brain-size-budget Check konkrete Seiten gefunden, die wir vor Produktarbeit noch kuerzen sollten?** No — every page is comfortably under its limit. Closest to a soft limit: `pipeline-state.md` (193 body lines vs. 300 limit), `architecture.md` (~149 vs. 300), `log.md` (now ~225 with the 053 entry, exempt because append-only). Project-state.md is at ~82/160; decisions all under 50/100. Brain Slim Pass (051) did the work. Future-only watchpoint: when `pipeline-state.md` crosses 300, the 3e-Voll-Lauf reporting probably needs synthesis-and-cut.

## What's deliberately NOT in this commit (per brief out-of-scope)

- Auto-fix mode.
- Weekly GH-Action / Issue creation.
- Atlas lint.
- LLM-driven heuristic checks.
- Code-symbol heuristics under `src/`.
- Rewriting raw / sessions content.
- Anchor-existence verification inside link targets.

## References

- Brief: [`sessions/2026-05-09-053-arch-brain-lint.md`](./2026-05-09-053-arch-brain-lint.md)
- Brain rule context: [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md) "Brain-Regel" section (brief 052)
- Karpathy LLM Wiki: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- Astro-Han `karpathy-llm-wiki` (vocabulary inspiration): <https://github.com/Astro-Han/karpathy-llm-wiki>
