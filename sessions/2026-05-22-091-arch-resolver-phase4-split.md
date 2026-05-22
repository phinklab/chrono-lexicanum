---
session: 2026-05-22-091
role: architect
date: 2026-05-22
status: open
slug: resolver-phase4-split
parent: null
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-090-arch-resolver-pass-lean
commits: []
---

# Resolver-Pass — Phase-4-Split (4a/4b) + range-aware forward-ref guard

## Goal

Phase 4 des axis-sliced Resolver-Passes wird in zwei `/clear`-getrennte Subphasen geteilt — **4a Integration/Apply** und **4b Verify/Report** — mit Handoff über eine per-Phase-Statusdatei. Zusätzlich wird der forward-ref-Collection-Guard in `apply-override-dry.ts` von „report-only" auf **range-aware** gehärtet.

Pass 6 (`ssot-w40k-026..035`, erste 100er-Welle) lief sauber durch, aber das Kontextfenster der Phase-4-Subsession ging Richtung **~300k Token** — gegen ein operatives Per-Phase-Budget von ~120k. Phase 4 erledigt heute fünf Arbeitspakete plus etwaiges ungeplantes Debugging in einem einzigen `/clear`; das ist der Treiber. Der Split adressiert das strukturell, ohne Resolver-Semantik oder Achsen-Aufteilung anzufassen.

## Commit & PR — zuerst lesen

Diese Architekten-Session — Brief 091 selbst **plus** der Brain-Hygiene-Pass post-091 — liegt **uncommitted** im Coordination-Worktree `C:\Users\Phil\chrono-lexicanum` auf der schon ausgecheckten Branch `codex/session-091-phase4-split`. Philipp will den Architekten-Output und die Brief-091-Implementierung in **einem** PR, ohne separaten manuellen Commit-Schritt.

Fahre die Implementierung darum **in genau diesem Worktree auf genau dieser Branch** (`codex/session-091-phase4-split`) — bewusste Ausnahme von der Strang-Disziplin in `CLAUDE.md` § „Parallel worktrees": Brief 091 ist eine kleine, konfliktarme Maschinerie-Änderung, und Philipp setzt diese Session explizit auf dieser Branch fort. Reihenfolge:

1. **Zuerst** den Architekten-Output als eigenen Commit sichern (liegt fertig im Working-Tree, nur noch zu committen): `sessions/2026-05-22-091-arch-resolver-phase4-split.md` + die fünf Brain-Edits `brain/wiki/{project-state,pipeline-state,open-questions,index,log}.md` + `sessions/README.md`. Commit-Message z. B. `Brief 091 + Brain-Hygiene-Pass post-091`.
2. **Dann** Brief 091 implementieren (eigene Commits, ein logischer Schritt pro Commit).
3. **Am Ende** die Branch pushen und **einen** PR öffnen, der Architekten-Output + Implementierung zusammen trägt — kein zweiter PR für die Cowork-Session.

Ist der Working-Tree wider Erwarten schon clean (Architekten-Output bereits vom Maintainer committet), Schritt 1 überspringen und direkt implementieren.

## Context

**Was es heute gibt.** Brief 076 hat den axis-sliced Resolver-Pass entworfen: fünf Phasen (0 Preflight/Dossier → 1 Factions → 2 Locations → 3 Characters → 4 Integration), je eine `/clear`-Subsession, je ein Commit. Brief 090 hat ihn schlank gemacht: runbook-getrieben (`sessions/resolver-pass-runbook.md`), brief-frei, Phase 4 digest-only (`run-phase4-apply.sh` schreibt einen fix-großen Digest, der rohe Apply-Log ist gitignored). Die operative Spec einer Phase ist das Runbook; pro Pass parametrisiert `scripts/resolver-pass.config.json`. Der optionale Headless-Driver ist `scripts/run-resolver-pass.sh`.

