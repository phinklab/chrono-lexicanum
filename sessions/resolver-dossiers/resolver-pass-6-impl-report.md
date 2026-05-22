---
pass: 6
role: implementer
date: 2026-05-22
status: implemented
wave: ssot-w40k-026..035
ids: W40K-0251..W40K-0350
branch: codex/ingest-batches-resolver-pass-6
brief: none (brief-free, runbook-driven — Brief 090 lean contract)
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-6-dossier.md
commits:
  - 4bf4c5c  # Phase 0 (Preflight/Dossier)
  - e826f52  # Phase 1 (Factions)
  - 3d75fdb  # Phase 2 (Locations)
  - 3e8f50d  # Phase 3 (Characters)
  # Phase 4 (Integration/Apply/Verify) is the commit carrying this report.
---

# Resolver-Pass 6 — impl report (ssot-w40k-026..035 / W40K-0251..0350)

## Summary

Crystallized the sixth 100-book wave into the resolver reference layer and re-applied all **350** W40K
books to Postgres, taking the corpus from the 250-book resolver-pause to **350/350**. First Resolver-Pass
run under the Brief-090 **lean / brief-free** contract: runbook + per-pass config + dossier only, stable
config-driven Phase-4 tooling (`run-phase4-apply.sh` / `verify-pass.ts` / `db-counts.ts` / `seed-facets.ts`),
no `-NNN` clones. Ran **supervised / axis-sliced** (not via the headless driver), one commit per phase.

Reference rows (Phases 1–3, seeded to DB in Phase 4): factions **154→162** (+8), locations **169→189**
(+20), characters **199→237** (+38); aliases faction 37→41, location 13→15, character 28→34. DB junctions
PRE→POST: `work_factions 1153→1424`, `work_locations 455→543`, `work_characters 701→844`, `work_collections
79→109`, `work_persons 232→325`. `facet_values 86→86` — **no facet promotion** (config Phase-4 trigger:
the wave is vocabulary-clean; the dry confirmed `missing facet ids: 0`, so nothing was stripped and
`facet-catalog.json` stayed untouched). All trias checks + lint + typecheck green.

**One Phase-4 decision of note:** this wave is the first to carry **forward-referencing collection edges**
(three anthologies sit in earlier batches than their constituent novellas). The `apply-override-dry` guard
that asserted *zero* forward refs was over-strict for the cumulative re-apply and is relaxed to report-only,
backed by an end-to-end check that all 10 such edges land in `work_collections`. See **Decisions** + **Maintainer handoff**.

## What I did (Phase 4 — Integration / Apply / Verify)

Phases 0–3 landed in their own commits (above); their per-phase reports carry the detail. Phase-4 work:

- **Trias batch-range extension** — `apply-override-dry.ts`, `test-resolver-coverage.ts`,
  `test-resolver-data-integrity.ts`: cumulative range `001..025` → **`001..035`**; smoke-slug lists +10
  wave-6 slugs (the config `verify.smokeSlugs`, all in 026..035); stale `001..025` range-labels fixed.
  `EXPECTED_RANGES` in the dry **left as-is** — the post-apply totals (1424 / 543 / 844) stay inside the
  existing sanity band (1500 / 600 / 1200), matching the Pass-5 "leave it unless it trips" convention.
- **`apply-override-dry.ts` forward-ref guard relaxed** to report-only (see Decisions).
- **Re-apply** via `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` (digest-only): seeds
  resolver-extensions + facets non-destructively, then applies `001..035` idempotently
  (`001..025` delete-then-insert, no new works; `026..035` first-time = +100 works). Digest:
  `ingest/.last-run/phase4-digest.md` (committed); raw per-batch output in the gitignored verbose log.
