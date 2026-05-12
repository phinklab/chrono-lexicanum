---
session: 2026-05-12-069
role: implementer
date: 2026-05-12
status: complete
slug: resolver-apply-evidence
parent: 2026-05-12-063
links:
  - 2026-05-12-063
  - 2026-05-12-064
  - 2026-05-12-065
  - 2026-05-12-066
  - 2026-05-12-067
  - 2026-05-12-068
commits:
  - d7dd71c
---

# Resolver Apply Evidence

## Summary

Resolver-Readiness-Fixes aus 064-067 wurden kuratiert committed und die freigegebene Maintainer-DB-Sequenz wurde ausgefuehrt. Ergebnis: Branch ist fuer den Resolver-Scope merge-ready; die DB-Junction-Counts und die fuenf Smoke-Slugs matchen die Dry-Run-Erwartung.

## What I did

- Commit `d7dd71c` erstellt: kuratierte 064-067-Fixes, Runbook, Tests und Reports. Nicht gestaged: `data/*.html`, `outputs/*`, `brain/outputs/lint/2026-05-12.md`, `sessions/.claude/`, `sessions/Fuer 12.05...txt`, XLSX-Binary-Diff, `docs/data/2b-book-roster.md`-Deletion und Session-Archive-Moves.
- Read-only Vorher-Counts aus der DB geholt.
- `npm.cmd run db:migrate` ausgefuehrt.
- `npm.cmd run db:seed-resolver-extensions` ausgefuehrt.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-001` bis `005` in Reihenfolge ausgefuehrt.
- Read-only Nachher-Counts und Smoke-Counts direkt aus der DB geholt.

## Decisions I made

- **Suspicious local changes ausgeschlossen.** Die XLSX-Aenderung, `docs/data/2b-book-roster.md`-Deletion und Archive-Moves sind nicht Teil des Resolver-Apply-Scope und bleiben unstaged.
- **DB-Apply erst nach Commit.** Der verifizierte Code-Stand wurde vor der Mutation committed, damit die DB-Evidence eindeutig zu `d7dd71c` gehoert.
- **Smoke via SQL statt Browser-Klick.** Die Acceptance verlangt Counts; die SQL-Abfrage zaehlt exakt die drei Junction-Achsen pro Slug gegen dieselbe DB. Ein visueller Browser-Smoke waere zusaetzlich moeglich, aber fuer die Count-Evidence nicht genauer.

## Verification

Pre-commit:

- `npm.cmd run test:resolver` - pass, 53 passed.
- `npm.cmd run test:resolver-data` - pass.
- `npm.cmd run test:resolver-coverage` - pass; Smoke `xenos 3/3/6`, `first-and-only 5/6/10`, `necropolis 7/4/9`, `nightbringer 7/1/5`, `the-anarch 9/3/11`.
- `npm.cmd run test:apply-override-dry` - pass; resolved counts `work_factions=318`, `work_locations=129`, `work_characters=363`; invalid roles 0; missing FK targets 0.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run lint` - pass with 1 pre-existing warning in `src/app/layout.tsx:44` (`@next/next/no-page-custom-font`).
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking / 4 warnings.
- `git diff --cached --check` - pass.

DB commands:

- `npm.cmd run db:migrate` - pass. Postgres notices only: `schema "drizzle" already exists`, relation `__drizzle_migrations` already exists.
- `npm.cmd run db:seed-resolver-extensions` - pass: factions `+23 new, 29 skipped`, sectors `+3 new, 5 skipped`, locations `+40 new, 28 skipped`, characters `+65 new, 0 skipped`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-001` - pass, `updates=10`, batch counts `36/31/67`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-002` - pass, `updates=10`, batch counts `51/7/42`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-003` - pass, `updates=10`, batch counts `63/27/73`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-004` - pass, `updates=10`, batch counts `78/32/106`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-005` - pass, `updates=10`, batch counts `90/32/75`.

DB before/after counts:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `work_factions` | 83 | 318 | +235 |
| `work_locations` | 4 | 129 | +125 |
| `work_characters` | 0 | 363 | +363 |
| `factions` | 29 | 52 | +23 |
| `locations` | 28 | 68 | +40 |
| `characters` | 0 | 65 | +65 |

Smoke counts after apply:

| URL | Factions | Locations | Characters |
|---|---:|---:|---:|
| `/buch/xenos` | 3 | 3 | 6 |
| `/buch/first-and-only` | 5 | 6 | 10 |
| `/buch/necropolis` | 7 | 4 | 9 |
| `/buch/nightbringer` | 7 | 1 | 5 |
| `/buch/the-anarch` | 9 | 3 | 11 |

## Open issues / blockers

No Resolver/Apply blocker remains. Existing non-Resolver local changes are intentionally uncommitted and still need Maintainer disposition if a fully clean worktree is desired: XLSX binary diff, `docs/data/2b-book-roster.md` deletion, session archive moves, local/generated outputs.

## For next session

- Brief 061 can resume with `ssot-w40k-006` once Maintainer is comfortable with the resolver apply evidence.
- Keep the `nightbringer` 1-location caveat as data truth unless a future sourced override pass adds more locations.
- Handle the excluded local/session/archive changes separately, outside the resolver commit.

## References

- `docs/resolver-apply-runbook.md`
- `sessions/2026-05-12-063-arch-resolver-50-books.md`
- `sessions/2026-05-12-067-impl-resolver-apply-readiness.md`
- `sessions/2026-05-12-068-impl-resolver-final-review.md`
