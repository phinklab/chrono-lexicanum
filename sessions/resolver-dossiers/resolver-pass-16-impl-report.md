# Resolver-Pass 16 — Impl report

**Wave:** `ssot-w40k-058..060` · 22 books (W40K-0571..0592) · **applyRange** `w40k 1..60`
**Branch:** `codex/ingest-batches-resolver-w24` → **PR #156**
**Dossier:** `resolver-pass-16-dossier.md` · **first W40K resolver pass since the weekly refresh lifted W40K 565→592**

## How this pass ran (provenance — read first)

Driven headless by `scripts/run-resolver-loop.sh --max-waves 1`. Phases **0–3 completed
cleanly** through the loop (4 commits). **Phase 4a's `claude -p` subsession launched the DB
apply as a *background* job and returned before it finished** → the pass-driver halt-check saw
a dirty worktree (`worktree dirty after phase`, exit 2), recorded a `halt`, pushed the branch,
and opened **PR #156** with the apply still running detached. The detached
`run-phase4-apply.sh` then **ran to completion correctly** (60/60 batches `ok`, `DONE`, 0
FAILED). Phases **4a and 4b were finished manually in the parent session** — the apply was
*not* redone (idempotent + already complete); the trias/verify were re-run green and the two
reports + commits produced by hand. **No data lost; only the two commits were missing.** The
root cause is a known headless-subsession hazard (backgrounding a long job inside a one-shot
`claude -p`), not a data defect.

## Phases & commits

| phase | commit | result |
|---|---|---|
| config (Pass 16) | `db45d92` | wave `ssot-w40k-058..060`, 22 books |
| 0 Preflight/Dossier | `e7aac73` | 482-line dossier; flagged batch-057 extension caveat; no needs-decision |
| 1 Factions | `a757e8d` | +3 rows, +3 aliases; trias green |
| 2 Locations | `c2082ba` | +7 rows (1 vessel); trias green |
| 3 Characters | `fe41d38` | +7 rows, +3 aliases, +11 test cases; FKs clean |
| 4a Integration/Apply | `1100b77` | re-apply `w40k 1..60`, 0 FAILED; trias green *(manual finish)* |
| 4b Verify/Report | *(this commit)* | verify-pass + lint + typecheck green *(manual finish)* |

### Promotions (now live in the DB)
- **factions +3:** `leagues_of_votann` (strict freq-2, first Votann novel; distinct from
  historical `squats`), `order_pronatus`, `exorcists`. +3 aliases incl.
  `Kindred of the Eternal Starforge → leagues_of_votann`.
- **locations +7:** `vraks_prime`, `citadel_of_vraks`, `eternal_starforge_hold` (vessel),
  `gryphonne_iv`, `ras_shakeh`, `formosa_sector`, `fortuna_minor`.
- **characters +7:** `morvenn_vahl`, `torquemada_coteaz`, `arcadian_leontus`, `grotsnik`,
  `aestred_thurga`, `xantine`, `darya_nevic`. +3 short-form aliases (Leontus/Coteaz/Vahl).
- **Deliberately left unresolved** (no guessing, per runbook §4): `Vostroyan Blackbloods`,
  `Vraksian Renegade Militia` (Phase 1); the unnamed-antagonist `low_confidence` set carried
  from curation. None forced a `## Needs decision`.

## DB apply (digest: `ingest/.last-run/phase4-digest.md`)

| metric | pre | post | Δ |
|---|---|---|---|
| works | 1987 | 1987 | 0 |
| work_factions | 4316 | 4322 | +6 |
| work_locations | 1514 | 1522 | +8 |
| work_characters | 2551 | 2560 | +9 |
| factions / locations / characters (ref) | 202 / 289 / 490 | 205 / 296 / 497 | +3 / +7 / +7 |

`works` flat (the 22 books were inserted by the promote PR; this is a re-apply). No new
authors, **no facet strips**, `facet_values` flat 86.

## Verify-pass digest (`scripts/verify-pass.ts`, exit 0)

- **Smoke slugs** all carry junctions: W40K-0580 `the-high-kahls-oath` f1/l1/c0 · W40K-0590
  `leontus` f2/l1/c2 · W40K-0592 `renegades-lord-of-excess` f2/l0/c1.
- **Ratings** W40K-0571..0592: 20 goodreads-rated / 2 null / 22 total (the 2 unrated have no
  Goodreads edition — expected from curation).
- **Audit replica NEW** W40K-0571..0592: total 22, drift 8, gap 13 — the normal fresh-pass
  long-tail (cf. Pass 11 drift 34/60). **Audit replica OLD** W40K-0001..0570: drift 228, gap
  254 — standing corpus baseline, unchanged by this idempotent re-apply.
- **Out-of-Range constituent edges = 49** (Brief-102 cross-domain tripwire). This is the
  cumulative *deferred-edge* baseline (HH collection constituents seen from a **W40K-only**
  applyRange lens), the same accepted state prior passes report (Pass 10 = 20, Pass 11 = 27).
  Pass 16's `work_collections` is flat 196→196, so it introduced **none** — not a regression.
  The hard guard `test:apply-override-dry` is **out-of-range=0, unknown-work=0**.

## Gates (Phase 4b)
`verify-pass` exit 0 · `npm run lint` exit 0 · `npm run typecheck` exit 0 ·
apply-side trias all green (`test:resolver` 497/0, `test:resolver-data` ok,
`test:resolver-coverage` exit 0, `test:apply-override-dry` ok, `test:collection-refs` 10/0).

## Follow-up — restbatch extension gap (NOT closed by this wave)

The detector tiles by batch number, so this wave's **aggregate** scope is 058..060 only. The
novel surface-forms unique to the two **extended restbatches** remain a long-tail follow-up:
- **W40K-0566..0570** (in extended `ssot-w40k-057`) — re-applied by applyRange `1..60`, so any
  form matching this pass's new rows now resolves; only genuinely-new entities still sit in notes.
- **HH-0295..0297** (in extended `ssot-hh-030`) — untouched by a W40K-domain applyRange.

Closure path: a targeted custom-config `run-resolver-pass.sh` wave whose batches include
`ssot-w40k-057` (+ a `ssot-hh-030` wave), or a detector tweak (book-count coverage vs.
batch-number tiling). Tracked separately.

## Bookkeeping note
The loop recorded a `halt` block for Pass 16 in `scripts/logs/resolver-loop-log.md`
(commit `a2bead0`); it is updated to **6/6 complete** in a follow-up commit so the detector
advances W40K progress to batch 60 (W40K then reads complete, 592/592).
