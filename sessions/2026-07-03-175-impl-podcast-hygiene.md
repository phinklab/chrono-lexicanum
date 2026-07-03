---
session: 2026-07-03-175
role: implementer
date: 2026-07-03
status: complete
slug: podcast-hygiene
parent: 2026-07-02-175
links: [2026-07-02-175, 2026-07-01-172, 2026-06-27-168, 2026-06-08-132, 2026-06-04-128]
commits: []
---

# 175 — Podcast-Hygiene: Drift-Fix + Catchup + Alias-Backlog (Impl)

## Summary

Alle vier Podcast-Artefakte sind wieder konvergent (`test:podcast-cc-direct` **29 passed, 0
failed** — vorher 19/8), der 168er-Catchup ist über den 172er-Delta-Pfad gefahren (**+10
Episoden**: lorecast +5, adeptus-ridiculous +4, luetin09 +1), der Alias-Backlog ist triagiert
(**57 Formen als Aliases aufgelöst, 175 auf der committeten Review-Liste**), und der
Lorehammer-Twin-Filter ist test-belegt. Wichtigster Nebenbefund für Cowork: der Tag-Loop-Driver
hätte Delta-Pläne bis jetzt **zerstört** (hartes `prepare`+`merge`) — gefixt; außerdem war
`luetin09.extractions.json` noch der stale 20-Episoden-Demo-Stand aus Session 130 und ist jetzt
das kuratierte 192-Lore-Subset des Voll-Korpus.

## What I did

**1. Delta-Catchup (172er-Pfad, cc-direct, zero metered API calls)**

- Acquire (live): lorecast 154 verfügbar, AR 367, luetin09 1952 Uploads → 1854 acquired
  (98 denylisted, 40 force-included). No-Shrink-Guard geprüft: **keine** committete Episode
  fehlt in einem Live-Feed.
