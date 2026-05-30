---
session: 2026-05-30-107
role: architect
date: 2026-05-30
status: implemented
slug: full-rebuild-restore-wiring
parent: 2026-05-29-105-arch-buy-listen-links
links:
  - 2026-05-29-105-arch-buy-listen-links
  - 2026-05-29-105-impl-data-buy-listen-links
commits: []
---

# Full-Rebuild-Restore-Wiring — `apply:audiobook-narrators` als deterministischer Tail der SSOT-Reset-Sequenz

## Goal

Ein voller SSOT-Rebuild soll die 88 Hörbuch-Credit-Rows **deterministisch wiederherstellen**, indem `apply:audiobook-narrators` ein fester Schritt der Reset-/Re-Apply-Sequenz wird — über einen dünnen, confirm-gegateten `db:rebuild`-Orchestrator plus einen kurzen Runbook-Abschnitt —, sodass die Credits nach einem Works-Domain-Reset nicht mehr still verschwinden können.

Der Brief-105-Durability-Fix schützt bereits die *routinemäßige* Re-Apply (live bewiesen). Diese Session schließt das verbleibende Loch: den *vollen Rebuild*. Reine Orchestrierungs-/Runbook-Pflege, kleiner Diff, kein Blocker — der eine offene Cluster-A-Folgepunkt aus dem Brief-105-Review.

## Context

