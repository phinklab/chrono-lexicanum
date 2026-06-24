---
session: 2026-06-17-154
role: implementer
date: 2026-06-18
status: needs-decision
slug: book-reviewer
parent: 2026-06-17-154
links:
  - 2026-06-12-149
  - 2026-06-14-149
  - 2026-06-11-144
  - 2026-06-07-131
commits: []
---

# Großer Buch-Reviewer — Build + Voll-Lauf (Finder + adversariale Verifier, CC-Direct) → Review-Queue + 96 promoviert

## Summary

The B11 reviewer is built per Brief 154 (CC-Direct driver, finder + independent adversarial verifier, per-dimension conventions, machine contract, DB-free projection with parity test) **and** — at maintainer direction — scaled past the pilot to the **full 889-book catalog**: 639 raw → **608 confirmed** proposals (596 edge across 371 books + 12 facet notes across 11 books) → 31 refuted (~4.9 %). After review, the **96 applyable findings were hand-promoted `reviewQueue` → `curation-overlay.json` `final`**; the 500 new-entity sentinels stay parked for a stage-3 web pass.

**The one thing Cowork most needs to weigh:** three items go beyond the pilot brief and need an explicit bless-or-revert — (1) the full-run scaling + parallel driver, (2) the **Drukhari reference-data split**, (3) the **ledger-conflict topology switch** (abort → non-blocking routing). All three are detailed under *Decisions*.

## What I did

