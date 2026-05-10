---
review-date: 2026-05-09
review-source: codex
review-target: sessions/2026-05-09-054 (V2-Pilot brief + impl) — two-question review (faction-name-vs-ID + V2-Durchlauf-Gesamteinschätzung)
---

# Review: V2-Pilot — Faction-Repräsentation und Pipeline-Gesamtbewertung

> Codex-Review aus 2026-05-09-Cowork-Chat (zwei Fragen, zwei Antworten). Verbatim erhalten; nicht-edited. Triage-Folge in [`brain/wiki/open-questions.md`](../../wiki/open-questions.md) als OQ4 (Junction-Resolver) + OQ5 (Unresolved-Queue) — die alten Queue-Items mit gleicher Nummer (Anthologie-Re-Test, Lexicanum-Body-Lore) wanderten im selben Schritt nach `deferred-questions.md`.

---

## Frage 1 — Faction als Names statt IDs: ist das egal?

Kurz: Für den Pilot-Diff ist das okay. Für die spätere Website-Filterung darf es nicht so bleiben.

Wichtig ist die Begriffs-Trennung:

- facetIds sind Soft-Tags wie Ton, Thema, Format, POV, Content-Warnings.
- factions sind im Schema eine eigene Referenztabelle mit factions.id.
- Website-Filter nach Fraktion sollten am Ende über work_factions.faction_id laufen, nicht über Namen und nicht über facetIds.

Dass V2 gerade `factions: [{ name, role }]` ausgibt, ist sogar sinnvoll: Das LLM soll Surface Forms extrahieren, also "Word Bearers", "Sons of Horus", "Adeptus Mechanicus" usw. Die stabile Canonisierung kommt downstream im 3d-Apply-Schritt: Name normalisieren, gegen factions.name/Aliases matchen, dann work_factions schreiben.

Was wir vor einem echten Website-Filter brauchen:

1. **Name-to-faction-id Resolver.** Beispiel: "Word Bearers" → `word_bearers`.
2. **Alias-Mapping.** Wichtig für Fälle wie "Space Marines" / "Adeptus Astartes", "Sons of Horus" / "Luna Wolves" oder alte/neue Namen.
3. **Unresolved Queue.** Wenn die Pipeline "Cabal of Eight" oder eine sehr spezifische Subfaction findet, die noch nicht in factions.json steht, sollte sie nicht blind einen Filterwert erzeugen, sondern als Review-Fall landen.
4. **Rohname behalten.** Auch nach erfolgreichem Mapping ist der extrahierte Name nützlich für Audit: Das Buch sagte "Sons of Horus", resolved wurde `sons_of_horus`.

Also: Nein, nicht egal für die Produktqualität. Aber ja, im aktuellen V2-Pilot ist es korrekt, dass erstmal Namen statt IDs herauskommen. Die nächste tragende Stufe ist der Resolver. Ohne den würden die Filter später zerfasern, weil Besucher dann faktisch nach Schreibweisen filtern statt nach kanonischen Fraktionen.

---

## Frage 2 — Wie war der V2-Durchlauf generell? Besser als die anderen?

Ja. Mein Urteil: V2 ist klar die bessere Pipeline-Basis, aber noch nicht die Pipeline, die ich ohne 055-Test direkt auf 700+ Bücher loslassen würde.

Warum besser:

- **Sie ist sicherer:** false-gods zeigt genau den gewünschten Effekt. Der falsche Lexicanum-Body-Year-Wert 39000 wird erkannt und nicht als startY übernommen. Lieber null als falsche Chronologie.
- **Sie ist auditierbarer:** FieldRecords mit value/source/evidence/override sind viel besser als das alte „merged payload + fieldOrigins"-Gefühl. Für Handprüfung und Apply ist das Gold.
- **Sie ist produktnäher:** factions/locations/characters kommen jetzt strukturiert mit Rollen, nicht nur als flache Namenslisten. Das ist für spätere Filter, Detailseiten und Review deutlich wertvoller.
- **Sie ist frischer in Discovery:** chem-dog aus TLBranson ist ein echter Proof, dass wir nicht mehr komplett an Wikipedia hängen.
- **Sie ist billiger:** Pilot lag bei ca. $0.062/Buch gegenüber ca. $0.114/Buch im 047-Lauf. Kleine Stichprobe, aber die Richtung stimmt.
- **Sie ist weniger noisy:** Hardcover-Mismatch-Müll wandert nicht mehr in errors[]; die Error-Liste wird wieder lesbar.

Die Schwächen sind aber real:

- **eisenhorn-xenos** wurde aus Slug synthetisiert, weil Discovery/Fuzzy-Merge ihn nicht sauber gefunden hat. Downstream ging es gut, aber das ist ein Warnlicht.
- **garro** hat den Pagecount-Validator nicht empirisch bewiesen, weil Open Library diesmal keinen pageCount=2 geliefert hat. Final war trotzdem sicher, aber der Acceptance-Test war dadurch nur halb erfüllt.
- **Web-search** war mit 8 statt Ziel ≤7 knapp drüber. Nicht dramatisch, aber der Prompt ist noch zu großzügig.
- **Factions sind noch Namen, keine IDs.** Für Diff okay, für Apply/Website-Filter braucht es zwingend den Resolver.

Also: Ja, besser als V1/047 als Architektur und als Datenhygiene. Nicht weil jeder einzelne Pilotpunkt perfekt war, sondern weil die Fehler jetzt an den richtigen Stellen sichtbar werden, statt still in den Datensatz zu laufen. Für mich ist das der entscheidende Unterschied. Next best step wäre ein 50- bis 100-Buch-V2-Lauf als Decision Gate, plus vorher ein kleiner Fix für Discovery/Fuzzy-Merge und ein strengerer Search-Prompt.
