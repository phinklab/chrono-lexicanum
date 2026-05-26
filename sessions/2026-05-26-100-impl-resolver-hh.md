---
session: 2026-05-26-100
role: implementer
date: 2026-05-26
status: complete
slug: resolver-hh
parent: 2026-05-26-100
links:
  - 2026-05-23-094-arch-resolver-loop
commits: []
---

# Resolver für die HH-Domäne — Loop-Maschinerie zwei-domänen-fähig + Pre-Heresy-Bootstrap-Disziplin

## Summary

Resolver-Loop ist jetzt zwei-domänen-fähig (W40K + HH). Detektor durchläuft die Domains sequenziell mit den drei externen Terminal-Zuständen `open-wave | idle | all-complete`; der W40K→HH-Übergang ist ein interner Branch-Point. Live-Smoke gegen den aktuellen Repo-Stand (W40K resolved durch Pass 9, 30/30 HH crystallized) liefert die erwartete Bootstrap-Welle `ssot-hh-001..002` (20 Bücher, Pass 10).

## What I did

- `scripts/resolver-loop-detect.ts` — komplett umgebaut: `Domain` + `DOMAIN_ORDER` Typen; `HH_BOOTSTRAP_WAVE_TARGET=20` / `HH_BOOTSTRAP_WAVE_HARD_CAP=25`; `CrystallizedBatch.domain`, `WaveDescriptor.domain` + `.label`, `DetectInput.{hhRosterCount, w40kProgressBatch, hhProgressBatch}`, `ApplyRange.domain`; `DetectResult` Terminal-Status `"w40k-complete"` → `"all-complete"`; `detectNextWave` läuft sequenziell W40K-first; `buildWaveConfig` domain-parametrisiert (batchIds, `applyRange.domain`, externalId-Prefix `W40K-`/`HH-`); `parseResolverLoopLog` zwei-domänen via `ssot-(w40k|hh)-` Regex, gibt `{ w40kProgressBatch, hhProgressBatch, nextPassNumber }` zurück; `loadInputs` matcht beide Domains, zählt Roster pro Domain separat.
- `scripts/test-resolver-loop-detect.ts` — Tests auf zwei-domänen umgestellt; alle existierenden Cases bleiben (in neuer Form); neue Cases für HH-Bootstrap (`partitionWaves` cap=25/target=20), HH-Regular (cap=60 nach Bootstrap), `w40k-complete-hh-pending` Boundary, `all-complete`, HH-idle, HH-final-restwave, HH-Wave-Triggers + Phase-4a-Trigger-Text, gemischter W40K/HH-Log. 36 Cases, alle grün.
- `scripts/run-resolver-loop.sh` — Header-Kommentar (Z2-25), EXIT-CODE-Doc (Z47) auf `all-complete` umformuliert; `w40k-complete)` Switch-Case zu `all-complete)`; Wave-Label-Zusammenbau (`WAVE="ssot-w40k-${WAVE}"`) entfernt — Wrapper liest `wave.label` jetzt 1:1 aus dem Detektor-JSON. Wrapper ist domain-agnostisch.
- `scripts/apply-override-dry.ts` — `BATCHES` von `string[]` auf `{ domain, n }[]` mit `as const satisfies ReadonlyArray<…>`; `loadOverrideBatches` nutzt `manual-overrides-ssot-${b.domain}-${b.n}.json` und `ssot-${b.domain}-${b.n}`; `batchLabel` gruppiert per-Domain (`ssot-w40k-001..057 + ssot-hh-001..030` post-HH); `EXPECTED_RANGES.factions.max` 2100→2500, `.locations.max` 800→1100, `.characters.max` 1400→2200 (Min bleibt W40K-Floor — schützt gegen accidental zero-apply).
- `scripts/test-resolver-coverage.ts` — gleiche `BATCHES`-Schema-Umstellung; Pfad-Template `manual-overrides-ssot-${b.domain}-${b.n}.json`; neuer `batchRangeLabel()` für die Header-Zeile (per-Domain-Gruppierung).
- `scripts/test-resolver-data-integrity.ts` — gleiche `OVERRIDE_BATCHES`-Schema-Umstellung; Pfad-Template anaog.
- `sessions/resolver-pass-runbook.md` — §4 erweitert um Subsection „Cross-Era-Identitäten (HH ↔ W40K)": Faction-Rename (Luna Wolves ↔ Sons of Horus), Character-Honor-Title-Split (Kharn ↔ Kharn the Betrayer u. a.), Primarchen-Pattern, Ausnahme „echte Identitäts-Disambig → `## Needs decision`", Surface-Form-Treue. Anhang um Brief 100 in der Herkunfts-Liste ergänzt. Keine Brief-Verweise im operativen Body — Runbook bleibt selbst-enthalten.
- `sessions/2026-05-26-100-arch-resolver-hh.md` — Brief von Cowork-primary-Worktree hierher portiert + `status: open` → `status: implemented` (siehe **Decisions** unten zur Begründung).