### The B11 build (per brief)
- `scripts/book-review/contract.ts` — machine-readable finding contract (the schema every subsession's JSON is validated against), pinning the overlay role vocab (factions `primary|supporting|antagonist`, locations `primary|secondary|mentioned`, characters `pov|appears|mentioned`); out-of-vocab SSOT roles (`background`, character `supporting`) are mapped before emit.
- `ingest/book-review/conventions-{factions,junctions,facets}.md` — committed, human-readable per-dimension conventions: what makes a correct call, what NOT to flag (legitimate multi-factions, "mentioned" vs "primary"), and "an empty correction list is the right answer when the book is fine."
- `scripts/book-review/projection.ts` — DB-free projection of each book's *current visible* edges through the **full apply chain** (SSOT batch → `resolve*` → role-normalize → faction/location skip → role-priority collapse → drop unresolved → `curation-overlay.final` tail), so the finder reviews exactly what a visitor sees. Added `discoverAllBatches()` for the full sweep.
- `scripts/resolve-book-edges.ts` — shared **pure** edge-derivation extracted verbatim from `apply-override.ts`, imported by both the apply path and the projection so they cannot drift (parity guarantee). `apply-override.ts` behaviour-neutral; its diff is the extraction only.
- `scripts/book-review/parity.ts` + `review:books:parity` — proves the projected state equals the `work_*` edges the apply path writes (sampled incl. W40K-0010, which lives in `final`).
- `scripts/book-review/sidecar.ts` — validates each subsession's JSON against the contract and merges confirmed findings **atomically/sequentially** into the reviewQueue sidecar; resolves addition surface-forms via the alias index, carries unresolved ones as `__unresolved__:<axis>:<slug>` sentinels + `rawName` + loud note.
- `scripts/book-review/selection.ts` — pilot vs full book selection.
- `scripts/book-review.ts` — driver subcommands (prepare / merge / parity). `prepare` is scope-aware (`--pilot` vs full) and **idempotent** (keeps a matching-scope manifest so a re-run resumes; `--force` rebuilds).
- `scripts/run-book-review-loop.sh` — the one-command CC-Direct driver: hard chunk size, a fresh `claude -p` subsession per chunk (`--allowedTools Read Write --permission-mode acceptEdits --model opus`), zero metered API, resumable (skips already-verified chunks), completeness gate before merge. The **Brief-131 MECHANICAL preamble is preserved byte-for-byte** for both finder and verifier (the token frame depends on it).
- `scripts/test-book-review.ts` — 49 tests (contract validation, projection/merge, sidecar cross-validation against the real `curation-overlay.json`, ledger routing).
- `scripts/seed-data/book-review-queue.json` — the committed reviewer output: 371 books, 608 confirmed edge proposals in `reviewQueue`, `final` empty (the reviewer applies nothing).
- `scripts/seed-data/facet-review-queue.json` — 11 books / 12 facet notes, split visible vs hidden `cw_*`; **no apply path**, hooked into nothing.
- `scripts/logs/book-review-log.md` — full findings table (raw/confirmed/refuted per dimension, pattern 144) + the 31 refuted with reasons.

### The full run (maintainer-directed, beyond the pilot)
- Ran `review:books` over all **889 books / 112 chunks of ≤8 / 90 batches**, Opus finder + Opus verifier. Token frame per subsession well under the ~120k target (chunk size 8). Hit the Max-allowance wall mid-run; resumed across waves (Max + usage credits) — the resume-skip made this seamless.

### Post-run promotion (maintainer-directed Codex hand-step)
- `scripts/seed-data/curation-overlay.json` — promoted the **96 applyable findings** (17 removes + 43 role-fixes + 36 adds that each resolve to an existing canonical id) from the queue into `final` (82 books), with full overlay provenance (`sourceKind: reviewer-b11`, confidence, checkedAt, note). The Brief-149 W40K-0010 (*The Magos*) maintainer entry was **preserved** alongside them (format→collection + Ordo Malleus add + Chaos remove), so `final` holds **83 books**. The 500 sentinels were left in the queue. Done via a throwaway generator (gitignored `ingest/book-review/review/_promote.mjs`); the committed artifact is the overlay JSON.
- `.gitignore` — ignore `/ingest/book-review/review/` (human-review slices, regenerable/deletable).

### The Drukhari split (maintainer-directed, beyond the pilot — see Decisions)
- `scripts/seed-data/factions.json` — new `drukhari` faction (parent `eldar`, xenos).
- `scripts/seed-data/faction-aliases.json` — re-pointed `Dark Eldar` / `Drukhari` / `Incubi` / `Mandrakes` from `eldar` → `drukhari`; `Aeldari`/`Eldar`/Craftworld forms stay on `eldar`.
- `scripts/seed-data/faction-policy.json` — `specialCases` note updated; `redundantWhenSubPresent` unchanged (so `eldar` + `drukhari` both survive on a book).
- `scripts/test-resolver.ts`, `scripts/test-aliases.ts`, `scripts/test-podcast-ingest.ts` — assertions updated Dark-Eldar/Drukhari → `drukhari`.

## Decisions I made

**These three depart from the pilot brief and want Cowork's explicit ratification.**

- **Scaled the pilot to the full 889-book run + parallelized the driver.** The brief scopes this session to a 40-book pilot and calls the full run "Maintainer-Betrieb, kein Build-Schritt." Philipp directed the full run this session, so I rewrote `run-book-review-loop.sh` from serial to a **bounded parallel pool** (`--concurrency`, `wait -n` gate, `--limit` waves, completeness gate, retry-without-die). The finder/verifier prompts, contract, projection, and merge are unchanged — only the orchestration scaled. *Why fine:* the full run is the same command in operation; the topology the pilot was meant to validate held (4.9 % refutation overall, and **0** findings landed on a book already in `final`). *Flag:* the pilot's clean Eisenhorn/Ravenor slice undersells the bulk false-positive rate; the messier 889 set genuinely needs the human triage the review-slices give.
- **Switched the ledger-conflict from abort → non-blocking routing.** The brief says a confirmed `add` + confirmed `remove` on the same axis+id+book must not resolve silently — "**Ledger-`conflict` oder Abbruch**." The original impl chose *Abbruch* (throw). At 889-scale one contradictory book (W40K-0191, *Crimson Tears*: remove `eldar` + add "Dark Eldar") aborted the whole merge of 824 good books. I switched to the brief's other sanctioned option — **route to a reported `ledgerConflicts` bucket and withhold both sides** from the queue (`sidecar.ts`), surfaced loudly in the merge summary + log. So it stays within the brief's allowance, just the non-blocking branch. The Drukhari split then dissolved this specific conflict (the two sides now resolve to distinct ids), so the final merge has **0 ledger conflicts**.
- **Created a distinct `drukhari` faction (reference-data change).** The run surfaced that Dark Eldar / Drukhari were conflated under the `eldar` umbrella, so Commorragh-centric books (the *Path of the Dark Eldar* line) could only ever be tagged the generic "Aeldari." Philipp decided he wants **both** `drukhari` and `aeldari`/`eldar`. This is a data correction (`factions.json` + `faction-aliases.json` + `faction-policy.json` + test updates), **not** resolver logic — `resolve.ts` / the alias-index *code* is diff-0, as the brief requires. But it *is* beyond the brief's "read-only consumer of the resolver" stance, so it needs blessing. It is the source of the 10 highest-value adds now in `final`.

**Within the brief (noted for completeness):**
- **Promotion `reviewQueue` → `final` was a maintainer/Codex hand-step**, exactly as the brief reserves it ("Der Reviewer promotet nichts"). The reviewer's own output (`book-review-queue.json`) still has `final` empty; the 96 were promoted by hand into the *separate* `curation-overlay.json`, on Philipp's approval after he reviewed the slices.
- **Human-review slices** (`ingest/book-review/review/*.md`, gitignored) organize the 608 by decision-type/risk for triage. Throwaway.

## Verification

- `npm run test:book-review` — **49 pass / 0 fail** (incl. ledger-routing + sidecar cross-validation against the real `curation-overlay.json`).
- `npm run test:resolver` — 507 / 0 · `npm run test:aliases` — 15 / 0 · `npm run test:podcast-ingest` — 30 / 0 (all green after the Drukhari updates).
- `tsc --noEmit` — clean.
- **Promotion validated DB-free**: every one of the 96 ids exists in the seed catalogs; roles valid; no add/remove clash; no duplicate book. 500 sentinels correctly excluded.
- **`apply:curation-overlay --dry-run`** (read-only): validated the overlay and **correctly halted** at the first edge referencing the new `drukhari` faction — that id is in the seed SSOT but not yet in the (frozen) DB. This is the expected apply-ordering, not a defect (see Open issues). No DB mutation occurred — the run stopped at validation.
- **No prod DB mutation.** Diff to `curation-overlay` apply/validator, `db:rebuild`, and `resolve.ts` logic = 0 (the only `apply-override.ts` diff is the pure-helper extraction into `resolve-book-edges.ts`).

## Open issues / blockers

**`status: needs-decision`** — these gate stage 3, which Philipp wants routed through Cowork first.

1. **Bless or revert the three deviations above** (full-run scaling, ledger-conflict routing, Drukhari split). The Drukhari split is the load-bearing one — it changes shipped reference data.
2. **When does any of this reach the DB?** Nothing has, and nothing can under the **standing DB-freeze (Brief 149/151)**: the runbook explicitly does not run `db:rebuild` against prod while the freeze holds. The 96 (overlay `final`) + the Drukhari split (reference JSONs) are now **armed in the committed SSOT**; they apply deterministically on the next `db:rebuild` — which seeds `drukhari` first (auto pass), re-points Dark-Eldar→drukhari across the corpus, then re-asserts the overlay tail (step 7/8) including the 96. So we don't hand-apply; we commit to SSOT (done) and they ride the rebuild **once Cowork/Philipp lift the freeze**. Confirmation of freeze status + rebuild timing is Cowork's call.
3. **Promotion provenance choice:** the 96 carry `sourceKind: reviewer-b11` (honest origin) rather than `manual`. Trivially changeable if Cowork prefers `final` entries read as maintainer-decided.
4. **W40K-0010 (*The Magos*) maintainer correction — preserved.** The B11 overwrite first dropped the Brief-149 entry (format→collection + Ordo Malleus add + Chaos remove); Philipp caught it, so it's re-armed in `final` and *The Magos* becomes `collection` on the next rebuild. Flag if any of the three parts is unwanted.
5. **ADR backfill (coordination-only):** per the brief's ADR note, the B11 topology (CC-Direct finder+verifier → reviewQueue; facets separate read-only; the 96-promotion path; the Drukhari split) wants a short ADR / `log.md` entry. `brain/**` + `sessions/README.md` are coordination-only, so this report carries the facts and Cowork backfills.

## For next session — stage 3 (the per-book web pass)

The agreed next phase, after Cowork's review: a **web-search + thinking Opus pass over a corrected baseline**, not over the diff. Shape:
- **Resolve the structural sentinels first** — factions + locations (~166 of the 500 distinct forms) are per-name, edition-independent (trust any credible wiki hit; *don't* over-narrow by edition), and high-value (mostly missing Space Marine chapters, planets, ships). Create/​map those, so the big pass starts from cleaner data.
- **Then re-review every book with web access** over the post-apply baseline: flag misplaced edges *and* verify/create the 315 one-off **character** sentinels, which resolve far better with book context than in isolation.
- **Keep the omnibus/content-scope guard** ("a series-level wiki association doesn't override a synopsis-based exclusion").
- This pass is **bigger than the run just completed** (web-search per book ≫ synopsis-only) → its own budgeted run / brief.

The 500 sentinels are already grouped by surface form in the (gitignored) `03-new-entities-to-create.md` slice — that's the worklist.

## References

- Arch brief: `sessions/2026-06-17-154-arch-book-reviewer.md`
- Overlay format + apply: `scripts/seed-data/curation-overlay.README.md`, `scripts/apply-curation-overlay.ts`, `scripts/curation-overlay.ts`
- Rebuild ordering + freeze: `scripts/runbooks/db-rebuild-runbook.md` (§ "Die Sequenz" step 7/8, § "DB-Freeze-Hinweis")
- Adversarial pattern: `sessions/archive/2026-06/2026-06-11-144-impl-technical-deep-review.md`
- CC-Direct driver pattern: `sessions/archive/2026-06/2026-06-07-131-arch-podcast-tagging-cc-direct.md`
