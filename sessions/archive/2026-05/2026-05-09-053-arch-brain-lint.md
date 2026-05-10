---
session: 2026-05-09-053
role: architect
date: 2026-05-09
status: implemented
slug: brain-lint
parent: 2026-05-09-052
links:
  - 2026-05-08-049
  - 2026-05-09-050
  - 2026-05-09-051
  - 2026-05-09-052
commits: []
---

# Brain Lint - einmal sauber bauen

## Goal

Eine funktionierende, durchdachte und fuer unseren Use-Case optimale Brain-Lint-Schicht in **dieser einen Session** shippen, damit wir danach wieder an Produkt-/Pipeline-Arbeit gehen koennen.

Das Ergebnis ist nicht nur ein Minimal-Script. Es ist ein belastbarer lokaler und CI-faehiger Guardrail fuer das Chrono Brain: Frontmatter, Sources, Markdown-Links, Catalog-Freshness, Raw-Banner, Brain-Groessenbudget, Inline-Diff-Quote-Regel und high-signal stale-claim checks. Das Script **fixt nicht automatisch**, aber die Implementierungs-Session darf klare bestehende Hygiene-Probleme korrigieren, damit der deterministische Baseline-Run am Ende sauber ist.

## Context

049 hat das Brain nach Karpathy-Pattern eingefuehrt und `brain/wiki/workflows/lint.md` als Follow-up definiert. 050/051 haben bereits manuelle Hygiene-Probleme gefunden und gefixt: falsche Source-Pfade, Phantom-Filenames, fehlende Doc-Stubs, zu schwere ADR-/Queue-Seiten. 052 hat die Ingest-Diff-Retention entschieden und eine neue universelle Brain-Regel gesetzt: Wiki-Seiten duerfen Diff-Rohfelder nur als Source-Pfad referenzieren, nicht inline zitieren.

Jetzt ist der richtige Moment fuer das Script: Das Brain ist noch klein genug, um die Regeln sauber zu kodifizieren, aber schon gross genug, dass manuelles Linting wieder Arbeit frisst. Nach 053 soll "Brain ist hygienisch" kein offener Meta-Thread mehr sein.

Aktuelle Ausgangspunkte:

- Lint-Workflow: `brain/wiki/workflows/lint.md`
- Brain-Schema: `brain/CLAUDE.md`
- Report-Ort: `brain/outputs/lint/`
- CI: `.github/workflows/ci.yml`
- NPM-Scripts: `package.json`

Webrecherche ist fuer diese Session nicht notwendig. Die relevanten Regeln sind lokale Brain-Konventionen, nicht ein externes Framework.

## Constraints

- **Ein Session-Cut, keine halbe Loesung.** Wenn das Script deterministische Findings im aktuellen Brain findet, entweder in derselben Session beheben oder als bewusstes nicht-blocking Warning im Report begruenden. Ziel: `npm run brain:lint` ist am Ende fuer blocking checks gruen.
- **Lint editiert nicht automatisch.** Keine Auto-Fix-Funktion. Korrekturen passieren als normale Datei-Edits in dieser Implementierungs-Session oder spaeter via Ingest.
- **High signal beats exhaustive.** Stale-claim checks sollen nuetzlich sein, aber nicht CI-noisy. Harte Fehler nur fuer deterministische Regeln; heuristische Drift-Verdachte sind Warnings.
- **Keine neuen Dependencies, wenn vermeidbar.** Frontmatter ist ein kleiner YAML-Subset. Bevor eine neue Dependency eingefuehrt wird, lieber einen lokalen Parser fuer Scalars, `[]` und Block-Arrays schreiben. Falls CC eine YAML-Lib fuer klar besser haelt, muss sie direkt in `package.json`/Lockfile deklariert und begruendet werden.
- **Cross-platform.** Muss unter Windows lokal und Ubuntu CI laufen. Pfadnormalisierung im Report mit `/`, Dateisystemzugriff via Node `path`.
- **Keine App-/Pipeline-/DB-Aenderungen.** Dieses Script liest Repo-Dateien. Kein DB-Zugriff, keine Atlas-Generierung, keine Ingest-Ausfuehrung.
- **Reports sind Artefakte, nicht Wiki.** Reports landen unter `brain/outputs/lint/`, nicht unter `brain/wiki/`.