**Pass 6 lief gut.** `sessions/resolver-dossiers/resolver-pass-6-impl-report.md`: 350/350 W40K-Bücher applied, die Dry-Run-Vorhersage trifft die DB-POST-APPLY-Counts exakt, alle Trias-Checks + lint + typecheck grün, kein `## Needs decision`. Inhaltlich ein sauberer Lauf — der Split ist **keine** Reaktion auf einen Fehler, sondern auf eine Budget-Beobachtung.

**Das Problem.** Brief 090 hat den **statischen Lese-Scope** jeder Phase gemessen — die Datei-Bytes, die eine Phase beim Start öffnet (für Phase 4 projiziert: ~27k, korpus-unabhängig). Das ist der *Boden*, nicht die *Decke*. Was 090 nicht erfasst hat, ist die **agentische Arbeitslast**: Phase 4 macht in einem `/clear` (1) `seed-resolver-extensions.ts` erweitern — eine kumulativ wachsende Datei, (2) die Batch-Ranges der Trias über drei Skripte ausweiten, (3) das Re-Apply fahren, (4) verifizieren, (5) den finalen Impl-Report (~14k) schreiben — plus jedes ungeplante Debugging. In Pass 6 fiel der forward-ref-Assert (siehe unten); die Untersuchung dazu (forward-Refs nachvollziehen, `applyCollections` lesen, Ad-hoc-Verifikations-Query) war ein ungeplanter Ausflug, der in einer ungesplitteten Phase nirgends hin kann außer ins selbe Kontextfenster. Brief 090 hat genau *einen* korpus-skalierenden Input entkoppelt (den rohen Apply-Log → Digest); Phase 4 als **Vier-in-Eins-Subsession** blieb unangetastet. Die erste 100er-Welle (10 Batches, kumulatives Re-Apply `001..035` = 35 Batches) hat die Arbeitslast gegenüber dem 250-Bücher-Stand, an dem 090 validiert hat, grob verdoppelt.

**Der Guard.** `apply-override-dry.ts` hatte einen harten Assert `forwardRefs === []`. Pass 6 ist die erste Welle mit *forward-referencing collection edges* — drei Anthologien (Sanctus Reach W40K-0296, Damocles W40K-0294, Shield of Baal W40K-0304) liegen in früheren Batches als ihre Novellen. Der Assert fiel mit 10 legitimen Refs. Phase 4 hat den Guard auf **report-only** entschärft und end-to-end verifiziert, dass alle 10/10 Edges in `work_collections` landen (`applyCollections` ist für cross-batch-Refs gebaut: der aufsteigende Sweep überspringt die Edge, wenn der Anthologie-Batch läuft, und erzeugt sie, wenn der Content-Batch landet). Die Begründung trägt — aber report-only fängt jetzt **gar nichts** mehr: ein echter Tippfehler in einer collection-Edge oder eine Konstituente außerhalb der applied Range rutscht stumm durch.

## Der Split (architektonische Festlegung)

Phase 4 wird zu zwei Subphasen, gespiegelt am bestehenden „eine `/clear`-Subsession pro Einheit"-Muster:

**Phase 4a — Integration / Apply.** Die *Mutations*-Hälfte. Lese-Scope: Runbook + Config + Dossier + das Apply-seitige Achs-Paket. Aufgaben: `seed-resolver-extensions.ts` um die neuen Reference-Rows erweitern; die Trias-Batch-Ranges (`apply-override-dry.ts`, `test-resolver-coverage.ts`, `test-resolver-data-integrity.ts`) auf die kumulative Range ausweiten; `run-phase4-apply.sh` fahren (seedet non-destruktiv, idempotentes Re-Apply, schreibt `phase4-digest.md`); unbekannte facetIds aus Override-Files strippen, falls nötig; die Apply-seitige Trias grün ziehen. **Ein Commit.** Schreibt eine **4a-Statusdatei** als Handoff.