## Decisions I made

- **Variant A (statische Tupel) für die Verify-Trias.** Brief erlaubt sowohl statische Tupel als auch config-/roster-getrieben. Tupel sind explizit, greppbar, und der Append-after-Pass-Workflow (Phase-4a-Trigger) ist eine offensichtliche `{ domain, n }`-Erweiterung. Die finalen W40K-Tupel sind ohnehin fix bei 57 Einträgen, HH bei 30, also wächst die Liste nie über 87 — tractable.
- **HH-Tuples NICHT pre-added.** Trotz aller 30 HH-Override-Files in `main` lasse ich die Trias-`BATCHES` bei W40K-001..057. Der Phase-4a-Trigger jeder zukünftigen HH-Welle fordert CC auf, die `{ domain: "hh", n: "NNN" }`-Tupel der Welle zu appenden. Materielle Verify-Abdeckung ist erst nach dem ersten HH-Pass relevant; pre-adding würde die idempotent-applyRange-Voraussetzung der heutigen Trias verletzen (Phase 4a wendet nur die `applyRange` der aktuellen Welle re-applied — HH-Daten sind heute nicht applied, Bereich also nicht zu testen).
- **EXPECTED_RANGES — Maxima nach Brief-Vorschlag, Minima unverändert.** Brief gibt `factions.max=2500`, `locations.max=1100`, `characters.max=2200`. Übernommen. Minima bleiben bei `factions.min=500`, `locations.min=180`, `characters.min=430` — sie schützen W40K-Floor gegen accidental zero-apply; nach dem ersten HH-Pass ist eine konservative Anhebung sinnvoll, aber heute nicht nötig (gemessen am Heute-Apply der reinen W40K-Range).
- **`HH_BOOTSTRAP_WAVE_TARGET=20`, `HH_BOOTSTRAP_WAVE_HARD_CAP=25`.** Brief-Vorschlag direkt übernommen. Mit Batch-Größe 10 ist der Cap (25) das bindende Limit — Batch 003 würde currentBooks von 20 auf 30 treiben und gegen die Cap overflowen → Welle schließt nach Batch 002 bei 20 Büchern. Der Target spielt nur eine Rolle, wenn Batches kleiner als 10 wären; ich übergebe ihn trotzdem als `explicitTarget` an `partitionWaves`, weil das die Brief-Vorgabe wörtlich umsetzt.
- **Domain-Reihenfolge hartkodiert `["w40k", "hh"]`.** Wie Brief vorgibt. HH-Wellen werden auch dann nicht produziert, wenn HH-Batches kristallisiert sind und W40K noch offene Wellen hat — der Detektor liefert dann W40K-open oder W40K-idle, nie HH. Begründung im Brief: HH-Cross-Era-Aliases hängen vom stabilen W40K-Reference-Layer ab.
- **`w40k-complete-hh-pending` als Test-/Doku-Sprachgebrauch, nicht als externer Status.** Brief war hier eindeutig: der W40K→HH-Übergang materialisiert sich extern als `open-wave` mit der ersten HH-Welle; nur drei externe Status (`open-wave | idle | all-complete`). Habe das im Detektor-Header-Doc-Comment und Test-Header explizit dokumentiert.
- **`as const satisfies ReadonlyArray<…>` für die `BATCHES`-Tupel.** TypeScript 5.0+ feature. Bietet sowohl `readonly`-Inferenz (für die Tupel-Literals) als auch Type-Constraint (das Schema wird validiert). Repo nutzt TS 5.x (typecheck passt), also unproblematisch.
- **Brief in mein Code-PR portiert.** Brief 100 war in Philipps primary-Worktree als untracked file (nie auf git committed). Acceptance verlangt explizit „Status … `implemented` (eine-Zeile-Edit im selben PR)". Da der Brief nicht auf `origin/main` lag, habe ich ihn in die Batches-Worktree kopiert und Status auf `implemented` gesetzt — damit landet er mit dieser Code-PR auf `main`. Philipp redirigiert bei abweichendem Sequencing-Wunsch.
- **`brain/**` und `sessions/README.md` nicht angefasst.** Brief 095 Rollup-Ownership: Batches-Strang darf diese Files nicht beschreiben. Wiki-Updates (project-state.md, log.md, index.md) liegen bei Cowork im Post-Merge-Koordinations-Pass.