## Out of scope

- LLM-basierte stale-claim Pruefung.
- Auto-Fix.
- Weekly GitHub Action, Issue-Erstellung oder Bot-Kommentar. CI-Integration reicht.
- Atlas-Lint.
- Raw Session-Content umschreiben. Sessions sind historisch; nur Links aus aktuellen Wiki-/Doc-Seiten sind lintbar.
- Vollstaendige semantische Wahrheit ("Phase 3 ist wirklich in genau diesem Zustand") beweisen. Das Script prueft greifbare Drift-Indizien.

## Implementation shape

### 1. CLI und Scripts

Neu:

- `scripts/brain-lint.ts`
- `package.json`: `"brain:lint": "tsx scripts/brain-lint.ts"`

CLI-Verhalten:

- Default: scannt Repo, schreibt `brain/outputs/lint/YYYY-MM-DD.md`, druckt Summary, exit `1` bei blocking Findings, sonst `0`.
- `--date=YYYY-MM-DD`: Report-Datum ueberschreiben, damit Tests/Review reproduzierbar sind.
- `--no-write`: keinen Report schreiben, nur Summary + Exit-Code. Das nutzt CI.
- `--strict`: Warnings werden ebenfalls exit-code-relevant. Default bleibt: nur blocking Findings blocken.

CI:

- `.github/workflows/ci.yml` bekommt nach `npm run lint` oder nach `npm run typecheck` einen Schritt:
  - `npm run brain:lint -- --no-write`

### 2. Finding model

Intern mit einem klaren Modell arbeiten:

```ts
type Severity = "error" | "warning";
type Category =
  | "Frontmatter"
  | "Sources"
  | "Internal links"
  | "Catalog freshness"
  | "Raw banners"
  | "Decision metadata"
  | "Stale low-confidence"
  | "Brain size budget"
  | "Inline diff raw fields"
  | "Stale claim suspects";

interface Finding {
  severity: Severity;
  category: Category;
  file: string;
  line?: number;
  message: string;
  evidence?: string;
  suggestion?: string;
}
```

Report-Gruppierung nach Category, dann Severity. Jede Finding-Zeile soll genug Kontext liefern, dass Cowork/CC ohne erneute Detektivarbeit handeln kann.

### 3. Frontmatter checks (blocking)

Fuer alle `brain/wiki/**/*.md`, ausser `brain/wiki/log.md`:

- YAML-Frontmatter muss am Dateianfang stehen.
- Pflichtfelder:
  - `title` string
  - `type` one of `overview | decision | workflow | concept | source-summary | reference`
  - `created` `YYYY-MM-DD`
  - `updated` `YYYY-MM-DD`
  - `sources` array, darf leer sein
  - `related` array, darf leer sein
  - `confidence` one of `high | medium | low`
- `updated >= created`
- `type: decision` braucht `decision-date: YYYY-MM-DD`
- `decision-date` darf nicht nach `updated` liegen.

Separater Category-Eintrag `Decision metadata` ist okay, auch wenn die technische Ursache Frontmatter ist. Der Report soll lesbar sein, nicht akademisch perfekt normalisiert.

### 4. Sources checks (blocking)

Fuer jedes `sources:`-Element in Wiki-Frontmatter:

- HTTP(S)-URLs sind erlaubt und werden nicht gebrowst.
- Relative Pfade werden relativ zur aktuellen Wiki-Datei aufgeloest.
- Existenz pruefen.
- Anchors (`#...`) vor dem Existenzcheck entfernen.
- Reine Kommentare/Freitext in `sources:` sind Fehler. 050/051 haben genau dafuer die Vorarbeit geleistet.

Zusatz:

- Wenn ein `sources:`-Pfad in `ingest/.last-run/` zeigt, ist das erlaubt. Der Linter prueft nur Existenz und stellt sicher, dass der Wiki-Body keine grossen Rohfelder inline quote-t.