**Phase 4b — Verify / Report.** Die *read-only*-Hälfte. Lese-Scope: Runbook + Config + die 4a-Statusdatei + der Apply-Digest + der Verify-Digest. Aufgaben: `verify-pass.ts` fahren; finale Verifikation (Verify-Digest lesen, `lint`, `typecheck`); den finalen Impl-Report `resolver-pass-N-impl-report.md` schreiben; Pass-Status setzen. **Ein Commit.** Phase 4b liest **nie** rohe Apply-Ausgabe, **nie** die Override-Files, **nie** die Apply-seitigen Skripte — sie arbeitet aus Digests + dem 4a-Handoff.

**Warum dieser Schnitt.** 4a ist die Mutations-Hälfte (DB-Apply, Skript-Edits, ggf. Override-Edits), 4b die read-only-Verifikations-/Report-Hälfte. Nach 4a ist die DB in ihrem Endzustand; 4b beobachtet nur. Das ist die sauberste Naht: das große Report-Schreiben bekommt ein frisches Fenster, und ein ungeplanter Apply-seitiger Snag (wie der Guard-Fehler in Pass 6) bleibt in 4a — 4a löst, committet, und übergibt 4b einen sauberen Stand, statt Debug-Rückstand in Verifikation und Report zu schleppen.

