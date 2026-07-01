---
session: 2026-07-01-173
role: implementer
date: 2026-07-01
status: complete
slug: hygiene-resync-worklist
parent: 2026-07-01-173
links: [2026-06-03-121, 2026-06-03-122, 2026-06-29-171]
commits: []
---

# Hygiene-Resync + kanonische Worklist

## Summary

Die komplette Buchhaltungs-Staleness ist abgebaut: README-Tabelle 166–169 → `implemented`, 16 Session-Files nach `archive/2026-06/` verschoben (Root = 121/122/129 + 172-Paar + 173), Boards 121/122 resynct, alle relativen Links repariert, `worklist.md` als kanonische Sammelstelle etabliert. **OQ 16b ist verortet:** der `'time_ending'`-Hardcode lebt post-171 in `scripts/book-apply-shared.ts:99` (`M41_ERA_ID`) und wird in `computeBookRows` (Z. 712) gestempelt — Consumer existieren, nutzen das Feld aber alle nur als uniformen Platzhalter.

## What I did

- **Archiv-Sweep (`git mv`, kein Inhalt umgeschrieben):** 16 Dateien aus `sessions/` nach `sessions/archive/2026-06/` — 163-arch/-impl, 164-arch, 165-arch/-impl, 166-arch/-impl, 167-arch, 168-arch/-impl, 169-arch/-impl, 170-arch/-impl, 171-arch/-impl. Alle Dateidaten 2026-06-XX → alles nach `2026-06/`, kein `2026-07/`-Ordner nötig (172-impl vom 2026-07-01 bleibt als just-closed im Root). Root enthält jetzt: 121, 122, 129, 172-arch+impl (just-closed-Paar), 173-arch+impl, README.
- `sessions/README.md` — Tabellenzeilen 166/167/168/169 auf `implemented` geflippt. 167 mit Abschlussvermerk: geschlossen ohne Impl-Report, Evidenz = `W40K-0593..0598` als per-Buch-Files im Korpus (von der 171-Migration absorbiert) + 169-Re-Link. 166/168/169 mit Impl-Report-Vermerk (`complete`). 173-Zeile auf `implemented`; Nachtrag 2026-07-01b um den Umsetzungs-Vermerk ergänzt (kein Dokument kündigt mehr einen künftigen Aufräum-Pass an). Links der Nachträge + Tabellenzeilen auf `./archive/2026-06/…` umgebogen.
- `sessions/2026-06-03-121-arch-product-board.md` — Status-Resync: **P11** ☑ (Report 153, gemergt), **P16/166** ☑ (impl 2026-06-26, gemergt), **P14** von „⏸ extern" auf „☐ entsperrt" (53 Stage-3-Welten; Redditor-Excel angekündigt, nicht geliefert). Erledigt-Vermerk unter der Tabelle für die Wave **159–163** + **169** (laufen außerhalb der P-Nummern). Offen bleiben P7/P8/P9/P12/P13/P14/P15 — deckt sich mit Acceptance/worklist. Broken Links auf 129 (bleibt Root) unberührt, 150er/166er-Links → Archiv.
- `sessions/2026-06-03-122-arch-batches-board.md` — **keine Status-Änderung nötig:** B1–B4/B10/B11/B12(via 164)/B13 standen schon ☑, B14 ☒ verworfen, offen B5(⏸)/B6/B7/B8/B9 — exakt der Acceptance-Stand. Nur Link-Reparatur (149/151/164 → Archiv).
- **Link-Reparatur (mechanisch, sed):** alle relativen Links auf die 16 verschobenen Files in `sessions/README.md`, beiden Boards, `brain/wiki/{project-state,open-questions,worklist,deferred-questions,roadmap}.md` (Body-Links + Frontmatter-`sources:`). Zusätzlich 5 **vorbestehend gebrochene** Board-Links mitrepariert (149-arch/-impl, 150-arch/-impl, 151-arch — zeigten auf Root, Dateien lagen längst im Archiv). Verifiziert per Link-Checker (s. u.).
- `brain/wiki/open-questions.md` — 16b-Wortlaut komplett neu geschrieben (s. „OQ-16b-Antwort" unten); `../../scripts/book-apply-shared.ts` in die `sources:` aufgenommen.
- `brain/wiki/worklist.md` — § A: erledigtes Item 1 (173-Hygiene) gestrichen (Pflege-Regel: streichen, nicht kommentieren), Queue neu nummeriert (P14 → P12 → P13 → Lücken-Items); § D 16b auf den verorteten Stand.
- `brain/wiki/project-state.md` — § Next likely brief neu geschrieben (der Abschnitt kündigte diese Session als Zukunft an und trug die 2026-06-26-Queue mit „Brief 166 wartet auf CC"; laut eigenem Text „wird beim 166-169-Resync mitgezogen"): jetzt Post-173-Stand + Forward-Queue P14 → P12 → P13 mit Worklist-Pointer. § What's open: P14-Marker ⏸ → „(entsperrt)" (Konsistenz mit Board + Worklist).
- `brain/wiki/index.md` — Katalogzeilen nachgeführt: project-state (Forward-Queue ohne B12, Hygiene erledigt), worklist (Queue ohne 173), open-questions (16b-Verortung ergänzt).
- `sessions/2026-07-01-173-arch-hygiene-resync-worklist.md` — Frontmatter `status: open → implemented`.
- Dieser Report (neu).

## OQ-16b-Antwort (Open questions aus dem Brief)

**Wo lebt der `primaryEraId`-Default nach der 171-Migration?** In `scripts/book-apply-shared.ts`:

- **Z. 99:** `export const M41_ERA_ID = "time_ending";` — mit dem Warn-Kommentar (Z. 90–98), der explizit dokumentiert: Platzhalter, keine Kuration, Brief 170/171 haben ihn bewusst beibehalten, damit der per-Buch-Pfad legacy-äquivalent bleibt (Acceptance `primary_era_id = "time_ending"`).
- **Z. 712:** `computeBookRows` (der pure, geteilte Row-Rechner aus Brief 171) stempelt `bookDetails.primaryEraId: M41_ERA_ID`.
- **Z. ~742:** `applyBook` (der per-Work-Writer) schreibt das bei **jedem** Upsert — Insert wie Update — nach `book_details.primary_era_id`. Doku-Echos in `scripts/apply-book.ts:15/:142`; Test-Pin in `scripts/test-apply-book.ts:143` (asserted den Platzhalter als Paritäts-Garantie).

**Gibt es Consumer?** Lesende ja, ernsthafte nein: `src/lib/ask/boundaries.ts` (Heresy-Gate; dokumentiert selbst, dass das Feld uniform ist, und fällt auf `startY` + Slug-Set `heresy-books.ts` zurück), `src/components/ask/ResultCard.tsx:45` (Era-Anzeige), `src/lib/book/loadBook.ts` (Buchseite, Era-Join), `src/app/archive/loader.ts:177` (Era-Gruppierung), `src/lib/atlas/queries.ts` (Atlas-Era-Counts), `src/app/buch/[slug]/audit/page.tsx` (Audit-Anzeige). Alle behandeln den Wert als uniformen Platzhalter — 16b bleibt konsumentenlos im Sinne von „niemand hängt Logik an einen echten Era-Anker". 16b bleibt in der Queue, Brief erst bei Consumer-Druck.

## Decisions I made

- **172-Paar im Root behalten** („höchstens das 172-Paar" — just-closed vom selben Tag, natürlicher 1-Paar-Puffer der Archiv-Regel).
- **README-Nachträge 2026-06-24…07-01 nicht gekürzt**, nur Links repariert + der 01b-Nachtrag um den Umsetzungs-Vermerk ergänzt — der Brief verlangt Konsistenz, keinen Umbau. Die Tabelle behält auch die implemented-Zeilen 163–165 (Trim wäre ein Cowork-Schnitt, nicht meiner; siehe „For next session").
- **Backtick-Erwähnungen nicht angefasst:** Prosa-Nennungen verschobener Dateinamen in `brain/wiki/log.md` (append-only) und im 172-Brief sind keine Links und bleiben unverändert — nur echte Markdown-Links und Frontmatter-`sources:` wurden umgebogen. Archivierte Inhalte wurden nicht umgeschrieben (Constraint).
- **worklist § A Item „173" gestrichen statt abgehakt** — die Worklist-Pflege-Regel sagt „Erledigtes wird gestrichen, nicht kommentiert".
- **project-state § Next likely brief mit umgeschrieben**, obwohl nicht explizit in der Acceptance: der Abschnitt kündigte selbst an, beim 166-169-Resync mitgezogen zu werden, und das Brief-Goal („kein Dokument kündigt mehr an, dass ein anderes aufgeräumt wird") wäre sonst verfehlt.
- **Kein retroaktiver 167-Impl-Report** (Constraint) — Abschlussvermerk in der Tabellenzeile.

## Verification

- Link-Checker (alle Markdown-Links auf `.md` in `sessions/*.md` + `brain/wiki/**/*.md` gegen das Dateisystem aufgelöst): **0 broken**. Frontmatter-`sources:`-Pfade in `brain/wiki/**`: **0 broken**.
- Frontmatter-Stichprobe: 166/167/168/169-arch = `implemented`, 166/168/169-impl = `complete` (vor dem Tabellen-Flip verifiziert).
- `sessions/`-Root-Listing nach Sweep: nur 121, 122, 129, 172-arch, 172-impl, 173-arch, 173-impl, README.
- `npm run brain:lint -- --no-write` — grün (siehe PR-Checks; lokal vor dem Commit gelaufen).
- Keine Änderungen an `src/**` oder `scripts/**` (git status geprüft) — Out-of-scope-Constraint eingehalten; der 16b-Hardcode wurde nur lokalisiert.

## Open issues / blockers

Keine.

## For next session

Beim Sweep gefundene weitere Staleness — **gelistet statt still gefixt** (Brief § Open questions):

- **122-Board § „Standing tool" ist stale:** verweist auf den SSOT-Loop (ex-061, `scripts/runbooks/ssot-loop-runbook.md`) als „Vehikel für B5" — der Loop ist seit Brief 171 retired (Runbook trägt LEGACY-Banner). Die B5-Zeile selbst ist aktuell (Hand-Kuratierung im `/timeline-workshop/`); der Abschnitt sollte in einem Cowork-Pass auf den `/add-book`-Pfad umgeschrieben oder gestrichen werden. Nicht angefasst: Boards-Resync war auf Status-Spalten/Erledigt-Vermerke begrenzt.
- **5 vorbestehend gebrochene Board-Links** (149/150/151 → Root statt Archiv) — im Zuge der Link-Reparatur mitgefixt, hier nur als Befund dokumentiert: der frühere Archiv-Sweep dieser Files hatte die Board-Links nicht nachgezogen.
- **README-Tabelle trägt noch die implemented-Zeilen 163–165** (Dateien jetzt im Archiv). Kandidat für den nächsten Cowork-Trim, falls das README-Budget (~14k soft) drückt — Zeilen droppen, Historie liegt in Archiv + log.md.
- `index.md`-Selbstzeile „(this file) | Master catalog | 2026-06-24" hinkt dem Frontmatter-`updated` (2026-07-01) hinterher — kosmetisch, Cowork-Pflege.

## References

- Brief: `sessions/2026-07-01-173-arch-hygiene-resync-worklist.md`
- Hardcode-Verortung: `scripts/book-apply-shared.ts:90-99`, `:712`, `:734`; Consumer: `src/lib/ask/boundaries.ts`, `src/components/ask/ResultCard.tsx:45`, `src/lib/book/loadBook.ts:68-141`, `src/app/archive/loader.ts:177`, `src/lib/atlas/queries.ts:443-730`