## Verification

- `npm run typecheck` — pass (clean)
- `npm run lint` — pass (0 errors, 1 pre-existing warning in `src/app/layout.tsx` zu Next.js custom-font — nicht von dieser Session)
- `npm run test:resolver-loop-detect` — 36 cases pass, 0 fail
  - 6× `partitionWaves` (inkl. HH-Bootstrap und HH-Regular)
  - 11× `detectNextWave` (W40K open-wave/idle/idle', all-complete/all-complete', `w40k-complete-hh-pending`/HH-30/30, w40k-complete-zero-HH-idle, HH-Regular wave 2, HH-Final-Restwave)
  - 9× `buildWaveConfig` (generic triggers, HH-wave-triggers, Phase-4a domain-aware, scope-files, dossier-paths, no-brief, no-clusters)
  - 9× `parseResolverLoopLog` (bootstrap, W40K-block, HH-block, mixed-log, partial-pass, partial-then-completed, parser+detector-resume, empty, bootstrap+completed-pass)
  - 2× `resolver-loop-log-update` (needs-decision-resume — unverändert)
- `npm run test:resolver` — 287 pass, 0 fail (Resolver-Semantik unverändert)
- `npm run test:resolver-data` — alle integrity-checks ok
- `npm run test:resolver-coverage` — Smoke-Output unverändert (noch keine HH-Tuples in `BATCHES` → nur W40K-Range)
- `npm run test:apply-override-dry` — `[apply-override-dry] ok` (alle FK/Junction-Checks + EXPECTED_RANGES grün)
- `npm run test:loop-next` — 9 pass, 0 fail (SSOT-Loop-Detektor, separater Code-Pfad)
- `npm run brain:lint -- --no-write` — 0 blocking findings, 16 warnings (alle pre-existing — keine durch diese Session induziert)
- `bash -n scripts/run-resolver-loop.sh` — Syntax ok
- **Live-Smoke** `npx tsx scripts/resolver-loop-detect.ts` gegen den aktuellen Repo-Stand (W40K 565/565 resolved durch Pass 9, 30/30 HH crystallized in `main`):
  - `status: open-wave`
  - `wave.pass: 10`, `wave.domain: "hh"`, `wave.label: "ssot-hh-001..002"`
  - `wave.bookCount: 20`, `wave.batches[].number: [1, 2]`
  - `smokeSlugs: ["tales-of-heresy", "the-primarchs"]` (jeweils LAST book der Batches)
  - `applyRange: { domain: "hh", from: 1, to: 2 }`
  - `verify.newRange: HH-0001..HH-0020` / `oldRange: HH-0001..HH-0000` (degenerate, leer per lex-Compare — Bootstrap-erste-Welle Edge-Case, kein Crash in `verify-pass.ts`)
  - Phase-1-Trigger referenziert `§4 (Promotions-/Alias-Disziplin, inkl. Cross-Era-Identitäten)` — Cross-Era-Sektion ist verlinkt aus den generischen Phase-Triggern.
