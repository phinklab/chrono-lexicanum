---
session: 2026-07-20-250
role: implementer
date: 2026-07-20
status: complete
slug: werkstatt-f1b1-m42-dates
parent: none
links:
  - docs/werkstatt-roadmap.md
  - scripts/runbooks/content-release-runbook.md
commits: []
---

# Werkstatt-Bau F1-B1 — M42-Nachdatierung für Status Imperialis

## Summary

F1-B1 (Fahrplan-Posten 7, F1-Urteil „bauen" aus Session 236) ist gebaut — Launch-Modus,
logischer Strang Batches, Coordination-Worktree, Branch `codex/ingest-batches-m42-dates`.
**25 neue Setting-Datierungen** in `book-dates.json` (Indomitus-Bucket wächst 12 → 37 von
122 datierten Büchern), die zwei hook-losen Indomitus-Events (`psychic_awakening`,
`era_indomitus`) tragen jetzt ehrliche Buch-Hooks, der Weekly-Refresh hat den
Status-Imperialis-Prüfpunkt. **Kein DB-Write** — Apply + Snapshot laufen auf explizites Go
über das Content-Release-Runbook (`npm run apply:timeline` genügt; `apply:book` ist nicht
nötig, die Bücher existieren bereits — nur `primary_era_id` + `works.startY/endY` ändern
sich, beides schreibt `apply:timeline` bzw. der nächste `apply:book --all`).

## What I did

- `scripts/seed-data/book-dates.json` — 25 neue Zeilen als eigener Block am Dateiende
  (F1-B1-Welle, aufsteigend nach `startY`): Dawn of Fire #2–#9, Cawl-Kette (The Great
  Work, Genefather), Rise of the Ynnari #2 (Wild Rider), Ephrael Stern: The Heretic
  Saint, Rites of Passage, plus die 13 benannten Einzeltitel. Konfidenz nur M/L (kein H),
  Quelle je Zeile in `note`.
- `scripts/seed-data/event-works.json` — `psychic_awakening` bekommt zwei Buch-Hooks
  (`ephrael-stern-the-heretic-saint`, `witchbringer`); `era_indomitus` bekommt
  `dark-imperium` (displayLabel `012.M42`).
- `scripts/seed-data/events.json` — beide `curatorNote`s nachgeführt („Bookless" stimmte
  nicht mehr; Hook-Begründung mit F1-B1-Stempel).
