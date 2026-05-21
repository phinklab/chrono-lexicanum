---
session: 2026-05-21-089
role: architect
date: 2026-05-21
status: open
slug: resolver-pass-5
parent: 2026-05-11-061
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-19-084-arch-locations-axis-hygiene
  - 2026-05-20-087-arch-goodreads-rating-pipeline
  - 2026-05-21-088-arch-ssot-loop-lean
commits: []
---

# Resolver-Pass 5 — ssot-w40k-021..025 (axis-sliced)

## Goal

Die Surface-Forms der fünften Loop-Welle (`ssot-w40k-021..025`, W40K-0201..W40K-0250) in die Resolver-Reference-Schicht kristallisieren und die 50 neuen Authority-Bücher in die DB applien — die 250er-Resolver-Pause des Standing-Loops abarbeiten.

Dies ist die **erste produktive Anwendung des Drivers `scripts/run-resolver-pass.sh`** (Deliverable aus Brief 076). Phasen-Mechanik, Write-Scopes und Dossier-Pflichtsektionen sind unverändert gegenüber Brief 076 — dieser Brief wiederholt sie nicht, sondern nennt nur die Wave-Deltas und drei Wave-spezifische Architektur-Calls.

## Context

- Der Standing-Loop (Brief [061](./2026-05-11-061-arch-ssot-loop.md)) hat die Iterationen 021..025 gefahren und bei kumulativ 250 pausiert. **PR #77 ist gemerged** (Merge `c2f53e7` auf `origin/main`); die 5 Override-JSONs + der Loop-Log-Append sind damit committete Mainline-Daten. Der PR war rein additiv (+1118/−0), kein DB-Touch.
- Welle: `ssot-w40k-021..025` = W40K-0201..W40K-0250, 50 Bücher. Alle vier Loop-Disziplinen haben gegriffen: Public-Synopsis, Faction-Granularity, Locations-Granularity und Goodreads-Rating (Brief [087](./2026-05-20-087-arch-goodreads-rating-pipeline.md)). Per-Buch-Kontext für jedes Buch steht in den `sessions/ssot-loop-log.md`-Blöcken vom 2026-05-21 (eine Bullet-Liste pro Batch).
- Resolver-Baseline post-077/084: `work_factions=1020`, `work_locations=417`, `work_characters=633`, `work_collections=56` über die ersten 200 Bücher. Reference-Rows post-076: `factions≈146`, `locations≈157`, `characters≈169`. Der Grand-Alignment-Junction-Skip (Brief [077](./2026-05-16-077-arch-grand-alignment-junction-hygiene.md)) und der Locations-Umbrella-Skip (Brief [084](./2026-05-19-084-arch-locations-axis-hygiene.md)) sind im Apply-Layer scharf und feuern beim Re-Apply automatisch.
- **Brief [076](./2026-05-16-076-arch-resolver-batch-4-axis-sliced.md) ist die kanonische Workflow-Spezifikation.** Der Fünf-Phasen-Vertrag (Preflight/Dossier → Factions → Locations → Characters → Integration), die Per-Phase-Write-Scopes, die sieben Dossier-Pflichtsektionen, die globalen Constraints, die `needs-decision`-Stop-Konvention — alles gilt 1:1 weiter. CC liest `sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md` § Constraints + Phase 0–4, bevor es startet. Runbook: `docs/resolver-apply-runbook.md`.
- Driver + Config: `scripts/run-resolver-pass.sh` + `scripts/resolver-pass.config.json`. Die Config ist bereits für Pass 5 vor-templatet (`REPLACE-WITH-*`-Platzhalter); Befüllung siehe § Notes.

### Wave-Cluster (Orientierung — die belastbare Aufzählung macht das Phase-0-Dossier)

Sieben grobe Cluster über die fünf Batches, abgeleitet aus dem Loop-Log:

- **021 — Calpurnia / Black Templars / Dawn of War.** Adeptus Arbites (`adeptus_arbites` existiert post-076), Black Templars als Chapter, Third War for Armageddon, der Blood-Ravens-/Dawn-of-War-Auftakt.
- **022 — Grey Knights / Blood Angels / DoW II–III.** Grey Knights (Counter-Trilogie + Omnibus), Blood Angels (Swallow: Rafen/Arkio, Flesh Tearers), Fabius Bile.
- **023 — Space Hulk / frühe Astra-Militarum-Welle.** Space-Hulk-Vessel als Location, Catachan / Vostroyan / Valhallan / Tallarn, erste Imperial-Guard-Omnibi.
- **024 — Astra-Militarum-Hauptwelle.** Cadian / Death Korps of Krieg / Mordian Iron Guard / Brimlock / Baneblade-Panzer-POV, mehrere aggregierte Omnibi.
- **025 — Astra-Militarum-Abschluss + Deathwatch-Auftakt.** Tempestus Scions, Savlar Chem-Dogs, Crimson Slaughter, Night Lords (siehe Architektur-Call 3), Deathwatch-Line-Opener.

Cross-Batch-Charakter-Kandidaten, auf die das Dossier achten muss: **Lo Bannick** (Baneblade W40K-0238 + Shadowsword W40K-0241 — eine Row), **Yarrick** (Gunheads), ggf. **Alaric** über die drei Grey-Knights-Romane + Omnibus.

## Wave-spezifische Architektur-Calls

Drei Entscheidungen, die über die reine 076-Mechanik hinausgehen. Calls 1 und 3 sind Architektur-Direktiven für die jeweilige Phase; Call 2 ist eine bewusste, eng begrenzte Scope-Erweiterung dieses Passes.

### Call 1 — Astra-Militarum-Regimenter als Sub-Factions

Diese Welle ist zur Hälfte Imperial-Guard. Das Loop-Log nennt wiederkehrend benannte Regimenter (Cadian Shock Troops, Death Korps of Krieg, Catachan Jungle Fighters, Vostroyan Firstborn, Valhallan Ice Warriors, Mordian Iron Guard, Tallarn Desert Raiders, Brimlock Dragoons, Tempestus Scions, Savlar Chem-Dogs).

**Direktive:** Regimenter, die in der Welle **belastbar wiederkehren (freq ≥ 2)** und lore-ikonisch sind, werden als Sub-Factions unter dem Browse-Root `astra_militarum` angelegt — strukturell analog zu den Necromunda-Houses unter `necromunda` (Brief 076) und den Space-Marine-Chapters unter `adeptus_astartes`. Ein Reader-Filter „Death-Korps-of-Krieg-Bücher" ist genau der Use-Case, den `work_factions` tragen soll. Einzel-Auftritt-Regimenter (freq = 1, nicht ikonisch) bleiben Surface-Form im Override. Jede neue Sub-Faction trägt explizit `"alignment": "imperium"` (Inferenz-Trap-Note aus 070/077 gilt weiter). Welche Regimenter genau die freq-≥-2-Schwelle reißen, ist CC's Auszählung im Phase-0-Dossier; die exakte Liste + die freq-=-1-Iconic-Promotions begründet der Phase-1-Report. Kein neuer Browse-Root — alle Regimenter hängen unter `astra_militarum`. Bei unklarem Parent: `needs-decision`-Stop, nicht raten.

### Call 2 — `protagonist_class` += `commissar`

**Context.** Die Guard-Welle hat dreimal `value_outside_vocabulary` auf der Achse `protagonist_class` ausgelöst: `commissar` (024 + 025), `tank_crew` (024), `penal_legion` (025). `commissar` ist zusätzlich seit Brief 074 ein bekannter Loop-Log-Tag-Kandidat. Der scharfe Befund: W40K-0237 *Commissar* wurde notdürftig auf `protagonist_class=inquisitor` gemappt — ein Commissar ist kein Inquisitor, dieser Wert führt einen Reader-Filter aktiv in die Irre.

**Decision.** Dieser Pass erweitert `scripts/seed-data/facet-catalog.json` um **einen** neuen `protagonist_class`-Wert für den Archetyp „Commissar / politischer Offizier" (ID snake-case nach Datei-Konvention, Label „Commissar"; Platzierung/`displayOrder` nach Datei-Konvention — CC's Call). `tank_crew` und `penal_legion` werden **nicht** aufgenommen.

