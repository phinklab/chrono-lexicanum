---
session: 2026-07-21-257
role: implementer
date: 2026-07-21
status: complete
slug: text-delint-emdash
parent: none            # maintainer-prompt kickoff (launch mode), no architect brief
links: []
commits: []             # filled at PR time
---

# Text-Delint: Em-dash-Lint + Sweep über die gerenderten Site-Texte

## Summary

Neues CI-Lint `text:lint` verbietet das Em-dash (U+2014) in gerendertem Site-Text (String-Literale, Template-Text, JSX-Text unter `src/`); alle 157 Bestandsverstöße in 63 Dateien wurden redaktionell umformuliert (nie mechanisch ersetzt), Lint/tsc/eslint/Tests grün. Zweiter Deliverable der Session: eine Web-Recherche „Texten ohne AI-Slop" als Entscheidungsvorlage (Annex unten) — **noch nichts davon umgesetzt**, Philipp nickt erst ab.

## Kontext

Maintainer-Entscheid dieser Session: Die frühere Idee „Deutsch als Redaktions-Master, dann Rückübersetzung" ist verworfen (Aufwand vs. Nutzen; Mehrsprachigkeit wäre ein eigenes Projekt). Stattdessen: die englische Fassung glattziehen. Reihenfolge: (1) Em-dash-Lint + Sweep über die Website-Texte (diese Session), (2) AI-Slop-Recherche als Entscheidungsvorlage (diese Session, Annex), (3) nach Freigabe der redaktionelle Pass über die UI-Texte, (4) Buch-Synopsen/seed-data als eigener Content-Pass.

## What I did

- `scripts/text-lint.ts` — neues Lint (TypeScript-Compiler-API): scannt String-Literale, Template-Literal-Textteile und JSX-Text unter `src/` auf U+2014. Kommentare sind bewusst exempt (rendern nie). Suppression per `text-lint-allow`-Kommentar auf der Zeile. Exit 1 bei Verstößen.
- `package.json` — Script `text:lint`.
- `.github/workflows/ci.yml` — `npm run text:lint` als Step nach `typecheck` im required Job `lint-and-typecheck`.
- 63 Dateien unter `src/` — alle 157 Em-dash-Vorkommen in renderbarem Text redaktionell aufgelöst (4 parallele Edit-Agents mit gemeinsamem Regelwerk; Diff eng: 161+/154−, keine CRLF-Aufblähung).

## Decisions I made

- **AST-Scope statt Rohtext-Scope.** Roh enthält `src/` 1528 Em-dashes, davon ~90 % in Code-Kommentaren. Das Lint prüft nur, was rendert — Kommentare bleiben unangetastet (kein kosmetischer Riesen-Diff, Regel bleibt scharf).
- **`src/lib/ingestion/` ausgenommen.** Interne LLM-Prompts/Pläne, kein Site-Text; gehört zum Step-2-Content-Pass zusammen mit `scripts/seed-data/`.
- **Keine AI-Phrasen-Bannliste im Lint.** Bewusst zurückgestellt: Welche Liste, welche Präzision, welches Vorgehen — das entscheidet die Recherche (Annex) + Philipps Freigabe. Das Lint ist dafür erweiterbar gebaut.
- **Ersetzungs-Regelwerk statt Zeichenersatz.** Nie nackter Bindestrich, im Englischen auch kein ` – `-Ausweich. Kleinste natürliche Umformung: Komma, Doppelpunkt, Klammern, Semikolon, Satz-Split, leichte Rephrase. Deutsch (Imprint/Privacy) darf sparsam den korrekten Gedankenstrich ` – ` behalten (2 Stellen).
- **Trenner-Konvention: Haus-Interpunkt `·`.** Titel-/Metadaten-Trenner („Chronicle · Timeline", `${m} · ${name}`, `X · Compendium") folgen dem existierenden `·`-Register der Seite statt Dash-Ersatz.
- **Leerwert-Platzhalter → einzelner Halbgeviertstrich `–`.** Elf Stellen (Tabellenzellen, Timestamp-Fallbacks, `FIELD_EMPTY`, No-Play-Glyphe): einzelnes Glyph, keine Prosa — bleibt typografisch der Standard-Leerfeld-Marker, ohne gebanntes Zeichen.
- **Zwei minimal-invasive Rephrases in Voyage-Texten** (gaunt.ts „Ancreon Sextus", horus.ts „Isstvan V"), wo gepaarte Parenthese-Dashes weder Komma noch Klammer vertrugen; Bedeutung/Länge erhalten.

