---
session: 2026-05-16-076
role: architect
date: 2026-05-16
status: implemented
slug: resolver-batch-4-axis-sliced
parent: 2026-05-15-074-arch-resolver-batch-3
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-13-071-impl-loop-driver
  - 2026-05-14-072-arch-resolver-batch-2
  - 2026-05-14-072-impl-resolver-batch-2
  - 2026-05-15-074-arch-resolver-batch-3
  - 2026-05-15-074-impl-resolver-batch-3
  - 2026-05-16-076-impl-resolver-batch-4-axis-sliced
commits:
  - eef47c9  # Phase 0 dossier
  - 210baa5  # Phase 1 factions
  - fd78d39  # Phase 2 locations
  - da8cb26  # Phase 3 characters
  - b66f933  # Phase 4a test trias + facetId strip
  - f7f9630  # Phase 4b helpers + persons.json
  - 94c0600  # Phase 4c resolver-pass driver
  - 6810774  # Mini-Phase 5 public synopsis discipline
  - f36787c  # Phase 4 close: status + report
---

# Resolver-Pass 4 — axis-sliced, manuell gefahren (Driver-Deliverable für Pass 5+) (ssot-w40k-016..020 / W40K-0151..W40K-0200)

## Erratum (2026-05-16, post-Codex-Review, zwei Runden)

Codex hat den Brief zweimal reviewed. **Lies diesen Block, bevor du dem Rest folgst — diese Korrekturen überschreiben gegenteilige Aussagen weiter unten.** Punkte 1–6 stammen aus Review 1 (Vertragslücken zwischen Phasen-Write-Scopes und Acceptance), Punkte 7–9 aus Review 2 (Driver-Rolle, Phase-Report-Wording, stale Begriffe). Direkt-Edits im Body sind nachgepflegt, sodass der Brief beim Top-to-Bottom-Lesen konsistent ist — der Erratum-Block ist primärer Lese-Anchor.

1. **(P0) Driver-Skript-Pfad war in keinem Write-Scope.** Brief verlangt/akzeptiert `scripts/run-resolver-pass.sh`, aber Phase 4 nannte nur `scripts/*-076.ts`. **Fix:** Phase-4-Write-Scope schließt jetzt explizit `scripts/run-resolver-pass.sh` (oder gleichwertig benannte `.sh`-Driver-Datei nach Implementer-Konvention) plus ggf. eine Phase-Config-Datei (z. B. `scripts/resolver-pass.config.json`) ein. Wenn der Driver als reine Spec geliefert wird (siehe § Driver / Loop-Anforderung), bleibt der Phase-4-Scope ohne `.sh`-Datei — beide Pfade sind erlaubt.

2. **(P0) Public-Synopsis-Discipline war kontraktuell unmöglich.** Der Zusatz-Track verlangt einen Edit an `sessions/2026-05-11-061-arch-ssot-loop.md` und erlaubt optional einen Trigger-String-Append in `scripts/run-ssot-loop.sh`, aber Phase 4 nannte beide nicht und „Loop-Driver-Skript modifizieren" stand pauschal als Out-of-Scope. **Fix:** Aus dem Zusatz-Track wird eine **explizite Mini-Phase 5 mit eigenem Write-Scope:** `sessions/2026-05-11-061-arch-ssot-loop.md` + **optional** `scripts/run-ssot-loop.sh` (nur für den Trigger-String-Append des öffentlichen-Synopsis-Disziplin-Hinweises; kein anderer Loop-Driver-Refactor). Der pauschale OOS-Eintrag „Loop-Driver-Skript modifizieren" wird auf „Loop-Driver-Skript strukturell refactoren — der Mini-Phase-5-Trigger-Append ist die einzige erlaubte Berührung" qualifiziert. Mini-Phase 5 darf in derselben Subsession wie Phase 4 mitlaufen (Default) oder als eigene Subsession — Implementer-Wahl, beide Varianten sind im Scope erfasst.

3. **(P0) `collection-gaps.json` war im Acceptance verlangt, aber nicht in einem Write-Scope.** Brief erlaubt Phase-4-Erweiterungen am Green-Tide-Pattern (074-Analogie), nannte die Datei in der Phase-4-Tabelle aber nicht. **Fix:** Phase-4-Write-Scope schließt jetzt explizit `scripts/seed-data/collection-gaps.json` ein.