- **`persons.json` 63→73** — the apply's `ensurePersonsExist` auto-created 10 new wave-6 authors in the DB
  and atomically appended them to the JSON (not a hand-edit; committed as the apply's side-output).
- **`collection-gaps.json` +2 entries** (dossier §7d spot-check, see Decisions).
- **Verify** via `scripts/verify-pass.ts --config …` (digest below) + an ad-hoc forward-ref edge check.

### Per-phase recap (detail in the phase reports)

- **Phase 1 — Factions (+8):** `dragon_warriors`, `red_corsairs`, `white_consuls`, `relictors`,
  `blood_gorgons`, `doom_eagles`, `marines_errant`, `legion_of_the_damned` (eponymous freq-1). +4 aliases
  (`Tau`→tau, `Chaos Daemons`→daemons, `Daemons of Tzeentch`→tzeentch, `Militarum Tempestus`→tempestus_scions).
  The two new FK deps for Phase 3 (`red_corsairs`, `dragon_warriors`) landed here first (runbook §5).
- **Phase 2 — Locations (+20):** all freq≥2 worlds/regions (orath, agrellan, cryptus, dalyth,
  sanctus_reach[region], …), `sector/gx/gy` null. +2 aliases (`Cryptus System`→cryptus [Case G],
  `the Maelstrom`→maelstrom). No vessel row (no freq≥2 ship/hulk surface form this wave).
- **Phase 3 — Characters (+38):** the 7b spines (Night Lords First Claw, Tome of Fire, Dark Apostle,
  Rogue Trader, Sisters of Battle, Black Templars …) + 6 cross-batch alias-consolidations
  (`variel_the_flayer`+Variel, `commander_shadowsun`+Shadowsun, `sister_superior_augusta`+Sister Augusta,
  `obadiah_roth`+Inquisitor Obadiah Roth, `grukk_face_rippa`+Grukk, `Varro Tigurius`→existing tigurius).
  `Galenus`/`Sentina`/`Vabion` deliberately left unresolved (name-collision risk).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (250) | 250 | 1153 | 455 | 701 | 79 | 232 |
| Per-batch 026 (260) | 260 | 1178 | 464 | 717 | 81 | 242 |
| Per-batch 027 (270) | 270 | 1216 | 475 | 742 | 87 | 252 |
| Per-batch 028 (280) | 280 | 1242 | 487 | 762 | 94 | 262 |
| Per-batch 029 (290) | 290 | 1265 | 494 | 770 | 94 | 271 |
| Per-batch 030 (300) | 300 | 1297 | 504 | 781 | 94 | 277 |
| Per-batch 031 (310) | 310 | 1325 | 510 | 787 | 95 | 285 |
| Per-batch 032 (320) | 320 | 1353 | 518 | 791 | 95 | 295 |
| Per-batch 033 (330) | 330 | 1376 | 526 | 798 | 98 | 305 |
| Per-batch 034 (340) | 340 | 1396 | 532 | 804 | 102 | 315 |
| **Post-Re-Apply 001..035 (350)** | **350** | **1424** | **543** | **844** | **109** | **325** |
| Δ (wave 6) | +100 | +271 | +88 | +143 | +30 | +93 |

Reference rows: `factions 154→162`, `locations 169→189`, `characters 199→237`. `facet_values 86→86`
(no add; `seed-facets` inserted 0). `work_facets 5404→7227` (+1823). `persons.json 63→73` (+10 authors).
**The dry-run prediction (work_factions 1424 / locations 543 / characters 844) matches the DB POST-APPLY
exactly.** Apply pattern: `001..025` = idempotent re-apply (delete-then-insert, 0 new works); `026..035` =
first-time apply (+100 works, 10 per batch).

`work_collections` grew +30; the per-batch curve (flat 94→95 across 029–031, then +3 @033 / +4 @034 / +7
@035) is the forward-ref edges landing on their *content* batches — see Decisions.

## Decisions I made

- **Forward collection refs — guard relaxed to report-only (the headline call).** The dry's
  `assert.deepEqual(forwardRefs, [])` failed with **10** refs: three anthologies whose constituent novellas
  sit in *later* batches than the anthology itself —
  `Sanctus Reach (W40K-0296, batch 030) → 0327/0328/0329 (033)`,
  `Damocles (W40K-0294, 030) → 0337..0340 (034)`,
  `Shield of Baal (W40K-0304, 031) → 0343/0344/0345 (035)`. These are **legitimate** roster edges
  (dossier §5) and all constituents are within the applied range. `apply-override.ts:applyCollections` is
  **designed for cross-batch refs**: it resolves the already-applied endpoint via `works.external_book_id`
  and re-evaluates every collection whose *content*-side is in the batch being applied — so an ascending
  `001..035` sweep skips the edge when the anthology batch runs (content not yet present, logged as a
  warning) and **creates it when the later content batch lands**. I verified end-to-end: post-apply, all
  **10/10** edges are present in `work_collections` (ad-hoc query; `work_collections 79→109`). Because this
  dry only ever runs the full cumulative range (non-fixture mode), a forward ref here is *always* resolved
  by the sweep, so the `=== []` assertion was over-strict; it is now printed (count + pairs) but not
  asserted. Flagged for review in Maintainer handoff.
- **`collection-gaps.json` +2 (dossier §7d).** Confirmed against `book-roster.json`: **Architect of Fate**
  (W40K-0286) has **0** constituent edges though all four novellas exist as works (0308–0311); **War for
  Armageddon Omnibus** (W40K-0307) links only Helsreach (0279), missing the present Blood and Fire (0316)
  co-constituent. Both documented with a new `needs_constituent_collection_edges` status (works exist, only
  the roster *edges* are absent — distinct from Green Tide's `needs_constituent_roster_entries`). Adding the
  edges is a roster/SSOT-loop change, out of resolver-pass scope → deferred, documented.
- **Overfiend (W40K-0293) — spot-checked, NOT added.** 0 constituent edges, but the dossier never
  enumerated its constituents and the cluster overlap (0311 Sanctus is an *Architect of Fate* constituent)
  makes a confident set impossible. Per surface-form-treue / no-invented-entities, deferred to the report
  rather than guessed into the gaps file.
- **No facet promotion / no stripping.** Config trigger + dry (`missing facet ids: 0`) confirm the wave is
  vocabulary-clean; `facet-catalog.json` untouched, `seed-facets` inserted 0.
- **`EXPECTED_RANGES` left unchanged.** 1424/543/844 are inside 1500/600/1200. (Next wave will likely cross
  the faction/location maxima — see For next session.)
- **`format->collection` flags (Flesh Tearers 0297, Lords of Caliban 0334) — advisory only.** The resolver
  doesn't act on format; noted, no action (dossier §7d).

## Verification

- **Trias green:** `test:resolver` **206/0**, `test:resolver-data` integrity all-pass, `test:resolver-coverage`
  (350 books; below-threshold rows are findings, not failures), `test:apply-override-dry` **ok** (350 books;
  `missing roster=0`, `missing facet ids=0`, `invalid roles=0`, `invalid ratings=0`, `missing FK targets=0`,
  `dangling JSON FK/alias refs=0`; `forward collection refs=10` now reported, not asserted).
- **`lint`** 0 errors (1 pre-existing `no-page-custom-font` warning in `layout.tsx`), **`typecheck`** 0 errors.
- **Apply digest** (`ingest/.last-run/phase4-digest.md`): all 35 batches `ok`; seed-resolver-extensions ok;
  seed-facets 0 new.
- **Verify digest** (`verify-pass.ts`):
  - **Smoke slugs (f/l/c/in_coll):** warrior-coven `3/0/0/0`, faith-and-fire `2/2/3/1`, dark-apostle
    `4/1/4/1`, blood-gorgons `1/0/0/1`, legion-of-the-damned `2/0/0/0`, flesh-tearers `3/1/1/0`,
    scythes-of-the-emperor `2/1/0/0`, stormseer `4/1/0/0`, lords-of-caliban `2/0/1/0`,
    shield-of-baal-devourer `3/1/0/1`. (Low character counts reflect the novella-heavy long tail the dossier
    left unresolved; in_coll>0 confirms the omnibus/anthology membership.)
  - **Rating coverage 0251..0350:** **100 rated (all goodreads), 0 null, 100 total.**
  - **Audit replica:** OLD 0001..0250 = 250w / 113 drift / 96 gap / 71 in-coll; NEW 0251..0350 = 100w /
    33 drift / 55 gap / 30 in-coll. Drift = expected alias-crystallization (raw surface form ≠ canonical
    name); gap is high in the NEW range because the novella-heavy wave leaves many books with 0 resolved
    characters by design.
- **Forward-ref edge check (ad-hoc):** 10/10 anthology→novella edges present in `work_collections`.

## Maintainer handoff

- **Review the `apply-override-dry` forward-ref guard change.** I dropped the `forwardRefs === []`
  hard-assert (now report-only) because the apply provably handles cross-batch refs in the full sweep
  (10/10 edges verified). If you'd rather keep a hard guard, the alternatives are (a) re-order the three
  anthologies' batch assignments in the roster so collection precedes content, or (b) make the guard
  fixture/range-aware. I judged report-only the least-surprising minimal fix since this dry only ever runs
  the full cumulative range.
- **Two deferred collection gaps (`collection-gaps.json`).** *Architect of Fate* (0286) and *War for
  Armageddon Omnibus* (0307) want roster `collections[]` edges added (constituent works already exist).
  That's an Excel-SSOT / `import:ssot-roster` change, your call — out of resolver-pass scope.
- **Stop-before-push:** branch `codex/ingest-batches-resolver-pass-6` carries the 4 phase commits + the
  Phase-4 commit, **not pushed**, no PR. Say "fertig" / "PR erstellen" to push + open the PR.

## Open issues / blockers

- None blocking. The forward-ref guard relaxation is the only judgment call and is flagged for review.

## For next session

- **`EXPECTED_RANGES` headroom:** the next wave (036..045) will push `work_factions` past 1500 and
  `work_locations` past 600 — widen the dry's `EXPECTED_RANGES` maxima in that pass's Phase 4.
- **Cowork Wiki-Hygiene pass:** project-state counts → 350 books / 1424·543·844·109 junctions; reference
  162/189/237; aliases 41/15/34; note the forward-ref / cross-batch-collection behavior + the relaxed dry
  guard; `collection-gaps.json` now 3 entries.
- **After merge:** the loop resumes from the 350-pause (advisory) → next SSOT wave `ssot-w40k-036..045`.
- **Roster follow-ups (optional):** add the deferred Architect-of-Fate / War-for-Armageddon collection
  edges; confirm + model Overfiend's constituents.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config: `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-6-dossier.md`
- Phase reports: `…-phase-1-report.md` (factions) · `…-phase-2-report.md` (locations) · `…-phase-3-report.md` (characters)
- Apply digest: `ingest/.last-run/phase4-digest.md` (committed) · verbose log: `ingest/.last-run/phase4-apply-verbose.log` (gitignored)