- `scripts/runbooks/weekly-refresh-runbook.md` — neuer Schritt 5 im Buch-Promote-Flow
  („Status-Imperialis check"): Datierung jenseits des `/now`-Stands oder neues
  Groß-Event → kuratierte Status-Prosa + Indomitus-Kapitel der Timeline-Seeds prüfen;
  alter Schritt 5 (`refresh:mark-reviewed`) wurde 6.
- `docs/werkstatt-roadmap.md` — F1-B1 auf ✔ 250, nächste freie Nummer → 251.

## Decisions I made

- **Web-Recherche vor jeder Zeile** (Lexicanum, Track-of-Words-Interviews): Die
  Datierungsevidenz ist dünner als der Prompt annahm — kein einziges der 25 Bücher trägt
  einen expliziten Jahres-Stempel. Die echten Anker: The Iron Kingdom-Appendix
  („5. Jahr des Indomitus-Kriegszugs"), The Wolftime („<4 Jahre nach Gathalamor"),
  die offizielle Era-Indomitus-Lesereihenfolge aus dem Silent-King-Anhang (Indomitus
  ~010.M42 zwischen DoF #7 und #8; Dark-Imperium-Trilogie ~012.M42 nach #9; The Great
  Work danach, vor Genefather), Deathworlder per Autoren-Aussage mitten in der
  Leviathan-Offensive (→ `fourth_tyrannic_war`, ~020.M42).
- **DoF-Spine als Interpolation zwischen den Ankern** (#2 ~001 … #9 ~011.M42,
  `series-inherited`/`event-anchored`, M): beide Enden + Mitte sind belegt, die
  Zwischenwerte sind ausgewiesene Interpolation.
- **Scope +3 über die Prompt-Liste hinaus** („u. a."): `the-silent-king` (DoF #9),
  `genefather`, `ephrael-stern-the-heretic-saint` und `wild-rider` lagen undatiert im
  Katalog und schließen die jeweiligen Ketten; damit exakt 25 Zeilen (obere Kante).
- **Psychic-Awakening-Hooks umgeplant:** Entgegen der Prompt-Klammer ist weder Mark of
  Faith noch Rites of Passage PA-gebrandet (beide Notes sagen das jetzt explizit). Der
  ehrliche gebrandete Tie-in ist Ephrael Stern: The Heretic Saint (liegt im Katalog!),
  dazu Witchbringer als Phänomen-POV (sanktionierte Cadianer-Psykerin, „kurz nach
  Cadias Fall" per Autoren-Interview).
- **Era-Marker-Hook: ja, ein einzelner** — `dark-imperium` auf `era_indomitus` („falls
  sinnvoll"-Ermessen): der Namensgeber des „settled now" ist die natürliche Tür in die
  Gegenwart des Archivs; Doppel-Hook desselben Werks auf `plague_wars` ist vom Schema
  gedeckt (Unique je Event).
- **Feel-Placements ehrlich als L + Spread:** Die neun Bücher ohne jede Jahresevidenz
  (Steel Tread, Blood of Iax, Longshot, Outgunned, Day of Ascension, Catachan Devil,
  Helbrecht, Kingmaker, Bookkeeper's Skull) sind über ~000–011.M42 gestreut statt
  gestapelt, Methode `explicit` + L nach dem Muster des approved Spread vom 2026-06-10,
  jede Note sagt „feel-placed" dazu. Day of Ascension und Catachan Devil stehen nicht
  einmal in der Lex-Era-Indomitus-Liste (Label darum nur `~M42`); The Bookkeeper's Skull
  ist als De-facto-Prequel zu Cadian Honour auf ~000.M42 gelegt — spätes M41 ist nicht
  ausgeschlossen, steht in der Note. Diese Zeilen sind die erste Streich-Kandidatur,
  falls im Review etwas zu mutig wirkt.
- **`war_of_beasts` unangetastet:** kein Vigilus-Roman im Bestand; die Podcast-Hooks
  bleiben, die „Bookless"-Note stimmt dort weiterhin.

## Verification

- `npm test` — PASS, 41 Suiten grün (8 s); deckt `test:timeline`, `test:apply-book`,
  `test:era-bucket`-Pfade DB-frei ab.
- `loadEraContext()` direkt ausgeführt: 122 datierte Bücher, 37 im Indomitus-Bucket,
  kein Duplikat, kein unbucketbares Jahr (Era-Grenzen 42000–42100 eingehalten).
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run build` — pass.
- Kein `apply:timeline`/`apply:book` gegen die DB — Produktions-Write erst auf
  explizites Go (Content-Release-Runbook).

## Open issues / blockers

Keine Blocker. Zwei Nebenbefunde als Task-Chips ausgelagert (siehe unten).

## For next session

- **F1-B2 (`/now`) kann bauen:** „diese Bücher spielen jetzt gerade" trägt jetzt 37
  Werke mit `startY ≥ 41999`-Nachbarschaft; die Indomitus-Spine ist hook-vollständig.
  Der W4-Backlog-Hinweis gilt: H/M/L-Wording lokal definieren — die neue Welle liefert
  bewusst nur M/L.
- **Katalog-Titel „The Gates of Bones"** weicht vom offiziellen Titel „The Gate of
  Bones" ab (Chip erstellt; betrifft `books/the-gates-of-bones.json` + Slug-Frage).
- `scripts/apply-timeline-data.ts` enthält ein literales NUL-Byte in einem Kommentar
  (seit PR #177; funktional harmlos, aber Grep behandelt die Datei als binär — Chip
  erstellt).
- Falls die Excel-/Roster-Welt je eine M42-Nachtragswelle fährt: die 25 neuen Zeilen
  sind reine `book-dates.json`-Kuration, der Legacy-Roster bleibt unberührt.

## References

- Lexicanum: „Dawn of Fire (Novel Series)", „Chronological order of settings of Black
  Library publications", „List of Media set during the Era Indomitus", „Indomitus
  Crusade" + Einzelbuchseiten.
- Track of Words: Autoren-Interviews (Rites of Passage, Witchbringer, Deathworlder).
- Recherche-Vorbehalt (steht sinngemäß in den Notes): GW lässt das wahre Jahrtausend
  der Era Indomitus offen; alle M42-Stempel sind Platzhalter — deckt sich mit der
  bestehenden `era_indomitus`-Blurb-Haltung.