**Was Brief 105 gelandet hat (PR #112, Cowork-reviewt akkurat/stabil/sinnvoll).** 66 Bücher Hörbuch-Credits liegen durabel in der DB: gesourct aus dem committed Sidecar `scripts/seed-data/audiobook-narrators.json` (keyed by `externalBookId`), appliziert auf `persons` + `work_persons`. Sidecar-abgeleitete Counts (heute): **88 `work_persons`-Audio-Rollen-Rows** (narrator 63 / co_narrator 12 / full_cast 13), **29 distinct Performer**, Buch-Split 58 single / 5 multi / 3 full-cast, **4 `no_audiobook`-Audit-Einträge**. Diese Zahlen leitet das Sidecar selbst her — sie werden mit dem späteren 859er-Full-Sweep wachsen.

**Der Durability-Fix (live bewiesen, nicht anzufassen).** Der Override-Apply-Delete in `scripts/apply-override.ts` (~L990) ist auf `inArray(role, ["author","editor"])` gescopt; `scripts/apply-audiobook-narrators.ts` besitzt die Audio-Rollen und scopt seinen eigenen Delete auf `narrator|co_narrator|full_cast`. Die zwei Pfade sind symmetrisch und clobbern sich nie — die Audio-Rows überleben jede **routinemäßige** Resolver-/SSOT-Re-Apply (ssot-hh-001-Re-Apply hielt `{author, narrator, co_narrator}` identisch vor/nach).

**Das Loch — der volle Rebuild.** `scripts/db-reset-for-ssot.ts` fährt `TRUNCATE works CASCADE`; `work_persons` steht in der `TRUNCATE_TARGETS`-Liste → die 88 Audio-Rows werden gelöscht. (Die Reference-Tabelle `persons` steht in `REFERENCE_TABLES` und bleibt **unangetastet** — die 29 Performer überleben den Reset, aber verwaist ohne ihre Junctions.) Die Rebuild-Orchestrierung `scripts/run-phase4-apply.sh` seedet Reference-Extensions + Facets (non-destruktiv) und ruft dann pro Batch nur `npm run db:apply-override` — und der Override-Apply stellt eben nur `author|editor` wieder her. **Nichts** ruft `npm run apply:audiobook-narrators`. Folge: nach einem Reset sind die Hörbuch-Credits still weg, bis jemand den Apply von Hand nachzieht.

**Das Werkzeug existiert schon.** `scripts/apply-audiobook-narrators.ts` (der Worker) ist exakt das, was gebraucht wird: idempotent, per-Buch transaktionaler scoped Delete-then-Insert der Audio-Rollen, Auflösung `externalBookId → works.id` über das UNIQUE `works.external_book_id`, legt fehlende `persons` FK-sicher an, `--dry-run`/`--file`-Flags, überspringt unbekannte IDs graziös (reportet sie, exit 0). Er muss **nach** den Apply-Wellen laufen — die `works` müssen existieren, sonst resolvt nichts.

**Entscheidungen dieser Session (mit Philipp).**

1. **Mechanismus = dünner `db:rebuild`-Convenience-Script + kurzer Runbook-Abschnitt** (Cowork-Empfehlung, Philipp: „was empfiehlst du"). Ein voller Rebuild ist selten, aber high-stakes (stiller Verlust von 88 handkuratierten Rows); ein einziger Befehl, der immer mit dem Audio-Apply endet, macht den Schritt unvergesslich, das Runbook dokumentiert die Sequenz. Verworfen: der **Tail-Schritt in `run-phase4-apply.sh`** — diese Engine läuft bei *jeder* Resolver-Welle + über den Loop-Driver; ein angehängter Audio-Apply würde dort redundant pro Welle feuern und eine Rebuild-only-Sorge in die generische Engine koppeln. Falsche Ebene.

2. **Scope = nur der kanonische SSOT-Rebuild-Pfad** (`db:reset-for-ssot` + Apply-Wellen). `db:seed` ist der Legacy-V1-26-Manuals-Dev-Seed (anderer ID-Raum — das Sidecar ist auf den Voll-Korpus-`externalBookId`s gekeyt); Philipp bestätigt, er rebuildet ausschließlich über SSOT. `db:seed` bleibt unangetastet (kein Wiring, kein Deprecation-Flag).

## Constraints

- **Neuer dünner Orchestrator `db:rebuild`.** Ein `npm run db:rebuild`-Eintrag plus ein kleines Orchestrator-Skript (Sprache + Pfad CC's Call — ein bash-Geschwister zu `scripts/run-phase4-apply.sh` ist die natürliche Form). Es verkettet in dieser Reihenfolge:
  1. `db:reset-for-ssot` (Works-Domain-TRUNCATE),
  2. die **Voll-Korpus-Apply-Wellen** über `scripts/run-phase4-apply.sh` (reproduziert den datenkompletten + konsolidierten Korpus),
  3. `apply:audiobook-narrators` (Tail — die `works` existieren jetzt),
  4. einen **Verify-Schritt** (siehe unten).

- **Audio-Apply sitzt als finaler Tail, nach allen Apply-Wellen.** Begründung: er resolvt über `works.external_book_id`, die `works` müssen existieren. Weil der Durability-Fix den Override-Delete auf `author|editor` scopt, überleben die Audio-Rows jede *spätere* routinemäßige Re-Apply — die exakte Reihenfolge gegenüber irgendetwas anderem ist also für die Korrektheit **nicht** load-bearing; der Rebuild muss sie nur einmal, am Ende, applizieren. Das Beenden-mit-Audio-Apply macht einen From-Reset-Rebuild in einer Sequenz vollständig.

- **Verify-Schritt — Sidecar-abgeleitet, nicht literal.** Der Rebuild bestätigt am Ende, dass die DB-Zahl der `work_persons`-Rows mit `role IN ('narrator','co_narrator','full_cast')` der **aus dem Sidecar abgeleiteten Soll-Zahl** entspricht (heute 88) und **nonzero** ist; Mismatch lässt den Rebuild fehlschlagen. Die Soll-Zahl wird aus dem Sidecar berechnet (Summe der Credits über `books[]`), **kein** hartkodiertes `88` — sonst bräuchte der spätere 859er-Full-Sweep einen Verify-Zahl-Edit. Mechanik CC's Call (z. B. ein `--verify`-Modus am Worker, oder eine Count-Assertion im Orchestrator).

- **Bestehende Bausteine unverändert wiederverwenden.** `scripts/db-reset-for-ssot.ts`, `scripts/run-phase4-apply.sh` (Struktur/CLI/Multi-Range-Loader/Digest-Pfade) und `scripts/apply-audiobook-narrators.ts` bleiben in ihren Internals unangetastet — der Orchestrator sitzt **über** ihnen und ruft sie. Am Worker ist höchstens ein optionaler `--verify`-Modus erlaubt (siehe oben); sein graziöses Überspringen unbekannter IDs **darf nicht** in einen Hard-Fail umgebaut werden (der Rebuild-Vollständigkeits-Check lebt im Verify-Schritt, nicht im Worker — der Worker bleibt für den inkrementellen Einsatz, etwa den späteren Full-Sweep, freundlich).

- **Voll-Korpus-Apply ohne brittle Batch-Liste.** Der Rebuild appliziert den vollen kristallisierten Roster (alle committed Override-Batches beider Domänen, W40K 1..57 + HH 1..30 = 859). Keine hartkodierte Batch-Liste, die driftet, wenn der Roster wächst — über eine Voll-Korpus-Config / die committed Override-Files ableiten. Config-Mechanik CC's Call (eine bestehende Voll-Korpus-`applyRanges`-Form existiert; sauberer wäre eine eigene, sprechend benannte Rebuild-Config statt eine konsolidierungs-benannte zweckzuentfremden — siehe Open questions).

- **Confirm-Gating.** `db:rebuild` ist destruktiv (es truncatet `works`) → es **muss** `--confirm` bzw. `DB_RESET_CONFIRM=1` verlangen und die Bestätigung an den Reset-Schritt durchreichen. Ein nacktes `npm run db:rebuild` darf **nicht** truncaten. (Vorlage: das Refuse-ohne-`--confirm`-Pattern in `db-reset-for-ssot.ts`.)

- **Fail-fast + ehrlicher Exit-Code.** Ein fehlgeschlagener Reset-/Apply-/Audio-Schritt bricht ab, bevor spätere Schritte laufen (oder der Lauf endet nonzero mit klarem Marker — `run-phase4-apply.sh`-`FAILED`-Pattern). Der Audio-Apply läuft **nur**, wenn die Apply-Wellen erfolgreich waren.

- **Kurzer Rebuild-Runbook.** Ein knapper Doc: geordnete Sequenz, Vorbedingungen (Migrationen angewandt; Reference-Katalog vorhanden — der Reset bewahrt `persons`/`factions`/… ), Confirm-Gating, erwartete Verify-Zahl (mit dem Hinweis, dass sie Sidecar-abgeleitet ist). **Liegt in `sessions/`** (Geschwister zu `ssot-loop-runbook.md` / `resolver-pass-runbook.md` / `consolidation-pass-runbook.md`), **nicht** unter `brain/**` (Rollup-only, Strang darf das nicht schreiben). Exakter Dateiname CC's Call.

- **Idempotent + re-runnable.** Zweimal `db:rebuild` (mit Confirm) hintereinander führt zum selben Endzustand. Jeder Sub-Schritt ist das bereits.

- **Keine Tool-Versionen pinnen, keine neuen Dependencies** (der Worker existiert; das ist reine Orchestrierung).

- **Worktree.** Batches-Strang (`chrono-lexicanum-batches`). Frische `codex/ingest-batches-*`-Branch aus aktuellem `origin/main`; `main` read-only für Code. Worktree-/Strang-/Branch-Selbstprüfung am Start ansagen (CLAUDE.md § Parallel worktrees).

- **Rollup-Ownership (Brief 095).** `brain/**` und `sessions/README.md` werden in dieser Session **nicht** angefasst — substantielle System-Fakten in den Impl-Report („What I did" / „For next session"); Cowork zieht sie im Post-Merge-Koordinations-Pass nach. (Der neue Rebuild-Runbook unter `sessions/` ist davon nicht betroffen — er ist weder `brain/**` noch `sessions/README.md`.)

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **`db:seed` (Legacy-V1-26-Manuals-Dev-Seed).** Nicht wiren. CC bestätigt in einem Satz im Report, dass `db:seed` **nicht** auf dem SSOT-Rebuild-Pfad liegt, und lässt es in Ruhe. Kein Deprecation-Flag (Philipp: nur SSOT).
- **`scripts/apply-override.ts` — gar nicht anfassen.** Der Durability-Fix (author|editor-gescopter Delete) ist live und reicht. Kein Refactor „über das Nötige hinaus" — hier ist das Nötige *nichts*.
- **`run-phase4-apply.sh`-Internals** (Shell-Struktur Seed→Per-Batch-Apply→Counts→DONE, CLI, Multi-Range-Loader, Digest-/Verbose-Pfade, `FAILED`-Exit). Wird vom Orchestrator **as-is** aufgerufen, keine Edits.
- **`apply-audiobook-narrators.ts`-Verhalten.** Wird als Worker wiederverwendet; höchstens ein additiver `--verify`-Modus. Idempotenz, transaktionaler scoped Delete-then-Insert, graziöses Skip unbekannter IDs bleiben.
- **Re-Run der adjudizierten Konsolidierungs-Pässe als Teil des Rebuilds.** Die Merges sind in die committed Reference-JSONs eingebacken; eine schlichte Re-Apply reproduziert den konsolidierten Korpus. Die human-gegateten Konsolidierungs-Skripte (`consolidation-aggregate.ts`/`-db-snapshot.ts`/`-db-sync.ts`) werden **nicht** in einen automatisierten Rebuild verdrahtet.
- **Resolver-/Konsolidierungs-/Aggregator-Logik, Resolver-Matching-Semantik, SSOT-Loop, Crystallizing.** Unangetastet. Diese Session orchestriert einen bestehenden Rebuild + hängt einen Tail an; sie verändert keine Pipeline-Logik.
- **From-absolutely-empty-DB-Bootstrap** (Migrationen + Base-Reference-Seed). `db:reset-for-ssot` bewahrt die Reference-Tabellen; der hier adressierte Rebuild setzt einen vorhandenen Reference-Katalog voraus (im Runbook als Vorbedingung dokumentiert). Den Voll-Bootstrap einer brandneuen DB baut diese Session nicht.
- **859er-Audiobook-Full-Sweep** (~790 Rest-Bücher, Langzahn). Eigener späterer Sweep; nicht hier. (Der Verify ist Sidecar-abgeleitet, damit er korrekt bleibt, wenn dieser Sweep das Sidecar wachsen lässt.)
- **Brief-105-UI-Pass / jegliche Product-/UI-Oberfläche** (`src/app/**`, `src/components/**`). Anderer Strang; diese Session ist Batches/scripts-only. (Der UI-Pass ist via PR #114 ohnehin schon gemergt — hier dennoch explizit out-of-scope.)
- **Schema-Migration**, Touch an `src/db/schema.ts` / `src/db/migrations/`. Keine.
- **`CLAUDE.md` / `AGENTS.md`-Session-Start-Callouts.** Nicht nötig — der Rebuild ist ein manueller Ops-Befehl, kein neuer Session-Start-Lese-Task-Typ.
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung** — bleiben in der Queue, hier nicht adressiert.

## Acceptance

Die Session ist fertig, wenn:

- [ ] **`db:rebuild`-Orchestrator existiert** (`npm run db:rebuild`; dünnes Skript, Sprache/Pfad CC's Call). Verkettet: `db:reset-for-ssot` → Voll-Korpus-Apply-Wellen (über `run-phase4-apply.sh`) → `apply:audiobook-narrators` → Verify. Im Impl-Report dokumentiert.

- [ ] **Confirm-gegatet:** verweigert ohne `--confirm` bzw. `DB_RESET_CONFIRM=1`; die Bestätigung wird an den Reset-Schritt durchgereicht. Ein nacktes `npm run db:rebuild` truncatet **nicht**.

- [ ] **Fail-fast + ehrlicher Exit:** ein fehlgeschlagener Reset-/Apply-/Audio-Schritt bricht ab, bevor spätere Schritte laufen (oder Lauf endet nonzero mit klarem Marker). Der Audio-Apply läuft nur nach erfolgreichen Apply-Wellen.

- [ ] **Audio-Apply ist der finale Tail:** nach einem vollen `db:rebuild` gegen eine populierte Reference-DB resolven alle 66 Sidecar-Bücher und die **88 Audio-`work_persons`-Rows sind präsent**.

- [ ] **Verify-Schritt scharf:** bestätigt DB-Count `work_persons WHERE role IN (narrator,co_narrator,full_cast)` == **Sidecar-abgeleitete Soll-Zahl** (heute 88), nonzero; Mismatch lässt den Rebuild fehlschlagen. Soll-Zahl aus dem Sidecar berechnet, kein literal `88`. Mechanik CC's Call (`--verify` am Worker oder Count-Assertion im Orchestrator).

- [ ] **End-to-end-Lauf grün + dokumentiert:** `db:rebuild` läuft einmal gegen die konfigurierte DB durch (idempotent/restaurativ — rebuildet auf den aktuellen datenkomplett + konsolidiert + audio-Stand). Pre-/Post-Counts im Report: `works=859`, `work_persons`-Gesamt inkl. der 88 Audio-Rollen, Verify == Sidecar-Soll. (Falls Philipp den destruktiven Lauf lieber selbst fährt: CC legt das exakte Kommando + die erwartete Verify-Ausgabe vor.)

- [ ] **Bestehende Bausteine unverändert:** `db-reset-for-ssot.ts`, `run-phase4-apply.sh` (Struktur/CLI), `apply-override.ts` (gar nicht angefasst). `apply-audiobook-narrators.ts` unverändert bis auf einen optionalen additiven `--verify` (Skip-Verhalten erhalten).

- [ ] **Kurzer Rebuild-Runbook gelandet** (`sessions/`-Geschwister, **nicht** `brain/**`): geordnete Sequenz, Vorbedingungen, Confirm-Gating, erwartete Verify-Zahl (mit Sidecar-abgeleitet-Hinweis).

- [ ] **`db:seed` als nicht-auf-dem-Rebuild-Pfad bestätigt** (ein Satz im Report); unangetastet gelassen.

- [ ] **Resolver-Trias + Hygiene grün:** `npm run test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `test:collection-refs`, `test:audiobook-narrators`; `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write`.

- [ ] **Kanonischer Impl-Report** unter `sessions/2026-05-30-107-impl-full-rebuild-restore-wiring.md`. Brief-Status `open → implemented` als Ein-Zeilen-Edit **innerhalb der Code-PR** (PR-Policy: der Brief ist doc-only, landet zuerst direkt auf `main`; der Status-Flip reitet in der Code-PR mit).

- [ ] **Stop-before-push:** Branch nicht gepusht, kein PR, bis Philipp `fertig` / `PR erstellen` sagt.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- **Skript-Sprache/Heimat** — bash-Geschwister zu `run-phase4-apply.sh` vs. TS-Worker mit `--env-file`? CC's Call; im Report festhalten.
- **Voll-Korpus-Apply-Config** — eine bestehende Voll-Korpus-`applyRanges`-Form (die `consolidation-pass-2.config.json` deckt W40K 1..57 + HH 1..30 = alle 859 ab) wiederverwenden, oder eine eigene, sprechend benannte Rebuild-Config? Letzteres ist sauberer (Rebuild-Semantik nicht an eine konsolidierungs-benannte Datei koppeln), kostet aber eine Datei. Welche Wahl + warum?
- **Verify-Mechanik** — `--verify`-Modus am Worker (liest das Sidecar, zählt die DB, vergleicht) vs. eine Count-Assertion im Orchestrator? Welche, und liest sie die Soll-Zahl wirklich aus dem Sidecar (nicht literal)?
- **End-to-end-Beobachtung** — reproduzierte der Lauf `works=859` + die 88 Audio-Rows sauber? Überraschungen im Reference-Tabellen-Zustand nach dem Reset (z. B. `persons`-Waisen der 29 Performer vor dem Re-Apply)?

## Notes

- **Parent ist Brief 105.** Dieser Brief schließt den einzigen verbleibenden Cluster-A-Folgepunkt — das Cowork-Review-Watch-Item „Full-Rebuild-Restore-Wiring" aus dem Brief-105-Daten-Pass-Review (2026-05-30).

- **Keine UI-Oberfläche → kein „Design freedom"-Abschnitt** (analog Brief 091/093/094/098/102 — reine Maschinerie).

- **Warum Tail + Verify und nicht Tail-in-phase4:** `run-phase4-apply.sh` ist die Per-Welle-Re-Apply-Engine, die bei jeder Resolver-Welle + über den Loop-Driver läuft; ein dort angehängter Audio-Apply feuerte redundant pro Welle und koppelte eine Rebuild-only-Sorge in die generische Engine. Der Rebuild-Orchestrator ist die richtige Ebene.

- **Der Durability-Fix macht die Reihenfolge nachsichtig.** Sind die 88 Rows einmal appliziert, lässt jede spätere routinemäßige Re-Apply sie intakt (author|editor-gescopter Delete). Der Rebuild muss sie nur einmal, am Ende, applizieren.

- **Sidecar-abgeleitete Verify-Zahl** hält den Check korrekt, wenn der spätere 859er-Full-Sweep das Sidecar wachsen lässt — dieser Sweep braucht dann keinen Verify-Zahl-Edit.

- **Konsolidierung ist eingebacken.** Die adjudizierten Merges leben in den committed Reference-JSONs; eine schlichte Re-Apply der Override-Batches reproduziert den konsolidierten Korpus. Deshalb braucht der Rebuild **keinen** separaten Konsolidierungs-Schritt — und die human-gegateten Konsolidierungs-Skripte gehören nicht in eine automatisierte Sequenz (Out of scope).

- **Form-Vorlagen liegen im Repo:** `scripts/run-phase4-apply.sh` (Orchestrator-Header-Kommentar + `FAILED`-Exit-Pattern), `scripts/db-reset-for-ssot.ts` (Confirm-Gating-Pattern), die `sessions/*-runbook.md`-Dateien (Runbook-Form), `scripts/apply-audiobook-narrators.ts` (der Worker, mit eigenem `--dry-run` + Summary). Keine Code-Skizzen in diesem Brief nötig.

- **Übergabe-Modus.** Normaler Batches-Strang-Modus: Stop-before-push, ein PR auf `fertig`. Die Code-PR trägt das Orchestrator-Skript, den `package.json`-`db:rebuild`-Eintrag, den Rebuild-Runbook, den Impl-Report (+ optional `--verify` am Worker) und den Brief-Status-Flip `open → implemented` als Ein-Zeilen-Edit. Der Brief selbst ist doc-only und landet vorab direkt auf `main` (PR-Policy 2026-05-25 — „code-handing brief").
