---
session: 2026-05-26-100
role: architect
date: 2026-05-26
status: implemented
slug: resolver-hh
parent: null
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-23-094-arch-resolver-loop
  - 2026-05-25-098-arch-w40k-consolidation-pass
commits: []
---

# Resolver für die HH-Domäne — Loop-Maschinerie zwei-domänen-fähig + Pre-Heresy-Bootstrap-Disziplin

## Goal

Den Headless-Resolver-Loop aus Brief 094 von W40K-only auf **zwei-domänen-fähig** (W40K + HH) erweitern und die Pre-Heresy-spezifischen Architektur-Calls festnageln, die die HH-Wellen einzigartig machen — Reference-Layer-Bootstrap-Volumen, Cross-Era-Identitäten (Luna Wolves ↔ Sons of Horus, Kharn ↔ Kharn the Betrayer), erste HH-Welle als kleiner Bootstrap-Pass.

Heute terminiert der Detektor sauber bei `w40k-complete` und ignoriert HH per Design (Brief 094, Out-of-scope HH-Resolver). Mit allen 565 W40K-Büchern resolved und 294 HH-Büchern kristallisiert in `main` (sobald PR-Merge durch) braucht es einen Architektur-Call, der die Loop-Maschinerie für HH öffnet und die HH-spezifischen Disziplinen vorgibt. **Dieser Brief baut keine neue Pipeline-Stufe**, er parametrisiert die existierende.

## Context

- **Stand 2026-05-26.** W40K datenkomplett *und* konsolidiert (Pässe 1–9 + Konsolidierungs-Pass 1 gemergt; 565/565 Bücher applied; Reference-Schicht post-Konsolidierung `factions=173` / `locations=224` / `characters=344`). HH-SSOT-Loop läuft parallel zu dieser Cowork-Session: 21 Batches `ssot-hh-001..021` (210 Bücher) sind aus `chrono-lexicanum-batches` bereits in `main` gemerged; die verbleibenden 9 Iter (`ssot-hh-022..030`, 84 Bücher) laufen via `run-ssot-loop.sh` und werden in einem zweiten PR gemerged. Bei Implementierungs-Zeitpunkt sind **294/294 HH-Bücher in `main` zu erwarten**.
- **Brief 094 ist die Form-Vorlage.** Headless-Loop-Driver `scripts/run-resolver-loop.sh` + pure-core-Detektor `scripts/resolver-loop-detect.ts` + Auto-Config-Erzeugung + brief-freies Runbook `sessions/resolver-pass-runbook.md` — die ganze 6-Phasen-Maschinerie pro Welle (`0/1/2/3/4a/4b`) bleibt unangetastet. Brief 100 öffnet die Domain-Schranke und justiert HH-spezifische Parameter.
- **Brief 098-Konsolidierungs-Pass als Geschwister.** Cross-Wave-Canonical-Row-Dedup ist eigener Pass-Typ mit Runbook `sessions/consolidation-pass-runbook.md`, der zum HH-complete-Meilenstein wiederholt wird (W40K-Konsolidierung war erster Lauf der Maschinerie, der HH-Konsolidierungs-Lauf ist ein eigener Folge-Brief und **nicht** Teil dieses Briefs).
- **Pain 1 — Detektor W40K-hardgecoded.** `resolver-loop-detect.ts` trägt an mindestens sieben Stellen W40K-only-Annahmen: Type-Annotation `domain: "w40k"`, Helper `w40kBatchId`, Template `waveLabel = "ssot-w40k-..."`, Hardcode `applyRange: { domain: "w40k", ... }`, Regex `ssot-w40k-(\d{3})` in `parseResolverLoopLog` (zweimal), File-Regex `manual-overrides-ssot-w40k-(\d+)\.json` in `loadInputs`. Terminal-Zustand `w40k-complete` ist heute Erfolgs-Endzustand — er muss in HH-Modus kippen statt zu terminieren. **Der Loop-Wrapper `scripts/run-resolver-loop.sh` ist Mit-Patient:** die `w40k-complete)`-case im STATUS-Switch (Z337) und der zusammengebaute Wave-Label `WAVE="ssot-w40k-${WAVE}"` (Z360) sind die zwei Wrapper-seitigen Hardcodes — Wrapper darf die Domain nicht raten, das Wave-Label muss komplett aus dem Detektor kommen.
- **Pain 1b — Verify-Trias W40K-only.** `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts` tragen je eine harte W40K-Konstante `BATCHES = ["001", ..., "057"]` und ein Pfad-Template `manual-overrides-ssot-w40k-${batch}.json`. Konsequenz: nach den ersten HH-Pässen bleiben die Tests **grün, ohne die HH-Range jemals zu prüfen** — die Acceptance-Forderung „test-Trias grün" wäre formal erfüllt und materiell leer. Phase-4a-Trigger im Detektor sagt heute nur „Batch-Ranges erweitern" — das funktioniert für reines W40K-Anhängen, fällt aber bei Domain-Wechsel auseinander (Pfad-Template strict W40K).
- **Pain 2 — HH ist ein Reference-Layer-Bootstrap, kein Inkrement.** Die heutigen 173 / 224 / 344 Reference-Rows sind W40K-getunt. Eine Stichprobe gegen `ssot-hh-001` (Foundational Ten) zeigt sofort: `Luna Wolves` (gar nicht im Reference-Layer und kein Alias zu `sons_of_horus`), `Mechanicum`, `Imperial Army`, `Adeptus Custodes`, `Sisters of Silence` (heute Alias zu `talons_of_the_emperor` — diskutabel), `Interex`, `Cabal`, `Knights of Taranis`, `Legio Mortis`, `Laer`, `The Order` — alles fehlt. Locations wie `Isstvan III`, `Isstvan V`, `Beta-Garmon`, `Nikaea`, `Signus`, `Molech`, `Trisolian` ebenfalls. Charaktere wie `Horus` (!), `Garviel Loken`, `Nathaniel Garro`, `Tarik Torgaddon`, `Ezekyle Abaddon` (HH-Form), `Constantin Valdor`, `Erebus`, `Lorgar`, `Fulgrim`, `Alpharius`, `Leman Russ`, `Sanguinius`, `Rogal Dorn`, `Lion El'Jonson`, `Corax`, `Perturabo` — Standard-Pre-Heresy-Cast, alles neu. Forecast (konservativ): **+30 bis +50 Factions, +60 bis +120 Locations, +500 bis +800 Characters über die 30 HH-Wellen**. Erste HH-Welle trägt den dicksten Bootstrap-Knubbel.
- **Pain 3 — Cross-Era-Identitäten sind ein neues Pattern.** W40K-only kannte das Phänomen kaum (Brief 077-Aeldari-Sub-Splits war der einzige nennenswerte Fall — gelöst über Mid-Knoten). HH bringt es serienweise: dieselbe Faction unter zwei Era-Bezeichnungen (`Luna Wolves` → `Sons of Horus` nach Ullanor; `World Eaters` → später `World Eaters` mit Khornate-Subtitle aber gleiche Legion), dieselbe Person unter Pre-/Post-Heresy-Form (`Kharn` ↔ heute `Kharn the Betrayer`; `Abaddon` ↔ heute `Abaddon the Despoiler`; `Magnus` ↔ heute `Magnus the Red`; `Lucius` ↔ heute `Lucius the Eternal`). Resolver darf das nicht raten — der Brief muss die Modellierungs-Entscheidung treffen, damit alle HH-Wellen sie konsistent anwenden.
- **Pain 4 — Phase 3 `characters.json` ist die Wachstumskante.** Brief 094 hat das explizit als deferred genannt. HH löst es aus: +500 bis +800 Characters über 30 Wellen heißt, die erste Welle alleine bringt 150–200 neue Rows (Foundational Ten + Mournival + Primarchen-Einführungen). Phase 3 lief bei Pass 6 (100er-Welle, 350 W40K-Bücher) in die Dumb-Zone (~200–250k Token); bei einer 50er-HH-Welle mit doppeltem Character-Volumen pro Buch potenziell schlimmer.

