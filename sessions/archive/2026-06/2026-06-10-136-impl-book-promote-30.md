---
session: 2026-06-10-136
role: implementer
date: 2026-06-10
status: complete          # curation + DB apply of all 30 promoted books; resolver is the decoupled next step
slug: book-promote-30
parent: 2026-06-09-133     # weekly content refresh (Brief 133 / Board 122-B10)
links:
  - 2026-06-09-134        # book ignore-list ("cutoff") — produced the 30-wanted shortlist
  - 2026-06-10-135        # luetin (Video)-exclude follow-up (separate PR #154)
commits: []               # filled by the PR; this report rides inside the code branch
---

# Weekly-refresh promotion — curate + apply all 30 new books

> No arch brief — the deliberate next step after Brief 134 (book-cutoff) shipped the
> 30-wanted shortlist. Maintainer chose **"Run all 30 now"** (curate + db:apply + resolver
> in one session). This report covers **Phase A (roster)** + **Phase B curation + DB apply**.
> The **resolver** is the decoupled follow-up (Brief 094) — see "Resolver — the next step".

## Summary

The weekly content-refresh detection (Brief 133) + book ignore-list (Brief 134) distilled
the live book diff to **30 genuinely-wanted new books** (27 W40K + 3 HH). This session
promoted all 30 end-to-end through the existing paths:

- **Phase A — roster.** Pasted the 30 `proposal.json` `newBooks[]` into
  `book-roster.extension.json` → `npm run import:ssot-roster` → `book-roster.json`
  **859 → 889** (clean append, no display-order churn). Committed (Phase A is its own
  commit on this branch).
- **Phase B — curation.** Researched every book via per-book subagents (WebSearch
  synopsis/factions/characters/locations + Goodreads **page-read** for ratings), then
  validated + assembled here under the SSOT-loop disciplines. **24 of 30 page-rated**
  (3.35–4.38); 6 unrated (no Goodreads edition).
- **Phase B — apply.** `db:apply-override` for all five affected batches → **30 new works
  in Postgres** (+ 9 pre-existing books in the two extended restbatches idempotently
  re-applied). `persons.json` gained two authors (William Crowe, Rich McCormick).

## The restbatch problem (and how it was solved)

`loop:next` and the resolver detector both tile **positionally** by batch number
(`slice = max·10 … max·10+10`). The two domain-end batches were **partial restbatches** —
`ssot-w40k-057` held 5 books (W40K-0561..0565), `ssot-hh-030` held 4 (HH-0291..0294). The
30 new books are **W40K-0566..0592 (27) + HH-0295..0297 (3)**, so the first 5 W40K + 3 HH
new books landed *inside* those restbatches' positional slots — invisible to `loop:next`,
which jumped straight to position 570 (W40K-0571) and reported the HH domain complete.

Followed mechanically, `loop:next` would have **silently skipped 8 books**
(W40K-0566..0570 + HH-0295..0297). Resolved by **extending the two restbatches** rather
than mis-numbering:

| File | Before | After | New books |
|---|---|---|---|
| `ssot-w40k-057` | 5 (0561–0565) | **10** | +W40K-0566..0570 |
| `ssot-w40k-058` | — | 10 | W40K-0571..0580 (new file) |
| `ssot-w40k-059` | — | 10 | W40K-0581..0590 (new file) |
| `ssot-w40k-060` | — | **2** | W40K-0591..0592 (new file — new W40K domain-end restbatch) |
| `ssot-hh-030` | 4 (0291–0294) | **7** | +HH-0295..0297 |

Safe because **apply-override is delete-then-insert idempotent** (it resolves surface-forms
inline against the current seed and rewrites junctions per book) — re-applying the extended
057/hh-030 re-processed the 9 existing books with **identical** results (verified:
`path=update`, unchanged faction/facet counts). After the extensions `npm run loop:next`
reports **`loopComplete` at 889/889**, every roster position covered exactly once. The
extension files preserve their original `createdAt`/`model`; a `| Extended 2026-06-10…`
clause was appended to each `rationale`, and the existing books are byte-identical in the
diff (string-splice append, not re-serialization).

## Curation disciplines applied

- **Faction/location granularity.** No bare `Imperium`/`Chaos`/`Xenos`; compound or
  parenthetical agent surface-forms normalised to canonical bodies before write
  (e.g. `Astra Militarum — Valhallan Ice Warriors` → `Valhallan Ice Warriors`,
  `Orks (Speed Waaagh!)` → `Orks`, `Sisters of Battle` → `Adepta Sororitas`).
- **057 precedent for unnamed antagonists.** Where sources name only "a Chaos cult" /
  "the Archenemy" / unnamed defenders, the antagonist is **left unbound + a
  `low_confidence` flag** rather than guessed into a Legion: Hive, Veterans of the Fall,
  Grotsnik, Yarrick: Imperial Creed, Renegades, Zardu Layak, Aestred Thurga.