### 5. Markdown internal link checks (blocking)

Fuer alle `brain/wiki/**/*.md`, `brain/CLAUDE.md`, `brain/outputs/lint/README.md`, top-level README/ARCHITECTURE/ROADMAP/ONBOARDING/CLAUDE nur soweit Links nach `brain/` oder `sessions/` zeigen:

- Markdown links `[...]()` und Images `![...]()` erkennen.
- Fenced code blocks vor dem Link-Scan ignorieren.
- Externe URLs, `mailto:`, reine Anchors und Obsidian-Wikilinks ignorieren.
- Relative Targets aufloesen, Anchor strippen, URL-Encoding tolerieren.
- Links in externe Atlas-/Vault-Pfade ueberspringen, wenn sie offensichtlich nicht im Repo liegen.

Kein Anchor-Existenzcheck in dieser Session. Datei-Existenz reicht.

### 6. Catalog freshness (blocking)

`brain/wiki/index.md` ist der Brain-Katalog. Das Script prueft:

- Jede Wiki-Seite ausser `log.md` ist in `index.md` per relativer Markdown-Link aufgefuehrt.
- Jede in `index.md` aufgefuehrte Wiki-Seite existiert.
- Wenn `index.md` fuer eine Seite ein Updated-Datum in der Tabellenzeile zeigt, muss es mit dem Frontmatter-`updated` dieser Seite uebereinstimmen.

`index.md` selbst ist vom Orphan-Check exempt, muss aber seine eigene Frontmatter haben.

### 7. Orphan checks (blocking)

Fuer `type: overview | decision | workflow | concept` gilt:

- Mindestens ein inbound Link aus `brain/wiki/index.md`.

`type: reference | source-summary` sind exempt. `log.md` ist exempt.

Hinweis: Der alte Workflow-Text sagt "mindestens index.md"; genau das reicht fuer unseren Use-Case. Cross-page graph completeness ist nice-to-have, aber nicht blocking.

### 8. Raw banner checks (blocking)

`brain/raw/historical/**/*.md`:

- alle `.md` ausser eventuelle `README.md` brauchen Frontmatter mit:
  - `snapshot-of`
  - `snapshot-date`
  - `snapshot-reason`
  - `canonical-now`
- `snapshot-date` muss `YYYY-MM-DD` sein.

`brain/raw/reviews/**/*.md`:

- alle `.md` ausser `README.md` brauchen Frontmatter mit:
  - `review-date`
  - `review-source`
  - `review-target`
- `review-date` muss `YYYY-MM-DD` sein.

### 9. Stale low-confidence (warning by default)

Wiki-Seiten mit `confidence: low` und `updated` aelter als 30 Tage werden gemeldet.

Default severity: `warning`, damit CI nicht wegen bewusst niedriger Confidence blockiert. Mit `--strict` wird es blocking.

### 10. Brain size budget (warning by default)

Damit das Brain klein bleibt:

- Wiki-Seiten mit mehr als 300 Body-Zeilen: warning.
- Decision Pages mit mehr als 100 Body-Zeilen: warning, weil ADRs sonst Report-/Timeline-Material schlucken.
- `brain/wiki/project-state.md` mit mehr als 160 Body-Zeilen: warning, weil das der Session-Start-Pfad ist.

Nicht auto-fixen. Report soll sagen: "cut/synthesize in a follow-up ingest".

### 11. Inline diff raw field guard (blocking)

052 hat die Regel gesetzt: Wiki-Seiten duerfen Diff-Rohfelder nicht inline tragen.

Scan alle `brain/wiki/**/*.md`, mit expliziten Ausnahmen fuer Regel-/Workflow-Seiten, die die Feldnamen nur benennen:

Erlaubte Ausnahmen:

- `brain/wiki/pipeline-state.md`
- `brain/wiki/workflows/lint.md`
- `brain/wiki/workflows/ingest.md`

Geblockte Tokens in allen anderen Wiki-Seiten:

