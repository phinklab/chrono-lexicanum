---
session: 2026-05-22-093
role: architect
date: 2026-05-22
status: implemented
slug: resolver-pass-7
parent: null
links:
  - 2026-05-22-091-arch-resolver-phase4-split
  - 2026-05-21-090-arch-resolver-pass-lean
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
implementer_report: sessions/resolver-dossiers/resolver-pass-7-impl-report.md
commits:
  - b1af27b  # Phase 0 (Preflight/Dossier)
  - e891151  # Phase 1 (Factions)
  - c63b181  # Phase 2 (Locations)
  - 64643ba  # Phase 3 (Characters)
  - d2c9590  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying the impl-report.
---

# Resolver-Pass 7 — ssot-w40k-036..045 (W40K-0351..0450, 450 Bücher)

## Goal

Resolver-Pass 7 aufsetzen und fahren: die siebte Welle `ssot-w40k-036..045` (W40K-0351..0450, 100 Bücher) in den Authority-Layer und nach Postgres applien — die DB von 350 auf **450** W40K-Bücher bringen. Pass 7 ist der **erste echte Lauf** auf der von Brief 091 gesplitteten 6-Phasen-Maschinerie (0 / 1 / 2 / 3 / 4a / 4b).

Brief-frei + runbook-getrieben nach Brief 090: dieser Brief ist **Rationale-only** — er wird **nicht** gelesen, um eine Phase zu fahren. Die ausführbare Spec ist `sessions/resolver-pass-runbook.md` + `scripts/resolver-pass.config.json`. Der Brief existiert, weil Pass 7 ein echtes, schriftlich festzuhaltendes Architektur-Item trägt (Slug-/Title-Delta, siehe unten) und weil der Config-Re-Key reviewbar dokumentiert sein soll.

## Context