## Verification

- `npm run text:lint` — `OK (0 violations, 254 files scanned)`
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 41 Suiten grün (7.8s)
- `git diff --numstat` — zeilenscharfe Edits (max. 10/10 pro Datei), kein Whole-File-Rewrite
- Kein Browser-Durchklick: reine Textänderungen; Philipp liest im PR-Diff gegen (sein präferierter Verify-Modus für UI-Text)

## Open issues / blockers

- Die AI-Slop-Recherche (Annex A) wartet auf Philipps Abnicken; erst danach Phrasen-Regeln/Editorial-Pass.
- `docs/werkstatt-roadmap.md` nicht angefasst (Koordinations-Rollups laufen über Cowork/eigene Koordinations-PRs).

## For next session

- **Step 2 Content-Pass:** Em-dash + Slop-Regeln auf `scripts/seed-data/` ausdehnen (760 Em-dashes in 436 Buch-SSOTs, dazu blurbs/events/characters) — braucht JSON-Walker im Lint (vorbereitet) und den redaktionellen Synopsis-Pass. Auch `src/lib/ingestion/`-Prompts dann mitziehen, damit Neuware sauber ankommt.
- **Editorial-Pass UI-Texte** nach Freigabe der Recherche-Empfehlung.
- Erwägen: `text:lint`-Regeln, die die Recherche empfiehlt (Phrasen-Bannliste, Struktur-Heuristiken), als zweite Rule-Klasse ins bestehende Skript.

## References

- TypeScript Compiler API (`ts.createSourceFile`, `forEachChild`) — String-/Template-/JSX-Text-Knoten.
- Annex A (unten): Recherche „Texten ohne AI-Slop" mit Quellen.

---

## Annex A — Recherche: Texten ohne AI-Slop (Entscheidungsvorlage, 2026-07-21)

Deep-Research-Lauf (101 Agents, 19 Quellen, 25 Claims adversarial verifiziert: 23 bestätigt, 2 widerlegt). **Noch nichts umgesetzt** — Auswahl wartet auf Maintainer-Freigabe.

### A.1 Detektion (CI-fähig)