- `rawLlmPayload`
- `rawHardcoverPayload`
- `updated[].diff`
- `llm_flags`
- `payload`
- `fieldOrigins` nur wenn in einem langen JSON-/Diff-Kontext, nicht als Glossar-Term

Implementationshinweis: Nicht jedes einzelne Wort `payload` in Prosa soll blind failen. Gute Heuristik: blocking, wenn der Token in Code-Fence, Inline-Code oder einer JSON-aussehenden Zeile steht; warning, wenn nur Prosa-Treffer.

### 12. Stale claim suspects (warnings)

Das ist die schwerste Kategorie. Sie soll in 053 existieren, aber **bewusst klein und zero-noise** bleiben. Nur zwei Heuristiken sind hier in v1 zugelassen, beide reine Existenz-Checks ohne Token-Pattern-Heuristik:

- **NPM script claims:** Alle `npm run <script>`-Vorkommen in Wiki/Brain-Docs gegen `package.json.scripts` pruefen. Fehlendes Script = warning.
- **Repo path claims:** Backticked path-like Tokens und Markdown-link Targets mit Prefix `src/`, `scripts/`, `brain/`, `sessions/`, `docs/`, `ingest/`, `.github/` gegen Existenz pruefen. Nicht nochmal melden, wenn der Markdown-Link-Checker schon einen blocking Link findet.

**Bewusst nicht in v1:** Code-Symbol-Heuristik (backticked Tokens, die wie `CONSTANT_NAME`, `functionName()`, `TypeName` aussehen, gegen `src/` greppen). Selektion ist fuzzy, false-positive-Risiko in Glossar-/Concept-Pages erodiert das Vertrauen in den Warning-Kanal, bevor er sich etabliert hat. Kommt in einen Folge-Brief, wenn wir 2-3 Wochen reale Lint-Reports gesehen haben und der Warning-Kanal stabil ist. Wenn CC waehrend der Implementierung eine andere robuste, evident-zero-noise stale-claim-Heuristik sieht, darf er sie als warning ergaenzen — aber nicht als blocking Gate, und mit Begruendung im Report.

Wichtig: Keine breit semantischen Claims wie "Phase 3 in flight" automatisch entscheiden. Solche Drift faengt der menschliche Blick beim periodischen Review.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `scripts/brain-lint.ts` existiert und implementiert die oben genannten Checks.
- [ ] `package.json` enthaelt `brain:lint`.
- [ ] `.github/workflows/ci.yml` ruft `npm run brain:lint -- --no-write` auf.
- [ ] `brain/wiki/workflows/lint.md` ist aktualisiert: Es beschreibt den realen Befehl, Severity-Policy, CI-Verhalten, Report-Ort und was weiterhin nicht geprueft wird.
- [ ] `brain/CLAUDE.md` enthaelt nicht mehr "script is follow-up"; es zeigt auf den echten Lint-Befehl.
- [ ] `brain/outputs/lint/README.md` ist aktualisiert, falls es noch sagt, der Ordner sei leer / Script existiere nicht.
- [ ] Erster lokaler Report wurde erzeugt: `brain/outputs/lint/2026-05-09.md`.
- [ ] Deterministische blocking Findings sind entweder behoben oder im Implementer-Report begruendet, falls bewusst nicht behoben.
- [ ] `npm run brain:lint` endet am Schluss mit Exit `0` oder, falls echte nicht-schnell-fixbare blocking Findings bleiben, mit Exit `1` und sehr klarer Begruendung im Report. Ziel ist Exit `0`.
- [ ] `npm run lint` laeuft.
- [ ] `npm run typecheck` laeuft.
- [ ] `npm run check:eras` laeuft weiterhin.
- [ ] Implementer-Report `sessions/2026-05-09-053-impl-brain-lint.md` dokumentiert:
  - welche Checks implementiert sind,
  - welche existierenden Brain-Probleme gefunden wurden,
  - welche davon gefixt wurden,
  - welche Warnings bewusst bleiben,
  - ob `--strict` heute sauber waere oder nicht.

## Open questions

