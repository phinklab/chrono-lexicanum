---
session: 2026-05-26-101
role: implementer
date: 2026-05-26
status: complete
slug: hh-forward-ref-guard-reason-split
parent: 2026-05-26-101
links:
  - 2026-05-26-100
commits: []
---

# HH-Bootstrap forward-ref Guard — out-of-range vs unknown-work trennen

## Summary

Brief-091-Guard auf `unknown-work`-Subset eingeschränkt — `out-of-range`-Constituent-Edges sind jetzt informativ (Reason-Breakdown im Console-Output), nur `unknown-work` bricht den Dry ab. Damit ist die HH-Bootstrap-Welle (Pass 10, `ssot-hh-001..002`) durchführbar, ohne dass die 20 noch-nicht-gerollten Anthologie→Constituent-Edges aus den drei HH-Anthologien hart auflaufen.

## What I did

- `scripts/apply-override-dry.ts:942-953` — Reason-Breakdown-Konsolenausgabe ergänzt (`countBy(refs, u => u.reason)` über `unresolvableConstituentRefs`, neue Zeile `by reason: out-of-range=N1, unknown-work=N2` direkt unter der bisherigen Count-Zeile, auch wenn beide 0 sind).
- `scripts/apply-override-dry.ts:979-1000` — Assertion eingeschränkt auf `unknown-work`-Subset (`unresolvable.filter(u => u.reason === "unknown-work")`), Kommentar (vormals :971-977) auf die Brief-101-Semantik aktualisiert. Fehlermeldung listet nur noch `collectionExternalId->contentExternalId` ohne Reason-Suffix (in der gefilterten Menge ist der Reason konstant `unknown-work` — die Message-Zeile sagt das schon).
- `scripts/test-apply-override-collections.ts:19-24, 162-218` — `UnresolvableConstituentRef`-Typ importiert, lokale Helper-Funktion `guardAbortRefs` (spiegelt die Dry-Assertion-Untermenge ein-zu-eins), drei Cases ergänzt: (a) `out-of-range > 0, unknown-work = 0` → `guardAbortRefs` empty, (b) `out-of-range = 0, unknown-work > 0` → ein Ref im Abort-Set, (c) beide > 0 → genau der `unknown-work`-Ref im Abort-Set.
- `sessions/2026-05-26-101-arch-...md` — `status: open → implemented` als Single-Line-Edit innerhalb desselben PRs.

## Decisions I made

