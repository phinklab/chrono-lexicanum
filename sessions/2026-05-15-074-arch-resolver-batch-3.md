---
session: 2026-05-15-074
role: architect
date: 2026-05-15
status: implemented
slug: resolver-batch-3
parent: 2026-05-14-072-arch-resolver-batch-2
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-12-063-arch-resolver-50-books
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-14-072-arch-resolver-batch-2
  - 2026-05-14-073-arch-maintainer-audit-cockpit
  - 2026-05-15-074-impl-resolver-batch-3
commits: []
---

# Resolver-Pass 3 — Surface-Form-Crystallization für ssot-w40k-011..015

## Erratum (2026-05-15, post-Codex-Review)

Codex-Review hat vier Stellen in der Erst-Fassung gefunden, die gegen den realen Code-/Daten-Stand verstoßen. **Lies diesen Block, bevor du dem Rest folgst — diese Korrekturen überschreiben gegenteilige Aussagen weiter unten.**

1. **Schema-Tatsache `factions` + `characters` haben KEIN `tags`-Feld.** `factions` hat `tone` + `glyph` (`src/db/schema.ts:186`); `characters` hat `notes` (`src/db/schema.ts:606`); `SeedFaction` kennt nur `tone`/`glyph`/`alignment`/`parent`/`name`/`id` (`scripts/seed-resolver-extensions.ts:43`). **`tags` gibt es nur auf `locations`**. Konsequenz für die historical-canon-layer-Markierung der Watson-Trilogy:
   - **Factions** (`squats`, `hydra_cabal`) → Marker im `tone`-Feld (Cowork-Konvention: `tone: 'historical_canon_layer'` — Single-Token; falls CC eine bessere Konvention findet, im Report begründen).
   - **Characters** (Cawl, Watson-Retinue Jaq Draco / Meh'Lindi / Vitali Googol / Grimm) → Marker im `notes`-Feld (kompakter String, z. B. `notes: 'historical_canon_layer; Watson Inquisition-War Trilogy retinue'`).
   - **Locations** (Stalinvast, Sabulorb) → wie ursprünglich: `tags: ['historical_canon_layer']` (Schema-supported).

2. **Stale Parent-IDs in der Erst-Fassung — gegen `factions.json`.** Die kanonischen IDs sind nicht die Surface-Form-Schreibweisen:
   - Sororitas-Sub-Factions (Order of the Last Candle, Order of Our Martyred Lady, …): `parent: "sisters_of_battle"` (canonical-ID in `factions.json:203`). Surface-Form „Adepta Sororitas" läuft über `faction-aliases.json` auf `sisters_of_battle`; `adepta_sororitas` existiert NICHT als ID.
   - Aeldari-Sub-Factions (Aeldari Corsairs, Starsplinters, ggf. Ynnari): `parent: "eldar"` (canonical-ID in `factions.json:177`). Surface-Forms „Aeldari" / „Dark Eldar" / „Drukhari" laufen über `faction-aliases.json` auf `eldar`; `aeldari` existiert NICHT als ID. (Cowork-Note 072: Aeldari/Drukhari-Aliase wurden in 072 angelegt — CC prüft Idempotenz und ergänzt nur was wirklich fehlt.)
   - Tom Korne-Welt-/Etc. analog: bei jedem `parent`-Anker im Brief gegen `factions.json` validieren, bevor der Insert läuft.

3. **Idempotenz-Annahmen falsch — bestehende Rows respektieren.**
   - `squats` existiert schon in `factions.json:636` als Top-Level-Imperium-Row. CC legt keine zweite Row an; falls die historical-canon-layer-Markierung erwünscht ist, durch den `seed-resolver-extensions`-Upsert-Pfad (post-070 Upsert auf JSON-Spalten) `tone` setzen. **Cowork-Note:** Die genaue Upsert-Konvention von `seedFactions` post-070 ist CC's Lookup — Cowork hat den Pfad nicht im Detail nachgelesen; falls der Upsert das `tone`-Feld nicht überschreibt, im Report flaggen + Tag-Anforderung fallen lassen.
   - `webway` (`locations.json:654`) und `commorragh` (`locations.json:688`) existieren schon. `seedLocations` ist **insert-only** außer dem `great_rift`-In-Place-Update-Sonderfall (`scripts/seed-resolver-extensions.ts:287`-Bereich). **Cowork-Entscheidung:** Tag-Anforderung für webway + commorragh **fällt fallen** — kein zweiter In-Place-Update-Sonderfall in diesem Brief. Stalinvast + Sabulorb (neue Rows) tragen `tags: ['historical_canon_layer']`. Webway/Commorragh bleiben für 074 untagged; die historical-canon-layer-Information lebt für sie über die Override-Files (Surface-Forms-Block) bis ein späterer Brief den Update-Pfad systematisch macht.
   - **Belisarius Cawl existiert NICHT** in `characters.json` post-072. Die Erst-Fassung sagte fälschlich „existiert schon" — Cowork hat das nicht gegen den Stand verifiziert. CC legt eine neue Row an (lore-iconic-freq=3 ist deutlich überschritten — Cawl-Trilogy-Anker). **Cawl ist KEIN historical-canon-layer-Charakter** — er ist moderne Codex-Lore (post-2017-Primaris). `notes`-Konvention für Cawl: `'Cawl trilogy anchor'` (oder analog kompakt), **ohne** historical-canon-Marker. Nur die Watson-Retinue (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm) kriegt den `historical_canon_layer`-Marker im `notes`-Feld.

4. **Green-Tide-Stresstest in der Erst-Fassung nicht erfüllbar.** Drei Bugs übereinander:
   - **Falsche IDs.** Catachan Devil = `W40K-0118` und Warboss = `W40K-0128` (siehe `scripts/seed-data/book-roster.json:6510` und `:6670`), NICHT 0114/0124 wie in der Erst-Fassung steht.
   - **Roster-Lücke.** Der Green-Tide-Eintrag (`book-roster.json:6964`) trägt die Note „individual contents not explicitly recoverable"; es gibt **0 `roster.collections`-Rows** mit W40K-0147 als parent.
   - **`applyCollections` zieht ausschließlich aus `roster.collections`.** (`scripts/apply-override.ts:796`-Bereich.) Ohne Roster-Rows kommt im Apply nichts an — der Stresstest kann so nicht grün werden.

   **Cowork-Entscheidung, ergänzt nach Maintainer-Review:** Green Tide bleibt **voll in scope als Buch** (normaler Resolver-Apply für Facets / Factions / Locations / Characters), aber bleibt **vorerst out of scope als vollständige `work_collections`-Struktur**. CC legt also keine partiellen `roster.collections`-Rows für `W40K-0147` an, solange die Short-Story-Constituents nicht als eigene Roster-Works modelliert sind. Stattdessen ist in 074 neu in scope: ein maschinenlesbares Collection-Gap-Ledger unter `scripts/seed-data/collection-gaps.json` (neu anlegen, falls nicht vorhanden). Dort wird Green Tide als `needs_constituent_roster_entries` erfasst: bekannte bereits vorhandene Constituents `W40K-0128` (*Warboss*), `W40K-0118` (*Catachan Devil*), `W40K-0249` (*Iron Resolve*), `W40K-0565` (*Prisoners of Waaagh!*); bekannte noch nicht modellierte Short-Story-Constituents `Where Dere's Da Warp Dere's a Way`, `Painboyz`, `Mad Dok`, `The Enemy of My Enemy` plus ggf. weitere im Override belegte Green-Tide-Short-Stories. Ziel: Das Buch bleibt nutzbar, aber die unvollständige Collection wird nicht versehentlich als vollständig dargestellt. Falls die Override-Files für 011..015 andere Omnibus-Entries enthalten, deren Constituents tatsächlich im Roster-`collections` stehen, ist DAS der reale Cross-Batch-Stresstest in dieser Welle — CC darf den entdecken und dokumentieren.

Die genannten Stellen im Rest des Briefs (Goal-Paragraph, Faction-Tabellen-Sektion (a)–(g), Locations-Sektion, Characters-Sektion, Smoke-Slug `the-green-tide`, Acceptance-Bullet zum Cross-Batch-Stresstest) sind durch diesen Erratum-Block **überschrieben**. CC liest unten weiter mit dem Erratum im Hinterkopf; die Tabellen behalten ihre Surface-Form-Liste, nur die parent-IDs + Tag-Konventionen + die Cawl-Annahme + der Green-Tide-Bullet ändern sich gemäß den vier Punkten oben.

## Goal

Schließe die Resolver-Schleife für die dritte 50er-Welle der Authority-Schicht (`ssot-w40k-011..015`, 50 Bücher, W40K-0101..W40K-0150). Konkret: erweitere `factions.json` / `locations.json` / `characters.json` um die in dieser Welle belastbar-häufigen Surface-Forms (≥ 2 plus eine Cowork-kuratierte Liste lore-iconischer freq=1-Promotionen, analog 072), pflege die zugehörigen Aliase ein, behandle die in `ssot-w40k-015` enthaltene **Ian-Watson-Inquisition-War-Trilogy als distinct historical-canon-layer** (Squats / Hydra-Cabal / pre-modern Surface-Forms — nicht auf moderne Codex-Begriffe kollabieren; Marker im jeweiligen Schema-konformen Slot — siehe Erratum-Punkt 1), und Re-Apply `ssot-w40k-001..015` gegen die DB, damit Counts + Detail-Pages den neuen Stand reflektieren. Status-Pass für `work_collections` global (Pre-/Post-Apply-Count) plus `collection-gaps.json`-Ledger für The Green Tide als bekannter unvollständiger Sammelwerk-Fall — siehe Erratum-Punkt 4.

Adresse: laufende Resolver-Pflege pro 50er-Schwelle aus OQ4/OQ5-Closure-Note in 069 und der `⏸ Resolver-Pause bei 150 Büchern`-Status-Log-Note aus dem 2026-05-15-Driver-Run (Brief 071, PR #54). **Keine Schema-Migration**, **keine UI-Arbeit**, **kein neues Test-Framework**, **kein V2-Pipeline-Touch** (die V2-LLM-Stage ist de-facto durch CC-Direct-Curation ausgemustert; Wiki/ADR-Update dazu ist eine separate Cowork-Hygiene-Session und gehört nicht in diesen Brief). Loop-Driver (Brief 071) und dieser Brief sind orthogonal — der Driver bleibt unangetastet, der Resolver-Pass läuft auf einem eigenen Branch.

## Context

**Stand 2026-05-15, post-Loop-Driver-Run.** 150 Bücher in der Authority-Schicht. Die Iterationen `ssot-w40k-011..015` wurden am 2026-05-14/15 durch den Brief-071-Loop-Driver (5-Iter, `--skip-initial-resolver-pause` auf Iter 1, kein Skip-Marker auf 2..5) produziert; PR #54 (`4993e17`, Squash-Merge) hat 5 Override-Files plus den Loop-Log-Append nach `main` gebracht. CC's per-Iter-Subsession hat `db:apply-override -- --batch=ssot-w40k-NNN` während des Loops nicht ausgeführt — die 50 neuen Bücher liegen heute als `works`/`book_details`/`work_*` Rows gegen das **Resolver-Set aus Brief 072** (`work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`). Damit fallen die neuen 011..015-Surface-Forms heute überwiegend in den `book_details.notes`-Surface-Forms-Block; Detail-Page rendert für die 50 neuen Bücher dünn — exakt das erwartete Verhalten an der natural-Resolver-Pause aus Brief 061. Audit-Cockpit (Brief 073) ist verfügbar (`/buecher?audit=drift,gap,ssot,collections`, `/buch/[slug]/audit`) und kann zur Vor- und Nach-Triage des Apply-Sweeps verwendet werden.

**Pipeline-Architektur-Verschiebung (Kontext, nicht Scope dieses Briefs).** Seit dem Brief-061-Standing-Loop wird die Authority-Schicht nicht mehr durch die V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) enriched — eine `claude -p`-Subsession produziert die Override-Datei direkt. Damit sind OQ1 (Sonnet-vs-Haiku-Modell-Switch) und OQ2-(c) (`chaos`-pov_side-Prompt-Härtung) in ihrer ursprünglichen Form gegenstandslos: beide hingen an einer LLM-Pipeline-Reaktivierung, die heute nicht das Eingangs-Tor zur DB ist. Cowork dokumentiert das in einer eigenen Wiki-Hygiene-Session — **dieser Brief ändert weder `src/lib/ingestion/v2/llm/` noch andere Pipeline-Files**.

**Post-072-Faction-Policy aktiv.** Browse-Roots aus `scripts/seed-data/faction-policy.json` (16 Browse-Roots inkl. `heretic_astartes` als 072-Add, plus zwei in 072 promovierte Mid-Knoten-Browse-Roots `adeptus_titanicus` und `officio_assassinorum`); `factions.json` post-072 mit `heretic_astartes`-Mid-Knoten + 7 required + optional `alpha_legion` reparenteten Heresy-Traitor-Legionen, Death-Guard/Emperor's-Children-Lücken-Fix; `seed-resolver-extensions` Faction-Insert ist Upsert; `brain:lint` neue Kategorie "Faction policy". Dieser Brief **erweitert die Policy nicht ad-hoc** — er respektiert die in 070 + 072 entschiedenen Browse-Roots; falls eine in 011..015 neu aufkommende Faction Browse-Root-Status verdient (Cowork-Tendenz: keine — alle neuen Surface-Forms passen unter existierende Browse-Roots), gibt CC im Report eine Empfehlung statt selbst zu promoten.

**Empirische Surface-Form-Verteilung über die dritte 50er-Welle.** Aggregat aus den 5 Override-JSONs (`manual-overrides-ssot-w40k-011.json` … `015.json`); CC führt die exakte Distinct/Total/Direct-Match-Tabelle im Report, der hier aufgeführte Grobeindruck stammt aus Cowork's Triage der Override-Rationales:

| Achse      | Profil                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factions   | Astra-Militarum-Sub-Faction-Welle (Volpone Bluebloods / Antari Rifles / Kasrkin / Catachan Jungle Fighters / Death Korps of Krieg inkl. 472nd Siege Regiment / Cadian Shock Troops als named-regiment-tier); Sororitas-Sub-Factions (Order of the Last Candle / Order of Our Martyred Lady); Astartes-Loyalist-Sub-Factions (Scythes of the Emperor / Carcharodons / Flesh Tearers); Aeldari-Sub-Factions (Aeldari Corsairs / Starsplinters); Necron-Sub-Factions (Triarch Praetorians); **Watson-Trilogy historical-canon-layer (Squats / Hydra)**; Misc (Navis Nobilite / House Brobantis als Navigator-House, Adeptus Astartes-Mentors / Imperial Knights ggf. schon in 072 gelandet — CC prüft Idempotenz). |
| Locations  | Imperium-Nihilus-Frame-Locations (Bale Stars / Candleworld / Sotha / Ophelia VII / Vorlese / Galimo Prime), Necron-Tomb-Worlds (Cepharil-Serenade / Solemnace / Orymous), 9th-Edition-Lore-Frames (Pariah Nexus / Silent Kingdom / Hephaesto), Cadian-Legacy-Welt (Attruso aus *Longshot*), Watson-Trilogy-Welten (Stalinvast / Sabulorb / Webway-on-page), Eldar-City (Commorragh / Dark City), benannte Vessels (Ithraca's Vengeance / Casus Belli / Steel Tread aus 012 als named-vehicle-as-location, recurring in *Demolisher* 015). |
| Characters | Severina Raine, Asenath Hyades, Belisarius Cawl (cross-batch, drei Bücher), Tetrarch Felix, Lady Chettamandey Brobantis, Sister Evangeline, Inquisitor Ahri Ravara, Ephrael Stern, Kyganil, Ufthak Blackhawk, Trazyn the Infinite, Orikan the Diviner, Te Kahurangi, Chaplain Tangata Manu, Captain Aeschelus, Hadeya Etsul (cross-batch 012 → 015), Ursula Creed, Ursarkar Creed, Astor Sabbathiel, Jaq Draco (Watson-Trilogy-recurring, 3 Bücher), Meh'Lindi, Vitali Googol, Grimm, plus Long-Tail-POVs aus jedem der 50 Bücher. |

**Cross-Batch-Continuity-Status.** Die dritte Welle bringt drei completed-trilogy-arcs in die Authority-Schicht: Cawl-Trilogy (`The Great Work` 011 → `Genefather` 014 → `Archmagos` 015), Watson-Inquisition-War-Trilogy (`Inquisitor / Draco` + `Harlequin` + `Chaos Child` alle in 015 en bloc), plus Cadian-Legacy-Mini-Arc innerhalb 014 (`Longshot` → `Creed: Ashes of Cadia` → `Fall of Cadia`). `The Green Tide` (015) ist ein Omnibus, dessen Constituents im Lore teils schon als Roster-Works existieren (`Catachan Devil`, W40K-0118; `Warboss`, W40K-0128; `Iron Resolve`, W40K-0249; `Prisoners of Waaagh!`, W40K-0565), teils aber noch nicht als eigene Works modelliert sind (Short Stories). **Im `book-roster.json` sind heute 0 `roster.collections`-Rows mit W40K-0147 als parent** (siehe Erratum-Punkt 4: Roster-Note „individual contents not explicitly recoverable"). Der 072-`applyCollections.external_book_id`-Refactor ist also in dieser Welle nicht über Green Tide testbar; CC dokumentiert den Pre-/Post-Apply-`work_collections`-Count, hält Green Tide in `collection-gaps.json` fest und listet etwaige andere Omnibus-Entries mit echten Roster-Rows. Plus mehrere named-vehicle-cross-batch-Continuities (Steel Tread 012 → Demolisher 015, Ithraca's Vengeance 011-internal).

**Roster-Cleanup-Lücken sichtbar.** Loop-Log dokumentiert 5 `data_conflict` flags für missing roster authors (W40K-0141 Mike Brooks / W40K-0142 Jonathan D. Beer / W40K-0143 Robbie MacNiven / W40K-0146 Rhuairidh James / W40K-0147 multi-author Green-Tide-Omnibus). Diese Author-Fixes sind **out of scope** für diesen Brief — Roster-Cleanup ist Maintainer-Excel-Workflow per Brief-061-Konvention. Ausnahme in 074: CC darf ein neues `scripts/seed-data/collection-gaps.json`-Ledger anlegen/erweitern, um unvollständige Sammelwerke persistent zu tracken; `book-roster.json` selbst bleibt unangetastet und `npm run import:ssot-roster` wird nicht ausgeführt.

**Sequenz zu offenen Briefs.** Brief 061 (Standing-Loop) bleibt paused bei 150 Büchern (`ssot-w40k-016` würde per Pre-Check loud stoppen, weil 150 % 50 == 0); nach Resolver-Apply darf Maintainer den Loop-Driver (Brief 071, jetzt `implemented` post-PR #54) für die nächste 50er-Welle erneut triggern. Audit-Cockpit (Brief 073, `implemented`) ist verfügbar und wird durch dieses Brief zum ersten Mal **mit echtem Drift-Material gefüttert** — CC darf (soll!) zur Vor-/Nach-Apply-Sanity einen Cockpit-Tour-Pass auf `/buecher?audit=drift,gap` und `/buch/<slug>/audit` für 3-5 Smoke-Bücher aus 011..015 machen und die Beobachtung im Report festhalten.

## Constraints

### Reference-Daten-Extensions

#### `scripts/seed-data/factions.json` — Erweitern

CC aggregiert die Surface-Forms aus den 5 Override-Files (Schwelle ≥ 2 plus eine in den Notes enumerierte Liste lore-iconischer freq=1-Promotionen analog 072) und erstellt die korrespondierenden Faction-Rows. Cowork legt hier nur die **tricky Architektur-Entscheidungen** fest, die keine reine Aggregations-Frage sind:

**(a) Watson-Trilogy als historical-canon-layer.** Die in `ssot-w40k-015` enthaltenen drei 1990-1995-Watson-Novels (`Inquisitor / Draco`, `Harlequin`, `Chaos Child`) bringen Surface-Forms ein, die die moderne Codex-Taxonomie so nicht trägt. **Behandle sie als distinct historical-canon-layer — nicht auf moderne Surface-Forms kollabieren:**

| Surface-Form        | Vorgeschlagene ID  | Parent / Alignment-Note                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Squats              | `squats`           | parent=`imperium`, alignment=`imperium`. Abhuman-Strain der menschlichen Spezies, Imperium-loyal (Lexicanum-Lore). Single-Row, kein Sub-Faction-Split (zu wenig Material). CC's Call: Browse-Root-Status oder nicht? Cowork-Tendenz: **nicht** Browse-Root — bleibt unter `imperium`-Browse-Root.                                                                                       |
| Hydra (rogue Inquisition cabal) | `hydra_cabal` | parent=`inquisition`, alignment=`imperium` mit **Caveat im `tone`-Feld**: ggf. `tone: "rogue"` oder `tone: "heretical"`, falls die Tone-Feld-Konvention das erlaubt — sonst per `tags` (`['rogue_cabal', 'historical_canon_layer']`) markieren. **Bewusst NICHT auf `chaos` aufhängen** — die Trilogy-Logik ist "rogue cabal innerhalb der Inquisition", nicht "Chaos-Servant"; Surface-form-treue zur Watson-Trilogy-Lore. Falls `inquisition`-ID heute nicht existiert (Resolver hat aktuell `inquisition` schon — siehe `factions.json` post-070/072), als parent verwenden. |

Beide Rows tragen die historical-canon-layer-Markierung im `tone`-Feld (Schema-Tatsache aus Erratum-Punkt 1: `factions` hat `tone` + `glyph`, kein `tags`-Feld; `SeedFaction` kennt nur `tone`/`glyph`/`alignment`/`parent`/`name`/`id`). Konvention: `tone: 'historical_canon_layer'` als Single-Token-Marker; falls CC eine bessere Konvention findet, im Report begründen — **kein Schema-Touch**. Begründung: die Watson-Trilogy ist im Setting-Layer der 1990er Black-Library, nicht in der post-2017-Codex-Taxonomie. Reader, die später die Trilogy lesen, brauchen die Surface-Forms; Maintainer, die später am Cockpit triagen, wollen den Layer markiert sehen.

**(b) Astra-Militarum-named-regiment-tier.** 011..015 bringt eine konzentrierte Welle von benannten Regimentern: Antari Rifles (011, `Honourbound`), Volpone Bluebloods (012, `Volpone Glory`), Catachan Jungle Fighters (012, `Catachan Devil` + 015 Omnibus), Death Korps of Krieg (012, `Krieg`; 015, `Death Rider`, davon das 472nd Siege Regiment als sub-tier), Cadian Shock Troops (013/014, mehrere). **Cowork-Entscheidung: alle als Sub-Factions unter `astra_militarum`** mit alignment=`imperium` explizit. **Named-Sub-Regiment-Tier (z. B. "472nd Siege Regiment") NICHT als eigene Faction-Row** — zu granular, zu wenig recurring; bleibt im `book_details.notes`-Surface-Forms-Block. Falls CC eine spezifische Sub-Sub-Faction für lore-load-bearing hält (z. B. "Eleventh Antari Rifles" als single recurring named regiment), darf er sie als optional row vorschlagen und Cowork validiert im Folge-Brief.

**(c) Sororitas-Order-Sub-Factions.** `Order of the Last Candle` (011, `Requiem Infernal`), `Order of Our Martyred Lady` (011, `Mark of Faith` + `Ephrael Stern: The Heretic Saint`) plus weitere die im Aggregation auftauchen. **Sub-Faction unter `sisters_of_battle`** (canonical-ID in `factions.json:203`; Surface-Form „Adepta Sororitas" läuft über `faction-aliases.json` auf `sisters_of_battle`), alignment=`imperium` explizit. Single-row pro Order.

**(d) Astartes-Loyalist-Sub-Factions.** `Scythes of the Emperor` (011, `Belisarius Cawl: The Great Work` + 015, `Archmagos`), `Carcharodons` / `Space Sharks` (011, `Silent Hunters`), `Flesh Tearers` (013) — alle als Sub-Faction unter `adeptus_astartes`, alignment=`imperium` explizit (Inferenz-Trap-Note aus 072 gilt: explizites alignment-Feld setzen, weil `parent: "adeptus_astartes"` nicht direkt auf `imperium` matcht). Double-Surface-Form `Carcharodons` + `Space Sharks`: eine canonical ID (Cowork-Tendenz: `carcharodons`), die andere als Alias.

**(e) Aeldari-Sub-Factions.** `Aeldari Corsairs` (015, `Voidscarred`), `Starsplinters` (015, sub-band der Corsairs in `Voidscarred`). Beide als Sub-Faction unter `eldar` (canonical-ID in `factions.json:177`; Surface-Forms „Aeldari" / „Dark Eldar" / „Drukhari" laufen über `faction-aliases.json` auf `eldar`), oder unter `aeldari_corsairs` als Mid-Knoten, falls Starsplinters lore-load-bearing genug ist — Cowork-Tendenz: beide als direkte Sub-Factions unter `eldar`, single-row pro. `Harlequins` (015, `Harlequin` + 011 `Ephrael Stern` Kyganil-supporting) — sollte schon existieren post-072; CC prüft Idempotenz. `Ynnari` / `Ynnead` (011, `Ephrael Stern` — Yvraine als Herald) als Sub-Faction unter `eldar` falls noch nicht da.

**(f) Necron-Sub-Factions.** `Triarch Praetorians` (015, `Tomb World`) als Sub-Faction unter `necrons`, alignment explizit (Cowork-Tendenz: `alignment: "neutral"` weil Necrons lore-mäßig nicht Imperium / nicht Chaos; CC darf `xenos` setzen falls die `alignment`-Enum-Werte das tragen — Konvention aus 070-Policy beachten). `Triarch Council` (011, `Indomitus` — mentioned, not on-page-primary; ggf. nur als Alias). Generic `Necrons` sollte existieren.

**(g) Navis-Nobilite & Co.** `Navis Nobilite` (011, `Rites of Passage` + 015 Watson-Trilogy retinue-Vitali-Googol). `House Brobantis` (011) als Sub-Faction unter `navis_nobilite` falls Lore-load-bearing — Cowork-Tendenz: ja, weil 011 ist die erste Authority-Layer-Navigator-Primary-POV-Novel und House Brobantis ist die anchor surface form; CC darf widersprechen falls die freq sich nicht trägt.

**(h) Misc.** Imperial Knights / Knight Houses / Skitarii-Maniples — sollten teilweise schon in 072 gelandet sein (072 hat `imperial_knights` + `skitarii` als Mechanicus-Sub-Faction angelegt). CC prüft Idempotenz, ergänzt nur was wirklich fehlt. Falls 011..015 weitere Knight-Households (z. B. House Vyronii / House Cerberys / etc. — freq prüfen) bringt, als Sub-Faction unter `imperial_knights`.

**Reparent-Disziplin / Alignment-Backfill.** Wie in 072: Sub-Factions, deren parent NICHT direkt eine Browse-Root-Faction mit `inferAlignmentFromTree`-direct-match ist, brauchen explizit `"alignment"`-Feld. Cowork-Erwartung: für jede neue Sub-Faction-Row trägt der Diff das alignment explizit ein.

**Was Cowork NICHT entscheidet** (CC's Judgment):

- Genaue ID-Snake-Case-Form (z. B. `aeldari_corsairs` vs `aeldari_corsair_warhost` — CC's Call basierend auf Lore-Sample im Override-File).
- Exakte freq-Schwelle für lore-iconic-Promotionen (Cowork-Default ≥ 2 strict + lore-iconic-Liste analog 072; CC darf 1-2 zusätzliche freq=1-Rows vorschlagen falls Lore-Anker eindeutig).
- Tone / Glyph für neue Rows — wo CC sich unsicher ist, lieber `null` lassen als raten; Maintainer kann später im Atlas / Cockpit editieren.

#### `scripts/seed-data/locations.json` — Erweitern

CC aggregiert nach demselben Muster wie 072: ≥ 2 plus lore-iconic-freq=1-Liste. Cowork-Tendenz:

- **Imperium-Nihilus-Frame-Locations** (Bale Stars / Candleworld / Sotha / Ophelia VII / Pariah Nexus / Silent Kingdom / Hephaesto / Vorlese / Galimo Prime / Attruso / Stalinvast / Sabulorb) als `locations`-Rows mit `gx: null`, `gy: null`, `tags: ['era_frame']` oder analog (siehe 072-Konvention).
- **Necron-Tomb-Worlds** (Cepharil/Serenade / Solemnace / Orymous) — Single-Row pro World, gx/gy entweder von Lexicanum-Map-Daten (CC's Call ob er das im Brief findet) oder null.
- **Watson-Trilogy-Locations.** Nur **Stalinvast + Sabulorb** sind neue Rows in 074 — beide mit `tags: ['historical_canon_layer']` (Schema-Tatsache: `locations.tags` ist supported). **Webway** und **Commorragh** existieren schon (`locations.json:654` / `:688`) und bleiben in 074 untagged — siehe Erratum-Punkt 3: `seedLocations` ist insert-only außer dem `great_rift`-Sonderfall; kein zweiter In-Place-Update-Pfad in diesem Brief. Die historical-canon-layer-Information für Webway/Commorragh lebt für jetzt über die Override-Files (Surface-Forms-Block); systematischer Tag-Update-Pfad ist Future-Brief-Material.
- **Named-Vehicles-as-Locations** (Ithraca's Vengeance / Casus Belli / Steel Tread / 901st-Tactical-Wing-Carrier wenn benannt) — `tags: ['vessel']` per 072-Konvention. `Steel Tread` ist bereits in 072 angelegt (cross-batch-recurring 012 → 015) — CC prüft Idempotenz.
- **Eldar-Cities** (Commorragh / Dark City — single canonical, andere als Alias).

#### `scripts/seed-data/characters.json` — Erweitern

CC aggregiert nach 072-Muster (≥ 2 + lore-iconic-freq=1-Liste). Cowork legt hier nur den **Cross-Batch-Continuity-Sonderfall** fest:

- **Belisarius Cawl** existiert schon post-072 als character-row (cross-batch 003 oder analog). Drei Appearances (011, 014, 015) — keine row-Änderung nötig, aber CC prüft, ob die Junctions korrekt cross-batch verlinken.
- **Hadeya Etsul** (012, `Steel Tread` — Cadian-Tank-Crew-POV + 015, `Demolisher` — Sequel). Single character-row, role=`pov` in beiden Büchern.
- **Watson-Trilogy-retinue** (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm) — drei Bücher (alle in 015) recurring. Single row pro character, historical-canon-layer-Marker im `notes`-Feld (Schema-Tatsache aus Erratum-Punkt 1: `characters` hat `notes`, kein `tags`-Feld). Kompakte Konvention: `notes: 'historical_canon_layer; Watson Inquisition-War Trilogy retinue'`. **Belisarius Cawl** dagegen ist moderne Codex-Lore — `notes: 'Cawl trilogy anchor'` **ohne** historical-canon-Marker.
- **Iconic-Singletons mit klarer Lore-Anker-Funktion** (Severina Raine in `Honourbound`, Asenath Hyades in `Requiem Infernal`, Lady Chettamandey Brobantis in `Rites of Passage`, Ephrael Stern, Inquisitor Ahri Ravara, Trazyn the Infinite, Orikan the Diviner, Te Kahurangi, Chaplain Tangata Manu, Captain Aeschelus, Ursula Creed, Ursarkar Creed, Astor Sabbathiel) — Cowork-Tendenz: alle als lore-iconic-freq=1-Promotion. CC darf bei Zweifel weglassen und im Report flagged "Cowork validiere im Folge-Brief".

#### Aliases — Erweitern

`scripts/seed-data/faction-aliases.json` + `location-aliases.json` + `character-aliases.json` (CC kennt die Pfade aus 072-impl-Report).

- **Faction:** `Space Sharks` → `carcharodons`, `Aeldari Corsairs Warhost` → `aeldari_corsairs` (falls die exakte Surface-Form so im Override-File auftaucht), `Death Korps` → `death_korps_of_krieg` (kurze + lange Form), `Hydra` (allein, ohne "Cabal"-Suffix) → `hydra_cabal`. **Achsenspezifisch:** Alias-Ziele werden in `seed-resolver-extensions` (`scripts/seed-resolver-extensions.ts:215`-Bereich) gegen die jeweilige Achse validiert; Faction-Aliase müssen Faction-IDs treffen, Location-Aliase müssen Location-IDs treffen. Cross-Achsen-Aliase (z. B. „Dark City" → `commorragh` als Faction-Eintrag) fail'n die Validation — siehe Location-Bullet unten.
- **Location:** `Steel Tread` als Vessel sollte schon existieren post-072; CC prüft. `Imperium Nihilus` plus `Dark Imperium` → falls beide als Surface-Form auftauchen, eine canonical. `Dark City` → `commorragh` (Surface-Form aus Watson-Trilogy + 011-Carcharodons-Commorragh-Pursuit; canonical-ID `commorragh` lebt in `locations.json:688`).
- **Character:** Die Watson-Trilogy-Retinue kann Multi-Spelling haben (z. B. `Jaq Draco` vs `Jaq` allein vs `Inquisitor Draco`); CC entscheidet welche canonical + welche Alias.

### `seed-resolver-extensions` & Apply-Pfad

- `npm run db:seed-resolver-extensions` re-runned (Upsert-Pfad — keine Schema-Migration). Sollte die neuen factions / locations / characters in die Reference-Tables schreiben und die Aliase-JSONs neu laden. Wenn CC strukturelle Änderungen am Skript erkennt (z. B. weil ein bestimmter Edge-Case heute nicht durchläuft), im Report flaggen — **nicht den Apply-Pfad umbauen ohne Cowork-Validation**.
- `npm run db:apply-override -- --batch=ssot-w40k-NNN` für `NNN ∈ {001, 002, ..., 015}` (Re-Apply alle, weil die neuen Reference-Rows + Aliase auch in den älteren Batches Drift abbauen können — analog 072-Re-Apply-001..010).
- Status-Pass für `work_collections` (global): CC reportet Pre-/Post-Apply-Count und dokumentiert separat den Status für The Green Tide (W40K-0147) — Erwartung: **0 zusätzliche Rows** wegen `roster.collections`-Lücke (siehe Erratum-Punkt 4: `applyCollections` zieht ausschließlich aus `roster.collections`, `scripts/apply-override.ts:796`-Bereich). Zusätzlich legt/erweitert CC `scripts/seed-data/collection-gaps.json` mit einem Green-Tide-Eintrag. Minimal-Schema für den Eintrag:

```json
{
  "collectionExternalId": "W40K-0147",
  "title": "The Green Tide",
  "status": "needs_constituent_roster_entries",
  "knownExistingConstituents": ["W40K-0128", "W40K-0118", "W40K-0249", "W40K-0565"],
  "knownMissingConstituents": [
    "Where Dere's Da Warp Dere's a Way",
    "Painboyz",
    "Mad Dok",
    "The Enemy of My Enemy"
  ],
  "note": "Keep omnibus as a normal work; defer complete work_collections until missing short-story works/roster rows are modeled."
}
```

Falls CC beim Lesen der Green-Tide-Override/Sources weitere Short-Story-Constituents findet, ergänzt er `knownMissingConstituents` und dokumentiert die Abweichung im Report. Falls 011..015 andere Omnibus-Entries enthalten, deren Constituents echte `roster.collections`-Rows haben, ist DAS der reale Cross-Batch-Stresstest in dieser Welle — CC darf den entdecken und dokumentieren, statt ihn vorzuschreiben.

### Smoke-Slugs

CC führt nach dem Re-Apply 5-7 Smoke-Slug-Lookups durch (`SELECT * FROM works w LEFT JOIN ... WHERE w.slug = ?`) und reportet pro Slug die Counts `work_factions / work_locations / work_characters`. Cowork-Vorschlagsliste (CC darf abweichen):

- `honourbound` (011) — Severina Raine + Antari Rifles + Bale Stars
- `the-infinite-and-the-divine` (011) — Trazyn / Orikan + Cepharil + Solemnace
- `brutal-kunnin` (011) — Ufthak Blackhawk + Orks + Hephaesto
- `krieg` (012) — Death Korps named-regiment
- `archmagos` (015) — Cawl-Trilogy-completion, Cross-Batch-Cawl-recurring
- `inquisitor-draco` (015) — Watson-Trilogy-founding, Squats / Hydra / Ordo Malleus
- `voidscarred` (015) — Aeldari Corsairs primary + first authority-layer entry
- `the-green-tide` (015) — Omnibus mit Collection-Gap-Ledger-Eintrag (siehe Erratum-Punkt 4); CC verifiziert im Smoke, dass das Buch normal resolved wird, aber weiterhin 0 `work_collections`-Rows aus partiellen Constituents erhält.

### Counts-Report (Disziplin-Pflicht aus 072-Lesson)

Im Report muss CC die folgende Counts-Tabelle führen — **als echte Tabelle, nicht Prosa**:

| Phase                         | `work_factions` | `work_locations` | `work_characters` | `work_collections` |
| ----------------------------- | --------------- | ---------------- | ----------------- | ------------------ |
| Pre-Apply (vor diesem Brief)  |                 |                  |                   |                    |
| Per-Batch 011                 |                 |                  |                   |                    |
| Per-Batch 012                 |                 |                  |                   |                    |
| Per-Batch 013                 |                 |                  |                   |                    |
| Per-Batch 014                 |                 |                  |                   |                    |
| Per-Batch 015                 |                 |                  |                   |                    |
| Post-Re-Apply 001..015 (total)|                 |                  |                   |                    |

Plus Coverage-Tabelle (überspannt Reference-Counts vs. Junction-Counts pro Achse, analog 072-Schluss-Tabelle).

### Audit-Cockpit-Vor-Tour (neu in diesem Brief)

CC führt **vor** dem Apply-Sweep einen Cockpit-Triage-Pass und reportet die Befunde als 4-6-Bullet-Liste im Report (nicht im commit-Log, im Report). Konkret:

1. `/buecher?audit=drift` — welche der 011..015-Bücher zeigen Drift (raw_name ≠ canonical) heute, mit dem alten 072-Resolver-Set?
2. `/buecher?audit=gap` — welche zeigen Junction-Gap (`work_factions = 0` o.ä.)?
3. `/buch/<slug>/audit` für 2-3 der drift-/gap-Bücher — welche raw_names sind die häufigsten "first-authority-layer-surface-form"-Kandidaten?
4. **Nach** dem Re-Apply derselbe Pass — wie viel Drift/Gap ist gelöst, wieviel bleibt? Wenn Drift/Gap-Restmenge auffällig (z. B. ≥ 10 Bücher), CC flagged im Report.

Dieser Vor-/Nach-Pass ist die erste echte Belastungsprobe des Brief-073-Cockpits an realem Drift-Material — Cowork erwartet ein kleines Quality-Feedback im Report (z. B. "Cockpit fehlt X" / "Audit-Pille Y verhält sich unerwartet" — falls nichts auffällt, eine Zeile reicht).

## Out of scope

- **Schema-Migration.** Keine Drizzle-Schema-Änderungen, keine `db:generate`-Runs, keine neue Migration-Datei.
- **UI-Arbeit.** Audit-Cockpit (Brief 073) wird nicht erweitert, `/buch/[slug]` (public) nicht angefasst, keine neuen Routes, keine Komponenten-Änderungen außerhalb der zwingenden Apply-Pfad-Logik. CC nutzt das Cockpit nur als Read-only-Tool für Triage; Quality-Feedback dazu landet im Report, nicht in einem Code-Patch.
- **`value_outside_vocabulary`-Promotionen.** Das Loop-Log dokumentiert 9 Tag-Kandidaten (`commissar` / `inquisitor` / `squat` / `corsair` / `triarch_praetorian` / `valkyrie_pilot` / `webway_journey` / `omnibus_with_prior_constituents` / `cabal_inquisition` / `rogue_inquisition` / `cw_canon_divergence`). **Keine davon in diesem Brief promoten.** Vokabular-Erweiterung ist eine separate Cowork-Hygiene-Session (post-OQ2-(a)-Close-Note: laufende Tag-Triage am Cockpit, nicht einmaliger Architektur-Brief). Workaround-Konvention bleibt analog Cain/Gaunt/Krieg-Cases: `guardsman` für Commissar / Krieg / Death-Rider-Hesh; `pilot` ist heute noch nicht promoted und nicht in dieser Welle relevant für die Junction-Counts — die fünf Aeronautica-Imperialis-Pilot-Bücher bleiben über `astra_militarum`-Junction + `book_details.notes` repräsentiert. CC darf die Kandidaten-Liste im Report als "Hand-off an Vokabular-Hygiene" festhalten, aber nicht im seed-data committen.
- **V2-LLM-Pipeline-Touches.** `src/lib/ingestion/v2/llm/` und Umgebung bleiben unangetastet. Die Modell-String / Validatoren / Web-Search-Konfiguration sind in der aktuellen CC-Direct-Curation-Welt nicht das Eingangs-Tor zur DB; Wiki-Update dazu ist eine separate Cowork-Session. **Falls CC während der Arbeit `src/lib/ingestion/v2/llm/*` oder `src/lib/ingestion/v2/sources/*.ts` zu ändern beginnt → STOP und im Report flaggen.**
- **HH-Domain.** `ssot-hh-NNN` ist noch nicht im Loop drin (0 HH-Bücher applied); HH-Domain-spezifische Resolver-Arbeit ist out of scope für diesen Brief.
- **Brief-061-Loop-Re-Trigger.** Dieser Brief lässt den Loop pausiert. Re-Trigger für `ssot-w40k-016` ist Maintainer-Entscheidung nach Resolver-Apply, getrennter Session-Start mit Loop-Driver-Aufruf.
- **`brain/wiki/*`-Updates.** Cowork pflegt Wiki-Pages (project-state.md, pipeline-state.md, open-questions.md, ADR für CC-Direct-Curation) in einer eigenen Session-End-Routine. CC committet keine Brain-Edits in diesem Brief, **außer** wenn `brain:lint --no-write` einen Blocker wirft, der einen Edit erzwingt — dann analog 072-Disziplin-Note (im Report flaggen + nur die minimal nötige Edit).
- **Roster-Cleanup.** Die 5 `data_conflict`-Author-Lücken aus 011/015 bleiben im Excel-Maintainer-Workflow; CC touched `book-roster.json` nicht und führt `npm run import:ssot-roster` nicht aus. Ausnahme: `scripts/seed-data/collection-gaps.json` ist ausdrücklich in scope, weil es ein Ledger für bekannte unvollständige Sammelwerke ist und keine SSOT-Roster-Regeneration ersetzt.
- **`.git/config`-Sandbox-Cleanup.** Cowork hat während dieser Session den `.git/config` lokal um eine abgeschnittene `tmp/loop-driver-smoke-001`-Section gekürzt (Worktree-Fix). Das ist **nicht** in den Brief eingearbeitet — wenn CC den `.git/config`-Stand anders findet als erwartet, regenerieren wie nötig.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Eigener Branch (Cowork-Vorschlag: `session-074-resolver-batch-3`); kein `main`-Commit, kein Rebase auf `session-071-loop-driver` oder andere offene Branches.
- [ ] `scripts/seed-data/factions.json` enthält die in dieser Welle belastbar-häufigen Sub-Factions inkl. der vier tricky-Architektur-Entscheidungs-Blöcke (Watson-Trilogy historical-canon-layer mit `squats` + `hydra_cabal`; Astra-Militarum-named-regiment-tier; Sororitas-Order-Sub-Factions; Astartes-Loyalist-Sub-Factions inkl. Aeldari/Necron-Sub-Factions). Alignment-Backfill-Disziplin wie 072 (explizit, nicht inferred). Idempotenz mit post-072-Rows respektiert.
- [ ] `scripts/seed-data/locations.json` erweitert (Imperium-Nihilus-Frames mit `era_frame`-Tag, Necron-Tomb-Worlds, Watson-Trilogy-Locations mit `historical_canon_layer`-Tag, Named-Vehicles mit `vessel`-Tag).
- [ ] `scripts/seed-data/characters.json` erweitert; Cross-Batch-Continuity (Cawl × 3 / Hadeya × 2 / Watson-Retinue × 3) korrekt repräsentiert.
- [ ] Aliases-JSONs erweitert (Faction / Location / Character).
- [ ] `npm run db:seed-resolver-extensions` läuft grün; im Report die zusätzlichen Reference-Counts (factions/locations/characters/aliases delta pro Achse).
- [ ] `npm run db:apply-override -- --batch=ssot-w40k-NNN` für 001..015 läuft grün.
- [ ] Counts-Tabelle (Pre-Apply / Per-Batch 011..015 / Post-Re-Apply 001..015) als echte Markdown-Tabelle im Report. Plus Coverage-Tabelle analog 072.
- [ ] Status-Pass für `work_collections`: CC reportet Pre-/Post-Apply-Count global. Separater Status-Bullet für The Green Tide (W40K-0147): erwartet 0 zusätzliche Rows wegen `roster.collections`-Lücke (siehe Erratum-Punkt 4); CC bestätigt im Report. Falls 011..015 andere Omnibus-Entries mit echten `roster.collections`-Rows enthalten, sind DAS die realen Cross-Batch-Stresstests — CC darf entdecken + reporten.
- [ ] `scripts/seed-data/collection-gaps.json` existiert und enthält einen Green-Tide-Eintrag (`collectionExternalId=W40K-0147`, `status=needs_constituent_roster_entries`, bekannte existierende Constituents `W40K-0128`, `W40K-0118`, `W40K-0249`, `W40K-0565`, bekannte fehlende Short-Story-Constituents als Titelstrings). Kein `book-roster.json`-Patch in diesem Brief.
- [ ] 5-7 Smoke-Slugs aus 011..015 reported mit Junction-Counts.
- [ ] Audit-Cockpit-Vor-Tour Befunde als 4-6-Bullet-Liste im Report (vor + nach Apply).
- [ ] `npm run lint` pass.
- [ ] `npm run typecheck` pass (alias `tsc --noEmit`).
- [ ] `npm run brain:lint -- --no-write` pass.
- [ ] PR vorbereitet (CC kann lokal `gh pr create --fill --base main` aufrufen oder die PR-URL im Report dokumentieren); **kein Merge** durch CC — Maintainer-Review.

## Open questions

- **Collection-Gap-Resolve-Pass** (Hand-off, neu post-Maintainer-Review). The Green Tide (W40K-0147) hat im Roster die Note „individual contents not explicitly recoverable" und 0 `roster.collections`-Rows mit W40K-0147 als parent. 074 legt deshalb `scripts/seed-data/collection-gaps.json` als persistenten Ledger an, statt partielle `work_collections`-Rows zu schreiben. Später, wenn fehlende Short-Story-Works/Roster-Rows modelliert sind, zieht Cowork einen Resolve-Pass über alle Ledger-Einträge: fehlende Constituents ergänzen, `roster.collections` vollständig schreiben, dann Re-Apply. Falls 011..015 weitere Omnibus-Entries mit ähnlicher Lücke enthalten (CC's Aggregation), im selben Ledger listen.
- **Watson-Trilogy-Layer-Default OK?** Cowork hat `squats` (existiert schon, ggf. tone-Update) + `hydra_cabal` (neue Faction, parent=`inquisition`, `tone: 'historical_canon_layer'`) entschieden. Falls CC während der Aggregation einen stark abweichenden Vorschlag findet (z. B. `squats` als eigener Browse-Root weil mehrere recurring Squat-Surface-Forms), im Report begründen — Cowork validiert im Folge-Brief.
- **`triarch_praetorians`-Alignment.** Cowork-Tendenz `neutral`; falls die `alignment`-Enum-Werte das nicht tragen (CC's Code-Pfad-Lookup), `xenos` falls existent, sonst CC's Call. Im Report kurz dokumentieren.
- **Named-Sub-Regiment-Promotion-Schwelle.** Cowork-Tendenz: nicht aufnehmen (zu granular). Falls CC bei einem oder zwei Regimentern (z. B. "Eleventh Antari Rifles") starkes Lore-Recurring-Argument findet, optional vorschlagen und Cowork validiert. Default: weglassen.
- **Webway-as-Location-Treatment.** Cowork-Tendenz: `webway` als Location mit `eldar_internal_layer`-Tag. Falls CC findet, dass das in der Datenstruktur quetscht (Webway ist topologisch kein Planet), darf er widersprechen und im Report ein alternativer Plan vorschlagen.
- **Cockpit-Quality-Feedback.** Was hat das Cockpit gut gemacht / wo fehlt etwas / wo ist die UX im Audit-Modus unklar gewesen? 1-3 Sätze reichen.

## Notes

**Cowork-Triage der Override-Files 011..015 (Grobeindruck).** Diese Notes sind nicht canonical — CC's Aggregation ist die Wahrheit; Cowork zeigt nur, wie der Brief strukturiert ist:

- **011 (W40K-0101..0110, 2019-2020 cluster).** Heavy female-POV (5 von 10), Imperium-Nihilus-Frame, erste Adepta-Sororitas / Navis-Nobilite / Carcharodons-as-primary, Cawl-Trilogy-opener (`The Great Work`). Surface-form-Pile: Sororitas-Orders, Imperium-Nihilus-Locations (Bale Stars, Candleworld, Sotha, Ophelia VII), Navigator-Houses, Carcharodons / Space Sharks.
- **012 (W40K-0111..0120, 2021-2022 cluster).** Astra-Militarum-named-regiment-Welle (Volpone Bluebloods, Catachan, Death Korps, Krieg-named-regiment), Adeptus-Mechanicus / Genestealer-Cult dual-POV (`Day of Ascension`), Sororitas-Pilgrimage (`Triumph of Saint Katherine`), Maelstrom-Raider (`Huron Blackheart`), Krieg-Standalone, Cadian-Tank-Crew (`Steel Tread` mit Hadeya Etsul + Croatoas + Steel-Tread-named-vehicle), Catachan-Standalone, Black-Templars-Helbrecht-Primaris-Crusade, Imperial-Knights-Psyker-Mystery (`Witchbringer`).
- **013 (W40K-0121..0130, 2022-2023 cluster).** Indomitus-Crusade / Arks-of-Omen-lead-in. First Authority-Layer Rogue-Trader (`Outgunned`, `Void King`), T'au-Primary (`Shadowsun`), Kasrkin, Flesh-Tearers, Daemon-Primarch-Angron-POV (`Angron: The Red Angel`), Lion-El'Jonson-Primarch-POV (`The Lion: Sons of the Forest`), Astor-Sabbathiel-Inquisitor-POV (`Pilgrims of Fire`), Aeronautica-Imperialis-Bomber-Squadron (`Outgunned`), Ork-Warboss-POV (`Warboss` mit Da Genrul + Snaggi Littletoof + Mag Dedfist + Zagnob Thundaskuzz — recurring im 015 Green-Tide-Omnibus).
- **014 (W40K-0131..0140, 2023-2025 cluster).** 10th-Edition-Launch (`Leviathan` Box-Novel), Cadian-Legacy-Mini-Arc (Longshot → Creed: Ashes of Cadia → Fall of Cadia, Ursula Creed mantle vs Ursarkar Creed last-stand), Genefather (Cawl-Trilogy-middle, mit Hadeya Etsul-supporting-tier? CC prüft), Sabbat-Worlds-Revival mini-arc, Fulgrim-Primarch-POV (`Fulgrim: The Perfect Son`). Hadeya Etsul ist cross-batch character von 012 → 015 (Demolisher); Cawl ist 011 → 014 → 015.
- **015 (W40K-0141..0150, 2025-2026 frontier + 1990-1995 Watson founding).** Sieben 2025-2026-Frontier-Releases (Voidscarred Aeldari-Corsairs / Tomb World Triarch-Praetorian-POV / Vagabond Squadron Valkyrie-Squadron / Archmagos Cawl-Trilogy-closer / Demolisher Cadian-Tank-Crew-Sequel / Death Rider Death-Korps-Commissar-POV / The Green Tide Omnibus-mit-Catachan-Devil+Warboss-Constituents) + **drei Watson-Inquisition-War-Trilogy-Bücher en bloc** (W40K-0148 *Inquisitor / Draco* — das erste Warhammer-40K-Roman überhaupt, 1990; W40K-0149 *Harlequin*, 1994; W40K-0150 *Chaos Child*, 1995). Watson-Trilogy bringt **Squats / Hydra-rogue-Inquisition-cabal / Emperor's-Sons-Cosmologie / Webway-on-page-Traversal / pre-modern-Callidus-Temple-register** als historical-canon-layer-Surface-Forms.

**Drei completed-trilogy-arcs-in-authority-layer milestones.** Cawl-Trilogy (modern, 011 → 014 → 015), Watson-Inquisition-War-Trilogy (founding, 015 en bloc), Cadian-Creed-Legacy-Mini-Arc (014 internal). Plus eine Omnibus-mit-prior-authority-layer-Constituents-First (Green Tide 015 referenziert Catachan Devil 012 + Warboss 013).

**Reference-Quellen** (CC darf alle direkt lesen):

- Override-Files: `scripts/seed-data/manual-overrides-ssot-w40k-011.json` … `015.json` (5 Files, alle auf `main`).
- Loop-Log: `sessions/ssot-loop-log.md` Blöcke `## 2026-05-14 · ssot-w40k-011 …` bis `## 2026-05-15 · ⏸ Resolver-Pause bei 150 Büchern`.
- 072-Architektur-Vorlage: `sessions/2026-05-14-072-arch-resolver-batch-2.md` (insb. Reference-Daten-Extensions-Section + Reparent-Disziplin + Cross-Batch-`applyCollections`-Refactor-Spec).
- 072-Implementer-Disziplin-Lessons: `sessions/2026-05-14-072-impl-resolver-batch-2.md` (Pre-Apply-Counts + per-Batch-Counts pflegen!).
- 070-Faction-Policy: `brain/wiki/decisions/faction-policy.md` + `scripts/seed-data/faction-policy.json`.
- 073-Cockpit-Routes: `src/app/buch/[slug]/audit/page.tsx`, `src/app/buecher/AuditPills.tsx`.

**Begründung Brief-Stil.** Cowork hält den Brief intentional kompakter als 072 (kein vollständiges Surface-Form-Listing wie 072's Tabelle für jede neue Faction). Stattdessen: explizite Architektur-Entscheidungen für die tricky Cases (Watson-Trilogy-Layer, Astra-Militarum-named-regiment, Astartes-Loyalist-Sub-Faction-Disziplin), Aggregation-Aufgabe an CC delegiert. Begründung: die Surface-Form-Density-Profile von 011..015 ist breit (50 Bücher × ~10 Surface-Forms-Achse-im-Durchschnitt = ~500 Surface-Forms zu aggregieren); 072-Stil-vollständiges-Listing wäre 1500+ Brief-Zeilen und würde Cowork inhaltlich nicht mehr Sicherheit geben als die Architektur-Entscheidungen plus der Aggregation-Heuristik. Wenn CC während der Arbeit auf einen tricky Case stößt, der Cowork-Validation braucht (z. B. ein wiederkehrender Sub-Sub-Faction-Anwärter, der den ≥-2-Schwelle reißt aber lore-mäßig nicht klar einsortierbar ist), im Report flaggen — nicht raten.