- Welche Stale-claim-Heuristik war beim echten Brain-Run nuetzlich, und welche waere zu noisy gewesen?
- Soll `--strict` in einer spaeteren Session fuer CI aktiviert werden, sobald wir 2-3 Wochen Erfahrung mit den Warnings haben?
- Hat der Brain-size-budget Check konkrete Seiten gefunden, die wir vor Produktarbeit noch kuerzen sollten, oder reicht das als spaeterer Ingest-Hinweis?

## Notes

### Report shape

Der Report soll etwa so aussehen:

```markdown
# Brain lint report 2026-05-09

Generated by `npm run brain:lint`.

Summary:
- Blocking findings: 0
- Warnings: 3

## Stale claim suspects

- [warning] `brain/wiki/onboarding.md:161` mentions `npm run foo`, but `package.json` has no `foo` script.

## Brain size budget

- [warning] `brain/wiki/decisions/example.md` has 128 body lines; decision pages should stay under 100.
```

Wenn eine Kategorie leer ist, kann sie weggelassen werden. Wenn alles sauber ist, schreibt der Report explizit "No findings."

### Baseline philosophy

Diese Session darf kleine Wiki-/Doc-Korrekturen machen, wenn der neue Linter echte deterministische Probleme findet. Das verletzt nicht "Lint edits nothing": Das Script editiert nichts. CC editiert bewusst, reviewed und dokumentiert.

### Warum warning/error split

Wir wollen CI-Schutz, aber keine nervige Meta-Arbeit. Darum:

- Fehler = Schema, kaputte Links, kaputte Sources, fehlende Raw-Banner, fehlender Catalog, Inline-Diff-Rohdaten.
- Warnings = Drift-Verdacht, Groessenbudget, stale low-confidence.

Wenn sich die Warnings als stabil/high-signal erweisen, koennen wir spaeter `--strict` in CI aktivieren. Heute nicht.

### Brain-size-Schwellen (300 / 100 / 160)

Die Limits in §10 (Wiki-Seiten ≤300, Decisions ≤100, `project-state.md` ≤160 Body-Zeilen) sind **kalibriert auf die Brain-Verteilung Stand Mai 2026** post-051-Slim-Pass. Sie sind absichtlich fest, nicht hart begruendet — Faustregeln, die zur aktuellen Schlankheits-Disziplin passen. Wenn das Brain organisch waechst und Schwellen sich als zu eng/zu locker erweisen, justiert ein spaeterer Brief die Zahlen; Limits leben in einer einzigen Stelle im Skript (Konstanten-Block am Top), damit Justierung trivial bleibt.

### Future-Anker: deterministic vs heuristic (Astro-Han-Modell)

Die externe Karpathy-Lint-Implementierung [`Astro-Han/karpathy-llm-wiki`](https://github.com/Astro-Han/karpathy-llm-wiki) (Agent-Skill, Mai 2026) trennt Lint sauber in zwei Klassen: *deterministic checks (auto-fix)* — Index-Konsistenz, interne Links, Raw-Refs — vs *heuristic checks (report-only)* — Faktische Widersprueche, veraltete Claims, Orphan-Pages. Das Vokabular passt zu unserem error/warning-Split.

Unser 053 baut deterministisch + script-basiert. Eine spaetere Erweiterungsachse ist ein **LLM-driven Heuristik-Pass** (Skill oder MCP-Tool), das Wiki-Seiten gegen Code-Reality liest und Drift-Verdaechte als Warnings reportet — z.B. "diese Seite spricht von `pickPrimarySource` aber die Funktion existiert nicht mehr unter dem Namen". Das ersetzt nicht das Skript, sondern erweitert es um die teure-aber-tiefe Schicht. Nicht in 053; explizit als Pfad benannt, damit ein spaeterer Brief das nicht neu erfinden muss.

Astro-Han direkt einziehen geht nicht — deren Schema (`raw/<topic>/`, `wiki/<topic>/<article>.md`, max. eine Verzeichnisebene) und deren Auto-Fix-Logik kollidieren mit unserem Brain-Layout und der Karpathy-Reset-Regel "Lint reports, Ingest fixes". Aber das mental-Modell ist klauenswert.