**Why.** Der Commissar ist in 40k ein eigenständiger, ikonischer, filtrierbarer Archetyp (Cain, Gaunt) und kehrt in dieser Welle in mindestens vier bis fünf Büchern als POV/Lead wieder — die Evidenz trägt eine Vokabel. `tank_crew` (im Wesentlichen die Baneblade-Reihe) und `penal_legion` (ein Buch dieser Welle) sind schmaler; `guardsman` ist ein vertretbarer Nearest-Fit. Sie bleiben als `value_outside_vocabulary`-Watch-Items für eine spätere, eigene Vokabel-Triage stehen — kein Eintrag wird erfunden.

**Scope dieser Erweiterung (in Phase 4 abgewickelt):** (a) den Wert in `facet-catalog.json` anlegen; (b) in den Override-JSONs 021..025 die Bücher, in denen ein Commissar / politischer Offizier der prinzipielle POV oder Co-Lead ist (CC liest die Per-Buch-Bullets im Loop-Log — mechanische Zuordnung), auf den neuen Wert um-taggen; die `inquisitor`-Fehlzuordnung bei W40K-0237 MUSS dabei verschwinden; bei gemischtem Cast entscheidet CC pro Buch, ob `guardsman` zusätzlich stehen bleibt (`multiValue: true`); (c) die jetzt in-vocabulary gewordenen `commissar`-Einträge aus den `value_outside_vocabulary`-Blöcken der betroffenen Override-Files entfernen (`tank_crew` / `penal_legion` bleiben stehen). Die Um-Tag-Liste wird im Phase-4-Report enumeriert — analog zur Typo-Strip-Enumeration aus 074/076.

### Call 3 — Roster-Backfill erledigt + Remnant-Blade-Mistag

Der Loop hat zwei Roster-Lücken gefunden: W40K-0206 *Broken Crusade* und W40K-0244 *The Remnant Blade* trugen beide `authors: []` (`editorialNote: null` — kein Anthologie-Fall). Maintainer-Eingabe 2026-05-21 liefert die fehlenden Autoren: **Broken Crusade → Steven B. Fischer**, **The Remnant Blade → Mike Vincent**.

**Direktive:** Der Autor-Backfill ist als Vorab-Setup erledigt: exakt die zwei `Author`-Zellen in `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` wurden gesetzt und `book-roster.json` wurde ausschließlich über `npm run import:ssot-roster` regeneriert. Die Driver-Phasen fassen die Excel-SSOT und `book-roster.json` nicht weiter an. Phase 4 verifiziert beim `001..025`-Re-Apply, dass beide Bücher jetzt `work_persons`-Autor-Zeilen bekommen.

**Separat — nicht in diesem Pass:** W40K-0244 trägt im Roster `seriesHint: "Imperial Guard"`, ist aber ein Night-Lords-Roman (Chaos). Der Loop hat das korrekt gefangen — das Override-File taggt Night Lords + `data_conflict`-Flag, und auf der Faction-Achse löst `night_lords` (post-072 unter `heretic_astartes`) regulär. Die `seriesHint`-Korrektur ist eine eigene Maintainer-Entscheidung (sie greift in die Series-Gruppierung ein) und wird hier **nicht** mitgemacht — der Phase-4-Report nennt sie als offenen Punkt.

## Constraints

Es gelten **alle globalen Constraints aus Brief 076 § Constraints** (keine Schema-Migration; keine UI-Arbeit; keine over-broad Aliases; Surface-Form-Treue; Determinismus; `needs-decision`-Stop ist erlaubt und ehrenhaft; Faction-Hierarchie respektiert `faction-policy.json`; Character-/Location-Promotion nur bei freq ≥ 2 strict + kuratierte freq-=-1-Iconics; Idempotenz; fremde/parallele Änderungen nicht zurücksetzen). Zusätzlich bzw. konkretisierend für Pass 5:

- **Re-Apply-Range ist `001..025` sequentiell.** `021..025` ist First-Time-Apply (PR #77 war diff-only), `001..020` ist Resolver-Set-Drift-Cleanup. Idempotenz über delete-then-insert pro Junction, wie im Runbook.
- **Surface-Form-Treue — einzige zulässige Override-Edits.** Override-JSONs werden nicht umgeschrieben, um Surface-Forms zu kollabieren. Zwei eng begrenzte, zu enumerierende Ausnahmen: (a) bestätigte Loop-LLM-Catalog-Typos bei `facetIds`, die `apply-override.ts` sonst hart faillen lassen (analog 074/076); (b) das `commissar`-Um-Taggen aus Call 2. Beide Mengen werden im Phase-4-Report vollständig aufgelistet.
- **`facet-catalog.json` ist nur für Call 2 in Scope** — genau ein neuer `protagonist_class`-Wert. Keine anderen Facet-Kategorien, keine anderen Werte, kein Umsortieren bestehender Werte.
- **Roster-/Excel-Edit ist nicht Teil der Driver-Phasen.** Der Autor-Backfill aus Call 3 ist ein Vorab-Setup in diesem Session-Branch: exakt die zwei `Author`-Zellen (W40K-0206, W40K-0244) in `Warhammer_Books_SSOT.xlsx`, danach `book-roster.json` per `import:ssot-roster` regeneriert. Keine weiteren Roster-Zeilen, kein `seriesHint`-Touch, keine Hand-Edits direkt an `book-roster.json`.
- **Goodreads-Rating fällt beim Re-Apply automatisch mit.** `apply-override.ts` schreibt seit Brief 087 `book_details.rating`/`ratingCount`/`ratingSource`. Phase 4 verifiziert die Rating-Coverage für `021..025` als Teil der Counts-/Smoke-Dokumentation (Erwartung ~49/50; W40K-0205 trägt bewusst den Unrated-Marker). Kein separater Rating-Schritt.
- **Driver-Lauf.** Pass 5 läuft über `scripts/run-resolver-pass.sh` mit der befüllten `resolver-pass.config.json`. Authoritativ sind die Phasen-Verträge aus Brief 076 + dieser Brief — nicht der Driver. Wenn der Driver selbst klemmt, ist ein manueller Phase-für-Phase-Lauf nach Runbook der zulässige Fallback; im Report vermerken.
- **Version-Policy.** Keine Tool-Versionen pinnen, keine Dependencies hinzufügen — ein Resolver-Pass braucht keine.

## Out of scope

Implementer sind eifrig — diese Dinge bleiben in dieser Session **explizit unangetastet**:

- **Loop-Re-Trigger `ssot-w40k-026+`.** Der committete Resolver-Pause-Block ist nur ein advisory Marker; `run-ssot-loop.sh` würde nach einem committeten Pause-Block automatisch weiterlaufen. Der Loop wird in dieser Session **nicht** weitergedreht. Erst nach Merge dieses Passes.
- **`book-roster.json` und die Excel-SSOT** (`scripts/seed-data/source/*`) — in den Driver-Phasen vollständig out of scope. Der Autor-Backfill aus Call 3 ist bereits Vorab-Setup; der `seriesHint`-Mistag W40K-0244 wird **nicht** gefixt, nur im Phase-4-Report als offener Punkt genannt.
- **`tank_crew` / `penal_legion`** als Vokabel-Werte (Call 2). Nicht hinzufügen.
- **UI / Cockpit.** `/buch/[slug]`, `/buecher`, `/buch/[slug]/audit`, Drift-Tie-Group-Sub-Sortierung, Public-Rating-Render — eigene Briefs.
- **Schema-Migration.** Kein Touch an `src/db/schema.ts` oder `src/db/migrations/`. Harter Resolver-Blocker → `needs-decision`-Stop.
- **Pipeline-Code** (`src/lib/ingestion/**`), App-Routen (`src/app/**`).
- **Brain-Wiki** (`brain/wiki/**`). Cowork zieht den Wiki-Hygiene-Pass in einer eigenen Session nach dem Merge.
- **Bestehende `overrides.synopsis`-Texte 001..025** und committete `ssot-loop-log.md`-Blöcke — kein Rewrite.
- **Andere Worktrees / der CRLF-Resync der Coordination-Worktree.** Kein `git reset --hard` außerhalb expliziter Maintainer-Anweisung.

## Acceptance

Die Session ist fertig, wenn:

- [ ] **Phase 0** — Resolver-Dossier `sessions/resolver-dossiers/2026-05-21-089-resolver-pass-5-dossier.md` mit den sieben Pflichtsektionen (Scope-Header, 50-Zeilen-Buch-Tabelle, Surface-Form-Aggregat pro Achse, Cross-Axis-Warnungen, Cross-Batch-Alias-Cases, Omnibus-/Format-Konflikte, `needs-decision`-Kandidaten) committet; Aggregator-Helper `scripts/aggregate-surface-forms-089.ts` deterministisch.
- [ ] **Phase 1 (Factions)** — `factions.json` / `faction-aliases.json` (ggf. `faction-policy.json`) um die belastbar häufigen Faction-Surface-Forms erweitert; Astra-Militarum-Regimenter nach Call 1 als Sub-Factions unter `astra_militarum` mit explizitem `alignment`; ≥ 5 neue `test:resolver`-Cases; Phase-1-Report geschrieben.
- [ ] **Phase 2 (Locations)** — `locations.json` / `location-aliases.json` (ggf. `sectors.json`) erweitert; Vessel-/Space-Hulk-Locations nach 072/076-Konvention (`tags:['vessel']`, `gx/gy:null`); ≥ 4 neue `test:resolver`-Cases; Phase-2-Report geschrieben.
- [ ] **Phase 3 (Characters)** — `characters.json` / `character-aliases.json` erweitert; Cross-Batch-Konsolidierung (mind. Lo Bannick als eine Row); ≥ 5 neue `test:resolver`-Cases, davon ≥ 2 für Alias-Konsolidierung; Phase-3-Report geschrieben.
- [ ] **Call 2** — genau ein neuer `protagonist_class`-Wert in `facet-catalog.json`; die betroffenen Bücher in den Override-JSONs 021..025 um-getaggt, W40K-0237 trägt nicht mehr `inquisitor`; stale `commissar`-`value_outside_vocabulary`-Einträge entfernt; Um-Tag-Liste im Phase-4-Report enumeriert.
- [ ] **Call 3** — Phase-4-Report bestätigt die zwei gesetzten `Author`-Zellen (W40K-0206 → Steven B. Fischer, W40K-0244 → Mike Vincent), die `book-roster.json`-Regeneration via `npm run import:ssot-roster` und die resultierenden `work_persons`-Autor-Zeilen; Remnant-Blade-`seriesHint` bleibt als Maintainer-Handoff notiert.
- [ ] **Phase 4 (Integration)** — `seed-resolver-extensions.ts` erweitert; Resolver-Test-Trias auf `001..025` ausgeweitet; `db:seed-resolver-extensions` + `db:apply-override` für `001..025` sequentiell gelaufen; Counts-Tabelle Pre-Apply (Baseline `1020/417/633/56`) → Per-Batch `021..025` → Post-Total für `work_factions`/`work_locations`/`work_characters`/`work_collections`; Rating-Coverage `021..025` dokumentiert; ≥ 8 Smoke-Slugs (≥ 3 Regression aus früheren Wellen, plus neue inkl. *The Remnant Blade* W40K-0244 für den Night-Lords-Check und dem Deathwatch-Opener W40K-0250); Audit-Cockpit-SQL-Replica für Alt- und Neu-Range.
- [ ] Maintainer-Handoff-Block (Call 3: Remnant-Blade-`seriesHint`; Autoren-Backfill erledigt) im Phase-4-Report.
- [ ] `npm run test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `lint`, `typecheck`, `brain:lint -- --no-write` laufen grün.
- [ ] Finaler impl-Report `sessions/2026-05-21-089-impl-resolver-pass-5.md` geschrieben; Status dieses Briefs auf `implemented`.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Welche Regimenter haben die freq-≥-2-Schwelle gerissen, und gab es Grenzfälle, bei denen „Regiment vs. Surface-Form" wirklich knapp war? Material für die Frage, ob `astra_militarum` perspektivisch eine Zwischen-Ebene braucht.
- Hält die Cross-Batch-Charakter-Konsolidierung über die Omnibus/Constituent-Paare dieser Welle sauber, oder tauchen Identitäts-Fälle auf, die `needs-decision` brauchten?
- Wie viele der `021..025`-Omnibi haben volle Roster-Constituent-Coverage, wie viele brauchen einen `collection-gaps.json`-Eintrag analog Green Tide?

## Notes

**Kleine Startanweisung für den Resolver-Prompt.** Arbeite ausschließlich im Batches-Worktree `C:\Users\Phil\chrono-lexicanum-batches`. Falls `pwd` / `git status` den Coordination-Worktree `C:\Users\Phil\chrono-lexicanum` oder Branch `main` zeigt: stoppen, nicht editieren, in den Batches-Worktree wechseln und dort eine frische Branch `codex/ingest-batches-resolver-pass-5` aus aktuellem `origin/main` anlegen.

**Driver-Config befüllen (Setup-Commit vor dem Driver-Lauf).** `scripts/resolver-pass.config.json` ist für Pass 5 vor-templatet; vor dem Lauf die Platzhalter ersetzen und als Setup-Commit committen:

| Platzhalter | Wert |
|---|---|
| `NNN` (überall, inkl. `scripts/*-NNN.ts`, `run-phase4-apply-NNN.sh`) | `089` |
| `brief` | `sessions/2026-05-21-089-arch-resolver-pass-5.md` |
| `dossier` / `REPLACE-WITH-PASS-5-DOSSIER` | `sessions/resolver-dossiers/2026-05-21-089-resolver-pass-5-dossier.md` |
| `REPLACE-WITH-PASS-5-PHASE-{1,2,3}-REPORT` | `sessions/resolver-dossiers/2026-05-21-089-resolver-pass-5-phase-{N}-report.md` |
| `REPLACE-WITH-PASS-5-IMPL-REPORT` | `sessions/2026-05-21-089-impl-resolver-pass-5.md` |
| `REPLACE-WITH-PASS-5-ARCH-BRIEF` | `sessions/2026-05-21-089-arch-resolver-pass-5.md` |

Zusätzlich für Call 2: `scripts/seed-data/facet-catalog.json` in das `scope`-Array der `phase-4-integration` aufnehmen, und den `phase-4`-`trigger` um eine Klausel ergänzen, die das Anlegen des `commissar`-Werts + das Um-Taggen der betroffenen Override-Bücher + das Aufräumen der stale `value_outside_vocabulary`-Einträge nennt (Wortlaut nach diesem Brief § Call 2).

**Roster-Backfill (Call 3, Vorab-Setup erledigt).** In `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, Sheet `Books`, wurden nur die `Author`-Zellen für W40K-0206 *Broken Crusade* (`Steven B. Fischer`) und W40K-0244 *The Remnant Blade* (`Mike Vincent`) gesetzt. `book-roster.json` wurde danach per `npm run import:ssot-roster` regeneriert. Keine Hand-Edits direkt an `book-roster.json` — immer über den Loader.

**Workflow-Referenz.** Die Phasen-Mechanik (Dossier-Pflichtinhalt, Per-Phase-Write-Scopes als Diff-Set-Subset, Halt-Checks, `needs-decision`-Block-Format, Re-Apply-Reihenfolge) steht vollständig in Brief 076 § Constraints + Phase 0–4 und in der Config-`trigger`-Strings. Dieser Brief ändert daran nichts außer den drei Calls oben und der `001..025`-Range.

**Reference-Stand-Abgleich.** Vieles aus dieser Welle ist post-076/077 schon angelegt (`adeptus_arbites`, `heretic_astartes` + die Traitor-Legionen inkl. vermutlich `night_lords`, Shira Calpurnia). Jede Phase prüft Idempotenz pro Row — neu anlegen nur, was wirklich fehlt; bestehende Rows nicht umbenennen.

**Übergabe-Hinweis (Coordination-Worktree).** Die Coordination-Worktree hängt laut `sessions/README.md` noch im un-resynced Zustand (lokales `main` hinter `origin/main`, tree-weiter CRLF-Flip). Dieser Brief ist eine neue, untracked Datei und übersteht einen Resync; er sollte zusammen mit dem `README.md`-Active-Threads-Update auf einem `codex/session-089-resolver-pass-5`-Branch (nicht `main`) committet werden. Der eigentliche Pass läuft im Batches-Worktree auf einem frischen `codex/ingest-batches-resolver-pass-5`-Branch aus `origin/main`.
