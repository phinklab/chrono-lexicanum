---
title: Cross-Era-Identitäten — eine Canonical-Row, Era-Surface-Forms als Aliases
type: decision
created: 2026-05-26
updated: 2026-05-27
sources:
  - ../../../sessions/archive/2026-05/2026-05-26-100-arch-resolver-hh.md
  - ../../../sessions/archive/2026-05/2026-05-26-100-impl-resolver-hh.md
  - ../../../sessions/resolver-dossiers/resolver-pass-10-impl-report.md
  - ../../../sessions/resolver-dossiers/resolver-pass-15-impl-report.md
  - ../../../sessions/2026-05-27-102-arch-hh-consolidation-pass.md
  - ../../../sessions/2026-05-27-102-impl-hh-consolidation-pass.md
  - ../../../sessions/resolver-pass-runbook.md
  - ../../../scripts/seed-data/faction-aliases.json
  - ../../../scripts/seed-data/character-aliases.json
related:
  - ./faction-policy.md
  - ./location-policy.md
  - ../pipeline-state.md
  - ../project-state.md
confidence: high
decision-date: 2026-05-26
---

# Cross-Era-Identitäten — eine Canonical-Row, Era-Surface-Forms als Aliases

**Status:** active · **Decided:** 2026-05-26 (Brief 100) · **First wave validated:** 2026-05-26 (Resolver-Pass 10, HH-Bootstrap `ssot-hh-001..002`, PR #105 — 15/20 `drift_works` = Surface-Forms resolven auf eine kanonische W40K-Row; `factionsSkippedRedundant` bleibt für Cross-Era-Hits leer; keine echte Identitäts-Disambig getriggert, kein `## Needs decision`-Stop) · **HH-domain hardened:** 2026-05-27 (Resolver-Pässe 11–15, PR #107 — fünf weitere clean Two-Domain-Pässe in Folge ohne `## Needs decision`-Stop und ohne `factionsSkippedRedundant`-Cross-Era-Hits; die Disziplin trägt über den vollen HH-Korpus, **HH-domain ist datenkomplett — 294/294 HH-Bücher in der DB**) · **HH-domain post-consolidation hardened:** 2026-05-27 (Konsolidierungs-Pass 2 / Brief 102, PR #108 — 1 Cross-Era-Doublette consolidated `merir_astelan → astelan` als chronologisch-pre-ADR-Carryover aus Pass 13; **cross-era-anchor-breach Aggregator-Tripwire = 0 Treffer über alle 18 pinned Surface-Forms** — positive ADR-Validation über sechs HH-Wellen; das eine Cross-Domain-Echo ist Disziplin-Drift im engeren Sinn, kein laufender Drift-Trend) · **Sessions:** [100-arch](../../../sessions/archive/2026-05/2026-05-26-100-arch-resolver-hh.md) + [100-impl](../../../sessions/archive/2026-05/2026-05-26-100-impl-resolver-hh.md) + [resolver-pass-10-impl-report](../../../sessions/resolver-dossiers/resolver-pass-10-impl-report.md) + [resolver-pass-15-impl-report](../../../sessions/resolver-dossiers/resolver-pass-15-impl-report.md) + [102-arch](../../../sessions/2026-05-27-102-arch-hh-consolidation-pass.md) + [102-impl](../../../sessions/2026-05-27-102-impl-hh-consolidation-pass.md)

## Context

W40K-only kannte das Phänomen kaum (der einzige nennenswerte Fall waren die Aeldari-Sub-Splits in Brief 077, gelöst über Mid-Knoten in der Faction-Hierarchie). Mit dem HH-Strang kommt es **serienweise**: dieselbe Faction unter zwei Era-Bezeichnungen (`Luna Wolves` → `Sons of Horus` nach Ullanor; `World Eaters` Pre-Heresy ↔ `World Eaters` Khornate-Sub-Form), dieselbe Person unter Pre-/Post-Heresy-Form (`Kharn` ↔ `Kharn the Betrayer`; `Abaddon` ↔ `Abaddon the Despoiler`; `Magnus` ↔ `Magnus the Red`; `Lucius` ↔ `Lucius the Eternal`). Der Resolver darf die Identität nicht raten — die Modellierung muss explizit gemacht und über alle HH-Wellen konsistent angewendet werden.

Bei Brief 100 stand die Wahl zwischen zwei Modellen: (a) eine Canonical-Row pro Era-Form (z. B. `luna_wolves` + `sons_of_horus`) mit irgendeiner Cross-Era-Verknüpfung, oder (b) eine Canonical-Row pro Identität, Era-Surface-Forms wandern in die existierenden `*-aliases.json`-Sidecars.

## Decision

**Eine kanonische Identität = eine Canonical-Row. Era-spezifische Bezeichnungen wandern in `aliases[]`.**

Drei Regeln, die der Resolver-Pass anwendet:

- **Faction-Renames** (Luna Wolves → Sons of Horus, ähnliche Heresy-Era-Übergänge): die heute existierende Canonical-Row (`sons_of_horus`) ist der Anker; HH-Surface-Forms (`Luna Wolves`) werden in `faction-aliases.json` auf diese Canonical-ID gemappt. **Keine** neue `luna_wolves`-Row.
- **Character-Honor-Title-Splits** (Kharn ↔ Kharn the Betrayer, Abaddon ↔ Abaddon the Despoiler, Magnus ↔ Magnus the Red, Lucius ↔ Lucius the Eternal): die existierende W40K-Canonical-Row (`kharn_the_betrayer` etc.) ist der Anker; HH-Surface-Form (`Kharn`) wird Alias zur W40K-Row. Pre-Heresy-Charaktere ohne W40K-Pendant (`Garviel Loken`, `Nathaniel Garro`, `Tarik Torgaddon`) werden frische Canonical-Rows.
- **Primarchen.** Bestehende Canonical-Rows mit Honor-Titles bleiben Anker (`magnus_the_red`, `ferrus_manus`, `mortarion`, `vulkan`, `roboute_guilliman`); HH-Surface-Forms ohne Title (`Magnus`, `Mortarion`) sind Aliases. Primarchen ohne heutige Row (`Horus`, `Sanguinius`, `Rogal Dorn`, `Lion El'Jonson`, `Leman Russ`, `Lorgar`, `Fulgrim`, `Perturabo`, `Corax`, `Alpharius`, `Konrad Curze`, …) werden frische Canonical-Rows.

**Ausnahme — echte Identitäts-Disambig.** Stößt der Pass auf eine echte Gleichnamigkeit (gleicher Surface-Form, andere Identität — selten, aber denkbar bei generischen Namen wie „Marcus"), `## Needs decision`-Stop in der Phase-Statusdatei. Kein Raten, kein automatischer Alias.

**Surface-Form-Treue bleibt unverändert.** HH-Override-Files tragen die Lore-korrekte Surface-Form („Luna Wolves" bleibt „Luna Wolves" in der Override-Datei) — das Resolving zur Canonical-ID via Alias passiert in Phase 4a (Apply-Layer), nicht in der Override-File.

Operative Spec im Runbook: [`sessions/resolver-pass-runbook.md`](../../../sessions/resolver-pass-runbook.md) §4 (Subsektion „Cross-Era-Identitäten") — selbst-enthalten, ohne Brief-Verweis im operativen Body.

## Why

Die Zeit-Achse (Pre-Heresy → Heresy → Post-Heresy) ist eine **Story-Property**, keine **Identitäts-Property**. Drei konkrete Folgen:

- **Junction-Counts bleiben korrekt.** Eine zweite Canonical-Row für `Luna Wolves` würde die Sons-of-Horus-Junctions künstlich teilen — Bücher aus dem HH-Korridor zählten auf `luna_wolves`, Bücher aus dem Post-Heresy-Korridor auf `sons_of_horus`, und das Audit-Cockpit zerlegt eine Identität in zwei Drift-Cluster. Mit Alias-Modell zählen beide auf dieselbe Row und das Filter-UI rollt korrekt.
- **Brief-098-Konsolidierungs-Pass würde sie eh später wieder zusammenführen.** Der neue Pass-Typ (Cross-Wave-Canonical-Row-Dedup) ist genau dafür gebaut, Dubletten aufzuspüren und zu mergen — eine bewusste Doppel-Anlage wäre ein Anti-Pattern, das ein Maschinerie-Cleanup-Job wegmacht.
- **Audit-Cockpit + Public-Detail-Page rollen korrekt.** Eine Identität = ein Cluster, nicht zwei; der Faction-Filter auf `/buecher` und der Junction-Spreader auf `/buch/[slug]/audit` arbeiten gegen die einheitliche Canonical-Row.

Cross-Era-Aliases sind echte Reference-Daten-Arbeit, kein UI-Schmuck. Sie haben Folgen für das Audit-Cockpit (`/buch/[slug]/audit` zeigt sie als Junctions zur W40K-Canonical-Row), für die Public-Detail-Seite (Faction-Filter rollt sie korrekt unter den Sub-Faction-Knoten) und für die Junction-Counts (eine Identität = ein Cluster, nicht zwei) — siehe Brief 100 § Notes.

## Revisit triggers

Konkrete Signale, die die Disziplin neu diskutieren lassen:

- **Audit-Cockpit zeigt aggressives Falsch-Merging.** Wenn `/buch/[slug]/audit` HH-Bücher unter einer Canonical-Row gruppiert, die ein Maintainer für separate Identitäten hält (z. B. `Sisters of Silence` als eigenständig vs. `talons_of_the_emperor`-Sub), ist das ein Datenpunkt für eine Re-Modellierung dieses einen Paares — nicht ein Bruch der Disziplin.
- **`talons_of_the_emperor` ↔ `sisters_of_silence` wird zur eigenständigen Canonical-Row.** Heute Alias-Eintrag; wenn die HH-Wellen oft genug `Sisters of Silence` als eigene Faction zeigen (Sub-Einheit der Custodes+Sisters-Doppel-Einheit), kann das zu einer eigenständigen Row promoten — Pass-Phase-1-Architektur-Call, geregelt im Resolver-Runbook §4 Promotions-Disziplin.
- **`## Needs decision`-Stop in der Phase-Statusdatei** wegen echter Identitäts-Disambig (gleicher Surface-Form, andere Identität). Erwarteter Long-Tail-Fall, kein Bruch — die Ausnahme-Klausel oben deckt ihn.
- **UI-Pattern macht Era-basiertes Browsing primär.** Falls Phase 5 (Cartographer + Ask the Archive) oder ein Folge-UI eine Era-Achse als gleichrangig zur Faction-Achse anbietet, kann das Argument für separate Era-Rows zurückkommen. Heute spielt die UI keine Era-Achse aus, also kein Trigger.
- **Per-Era-Statistik auf der Public-Detail-Seite.** Falls Public-Buch-Seiten irgendwann zeigen, wie oft eine Faction *unter ihrem HH-Namen* vs. *unter ihrem 40K-Namen* in der Korpus vorkommt, braucht es Auswertungen über `aliases[]`, nicht über separate Rows — die Disziplin trägt das (Aliases sind im Notes-`---surfaceForms---`-Block sichtbar pro Buch).

## Out of scope (heute)

- `talons_of_the_emperor`-vs-`sisters_of_silence`-Re-Modellierung (siehe Trigger oben — eigener Pass-Phase-1-Call, kein eigener Brief vorab).
- Schema-Erweiterung um eine Era-Spalte auf `factions`/`characters` — die Era-Information ist eine Story-Property pro Buch (siehe Junction-Spalten, `era_frame` etc.), nicht eine Identitäts-Property der Reference-Row.
- Migration historischer W40K-Aliases auf einen separaten Era-Marker — die Bestände `faction-aliases.json` / `character-aliases.json` bleiben struktur-flach (`alias → canonical-id`), nicht era-tagged.

## Out-of-scope post-098

Brief 098 (W40K-Konsolidierungs-Pass) hat die Maschinerie für Cross-Wave-Canonical-Row-Dedup gebaut. Falls die HH-Wellen versehentlich Dubletten anlegen (z. B. ein `luna_wolves`-Row trotz Disziplin), fängt der nächste Konsolidierungs-Pass das idempotent ein und merged auf die Canonical-Row — Sicherheitsnetz, kein Ersatz für die Disziplin selbst.