| Artefakt | Was | Lizenz / Pflege | Einschätzung |
|---|---|---|---|
| [Vale](https://github.com/vale-cli/vale) | Prose-Linter, Regeln in YAML, markup-aware | MIT; sehr aktiv (v3.15.1, ~5.6k Sterne; Grafana/Jenkins/Meilisearch nutzen es in CI) | Referenz-Engine, aber Go-Binary (eigener Install-Step) und Datei-orientiert |
| [tbhb/vale-ai-tells](https://github.com/tbhb/vale-ai-tells) | 76 Vale-Regeln, direkt aus dem Wikipedia-Essay abgeleitet (Vokabular, not-just-X-but-Y, Rule-of-three, Hedging) | MIT; frisch gepflegt (v1.25.0, 2026-07-17) | Stärkstes fertiges Regelpaket; rein lexikalisch/phrasal (keine Satzrhythmus-Analyse) |
| [ammil-industries/vale-signs-of-ai-writing](https://github.com/ammil-industries/vale-signs-of-ai-writing) | 18 Vale-Regeln, gleiche Quelle | **CC-BY-SA-4.0**; v0.1.x, 23 Sterne | Nur als Zweitquelle/Cross-Check; Share-alike beim Vendoren beachten |
| [haidrrrry/humanize-ai-writing](https://github.com/haidrrrry/humanize-ai-writing) | Zero-dependency Node-Scanner (~40 Regex-Tells, `file:line:col`, exit 1) + Systemprompt + Claude-Skill | MIT; Mini-Projekt (6 Sterne, 1 Maintainer) | Kein Dependency-Kandidat, aber **Code-Donor**: npm-nativ, exakt das Muster unseres `text-lint.ts` |

### A.2 Prävention (LLM-seitig, Claude-Skills)

| Artefakt | Was | Lizenz / Signal | Einschätzung |
|---|---|---|---|
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | Claude-Skill: Phrasen-/Struktur-Bannlisten + Before/After-Beispiele; inkl. Em-dash-Ban | MIT; ~14k Sterne (meist-adoptiert) | Sicherste Wahl nach Adoption |
| [adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) | Tiefste **Struktur**-Regeln: bannt „It's not just X, it's Y", bricht Rule-of-three, erzwingt Satzlängen-Varianz, bannt Partizipial-Anhängsel („…, highlighting the importance of"), Dash-Totalverbot | MIT; v3.0 (2026-07-06), ~99 Sterne | Beste Regeltiefe, kleines Projekt |
| [jalaalrd/anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing) | Zählbarste Listen: 53 Wörter, 36 Phrasen, 16 Satz-Opener, ~10 Strukturregeln | MIT; 216 Sterne; Effektivität self-reported, ohne Benchmark | Listen-Donor (Marketplace-Install-Claim wurde in Verifikation widerlegt) |
| [Byk3y/no-slop](https://github.com/Byk3y/no-slop) | Banliste 66 Wörter + 24 Phrasen mit Ersatzvorschlägen | MIT; 1 Commit, 5 Sterne | Nur Wortlisten-Donor |
| [realrossmanngroup/no_ai_slop_writing_rules](https://github.com/realrossmanngroup/no_ai_slop_writing_rules) | CLAUDE.md + Skills; behandelt Em-dash als „The Primary AI Tell" | **keine Lizenz**; 598 Sterne | Lesen ja, **nicht vendoren** |

### A.3 Editorial-Referenz

**Wikipedias [„Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)** (WikiProject AI Cleanup) ist die kanonische Taxonomie — mindestens vier der Tools oben leiten ihre Regeln explizit daraus ab. Als menschliche Redaktions-Rubrik anwenden mit **Cluster-Heuristik**: ein einzelnes Flag-Wort beweist nichts, erst Häufungen von Tells zählen.

### A.4 Caveats (verifiziert)

- **Kein einziges Tool hat FP/FN-Benchmarks**; alle Wirksamkeits-Claims sind self-reported.
- **40k-Domänen-Kollision:** `realm`, `tapestry`, `vibrant`, `testament`, `pivotal` stehen auf jeder Bannliste, sind in Fantasy-Synopsen aber legitim → vor Enforcement zwingend Dry-Run über Synopsen-Stichprobe + Ausnahmeliste.
- Lücken der Recherche: proselint/textlint nicht bewertet, kommerzielle „Humanizer" nicht bewertet.
- Vale lintet Dateien, nicht DB-Zeilen — seed-data-JSON bräuchte einen Extraktionsschritt. Unser eigener Scanner kann JSON-Werte dagegen direkt walken.

### A.5 Empfehlung (zur Freigabe)

1. **CI: eigenes `text:lint` ausbauen statt Vale einführen.** Wir haben die npm-native Engine schon; sie kann als Einzige seed-data-JSON direkt walken (Step 2). Zweistufiges Regelwerk: **error** = Em-dash (live) + eindeutige Verbatim-Phrasen („It's worth noting", „stands as a testament to", „In today's fast-paced world", „not just X, it's Y"-Muster); **warning** = Vokabelliste (delve, seamless, pivotal, …) mit 40k-Ausnahmeliste. Regel-Seeds aus den MIT-Quellen (vale-ai-tells, no-slop, jalaalrd); nichts aus dem lizenzlosen Rossmann-Repo.
2. **Generierung: einen Anti-Slop-Skill ins Repo** (stop-slop als Adoption-Leader oder anti-slop-writing für Satzrhythmus-Regeln), damit Weekly-Refresh, Podcast-Ingest und künftige Synopsis-Rewrites schon sauber ankommen.
3. **Editorial: Wikipedia-Essay als Rubrik** für den menschlichen Pass über UI-Texte und später die ~900 Synopsen, Cluster-Urteil statt Einzelwort-Verdikt.
4. **Vor Enforcement: Kalibrier-Dry-Run** der Wortlisten über eine Synopsen-Stichprobe, daraus Ausnahmen + Severity-Zuordnung.
