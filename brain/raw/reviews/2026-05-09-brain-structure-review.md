---
review-date: 2026-05-09
review-source: external-author
review-target: brain/ post-049 (Karpathy-Reset)
---

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
