---
session: 2026-05-30-107
role: implementer
date: 2026-05-30
status: complete
slug: full-rebuild-restore-wiring
parent: 2026-05-30-107
links:
  - 2026-05-30-107-arch-full-rebuild-restore-wiring
  - 2026-05-29-105-arch-buy-listen-links
  - 2026-05-29-105-impl-data-buy-listen-links
commits: []
---

# Full-Rebuild-Restore-Wiring — `apply:audiobook-narrators` als deterministischer Tail der SSOT-Reset-Sequenz

## Summary

Ein neuer dünner, confirm-gegateter `db:rebuild`-Orchestrator (`scripts/db-rebuild.sh`) verkettet `db:reset-for-ssot` → Voll-Korpus-Apply-Wellen → `apply:audiobook-narrators` → einen read-only Verify-Schritt, sodass ein voller SSOT-Rebuild die 88 Hörbuch-Credit-Rows nicht mehr still verlieren kann. Alle bestehenden Bausteine bleiben in ihren Internals unangetastet — der Worker bekam nur einen additiven `--verify`-Modus; der Verify ist **Sidecar-abgeleitet** (heute 88), nicht literal.

## What I did

- `scripts/db-rebuild.sh` (neu, +153 Z.) — Orchestrator. `set -euo pipefail`, `cd` zur Repo-Root (wie `run-phase4-apply.sh`). Confirm-Gate (`--confirm` / `DB_RESET_CONFIRM=1`; nackter Lauf verweigert + exit 1, kein Truncate). Fail-fast-`step()`-Runner mit klarem `FAILED at step: …`-Marker. Vier Schritte: 1) `npm run db:reset-for-ssot -- --confirm`, 2) `bash scripts/run-phase4-apply.sh scripts/db-rebuild.config.json`, 3) `npm run apply:audiobook-narrators`, 4) `npm run apply:audiobook-narrators -- --verify`. `--help` ohne DB-Zugriff.
- `scripts/db-rebuild.config.json` (neu) — dedizierte, sprechend benannte Voll-Korpus-Config. `aggregator.applyRanges` = `[{w40k 1..57}, {hh 1..30}]` (alle 859), `batches: []`. Mirror der Multi-Range-Form, die `run-phase4-apply.sh` bereits unterstützt.
- `scripts/apply-audiobook-narrators.ts` (rein additiv) — neuer `--verify`-Modus: lädt+validiert das Sidecar (bestehender `loadAndValidate`), löst `externalBookId → works.id` auf (dieselbe UNIQUE-Query wie der Apply) und prüft **exakte Mengen-Gleichheit** der `(workId, personId, role)`-Tripel (= `work_persons`-PK) zwischen Sidecar-Erwartung und DB. Grün nur, wenn alle Bücher auflösen, jeder Credit als exaktes Row präsent ist, **keine** verwaisten Audio-Rows existieren und die Erwartung nonzero ist; bei Fehler werden die konkreten fehlenden/verwaisten Tripel gelistet. `process.exit(ok ? 0 : 1)`. Apply-/Dry-Run-Pfad und das graziöse Überspringen unbekannter IDs **unverändert**.
- `package.json` — neuer Script-Eintrag `"db:rebuild": "bash scripts/db-rebuild.sh"` (neben `db:reset-for-ssot`).
- `sessions/db-rebuild-runbook.md` (neu) — knapper Ops-Doc (sessions/-Geschwister, **nicht** `brain/**`): Sequenz, Vorbedingungen, Confirm-Gating, erwartete Verify-Ausgabe (mit Sidecar-abgeleitet-Hinweis), Fail-Fast/Idempotenz, Out-of-scope, Config-Wartung.
- `sessions/2026-05-30-107-arch-full-rebuild-restore-wiring.md` — Status `open → implemented` (Ein-Zeilen-Edit, reitet in dieser Code-PR mit; PR-Policy „code-handing brief").

## Decisions I made

- **Skript-Sprache = bash-Geschwister** (Open question 1). Ein bash-Orchestrator ist die natürliche Form: `run-phase4-apply.sh` ist selbst bash und **muss** ohnehin via `bash …` aufgerufen werden, also kauft ein TS-Orchestrator nichts (er müsste trotzdem dorthin shellen) und addierte nur `child_process`-Plumbing. Der `db:rebuild`-npm-Eintrag wickelt `bash scripts/db-rebuild.sh`. **Verifiziert:** `npm run db:rebuild` löst `bash` sauber auf (die npm-Shell findet Git-Bash) — der nackte Lauf lief bis zur Verweigerung durch. Fallback `bash scripts/db-rebuild.sh --confirm` im Runbook dokumentiert, falls eine npm-Shell `bash` mal nicht auflöst.
- **Voll-Korpus-Config = eigene, sprechend benannte Datei** `scripts/db-rebuild.config.json` (Open question 2), **nicht** `consolidation-pass-2.config.json` zweckentfremdet. Sauberer: Rebuild-Semantik wird nicht an eine konsolidierungs-benannte Datei gekoppelt (die heute zufällig denselben 859er-Scope abdeckt). Kostet eine Datei. **Keine brittle Batch-Liste** — `applyRanges` (zwei Domänen-Ranges), die exakt etablierte Form, die `run-phase4-apply.sh` schon liest. Wartungsprofil = identisch zu `consolidation-pass-2.config.json`: Ein-Zeilen-Bump der Range-Obergrenze beim Crystallizing einer **neuen** Batch-Range; innerhalb bestehender Ranges wachsende Bücher deckt die Re-Apply automatisch ab (im Runbook § Config-Wartung notiert).
- **Verify-Mechanik = `--verify`-Modus am Worker** (Open question 3), **nicht** Count-Assertion im Orchestrator. Der Worker besitzt bereits die Sidecar-Parsing-/Validierungs-Logik (`loadAndValidate`), die `externalBookId → works.id`-Auflösung und die `AUDIO_ROLES`-Definition — die Erwartungs-Ableitung + der DB-Abgleich gehören in dieselbe Datei, statt das in bash zu duplizieren. Liest **wirklich aus dem Sidecar** (kein literal `88`). Der `--verify`-Modus ist eine **separate** Mode (read-only, hard-fail); der Apply-Pfad bleibt freundlich (graziöses Skip) — exakt die Brief-Trennung „Vollständigkeits-Check im Verify, nicht im Worker-Apply".
- **Verify = exakte Mengen-Gleichheit, nicht Gesamtzahl** (Codex-Review eingearbeitet, 2026-05-30). Die erste Fassung verglich nur `actualTotal === expectedTotal`. Codex flaggte korrekt, dass das false-positivt: narrator 64 / co_narrator 11 / full_cast 13 (Summe 88) bestünde gegen erwartet 63/12/13, ein fehlendes Sidecar-Row würde durch ein überzähliges Row anderswo maskiert. Für „deterministisch wiederhergestellt" prüft der Verify jetzt die exakte Menge der `(workId, personId, role)`-Tripel (= `work_persons`-PK): jeder Sidecar-Credit als exaktes Row + jedes Buch aufgelöst + keine verwaisten Rows. Das subsumiert per-Rolle-Gleichheit und ist die von Codex genannte „stärkere Version". **Negativ-Test bewiesen:** ein Fixture mit Summe 88 + per-Rolle 63/12/13 identisch, aber **einem** geänderten Person-Tripel → alte Logik hätte bestanden, neue meldet `1 missing + 1 stray`, exit 1.
- **Audio-Apply als finaler Tail, kein Tail in `run-phase4-apply.sh`** (Brief-Vorgabe befolgt) — die generische Per-Welle-Engine hätte den Audio-Apply pro Resolver-Welle redundant gefeuert.
- **`apply-override.ts` gar nicht angefasst, `run-phase4-apply.sh`/`db-reset-for-ssot.ts` Internals unverändert** — der Orchestrator ruft sie nur. Am Worker nur der additive `--verify`.
- **`db:seed` bestätigt NICHT auf dem SSOT-Rebuild-Pfad** und unangetastet gelassen: `db:seed` ist der Legacy-V1-26-Manuals-Dev-Seed (`scripts/seed.ts`, anderer ID-Raum als die Voll-Korpus-`externalBookId`s, auf die das Sidecar gekeyt ist). Der Rebuild fährt ausschließlich `db:reset-for-ssot` + Apply-Wellen. Kein Wiring, kein Deprecation-Flag.

## Verification

Alle non-destruktiven Checks grün. Der **destruktive End-to-End-Lauf** (`db:rebuild -- --confirm`) wurde **bewusst nicht** unilateral gegen die Live-Produktions-DB gefahren (er truncatet `works` + re-applied 859 Bücher; die DB steht bereits korrekt im Ziel-Endzustand). Jede Komponente ist einzeln non-destruktiv bewiesen — Kommando + erwartete Ausgabe für Philipp unten.

- `npm run typecheck` (`tsc --noEmit`) — **pass** (0).
- `npm run lint` (`eslint .`) — **pass** (0).
- `npm run brain:lint -- --no-write` — **pass** (0 blocking; 29 Warnungen, alle vorbestehend/unverändert).
- `npm run test:resolver` — **473 passed, 0 failed**.
- `npm run test:resolver-data` — **ok** (inkl. coverage-smoke `w40k-001..057 + hh-001..030`).
- `npm run test:resolver-coverage` — **ok** (nur Data-Findings).
- `npm run test:apply-override-dry` — **ok** (`out-of-range=0, unknown-work=0`).
- `npm run test:collection-refs` — **10/0**.
- `npm run test:audiobook-narrators` — **12/0**.
- **Confirm-Gate** — `npm run db:rebuild` (nackt) → verweigert mit Refuse-Meldung + Help, **exit 1**, kein Truncate. ✓ (Acceptance: nacktes `db:rebuild` truncatet nicht.)
- **Verify OK-Pfad (READ ONLY, Live-DB)** — `npm run apply:audiobook-narrators -- --verify` → `Expected 88 (63/12/13)` == `Actual 88 (63/12/13)`, `Books resolved 66/66`, exakte Tripel-Mengen-Gleichheit, `VERIFY OK`, **exit 0**.
- **Verify Masking-Negativtest** (der Codex-Befund) — Fixture mit Summe **88** + per-Rolle **63/12/13 identisch**, aber einem geänderten Person-Tripel (`Toby Longworth` → `Toby Longworth ZZZ` auf HH-0001) → `VERIFY FAILED — 1 missing (toby_longworth_zzz) + 1 stray (toby_longworth)`, **exit 1**. Die alte Total-only-Logik hätte bestanden. ✓
- **Verify Grob-Mismatch-Pfad** — `--verify --file=<temp 1-Credit-Fixture>` → `VERIFY FAILED`, **exit 1**.
- **`--dry-run`-Regression (READ ONLY, Live-DB)** — `--dry-run` löst weiter `66/66` Bücher → `88 rows to write` auf, **exit 0** (mein `--verify`-Flag hat den Apply-/Dry-Pfad nicht angetastet).
- **`--help`** — Orchestrator `--help` → **exit 0**, kein DB-Zugriff.
- **Live-DB-Baseline (read-only `db-counts`):** `works=859`, `work_persons=873` (= 785 author/editor + 88 audio), `work_factions=2754`, `work_locations=1146`, `work_characters=2000`, `work_collections=196`.

### Destruktiver End-to-End-Lauf — Kommando + erwartete Ausgabe (für Philipp)

Wenn du den vollen Lauf gegen die DB fahren willst (idempotent/restaurativ — rebuildet auf den aktuellen Stand):

```
npm run db:rebuild -- --confirm
```

Erwarteter Endzustand nach Schritt 2 (POST-APPLY-Counts im Digest `ingest/.last-run/phase4-digest.md`): `works=859`, `work_persons` ~785 (author|editor), dann nach Schritt 3 → 873 (inkl. der 88 Audio-Rollen). Erwarteter Verify (Schritt 4):

```
=== audiobook-narrators verify [READ ONLY] ===
Expected (sidecar-derived): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Actual   (DB work_persons): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Books resolved: 66/66
VERIFY OK — all 88 sidecar audio credits present as exact (work, person, role) rows; no stray rows.
```

**Entscheidung (Philipp, 2026-05-30):** der destruktive Lauf wird **nicht** durch CC gefahren — er bleibt maintainer-owned (Philipp fährt ihn maximal selbst). Der Lauf ist idempotent/sicher, wurde aber bewusst zurückgehalten, weil er die Live-DB truncatet und sie bereits im Ziel-Endzustand steht. Jede Komponente ist einzeln non-destruktiv bewiesen (oben).

## Open issues / blockers

Keine. Status `complete`.

- **Reference-Tabellen-Zustand nach dem Reset** (Open question 4): `db-reset-for-ssot.ts` bewahrt `persons` (steht in `REFERENCE_TABLES`, eigene Assertion). Die 29 Performer-`persons`-Rows überleben also einen Reset und sind nach dem Truncate kurz **verwaist** (ohne `work_persons`-Junctions) — bis Schritt 3 ihre Audio-Junctions neu schreibt. Kein Problem: `apply-audiobook-narrators.ts` legt fehlende `persons` ohnehin FK-sicher an (`onConflictDoNothing`), eine vorhandene verwaiste Person ist idempotent ein No-op. Kein Orphan-Cleanup nötig.

## For next session

Out-of-scope-Beobachtungen, nicht in dieser Session gefixt:

- **859er-Audiobook-Full-Sweep** (~790 Rest-Bücher). Der Verify ist bereits Sidecar-abgeleitet — wenn der Sweep das Sidecar wachsen lässt, steigt die erwartete Verify-Zahl automatisch mit, **ohne** Edit an `--verify` oder am Runbook. (Brief 107 Out-of-scope.)
- **Destruktiven End-to-End-Lauf** (maintainer-owned, s. o.) — falls Philipp eine finale Live-Bestätigung der vollen Sequenz will, am ehesten gegen eine Wegwerf-/Staging-DB. Kein CC-Job.
- **CI deckt `db:rebuild` nicht ab** (kein DB in CI) — bewusst; die Komponenten sind über die DB-freien Trias + die read-only Verify-Modi abgesichert.

## References

- Brief 107: `sessions/2026-05-30-107-arch-full-rebuild-restore-wiring.md`
- Bausteine: `scripts/db-reset-for-ssot.ts` (Confirm-Gating-Vorlage), `scripts/run-phase4-apply.sh` (Orchestrator-/`FAILED`-Pattern, Multi-Range-Loader), `scripts/apply-audiobook-narrators.ts` (Worker), `scripts/consolidation-pass-2.config.json` (Voll-Korpus-`applyRanges`-Form-Vorlage).
- Sidecar: `scripts/seed-data/audiobook-narrators.json` (66 Bücher, 88 Credits — narrator 63 / co_narrator 12 / full_cast 13, 29 Performer, 4 audit).