## Bausteine

Architektonische Reihenfolge; CC wählt innerhalb der Bausteine die konkrete Form. Brief 094 ist die durchgängige Form-Vorlage — alle vier Bausteine sind kleine Anpassungen an bestehender Maschinerie, keine Neubauten.

### 1. Detektor + Auto-Config + Loop-Wrapper zwei-domänen-fähig

Der pure-core-Detektor `detectNextWave` läuft künftig sequenziell durch die Domains: erst W40K, dann HH. Erst wenn beide Domains resolved sind, terminiert er final. Der headless-Wrapper `scripts/run-resolver-loop.sh` verliert parallel seine zwei W40K-Hardcodes.

- **Type-Schema.** `DetectInput` trägt **Counts beider Domains** (`w40kRosterCount` bleibt, `hhRosterCount` kommt dazu). `CrystallizedBatch` bekommt ein `domain: "w40k" | "hh"`-Feld (heute implizit über die batch-number gegen den Bestand abgeleitet). `WaveDescriptor.batches[]` ist same-domain (eine Welle überspannt nie eine Domain-Grenze). `WaveDescriptor` trägt zusätzlich das vollständige `label`-Feld (z. B. `"ssot-w40k-046..051"` / `"ssot-hh-003..008"`), damit der Wrapper das Label nicht selbst konstruieren muss. `ApplyRange.domain` wird `"w40k" | "hh"`.
- **Detektor-Ausgänge — drei externe Terminal-Zustände.** `DetectResult.status` ist **`"open-wave" | "idle" | "all-complete"`** — keine weiteren externen Status, insbesondere kein `"w40k-complete"` und kein `"w40k-complete-hh-pending"` als externes Signal:
  - `"open-wave"` (W40K **oder** HH) — wie heute, `WaveDescriptor` (inkl. `label`) + `ResolverPassConfig`.
  - `"idle"` — wie heute, „no open batch in current domain — operator needs to run the SSOT-Loop further". Der `reason` benennt die Domain.
  - `"all-complete"` (neu, ersetzt das heutige `"w40k-complete"`) — beide Domains resolved. Final-Terminal; Driver beendet sauber, ein PR über alle Wellen des Loop-Laufs.