- **Test-Ort: `test-apply-override-collections.ts` erweitert, kein neues Test-File.** Cowork hat in „Open questions" keine starke Präferenz angegeben und in „Constraints" das existierende Test-File als bevorzugt genannt. Die Alternative — ein neues `test-apply-override-dry-guard.ts` — hätte entweder einen exportierten Helper aus `apply-override-dry.ts` gebraucht (kollidiert mit „keine Kollateral-Refactors am `main()`", da `apply-override-dry.ts` `main()` ungeschützt am Modul-End aufruft und ein Entry-Guard ein zusätzlicher Refactor wäre) oder einen neuen File `scripts/apply-override-dry-guard.ts`, was der Eng-Halten-Direktive widerspricht. Die lokale `guardAbortRefs`-Predicate ist ein Einzeiler (`u.reason === "unknown-work"`) — Drift-Risiko gegen die Prod-Assertion ist minimal, ein Kommentar zeigt auf die Prod-Zeile (`apply-override-dry.ts:990-1000`).
- **Console-Breakdown immer drucken, auch bei beiden=0.** Brief 101 Constraint: „auch bei Läufen ohne `unknown-work` ist das die einzige Stelle, an der ein Operator sieht ‚es gibt deferred edges, die später eine Welle abdecken muss'." Bei rein-grünen Läufen (W40K `001..057` heute) ist die neue Zeile `by reason: out-of-range=0, unknown-work=0` — informationsleer aber konsistent platziert.
- **Fehlermeldung ohne Reason-Suffix in der Liste.** Die gefilterte Menge ist per Konstruktion `unknown-work`-only; `(unknown-work)` an jedem List-Item zu wiederholen ist Rauschen. Die Assertion-Message selbst nennt „unknown constituent — typo or unregistered deferred gap", das reicht.
- **`apply-override-collections.ts` unangetastet gelassen** — Constraint im Brief war eindeutig. Die Reason-Klassifikation in `analyzeCollections` ist bereits korrekt; die Änderung lebt rein konsumenten-seitig.
- **Tight diff.** Drei Edits in `apply-override-dry.ts` (Console-Breakdown + Kommentar + Assertion) plus zwei in `test-apply-override-collections.ts` (Import + drei Cases). `apply-override-collections.ts` und der Rest von `apply-override-dry.ts` sind unangetastet.

## Verification

- `npm.cmd run test:collection-refs` — 10 pass / 0 fail. Die drei neuen Cases (a/b/c) laufen grün; die existierenden 7 Cases unverändert.
- `npm.cmd run test:apply-override-dry` — `[apply-override-dry] ok`. Neue Konsolen-Zeile sichtbar: `by reason: out-of-range=0, unknown-work=0` (W40K `001..057` heute trägt keine unresolvable refs; der Reason-Breakdown ist mit der Welle erst nicht-trivial).
- `npm.cmd run test:resolver` — 287 passed, 0 failed.
- `npm.cmd run test:resolver-data` — `resolver data integrity ok`.
- `npm.cmd run test:resolver-coverage` — Below-threshold rows als data findings, keine automatischen Failures.
- `npm.cmd run lint` — 0 errors (1 vorbestehende Next-Font-Warning in `src/app/layout.tsx:44`, nichts mit dieser Änderung).
- `npm.cmd run typecheck` — pass.

## Open issues / blockers

Keine. Brief-Acceptance-Set ist komplett:

- [x] Assertion bricht nur noch bei `reason === "unknown-work"`-Subset ab.
- [x] Console-Output enthält die Reason-Breakdown-Zeile, auch bei beiden = 0.
- [x] Fehlermeldung bei `unknown-work > 0` listet nur die `unknown-work`-Refs (out-of-range-Rauschen wird nicht in die Abort-Message gemischt).
- [x] Test-Coverage für a/b/c im existierenden `test-apply-override-collections.ts` gelandet und grün.
- [x] Volle Trias grün: `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `test:collection-refs`.
- [x] `lint` + `typecheck` grün.
- [x] PR-Inhalt: nur Guard-Fix + Tests, kein Daten-/Override-/Reference-JSON-Diff, kein Touch von `apply-override-collections.ts`, kein Touch von `brain/**` oder `sessions/README.md`.

## For next session

- **Verify-Digest-Out-of-Range-Count (Brief 101 § Open questions).** Mein Read: lohnt einen schmalen Folge-Brief, sobald die HH-Bootstrap-Welle in die DB landet (`ssot-hh-001..002` → ~20 deferred edges). Der `apply-override-dry`-Console-Output zeigt die Out-of-Range-Edges *prä-DB-Apply*; ein analoger Count im `verify-pass.ts`-Digest würde sie *post-DB-Apply* sichtbar machen („HH-Bootstrap hat 20 deferred constituent edges; wird mit Wellen 11/12/13 geschlossen"). Disziplin-Wert > Implementation-Aufwand — ein paar Zeilen in `verify-pass.ts`. Nicht zeitkritisch, kann mit dem HH-Konsolidierungs-Folge-Brief gebündelt werden.
- **Runbook-Halbsatz (Brief 101 § Open questions).** Nicht gemacht — die `resolver-pass-runbook.md` § 7 Phase-4a/4b-Sektion ist mehrere Hundert Zeilen lang und meint mit „range-aware-Guard" semantisch beides; ein klarstellender Halbsatz hätte gegenüber dem Beleg im Code (`apply-override-dry.ts:979-1000` Kommentar) wenig Mehrwert. Falls Cowork im Post-Merge-Pass anders entscheidet, eine 1-Zeilen-Ergänzung in § 7 Phase 4a: „Reason-Split — `out-of-range` ist informativ, nur `unknown-work` bricht den Dry ab." Diese Edit ist Coordination-Worktree-Territorium.
- **Mid-term: HH-Apply 565 → 585.** Operative Folge-Sequenz steht im Brief 101 § Notes (Punkt 6 Schritte 2-6). Sobald dieser Guard-Fix in `main` liegt, kann PR #105 gegen `main` rebased und Phase 4a über `ssot-hh-001..002` neu gefahren werden — diesmal mit dem reason-split Guard, der die 20 Anthologie→Constituent-Edges als deferred edges hindurchlässt.

## References

- Brief 101 (architect): `sessions/2026-05-26-101-arch-hh-forward-ref-guard-reason-split.md`.
- Brief 100 (predecessor — HH-Resolver-Domain-Öffnung): `sessions/2026-05-26-100-arch-resolver-hh.md`.
- Brief 091 (predecessor — range-aware-Guard-Original): in `sessions/archive/2026-05/`.
- Pass-10-Phase-4a-needs-decision (Cowork-Quelle für die 20 Anthologie-Forward-Refs): PR #105 branch `codex/ingest-batches-resolver-trial-hh`, impl report.
- `scripts/apply-override-collections.ts:42-46, 100-113` — Reason-Klassifikation (`UnresolvableReason = "out-of-range" | "unknown-work"`), unverändert.
- `scripts/apply-override-dry.ts:979-1000` — Konsumenten-Guard, jetzt reason-split.