4. **(P1) `needs-decision` hatte vor Phase 4 keinen erlaubten Ablageort.** Brief sagt, Phasen 1–3 dürfen mit `## Needs decision`-Block stoppen und der Driver erkennt das, aber der einzige Report-Pfad im Scope ist der finale Phase-4-Report. **Fix:** Phasen 1–3 schreiben ihren Phase-Stop bzw. ihre Phase-Decisions in **per-phase-Statusdateien unter `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-{N}-report.md`** (N ∈ {1,2,3}; nur bei `needs-decision`-Stop oder als „phase-done-summary"-Mini-Report). Diese Pfade sind in den jeweiligen Phasen-Write-Scopes erlaubt. Driver-`needs-decision`-Detection ist primär: `grep -l '^## Needs decision' sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-*-report.md`. Stdout-Detection darf zusätzlich genutzt werden, aber die Datei ist die Wahrheit. Phase 4 darf alle Phase-Status-Dateien lesen und konsolidiert ihren Inhalt in den finalen impl-Report.

5. **(P1) „disjoint Write-Scopes" war faktisch falsch.** `scripts/test-resolver.ts` ist in Phasen 1, 2, 3 erlaubt — sequenziell handhabbar (jede Phase appended ihren Block), aber nicht disjoint. **Fix:** Brief-Sprache präzisiert auf **„Phasen-Write-Scopes mit `scripts/test-resolver.ts` als shared file (append-only / sectioned edits, sequenziell)"**. Driver-Halt-Check ist daher **Diff-Set-Subset** der erlaubten Pfade pro Phase, nicht Set-Equality. Verstoß bleibt loud-stop.

6. **(P2) Soul-Drinkers „notes marker" passt nicht zum Faction-Schema.** Wie im 074-Erratum festgehalten: `factions` hat `tone` + `glyph`, kein `notes`-Feld (`src/db/schema.ts:186`). Brief hatte mehrfach von einem Faction-`notes`-Marker für die Soul-Drinkers-Firstborn-vs-Primaris-Continuity gesprochen. **Fix:** Continuity-Marker landet entweder im `tone`-Feld (`tone: 'primaris_reboot_coexistent'` o. ä., Single-Token-Konvention wie in 074-Squats), oder wird ganz weggelassen und nur im Phase-1-Report dokumentiert. CC-Wahl, im Phase-1-Report begründen. Character-`notes` ist davon unberührt (Schema trägt `characters.notes`).

7. **(P1) Driver orchestriert nicht den aktuellen Pass — er ist Deliverable.** Der Brief sprach an mehreren Stellen so, als würde `scripts/run-resolver-pass.sh` die Phasen 0–4 dieses Passes starten (Beispiel-Maintainer-Workflow, Phase-4-§-1-„Driver hat die Commits sequenziell gesetzt"). Das ist zirkulär — der Driver wird ja erst in Phase 4 entweder gebaut oder als Spec geliefert; er kann den Pass, der ihn produziert, nicht orchestrieren. **Fix:** **Pass 4 läuft manuell** als 5 sequenzielle `claude -p` / `codex`-Subsessions (Phase 0 → 1 → 2 → 3 → 4, jeweils mit `/clear` dazwischen). Der Driver (falls gebaut) ist **Deliverable für Pass 5+** und wird in einem späteren Resolver-Pass erstmals als Orchestrator eingesetzt. Der erste Beispiel-Maintainer-Workflow-Block („Wenn Driver gebaut wird") gilt als **Future-State-Vorlage für künftige Pässe** und nicht als Workflow-Beschreibung für diesen Brief. Phase-4-§-1-Wording („Driver hat die Commits sequenziell gesetzt") ist im Body auf „Maintainer hat die Phasen-1-/2-/3-Subsessions sequenziell gefahren" korrigiert.

8. **(P1) Per-Phase-Statusdateien sind explizit erlaubte `sessions/`-Touches.** Der Brief sagte nach der Write-Scope-Tabelle noch, die einzigen `sessions/`-Touches seien Integration-Report + Arch-Status-Update; Phase-1-Output sagte, der Phase-Report werde erst in Integration committed. Beides widerspricht Erratum-Punkt 4 (Per-Phase-Statusdateien unter `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-{1,2,3}-report.md`). **Fix:** Erlaubte `sessions/`-Touches in dieser Session sind: (a) Phase 0 schreibt das Dossier unter `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md`. (b) Phasen 1, 2, 3 schreiben jeweils ihre Per-Phase-Statusdatei `…-phase-{N}-report.md` **in der Phase selbst** (nicht erst in Integration) — als Done-Summary, oder bei `needs-decision`-Stop als Decision-Block. (c) Phase 4 schreibt den finalen impl-Report `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` und setzt den arch-Brief auf `implemented`. (d) Mini-Phase 5 editiert `sessions/2026-05-11-061-arch-ssot-loop.md`. Sonst nichts in `sessions/`. Phase-1-Output-Sprache „committed in Integration-Phase, nicht in Phase 1 selbst" ist im Body korrigiert.

9. **(P2) Stale Begriffe entfernt.** „disjunkte Write-Scopes" passt nicht mehr (Erratum-Punkt 5: `scripts/test-resolver.ts` ist shared file mit sequenziellen append-only-Edits). Im Body durch „phasen-getrennte Write-Scopes mit shared-file-Ausnahme" ersetzt. „`tone`-/`notes`-Anpassung" bei Factions/Soul-Drinkers passt nicht zum Faction-Schema (Erratum-Punkt 6: keine `notes`-Spalte). Im Body auf „`tone`-Anpassung" reduziert.

Die genannten Stellen im Rest des Briefs (Phasen-Write-Scope-Tabelle, Driver-Halt-Check-Wording, Phase-1-Soul-Drinkers-Default, Public-Synopsis-Mini-Phase, Acceptance-Bullets, Phase-4-§-1-Aggregator-Stand, Beispiel-Maintainer-Workflow) sind durch diesen Erratum-Block **überschrieben** und im Body nachgepflegt. CC liest unten weiter mit dem Erratum im Hinterkopf.

## Goal

Schließe die Resolver-Schleife für die **vierte 50er-Welle** der Authority-Schicht (`ssot-w40k-016..020`, 50 Bücher, `W40K-0151..W40K-0200`), aber diesmal **nicht als monolithischer Resolver-Brief-Lauf** wie 063 / 072 / 074, sondern als **axis-sliced Workflow**: fünf manuell getriggerte, voneinander getrennte Subsessions mit frischem Kontext (Preflight / Factions / Locations / Characters / Integration), jede mit `/clear` dazwischen. Cross-Axis-Kontext lebt über ein deterministisches, repo-committetes Resolver-Dossier — **nicht über Chat-Gedächtnis**. Bei Unsicherheit stoppt eine Phase loud mit `needs-decision` statt zu raten. **Driver-Orchestrierung ist explizit nicht das Modell dieses Passes** (Erratum-Punkt 7): Pass 4 läuft manuell, ein Resolver-Driver wird in Phase 4 entweder gebaut oder als Spec geliefert und greift erst ab Pass 5 als Orchestrator.

Sekundär-Ziel mit gleicher Priorität: dieser Brief etabliert das **axis-sliced Resolver-Muster als wiederverwendbares Pattern** für die folgenden 50er-Wellen (250 / 300 / …). Acceptance hier umfasst entweder einen funktionsfähigen Resolver-Driver-Skript (analog `scripts/run-ssot-loop.sh`) **oder** eine derart konkrete Driver-Spezifikation, dass ein direkt-folgender Brief ihn schreiben kann; Cowork-Präferenz ist Driver wirklich bauen, aber nicht um jeden Preis (siehe § Driver / Loop-Anforderung).

Erhalt der bisherigen Resolver-Semantik ist non-negotiable: Surface-Form → canonical ID via **direct match → alias lookup** über `src/lib/resolver/index.ts` und die Sidecar-JSONs (`factions.json` / `locations.json` / `characters.json` plus deren `*-aliases.json`). **Keine** slug-match-Heuristik, **keine** Fuzzy-Logic, **keine** generische Title-Normalisierung im Resolver-Pfad. Was nicht direct-/alias-matcht, bleibt unresolved und landet im Cockpit-Drift-Bucket — exakt wie heute.

Adresse: laufende Resolver-Pflege pro 50er-Schwelle (Closure-Note aus 069, 072, 074) und die `⏸ Resolver-Pause bei 200 Büchern`-Status-Log-Note aus dem 2026-05-16-Loop-Run (`sessions/ssot-loop-log.md`, letzter Block). **Keine** Schema-Migration, **keine** UI-Arbeit, **kein** V2-Pipeline-Touch (V2-LLM-Stage bleibt ausgemustert; ADR [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md)). Loop-Driver-Skript (Brief 071) und dieser Brief sind orthogonal — der Loop-Driver bleibt unangetastet; der **Resolver-Driver ist ein eigenes, neues Tool**.

## Context

**Stand 2026-05-16, post-Loop-Resume.** Die Iterationen `ssot-w40k-016..020` wurden am 2026-05-16 durch den Brief-071-Loop-Driver produziert (`--skip-initial-resolver-pause` auf Iter 1 wegen der schon abgearbeiteten 150er-Pause aus Brief 074, danach unmarkiert; finale Pause-Probe für `cumulative=200` durch den Driver automatisch gefahren). 50 neue Override-Files liegen als `scripts/seed-data/manual-overrides-ssot-w40k-016.json` … `020.json` im Repo; der letzte Block in `sessions/ssot-loop-log.md` ist ein sauberer `## 2026-05-16 · ⏸ Resolver-Pause bei 200 Büchern`-Pause-Block. Kumulativ stehen damit **200 W40K-Bücher** in der Authority-Schicht als Override-Dateien; davon sind 150 (`ssot-w40k-001..015`) bereits in der DB applied gegen das Resolver-Set aus Brief 074, die 50 neuen (`016..020`) liegen heute **nicht** als `works`/`book_details`/`work_*`-Rows in Postgres — exakt das gleiche Erwartungsbild wie nach 071-Loop-Run + vor Brief 074-impl.

**Loop-Log als Verteilungs-Karte für die Welle.** Der `sessions/ssot-loop-log.md`-Stack der Iterationen 016..020 dokumentiert sehr explizit, welche thematischen Cluster diese Welle bringt und welche **cross-batch alias-consolidation-Probleme** in scharfer Form anstehen. Das ist Pflicht-Input für das Dossier — wer das nicht liest, übersieht die echten Resolver-Calls.

Kondensiert aus dem Loop-Log (CC liest das Loop-Log selbst für die genauen Details, das hier ist Surface-Aware-Zusammenfassung):

- **Necromunda classic-imprint cluster** (ssot-w40k-017, 2005-2008): Kal Jerico classic trilogy, Mad Donna (D'onne Ulanti), Lord Gerontius Helmawr (assassiniert in *Lasgun Wedding* W40K-0170), Houses Ko'iron / Helmawr; Spyrers; Underhive-Surface-Forms.
- **Necromunda modern-imprint cluster** (ssot-w40k-018, 2018-2022): Kal Jerico modern, Mad Donna modern-revival, Lord Helmawr modern-continuity (lebt wieder); House Cawdor / Escher / Goliath / Orlock / Helmawr / Ulanti / Delaque / Van Saar; Redemptionists, Guilders, Ratskins, Venators, Corpse Guild, Guild of Light; Scrutinator-Primus-Servalen, Caleb Cursebound, Iktomi, Brielle, Tempes Sol, Lord Silas Pureburn, Breaker Brass, Yar Umbra; Underhive / Hive Primus / Hope's End / Floodgrave / Dim Zone / Fallen Dome of Periculus.
- **Last Chancers cluster** (ssot-w40k-019, 2001-2020): Schaeffer / Lieutenant Kage / 13th Penal Legion / Lorii / Overlord von Strab / **„the Burned Man" als POV-alt-Surface für Kage in W40K-0185**.
- **Gothic War cluster** (ssot-w40k-019, 2001-2003): Captain Leoten Sempter / Lord Solar Macharius / Planet Killer / Gothic Sector / Shadow Point / Abaddon the Despoiler (als Faction-Antagonist surface form).
- **Soul Drinkers cluster** (ssot-w40k-019/020, 2002-2020): Sarpedon / Daenyathos / Iktinos / Tellos / Inquisitor Thaddeus / Teturact / Yeceqath the Voice of All; the Phalanx (star-fort) / Selaaca / Vanqualis / Kepris. **Plus die Firstborn-vs-Primaris-cohort-Frage** auf W40K-0198 *Traitor by Deed* (Primaris-Reboot mit gleichem Chapter-Namen, post-Cicatrix-Continuity).
- **Adeptus-Arbites / Calpurnia opener** (ssot-w40k-020, 2003-2004): Shira Calpurnia / Lord Medell / Hoyyon Phrax; Hydraphur; Phrax-Charter (Rogue-Trader-Lore). **Erste Adeptus-Arbites-primary-faction in der Authority-Schicht** + erste non-Necromunda female-POV.

**Fünf scharfe cross-batch alias-consolidation-Calls für die Resolver-Subsessions (alle aus dem Loop-Log konkretisiert):**

1. **Mad Donna / D'onne Ulanti** als kanonische Single-Character-Entity mit beiden Surface-Forms als Aliase (W40K-0162 + W40K-0177).
2. **Kal Jerico classic vs. modern-imprint** — Resolver-Call: ein Character mit Multi-Era-Surface-Forms, oder zwei distinkte Entities mit gleichem Namen? **Cowork-Tendenz: einer**, weil same name + same setting + same class; Soft-Reboot-Continuity ist hier explizit eine Stil-Reboot-Frage, keine Identitäts-Frage. **CC's Call**, im Report begründen, oder als `needs-decision` markieren wenn unsicher.
3. **Lord Helmawr classic (Gerontius, †) vs. modern (lebt)** — Resolver-Call: zwei distinkte Characters mit gleichem Titel-Surface, oder ein Character mit Soft-Reboot-Note? **Cowork-Tendenz: zwei distinkt** — die in-fiction-Continuity ist explizit gebrochen (er ist im Classic-Layer tot, im Modern-Layer lebendig). Identitäts-Trennung sauberer als Multi-Era-Alias. Im Report begründen oder `needs-decision`.
4. **Lieutenant Kage / the Burned Man** — dual-Surface-Forms im selben Buch (W40K-0185 *Armageddon Saint*). **Single canonical Character mit beiden Surface-Forms als Aliase**, analog zum Mad-Donna-Pattern. Niedrige Ambiguität, Cowork-Default: zusammenführen.
5. **Soul Drinkers Firstborn (W40K-0189..0197) vs. Primaris (W40K-0198)** — Resolver-Call: gleiche Faction-Row mit Continuity-Marker (im `tone`-Feld oder ganz nur im Phase-Report — Schema-Fakt aus Erratum-Punkt 6: Factions haben `tone`+`glyph`, kein `notes`), oder zwei Faction-Rows (`soul_drinkers` + `soul_drinkers_primaris`)? **Cowork-Tendenz: eine Row** mit `tone`-Marker oder Report-only-Doku, weil dasselbe Chapter-Name-+-Heraldry-Setup und das Resolver-Schema heute keine Primaris-vs-Firstborn-Dimension trägt; die Firstborn-Continuity ist mit *Phalanx* (W40K-0196) zu Ende und der Primaris-Reboot ist eine `era_frame`-Frage, keine Faction-Identitäts-Frage. Im Phase-1-Report begründen oder `needs-decision`.

**Was ohne axis-slicing in der Vergangenheit schiefging.** Brief 072 und 074 waren monolithische Resolver-Briefs (eine Subsession bearbeitet alle drei Achsen + Apply-Counts + Smoke + Report). 072-Report hat „Pre-Apply-Counts und per-Batch-Counts wurden im Report nicht enumeriert (Disziplin-Note für nächstes Mal)" als Hand-off vermerkt. 074-impl hat den 150-vs-100-applied-DB-Vor-Annahme-Fix entdeckt + behoben, 13 unbekannte facetIds aus 015-Override gestrippt, Code-Helper-Scripts produktiv geschrieben, Re-Apply für 15 Batches gefahren, Audit-Cockpit-Tour als SQL-Replica gemacht — alles in einer Subsession. Das war an der Qualitätsgrenze: einzelne Subsessions in der Größenordnung > 100k Tokens zeigen sichtbar Drift in Sub-Aufgaben (Brain-Lint-Fix als Beiwerk, Surface-Form-Aggregation als Notes-Pasted-Block statt deterministischer Tabelle). Diese vierte Welle bringt **fünf cross-batch alias-Calls** (s.o.) zusätzlich zur normalen freq≥2-+-lore-iconic-Promotion — das passt nicht mehr sauber in eine Subsession. Axis-Slicing löst das durch **vorgelagerte Aggregation in einem deterministischen Dossier + getrennte Phasen-Subsessions mit phasen-getrennten Write-Scopes** (shared file `scripts/test-resolver.ts` per sequenziellem Append, siehe Erratum-Punkt 5).

**Loop-Re-Trigger-Sequenz.** Brief 061 bleibt paused bei 200 Büchern (`ssot-w40k-021` würde per Pre-Check loud-stoppen, weil `200 % 50 == 0`); nach Resolver-Pass-4-Apply darf Maintainer den Loop-Driver für die fünfte Welle erneut triggern. Audit-Cockpit (`/buecher?audit=drift,gap,ssot,collections` + `/buch/[slug]/audit`, Brief 073 + 075-Drift-Frequenz-Sort) ist verfügbar; CC nutzt es für Vor-/Nach-Apply-Sanity-Checks.

**Pipeline-Architektur-Verschiebung (Kontext, nicht Scope).** Seit Brief 061-Standing-Loop ist die V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) de-facto ausgemustert; eine `claude -p`-Subsession schreibt die Override-Datei direkt. ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). **Dieser Brief ändert keine Pipeline-Files.**

## Constraints

### Globale Constraints (gelten für alle Phasen)

- **Keine Schema-Migration.** Wenn CC einen harten Resolver-Blocker findet (z. B. ein Feld fehlt im Schema und kein bestehendes Feld trägt die Semantik), stoppt die betroffene Phase mit `needs-decision`, ohne `src/db/schema.ts` oder `src/db/migrations/` anzufassen.
- **Keine UI-Arbeit.** Cockpit-Refinements (Drift-Tie-Group-Sub-Sortierung, Public-Rating-Render etc.) bleiben für eigene Briefs. `/buch/[slug]`, `/buecher`, `/buch/[slug]/audit` werden in keiner Phase berührt.
- **Keine öffentlichen Synopsis-Rewrites für 1–200** in dieser Session. Siehe § Public Synopsis Discipline (Zusatz-Track) für die Strukturmaßnahme ab `ssot-w40k-021`. Existierende `overrides.synopsis`-Texte in `manual-overrides-ssot-w40k-001..020.json` bleiben unangetastet.
- **Bestehende Maintainer-/User-Änderungen NICHT zurücksetzen.** Wenn eine Phase eine fremde Datei berührt vorfindet (z. B. Brain-Wiki-Änderungen durch eine parallele Hygiene-Session), bleibt sie aus.
- **Surface-Form-Treue erhalten.** Override-JSONs werden NICHT umgeschrieben, um Surface-Forms auf canonical Begriffe zu kollabieren. Der Resolver liest Surface-Forms und mappt sie via direct/alias auf canonical IDs — Override-Files bleiben Authority im Surface-Layer. Einzige Ausnahme: bestätigte Loop-LLM-Catalog-Typos (analog 074-impl: 13 unbekannte facetIds gestrippt), die `apply-override.ts` sonst hart faillen lassen würden. Solche Strips werden im Phase-Report enumeriert.
- **Determinismus.** Jede Phase muss reproducerbar sein. Dossier-Aggregation, JSON-Validierung, Re-Apply sind deterministische Operationen; CC fügt keine reine-LLM-Generierungs-Inputs ein, deren Output bei Re-Run abweicht.
- **`needs-decision`-Stop ist erlaubt und ehrenhaft.** Wenn eine Phase eine architektonische Frage nicht ohne Maintainer-Input klären kann, schreibt sie einen `## Needs decision`-Block in den Phase-Report (Format siehe § Acceptance) und stoppt. Driver erkennt den Marker und beendet sauber. Lieber stoppen als breit raten.
- **Keine over-broad Alias-Mappings.** Faustregel: ein Alias-Eintrag in `*-aliases.json` ist nur dann legitim, wenn (a) die Surface-Form im Loop-Log / in den Override-Files ≥ 1× konkret auftaucht, (b) die Ziel-Canonical-ID lore-eindeutig ist, (c) keine Disambiguation-Falle anderer Achsen besteht (z. B. Surface-Form taucht als Faction UND als Location auf). Lieber Long-Tail unresolved lassen als falsche Canonical-Kanten schreiben.
- **Faction-Hierarchie respektiert `scripts/seed-data/faction-policy.json`.** Browse-Roots werden nicht ad-hoc erweitert; wenn eine neue Faction Browse-Root-Status verdient (Cowork-Tendenz für diese Welle: keine — die fünf Cluster passen alle unter existierende Browse-Roots `imperium`, `chaos`, `xenos`, `eldar`, `necrons`, `adeptus_astartes`, `heretic_astartes`, `astra_militarum`, `sisters_of_battle`, `inquisition`, `officio_assassinorum`, `mechanicus`, `imperial_knights`, `adeptus_titanicus`, `imperium`-Grand-Alignment-Exception), gibt die Factions-Phase eine Empfehlung statt selbst zu promoten und das löst einen `needs-decision`-Stop aus.
- **Character- und Location-Promotionen nur bei ausreichender Evidenz.** Default-Schwelle wie in 072 / 074: freq ≥ 2 strict + eine Cowork-/CC-kuratierte Liste lore-iconischer freq=1-Promotionen aus den Override-Files / Loop-Log / bekannter source-backed Notes. Bei Identitäts-Unsicherheit (siehe die fünf cross-batch-Calls) → `needs-decision`, nicht erraten.
- **Re-Apply-Reihenfolge: 001 → 020 sequentiell** (oder zumindest 001..015 → 016..020, da Resolver-Set-Drift-Cleanup für die ersten 150 Bücher Teil des Apply-Sweeps ist). Idempotenz durch delete-then-insert pro Junction; Re-Run wischt + schreibt komplett neu.

### Phasen-Write-Scopes (shared test file, Diff-Set-Subset)

Jede Phase-Subsession darf NUR Files in ihrem Scope berühren. Driver-Halt-Check verifiziert via `git diff --name-only "$PHASE_START" HEAD` (analog bestehendem Loop-Driver: Phase-Start-SHA gegen `HEAD`, nicht clean-worktree-Diff) **Set-Subset** der unten enumerierten Pfade (Erratum-Punkt 5: `scripts/test-resolver.ts` ist phasenübergreifend shared, sequenzielle append-only-/sectioned-Edits sind ok; daher Subset, nicht Equality). Berührung von Pfaden außerhalb des Scopes = `violation`, loud-stop.

| Phase                     | Write-Scope (allowed paths, alle relativ Repo-Root)                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0. Preflight/Dossier**  | `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md` (neu); ggf. ein Aggregator-Helper-Script unter `scripts/aggregate-surface-forms-076.ts` (NEU; analog 074-impl-Helper-Scripts).                                                                                                                                                                              |
| **1. Factions**           | `scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`, ggf. `scripts/seed-data/faction-policy.json` (nur wenn `specialCases`-Notiz, **kein** neuer Browse-Root ohne explizite Maintainer-Decision), `scripts/test-resolver.ts` (Factions-Cases, append/sectioned), **plus Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md`** (Erratum-Punkt 4 — nur bei `needs-decision`-Stop oder als kurze Done-Summary). |
| **2. Locations**          | `scripts/seed-data/locations.json`, `scripts/seed-data/location-aliases.json`, ggf. `scripts/seed-data/sectors.json` (nur falls eine neue Location einen existierenden Sector-FK braucht), `scripts/test-resolver.ts` (Locations-Cases, append/sectioned), **plus Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md`**. |
| **3. Characters**         | `scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`, `scripts/test-resolver.ts` (Characters-Cases, append/sectioned), **plus Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md`**. |
| **4. Integration**        | `scripts/seed-resolver-extensions.ts` (Erweiterung der Insert-Liste), `scripts/apply-override-dry.ts` / `scripts/test-resolver-coverage.ts` / `scripts/test-resolver-data-integrity.ts` (Batch-Range auf 001..020 erweitern, neue Smoke-Slugs), `scripts/seed-data/collection-gaps.json` (Erratum-Punkt 3 — Erweiterung am 074-Green-Tide-Pattern, falls neue unvollständige Omnibi entdeckt werden), ggf. zusätzliche Helper-Scripts unter `scripts/*-076.ts`, **plus `scripts/run-resolver-pass.sh` (Erratum-Punkt 1 — oder gleichwertig benannte `.sh`-Driver-Datei nach Implementer-Konvention; nur falls Driver wirklich gebaut wird, sonst nicht im Diff) plus ggf. `scripts/resolver-pass.config.json` (Phase-Config, optional, nur falls extern statt im Driver hartcodiert)**, plus `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` als finaler Report, plus `sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md` Status-Update auf `implemented`, plus ggf. `scripts/seed-data/manual-overrides-ssot-w40k-NNN.json`-facetId-Strips (nur falls Loop-LLM-Catalog-Typos den Apply blockieren, analog 074-impl-Pattern). |
| **5. Public-Synopsis-Discipline** (Mini-Phase) | `sessions/2026-05-11-061-arch-ssot-loop.md` (neuer Constraint-Block ab `ssot-w40k-021`), **optional** `scripts/run-ssot-loop.sh` (nur Trigger-String-Append für Disziplin-Hinweis; **kein** anderer Loop-Driver-Refactor — Erratum-Punkt 2). Darf in derselben Subsession wie Phase 4 mitlaufen oder als eigene Subsession; in beiden Fällen ist der Write-Scope strikt auf diese zwei Pfade begrenzt. |

**Bewusst NICHT erlaubt in irgendeiner Phase:** Pipeline-Files (`src/lib/ingestion/**`), App-Routen (`src/app/**`), UI-Komponenten, `src/db/schema.ts`, neue Migrationen unter `src/db/migrations/`, Brain-Wiki-Pages (`brain/wiki/**` — Cowork pflegt das in einer eigenen Wiki-Hygiene-Session nach Merge), `scripts/seed-data/book-roster.json`, `scripts/seed-data/source/*` (Excel-SSOT), bereits committed gewesene Loop-Log-Blöcke (`sessions/ssot-loop-log.md` — append-only-für-Loop, dieser Brief schreibt dort NICHT rein).

**Erlaubte `sessions/`-Touches in dieser Session** (Erratum-Punkt 8): (a) Phase 0 → Dossier `sessions/resolver-dossiers/…-dossier.md`. (b) Phasen 1/2/3 → Per-Phase-Statusdatei `sessions/resolver-dossiers/…-phase-{N}-report.md` jeweils in der Phase selbst (Done-Summary, oder bei `needs-decision`-Stop ein Decision-Block). (c) Phase 4 → finaler impl-Report `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` + Status-Update dieses arch-Briefs auf `implemented`. (d) Mini-Phase 5 → Edit an `sessions/2026-05-11-061-arch-ssot-loop.md`. Sonst kein `sessions/`-Touch.

### Phase 0 — Preflight / Dossier

**Goal:** Erstelle ein deterministisches, repo-committetes Resolver-Dossier, das alle drei nachfolgenden Achs-Phasen lesen, ohne dass sie selbst die 50 Override-Files + den ganzen Loop-Log-Stack lesen müssen. Das Dossier ist die einzige Cross-Axis-Kontext-Quelle.

**Dossier-Pfad:** `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md` (Verzeichnis neu anlegen falls nicht existent — der Pfad ist eine Cowork-Convention: pro Resolver-Pass ein Dossier, datierbar, in `sessions/` damit die normale Session-Archivierung greift).

**Pflichtinhalt des Dossiers** (Phase 0 darf weitere Sektionen hinzufügen, diese sind required):

1. **Scope-Header.** Welle: `ssot-w40k-016..020`, IDs: `W40K-0151..W40K-0200`, kumulativ 200 / 200 zur Resolver-Pause-Grenze.
2. **Buch-Tabelle.** 50 Zeilen, eine pro Buch: `externalBookId`, `slug`, `title`, `format` (aus dem Override-JSON), Loop-Batch (`ssot-w40k-NNN`). Tabelle ist Pflicht; CC darf zusätzliche Spalten (author, year) ergänzen wenn das die Triage erleichtert.
3. **Surface-Form-Aggregat pro Achse.** Drei Sub-Sektionen:
   - **Factions:** Tabelle mit Spalten `surface-form | freq | beispiel-bücher (max 3 IDs) | status (direct / alias / unresolved) | cluster-tag`. `cluster-tag` ist ein freier Marker (z. B. `necromunda-modern`, `last-chancers`, `soul-drinkers`, `calpurnia`, `gothic-war`), den CC aus dem Loop-Log ableitet.
   - **Locations:** gleiche Spalten.
   - **Characters:** gleiche Spalten.
   Sortierung: primär `freq desc`, sekundär `surface-form asc`. Status-Spalte gegen den **aktuellen Resolver-Stand vor dieser Welle** (post-074, also `factions=126 / locations=132 / characters=129` Reference-Rows + post-072/074 Aliases).
4. **Cross-Axis-Warnungen.** Surface-Forms, die auf einer Achse als Faction und auf einer anderen als Location/Character auftauchen (z. B. Iyanden-Pattern aus 072). Pro Konflikt: betroffene Achsen, Buch-IDs, Cowork-/CC-Empfehlung.
5. **Cross-batch alias-consolidation-Cases.** Die fünf in § Context enumerierten Cases als eigene Sub-Sektion, jede mit: betroffene Surface-Forms, beteiligte Buch-IDs, Cowork-Empfehlung aus diesem Brief, plus eine `Decision needed:`-Zeile pro Case (oder eine `Cowork-default akzeptiert`-Zeile, wenn CC keine Abweichung sieht). **Wenn CC bei einem der fünf Cases unsicher ist, wird der Case als `needs-decision`-Kandidat im Dossier markiert** — die jeweilige Achs-Phase eskaliert dann explizit zu `needs-decision`-Stop.
6. **Omnibus-/Anthology-/Format-Konflikte.** Aus den Override-Files: alle `data_conflict`-Flags zum Format (z. B. die drei ssot-w40k-018-Novella-Misses), alle Omnibus-Aggregations-Cases (z. B. *Last Chancers Omnibus* / *Gothic War Omnibus* / *Soul Drinkers Omnibus* / *Annihilation Second Omnibus*), plus `roster.collections`-Coverage (welche Omnibi haben Constituents im Roster, welche nicht — analog Green-Tide-Pattern aus 074).
7. **Kandidaten für `needs-decision`.** Eine konsolidierte Liste der Architektur-Fragen, die in keiner Achs-Phase ohne Maintainer-Input entscheidbar sind. Cowork-Erwartung: 0–3 Cases, hauptsächlich aus den fünf cross-batch-Aliasing-Calls.

**Phase-0-Output ist NUR das Dossier-Markdown plus ggf. ein Aggregator-Helper-Script.** Keine Reference-Daten-Änderungen, kein DB-Touch, keine Override-File-Edits. Phase 0 committed das Dossier (commit 1 dieses Briefs), pusht es, übergibt an Phase 1.

### Phase 1 — Factions only

**Goal:** Erweitere `factions.json` / `faction-aliases.json` (und ggf. `faction-policy.json`-Notizen) um die in der vierten Welle belastbar häufigen Faction-Surface-Forms, basierend ausschließlich auf dem Phase-0-Dossier.

**Inputs:** Phase-0-Dossier, aktueller Faction-Stand (`factions.json`, `faction-aliases.json`, `faction-policy.json`).

**Architektonische Vorsicht-Punkte für Phase 1:**

- **Organisation vs. Faction.** Cluster wie Necromunda-Houses sind Factions; einzelne Bands / Crews / individuelle Gangs sind keine eigenen Factions, sondern bleiben Surface-Form im Override (analog 072's „named-regiment-tier nicht zu granular" + 074's „Blood Axes / Evil Sunz / Gretchin nicht aufgenommen"). Konkret für diese Welle: Houses (Cawdor / Escher / Goliath / Orlock / Helmawr / Delaque / Van Saar / Ko'iron / Ulanti) als Sub-Factions unter einem `necromunda`-Knoten oder direkt unter `imperium` — **CC's Call**, im Phase-Report begründen oder `needs-decision` setzen, wenn der parent-Knoten unklar ist.
- **Sub-Faction-Granularität.** Adeptus Arbites als primary-faction landet jetzt erstmals; muss canonical row als `adeptus_arbites` (oder gleichwertig snake-case-Form) angelegt werden. Nicht in `imperium` aufgehen, weil Calpurnia primärer Resolver-Trigger ist (zwei Bücher in 020, parent surface form für Arbites in beiden). Eine Row reicht, kein Hydraphur-spezifischer Sub-Tier.
- **Last Chancers** als Sub-Faction unter `astra_militarum`, alignment=`imperium` explizit (Inferenz-Trap-Note gilt weiter).
- **Soul Drinkers Firstborn vs. Primaris.** Default: eine Row `soul_drinkers`, Continuity-Marker entweder im `tone`-Feld (Single-Token-Konvention, Schema-konform — siehe Erratum-Punkt 6) oder ganz weglassen und nur im Phase-1-Report dokumentieren. Wenn Phase 0 das als `needs-decision` markiert hat, **stoppt Phase 1 mit `needs-decision`-Block**, nicht entscheiden im Alleingang.
- **Faction-Hierarchie & alignment-Backfill.** Wie in 072 / 074: jede neue Sub-Faction unter einem parent, der nicht direkt `imperium`/`chaos`/`xenos`/`neutral` ist, trägt explizit `"alignment"`-Feld.
- **Idempotenz.** Phase 1 prüft, ob eine Faction schon existiert (post-074: 126 rows), und legt KEINE Duplikate an. Bestehende Rows werden nicht umbenannt; falls eine bestehende Row eine `tone`-Anpassung verdient (z. B. Soul-Drinkers-Reboot-Marker — `factions` hat `tone` + `glyph`, kein `notes`, siehe Erratum-Punkt 6), läuft das über den `seed-resolver-extensions.ts`-Upsert-Pfad (post-070 Upsert auf JSON-Spalten), nicht durch JSON-Hand-Edit.

**Phase-1-Output:** Diffs nur in den oben genannten Pfaden. `npm run test:resolver` neue Cases ≥ 5 für die Welle (Direct-Match + Alias-Match-Coverage). Phase 1 committed Daten + Tests + **Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md`** (Erratum-Punkt 8 — kurze Done-Summary inkl. der Phase-spezifischen Decisions wie Necromunda-House-Parent-Wahl und Soul-Drinkers-Reboot-Marker, oder bei `needs-decision`-Stop der Decision-Block in dieser Datei). Der finale konsolidierte impl-Report `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` wird erst in Phase 4 geschrieben und referenziert die drei Per-Phase-Statusdateien.

### Phase 2 — Locations only

**Goal:** Erweitere `locations.json` / `location-aliases.json` analog, basierend auf dem Phase-0-Dossier.

**Architektonische Vorsicht-Punkte für Phase 2:**

- **Necromunda-Geographie.** Hive Primus / Underhive / Hope's End / Floodgrave / Dim Zone / Fallen Dome of Periculus / The Spire — Sub-Locations unter `necromunda` (existiert post-072: `necromunda` als `locations.json`-Row). Hive Trazior existiert schon (072). Cowork-Tendenz: für die Underhive-Granular-Lokationen einzelne Rows, aber keinen `underhive`-Browse-Root (es ist eine Region-Bezeichnung, kein Sector).
- **Named Vehicles.** Lord Solar Macharius (Cruiser, Gothic War), Planet Killer (Chaos Super-Weapon, Gothic War), Brokenback (Soul Drinkers' Chaos-Cruiser-Hulk) — folgen dem 072-Muster: `tags: ['vessel']`, `gx: null`, `gy: null`. Nur die in mindestens 2 Büchern recurring Vessels promoten (Brokenback ≥ 2 in Soul Drinkers, Lord Solar Macharius in Gothic War duology, Planet Killer in Gothic War duology — alle qualifizieren). Vessels-Surface-Forms unter freq=1 bleiben in `book_details.notes`.
- **Star-Forts & andere One-of-a-kinds.** Die Phalanx (Imperial-Fists-Star-Fort) ist eine eindeutige Location, kein Vessel — Cowork-Tendenz: eigene Row `the_phalanx` (mit oder ohne führendem `the_` ist CC's Call), `tags: []`, sector=null.
- **Hydraphur als Fortress-System.** Sector-Hint: `hydraphur` sector existiert ggf. nicht in `sectors.json`. Wenn ein Sector-FK gebraucht wird, prüft Phase 2 zuerst, ob ein passender Eintrag existiert; wenn nein, kann sie einen Sector hinzufügen (Write-Scope erlaubt) oder `sector: null` setzen und im Phase-Report flaggen.
- **Frame-Locations.** Wo eine Surface-Form ein era_frame ist (Cicatrix Maledictum / Indomitus-Crusade-Range etc.), `tags: ['era_frame']` analog 072.
- **Idempotenz.** Wie Phase 1: Duplikate vermeiden (post-074: 132 rows), bestehende Rows nicht umbenennen. Tag-Updates auf bestehenden Rows laufen über den `seed-resolver-extensions.ts`-Update-Sonderfall (analog `great_rift`-Pattern in 072) oder werden als `needs-decision` markiert, wenn der Update-Pfad zu invasiv wird.

**Phase-2-Output:** Diffs nur in den oben genannten Pfaden. `npm run test:resolver` neue Cases ≥ 4 für die Welle. Phase 2 committed Daten + Tests + **Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md`** (kurze Done-Summary inkl. Phase-spezifischer Decisions, oder bei `needs-decision`-Stop der Decision-Block in dieser Datei). Der finale konsolidierte impl-Report `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` wird erst in Phase 4 geschrieben und referenziert die drei Per-Phase-Statusdateien.

### Phase 3 — Characters only

**Goal:** Erweitere `characters.json` / `character-aliases.json` analog, basierend auf dem Phase-0-Dossier — mit besonderer Vorsicht für die fünf cross-batch alias-consolidation-Cases.

**Architektonische Vorsicht-Punkte für Phase 3:**

- **Alias-Consolidation-Cases.** Die fünf Cases aus § Context werden hier entschieden — Phase 0 hat sie bereits in der Dossier-Sektion 5 vor-strukturiert. Cowork-Defaults:
  1. Mad Donna / D'onne Ulanti → **eine Row** (`d_onne_ulanti` oder `mad_donna` als canonical ID — CC's Call), beide Surface-Forms als Aliase.
  2. Kal Jerico classic vs. modern → **eine Row** (`kal_jerico`), Multi-Era-Alias-Pattern. **Wenn Phase-3-Subsession unsicher ist** (z. B. nach Lore-Recherche im Loop-Log Modern-Imprint-Kal-Jerico wirkt wie ein expliziter Re-Cast), → `needs-decision`-Stop.
  3. Lord Helmawr classic (Gerontius, †) vs. modern → **zwei Rows** (`gerontius_helmawr` für classic, `lord_helmawr` als generic-modern oder ggf. zweiter Eigenname, wenn der modern-imprint einen Namen führt — Loop-Log ist hier ggf. dünn, ggf. `needs-decision`).
  4. Lieutenant Kage / the Burned Man → **eine Row** (`lieutenant_kage` oder `kage`), beide Surface-Forms als Aliase.
  5. Soul Drinkers Firstborn vs. Primaris → **keine Character-Frage, das ist eine Faction-Frage (Phase 1)**.
- **`primaryFactionId` für die neuen Characters.** Direkt nach Phase-1-Faction-Set; wenn eine Character-Promotion `primaryFactionId` auf eine in dieser Welle erst angelegte Faction setzt, ist Phase-1-Output Pflicht-Pre-Condition. Driver muss Phase 1 strikt vor Phase 3 laufen lassen, sonst FK-Trap.
- **Lore-iconic freq=1.** Analog 072 / 074: eine Cowork-/CC-kuratierte Liste, im Phase-Report begründen welche promoted wurden und welche nicht. Default-Schwelle: freq ≥ 2 strict + lore-iconic-Promotionen. Für diese Welle erwartet Cowork: Sarpedon, Daenyathos, Iktinos, Tellos, Shira Calpurnia, Lord Medell, Schaeffer, Lieutenant Kage, Captain Leoten Sempter, Kal Jerico, Mad Donna, Caleb Cursebound, Iktomi, Lord Helmawr (modern), Lord Gerontius Helmawr (classic — wenn als distinkt geführt), plus 4–8 freq=1-Iconics. CC's Endergebnis-Liste kann abweichen.
- **`historical_canon_layer`-Markierung.** Analog 074: Surface-Forms aus dem 2001-2008-Black-Library-Layer (Watson-Trilogy-Pattern in 074; in dieser Welle die Necromunda-classic-imprint-Cluster + Last Chancers original-Trilogy + Soul Drinkers original-Sextet + Gothic War duology + Calpurnia-opener) sind **nicht** automatisch historical-canon-layer — das war ein 074-Spezifikum für die explizit pre-Codex-Black-Library-Lore (Watson 1990-1995). Für diese Welle: Cowork-Tendenz **keine `historical_canon_layer`-Markierungen** für die early-2000s-Cluster, weil sie publication-era post-Codex sind und ihre Surface-Forms weiterhin in der modernen Lore-Sprache leben. CC darf einzelne Cases als historical-canon-layer markieren, wenn er das stark argumentieren kann — sonst weglassen, lieber knapp.
- **Idempotenz.** Wie Phase 1 / 2: Duplikate vermeiden (post-074: 129 rows), bestehende Rows nicht umbenennen. Cawl ist post-074 schon angelegt; Sarpedon / andere Soul-Drinkers-Iconics sind post-074 wahrscheinlich noch NICHT angelegt — Phase 3 prüft, legt neu an, prüft Idempotenz pro Row.

**Phase-3-Output:** Diffs nur in den oben genannten Pfaden. `npm run test:resolver` neue Cases ≥ 5 für die Welle, davon mindestens 2 für Alias-Consolidation-Cases (Mad-Donna-Aliase + Kage-Burned-Man-Aliase als Minimum). Phase 3 committed Daten + Tests + **Per-Phase-Statusdatei `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md`** (kurze Done-Summary inkl. der fünf cross-batch alias-consolidation-Decisions, oder bei `needs-decision`-Stop der Decision-Block in dieser Datei). Der finale konsolidierte impl-Report `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md` wird erst in Phase 4 geschrieben und referenziert die drei Per-Phase-Statusdateien.

### Phase 4 — Integration / Tests / Re-Apply / Counts / Smoke / Report

**Goal:** Sammle die Outputs der Phasen 1–3, weite die Resolver-Test-Trias auf 001..020 aus, führe den DB-Re-Apply gemäß `docs/resolver-apply-runbook.md`, dokumentiere Counts vor/nachher und smoke 6–8 Detail-Pages.

**Operative Schritte:**

1. **Aggregator-Stand.** Phase 4 startet mit den Phasen-1-/2-/3-Commits auf dem aktuellen Branch (Maintainer hat die Phasen-1-/2-/3-Subsessions sequenziell als getrennte `claude -p` / `codex`-Aufrufe gefahren — Erratum-Punkt 7: dieser Pass läuft manuell, der Driver entsteht erst in Phase 4 als Deliverable für Pass 5+). Phase 4 verifiziert `git log` und `git diff main...HEAD --name-only`, dass alle Touches in den erlaubten Phase-Write-Scopes liegen.
2. **`scripts/seed-resolver-extensions.ts` erweitern.** Alle in Phasen 1–3 angelegten neuen Factions / Locations / Characters in die Insert-/Upsert-Liste aufnehmen, analog dem 072 / 074-Pattern. Faction-Inserts als Upsert (post-070), Location-/Character-Inserts als `ON CONFLICT DO NOTHING` (außer expliziten Tag-Updates auf bestehenden Rows, falls Phase 2 das vorgesehen hat).
3. **Resolver-Test-Trias auf 001..020.** `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts` — Batch-Range erweitern (analog 074-impl: hartcodiert oder via CLI-Flag). Neue Smoke-Slugs in die Coverage- und Data-Integrity-Skripte einbauen (siehe Smoke-Liste unten).
4. **Verifikations-Pipeline.** Reihenfolge wie in `docs/resolver-apply-runbook.md`, aber Batch-Range 001..020:
   - `npm run test:resolver`
   - `npm run test:resolver-data`
   - `npm run test:resolver-coverage`
   - `npm run test:apply-override-dry`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run brain:lint -- --no-write`
5. **Pre-Apply Parent-Hygiene-Check.** Wie im Runbook (`docs/resolver-apply-runbook.md` § Pre-Apply Parent-Hygiene-Check): `factions.json` gegen `faction-policy.json` diffen, neue Rows auf parent / Browse-Root-Konsistenz prüfen, ggf. `seed-resolver-extensions` re-runnen.
6. **DB-Apply.**
   ```bash
   npm run db:seed-resolver-extensions
   npm run db:apply-override -- --batch=ssot-w40k-001
   …
   npm run db:apply-override -- --batch=ssot-w40k-020
   ```
   (20 Re-Apply-Calls sequenziell. Re-Apply für 001..015 ist Resolver-Set-Drift-Cleanup, Apply für 016..020 ist First-Time-Apply gegen das neue Resolver-Set.)
7. **Counts vor/nachher.** Pflicht-Tabelle im Phase-4-Report:

   | Phase                          | `work_factions` | `work_locations` | `work_characters` | `work_collections` |
   | ------------------------------ | --------------- | ---------------- | ----------------- | ------------------ |
   | Pre-Apply (post-074-Baseline)  | 912             | 287              | 522               | 35                 |
   | Per-Batch 016                  | …               | …                | …                 | …                  |
   | Per-Batch 017                  | …               | …                | …                 | …                  |
   | Per-Batch 018                  | …               | …                | …                 | …                  |
   | Per-Batch 019                  | …               | …                | …                 | …                  |
   | Per-Batch 020                  | …               | …                | …                 | …                  |
   | Post-Re-Apply 001..020 (total) | …               | …                | …                 | …                  |

   Plus Reference-Counts (`factions=` / `locations=` / `characters=` Rows), Coverage-Tabelle (analog 074: `912 / 1003 input = 90.9 %` und vergleichbare Zahlen für die neue Welle).

8. **Smoke-Slugs.** Mindestens 8 Slugs, gemischt aus alten und neuen Wellen, mit Junction-Counts (`f/l/c/in-coll`):
   - `the-anarch` (W40K-0094) — Regression-Check (sollte unverändert bleiben gegen 074-Counts 9/3/11).
   - `inquisitor-draco` (W40K-0148) — Regression-Check Watson-Trilogy (074-Counts 11/0/4).
   - `the-green-tide` (W40K-0147) — Regression-Check Collection-Gap (074-Counts 6/1/0/0).
   - `crossfire` (W40K-0199) — neu, erste Calpurnia / Adeptus-Arbites-Primary-Faction-Smoke.
   - `phalanx` (W40K-0196) — neu, Soul-Drinkers-Series-Finale, multi-faction Trial-Scene.
   - `lasgun-wedding` (W40K-0170) — neu, Necromunda classic-imprint, Mad-Donna-/Lord-Helmawr-classic Surface-Forms.
   - `wanted-dead` (W40K-0171, oder der Slug aus dem Override-File; CC wählt den ersten Necromunda-modern-imprint Slug) — neu, Necromunda modern-imprint, modern-Lord-Helmawr-/Caleb-Cursebound-Surface-Forms.
   - `armageddon-saint` (W40K-0185) — neu, Last Chancers / Burned-Man-Kage-Alias-Smoke.
   - `13th-legion` (W40K-0181, falls Slug das ist) — neu, Last Chancers original-Trilogy-Opener.

   CC darf die Slug-Liste anpassen / erweitern (z. B. wenn der canonical Slug für *Lasgun Wedding* anders heißt), im Phase-4-Report dokumentieren.

9. **Audit-Cockpit-Tour.** SQL-Replica der vier `/buecher?audit=…`-Pillen (`drift` / `gap` / `ssot` / `collections`) gegen die DB, analog 074-impl-Pattern, jeweils für `W40K-0001..0150` und `W40K-0151..0200`. Numbers im Report. Erwartet sind sichtbare Drift-Werte für die neuen 50 (Surface-Form-vs-canonical-Drift nach Resolver-Crystallization).

10. **`work_collections`-Spotcheck** gegen mindestens einen Omnibus aus der Welle, der echte Roster-Constituents hat (z. B. *The Last Chancers Omnibus* W40K-0184 → W40K-0181/0182/0183 falls Roster sie verlinkt; *The Gothic War Omnibus* W40K-0188; *The Soul Drinkers Omnibus* W40K-0192; *Soul Drinkers: Annihilation Second Omnibus* W40K-0197). Pre-Apply prüft CC, ob `roster.collections` Rows für diese Omnibi existieren — wenn ja, Apply liefert die `work_collections`-Junctions; wenn nein, Eintrag in `scripts/seed-data/collection-gaps.json` (analog Green-Tide-Pattern aus 074) statt partieller Junctions.

11. **Phase-4-Report.** Wie 072-impl / 074-impl: Summary, What I did (pro Phase 1–4 ein Sub-Abschnitt mit den jeweiligen Commits), Decisions I made (insbesondere die fünf cross-batch alias-Calls), Verification (Counts, Coverage, Smoke, Cockpit-Tour, CLI-Checks), Open issues / blockers, For next session, References. Pro Phase ein Commit-Hash im Frontmatter.

### Driver / Loop-Anforderung

**Wichtig (Erratum-Punkt 7):** Der Driver orchestriert **nicht** diesen Pass. Pass 4 läuft manuell als 5 sequenzielle `claude -p` / `codex`-Subsessions (Phase 0 → 1 → 2 → 3 → 4, jeweils mit `/clear` dazwischen — Vorlage in § Beispiel-Maintainer-Workflow). Der Driver, der hier gebaut oder als Spec geliefert wird, ist **Deliverable für Pass 5+** und wird im nächsten Resolver-Pass (vermutlich nach `ssot-w40k-021..025`) erstmals als Orchestrator eingesetzt.

**Cowork-Präferenz: Resolver-Driver wirklich bauen** (statt nur als Spec liefern), damit Pass 5+ direkt mit ihm startet. Analog `scripts/run-ssot-loop.sh`: ein neuer Single-File-Bash-Wrapper `scripts/run-resolver-pass.sh` (oder gleichwertig benannt — Implementer's Call), der für **künftige** Pässe die Phasen 0–4 als getrennte `claude -p`-Subsessions (oder `codex`-Äquivalent — siehe Open Question unten) startet, jede mit einem phase-spezifischen Trigger + phase-spezifischen `--allowedTools` + `--permission-mode acceptEdits` (analog Loop-Driver). Er wird in Phase 4 dieses Passes **geschrieben und committed**, aber nicht in diesem Pass ausgeführt.

**Wenn der Driver für diesen Pass zu groß ist** (Cowork-Toleranz, nicht Erwartung): Implementer liefert in Phase 4 stattdessen eine **konkrete Driver-Spezifikation** in der Form, dass ein direkt folgender Tooling-Brief ihn schreiben kann. In diesem Fall:
- Phase 4 enthält keinen `scripts/run-resolver-pass.sh`-Diff, dafür aber eine vollständige Driver-Spec im impl-Report.
- Im Phase-4-Report (impl-Report) liefert CC dann: gewünschtes CLI (`bash scripts/run-resolver-pass.sh [<options>]`), Phasen-Definition (config-array), Halt-Check-Matrix pro Phase, Trigger-String-Templates pro Phase, `needs-decision`-Detection-Heuristik, PR-/Push-Verhalten. Genug, dass ein direkter Folge-Brief den Driver implementieren lässt.

**Wenn der Driver gebaut wird, soll er:**

- Phasen nacheinander starten (strikt sequenziell, keine Parallelität).
- Pro Phase eine **frische** `claude -p` / `codex`-Subsession verwenden (eigenes Context-Fenster).
- Pro Phase einen **phase-spezifischen Trigger** setzen, der (a) den Pfad zu diesem Brief enthält, (b) den Pfad zum Phase-0-Dossier (außer in Phase 0 selbst), (c) den Phase-Namen + Write-Scope + Acceptance-Bullets der Phase enthält.
- Pro Phase eine **phase-spezifische Allowlist** an Pfaden setzen — Driver speichert vor dem Subsession-Start einen Phase-Start-SHA und verifiziert nach Phase-Ende, dass `git diff --name-only "$PHASE_START" HEAD` ein Set-Subset dieser Liste ist (nicht clean-worktree-Diff; Set-Subset statt Set-Equality, weil eine Phase legitime keine Tests berühren kann wenn keine neuen Direct-Match-Cases entstehen).
- **Halt-Checks pro Phase:**
  1. `claude -p`-Subsession Exit-Status == 0.
  2. Worktree clean nach der Phase (CC hat alles committed, kein dangling Staging).
  3. HEAD ist gegenüber Phase-Anfang vorgerückt (CC hat mindestens einen Commit gemacht) **oder** der Phase-Report enthält explizit „no-op: nothing to add" (Cowork-Tendenz: jede Phase produziert mindestens einen Commit, auch wenn nur ein Test-Case oder eine Alias-Erweiterung).
  4. Geänderte Pfade ⊆ Phase-Write-Scope. Verstoß = `violation`, loud-stop, kein Übergang zur nächsten Phase.
  5. Alle in der Phase berührten JSON-Files (`*.json` Diffs) sind JSON-valid (`node --check` oder `node -e 'JSON.parse(fs.readFileSync(...))'`).
  6. `## Needs decision` im Phase-Report → `needs_decision`-Stop, sauberer Driver-Exit ohne Phase 4.
- Bei `violation` oder `claude -p`-Non-Zero-Exit: loud-stop, kein Push, kein PR, klare Fehlermeldung — Maintainer-Inspektion.
- Bei `needs_decision`-Stop: Phasen bis zur Halt-Phase werden gepusht, PR wird ggf. eröffnet mit Titel-Suffix `(needs-decision)`, Final-Summary listet die offene Decision auf. Cowork schreibt dann einen kleinen `arch-resolver-pass-4-decision-followup.md`-Brief, der die offene Frage klärt; CC läuft die übrigen Phasen in einer Folge-Session.
- Am Ende (alle Phasen sauber durch): `git push -u origin <branch>` + `gh pr create --base main --fill --title …` (analog Loop-Driver, idempotent über `gh pr view --head`).
- Single-File, dokumentierter Header (Usage, Voraussetzungen, Exit-Codes, Phasen-Liste).
- **Keine** `--dangerously-skip-permissions`-Verwendung.

**Per-Iteration-Timeout, Cost-Cap, parallele Phasen, Workflow-Doku in `brain/wiki/workflows/`: alles out of scope.** Wenn der Driver sich nach 2–3 Resolver-Pässen bewährt hat, kann eine spätere Hygiene-Session eine Workflow-Page schreiben. Für diesen Brief reicht der Skript-interne Header.

## Out of scope

- **Rewrite der bestehenden Synopsen 1-200.** Existierende `overrides.synopsis`-Texte bleiben unangetastet. Public-Synopsis-Rewrite-Pass ist eine eigene spätere Session.
- **UI-Rating-Render / Public-Page-Design.** `bookDetails.rating` auf `/buch/[slug]` rendern bleibt für einen eigenen Brief (Hand-off aus 075-impl).
- **Hardcover-Hit-Rate-Härtung (Titel-Normalisierung).** Neue OQ (10) aus 075-impl, eigener Brief.
- **Collection-Gap-Resolve außer wenn ein harter Resolver-Blocker auftaucht.** Phase 4 darf `collection-gaps.json` für die in dieser Welle entdeckten unvollständigen Omnibi erweitern (analog Green-Tide-Pattern aus 074), aber **nicht** den Maintainer-Excel-Workflow auslösen oder Roster-Modifikationen vornehmen.
- **V2-LLM-Pipeline-Reaktivierung.** Pipeline-Stage `src/lib/ingestion/v2/llm/` bleibt unangetastet. ADR [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md) bleibt gültig.
- **Große Schemaänderungen.** Keine neue Migration, keine Felder, keine Tabellen. `src/db/schema.ts` ist nicht in einem Write-Scope.
- **Manuelles Kuratieren aller 50 Bücher im Architect-Brief selbst.** Cowork hat in diesem Brief **bewusst nicht** die 50 Bücher × 3 Achsen × N Surface-Forms enumeriert (anders als 072 / 074). Das Surface-Form-Aggregat ist Phase-0-Output, nicht Architect-Input — das ist genau der Sinn des axis-sliced Workflows.
- **Brain-Wiki-Updates (`brain/wiki/**`).** Cowork pflegt das in einer eigenen Wiki-Hygiene-Session nach Merge (analog Post-074-Pattern). Keine Phase berührt `brain/`.
- **`sessions/README.md` Active-Threads-Tabelle pflegen.** Cowork-Aufgabe nach Merge.
- **Loop-Driver-Skript strukturell refactoren.** `scripts/run-ssot-loop.sh` bleibt strukturell unangetastet; der Resolver-Driver ist ein eigenes Tool. **Einzige erlaubte Berührung** ist der optionale Trigger-String-Append der Public-Synopsis-Discipline aus Mini-Phase 5 (Erratum-Punkt 2) — sonst kein Edit.

## Public Synopsis Discipline (Zusatz-Track ab `ssot-w40k-021`)

**Goal des Zusatz-Tracks:** Brief 061 (Standing-Loop) wird so erweitert, dass **ab `ssot-w40k-021` / `W40K-0201`** `overrides.synopsis` ausschließlich **public-reader-copy** ist, kein internes Curation-Material. Existierende 001..020-Synopsen bleiben unangetastet (Out-of-Scope siehe oben); die Disziplin greift nur für **neu produzierte** Override-Files.

**Mini-Phase 5 in dieser Session** (kann in Phase 4 mit-committed werden oder als 6. Sub-Phase fahren — Implementer entscheidet, beide Varianten sind in den Write-Scopes erfasst):

- **`sessions/2026-05-11-061-arch-ssot-loop.md` editieren** — neuer Block unter `## Constraints` mit dem Titel „Public Synopsis Discipline (ab `ssot-w40k-021`)":
  - Synopsen schreiben sich **für Leser der Public-Page** `/buch/[slug]`. Plot-/Premise-orientiert, kurz, lesbar.
  - **Verboten** in `overrides.synopsis`:
    - SSOT-IDs (`W40K-NNNN`, `HH-NNNN`)
    - Brief-Verweise (`Brief 061`, `Resolver-Pass`)
    - Authority-Layer-Sprache (`authority layer`, `cumulative=`, `loop-iteration`)
    - Resolver-/Workflow-Hinweise (`Resolver-Pass`, `resolver class`, `surface form`, `canonical entity`)
    - Interne Curation-Kommentare (`data_conflict`, `low_confidence` etc.)
    - Markdown-Fußnoten-/Audit-Stil (`See note:`, `[ref]`, Footnote-Reference-Style)
  - **Technische Curation-Infos** gehören künftig in:
    - `sessions/ssot-loop-log.md` (per-batch, ohnehin Loop-Log-Konvention)
    - `overrides.flags` (`data_conflict`, `low_confidence` etc., bleibt Constraint-conform)
    - `book_details.notes` (per-book, if applicable — over- oder under-the-radar Maintainer-Notiz)
  - **NICHT** in `works.synopsis`.

- **Optional, wenn der Implementer es elegant findet: `scripts/run-ssot-loop.sh` Trigger ergänzen**, damit jede neue Subsession ab Iter `ssot-w40k-021` einen einleitenden Disziplin-Hinweis im Trigger-String bekommt — etwa eine zusätzliche Zeile im `base_trigger`-Heredoc à la „Synopsen ab ssot-w40k-021 sind public-reader-copy: kein internes Curation-Vokabular, keine SSOT-IDs, keine Brief-Verweise. Technische Notes gehen in flags / book_details.notes / ssot-loop-log.md." Cowork-Tendenz: ja, ergänzen — das macht den Trigger pflegeleichter als ein reiner Brief-061-Text-Patch. **Aber** der Trigger-String bezieht sich heute auf den Brief-061-Vertrag inkl. der Constraint-Sektion, also reicht der Brief-061-Edit allein im Strict-Sinn. CC entscheidet.

- **Aus-Scope dieser Disziplin-Erweiterung:** keine Synopsen-Rewrites der 001..020-Bücher (das ist explizit Out of scope aus Hauptbrief). Die Disziplin greift forward-only; alte Synopsen bleiben als historische Curation-Snapshots, bis ein späterer Rewrite-Pass sie aufräumt.

## Acceptance

The session is done when:

- [ ] **Phase-0-Dossier existiert** unter `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md`. Enthält die 7 Pflicht-Sektionen aus § Phase 0. Deterministisch reproducerbar via Aggregator-Helper-Script (falls geschrieben).
- [ ] **Phase 1 (Factions) abgeschlossen.** Diffs nur in `scripts/seed-data/{factions,faction-aliases,faction-policy}.json` + `scripts/test-resolver.ts` (shared, append/sectioned) + `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md` (Erratum-Punkt 4/8, verpflichtende Per-Phase-Statusdatei als Done-Summary oder `needs-decision`-Block). Mindestens 5 neue Resolver-Test-Cases. Idempotenz dokumentiert. Phase-Commit auf dem Branch.
- [ ] **Phase 2 (Locations) abgeschlossen.** Diffs nur in `scripts/seed-data/{locations,location-aliases,sectors}.json` + `scripts/test-resolver.ts` (shared, append/sectioned) + `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md` (verpflichtende Per-Phase-Statusdatei als Done-Summary oder `needs-decision`-Block). Mindestens 4 neue Resolver-Test-Cases. Phase-Commit.
- [ ] **Phase 3 (Characters) abgeschlossen.** Diffs nur in `scripts/seed-data/{characters,character-aliases}.json` + `scripts/test-resolver.ts` (shared, append/sectioned) + `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md` (verpflichtende Per-Phase-Statusdatei als Done-Summary oder `needs-decision`-Block). Mindestens 5 neue Resolver-Test-Cases, davon mindestens 2 für Cross-Batch-Alias-Consolidation. Die fünf cross-batch alias-consolidation-Cases sind entweder entschieden (mit Begründung in der Per-Phase-Statusdatei) oder als `needs-decision` gestoppt. Phase-Commit.
- [ ] **Phase 4 (Integration) abgeschlossen.**
  - `scripts/seed-resolver-extensions.ts` erweitert.
  - Resolver-Test-Trias auf 001..020 erweitert.
  - `npm run db:seed-resolver-extensions` ausgeführt + Output-Counts im Report.
  - Re-Apply 001..020 (20 Calls sequenziell) ausgeführt; Pflicht-Counts-Tabelle Pre-/Per-Batch/Post-Apply für `work_factions` / `work_locations` / `work_characters` / `work_collections` im Report. Coverage-Tabelle analog 074.
  - 8+ Smoke-Slugs mit Junction-Counts im Report (3 Regressions, 5+ neue Slugs aus 016..020).
  - Audit-Cockpit-SQL-Replica für 0001..0150 vs. 0151..0200 im Report.
  - `work_collections`-Spotcheck gegen mindestens einen Omnibus aus der Welle im Report.
  - `collection-gaps.json` ggf. erweitert um neu entdeckte unvollständige Omnibi.
  - `npm run lint` + `npm run typecheck` + `npm run brain:lint -- --no-write` + `npm run test:resolver` + `npm run test:resolver-data` + `npm run test:resolver-coverage` + `npm run test:apply-override-dry` grün.
  - **Phase-4-Report unter `sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md`** mit Pro-Phase-Summary + Counts + Decisions + Smoke-Slugs + Open Issues.
  - Status dieses Briefs auf `implemented` aktualisiert, `commits: [...]` Liste gepflegt.
- [ ] **Resolver-Driver entweder gebaut oder als detaillierte Spec im Report ausgearbeitet.** Wenn gebaut: `scripts/run-resolver-pass.sh` (oder gleichwertig benannt) existiert und ist im Phase-4-Diff (Erratum-Punkt 1), Single-File, dokumentierter Header, Halt-Check-Matrix (`git diff --name-only "$PHASE_START" HEAD`-basiertes Diff-Set-Subset, JSON-valid, Per-Phase-Statusdatei-`needs-decision`-Detection) implementiert, `--dangerously-skip-permissions` nicht verwendet, optional Smoke-Run dokumentiert. Wenn als Spec: vollständige Phasen-Definition + Halt-Check-Matrix + Trigger-String-Templates im impl-Report, ausreichend für einen direkt folgenden Tooling-Brief — `scripts/run-resolver-pass.sh` taucht in diesem Fall nicht im Diff auf.
- [ ] **Mini-Phase 5 (Public-Synopsis-Discipline ab `ssot-w40k-021`) im Brief 061 verankert.** `sessions/2026-05-11-061-arch-ssot-loop.md` enthält den neuen Constraint-Block; optional ist der `scripts/run-ssot-loop.sh`-Trigger-String um den Disziplin-Hinweis ergänzt (kein anderer Loop-Driver-Refactor; siehe Erratum-Punkt 2 + qualifizierten OOS-Eintrag).
- [ ] **`needs-decision`-Format eingehalten** (falls eine Phase stoppt): `## Needs decision` H2 in der Per-Phase-Statusdatei (`sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-{N}-report.md`; Erratum-Punkt 4) bzw. im finalen Phase-4-Report, mit Sub-Sektionen pro offene Frage (Frage + bisherige Beobachtung + Cowork-Default + Empfehlung). Driver-Final-Summary spiegelt die Decision-Liste.

## Open questions

- **CLI-Form für Resolver-Driver: `claude -p` oder `codex`?** Loop-Driver wrappt heute `claude -p`. Maintainer-Workflow hat sich inzwischen zum Teil zu `codex` verschoben (per Hand-off-Konvention „öffne ein Terminal im Projektordner und führe `claude / codex` aus"). Cowork-Tendenz: **CC's Wahl mit Begründung**. Wenn `codex` der Default-Maintainer-Workflow geworden ist, ist `codex -p` (oder Äquivalent) symmetrischer; wenn der Loop-Driver weiter `claude -p` nutzt, dann der Resolver-Driver auch — Symmetrie wiegt schwerer. CC dokumentiert die Wahl im impl-Report, idealerweise gegen die installierten CLI-Versionen geprüft.

- **Wo lebt die Phase-Definition?** Im Driver-Skript hartcodiert (Cowork-Default für die erste Iteration) oder in einer separaten Config-Datei `scripts/resolver-pass.config.json` o. ä.? CC's Wahl. Wenn die Config-Form einfacher zu pflegen ist (z. B. weil zukünftige Resolver-Pässe andere Phase-Schwerpunkte haben — z. B. ein HH-Resolver-Pass ohne Necromunda-Cluster aber mit Heresy-Era-Frame-Problemen), gerne extern.

- **Branch-Name-Konvention.** Loop-Driver erwartet, dass Maintainer einen Branch vor dem Lauf anlegt; Resolver-Driver gleichermaßen? Cowork-Vorschlag: ja, gleich. Maintainer-Konvention: `resolver/pass-4-axis-sliced` oder `session-076-resolver-batch-4-axis-sliced`. Driver verifiziert nur `current branch != main`.

- **Soul-Drinkers Primaris-vs-Firstborn:** Faction-Phase oder Report-only?** Cowork-Tendenz: eine Row, Continuity-Marker im `tone`-Feld oder ganz nur im Phase-1-Report (Schema-Fakt aus Erratum-Punkt 6: Factions haben `tone`+`glyph`, kein `notes`). Aber wenn die Soul-Drinkers-Primaris-Lore in einer späteren Welle expandiert (`Traitor by Deed`-Sequels), wird die Trennung pertinent. CC's Call jetzt, im Phase-1-Report begründen oder `needs-decision`.

- **Kal-Jerico-One-vs-Two:** wirklich eine Row? Modern-Imprint-Reynolds-Kal könnte ein reset-character sein, kein continuation. Cowork-Default: eine Row, aber Phase-3-CC darf widersprechen.

- **Necromunda-Houses unter `imperium` oder unter einem neuen `necromunda`-Mid-Knoten?** Cowork-Tendenz: unter einem neuen `necromunda`-Mid-Knoten (parallel zu `astra_militarum` / `inquisition`), weil sie strukturell eigene cluster sind, aber **NICHT** Browse-Root (kein Browse-Root-Promote in dieser Session). Wenn das in Phase 1 als architektonisch zu invasiv wirkt → `needs-decision`.

## Notes

### Beispiel-Maintainer-Workflow (illustrativ)

**Workflow für diesen Pass (manuell, weil der Driver erst in Phase 4 entsteht — Erratum-Punkt 7):**

```
git checkout main && git pull
git checkout -b resolver/pass-4-axis-sliced

# Phase 0: Dossier
claude -p "Brief sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md, Phase 0 ausführen." \
  --allowedTools "Read Write Edit Bash Glob Grep WebSearch" \
  --permission-mode acceptEdits

/clear   # frischer Kontext

# Phase 1: Factions
claude -p "Brief …076…, Phase 1 (Factions) ausführen. Dossier ist sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md." \
  --allowedTools "…" --permission-mode acceptEdits

/clear

# … analog für Phase 2 (Locations) / Phase 3 (Characters) / Phase 4 (Integration)
# Maintainer prüft nach jeder Phase: git log + git diff --name-only <phase-start-sha>...HEAD,
# bricht ab bei Scope-Verstoß oder needs-decision-Stop.
```

`codex`-Äquivalent funktioniert symmetrisch; CLI-Form-Frage ist eine offene Frage für den Implementer (siehe § Open questions).

**Future-State-Workflow für Pass 5+** (gilt, sobald Phase 4 dieses Passes den Driver geliefert hat):

```
git checkout main && git pull
git checkout -b resolver/pass-5-axis-sliced
bash scripts/run-resolver-pass.sh   # läuft 0 → 1 → 2 → 3 → 4 autonom durch
# Spot-Review der 5 Phase-Commits + des Dossiers + des Phase-4-Reports
# (Driver hat schon gepusht + PR erstellt; Maintainer reviewed im Browser)
```

Wird in dieser Session **nicht** ausgeführt; ist nur als Ziel-Bild des Driver-Deliverables hier dokumentiert.

### `needs-decision`-Block-Format (Phase-Report)

```markdown
## Needs decision

### Case A: <kurzer Titel>

- **Question:** <eine Frage, ein Satz>
- **Observed:** <was die Phase im Dossier / in den Override-Files gesehen hat, 2-3 Sätze>
- **Cowork default (aus Brief):** <Default-Empfehlung aus dem Brief>
- **CC recommendation:** <CC's Tendenz, mit Begründung>
- **Decision blocked because:** <was CC fehlt, um es allein zu entscheiden>

### Case B: …
```

### Tracked-for-future-Briefs

- **Workflow-Page `brain/wiki/workflows/resolver-pass-axis-sliced.md`** — nach 2–3 produktiven Pässen schreibt Cowork das Pattern als Workflow-Page (analog der noch ausstehenden `ssot-loop-driver.md` aus 071-impl-„for-next-session").
- **Public-Synopsis-Rewrite-Pass für 001..200.** Wenn die Disziplin ab `ssot-w40k-021` einige Iterationen sauber läuft und der Maintainer Energie hat, ein dedizierter Rewrite-Brief, der `overrides.synopsis` für die ersten 200 Bücher auf Public-Reader-Copy-Standard hebt.
- **Cockpit-Drift-Tie-Group-Sub-Sortierung** (075-impl-Hand-off). Kleines UI-Brief; bündelbar mit Public-Rating-Render oder Hit-Rate-Härtung.
- **Hardcover-Hit-Rate-Härtung** (OQ 10). Eigener Brief, kann nach diesem Pass eingeschoben werden.
- **HH-Domain-Resolver-Pass.** Wenn der Loop in die HH-Domain überrollt (vermutlich nach `ssot-w40k-056` oder so), bekommt der HH-Stack einen eigenen ersten Resolver-Pass — der axis-sliced Workflow aus diesem Brief sollte das Pattern setzen.
- **Resolver-Driver-Refinements.** Wenn der Driver in der ersten Iteration gebaut wird, sind die `run-ssot-loop.sh`-Refinements (per-iter timeout, shellcheck-Lokal-Setup, optional Cost-Tracking) im Resolver-Driver gleichermaßen sinnvoll — nach 2–3 Pässen einsammelbar.