- `prepare-delta --week 2026-W26` je Show (Proposal-Cross-Check, kein Source-Drift):
  **5 / 4 / 1 neue Episoden** (W26-Stand war 4/3/1 — je +1 seit Proposal-Generierung; luetin09s
  eine neue Episode ist „Trazyn the Infinite", kind `lore`).
- Tagging: eine frische `claude -p --model sonnet` Subsession pro Batch via
  `run-podcast-tag-loop.sh` (3 Batches gesamt), `merge-delta` additiv: lorecast 149→154,
  AR 363→367, luetin09-full 1854→**1855** Extractions. Bestand verbatim erhalten (+N new,
  0 unchanged-Konflikte).
- `scripts/run-podcast-tag-loop.sh` — **Driver delta-aware gemacht**: ein vorhandenes
  `mode:"delta"`-`batches.json` wird nicht mehr von einem Voll-`prepare` überschrieben, und am
  Ende läuft `merge-delta` statt `merge` (das Delta-Pläne per Guard verweigert). Ohne den Fix war
  Station 3 des `add-podcast-episode`-Runbooks nicht fahrbar; der klassische Full-Pfad ist
  unverändert.

**2. Alias-Backlog-Triage**

- Backlog berechnet aus den committeten Artefakt-Scopes (Luetin09 = Lore-Subset inkl. Delta,
  Lorehammer = Voll-Lauf): **48 LU + 184 LH = 232 unaufgelöste Formen** (Brief-Schätzung ~63/~212
  zählte Vorkommen, nicht distinkte Formen).
- **57 Formen als Aliases ergänzt** (6 LU + 51 LH), nur wo die Ziel-Entity eindeutig existiert und
  Sidecar-Präzedenz das Muster deckt (z. B. „League of Votann"→`leagues_of_votann`, „War
  Hounds"→`world_eaters`, „Deathwing"/„Ravenwing"→`dark_angels`, „Silent King"→`szarekh`,
  „Malcador the Sigilite"→`malcador_the_sigillite`, „Emperor"/„God-Emperor"→`the_emperor`,
  „Vraks"→`vraks_prime`; Kategorien wie „Kabals"→`drukhari` nach dem bestehenden
  „Incubi"→`drukhari`-Muster). Sidecars: `faction-aliases.json` +49, `character-aliases.json` +8,
  `location-aliases.json` +1 Schlüssel.
- `scripts/seed-data/podcast-aliases.review.md` (neu, committed) — die restlichen **175 Formen
  (166 distinkt)** mit Begründung je Eintrag, gruppiert: A echte Lore-Kandidaten (~90, Top:
  **the Warp/Immaterium ×20**, Old Ones ×6, Malal/Malice-Cluster, Segmenta, Minor-Xenos-Block,
  Only-War-/Darktide-Cluster), B Sammelbegriffe (bewusst unaufgelöst lassen), C ambig (u. a.
  „Phoenix Guard" — EC-Elite im Kontext, kollidiert mit Eldar-Bedeutung), D vermutlich
  Homebrew/podcast-intern (Lorehammers „By Blade and Bolter"-/Listener-Lore-Serien).
  **Zahlenverhältnis: 57 aufgelöst vs. 175 Review.**
- Keine neuen Entities, keine per-Buch-Files angefasst.

**3. Twin-Filter (Lorehammer „(Video)")**

- Der Filter existierte seit 2026-06-09 in Acquire (`ingest-podcast.ts`) + Detection
  (`podcast-diff.ts`) samt Registry-Pattern — „nachrüsten" hieß hier: testbar machen und den
  Beleg liefern.
- `src/lib/ingestion/podcast/registry.ts` — Filter als `dropExcludedTitles()` exportiert,
  `acquireFeed` nutzt exakt diese Funktion (Verhalten unverändert, aber beweisbar).
- `scripts/test-podcast-ingest.ts` — 3 neue Tests (30→33): (a) `dropExcludedTitles` droppt
  „(Video)"-Twins case-insensitiv, (b) **Cold-Reingest-Guard**: der Lorehammer-Registry-Eintrag
  muss `"(Video)"` in `excludeTitlePatterns` tragen (Daten-Hälfte des Beweises), (c) kein
  committetes Artefakt enthält eine Episode, die die eigenen Exclude-Patterns matcht
  (Zustands-Hälfte). Beim heutigen AR-/lorecast-Acquire feuerte der Filter live (AR: 0 dropped,
  lorehammer nicht re-acquired — Beleg via Tests statt Netz).

**4. Konvergentes Re-Assemble (nach Alias-Kuration, ein finaler Pass)**

- lorecast + AR: Assemble aus dem Live-Manifest (Runbook-Pfad). luetin09-full: Assemble → Report
  committed, Voll-Artefakt `luetin09-full.json` bleibt wie seit 132 **lokal/untracked**.
- luetin09 (kuratiert): Lore-Manifest (192 Episoden = `episodeKind === "lore"` aus dem
  Voll-Korpus) + **`luetin09.extractions.json` = kuratiertes 192er-Subset des Voll-Korpus** —
  ersetzt den stalen 20-Episoden-Demo-Stand aus Session 130, dessen Extractions zu 10/20 vom
  Voll-Lauf abwichen und der die „no extraction for guid"-Failure verursachte. Damit gilt für
  alle vier Shows wieder: `<slug>.extractions.json` ⊇ Artefakt-Guids.
- lorehammer: Manifest aus dem committeten Artefakt dekompiliert (`manifestFromArtifact`) und
  lokal re-assembled — reiner Drift-Fix ohne Re-Acquire (kein Catchup für lorehammer im Scope).
- Effekt je Show (Episoden / Tags / Unresolved-Vorkommen alt→neu):
  lorecast 149→154 / 520→546 / 151→134 · AR 363→367 / 790→827 / 230→203 ·
  luetin09 191→192 / 374→389 / 63→54 · lorehammer 391→391 / 663→695 / 256→183.
  **Kein Bestands-Shrink irgendwo.**

**5. Cursor-Hygiene**

- `refresh:mark-reviewed -- --show …` für die drei Shows → Cursors auf **2026-07-03**
  (lorehammer bleibt 2026-06-28). Offline verifiziert: lorecast/AR haben 0 Live-Feed-Guids
  außerhalb des Artefakts; luetin09s 1662 nicht-kuratierte (non-lore) Uploads liegen alle vor dem
  Floor (neuester: 2021) — `refresh:check` würde nichts re-proposen.

## Decisions I made

- **Driver-Fix statt Workaround.** `run-podcast-tag-loop.sh` rief hart `prepare` (überschreibt
  Delta-Pläne mit einem Voll-Plan!) und `merge` (verweigert Delta-Pläne). Der 172-Report hat den
  Driver nie mit einem Delta exercised. Kleiner Fix (Plan-Mode-Detection), klassischer Pfad
  unverändert — ohne ihn ist der dokumentierte Delta-Flow nicht ausführbar.
- **luetin09-Topologie beibehalten, aber konsistent gemacht.** Delta-Baseline bleibt
  `luetin09-full.extractions.json` (Voll-Korpus, `--out luetin09-full`); das committete
  `luetin09.extractions.json` ist jetzt das exakte Extraction-Subset des kuratierten Artefakts
  statt des überholten Demos. Achtung als Konvention: ein künftiger luetin09-Delta läuft über
  `--out luetin09-full`, NICHT `--out luetin09` (sonst plant `prepare-delta` ~1660 non-lore-Guids
  als „neu") — im Review-/Runbook-Kontext dokumentierenswert, s. „For next session".
- **Ein Extraction-Eintrag mehr als Manifest-Episoden bei luetin09-full (1855 vs. 1854) ist
  gewollt:** der 132er-Stray `WqRuXAiM_qI` ist inzwischen aus dem Kanal-Scope verschwunden
  (vermutlich nachträglich in eine denylisted Playlist einsortiert), bleibt aber als historischer
  Korpus-Eintrag stehen — merge-delta shrinkt nie, Assemble ignoriert überzählige Keys.
- **Alias-Linie: Kollektive/Unit-Typen → Eltern-Fraktion (Sidecar-Präzedenz: „Bloodletters"→
  khorne, „Incubi"→drukhari, „Biel-Tan"→eldar); individuelle benannte Wesen (Götter, Charaktere)
  ohne bestehende Entity → Review-Liste.** Deshalb z. B. „Gork"/„Mork"/„Cegorach"/„Be'lakor"
  NICHT gemappt, obwohl verlockend. Kontext-geprüft statt nur namens-gematcht: „Phoenix Guard"
  (EC-Folge, nicht Eldar) und „Minotaurs" (reales Chapter, nicht `brazen_minotaurs`) wären
  klassische Fehl-Aliases gewesen.
- **Lorehammer ohne Re-Acquire re-assembled** (Manifest aus dem Artefakt dekompiliert): ein
  Live-Acquire hätte neue lorehammer-Episoden ins Manifest gebracht, deren Tagging out-of-scope
  ist (Catchup-Scope = drei Shows), und Assemble bricht bei fehlenden Extractions ab.
- **`refresh:check` nicht live ausgeführt** — es würde ein neues Wochen-Verzeichnis
  (`2026-W27`-Proposal) erzeugen, das in den Weekly-Rolling-PR gehört, nicht in diesen. Die
  Acceptance-Eigenschaft („würde nichts re-proposen") ist stattdessen offline gegen Live-Manifest
  + Floor bewiesen (s. o.).
- **Twin-Filter: kein neuer Mechanismus, sondern Beweis-Härtung.** Der Filter war seit 2026-06-09
  implementiert (Brief war hier konservativer als der Code-Stand); Lücke war der Test-Beleg auf
  Registry-Daten- und Artefakt-Ebene plus die Testbarkeit der Acquire-Verdrahtung.

## Verification

- `npm run test:podcast-cc-direct` — **29 passed, 0 failed** (auf `main` vorher: 19/8; lokal
  laufen 2 Tests mehr als in CI, weil das untracked `luetin09-full.json` mitgeprüft wird — auch
  das byte-identisch).
- `npm run test:podcast-ingest` — 33 passed (30 + 3 neue Twin-Filter-Tests).
- `npm run test:refresh` — 66 passed. `npm run test:podcast-apply` — 41 passed.
  `npm run test:podcast-youtube` — 29 passed.
- `npm run lint` — pass. `npm run typecheck` — pass.
- Delta-Guards live exercised: prepare-delta W26-Cross-Check ohne Source-Drift; merge-delta
  „+N new, 0 unchanged"; Driver-Resume/Validation je Batch grün.
- No-Shrink manuell verifiziert (Artefakt-Guids ⊆ Live-Manifest je Show; Episoden-/Tag-Zählungen
  alt→neu s. o.).
- **Kein DB-Write** — `apply:podcast` wurde nicht ausgeführt (Gate, s. Post-Merge-Ops).

## Post-Merge-Ops für Philipp (DB-Write-Gate)

Nach dem Merge dieses PRs, auf explizites Go, im Batches-Worktree:

```
npm run apply:podcast -- --show the-40k-lorecast
npm run apply:podcast -- --show adeptus-ridiculous
npm run apply:podcast -- --show luetin09
npm run apply:podcast -- --show lorehammer
```

(idempotent, `--dry-run` vorschaltbar; erwartet: +5 / +4 / +1 / +0 neue Episode-Works, dazu
Junction-/Tag-Refresh auf dem Bestand durch die neuen Aliases — auch lorehammer schreibt deshalb
Updates, obwohl 0 Episoden neu sind). Danach ist ein `POST /api/revalidate` sinnvoll, damit die
Podcast-/Entity-Seiten die neuen Tags zeigen. `refresh:mark-reviewed` ist für die Shows bereits
in diesem PR erledigt (Cursor-File committed); für die Buch-Seite des W26-Proposals gilt
weiterhin der Weekly-Flow.

## Open issues / blockers

- Keine Blocker. Offene Kurationsentscheidungen liegen gesammelt in
  `scripts/seed-data/podcast-aliases.review.md` (175 Einträge, priorisiert; Top-Kandidat:
  Warp/Immaterium als Location-Entity, ×20 Episoden).

## For next session

- **Brief-Open-Q „migrate:extractions --check als CI-Gate?":** Empfehlung **nein, der bestehende
  Test reicht** — `test:podcast-cc-direct` prüft in CI bereits beide Byte-Identitäten (in-memory
  Migration + committed extractions→artifact) für jedes committete Artefakt; `--check` wäre ein
  Duplikat desselben Invariants. Der eigentliche Prozess-Punkt ist ein anderer: **wer Aliases
  kuratiert, muss die Podcast-Artefakte im selben PR re-assemblen** (dieser Drift entstand durch
  Alias-Pflege ohne Re-Assemble). Das gehört als ein Satz in den Alias-Kurations-Kontext
  (z. B. Kopfkommentar der Review-Liste — dort steht er jetzt — und/oder `pipeline-state`-Wiki).
- **Runbook-Ergänzung luetin09:** `add-podcast-episode-runbook.md` kennt die
  Zwei-Namespace-Topologie (`--out luetin09-full` als Delta-Baseline + kuratierter
  Lore-Assemble nach `luetin09`) nicht. Ein kurzer „Sonderfall luetin09"-Absatz (oder ein
  kleines `curate`-Subkommando) verhindert, dass der nächste Delta-Lauf mit `--out luetin09`
  ~1660 non-lore-Guids als „neu" plant.
- **Alias-Review abarbeiten:** `podcast-aliases.review.md` — die A-Sektion (echte Lore-Lücken)
  ist im Kern eine Entity-Kurations-Welle (Warp/Immaterium, Old Ones, Men of Iron, Age-of-
  Apostasy-Charaktere, Segmenta, Minor-Xenos-Block); B/C/D sind Streich-Entscheidungen. Nach
  jeder Kuration: betroffene Shows re-assemblen (+ ggf. re-apply).
- Die Lorehammer-Feeds enthalten Titel-Duplikate mit Schreibvarianten als eigene Guids (z. B.
  „127 - Beast Snagga Boyz" + „… Boys", zwei „119 - …"-Varianten) — committeter Bestand, kein
  Handlungsbedarf, aber bei künftigen Dedup-Überlegungen erwähnenswert.
- S4 YouTube-Episode-Matching + YouTube-Channel-Acquisition bleiben wie im Brief deferred.

## References

- Brief: `sessions/2026-07-02-175-arch-podcast-hygiene.md` (Status → implemented in diesem PR).
- Runbook: `scripts/runbooks/add-podcast-episode-runbook.md` (7 Stationen; Station 3 = Driver).
- 132-Impl (`sessions/archive/2026-06/2026-06-08-132-impl-luetin09-full-40k-apply.md`) — Herkunft
  der luetin09-Topologie + des 63er-Backlogs; 172-Impl (`sessions/2026-07-01-172-impl-podcast-weekly-maintenance.md`)
  — Delta-Primitive + die 8 vorbestehenden Failures.
