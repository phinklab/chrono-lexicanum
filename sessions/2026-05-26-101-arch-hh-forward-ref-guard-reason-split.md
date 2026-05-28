---
session: 2026-05-26-101
role: architect
date: 2026-05-26
status: implemented
slug: hh-forward-ref-guard-reason-split
parent: null
links:
  - 2026-05-26-100
commits: []
---

# HH-Bootstrap forward-ref Guard — out-of-range vs unknown-work trennen

## Goal

Den Brief-091 range-aware forward-ref Guard in `scripts/apply-override-dry.ts` so anpassen, dass eine **`out-of-range`**-Constituent-Edge (Constituent steht im Roster, ist nur noch nicht in der kumulativen Apply-Range) **informativ** akzeptiert wird und nur **`unknown-work`** (Constituent fehlt im Roster komplett — Typo oder unregistrierter deferred gap) hart abbricht. Damit ist die HH-Bootstrap-Welle (Pass 10, `ssot-hh-001..002`) durchführbar; der HH-Apply 565 → 585 kann in einem Folge-Schritt (operativ, post-Merge dieses Briefs + post-Rebase PR #105) landen.

## Context

Pass 10 ist gefahren (PR #105, branch `codex/ingest-batches-resolver-trial-hh`, alle 6 Phasen completed). Phase 0-3 haben die JSON-Reference-Schicht sauber wachsen lassen: **+6 factions, +10 locations, +60 characters, +9 aliases** (4 Faction-, 3 Character-, 2 Cross-Era-Honor-Title-Aliases — Cross-Era-Disziplin aus dem 100-Runbook §4 sauber befolgt). Phase 1-3 Trias überall grün, ein Commit pro Phase, Halt-Disziplin gehalten.

Phase 4a hat halt-disziplin-konform auf `## Needs decision` gestoppt: **20 Anthology→Constituent-Edges aus den drei HH-Anthologien** brechen den Guard auseinander:

- HH-0020 (*The Primarchs*) → HH-0117..HH-0120 (4 Constituents in einer späteren HH-Welle)
- HH-0010 (*Tales of Heresy*) → HH-0150..HH-0156 (7 Constituents)
- HH-0016 (*Age of Darkness*) → HH-0157..HH-0165 (9 Constituents)

Alle 20 Constituent-IDs sind in `scripts/seed-data/book-roster.json` deklariert (294 HH-Bücher sind komplett crystallized seit dem SSOT-Loop-Abschluss vor Brief 100). Sie sind nur noch nicht in der kumulativen Apply-Range `ssot-hh-001..002` enthalten — sie kommen in Wellen 11/12/13 dieser HH-Domain.

Das ist genau die Gestalt, die der Pass-10-Dossier §7d als Phase-4a-Stop-Trigger benannt hatte ("single architectural watch-item for Phase 4a"). Die Klassifikation existiert bereits korrekt in `scripts/apply-override-collections.ts:42-46` + `:100-113`:

```ts
export type UnresolvableReason = "out-of-range" | "unknown-work";
// ...
reason: rosterIds.has(collection.contentExternalId)
  ? "out-of-range"
  : "unknown-work",
```

Der Guard auf der Konsumenten-Seite (`scripts/apply-override-dry.ts:978-986`) behandelt beide Reasons identisch:

```ts
const unresolvable = collectionAnalysis.unresolvableConstituentRefs;
assert.deepEqual(
  unresolvable.map(
    (u) => `${u.collection.collectionExternalId}->${u.collection.contentExternalId} (${u.reason})`,
  ),
  [],
  "forward collection refs with an out-of-range / unknown constituent — typo or unregistered deferred gap",
);
```

Das ist über-streng. Die Architekt-Entscheidung dieser Session (Cowork-Maintainer 2026-05-26): **Option 1 (Reason-Split)** aus den drei vom Impl-Report angebotenen Pfaden. Begründung:

- `out-of-range` ist semantisch **konsistenter Deferred-State** — `roster.books` enthält die Constituent-ID, das System weiß um die Edge, sie löst sich auf, sobald die spätere Welle landet (idempotenter `applyCollections` re-evaluiert die Edge dann). Pass 6 Erfahrung bestätigt das für die W40K-Anthologie-Forward-Refs (Sanctus Reach, Damocles, Shield of Baal — siehe Kommentar `apply-override-dry.ts:961-966`).
- `unknown-work` ist semantisch **echter Fehler** — Constituent fehlt im Roster, das System weiß nichts von der Edge, sie löst sich nie auf. Typo oder vergessenes `book-roster.json`-Add. Muss hart aborten.
- Optionen 2 (domain-aware seal) und 3 (allowlist) addieren Komplexität ohne Sicherheitsgewinn: `unknown-work` bleibt der echte Tripwire; ob die out-of-range-Edge HH oder W40K ist, ändert nichts an ihrer Sicherheits-Eigenschaft.

## Constraints

- **`apply-override-collections.ts` bleibt unangetastet.** Die Reason-Klassifikation ist bereits korrekt; das Problem ist nur, wie der Konsument sie interpretiert.
- **Die Assertion in `apply-override-dry.ts` wird auf `reason === "unknown-work"`-Subset eingeschränkt.** Bei `unknown-work > 0` bricht der Lauf ab (auch wenn gleichzeitig `out-of-range`-Refs existieren); die Fehlermeldung listet **nur** die `unknown-work`-Refs, weil das die actionable Menge ist.
- **Console-Output zeigt beide Reasons sichtbar.** Die existierende Zeile `unresolvable constituent refs: N` darf bleiben; ergänze eine Reason-Breakdown-Zeile (z. B. `by reason: out-of-range=N1, unknown-work=N2`). Bei rein-`out-of-range`-Lauf ist das die einzige Stelle, an der ein Operator sieht "es gibt deferred edges, die später eine Welle abdecken muss".
- **Test-Coverage.** Drei Cases müssen abgedeckt sein und grün laufen:
  - (a) Lauf mit `out-of-range > 0`, `unknown-work === 0` → kein Abort.
  - (b) Lauf mit `out-of-range === 0`, `unknown-work > 0` → Abort.
  - (c) Lauf mit beiden > 0 → Abort, Fehlermeldung listet die `unknown-work`-Refs.
  Ort der Tests: bevorzugt im existierenden `scripts/test-apply-override-collections.ts`, das bereits beide Reasons unit-testet (`:72`, `:87`) — ergänze die drei Assertion-Cases dort, oder lege einen schmalen `scripts/test-apply-override-dry-guard.ts` (oder analog) an, falls die `apply-override-dry`-Assertion eigene Test-Harness-Mechanik braucht. Implementer-Choice.
- **Volle Resolver-Trias grün** vor dem Commit: `npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:apply-override-dry`, `npm run test:collection-refs`, `npm run lint`, `npm run typecheck`.
- **Worktree-Strang.** Diese Änderung ist Batches/Ingestion-Code → `codex/ingest-batches-resolver-guard-reason-split` (oder analoger Slug) im **`chrono-lexicanum-batches`**-Worktree. Nicht im Coordination-Worktree, nicht im Product-Worktree. PR-Policy: Code-PR (kein doc-only), normaler Branch + PR + Philipp merged.
- **Kein Co-Author-Trailer** im Commit. Imperative Commit-Message, z. B. `Guard: out-of-range constituent refs informativ akzeptieren, unknown-work bleibt scharf`.

## Out of scope

- **Pass-10-Re-Run, PR #105 rebase, DB-Apply 565 → 585.** Operative Folge-Schritte nach Merge dieses Guard-Fixes. Reihenfolge: Guard-Fix-PR auf `main` → PR #105 gegen neuen `main` rebasen (Phase 1-3 JSON-Layer ist sauber, Phase 4a's Domain-Append-Commit `0a2e2c1` bleibt; CC im Batches-Worktree fährt einen Re-Run nur von Phase 4a + 4b über die HH-Bootstrap-Range gegen den fixed Guard) → Phase 4b emittiert den Verify-Digest, der HH-Apply landet die DB bei 585. Operativ, kein Brief.
- **Optionen 2 (domain-aware seal) und 3 (allowlist).** Explizit verworfen — Begründung im Context-Abschnitt.
- **Änderungen an `analyzeCollections` selbst** in `apply-override-collections.ts`. Die Reason-Klassifikation ist bereits korrekt; nicht anrühren.
- **`scripts/verify-pass.ts`-Erweiterung** um einen `out-of-range`-Count im Verify-Digest. Sinnvoll im Folge-Brief, falls operativ die Out-of-Range-Sichtbarkeit post-Apply gewünscht ist — siehe Open questions. Diese Session berührt nur den Dry-Guard.
- **Andere offene OQs** (OQ 3 Hand-Check-Workflow, OQ 13 Crawl-Simplification-Sichtung). Bleiben in der Queue.
- **Runbook-Edit (`sessions/resolver-pass-runbook.md`).** Optional — die Runbook-Erwähnung von "range-aware-Guard" (Anhang § 091) ist semantisch korrekt geblieben. Wenn der Implementer es für klärungsbedürftig hält, ein Halb-Satz in § 7 Phase 4a darf rein; sonst weglassen. Nicht im Acceptance-Set.
- **`brain/wiki/**`-Edits.** Kein Touch — das ist Coordination-Worktree-Territorium (Brief 095 Rollup-Ownership). Diese Session läuft im Batches-Worktree; Cowork backfilled post-Merge in der nächsten Koordinations-Pass.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `scripts/apply-override-dry.ts` assertion (`:978-986`) bricht nur noch ab, wenn mindestens eine `unresolvableConstituentRefs`-Entry den `reason: "unknown-work"` trägt.
- [ ] Console-Output von `apply-override-dry` enthält eine Reason-Breakdown-Zeile, die `out-of-range` und `unknown-work` getrennt zählt — auch bei Läufen ohne `unknown-work`, sodass ein Operator die deferred edges sieht.
- [ ] Bei `unknown-work > 0` ist die Fehlermeldung scharf und listet **nur** die `unknown-work`-Refs (out-of-range-Lärm wird nicht in die Abort-Message gemischt).
- [ ] Test-Coverage für die drei Cases (a/b/c oben) ist gelandet und grün — egal ob im existierenden `test-apply-override-collections.ts` oder in einem neuen schmalen Test-File.
- [ ] Volle Resolver-Trias grün: `npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:apply-override-dry`, `npm run test:collection-refs`.
- [ ] `npm run lint` + `npm run typecheck` grün.
- [ ] Ein PR auf `main` aus dem Batches-Worktree, der genau diesen Guard-Fix + Tests trägt — kein Daten-/Override-/Reference-JSON-Diff, kein Touch von `apply-override-collections.ts`, kein Touch von `brain/**` oder `sessions/README.md`.

## Open questions

- **Verify-Digest-Out-of-Range-Count.** Wäre es sinnvoll, `scripts/verify-pass.ts --config …` post-Apply auch einen `out-of-range`-Count zu emittieren ("HH-Bootstrap-Welle hat 20 deferred constituent edges; werden mit Wellen X/Y/Z geschlossen"), sodass der Operator post-DB-Apply sieht, was noch offen ist? Implementer's Read: lohnt sich ein Folge-Brief, oder ist der `apply-override-dry`-Console-Output ausreichend?
- **Test-Ort.** Implementer's Empfehlung: drei Assertion-Cases in `test-apply-override-collections.ts` ergänzen, oder ein neues `test-apply-override-dry-guard.ts` anlegen? (Die existierenden 7 Tests in `test-apply-override-collections.ts` testen `analyzeCollections` direkt; die Guard-Assertion ist eine Konsumenten-Logik in `apply-override-dry.ts` — möglicherweise sauberer separat. Cowork hat keine starke Präferenz.)
- **Halbsatz im Runbook?** Der `resolver-pass-runbook.md` § 7 "Phase-4a/4b-Digest-Disziplin" erwähnt die Trias-Assertions, aber nicht die Reason-Semantik. Ein klarstellender Halbsatz ("`out-of-range` ist informativ, nur `unknown-work` bricht den Dry ab") wäre lesefreundlich — Implementer's Read, ob er das hinzufügen mag. Nicht Acceptance.

## Notes

- Der Reason-Split wird sehr wahrscheinlich ein 10-15-Zeilen-Diff in `apply-override-dry.ts` plus 30-60 Zeilen Test sein. Diff sehr eng halten — keine Kollateral-Refactors am `apply-override-dry`-`main()`.
- Der Kommentar-Block `apply-override-dry.ts:971-977` ("Brief 091 range-aware guard") bleibt richtig im Geist, aber der zweite Satz ("Restore a real tripwire on the constituent side") sollte aktualisiert werden, damit die Begründung jetziges-Verhalten reflektiert. Implementer entscheidet die Formulierung.
- Sequenz, die der Maintainer post-Merge dieses Briefs durchspielt (zur Orientierung — nicht Acceptance):
  1. Guard-Fix-PR auf `main`.
  2. PR #105 (Batches-Worktree) gegen neuen `main` rebasen. Phase 1-3 JSON-Commits sind unabhängig vom Guard und überleben den Rebase trivially. Phase 4a's Commit `0a2e2c1` (Domain-Append in den drei Test-Files + apply-override-dry.ts) bekommt einen Konflikt in `apply-override-dry.ts` — auflösen, ggf. Phase 4a neu fahren.
  3. Phase 4a Re-Run über `ssot-hh-001..002` mit dem gefixten Guard läuft durch; DB landet auf 585 works.
  4. Phase 4b Re-Run emittiert den Verify-Digest; impl-report updaten.
  5. PR #105 mergen.
  6. Cowork-Koordinations-Pass: `brain/wiki/project-state.md` / `pipeline-state.md` / `log.md` / `index.md` + `sessions/README.md` rolllen den HH-Bootstrap-Stand 585 in den Coordination-Worktree-Stand ein, plus Status-Flip für Brief 101.
- Cross-Era-Disziplin (Brief 100 §4) hat in Phase 1+3 sauber gehalten: Luna Wolves → `sons_of_horus`, Mechanicum → `mechanicus`, Imperial Army → `astra_militarum`, Lucius → `lucius_the_eternal`, Ezekyle Abaddon → `abaddon_the_despoiler`. Diese Session-Brief berührt das nicht; nur als Bestätigung, dass die Cross-Era-ADR (`brain/wiki/decisions/cross-era-identities.md`) operativ trägt.