- **Pre-commit fixes** caught in validation: agent-proposed `"horror"` plot_type (not in
  catalog) → `"mystery"` (Dark Coil: Damnation); invalid `"duty"` theme dropped (Aestred);
  a shaky "Wazdakka Gutsmek" attribution dropped (World Ablaze); `"Imperium Nihilus"` /
  `"Imperium of Man"` umbrella drops (Saints of the Imperium, The High Kâhl's Oath);
  rating shapes normalised (`count` not `ratingsCount`, no `reason` on rated).
- **Synopsis guard.** All 30 synopses cleared the Public-Synopsis-Forward banned-pattern
  list (32 patterns) pre-commit and again at apply time (Brief 080 hard-throw).

## Apply results (DB-side)

| Batch | inserts | updates | note |
|---|---|---|---|
| ssot-w40k-057 | 5 | 5 | +0566..0570; 0561..0565 re-applied identically |
| ssot-w40k-058 | 10 | 0 | 0571..0580 |
| ssot-w40k-059 | 10 | 0 | 0581..0590 |
| ssot-w40k-060 | 2 | 0 | 0591..0592 |
| ssot-hh-030 | 3 | 4 | +0295..0297; 0291..0294 re-applied identically |

All five passed the apply-time synopsis guard, facet-id FK validation, and rating-override
validation. Surface-forms that did not resolve against the **current** seed landed in
`book_details.notes` between `---surfaceForms---` delimiters (the normal pre-resolver
state) — notably the newer entities (Leagues of Votann, Kindred of the Eternal Starforge)
and the new character/location names. The pre-existing "unresolved authorship: HH-0291
collected-visions" warning is an existing "various"-authors artbook, untouched here.

## Resolver — the next step (decoupled, NOT in this PR)

Per Brief 094 the resolver is a **separate headless loop**, not part of promote (the
weekly-refresh runbook's promote step is curate + apply only). `npm run resolver:next-wave`
detects the next wave as **`ssot-w40k-058..060` (resolver-pass-16)** — the three *new*
batches. It is driven by `scripts/run-resolver-loop.sh` (maintainer-launched: clean
worktree, six `claude -p` phase subsessions, auto-push + own PR).

**Restbatch caveat (carries to the resolver).** The detector tiles by batch number too, so
wave 058..060 does **not** include the surface-forms unique to the two *extended*
restbatches (W40K-0566..0570, HH-0295..0297). The bulk of their tags already resolve
(established entities — Orks, Astra Militarum, Armageddon, Adepta Sororitas, Word Bearers,
Iron Hands…); the long-tail unique forms (Freebooterz, Halo Stars, Sacramentus, Helwain,
Zardu Layak, Sons of the Selenar, …) sit in `notes` until covered. Two clean ways to close
it: (a) a single `run-resolver-pass.sh` wave with a **custom config** whose batch range
includes 057 + hh-030, or (b) fold those forms into the next regular sweep. Recommend (a)
as a targeted follow-up after wave 058..060.

## Verification

- **All 5 override files** validated pre-commit: roster id/slug match, facet-catalog
  membership (98 valid; 0 invalid after the `horror`/`duty` fixes), rating-shape, and the
  synopsis banned-pattern guard — **0 problems**.
- **`npm run loop:next`** → `loopComplete: true`, `cumulativeBefore: 889`.
- **`npm run db:apply-override`** ×5 → 30 inserts + 9 idempotent updates, all guards green.
- `typecheck`/`lint`/`brain:lint` skipped per Brief-061 convention (pure data + Markdown;
  no code/schema/config changed).

## Rollup facts for Cowork (Batches strand — I can't touch `brain/**`)

- **Roster is now 889** (859 frozen Excel + 30 extension). `book-roster.extension.json`
  carries the 30; `import:ssot-roster` stays byte-stable on re-run.
- **New override surface:** the SSOT override corpus now tiles 889/889 with a 2-book W40K
  domain-end restbatch (`ssot-w40k-060`) and a 7-book HH restbatch (`ssot-hh-030`). The
  **restbatch-extension pattern** (extend a partial domain-end batch rather than mis-number
  appended books) is the precedent for every future weekly-refresh promote — worth a
  one-line note in the promote runbook / `decisions`.
- **`loop:next` + resolver detector blind spot:** both tile by batch number, so books that
  land inside a partial restbatch's slot are invisible to auto-detection. Curate-side this
  is handled (extension); **resolver-side it is not** — the auto-wave skips extended
  restbatches. A detector tweak (book-count coverage rather than batch-number tiling), or a
  documented "extend → custom-config resolver wave" step, would close it.
- **persons.json +2** (william_crowe, rich_mccormick) — written by the apply's
  `ensurePersonsExist`, committed with the data.
- **Ops:** all 30 are **live in Postgres now** with synopsis/rating/facets + the
  surface-forms that resolved; the unresolved long-tail awaits the resolver loop.

## References

- Weekly refresh: `sessions/2026-06-09-133-*`, runbook `scripts/runbooks/weekly-refresh-runbook.md` § Promote.
- Book cutoff (30-wanted shortlist): `sessions/2026-06-09-134-impl-book-cutoff.md`.
- SSOT-loop disciplines: `scripts/runbooks/ssot-loop-runbook.md`; log block appended to `scripts/logs/ssot-loop-log.md` (2026-06-10 section).
- Resolver: `scripts/runbooks/resolver-pass-runbook.md`, `scripts/run-resolver-loop.sh`, `npm run resolver:next-wave`.