- Der SSOT-Loop hat die Welle `036..045` kristallisiert: 10 Override-Files, kumulativ 450 Bücher im Authority-Layer, der `⏸ Resolver-Pause bei 450 Büchern`-Block steht im Loop-Log. Loop-Lauf gemerged (PR #87). Per 100er-Takt (Brief 090) ist 450 die natürliche Resolver-Schwelle (350 → 450 → 550 …).
- Brief 091 ist implementiert + gemerged: Phase 4 ist in **4a (Integration/Apply)** + **4b (Verify/Report)** gesplittet, `/clear`-getrennt mit Handoff über eine 4a-Statusdatei; der forward-ref-Collection-Guard in `apply-override-dry.ts` ist **range-aware** (akzeptiert in-range cross-batch-Edges, wirft bei einer Konstituente außerhalb der applyRange). Runbook und `resolver-pass.config.json` tragen bereits die 6-Phasen-Struktur. Pass 7 ist deren erste produktive Anwendung.
- Pass 6 (`026..035`) lief sauber — supervised/axis-sliced, fünf bzw. jetzt sechs Phasen-Subsessions, Dry-Prediction == DB-POST-APPLY exakt. Pass 7 läuft genauso. Den Headless-Driver scharfzuschalten ist Maintainer-Wahl und **nicht** Teil dieses Briefs.
- DB-Stand vor Pass 7: 350 W40K-Bücher; `work_factions=1424`, `work_locations=543`, `work_characters=844`, `work_collections=109`, `work_persons=325`. Reference: `factions=162`, `locations=189`, `characters=237`.

## Config re-key — der Cowork-Setup-Schritt zu diesem Brief

`scripts/resolver-pass.config.json` wird von Pass 6 auf Pass 7 umgeschlüsselt. **Nur Per-Pass-Werte** ändern sich — die 6-Phasen-`phases[]`-Struktur aus Brief 091 (Namen, Trigger-Runbook-Pointer, Halt-Check-Logik) bleibt unangetastet. Die Feld-Änderungen:

| Feld | Pass 6 (alt) | Pass 7 (neu) |
|---|---|---|
| `pass` | `"6"` | `"7"` |
| `wave` | `ssot-w40k-026..035` | `ssot-w40k-036..045` |
| `dossier` | `…/resolver-pass-6-dossier.md` | `…/resolver-pass-7-dossier.md` |
| `aggregator.batches` | `026 … 035` | `ssot-w40k-036 … ssot-w40k-045` (10 Einträge) |
| `aggregator.applyRange.to` | `35` | `45` |
| `aggregator.clusters` | Pass-6-Stichworte | 10 neue Per-Batch-Stichworte ⚠ |
| `verify.newRange` | `W40K-0251 … W40K-0350` | `W40K-0351 … W40K-0450` |
| `verify.oldRange` | `W40K-0001 … W40K-0250` | `W40K-0001 … W40K-0350` |
| `verify.ratingRange` | `W40K-0251 … W40K-0350` | `W40K-0351 … W40K-0450` |
| `verify.smokeSlugs` | 10 Pass-6-Slugs | 10 neue, repräsentative Wave-Slugs ⚠ |
| `phases[].statusFile` + Report-Pfade | `resolver-pass-6-*` | `resolver-pass-7-*` (inkl. `resolver-pass-7-impl-report.md` für Phase 4b) |
| Phase-4a `scope` Override-Globs | `…02[6-9].json` + `…03[0-5].json` | `…03[6-9].json` + `…04[0-5].json` |
| `phases[].trigger` | Pass-6-Wave-Notizen | wave-spezifische Notizen auf `036..045` aktualisieren bzw. genericisieren; die Runbook-Sektions-Pointer bleiben |
| `$comment` | Pass-6-Instanz | Pass-7-Instanz |

**Status: der Re-Key ist angewandt.** `scripts/resolver-pass.config.json` steht auf Pass 7 (in derselben Cowork-Session wie dieser Brief, nach Fast-Forward-Sync des Coordination-Worktree auf `origin/main`). `clusters` + `smokeSlugs` sind aus dem Inhalt der `036..045`-Override-Files gefüllt; das optionale `brief`-Feld zeigt auf diesen Brief.

## Slug-/Title-Delta W40K-0259 / W40K-0330 — Befund + Scope

Der Roster-Hygiene-Sweep (OQ (14), PR #85) hat in `book-roster.json` zwei Titel + Slugs korrigiert: W40K-0259 → „The Rose in Anger" / `the-rose-in-anger`, W40K-0330 → „The Hunt for Magnus" / `the-hunt-for-magnus`. `project-state.md` § What's open parkte das als Pass-7-Watch-Item mit der Annahme, ein künftiger Resolver-Pass 7, der die Batches `026` / `033` kumulativ re-applied, „zieht die neuen Slugs in die DB". **Diese Annahme ist falsch — geprüft gegen den Code.**

`apply-override.ts` friert auf dem Update-Pfad (Zeile ~937) `title` und `slug` ein: ein Re-Apply schreibt nur `synopsis` + `updatedAt`. `slug`/`title` werden ausschließlich beim **ersten Insert** gesetzt (`slug` aus `override.slug`, `title` aus `roster.title`). Beide Bücher wurden in Pass 6 inserted (Batches 026/033); ihre DB-`slug`/`title` sind seither eingefroren. Zusätzlich tragen die Override-Files selbst veraltete Slugs (`026.json`: `the-rose-in-the-anger`, `033.json`: `the-hunt-of-magnus` — Loop-Slugifizierung aus Pre-092-Zeit), die weder dem alten noch dem neuen Roster-Slug entsprechen. Der Code-Kommentar ist explizit: Renames „require an explicit re-import path that brief 060 does not implement".

Pass 7 re-applied 026/033 (sie liegen in `applyRange 001..045`), ändert aber per Design **nichts** an deren `slug`/`title`.

**Entscheidung:** Das Slug-/Title-Delta ist **out of scope für Resolver-Pass 7.** Es ist keine Resolver-/Junction-Frage, sondern ein Works-Identity-Rename, den der Apply-Layer bewusst nicht macht. Pass 7 fasst `slug`/`title` nicht an, fasst die Override-Files 026/033 nicht an, und macht keinen direkten DB-`UPDATE`. Damit ist der Punkt aus dem „Pass-7-Watch-Item"-Status entlassen und wird als eigene, kleine Maintainer-Entscheidung geparkt: entweder einen expliziten Slug-/Title-Re-Import-Pfad bauen (eigener Mini-Brief — dann gehören die Override-Files 026/033 mitkorrigiert) — **oder**, da die Site pre-launch ist und `external_book_id` der stabile Identity-Anker ist, das kosmetische Delta bewusst akzeptieren. Cowork zieht diesen korrigierten Befund beim Wiki-Nachzug in `project-state.md` § What's open nach.

## Constraints

- **Brief-frei + runbook-getrieben.** Pass 7 läuft als 6 Phasen-Subsessions (0 / 1 / 2 / 3 / 4a / 4b) nach `sessions/resolver-pass-runbook.md` + `scripts/resolver-pass.config.json`, je ein frischer `/clear`-Kontext. Dieser Brief wird **nicht** gelesen, um eine Phase zu fahren (Runbook §1).
- **Resolver-Semantik unverändert** — Surface-Form → canonical ID via direct match → alias lookup; kein Fuzzy, kein Slug-Match, keine Titel-Normalisierung (Brief 049/072).
- **Phasen strikt sequenziell**: Phase 1 vor Phase 3 (FK-Sicherheit), 4a vor 4b. Ein Commit pro Phase, **kein Co-Author-Trailer**.
- **Keine Schema-Migration**, kein Touch an `src/db/schema.ts` / `src/db/migrations/`. Harter Blocker → `## Needs decision`-Stop.
- **Keine Tool-Versionen pinnen.**
- **Worktree:** Batches-Strang. Frische `codex/ingest-batches-resolver-pass-7`-Branch aus aktuellem `origin/main`, im Worktree `C:\Users\Phil\chrono-lexicanum-batches`. `main` ist read-only.
- Bei architektonischer Unsicherheit in einer Phase → `## Needs decision`-H2 in die Per-Phase-Statusdatei und **stoppen** (Driver erkennt das, beendet sauber).

## Out of scope

- **Das Slug-/Title-Delta W40K-0259 / W40K-0330** — Pass 7 fasst es nicht an (siehe oben).
- **`apply-override.ts`'s Frozen-Slug/Title-Verhalten ändern** — kein Touch; das Update-Pfad-Design ist bewusst.
- **Den Headless-Driver `run-resolver-pass.sh` scharfschalten** — supervised bleibt Maintainer-Wahl; ein erster echter Driver-Lauf ist nicht Teil dieses Briefs.
- **Phase-3 `characters.json`-Achsen-Slicing** — bekannte Wachstums-Kante (Brief 090/091 § For next session). Separate, spätere Sache — nicht in diesem Pass anfassen.
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung** — keine Berührung mit der Resolver-Pass-Maschinerie; bleiben in der Queue, hier explizit verschoben.
- **Facet-/Vokabular-Promotion** nur, wenn die `036..045`-Welle einen echten Call trägt — sonst unbekannte facetIds strippen wie 074/076 und **kein** Catalog-Add (`facet-catalog.json` ist nicht im Phase-4a-Scope; ein doch nötiger Add ist ein `## Needs decision`-Stop). Pass-6-Konvention.

## Acceptance

Pass 7 ist fertig, wenn:

- [ ] `scripts/resolver-pass.config.json` ist auf Pass 7 re-keyed (alle Felder der Tabelle oben; `clusters` + `smokeSlugs` befüllt; JSON valide).
- [ ] Die 6 Phasen sind gefahren, je ein Commit; `ssot-w40k-036..045` applied → **450** W40K-Bücher in Postgres.
- [ ] Resolver-Trias grün (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry` inkl. `test:collection-refs`); `lint` + `typecheck` grün.
- [ ] `verify-pass.ts`-Digest plausibel — Dry-Run-Vorhersage == DB-POST-APPLY-Counts; kein `## Needs decision` offen.
- [ ] Phase-4b-Impl-Report `sessions/resolver-dossiers/resolver-pass-7-impl-report.md` geschrieben; dieser Brief-Status auf `implemented`.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Trägt die `036..045`-Welle einen echten neuen Architektur-Call (neuer Facet-Wert, neuer Browse-Root, harte Cross-Batch-Alias-Identität)? Phase 0 (Dossier) macht es sichtbar; falls ja → kurze Cowork-Notiz nachschieben, statt in einer Phase zu raten.
- Fährt Philipp Pass 7 supervised (wie Pass 5/6) oder erstmals über den Headless-Driver `run-resolver-pass.sh`? Reine Maintainer-Wahl; bei einem Driver-Lauf zeigen sich erstmals dessen Refinement-Bedarfe (per-iter-timeout etc.).
- Greifen beim Re-Apply von Batches 029/031 die durch OQ (14) / PR #85 neu in den Roster gekommenen Collection-Kanten (Architect of Fate W40K-0286, War for Armageddon Omnibus W40K-0307)? Erwartet: ja, `applyCollections` zieht sie idempotent; der range-aware Guard bleibt grün, solange die Konstituenten in `001..045` liegen. Phase 4a vermerkt das im Counts-Digest.

## Notes

- Reine Resolver-Pass-Maschinerie — keine UI-Oberfläche, daher **kein** „Design freedom"-Abschnitt (analog Brief 091).
- Hintergrund-Rationale: Brief 076 (axis-sliced Design), Brief 090 (lean / Token-Budget pro Phase), Brief 091 (Phase-4-Split 4a/4b). Dieser Brief baut nur darauf auf und wiederholt die Spec nicht.
- Der Config-Re-Key ist in derselben Cowork-Session wie dieser Brief auf `resolver-pass.config.json` angewandt (Pass 6 → 7); der Wiki-Nachzug (`sessions/README.md` Active-Threads, `project-state.md` § Branch / § What's open / § Recently shipped mit dem korrigierten Slug-/Title-Delta-Befund) ist ebenfalls erfolgt. Brief + Config-Re-Key + Wiki-Edits gehören in **einen** Commit.