- **W40K→HH-Übergang ist interner Branch-Point.** Wenn `detectNextWave` aufgerufen wird, während alle W40K resolved sind und HH-Batches kristallisiert vorliegen, fällt der pure-core-Code intern in den HH-Zweig und liefert die erste offene HH-Welle als regulären `"open-wave"`. Der Übergang ist mechanisch, keine Maintainer-Intervention, keine eigene Status-Variante. Für den Test/Dokumentations-Sprachgebrauch heißt dieser Boundary-Fall **`w40k-complete-hh-pending`** (Testname / Szenario-Bezeichnung) — aber er materialisiert sich extern als `"open-wave"`, nicht als eigener `status`-String.
- Der heutige externe Terminal `"w40k-complete"` verschwindet komplett. Bisherige Aufrufer (Wrapper, Tests, evtl. ad-hoc-Aufrufe) prüfen jetzt gegen `"all-complete"`. Backward-Compat ist nicht gefordert; falls CC eine Übergangs-Hilfe einbaut, im Report begründen.
- **Domain-Reihenfolge.** Hartcodiert `["w40k", "hh"]`. HH-Wellen werden **nie** vor W40K-complete produziert (selbst wenn HH-Batches kristallisiert sind und W40K noch offene Wellen hat). Begründung: HH-Reference-Rows hängen von W40K-Konsolidierungs-Stand ab (Cross-Era-Aliases zu existierenden W40K-Rows; siehe Baustein 3).
- **`buildWaveConfig` parametrisiert.** Helper `w40kBatchId` wird zu `batchId(domain, n)`, `waveLabel` ebenso, `applyRange.domain` aus dem Wave-Descriptor übernommen. Output-Paths (`resolver-pass-N-dossier.md`, Phase-Reports) bleiben numerisch indiziert über `pass: number` — Pass-Nummerierung läuft **global fortlaufend** durch beide Domains (Pass 10..N für HH, kein `hh-pass-1`-Naming). Pass-Domain steckt im `wave`-Label (z. B. `ssot-hh-001..002` für die Bootstrap, `ssot-hh-003..008` für die erste reguläre HH-Welle) und im neuen `applyRange.domain`-Feld; das reicht für eindeutige Zuordnung.
- **`parseResolverLoopLog` zwei-domänen.** Die H2-Heading-Regex matcht heute `ssot-w40k-AAA..BBB` — wird `ssot-(w40k|hh)-AAA..BBB`. Per-Domain-Progress-Counter: der Parser liefert `{ w40kProgressBatch, hhProgressBatch, nextPassNumber }`. Domain-Identifikation aus dem Heading-Match. Bootstrap/Summary-Bullet-Regex genauso erweitert.
- **`loadInputs` zwei-domänen.** File-Regex erweitert auf `manual-overrides-ssot-(w40k|hh)-(\d+)\.json`; pro Match wird `domain` mit-erfasst und in der `CrystallizedBatch`-Row notiert. Roster-Count separat pro Domain gezählt.
- **Loop-Wrapper `scripts/run-resolver-loop.sh` zwei-domänen.** Zwei Wrapper-seitige W40K-Hardcodes verschwinden: (a) die `w40k-complete)`-case im STATUS-Switch (heute Z337) wird **durch `all-complete)` ersetzt**; der String `w40k-complete` taucht im Wrapper nicht mehr auf. (b) Der zusammengebaute Wave-Label `WAVE="ssot-w40k-${WAVE}"` (heute Z360) entfällt — der Wrapper konsumiert das **vollständige `wave.label` aus dem Detektor-JSON** (`wave.label = "ssot-w40k-..."` oder `"ssot-hh-..."`) und gibt es 1:1 in Commit-Messages, Log-Updater-Aufrufe und PR-Titel weiter. Domain wird im Wrapper nie geraten — sie kommt ausschließlich vom Detektor. Header-Kommentar (Z6 „idle / w40k-complete", Z20 „idle / w40k-complete / needs-decision") und EXIT-CODE-Doc (Z47 „idle / w40k-complete / needs-decision / success") werden entsprechend auf `all-complete` umformuliert.

### 2. HH-Wave-Sizing — Bootstrap-Pass kleiner

Die heutigen Konstanten `WAVE_TARGET=50` / `WAVE_HARD_CAP=60` funktionieren für inkrementelle W40K-Wellen. **Die erste HH-Welle ist kein Inkrement, sondern ein Bootstrap-Knubbel** — sie bringt 150–200 neue Characters in Phase 3 (Foundational Ten + Mournival + erste Primarchen) plus 15–25 Factions und 20–40 Locations. Eine 50er-Welle in der Bootstrap-Phase treibt Phase 3 in die Dumb-Zone.

- **Neue Konstante `HH_BOOTSTRAP_WAVE_TARGET`** (Vorschlag: `20`, harte Obergrenze `25`). Greift **nur** für die allererste HH-Welle (`hhProgressBatch === 0` zum Erkennungs-Zeitpunkt). Folge-HH-Wellen nutzen die regulären `WAVE_TARGET=50` / `WAVE_HARD_CAP=60`.
- **Algorithmus unverändert sonst** — `ceil(restBooks / hardCap)` Wellen, balancierte zusammenhängende Batch-Partition, smallest-N-Lösung. Nur die Cap-Konstante variiert für den Bootstrap, und sie greift nur in genau einer Invocation (`hhProgressBatch === 0`); ab Invocation #2 läuft regulär.
- **Wellen-Mathematik (mit Batch-Größe 10 fix angenommen).** Bootstrap-Welle: `partitionWaves` mit Cap=25 schließt nach Batch 002 — Batch 003 würde 30 Bücher ergeben und gegen die Cap overflowen. **Wave 1 = `ssot-hh-001..002`, 20 Bücher.** Danach `hhProgressBatch=2`, 274 offene Bücher, reguläre Cap 60 → `ceil(274/60) = 5` Wellen. **Total für die HH-Domäne: ~6 Wellen** (1 Bootstrap + 5 regulär), nicht ~12. Die fünf regulären Wellen partitionieren grob als `003..008` (60), `009..014` (60), `015..020` (60), `021..025` (50), `026..030` (44 — falls Batch 030 nur 4 Bücher trägt; sonst gleichverteilt).
- **Test-Fixtures.** Synthetische Detektor-Tests für (a) erste HH-Welle bei 294 offenen HH-Büchern, Bootstrap-Cap=25 → Wave 1 = `ssot-hh-001..002` mit 20 Büchern (Batch 003 würde overflowen → Welle schließt nach 2 Batches); (b) zweite HH-Welle bei `hhProgressBatch=2` und 274 offenen Büchern, reguläre Cap=60 → erste reguläre Welle z. B. `ssot-hh-003..008` (60 Bücher), gleiche Logik wie W40K. CC wählt die genaue Test-Form; das Outcome ist verbindlich.
- Der exakte numerische Wert (`HH_BOOTSTRAP_WAVE_TARGET = 20` vs. `25`) bleibt CC's Detail-Call — die Architektur-Entscheidung ist „die erste HH-Welle ist kleiner als die regulären, und der Bootstrap-Cap greift nur in genau dieser einen Invocation".

### 3. Cross-Era-Identitäten — Modellierungs-Disziplin

Die Architektur-Entscheidung in einem Satz: **Eine kanonische Identität = eine Canonical-Row, Era-spezifische Bezeichnungen wandern in `aliases[]`.**

Begründung: die Zeit-Achse (Pre-Heresy → Heresy → Post-Heresy) ist eine **Story-Property**, keine **Identitäts-Property**. `Luna Wolves` und `Sons of Horus` sind dieselbe organisatorische Einheit unter zwei Bezeichnungen; `Kharn` und `Kharn the Betrayer` sind dieselbe Person mit zwei Surface-Forms. Eine zweite Canonical-Row würde Junction-Counts künstlich teilen, das Audit-Cockpit zerlegt eine Identität in zwei Drift-Cluster, und die Reference-Layer-Hygiene (Brief 098-Konsolidierungs-Pass) würde sie eh später wieder zusammenführen.

Konkrete Modellierungs-Regeln, die der Resolver-Pass anwendet:

- **Faction-Renames** (Luna Wolves → Sons of Horus, ähnlich für andere Heresy-Era-Übergänge): die heute existierende Canonical-Row (`sons_of_horus`) ist der Anker; HH-Surface-Forms (`Luna Wolves`) werden in `faction-aliases.json` auf diese Canonical-ID gemappt. **Keine** neue `luna_wolves`-Row.
- **Character-Honor-Title-Splits** (Kharn ↔ Kharn the Betrayer, Abaddon ↔ Abaddon the Despoiler, Magnus ↔ Magnus the Red, Lucius ↔ Lucius the Eternal): die existierende W40K-Canonical-Row (`kharn_the_betrayer` etc.) ist der Anker; HH-Surface-Form (`Kharn`) wird Alias zur W40K-Row. Pre-Heresy-Charaktere ohne W40K-Pendant (`Garviel Loken`, `Nathaniel Garro`, `Tarik Torgaddon` etc.) werden frische Canonical-Rows.
- **Primarchen.** Bestehende Canonical-Rows mit Honor-Titles bleiben Anker (`magnus_the_red`, `ferrus_manus`, `mortarion`, `vulkan`, `roboute_guilliman`). HH-Surface-Forms ohne Title (`Magnus`, `Mortarion`) werden Aliases. Primarchen ohne heutige Row (`Horus`, `Sanguinius`, `Rogal Dorn`, `Lion El'Jonson`, `Leman Russ`, `Lorgar`, `Fulgrim`, `Perturabo`, `Corax`, `Alpharius`, `Konrad Curze` u. a.) werden frische Canonical-Rows.
- **Ausnahme — echte Identitäts-Disambig.** Stößt der Pass auf eine echte Gleichnamigkeit (gleicher Surface-Form, andere Identität — selten, aber denkbar bei generischen Namen wie „Marcus"), `## Needs decision`-Stop in der Phase-Statusdatei. Kein Raten.
- **Surface-Form-Treue bleibt unverändert.** HH-Override-Files tragen die Lore-korrekte Surface-Form („Luna Wolves" bleibt „Luna Wolves" in der Override-Datei) — das Resolving zur Canonical-ID via Alias passiert in Phase 4a (Apply-Layer), nicht in der Override-File.

Diese Disziplin **muss in `sessions/resolver-pass-runbook.md` §4 (Promotions- & Alias-Disziplin)** als eigene Sektion ausgeschrieben werden, **nicht** als Verweis auf diesen Brief — das Runbook ist seit Brief 094 selbst-enthalten.

### 4. Verify-Trias zwei-domänen + `EXPECTED_RANGES` für HH-Headroom

Die drei Verify-Skripte (`apply-override-dry.ts`, `test-resolver-coverage.ts`, `test-resolver-data-integrity.ts`) sind heute strikt W40K — sie bleiben sonst grün, ohne HH zu prüfen. Zwei zusammenhängende Eingriffe an demselben File-Set:

**4a. Verify-Trias domain-aware.** Heute steht in jedem der drei Skripte ein `BATCHES = ["001", ..., "057"]`-Array und ein Pfad-Template `manual-overrides-ssot-w40k-${batch}.json`. Architektur-Call: die Trias wird **domain-aware**, sodass jeder Lauf nach HH-Pässen auch die HH-Range materiell prüft (nicht nur „grün durch Abwesenheit"). CC wählt die konkrete Form — zwei legitime Optionen:

- **Variante A (statische Tupel):** `BATCHES` wird zu `[{domain: "w40k" | "hh", n: string}, …]`; Pfad-Template entsprechend `manual-overrides-ssot-${domain}-${n}.json`. Append-after-Pass (Phase-4a-Trigger) erweitert das Array um `{domain, n}`-Einträge.
- **Variante B (config-/roster-getrieben):** Die drei Skripte lesen ihre Batch-Range nicht mehr aus einer Inline-Konstante, sondern aus `scripts/resolver-pass.config.json` (kumulativ) oder direkt aus dem Reference-Layer-Roster. Append-after-Pass wird trivial.

Outcome verbindlich, Variante CC's Detail-Call: nach dem ersten HH-Pass enthält jeder Trias-Lauf nachweislich auch HH-Batches (`manual-overrides-ssot-hh-001.json` etc. liegen tatsächlich in der gelesenen Range). Der Phase-4a-Trigger im Detektor (`buildWaveConfig`, heute „die Trias-Batch-Ranges … auf die kumulative applyRange ausweiten") wird parallel auf Domain-+-N-Append umformuliert statt reinem N-Append; ohne diese Wrapper-/Trigger-Anpassung kommt der nächste HH-Pass nicht durch.

**4b. `EXPECTED_RANGES` für HH-Headroom.** Aktuelle Maxima in `scripts/apply-override-dry.ts`: `factions.max=2100`, `locations.max=800`, `characters.max=1400`. Mit HH-Bootstrap nicht ausreichend.

- **Anhebung pro Achse, konservativ aber mit Reserve.** Vorschlag (CC justiert auf Basis Pass-1-Phase-4a-Counts): `factions.max=2500`, `locations.max=1100`, `characters.max=2200`. Begründung: faction-Wachstum bleibt überschaubar (~30–50 HH-Inserts), location-Wachstum mittel (~60–120), character-Wachstum dominant (~500–800).
- **Pro-Welle-Adjustierung nicht nötig.** Die Ranges sind globale Sanity-Caps, kein Per-Wave-Gate. Anhebung passiert **einmal** in diesem Brief, danach erst wieder bei einem Konsolidierungs-Pass mit großer Merge-Bewegung.

## Der Trial — erster scharfer HH-Lauf

Nach Merge dieses Briefs UND nachdem alle 294 HH-Bücher in `main` sind, fährt der Resolver-Loop **headless, unbeaufsichtigt** über die HH-Domäne. Erste Welle ist die Bootstrap-Welle (`ssot-hh-001..002`, 20 Bücher — die dritte Batch würde 30 Bücher ergeben und gegen die 25er-Cap overflowen); danach reguläre 50/60er-Wellen über die restlichen 274 Bücher (`ceil(274/60) = 5` Wellen). **Insgesamt ca. 6 Wellen für die HH-Domäne** (1 Bootstrap + 5 regulär), nicht ~12.

Operativ (Philipp triggert), **nicht** Teil der Implementierung dieses Briefs — exakt wie Brief 094. Worauf beim Trial zu achten ist:

- **Phase 3 in der ersten Welle.** Der Bootstrap-Knubbel ist hier; wenn 25er-Welle Phase 3 sauber unter 150k Token hält, ist die Architektur richtig dimensioniert. Wenn nicht, ist das das Signal, das in Brief 094 deferrede Phase-3-Achsen-Slicing nachzuziehen (eigener Folge-Brief).
- **Cross-Era-Alias-Disziplin.** Werden `Luna Wolves`, `Kharn`, `Abaddon`, `Magnus`, `Lucius` korrekt als Aliases zu existierenden Canonical-Rows resolved? Phase 4a `factionsSkippedRedundant`-Bucket sollte leer bleiben für Cross-Era-Hits (kein Skip — Aliases resolven).
- **EXPECTED_RANGES.** Bleibt Phase 4a unter den angehobenen Caps? Falls eine Achse die Cap reißt, ist das ein `## Needs decision`-Stop und Datenpunkt für eine zweite Anhebung.

HH-complete-Meilenstein triggert dann den **zweiten Konsolidierungs-Pass** (Brief 098-Geschwister) — eigener Folge-Brief, **nicht** Teil dieses Briefs.

**Sequencing-unabhängig implementierbar.** Zum Implementierungs-Zeitpunkt sind ggf. nur 21 von 30 HH-Batches in `main` (der zweite SSOT-Loop-PR läuft parallel). Wie bei Brief 094 wird der Brief gegen **synthetische Fixtures** validiert (alle Detektor-Ausgänge, Bootstrap-Wave-Sizing, beide Domains); ein **Live-Smoke** prüft, dass der Detektor bei aktuellem Stand (W40K-complete, HH `21/30` oder `30/30`) das erwartete Ergebnis liefert. Der erste echte Trial-Lauf wartet auf `30/30` HH in `main`.

## Constraints

- **Resolver-Semantik unverändert** — Surface-Form → canonical ID via direct match → alias lookup (Brief 049/072). Kein Fuzzy, kein Slug-Match, keine Titel-Normalisierung. Die Cross-Era-Aliases sind reguläre `*-aliases.json`-Einträge, keine neue Resolver-Stage.
- **Die 6-Phasen-Maschinerie pro Welle (0/1/2/3/4a/4b — Brief 076/090/091) bleibt unangetastet** in Struktur, Reihenfolge und Halt-Checks. Brief 100 öffnet die Domain-Schranke und justiert HH-spezifische Parameter; er fasst die Phasen nicht an.
- **Pass-Counter global fortlaufend.** HH-Pässe sind Pass 10..N, kein eigener `hh-pass-1`-Namespace. Wave-Label trägt die Domain (z. B. `ssot-hh-001..002` Bootstrap, `ssot-hh-003..008` erste reguläre Welle).
- **Keine Schema-Migration**, kein Touch an `src/db/schema.ts` / `src/db/migrations/`. Harter Blocker → `needs-decision`-Stop.
- **Determinismus bleibt.** Detektor, Auto-Config-Erzeugung, Aggregator und Apply-Skripte sind re-runnable und produzieren bei gleichen Inputs byte-identische Ausgabe.
- **Keine Tool-Versionen pinnen, keine neuen Dependencies** — ein Detektor-/Config-Refactor braucht keine.
- **Dieser Brief fährt keinen Produktiv-Pass.** Validierung läuft über synthetische Fixtures + Live-Smoke; der Trial-Lauf ist operativ.
- **Worktree.** Batches-Strang. Arbeite in `C:\Users\Phil\chrono-lexicanum-batches` auf einer frischen `codex/ingest-batches-resolver-hh`-Branch aus aktuellem `origin/main`. `main` ist read-only für Code.
- **Fremde/parallele Änderungen nicht zurücksetzen** (paralleler SSOT-Loop-Lauf, paralleles Product-Strang-Redesign aus Brief 096).

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **Der HH-Konsolidierungs-Pass** (Cross-Wave-Canonical-Row-Dedup für das HH-Entitäten-Set, plus Cross-Domain-Dedup für HH-eingebrachte Rows, die mit W40K-Rows reden). Eigener Folge-Brief — die Maschinerie aus Brief 098 existiert bereits, der zweite Lauf braucht nur einen schlanken Brief mit den HH-spezifischen Kandidaten-Heuristiken.
- **Phase-3 `characters.json`-Achsen-Slicing** (bekannte Wachstumskante, Brief 090/091/094). Wird im HH-Trial getriggert oder nicht — separater Folge-Brief, falls der Trial das Signal liefert. Hier **nicht** vorausgreifen.
- **Pre-Heresy-Reference-Layer-Pre-Seeding** (alle bekannten HH-Factions/Locations/Characters in einer eigenen Subsession vor dem ersten Pass anlegen). Verlockend, aber falsche Schicht — Phase 1/2/3 jeder Welle ist genau für das inkrementelle Anlegen gebaut, mit Promotions-Disziplin freq≥2 strict + lore-ikonische freq=1 (Brief 094 §4). Die Bootstrap-Wave-Verkleinerung (Baustein 2) ist die richtige Antwort, nicht ein Pre-Seed-Schritt.
- **`talons_of_the_emperor`-vs-`sisters_of_silence`-Re-Modellierung.** Heutiger Alias-Eintrag ist diskutabel (Talons sind die Custodes+Sisters-Doppel-Einheit, Sisters of Silence ist die Sub-Einheit). Wenn HH-Wellen oft genug `Sisters of Silence` als eigene Faction zeigen, kann das zu einer eigenständigen Canonical-Row promoten — Pass-Phase-1-Architektur-Call, **nicht** Brief 100.
- **Resolver-Matching-Semantik ändern, Reference-Daten oder Override-Files inhaltlich umschreiben, UI/Cockpit, V2-Pipeline (`src/lib/ingestion/**`), App-Routen.**
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung** — bleiben in der Open-Questions-Queue, hier **nicht** adressiert.
- **Das operative Loopen bis HH-complete und der Trial-Lauf selbst** — operativ, kein Brief.
- **Brain-Wiki** (`brain/wiki/**`). Cowork zieht den Post-Merge-Koordinations-Pass aus dem Coordination-Worktree (Brief 095 Rollup-Ownership).

## Acceptance

Die Session ist fertig, wenn:

- [ ] **Detektor zwei-domänen:** `CrystallizedBatch` trägt `domain: "w40k" | "hh"`; `DetectInput` trägt `w40kRosterCount` + `hhRosterCount`; `ApplyRange.domain` erweitert; `WaveDescriptor` trägt das vollständige `label`-Feld (`"ssot-w40k-..."` / `"ssot-hh-..."`); `loadInputs` matcht `manual-overrides-ssot-(w40k|hh)-(\d+)\.json` und erfasst die Domain pro Batch; `parseResolverLoopLog` parst beide Domain-Heading-Formen und liefert getrennte Progress-Counter; `detectNextWave` durchläuft W40K vor HH sequenziell; **drei externe Terminal-Zustände** (`open-wave`, `idle`, `all-complete`) — der W40K→HH-Übergang ist interner Branch-Point innerhalb von `detectNextWave`, materialisiert sich extern als `open-wave` mit der ersten HH-Welle, keine eigene Status-Variante; `w40k-complete` als externer Status entfernt.
- [ ] **Loop-Wrapper zwei-domänen:** `scripts/run-resolver-loop.sh` verliert die `w40k-complete)`-case im STATUS-Switch (durch `all-complete)` ersetzt) und den hartkodierten `WAVE="ssot-w40k-${WAVE}"`-Zusammenbau; das vollständige Wave-Label kommt aus dem Detektor-Output (`wave.label`) und wird 1:1 in Commit-Messages, Log-Updater-Aufrufe und PR-Titel propagiert. Keine W40K-Strings mehr im Wrapper-Body — Header-Kommentar und EXIT-CODE-Doc entsprechend auf `all-complete` umformuliert. Driver bleibt domain-agnostisch (kein neuer Domain-Branch).
- [ ] **Auto-Config zwei-domänen:** `buildWaveConfig` produziert für eine HH-Welle die korrekten Pfade (`waveLabel = "ssot-hh-AAA..BBB"`, `applyRange.domain = "hh"`, batchIds mit `ssot-hh-`-Präfix, `newRange`/`oldRange` über HH-IDs `HH-NNNN`); Pass-Nummerierung läuft global fortlaufend (HH startet bei Pass 10 nach W40K-Pässen 1–9); generische Trigger-Templates aus Brief 094 funktionieren unverändert (sie referenzieren `${waveLabel}` / `${batchIds}` / `${dossier}` — keine Domain-Hardcodes).
- [ ] **HH-Bootstrap-Wave:** Konstante `HH_BOOTSTRAP_WAVE_TARGET` (~20) + harte Obergrenze (~25) existiert; greift **nur** bei der ersten HH-Welle (`hhProgressBatch === 0`); spätere HH-Wellen nutzen reguläre `WAVE_TARGET=50` / `WAVE_HARD_CAP=60`. Unit-Tests decken (a) erste HH-Welle bei 294 offenen Büchern (Bootstrap-Cap=25, Batch-Größe 10 → Wave 1 = `ssot-hh-001..002`, 20 Bücher; Batch 003 würde gegen die Cap overflowen) und (b) zweite HH-Welle bei `hhProgressBatch=2` mit 274 offenen Büchern (reguläre Cap=60 → `ceil(274/60)=5` Wellen, erste z. B. `ssot-hh-003..008` mit 60 Büchern). Gesamt-Outcome für die HH-Domäne: **~6 Wellen** (1 Bootstrap + 5 regulär).
- [ ] **Cross-Era-Alias-Disziplin in `resolver-pass-runbook.md` §4:** Eine eigene Sektion „Cross-Era-Identitäten" mit den drei Regeln (Faction-Rename, Character-Honor-Title-Split, Primarchen-Pattern) ausgeschrieben; benennt Beispiele (Luna Wolves ↔ Sons of Horus, Kharn ↔ Kharn the Betrayer, Magnus ↔ Magnus the Red); benennt die Ausnahme (echte Identitäts-Disambig → `## Needs decision`); **keine** Verweise auf Brief 100 (Runbook bleibt brief-frei selbst-enthalten — Herkunft in der überspringbaren „Background"-Fußnote am Ende). Diese Disziplin ist die einzige Runbook-Edit dieses Briefs.
- [ ] **Verify-Trias zwei-domänen:** `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts` lesen ihre Batch-Range nicht mehr aus einer hartkodierten W40K-Liste (`BATCHES = ["001"..."057"]` + Pfad-Template `manual-overrides-ssot-w40k-${batch}.json`), sondern domain-aware (`{domain, n}`-Tupel oder Config-/Roster-getrieben — CC wählt die Form). Nachweisbar: nach dem ersten HH-Pass enthält jeder Trias-Lauf auch HH-Batches in der gelesenen Range, nicht nur W40K. Der Phase-4a-Trigger-Text in `buildWaveConfig` (heute „die Trias-Batch-Ranges … auf die kumulative applyRange ausweiten") wird parallel auf die gewählte Domain-+-N-Append-Form umformuliert, damit der HH-Pass den Trigger 1:1 anwenden kann.
- [ ] **`EXPECTED_RANGES` angehoben** in `scripts/apply-override-dry.ts`: `factions.max=2500` (von 2100), `locations.max=1100` (von 800), `characters.max=2200` (von 1400). CC darf auf Basis Phase-4a-Counts der ersten zwei Pässe nachjustieren (im Report begründen).
- [ ] **Validierung mit synthetischen Fixtures:** Unit-Tests für den Detektor mit allen drei externen Terminal-Zuständen plus dem W40K→HH-Boundary-Testfall (Testname `w40k-complete-hh-pending`): offene W40K-Welle, offene HH-Welle, W40K-complete-mit-HH-pending → liefert die erste HH-Welle als `open-wave` (interner Branch-Point, kein neuer Status), `all-complete`, `idle` jeweils pro Domain; Fixture-Tests für Bootstrap-Wave-Sizing (erste HH-Welle vs. zweite HH-Welle); Live-Smoke gegen den realen Repo-Stand zum Implementierungs-Zeitpunkt (W40K-complete + HH-Stand wie er gerade ist — `21/30` oder `30/30`) mit erwartetem Outcome dokumentiert.
- [ ] **`npm run lint`, `typecheck`, `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `test:loop-next`, `test:resolver-loop-detect`, `brain:lint -- --no-write`** laufen grün.
- [ ] Impl-Report `sessions/2026-05-26-100-impl-resolver-hh.md` geschrieben; Status dieses Briefs auf `implemented` (eine-Zeile-Edit im selben PR).

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Reicht der Bootstrap-Cap (`HH_BOOTSTRAP_WAVE_TARGET=20`), oder zeigt der Trial, dass Phase 3 selbst bei 20 Büchern in die Dumb-Zone driftet? Falls ja, ist der Phase-3-Achsen-Slicing-Folge-Brief zwingend (separat) — und der Bootstrap-Cap kann zurück auf 50.
- Sind die `EXPECTED_RANGES`-Anhebungen großzügig genug, oder soll CC im Zuge der Implementierung eine engere Schätzung pro Achse begründen?
- Tauchen beim Implementieren weitere W40K-Hardcodes im Pass-Ökosystem auf (`scripts/aggregate-surface-forms.ts`, `scripts/verify-pass.ts`, `scripts/run-phase4-apply.sh`), die zwei-domänen werden müssen? Im Report sweepen + benennen.
- Werden die generischen Phase-Trigger-Templates aus Brief 094 für HH-Wellen unverändert nutzbar bleiben, oder zeigt der Trial-Lauf, dass HH-spezifische Trigger-Adjustments nötig sind (z. B. Bootstrap-Welle braucht expliziten Hinweis auf Pre-Heresy-Faction-Volumen)?

## Notes

- Reine Resolver-Maschinerie + Daten-Disziplin — keine UI-Oberfläche, daher **kein** „Design freedom"-Abschnitt (analog Brief 094/091).
- **Form-Vorlage:** Brief 094 hat die Maschinerie gebaut, Brief 100 öffnet die Domain-Schranke und justiert HH-spezifische Parameter. Wer Brief 094 als Muster liest, hat die Form verstanden. Vorlagen alle im Repo: `scripts/resolver-loop-detect.ts` (Detektor mit drei externen Terminal-Status heute `open-wave | idle | w40k-complete`, drei externen Status morgen `open-wave | idle | all-complete` — der W40K→HH-Übergang materialisiert sich extern als `open-wave`, ist intern Branch-Point), `scripts/run-resolver-loop.sh` (Loop-Driver, post-Brief-100 vollständig domain-agnostisch), `scripts/run-resolver-pass.sh` + `sessions/resolver-pass-runbook.md` (Wellen-Driver + selbst-enthaltene Spec), `scripts/apply-override-dry.ts` (EXPECTED_RANGES + Trias-Domain-Awareness).
- **Sequenz danach** (operativ, festgehalten damit sie nicht verloren geht): (1) Brief 100 implementiert + gemergt. (2) Resolver-Headless-Trial über die HH-Bücher (Bootstrap-Welle + reguläre HH-Wellen) → alle 294 HH-Bücher resolved/applied. (3) Zweiter Konsolidierungs-Pass (Cross-Wave-Dedup HH-Set + Cross-Domain-Dedup für HH-eingebrachte Rows, die mit W40K-Rows reden — eigener Folge-Brief, schlank, weil Maschinerie aus Brief 098 existiert). (4) Korpus datenkomplett: 859/859 Bücher resolved/applied. (5) Phase-3-Achsen-Slicing als Folge-Brief, **nur wenn** der HH-Trial das Signal liefert.
- **Cross-Era-Aliases sind echte Reference-Daten-Arbeit, kein UI-Schmuck.** Sie haben Folgen für das Audit-Cockpit (`/buch/[slug]/audit` zeigt sie als Junctions zur W40K-Canonical-Row), für die Public-Detail-Seite (Faction-Filter rollt sie korrekt unter den Sub-Faction-Knoten) und für die Junction-Counts (eine Identität = ein Cluster, nicht zwei). Das ist die Rendite für die Modellierungs-Disziplin in Baustein 3.
- **Hintergrund-Rationale** (warum es den Resolver-Pass gibt, die Achsen-Aufteilung, das Token-Budget, die Loop-Maschinerie): Briefs 076 / 090 / 091 / 094. Dieser Brief baut darauf auf, wiederholt es nicht. Die Cross-Era-Disziplin (Baustein 3) ist die einzige neue Architektur-Position; alles andere ist Parametrisierung.