- **W40K-Hardcode-Sweep** über das Pass-Ökosystem:
  - `scripts/aggregate-surface-forms.ts` — KEINE W40K-Hardcodes (war schon wave-parametrisiert, liest ausschließlich aus `scripts/resolver-pass.config.json`).
  - `scripts/run-phase4-apply.sh` — KEINE W40K-Hardcodes (nutzt bereits `r.domain` dynamisch aus `applyRange`).
  - `scripts/verify-pass.ts` — KEINE W40K-Hardcodes (SQL-Comparisons sind lex-string, funktionieren für `HH-NNNN` genauso wie `W40K-NNNN`).
  - `scripts/run-resolver-pass.sh` — KEINE W40K-Hardcodes (per-Welle-Driver liest Config-Pfade direkt).
  - Damit: die in Brief 100 OQ (3) genannte „weitere W40K-Hardcodes"-Frage ist negativ beantwortet — keine zusätzlichen Anpassungen nötig.

## Open issues / blockers

Keine. Alle Acceptance-Punkte erfüllt; Live-Smoke produziert die erwartete Bootstrap-Welle; Determinismus gewahrt (re-run liefert byte-identische Ausgabe).

## For next session

Der Brief selbst nennt die Sequenz explizit; ich notiere hier nur die operativen Datenpunkte, die jetzt auf den Trial warten:

- **Trial-Lauf** (operativ, Philipp triggert): `scripts/run-resolver-loop.sh` über die HH-Domäne — 1 Bootstrap-Welle (20 Bücher) + 5 reguläre Wellen (60/60/60/50/44 Bücher), gesamt ~6 Wellen für HH-complete. Beim ersten scharfen HH-Pass auf Phase-3-Token-Budget achten (Brief 100 § Trial Bullet 1) — falls Phase 3 selbst bei 20 Büchern in die Dumb-Zone driftet, ist der Phase-3-Achsen-Slicing-Folge-Brief zwingend.
- **Cross-Era-Aliase-Stichprobe** während Phase 1/3 der ersten HH-Welle: `Luna Wolves` muss als Alias zu `sons_of_horus` resolven (kein neuer `luna_wolves`-Row); `Kharn` zu `kharn_the_betrayer`; `Abaddon` zu `abaddon_the_despoiler`; `Magnus` zu `magnus_the_red`. Phase 4a `factionsSkippedRedundant`-Bucket bleibt für diese Cross-Era-Hits **leer** (Aliases resolven, kein Skip).
- **EXPECTED_RANGES re-tuning** falls Phase 4a der ersten zwei HH-Pässe die jetzt angehobenen Caps reißt: `factions.max=2500` ist konservativ (Brief-Forecast +30..+50), aber die HH-Foundational-Bootstrap könnte mehr Faction-Inserts triggern als gedacht. Beim ersten Cap-Riß: `## Needs decision`-Stop, Datenpunkt für eine zweite Anhebung.
- **HH-Konsolidierungs-Pass-Folge-Brief** (eigener Folge-Brief, schlank — Maschinerie aus Brief 098 existiert): Cross-Wave-Dedup für das HH-Entitäten-Set + Cross-Domain-Dedup für HH-eingebrachte Rows, die mit W40K-Rows reden. Trigger nach HH-complete.

## References

- Brief 100 — `sessions/2026-05-26-100-arch-resolver-hh.md` (dieser Impl-Report's Parent, jetzt `status: implemented`)
- Brief 094 — Form-Vorlage (headless Resolver-Loop, brief-freier Runbook); operatives Cousin von Brief 100.
- Brief 098 — Konsolidierungs-Pass-Geschwister; HH-Konsolidierungs-Pass-Folge-Brief wird darauf aufbauen.
- Resolver-Pass-Runbook — `sessions/resolver-pass-runbook.md` §4 (Promotions- & Alias-Disziplin, inkl. neue Cross-Era-Sektion); operative Spec für jede HH-Welle.
- TypeScript `satisfies` operator (TS 4.9+) — für die `as const satisfies ReadonlyArray<…>` Trias-Tupel.