**Handoff-Kontrakt.** Die 4a-Statusdatei muss selbst-enthalten genug sein, dass 4b nichts von 4a braucht außer dieser Datei + den zwei committeten Digests. Sie trägt: die Counts-Tabelle (Pre / Per-New-Wave-Batch / Post — die heutige Impl-Report-„Pflicht-Tabelle"-Form), die Reference-Row-Deltas, etwaige Override-Edits / facetId-Strips, jede Anomalie oder Ermessens-Entscheidung (z. B. ein Guard-Befund, ein deferred gap) und entweder einen „ready for 4b"-Marker oder einen `## Needs decision`-Block. 4b poliert das zum finalen Impl-Report — es leitet **keinen** Zustand neu her.

## Der range-aware Guard (gebündelt)

`apply-override-dry.ts`, forward-ref-Check: ein forward collection ref ist **legitim**, wenn die Konstituenten-Work innerhalb der applied/kumulativen Range liegt (der aufsteigende Sweep löst sie auf). Er ist ein **Fehler**, wenn die Konstituente *nicht* in Range ist bzw. keine bekannte Work — Tippfehler, fehlende Roster-Edge. Der Guard wird von „report-only / schlägt nie fehl" geändert zu: **Fehler genau dann, wenn die Konstituente einer forward-ref-Edge außerhalb der applyRange liegt (oder anderweitig unauflösbar ist);** legitime in-range cross-batch-Edges werden akzeptiert (optional weiter als Info gedruckt). Das stellt ein echtes Sicherheitsnetz wieder her und akzeptiert zugleich das legitime cross-batch-Muster, das Pass 6 zutage gebracht hat.

## Constraints

- **Runbook** (`sessions/resolver-pass-runbook.md`) ist die permanente operative Spec — anpassen: §0 „fünf Phasen" → sechs Phasen (0, 1, 2, 3, 4a, 4b); §3 den „### Phase 4"-Abschnitt in „Phase 4a" + „Phase 4b" splitten, je mit eigener „Lies NUR …"-Regel + Achs-Paket; §5 FK-/Reihenfolge (4a strikt vor 4b, 4b läuft zuletzt); §7 Digest-Disziplin gilt für 4a, plus die 4b-Digest-Lese-Regel; §10 Verifikation auf 4a/4b aufteilen. Jede stale „fünf Phasen" / „Phase 0 → 4"-Referenz im Runbook mitsweepen.
- **Config** (`scripts/resolver-pass.config.json`): das `phases[]`-Array bekommt einen sechsten Eintrag — `phase-4-integration` wird zu `phase-4a-integration` + `phase-4b-verify-report`. 4a bekommt eine `statusFile` (neue 4a-Report-Pfad); der Impl-Report-Pfad wandert in den 4b-Scope. 4a-Scope = Apply-seitige Skripte + Override-File-Globs + die 4a-Statusdatei; 4b-Scope = `verify-pass.ts` + der Impl-Report. Der 4b-`trigger`-Text nennt die 4a-Statusdatei explizit als Pflicht-Lektüre (so erfährt 4b ohne Driver-Änderung davon).
- **Per-Pass-Werte der Config bleiben unangetastet.** `pass`/`wave`/`aggregator`/`verify` behalten ihre aktuellen Pass-6-Werte; die Dossier-/Report-Pfade behalten ihre `-6-`-Kennung (konsistent zum aktuellen `pass`). Nur die **Struktur** von `phases[]` ändert sich. Das Re-Keying auf Pass 7 ist ein späterer Cowork-Setup-Schritt (siehe Out of scope).
- **Driver** (`scripts/run-resolver-pass.sh`): er iteriert generisch über `config.phases[]` mit per-Phase-Halt-Checks — ein 6-Phasen-Sequenz sollte **ohne Code-Änderung** laufen. Die einzige phasen-namens-spezifische Logik ist die `phase-0-*`-Erkennung für das Dossier-Inject; `phase-4a-*`/`phase-4b-*` matchen das nicht und bekommen das Dossier injiziert (korrekt). CC **verifiziert** das (`bash -n`; die Phasen-Schleife verträgt 6 Einträge; die „jede Phase muss committen"-Regel + der Diff-Subset-Halt-Check halten für 4a und 4b) und patcht den Driver **nur**, falls eine echte Inkompatibilität auftaucht — eine etwaige Änderung im Report begründen.
- Resolver-Semantik unverändert (direct match → alias, kein Fuzzy, kein Slug-Match) — Brief 049/072.
- Keine Tool-Versionen pinnen — irrelevant hier, aber Standard.
- Kein zweiter DB-Apply: 4a wendet einmal an, 4b liest nur. Der Digest, den 4a schreibt, ist 4bs Apply-seitiger Input.

## Out of scope

- **Die Pass-7-Per-Pass-Config-Werte** (`pass`/`wave`/aggregator-Ranges/verify-Ranges/`smokeSlugs`/Dossier-+Report-Pfade auf `-7-`). Pass 7 (`ssot-w40k-036..045`) ist noch nicht als Override-Files kristallisiert — der SSOT-Loop fährt die Welle erst noch. Das Re-Keying ist ein eigener Cowork-Setup-Schritt nach dem Loop-Lauf.
- **Pass 6 erneut fahren.** Pass 6 ist abgeschlossen + gemerged; der Split ist vorwärtsgerichtet für Pass 7+.
- **Den Headless-Driver „scharf" schalten.** `run-resolver-pass.sh` bleibt supervised; ein erster echter Driver-Lauf ist nicht Teil dieses Briefs.
- **Phase-3 `characters.json`-Achsen-Slicing.** Bekannte Wachstums-Kante (Brief 090 § For next session; Pass-6-Phase-3-Report: „no axis-slice needed yet", 237 Rows / 1433 Zeilen). Separate, spätere Sache — nicht anfassen.
- **Die zwei deferred collection-gaps** (Architect of Fate W40K-0286, War for Armageddon Omnibus W40K-0307). Roster-/Excel-SSOT-Arbeit, gehört zu OQ (14) Roster-Excel-Hygiene-Sweep — nicht in diesem Brief.
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung, OQ (14) Roster-Excel-Hygiene-Sweep** — keine Berührung mit der Resolver-Pass-Maschinerie. Bleiben in der Queue, hier **explizit verschoben**.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `resolver-pass-runbook.md` eine **6-Phasen-Sequenz** (0, 1, 2, 3, 4a, 4b) beschreibt; §0/§3/§5/§7/§10 angepasst; keine stale „fünf Phasen" / „Phase 0 → 4"-Referenz bleibt übrig.
- [ ] Runbook-Spec **Phase 4a**: erweitert `seed-resolver-extensions.ts`, weitet die Trias-Ranges, fährt das digest-only Re-Apply, hinterlässt eine selbst-enthaltene 4a-Statusdatei. Runbook-Spec **Phase 4b**: fährt Verify + finale Checks + schreibt den Impl-Report, liest dabei **nur** Runbook + Config + 4a-Statusdatei + die zwei Digests — nie rohe Apply-Ausgabe, nie Override-Files, nie die Apply-seitigen Skripte.
- [ ] `resolver-pass.config.json` `phases[]` hat 6 Einträge; 4a hat eine `statusFile`; der Impl-Report-Pfad liegt im 4b-Scope; der 4b-`trigger` nennt die 4a-Statusdatei; jeder Phase-Scope ist korrekt; JSON valide.
- [ ] Der forward-ref-Guard in `apply-override-dry.ts` ist **range-aware**: in-range cross-batch-Refs werden akzeptiert, eine Konstituente außerhalb der applyRange wirft. Ein gezielter Check/Test demonstriert beide Zweige (legitime forward-ref passt, out-of-range forward-ref schlägt fehl).
- [ ] `run-resolver-pass.sh` fährt die 6-Phasen-Config (verifiziert: `bash -n`; die Phasen-Schleife verträgt 6 Einträge; per-Phase-Commit + Diff-Subset-Halt-Check halten für 4a/4b). Eine etwaige Driver-Änderung ist im Report begründet.
- [ ] Resolver-Trias grün: `npm run test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`; `npm run lint` + `npm run typecheck` grün.
- [ ] Architekten-Output (dieser Brief + die post-091-Brain-Edits + `sessions/README.md`) und die Brief-091-Implementierung liegen zusammen in **einem** PR auf `codex/session-091-phase4-split` — kein separater Cowork-PR (siehe § Commit & PR).

## Open questions

Keine Blocker — Inputs, die ich im Report gerne hätte:

- Verträgt sich die Driver-Regel „jede Phase muss einen Commit produzieren (HEAD bewegt sich)" sauber mit 4b? 4b sollte immer einen echten Commit haben (der Impl-Report). Falls nicht: melden.
- Soll 4b die volle Resolver-Trias erneut fahren, oder reicht `verify-pass.ts` + `lint` + `typecheck`, weil 4a die Trias bereits auf den Code-Edits grün gezogen hat? Wähle das minimal-aber-sichere Set und begründe es kurz.
- Ist eine separate `resolver-pass-N-phase-4a-report.md` die richtige Handoff-Form, oder ein Append ans Dossier? Der Brief empfiehlt die separate per-Phase-Statusdatei — konsistent zu den Phasen 1–3 und passend zum Driver-`statusFile`-Halt-Check (`## Needs decision`-Erkennung).

## Notes

- **Namensvorschlag:** `phase-4a-integration` / `phase-4b-verify-report`. Die Driver-`phase-0-*`-Erkennung bleibt unberührt; beide bekommen das Dossier injiziert — für 4b unkritisch (es nutzt es höchstens leicht; Kern-Inputs sind 4a-Statusdatei + Digests).
- Reine Maschinerie/Plumbing — keine UI-Oberfläche, daher kein „Design freedom"-Abschnitt.
- Der Split ändert **nichts** an Phasen 0–3 und nichts an der Resolver-Semantik. Er halbiert nur die schwerste Subsession.
- Hintergrund-Rationale (warum es den Resolver-Pass gibt, die Achsen-Aufteilung, der Driver) steht in Brief 076; das Token-Budget-Rationale in Brief 090. Dieser Brief baut nur darauf auf.
