---
session: 2026-05-09-050
role: architect
date: 2026-05-09
status: open
slug: brain-hygiene-pass
parent: 2026-05-09-049
links:
  - 2026-05-08-049
  - 2026-05-09-049
commits: []
---

# Brain Hygiene Pass — Link-Audit, Frontmatter-Sources-Normalisierung, Read-Order-Fix, .gitattributes

## Goal

Das Brain-LLM-Wiki vollständig auf saubere, lintbare Quellen-Hygiene bringen, **bevor** der Lint-Script kommt und bevor die nächsten inhaltlichen Briefs (Anthologie-Re-Test, Lexicanum-Junction-Cut, Modell-Entscheidung) auf dem Brain als verlässlicher Grundlage aufbauen.

Ein externer Review (siehe `brain/raw/reviews/2026-05-09-brain-structure-review.md` — bitte als ersten Schritt anlegen, Wortlaut unter „Notes" in diesem Brief) hat dem Karpathy-Reset (049) ein gutes strukturelles Zeugnis ausgestellt, aber fünf konkrete Hygiene-Befunde geliefert: kaputte Sessions-Archive-Pfade, Klammer-Kommentare in `sources:`-Frontmatter, Read-Order-Widerspruch in `wiki/index.md`, Line-Ending-Churn auf `brain/raw/historical/`, fehlende Lint-Automatisierung. Vier davon sind in diesem Brief; der Lint-Script ist explizit Brief 051.

## Context

- **Karpathy-Reset (049)** ist gelandet: 26 Wiki-Pages, 4 Top-Level-Redirects, Atlas-Skeleton via `npm run atlas:regen`. Brain ist seit 2026-05-09 die kanonische Engineering-Memory-Quelle; Cowork und Claude Code starten beide hier.
- **Review-Befund Nr. 1 (broken links): bestätigt.** Mehrere Wiki-Pages (sowohl `sources:`-Frontmatter als auch Body-Links) zeigen auf `sessions/archive/2026-05/<id>.md`, obwohl die jeweiligen Sessions **noch in `sessions/` direkt liegen**. Sessions 035–048 sind aktuell auf Top-Level, nicht im Archiv (Phase-3-Archivierung steht erst nach 3d-Apply an, siehe `brain/wiki/roadmap.md`). Konkrete Treffer (verifiziert via grep, 2026-05-09):
  - `brain/wiki/glossary.md:11–13` (sources frontmatter): 035-impl, 037-impl, 039-impl als archive-Pfade angegeben.
  - `brain/wiki/decisions/why-haiku-not-sonnet.md:7–8`: 038-arch, 039-impl als archive-Pfade angegeben.
  - `brain/wiki/decisions/why-multi-source-merge.md:9` (sources): 035-impl als archive-Pfad. Zeile 20 (body): 034 + 035-impl als archive-Pfade, plus Link `[033 (retracted)](../../../sessions/archive/2026-05/)` auf ein Verzeichnis statt File.
  - `brain/wiki/open-questions.md:66`: 039-impl als archive-Pfad. Zeile 84: 035-impl, 037-impl, 039-impl als archive-Pfade.

  033 und 046 (beide retracted) liegen tatsächlich in `sessions/archive/2026-05/`. Alle anderen 034–049 liegen direkt in `sessions/`. Faustregel: Wenn Sessions-ID > 033 und ≠ 046, dann **kein** archive-Pfad.
- **Review-Befund Nr. 2 (sources: mit Parens): bestätigt.** Mehrere Frontmatter-Blöcke führen Klammer-Annotationen mit, die ein Linter nicht als Pfade auflösen kann. Beispiele:
  - `brain/wiki/index.md:7` — `- All pages under brain/wiki/ (this catalog is a roll-up)` (kein Pfad, freier Text).
  - `brain/wiki/open-questions.md:7` — `- ../../sessions/README.md (carry-over section, pre-049)`.
  - `brain/wiki/onboarding.md:8` — `- ../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md (Obsidian setup section)`.
  - `brain/wiki/decisions/plan-reshuffle-2026-05-02.md:8` — `- ../../../sessions/README.md (Infrastructure log entry 2026-05-02 Plan-Reshuffle)`.
  
  Es gibt mutmaßlich weitere; bitte audit über alle `brain/wiki/**/*.md` führen, nicht nur über die hier gelisteten Stichproben.
- **Review-Befund Nr. 3 (Read-Order-Widerspruch): bestätigt.** `brain/wiki/index.md:17` sagt „Cowork and Claude Code read this **second** on session start (after [`../CLAUDE.md`](../CLAUDE.md))", aber der `../CLAUDE.md`-Link zeigt auf `brain/CLAUDE.md`, nicht auf `/CLAUDE.md`. Die Read-Order-Liste in derselben Datei (Zeilen 83–88) und in `brain/CLAUDE.md` (Zeilen 11–16) ist konsistent **dreistufig**: 1) `/CLAUDE.md` → 2) `brain/CLAUDE.md` → 3) `wiki/index.md`. Die "second"-Formulierung ist ein Mini-Bug derselben Datei.
- **Review-Befund Nr. 4 (line-ending churn auf raw/historical): plausibel.** Repo hat aktuell **keine `.gitattributes`** (verifiziert). Auf einem Windows-Client mit Default-`autocrlf` checkt Git Markdown mit CRLF aus, das macht insbesondere die immutablen `brain/raw/historical/`-Snapshots in `git status` ständig modifiziert aussehen. Für „immutable raw sources" ist das unschön und untergräbt den Snapshot-Vertrag.
- **Review-Befund Nr. 5 (Lint-Script): out of scope für diesen Brief.** Per Cowork-Entscheidung 2026-05-09 wird Lint Brief 051. Begründung: dieser Hygiene-Pass produziert den ersten „grünen Lauf" als Baseline, und der Script-Shape (Exit-Code-Semantik, Default-Format, optional GitHub Action) hat genug Designgewicht, dass er den Hygiene-Brief vollstopfen würde.

## Constraints

- **`brain/raw/**/*.md` ist immutable.** Snapshots unter `historical/` und Reviews unter `reviews/` werden nicht inhaltlich geändert. Einziger erlaubter Grund, eine Datei dort zu berühren: ein neuer Review wird im Rahmen dieses Briefs unter `brain/raw/reviews/2026-05-09-brain-structure-review.md` neu angelegt (Wortlaut in Notes). Keine Edits an existierenden `historical/`- oder `reviews/`-Files.
- **Decision-Pages-Inhalt unverändert.** Wenn ein `sources:`-Eintrag in einer Decision-Page korrigiert wird (Pfad-Fix oder Parens-entfernen), bleibt das Body-Wording, die Argumentation und die Status-Zeile identisch. Diese Session ist Hygiene, nicht Re-Synthese.
- **Pipeline-Code, App-Code, DB-Schema, Migrationen unverändert.** `src/`, `scripts/` (außer ggf. neuer `package.json`-Script — aber keiner ist hier nötig), `drizzle/`, `ingest/.last-run/` sind tabu. Keine neuen Dependencies.
- **Frontmatter-Kontrakt aus `brain/CLAUDE.md` § "Frontmatter convention" hält weiter.** `sources:` enthält nur Pfade (relativ oder URL), `related:` nur Pfade, alles Erklärtext landet im Body. `confidence`/`type`/`title`/`created`/`updated` bleiben unverändert für nicht-betroffene Pages; für Pages, die in dieser Session berührt werden, wird `updated:` auf das tatsächliche Edit-Datum gehoben (vermutlich `2026-05-09`).
- **Wenn Klammer-Kontext aus `sources:` entfernt wird, geht die Information nicht verloren.** Sie wandert entweder in einen Body-Abschnitt „## Notes on sources" am Ende der Page (für Pages, wo der Kontext relevant ist), oder sie wird komplett gestrichen (wenn der Pfad selbsterklärend ist). Implementer entscheidet pro Fall, mit kurzer Begründung im Report.
- **Session-Brief-Pfade prüfen, nicht nur fixen.** Audit ist exhaustiv über `brain/wiki/**/*.md` (alle Frontmatter-`sources:` UND alle Body-Markdown-Links auf relative Pfade), nicht nur die hier in „Context" aufgelisteten Treffer. CC darf weitere Treffer finden und mitfixen (gleiches Pattern, nicht-archive-Sessions); jeder zusätzliche Fix wird im Report aufgelistet.

## Out of scope

- **Lint-Script.** Wird Brief 051. Heute keine `scripts/brain-lint.ts`, keine `npm run brain:lint`, keine GitHub-Action.
- **Open-Question-Item 10 (Anthologie-Re-Test) und Item 11 (Lexicanum-Body-Lore-Pass / FIELD_PRIORITY-Reduktion).** Beide sind eigene Briefs; sie sollen auf einem hygienisch sauberen Brain aufbauen.
- **Re-Synthese irgendeiner Wiki-Page.** Wenn beim Audit auffällt, dass eine Page inhaltlich veraltet ist (z. B. „Phase 3 dry-run" obwohl 3d-Apply gelandet wäre), wird das **nicht** in diesem Brief korrigiert. Stattdessen wird der Befund im Report unter „For next session" gelistet, mit Pfad und Zeile.
- **Atlas-Vault-Inhalte.** Die externe `~/chrono-atlas/` ist mechanisches Postgres-Mirror; Brain-Hygiene berührt sie nicht.
- **`sessions/`-Top-Level-Files.** Die Session-Logs selbst sind immutable (ist Projekt-Geschichte). Wenn ein Session-Log einen kaputten Brain-Link hätte, wäre das ein eigener Brief — aber der Auditing-Scope hier ist `brain/wiki/`, nicht `sessions/`.
- **`/CLAUDE.md` (top-level), `/README.md`, `/ROADMAP.md`, `/ARCHITECTURE.md`, `/ONBOARDING.md`.** Top-Level-Surgery ist 049 sauber gelandet. Diese Files haben keine bekannten Hygiene-Probleme; sie werden hier nicht angerührt.
- **Codex-/GPT-5-Review-Workflow als Generalstruktur.** Wir legen heute den 2026-05-09-Review als einzelnes File unter `brain/raw/reviews/` ab; eine generelle Review-Discipline-Page (wann/wie reviews triggern) ist potenziell ein späterer Brief, nicht hier.

## Acceptance

The session is done when:

- [ ] **Review-Datei angelegt.** Neue immutable Datei `brain/raw/reviews/2026-05-09-brain-structure-review.md` enthält den vollen Review-Wortlaut (siehe „Notes" in diesem Brief) plus YAML-Banner per Brain-Schema (`review-date: 2026-05-09`, `review-source: external-author`, `review-target: brain/ post-049`).
- [ ] **Audit komplett.** Alle `brain/wiki/**/*.md` (inklusive `decisions/` und `workflows/`) wurden auf zwei Klassen geprüft: (a) `sources:`-Frontmatter-Einträge, (b) relative Markdown-Body-Links (`./` und `../`). Jeder geprüfte Pfad existiert auf der Disk, oder wurde gefixt.
- [ ] **Sessions-Archive-Pfad-Fix.** Jeder Frontmatter-`sources:`-Eintrag und jeder Body-Link, der irrtümlich `sessions/archive/2026-05/<id>.md` für eine Session zeigt, die noch unter `sessions/<id>.md` liegt, ist auf den korrekten Pfad geändert. Mindestens betroffen (per Brief, ggf. mehr): `glossary.md` (frontmatter), `decisions/why-haiku-not-sonnet.md` (frontmatter), `decisions/why-multi-source-merge.md` (frontmatter + body), `open-questions.md` (body Item 6 + Item 9). 033 und 046 bleiben archive-Pfade (sind tatsächlich archiviert).
- [ ] **Sources: normalisiert.** Kein `sources:`-Listenitem im gesamten `brain/wiki/`-Tree enthält noch Klammer-Annotationen, freie Beschreibungen oder Nicht-Pfad-Einträge. Wo Klammer-Kontext sinnvoll war, ist er entweder in einen Body-Abschnitt verschoben oder gestrichen. Mindestens betroffen: `index.md` (Zeile 7 — der "All pages under brain/wiki/"-Eintrag wird zu `sources: []` mit Body-Hinweis im Page-Body, weil das Catalog-File eine Roll-up-Page ist), `open-questions.md` (Zeile 7 — README-Pfad bleibt, Annotation raus), `onboarding.md` (Zeile 8 — 049-Pfad bleibt, Annotation raus), `decisions/plan-reshuffle-2026-05-02.md` (Zeile 8 — README-Pfad bleibt, Annotation raus). Audit-exhaustiv, nicht nur diese vier.
- [ ] **Read-Order-Phrasierung in `wiki/index.md` korrigiert.** Zeile 17 ist nicht länger im Widerspruch zur Liste in Zeilen 83–88. Klare „third on session start, after `/CLAUDE.md` and `../CLAUDE.md`"-Formulierung (oder eine semantisch äquivalente, die keinen Konflikt mit der dreistufigen Read-Order erzeugt). Beide Verweise — Zeilen-17-Prosa und Zeilen-83-88-Liste — bleiben in der Datei und sagen dasselbe.
- [ ] **`.gitattributes` ergänzt.** Repo-root erhält eine `.gitattributes`, die für mindestens `brain/raw/historical/**/*.md` LF-only erzwingt, sodass diese Dateien auf Windows-Clients mit `core.autocrlf=true` nicht mehr in `git status` als modifiziert erscheinen. CC entscheidet, ob die Regel auf alle `*.md` repo-weit ausgedehnt wird oder nur auf `brain/raw/historical/` — Begründung im Report. Falls im Zuge der `.gitattributes`-Ergänzung Files re-normalisiert werden müssen, läuft das in einem expliziten Re-Normalisierungs-Commit (`Re-normalize line endings in brain/raw/historical/` o. ä.), getrennt vom Inhalts-Fix-Commit.
- [ ] **Frontmatter `updated:` auf das Edit-Datum gehoben** für jede in dieser Session berührte Wiki-Page. `created:` bleibt unverändert.
- [ ] **`brain/wiki/log.md`** bekommt einen neuen Eintrag `## 2026-05-09 · Lint-Hygiene-Pass · Brain Hygiene Pass (Brief 050)` mit Bullets: was korrigiert wurde, welche Pages berührt, wie viele kaputte Links insgesamt, Pointer auf den Review unter `raw/reviews/`. Append-only, am Ende der Datei.
- [ ] **`brain/wiki/index.md`** zeigt für jede berührte Page das aktualisierte `updated:`-Datum (Catalog ist Roll-up, lebt von Frische).
- [ ] **Verifikation:** `npm run lint` grün, `npx tsc --noEmit` grün, `git status` clean nach den Commits, `git diff --stat HEAD~N` zeigt nur Brain- und `.gitattributes`-Files (kein Drift in `src/`, `scripts/`, `ingest/`, `drizzle/`).
- [ ] **Hand-Audit-Stichprobe im Report.** CC zitiert im Implementer-Report mindestens 3 konkrete Vorher/Nachher-Diffs aus dem Audit (z. B. `glossary.md:11` alt vs. neu), damit Cowork beim Lesen des Reports nicht jede Datei einzeln öffnen muss.

## Open questions

Keine, die den Brief blockieren. CC wird im Verlauf des Audits vermutlich 1–3 Edge-Cases finden; bitte im Report unter „Decisions I made" aufschlagen, mit Pfad und Zeile. Mögliche Kategorien:

- **Frontmatter-`sources:` mit URL-Einträgen** (z. B. Karpathy-Gist-Link in `wiki/workflows/lint.md:8`). URLs sind valide Pfade im Sinne von „der Linter kann sie als String parsen, http-existence-Check ist optional"; sie zählen **nicht** als Klammer-Annotationen und bleiben.
- **`brain/wiki/decisions/why-multi-source-merge.md:20`** hat zusätzlich zum archive-Pfad-Fix einen Pointer `[033 (retracted)](../../../sessions/archive/2026-05/)` auf ein Verzeichnis statt File. Bitte auf den konkreten File-Pfad korrigieren (`2026-05-02-033-arch-phase3-stufe-3a-lexicanum-dryrun.md`) — Cowork-Empfehlung, aber CC darf widersprechen wenn ein Verzeichnis-Link bewusst gemeint war.
- **Body-Links in Decision-Pages, die auf 049-Brief zeigen** (049 lebt unter `sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md`, der zugehörige Implementer-Report unter `sessions/2026-05-09-049-impl-karpathy-brain-atlas-reset.md`). CC entscheidet: linkt der referenzierende Body-Text auf den Brief oder den Report? Beides ist möglich, je nach Kontext.
- **Falls beim Audit Pages mit `confidence: low` und `updated > 30 Tage alt` auftauchen**: nicht in diesem Brief fixen, in „For next session" listen (das ist Lint-Check Nr. 5 aus `wiki/workflows/lint.md`, gehört in 051+).

## Notes

### Audit-Strategie (CC's call, illustrative)

Wahrscheinlich am effizientesten in zwei Pässen:

1. **Pass 1 — Frontmatter.** `find brain/wiki -name "*.md" -exec head -25 {} \;` o. ä., extrahiere alle `sources:`-Listen, prüfe pro Eintrag: ist es ein gültiger relativer Pfad, der existiert? Klassen: (a) gültiger Pfad → ok; (b) Pfad mit Klammer-Kommentar → Kommentar entfernen; (c) Pfad zeigt auf falsche Location (archive vs. top-level) → fixen; (d) freier Text statt Pfad → in Body verschieben oder löschen.
2. **Pass 2 — Body-Links.** Über Markdown-Body grepen nach `(../` und `(./` und `(../../`, prüfen pro Treffer: existiert das Ziel? Falls nein, fixen.

### Wortlaut des Reviews (für `brain/raw/reviews/2026-05-09-brain-structure-review.md`)

YAML-Banner:

```yaml
---
review-date: 2026-05-09
review-source: external-author
review-target: brain/ post-049 (Karpathy-Reset)
---
```

Body (verbatim aus Philipps Cowork-Chat 2026-05-09 reingespiegelt — bitte 1:1 übernehmen, keine Redaktion, keine Kompaktierung der Bullet-Bodies):

```markdown
# Review: Karpathy-/LLM-Wiki-Struktur im Chrono-Lexicanum Repo

## Gesamturteil

Die neue Struktur ergibt grundsätzlich sehr viel Sinn. Der Umbau auf ein Karpathy-style LLM Wiki ist für dieses Projekt passend, weil das Projekt inzwischen nicht mehr nur Code, sondern viel fortlaufende Architektur-, Pipeline-, Session- und Entscheidungslogik enthält.

Die wichtigsten Stärken des Patterns kommen gut zur Geltung:

- `brain/wiki/` ist die synthetisierte Arbeitswahrheit, nicht bloß ein weiteres Archiv.
- `brain/raw/` trennt unveränderte Quellen von bearbeitetem Wissen.
- `brain/wiki/index.md` verhindert, dass Agents blind alle Dateien laden.
- `project-state.md` und `open-questions.md` sind gute Session-Anker.
- Entscheidungen sind als einzelne ADR-Seiten greifbar.
- Die Trennung Brain vs. Atlas ist sehr sinnvoll: Engineering Memory bleibt klein; Buch-/Domain-Daten wandern nicht in den immer geladenen Kontext.

Kurz: Die Architektur ist gut gewählt und passt zum Projektstand.

## Was besonders gelungen ist

1. **Brain / Atlas Trennung**
   Die Entscheidung, Engineering-Wissen im Repo zu halten und Buchdaten in einen externen Atlas auszulagern, schützt den Token-Vorteil des LLM-Wikis. Das ist vermutlich die wichtigste gute Entscheidung im ganzen Reset.

2. **Index-first Navigation**
   `brain/wiki/index.md` als Katalog ist genau richtig. Das gibt Cowork/Claude Code einen Weg, gezielt 2–4 relevante Seiten zu lesen statt alte Sessions zu durchsuchen.

3. **Project-State als Einstieg**
   `project-state.md` beantwortet sauber: Wo stehen wir, was läuft, was ist als nächstes relevant. Das ist viel besser als ein wachsender `sessions/README.md`-Carryover-Block.

4. **Open Questions als Brief-Queue**
   `open-questions.md` ist ein gutes Ersatzsystem für verstreute "For next session"-Notizen. Das sollte die Briefqualität deutlich verbessern.

5. **ADRs mit Revisit-Triggern**
   Die Decision Pages sind sehr hilfreich, weil sie nicht nur sagen "was wurde entschieden", sondern auch wann eine Entscheidung neu bewertet werden sollte.

## Probleme / Risiken

1. **Kaputte oder veraltete Quellenlinks**
   Mehrere Wiki-Seiten verweisen auf Session-Dateien unter `sessions/archive/...`, obwohl diese Dateien aktuell noch direkt unter `sessions/` liegen. Dadurch ist die Wiki-Synthese zwar inhaltlich vermutlich richtig, aber die Quellenkette ist nicht zuverlässig klick- oder prüfbar.
   Das ist der wichtigste Hygiene-Fix, weil LLM-Wiki von nachvollziehbarer Synthese lebt.

2. **`sources:` enthält teilweise Kommentare statt nur Pfade**
   In einigen Frontmatter-Blöcken stehen Quellen wie:
   `../../sessions/README.md (carry-over section, pre-049)`
   Für Menschen ist das verständlich, aber ein zukünftiger Linter kann diesen Pfad nicht sauber prüfen. Besser: reine Pfade in `sources:`, Kontextnotizen in den Body oder einen eigenen Abschnitt.

3. **Read-Order Mini-Widerspruch**
   An einer Stelle steht sinngemäß, `index.md` werde "second" gelesen, obwohl die tatsächliche Reihenfolge ist:
   top-level `CLAUDE.md` → `brain/CLAUDE.md` → `wiki/index.md`.
   Klein, aber Read-Order sollte absolut eindeutig sein, weil Agents genau daran hängen.

4. **Raw-Snapshots zeigen Git-Churn durch Line-Endings**
   Einige Dateien unter `brain/raw/historical/` erscheinen als modified, obwohl nur LF/CRLF-Warnungen vorliegen. Für "immutable raw sources" ist das unschön. Eine `.gitattributes`-Regel für Markdown wäre sinnvoll.

5. **Lint-Workflow ist dokumentiert, aber noch nicht automatisiert**
   Der manuelle Lint-Workflow ist gut beschrieben, aber gerade diese Prüfung hätte die kaputten Links sofort gefunden. Ein kleiner `brain:lint`-Script wäre früh wertvoller als später.

## Empfehlung

Ich würde keinen strukturellen Rollback machen. Die Struktur ist gut.

Ich würde aber als nächsten kleinen Hygiene-Brief einplanen:

1. Alle `sources:` und Markdown-Links in `brain/wiki/**/*.md` gegen existierende Dateien prüfen.
2. Falsche `sessions/archive/...`-Links auf aktuelle Pfade korrigieren.
3. `sources:` auf reine Pfade normalisieren; erklärende Klammern aus Frontmatter entfernen.
4. Read-Order-Formulierung in `index.md` korrigieren.
5. `.gitattributes` ergänzen, damit `brain/raw/historical` nicht durch Line-Endings als geändert erscheint.
6. Optional, aber stark empfohlen: minimalen `npm run brain:lint` bauen, der Frontmatter, Quellenpfade, relative Links und Index-Abdeckung prüft.

## Fazit

Die neue LLM-Wiki-Struktur ist inhaltlich und architektonisch gut. Sie bringt die Stärken des Patterns tatsächlich zum Tragen: kompakte Arbeitswahrheit, klare Quellen/Synthese-Trennung, bessere Session-Orientierung und weniger Kontextmüll.

Der aktuelle Schwachpunkt ist nicht das Design, sondern die Link- und Source-Hygiene. Wenn diese einmal saubergezogen und per Lint abgesichert wird, ist das Brain eine sehr brauchbare Grundlage für Cowork/Claude-Code-Arbeit.
```

(Dieser Brief 050 setzt Empfehlungen 1–5 um. Empfehlung 6 — Lint-Script — ist Brief 051.)

### Reihenfolge der Commits (CC's call, illustrativ)

Vier saubere Commits sind plausibel, wenn CC das mag:

1. `Add 2026-05-09 brain-structure review under brain/raw/reviews/`
2. `Fix sessions/archive/* paths in brain/wiki/{frontmatter, body links}`
3. `Normalize brain/wiki/ frontmatter sources to pure paths`
4. `Fix read-order phrasing in brain/wiki/index.md`
5. `Add .gitattributes for LF-only markdown in brain/raw/historical/` (+ ggf. re-normalize commit)
6. `Update brain/wiki/log.md + index.md updated-dates`

Eins pro Logical-Change ist Pflicht (siehe `/CLAUDE.md` § Git-Konventionen); ob das genau 6 Commits werden oder weniger, ist CC's Sache.

### Was wir nach Merge dieses Briefs als Nächstes tun

- **Brief 051** — minimaler `npm run brain:lint`-Script, der genau diesen Hygiene-Stand als ersten grünen Lauf bestätigt und ab dort drift catched. Check-Liste steht in `brain/wiki/workflows/lint.md` (8 Kategorien, alle dokumentiert).
- **Brief 052** — Anthologie-Re-Test für Hebel E (Open-Question 10).
- **Brief 053** — Lexicanum-Junction-Cut: Option A (Body-Lore-Pass, ~150 LoC) **oder** Option B (FIELD_PRIORITY-Reduktion, ~5 LoC); Cowork's Call. Open-Question 11.
- Danach: Modell-Entscheidung-Bundle (Items 1+2), Hand-Check-Workflow (Item 3), 3d-Apply.

Diese Reihenfolge stellt sicher, dass alle pipeline-relevanten Briefs auf einem hygienisch sauberen, lint-überwachten Brain aufbauen.
