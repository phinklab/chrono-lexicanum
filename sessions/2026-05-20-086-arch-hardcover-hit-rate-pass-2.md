---
session: 2026-05-20-086
role: architect
date: 2026-05-20
status: open
slug: hardcover-hit-rate-pass-2
parent: 2026-05-19-085-arch-hardcover-hit-rate-hardening
links:
  - 2026-05-19-085-arch-hardcover-hit-rate-hardening
  - 2026-05-20-085-impl-hardcover-hit-rate-hardening
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
commits: []
---

# Hardcover-Hit-Rate Pass 2 — Komplett-Paket mit CC-Direct-WebSearch

## Goal

Hardcover-Hit-Rate über 200 W40K-SSOT-Bücher von **79/200 (39.5 %)** (Endstand Brief 085) auf **≥ 70 % (140/200)** heben — vier kombinierte Hebel in einer Brief-086-CC-Session mit Drei-Phasen-Workflow.

Die vier Hebel:

1. **Cleanup-Layer-Re-Implementation** (`normalizeForHardcover`-Helper analog 085) plus *ungecleanter Original-Roster-Titel als zusätzlicher Fallback* gegen die 3 belegten Cleanup-Regressions (Ravenor + 2× Iron-Warriors-Omnibus).
2. **Author-Normalisierungs-Layer** (neuer pure DI-Helper) gegen die Initial/Diminutive-Sub-Population des 23-Buch-`author_mismatch`-Buckets.
3. **Pass-2-Retry-Policy** für `graphql_error` innerhalb desselben Backfill-Run-Prozesses (Backoff + einmaliger Re-Pass) gegen die heutige API-Instabilität (Brief 085: 29 transiente `graphql_error`).
4. **CC-Direct-WebSearch** über die Phase-1-Miss-Liste in eine committed Override-JSON, dann zweiter Backfill-Lauf mit Override-Tabelle aktiv. Kein Anthropic-SDK, kein API-Key, kein Inline-LLM-Call im Skript — CC fährt die WebSearch direkt mit seinem `WebSearch`/`WebFetch`-Tool.

**Was ≥ 70 % verlangt — Reality-Statement.** Von 79 auf 140 fehlen **+61 Hits**. Hebel 1–3 (Original-Fallback + Author-Norm + Pass-2-Retry) bringen zusammen erwartbar nur **~+20 bis +31**. Der Rest MUSS aus Hebel 4 kommen: **≥ 70 % hängt daran, dass Phase 2 ungefähr 40 zusätzliche hitfähige Overrides produziert.** Detail-Zerlegung in § Erwartungs-Zerlegung; Konsequenz bei Verfehlung in § Zielerreichung.

**085-Supersede.** Brief 085 (PR #72) hat den Cleanup-Layer + Colon-Fallbacks + Diff-Telemetrie geliefert, aber empirisch nur 79/200 gebracht (Variant-Distribution 79/0/0 — Colon-Fallbacks 0 Hits). Maintainer-Entscheidung 2026-05-20: PR #72 wird geschlossen ohne Merge (kein Müll in main, keine Lücke). Brief 086 baut **alles aus `origin/main` neu** (kein cherry-pick), supersedet Brief 085 und re-öffnet OQ (10) als „Pass 2".

## Context

### Brief-085-Endstand (Mess-Anker)

| Bucket | 075-Subset Pre (0001..0150) | 075-Subset Post 085 | Welle-4 Post 085 (0151..0200) | Gesamt 200 Post 085 |
|---|---:|---:|---:|---:|
| Hits | 77 | 59 | 20 | **79** |
| `no_author` | 14 | 14 | 0 | 14 |
| `null_result_zero_hits` | 40 | 39 | 16 | 55 |
| `author_mismatch` | 19 | 15 | 8 | 23 |
| `graphql_error` | **0** | **23** | 6 | **29** |
| `token_missing` | 0 | 0 | 0 | 0 |
| **Hit-Rate** | **51.3 %** | **39.3 %** | **40.0 %** | **39.5 %** |

Source: [`sessions/2026-05-20-085-impl-hardcover-hit-rate-hardening.md`](./2026-05-20-085-impl-hardcover-hit-rate-hardening.md) (Branch `codex/ingest-batches-hardcover-normalize`, PR #72 geschlossen ohne Merge).

Drei 085-Befunde, die Brief 086 adressiert: (1) Hardcover-API instabil — 29 transiente `graphql_error` (075 hatte 0), 16 davon Hit→Miss-Regressions im 075-Subset; (2) 3 echte Cleanup-Regressions (Ravenor + 2× Iron-Warriors-Omnibus) durch zu greedy `: The Omnibus`-Stripping; (3) Variant-Distribution 79/0/0 — Colon-Fallbacks lieferten 0 Hits, bleiben aber token-billig drin (ggf. Welle-5+-relevant). 085-impl-Empfehlung #1 (zweiter `--force`-Pass) konnte CC nicht selbst fahren (auto-mode-Classifier blockierte „Repeat-Mass-Write ohne explicit user authorization") — Brief 086 macht das als Pass-2-Retry *innerhalb desselben Runs*. Author-Normalisierung war in 085 defer-fähig; Maintainer-Entscheidung 2026-05-20 zieht sie als Hebel 2 herein. OL-Fallback bleibt deferred — CC-Direct-WebSearch ersetzt ihn funktional mit breiterer Catalog-Coverage.

### Erwartungs-Zerlegung — wie +61 Hits zustande kommen

Von 79/200 (39.5 %) auf 140/200 (70 %) fehlen **+61 Hits**.

| Hebel | Heilt | Erwarteter Hit-Zuwachs |
|---|---|---:|
| Pass-2-Retry-Policy (Hebel 3) | transiente `graphql_error` (085: 29; typisch 70–100 % Recovery beim zweiten Pass) | +14 bis +20 |
| Original-Roster-Fallback (Hebel 1) | 3 belegte Cleanup-Regressions (empirisch bestätigte Untergrenze) | +3 |
| Author-Normalisierungs-Helper (Hebel 2) | Initial/Diminutive-Sub-Population des `author_mismatch`-Buckets | +3 bis +8 |
| **Hebel 1–3 zusammen** | | **+20 bis +31** |
| CC-Direct-WebSearch → Override (Hebel 4) | Sub-Population der 55 `null_result_zero_hits` + Rest-`author_mismatch` | **+30 bis +50** |
| **Summe** | | **+50 bis +81 → 129–160/200 = 65–80 %** |

Konservatives Ziel ist **≥ 70 % (140/200)**, Stretch 80 %. Untere Schranke (alle Hebel suboptimal): +50 → 129/200 = 64.5 %, knapp unter Ziel. Obere Schranke: +81 → 160/200 = 80 %. Das Ziel ist genau dann erreichbar, wenn Hebel 4 ungefähr bei seiner Mittel-Schätzung landet — **~40 hitfähige Overrides** (Band +30 bis +41, je nachdem wie Hebel 1–3 ausfallen). Liefert die Override-Tabelle deutlich darunter, ist das Ziel verfehlt — siehe § Zielerreichung.

### Pfad-Bezüge

- Backfill-Script: [`scripts/backfill-hardcover-rating.ts`](../scripts/backfill-hardcover-rating.ts) — in 086 neu wired (Stage-Loop um Original-Fallback / Author-Norm / Pass-2-Retry / Override-Konsum erweitert). Form-Vorlage des 085-Stands: `git show origin/codex/ingest-batches-hardcover-normalize:scripts/backfill-hardcover-rating.ts`.
- Hardcover-Library: [`src/lib/ingestion/v2/sources/hardcover.ts`](../src/lib/ingestion/v2/sources/hardcover.ts), [`src/lib/ingestion/hardcover/fetch.ts`](../src/lib/ingestion/hardcover/fetch.ts) — bleiben unverändert.
- Pure-DI-Helper-Vorlagen: [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts) (077), [`scripts/apply-override-location-skip.ts`](../scripts/apply-override-location-skip.ts) (084).

## Constraints

### Drei-Phasen-Workflow

Brief 086 ist **eine CC-Session, drei Phasen**. `/clear` zwischen Phasen ist erlaubt und erwünscht, wenn das Token-Budget knapp wird (Disziplin in § /clear-Disziplin).

**Phase 1 — Implementation + erster Lauf** (`--force --write-misses=…`, ~30–50k Token):

1. Beide Helper schreiben + Tests grün (§ Hebel 1, § Hebel 2).
2. Backfill-Script wired mit der vollen 6-Stage-Cascade (§ Variant-Cascade) + Pass-2-Retry-Schleife (§ Hebel 3). Stage 6 ist verkabelt, bleibt in Phase 1 dormant (Override-JSON existiert noch nicht).
3. Voller `--force --write-misses=outputs/hardcover-misses-086-phase1.json`-Lauf gegen Supabase über alle 200 W40K-Bücher. Stdout: volle Counts-Bucket-Tabelle wie 085 + Variant-Distribution + Pass-2-Recovery-Block + Diff-Listen A/B + Miss-Listen-Pfad als letzte Zeile.

Phase-1-Abschluss: `lint` / `typecheck` / `test:resolver` grün, erster Lauf gefahren, Miss-JSON existiert.

**Phase 2 — WebSearch-Resolution** (kein Skript-Run, ~50–100k Token):

4. CC liest die Miss-JSON und arbeitet die Benign-Miss-Einträge ab — pro Eintrag 1–2 fokussierte WebSearches, bei Mehrdeutigkeit ein `WebFetch` (§ Hebel 4).
5. Pro gefundenes Buch ein `overrides[]`-Eintrag, pro nicht gefundenes ein `skipped[]`-Eintrag in `scripts/seed-data/hardcover-title-overrides.json` (§ JSON-Schemas). Datei wird inkrementell (append-mode) gepflegt, damit ein `/clear` mitten in Phase 2 nichts zurücksetzt.
6. Override-JSON committed.

Phase-2-Abschluss: `hardcover-title-overrides.json` existiert, Counts-Invariante erfüllt (§ JSON-Schemas).

**Phase 3 — Zweiter Lauf + Closing-Report** (`--force --hardcover-title-overrides=…`, ~20–30k Token):

7. Voller `--force --hardcover-title-overrides=scripts/seed-data/hardcover-title-overrides.json`-Lauf gegen Supabase. Stage 6 greift jetzt bei jedem Benign-Miss aus Stage 1–5, der einen Override-Eintrag hat.
8. Override-Wirkung prüfen: zeigt der `Override-table consumption`-Block ein auffällig hohes `matched + miss` (Cowork-Schwelle: > 25 % der geladenen Overrides), ist Titelform-Mismatch der wahrscheinlichste Grund. Erlaubter Korrektur-Loop: betroffene `hardcoverTitle` gegen die `hardcoverSlug`-Seite re-checken + korrigieren, Override-JSON re-committen, Phase 3 erneut fahren (`--force` schreibt für gleiche Werte idempotent denselben Stand). Im Closing-Report dokumentieren.
9. Closing-Report `sessions/2026-05-DD-086-impl-hardcover-hit-rate-pass-2.md` (Inhalt in § Acceptance).

### Variant-Cascade — 6 Stages, bis zu 7 Hardcover-Calls pro Buch

Die Cascade hat **6 Stages**. Jede Stage außer Stage 5 feuert genau 1 `discoverHardcoverClaimV2`-Call; Stage 5 (`author-normalize`) feuert 0–2 Calls je nach `normalizeAuthor()`-Output. Maximum pro Buch: **bis zu 7 konkrete Hardcover-API-Calls** (1+1+1+1+2+1). Stop-Bedingung pro Call identisch zu Brief 085: `result.result !== null` UND numerisches `audit.averageRating` → Hit, sonst nächste Stage.

| Stage | Variant | Calls | Quelle | Trigger |
|---:|---|:--:|---|---|
| 1 | `cleanup` | 1 | 085-Helper, `primary` aus Cleanup-Fixpoint | immer |
| 2 | `colon-suffix-drop` | 1 | 085-Fallback, „<X>: <Y>" → „<X>" | `primary.includes(':')` und Stage 1 benign miss |
| 3 | `colon-prefix-drop` | 1 | 085-Fallback, „<X>: <Y>" → „<Y>" | `primary.includes(':')` und Stage 2 benign miss |
| 4 | `original` | 1 | ungecleanter Roster-Titel (`originalIfDifferent`) | `originalIfDifferent !== null` und Stage 3 benign miss |
| 5 | `author-normalize` | 0–2 | `primary`-Titel + alternativer Author aus `normalizeAuthor()` | `normalizeAuthor()` liefert ≥ 1 Variante und Stage 4 benign miss (oder `author_mismatch` aus einer früheren Stage) |
| 6 | `override` | 1 | `hardcoverTitle` + `hardcoverAuthor` aus Override-JSON | `--hardcover-title-overrides` gesetzt UND `externalBookId` hat Override-Eintrag UND alle verfügbaren Stages 1–5 enden ohne Hit (finaler Zustand benign miss) |

„Benign miss" = 085-Definition: `null_result_zero_hits` ODER `author_mismatch` ODER author-matched-Hit-ohne-numerisches-`averageRating`. **Harte Errors** (`graphql_error`, `token_missing`, ratingsCount-probe-error) bekommen KEINE Stage-Eskalation — sie sammeln sich für die Pass-2-Retry-Schleife (Hebel 3).

In Phase 1 (ohne `--hardcover-title-overrides`) endet die Cascade nach Stage 5. In Phase 3 ist Stage 6 aktiv. `loadOverrides(path)` returnt `Map<externalBookId, OverrideEntry>` (leer wenn Flag unset); der Stage-Loop fügt Stage 6 nur hinzu, wenn die Map einen Eintrag für das Buch hat. Codex wählt die genaue Loop-Form (`for-of` über `Stage[]`, Closure-Returns) — Hard-Anforderung ist allein diese Reihenfolge.

### Hebel 1 — Cleanup-Layer + Original-Roster-Fallback

`scripts/hardcover-title-normalize.ts` wird neu geschrieben (`origin/main` hat keinen 085-Code mehr). Vorlage = der geschlossene 085-Branch-File (`git show origin/codex/ingest-batches-hardcover-normalize:scripts/hardcover-title-normalize.ts`), aber neu committen — kein cherry-pick, sauberer Brief-086-Diff.

Änderung gegenüber 085: `NormalizedTitleVariants` bekommt ein drittes Feld.

```ts
export interface NormalizedTitleVariants {
  primary: string;                    // cleanup-Output
  fallbacks: string[];                // 085: colon-splits; unverändert
  originalIfDifferent: string | null; // NEU: rosterTitle falls != primary, sonst null
}
```

`normalizeForHardcover()` setzt `originalIfDifferent = rosterTitle.trim() !== primary ? rosterTitle.trim() : null`. Stage 4 (§ Variant-Cascade) konsumiert das: bei `originalIfDifferent !== null` und Benign-Miss aus Stage 1–3 → `_eq`-Versuch mit `originalIfDifferent`, Stdout `via=original`.

Cleanup-Regelset unverändert zu 085 (Volume-Range / Part / Legends / Vol. / Omnibus-Varianten, specific-before-generic; Throw-on-empty-cleanup bleibt). Codex übernimmt die Regex-Form aus dem 085-Branch.

Test-Coverage ≥ 11: alle 8 aus Brief 085 § Tests + 3 neue für `originalIfDifferent` — Pass-through `"Xenos"` → `null`; Cleanup-cut `"Eisenhorn Omnibus"` → `primary "Eisenhorn"`, `originalIfDifferent "Eisenhorn Omnibus"`; Cleanup+Colon `"Ravenor: The Omnibus"` → `primary "Ravenor"`, `fallbacks []`, `originalIfDifferent "Ravenor: The Omnibus"` (Anchor für die 3 Cleanup-Regressions).

### Hebel 2 — Author-Normalisierungs-Layer

Neuer pure DI-Helper `scripts/hardcover-author-normalize.ts` analog 077/084/085-Sibling-Konvention. Signature:

```ts
export function normalizeAuthor(rosterAuthor: string): string[];
```

Returnt 0–2 Author-Varianten, die strukturell vom `rosterAuthor` abweichen, dedupliziert gegen `rosterAuthor` und gegeneinander. Zwei Regel-Klassen (Codex wählt die exakte Regex/Logik-Form):

1. **Initial-Drop.** Wenn `rosterAuthor` ein Mittelinitial mit Punkt enthält (Pattern `\b[A-Z]\.\s`), produziere die Form ohne dieses Initial. Beispiel: `"James A. Swallow"` → `"James Swallow"`. Nur Drop-Richtung — Hardcover-Form ist meist kürzer als Roster, kein Initial-Einfügen.
2. **Diminutive-Alias (bidirektional).** First-Name-Lookup gegen eine kleine maintainer-pflegbare Tabelle `scripts/seed-data/author-aliases.json`. Die Tabelle ist eine Liste **bidirektionaler Äquivalenz-Paare** (`"Daniel" ↔ "Dan"`, `"Matthew" ↔ "Matt"`, `"Christopher" ↔ "Chris"`, …). Der Lookup matcht den First-Name gegen *beide* Seiten jedes Paares und produziert die jeweils andere Seite — `"Dan Abnett"` → `"Daniel Abnett"` UND `"Daniel Abnett"` → `"Dan Abnett"`. Initial-Liste 8–15 Paare, von Codex aus den 23 `author_mismatch`-Büchern abgeleitet; Maintainer ergänzt vorwärts.

**Pipeline-Reihenfolge bei kombinierten Cases.** Initial-Drop läuft zuerst; die Diminutive-Stufe wird auf der *initial-bereinigten* Form gebildet. `"Daniel A. Abnett"` produziert deshalb beide Stufen-Ergebnisse: Initial-Drop → `"Daniel Abnett"`, dann Diminutive auf der initial-bereinigten Form → `"Dan Abnett"`. Ergebnis: `["Daniel Abnett", "Dan Abnett"]`.

**Max 2 Varianten pro `rosterAuthor`** — Reihenfolge bei mehr Kandidaten: (1) Initial-Drop-Ergebnis, (2) Diminutive.

Backfill-Wiring (Stage 5): pro `normalizeAuthor()`-Variante ein zusätzlicher `discoverHardcoverClaimV2`-Call mit `primary`-Titel und der alternativen Author-Form. Variant-Name im Stdout: `via=author-normalize-1` / `via=author-normalize-2` (Index in der Liste) ODER eine lesbarere Form nach Codex-Wahl (`via=author-no-initial` / `via=author-diminutive`).

Test-Coverage ≥ 6: Initial-Drop `"James A. Swallow"` → `["James Swallow"]`; Diminutive vorwärts `"Daniel Abnett"` → `["Dan Abnett"]`; Diminutive rückwärts `"Dan Abnett"` → `["Daniel Abnett"]` (bidirektional belegt); Combined `"Daniel A. Abnett"` → `["Daniel Abnett", "Dan Abnett"]`; Pass-through ohne Match → `[]`; Dedup wenn beide Pfade dasselbe produzieren.

### Hebel 3 — Pass-2-Retry-Policy für `graphql_error`

Innerhalb desselben Run-Prozesses, kein separater `--force`-Lauf:

1. Pass 1: Hauptlauf über alle 200 Bücher mit voller Stage-Eskalation. Bücher, die im `graphql_error`-Bucket landen, gehen in eine `pass2Queue: WorkTarget[]` (statt sofort finaler Miss).
2. Wenn `pass2Queue.length > 0`: 60s `sleep` (Console-Log „Pass 2: N graphql_error books — sleeping 60s before retry"), dann Pass 2 nur über `pass2Queue`, volle Stage-Cascade.
3. Bücher, die in Pass 2 erneut `graphql_error` produzieren → finaler `graphql_error`-Bucket.

60s ist Cowork-Tendenz aus Brief-075-Empirie (transiente Errors recovern in einer Stunde von selbst). Codex darf 30s/120s wählen, wenn Pass 1 schon API-Recovery (oder dauerhafte Fehler gegen Ende) zeigt; gewählte Dauer im Closing-Report begründen. Die Pass-2-Schleife ist flag-unabhängig immer aktiv.

### Hebel 4 — CC-Direct-WebSearch → Override-JSON

Kein Skript-Helper, kein SDK, kein API-Key. CC fährt die WebSearch direkt in Phase 2 mit seinem `WebSearch`/`WebFetch`-Tool.

- **Eingabe:** Phase-1-Miss-JSON — Liste von ~70–90 Benign-Miss-Büchern mit `externalBookId` / `rosterTitle` / `expectedAuthor` / `missBucket`.
- **Per-Buch:** 1–2 fokussierte WebSearches. Empfohlene Patterns (CC darf adaptieren): `"<rosterTitle>" "<expectedAuthor>" site:hardcover.app`; falls leer `<rosterTitle> <expectedAuthor> hardcover.app`. Der `hardcoverTitle` für den Override MUSS von der Hardcover-Buchseite selbst stammen und verbatim übernommen werden (§ JSON-Schemas — `_eq`-Exaktheit) — wenn das Such-Snippet die kanonische Titelform nicht zweifelsfrei zeigt, `WebFetch` auf die Hardcover-Buchseite für Titel + Slug + Contributors.
- **CC-Judgment:** found / not-found pro Buch, ohne numerische Confidence-Schwelle (analog wie Cowork-Briefe geschrieben werden). Bei Unsicherheit → `skipped[]` statt raten. Ein dokumentierter Skip ist besser als ein geratener Override — der Closing-Report kann den Skip-Bucket auf Patterns prüfen.
- **Ausgabe:** `scripts/seed-data/hardcover-title-overrides.json` (§ JSON-Schemas), committed in derselben PR wie der Code.
- **Desk-Verifikation vor Phase 3:** Sobald die Override-JSON steht, prüft CC 3–5 repräsentative `overrides[]`-Einträge nach — der recherchierte `hardcoverTitle` muss zeichengenau dem kanonischen Titel auf der `hardcoverSlug`-Seite entsprechen. Das fängt Paraphrase-/Titelform-Fehler ab, bevor der Phase-3-Lauf startet; findet CC dabei Mismatches, korrigiert es vor dem Commit und weitet die Stichprobe aus. Die volle Wirkungs-Kontrolle ist dann der Phase-3-Lauf selbst (§ Drei-Phasen-Workflow Schritt 8).

Konsumenten-Wiring (Stage 6): `loadOverrides(path)` → `Map<externalBookId, OverrideEntry>`; `skipped[]` wird ignoriert (nur Audit). Stage 6 greift, sobald alle verfügbaren Stages 1–5 ohne Hit geendet haben (finaler Zustand benign miss) — auch dann, wenn einzelne Stages dazwischen gar nicht liefen (z. B. Stage 5, wenn `normalizeAuthor()` keine Variante liefert). Im Stage-Loop, wenn dieser Endzustand erreicht ist UND `overrides.has(target.externalBookId)`:

```ts
const override = overrides.get(target.externalBookId)!;
const overrideAuthor = override.hardcoverAuthor ?? author;
result = await discoverHardcoverClaimV2(override.hardcoverTitle, overrideAuthor, { ratingsCountField });
```

Stop-Bedingung wie sonst. Stdout `via=override` plus Detail-Sub-Zeile mit Override-Titel + Author (§ Stdout-Log + Summary).

### CLI-Flags + Default-Verhalten

Genau zwei neue CLI-Flags, beide optional, Default unset:

- `--write-misses=<path>` — wenn gesetzt, schreibt das Skript am Run-Ende die Benign-Miss-Liste nach `<path>` (Schema in § JSON-Schemas). Wenn unset, kein Miss-Dump. Beeinflusst NICHT die Variant-Cascade.
- `--hardcover-title-overrides=<path>` — wenn gesetzt, lädt `loadOverrides(path)` die Override-Map; Stage 6 (`override`) wird pro Buch aktiv, das einen Eintrag hat. Wenn unset, ist Stage 6 deaktiviert (Cascade endet nach Stage 5). Datei gesetzt aber fehlend → harter Fehler, kein silent fallback. Leere `overrides[]` → Stage 6 deaktiviert sich automatisch, der Lauf läuft durch (Closing-Report dokumentiert „WebSearch produced 0 overrides").

**Default-Verhalten (kein Flag gesetzt):** Target-Scope, Idempotenz (idempotent ohne `--force`, Overwrite mit `--force`) und `--limit=NNN`-Sub-Range bleiben unverändert zur heutigen Skript-Form. **Variant-Stages 1–5 sind immer aktiv** — Cleanup, Colon-Fallbacks, Original-Roster-Fallback und Author-Normalisierung laufen flag-unabhängig. Die zwei Flags steuern nur (a) ob die Miss-Liste rausgeschrieben wird und (b) ob Stage 6 existiert. Die Pass-2-Retry-Schleife (Hebel 3) ist ebenfalls flag-unabhängig immer aktiv.

### JSON-Schemas — Required Fields

Zwei JSON-Artefakte, hier als Required-Field-Spezifikation statt voller Beispiel-Blöcke. Codex/CC wählen die genaue Field-Anordnung und dürfen Audit-Felder ergänzen.

**Miss-Liste** (`--write-misses=<path>`-Output, Phase 1). Top-Level verbindlich: `generatedAt`, `totalTargets`, `benignMissCount` (= `misses.length`), `misses[]`. Pro `misses[]`-Eintrag verbindlich: `externalBookId`, `rosterTitle`, `expectedAuthor`, `primary` (post-cleanup), `missBucket` (`null_result_zero_hits` | `author_mismatch`), `triedVariants[]`. **Nur Benign Misses landen in der Liste** — `null_result_zero_hits` + `author_mismatch` im Endstand nach Pass-2-Retry. KEINE `graphql_error` (das ist der Pass-2-Retry-Job), KEINE `no_author` (kein WebSearch-Fix). Der `benignMissCount` ist verbindlich, weil Phase 2 die Counts-Invariante darauf prüft.

**Override-JSON** (`scripts/seed-data/hardcover-title-overrides.json`, Phase-2-Output, committed). Top-Level verbindlich: `$schema-note`, `generatedAt`, `phase1BenignMissCount`, `overrides[]`, `skipped[]`. Pro `overrides[]`-Eintrag verbindlich: `externalBookId`, `rosterTitle`, `expectedAuthor`, `hardcoverTitle`, `hardcoverSlug`, `evidenceUrl`; optionale Audit-Felder: `hardcoverAuthor`, `resolvedAt`, `note`. Pro `skipped[]`-Eintrag verbindlich: `externalBookId`, `rosterTitle`, `reason`.

- **`hardcoverTitle` muss API-exakt sein.** Der Hardcover-Adapter matcht per exaktem `_eq` auf das `title`-Feld (`src/lib/ingestion/v2/sources/hardcover.ts`) — eine nur visuell „fast richtige" Titelform (Subtitle dazu/weg, „The"-Präfix, Edition-Suffix, abweichende Interpunktion) liefert `null_result_zero_hits` und macht den Override wirkungslos. `hardcoverTitle` MUSS deshalb der Titel-String sein, der von der Hardcover-Buchseite **verbatim** übernommen wird — zeichengenau, kein Paraphrasieren, nicht der Roster-Titel.
- `hardcoverSlug` (der `<slug>` aus `hardcover.app/books/<slug>`) ist verbindlich: er ankert das Evidence-Buch stabil und ist die Daten-Grundlage, falls ein Folge-Brief Stage 6 vom Titel-`_eq` auf Slug-/ID-Lookup umstellt (§ Open questions).
- Stage 6 konsumiert `hardcoverTitle` + `hardcoverAuthor`; alle übrigen Felder sind Audit-Information für Closing-Report-Stichproben. `hardcoverAuthor`: `null` wenn der Roster-Author korrekt ist; ein String, wenn Hardcover unter einer abweichenden Author-Form indexiert.
- **Counts-Invariante:** `overrides[].length + skipped[].length === phase1BenignMissCount` — jeder Phase-1-Benign-Miss ist entweder resolved (`overrides[]`) oder dokumentiert skipped (`skipped[]`).

### Stdout-Log + Summary

`progressLine` zeigt `via=<variant>` am Ende jeder Hit-Zeile (`cleanup` / `colon-suffix-drop` / `colon-prefix-drop` / `original` / `author-normalize-1` / `author-normalize-2` / `override`). Bei jedem Stage-6-Call eine Detail-Sub-Zeile vor der Hit-Zeile:

```
[123/200] W40K-0123 "Shadowsun: The Patient Hunter" → no hit via cleanup/colon/original/author-normalize
  · override (Brief 086 Phase 2): "Shadowsun" by Phil Kelly → rating=4.20 (count=8)
[123/200] W40K-0123 "Shadowsun: The Patient Hunter" → rating=4.20 (count=8, via=override)
```

`printSummary` zeigt vier Blöcke — Misses-Bucket-Tabelle, Variant-Distribution, Pass-2-Recovery, Override-table-consumption. Form (Zahlen illustrativ — Codex baut den echten Block aus dem Phase-3-Lauf):

```
=== Summary ===
Mode:                  --force --hardcover-title-overrides=…
Total target books:    200
Hits:                  144  (72.0 %)
Misses:                 56
  no_author              14
  null_result_zero_hits  22
  author_mismatch         9
  graphql_error          11
  token_missing           0

Variant-distribution (hits only):
  cleanup            91
  colon-suffix-drop   2
  colon-prefix-drop   1
  original            3
  author-normalize   12
  override           35

Pass-2-recovery (graphql_error bucket):
  Pass-1 graphql_error count:  29
  Pass-2 recovered to hit:     18  (62.1 %)
  Pass-2 still graphql_error:  11

Override-table consumption:
  Phase-1 benign misses researched:  80   (= overrides[] + skipped[] in der JSON)
  Overrides loaded (overrides[]):    58
  Skipped documented (skipped[]):    22
  Overrides matched + hit:           35   (60.3 % der geladenen Overrides → hit)
  Overrides matched + miss:          23   (hardcoverTitle trifft den _eq nicht / Hardcover-Eintrag ohne numerisches Rating / stale Slug)
```

Konsistenz-Regeln, die der Block einhalten muss: Misses-Buckets summieren auf `Misses`; Variant-Distribution summiert auf `Hits`; `recovered + still` = `Pass-1 graphql_error count`; `researched` = `loaded + skipped`; `matched+hit + matched+miss` = `loaded`. Der Override-`matched+hit`-Wert ist identisch mit der `override`-Zeile der Variant-Distribution.

### Diff-Listen (unverändert zu Brief 085)

- **Diff-Liste A** — `--force`-Overwrites mit Rating-Δ ≥ 0.01. Erwartung 3–8 (neue Stages öffnen neue Match-Pfade).
- **Diff-Liste B** — Hit→Miss-Regressions. Erwartung **0**: der Original-Roster-Fallback (Stage 4) fängt jede Cleanup-Übergreifung ab. Pass-2-recoverable `graphql_error` landen NICHT in Diff-B (in Pass 1 transient, in Pass 2 Hit oder finaler Miss) — Diff-B nur für finale `graphql_error` mit `priorRating !== null`.

Beide Listen gehen pro `--force`-Lauf in den Closing-Report.

### /clear-Disziplin

`/clear` ist Token-Management, kein Pflicht-Schritt — wenn das Budget reicht, läuft alles in einem Rutsch.

**NICHT erlaubt:** zwischen Helper-Schreiben und Tests; zwischen Backfill-Wiring und Phase-1-Lauf. Das frisch geschriebene Wiring braucht das mentale Modell der Helper-Files unmittelbar.

**Erlaubt / empfohlen:** zwischen Phase 1 und Phase 2; innerhalb Phase 2 in Schüben (z. B. 30 Bücher resolved → commit → `/clear` → nächste 30), empfohlen bei Miss-Listen > 50 Bücher; **insbesondere zwischen Phase 2 und Phase 3** — Phase 2 füllt typisch den meisten Kontext (70–100 WebSearch-Ergebnisse). Voraussetzung für jeden Intra-Phase-2-`/clear`: die Override-JSON ist append-mode-persistent geschrieben.

CC dokumentiert im Closing-Report alle gemachten `/clear`s mit kurzer Begründung — Forward-Information für künftige Multi-Phase-Briefs.

### Brief-086-Status-Lifecycle

**Vorbedingung — die zwei 085-Session-Files sind nicht auf `origin/main`.** `origin/main` reicht nur bis Brief 084; die Files `sessions/2026-05-19-085-arch-hardcover-hit-rate-hardening.md` und `sessions/2026-05-20-085-impl-hardcover-hit-rate-hardening.md` existieren ausschließlich auf dem geschlossenen Branch `origin/codex/ingest-batches-hardcover-normalize`. Weil Brief 086 aus `origin/main` branchet, muss Codex die beiden Files zuerst in den 086-Branch holen — sonst lassen sich weder die `parent:`/`links:`-Bezüge dieses Briefs auflösen noch der 085-arch-Status flippen:

```bash
git checkout origin/codex/ingest-batches-hardcover-normalize -- \
  sessions/2026-05-19-085-arch-hardcover-hit-rate-hardening.md \
  sessions/2026-05-20-085-impl-hardcover-hit-rate-hardening.md
```

Erst danach folgt der reguläre Status-Lifecycle. Codex flippt (analog 077/080/084/085): Brief 086-arch `status: open → implemented` im selben Commit wie der 086-impl-Report; `sessions/README.md` Active-Threads-Zeilen entsprechend. Am übernommenen Brief 085-arch → `status: superseded` (nicht „implemented" — PR #72 nie merged) plus ein Banner-Satz am Body-Anfang: „**Superseded by Brief 086 (2026-05-20-086-arch-hardcover-hit-rate-pass-2.md).** PR #72 closed without merge, full re-implementation in Brief 086." Der übernommene Brief 085-impl bleibt inhaltlich unverändert (Mess-Empirie-Anker) — er wird allein durch den `git checkout` in den Branch gebracht.

Die OQ-(10)-Behandlung macht Codex NICHT — das ist Cowork-Wiki-Pass nach dem Closing-Report (§ Zielerreichung).

## Out of scope

- **Open-Library als sekundärer Rating-Pfad.** Deferred bis Post-086-Endstand klar ist. Bei Ziel-Verfehlung: neue OQ (§ Zielerreichung).
- **Library-Code** `src/lib/ingestion/v2/sources/hardcover.ts` + `src/lib/ingestion/hardcover/fetch.ts` — bleiben unverändert. Alle Hebel leben im `scripts/`-Sphere.
- **Anthropic-SDK / Inline-LLM-Calls im Skript.** Kein `@anthropic-ai/sdk`-Konsument, kein API-Key-Setup im Skript-Pfad, kein Tool-Use-Helper. WebSearch fährt CC direkt in Phase 2.
- **Schema-Migration.** `bookDetails.rating` / `ratingSource` / `ratingCount` unverändert; `ratingSource` bleibt `'hardcover'`-only (keine `'hardcover-override'`-Variante — Audit lebt in Stdout/Log + Override-JSON + Closing-Report). Kein `book_details.notes`-Touch.
- **Die 14 `no_author`-Bücher** (Anthologien/Editor-only). Maintainer-Roster-Pflege, kein Backfill-/WebSearch-Concern.
- **Maintainer-Manual-Override-Liste / Cockpit-UI für WebSearch-Misses.** CC-Direct-WebSearch ist vollautomatisch im Phase-2-Workflow.
- **Author-Aliases-JSON-Vollständigkeit.** Initial 8–15 Paare aus den 23 `author_mismatch`-Büchern; Maintainer pflegt vorwärts. Codex spammt die Liste nicht mit theoretischen Cases.
- **UI / Cockpit / `/buecher`-Filter.**
- **Backfill-Script-Refactor über die genannten Hebel hinaus.** Genau zwei neue CLI-Flags. Kein `--dry-run`-Mode, keine Multi-Pass-Logik außer dem Pass-2-graphql-Retry, keine `--limit-misses-only`-Form. Bestehendes Default-Verhalten unverändert (§ CLI-Flags).

## Acceptance

Die **Implementation** ist done, wenn alle folgenden Punkte erfüllt sind. *Implementation-done ist nicht dasselbe wie Ziel-erreicht* — die ≥ 70 %-Schwelle und ihre Konsequenzen stehen separat in § Zielerreichung.

- [ ] `scripts/hardcover-title-normalize.ts` neu geschrieben (Re-Implementation analog 085 + Feld `originalIfDifferent: string | null` im `NormalizedTitleVariants`-Interface).
- [ ] `scripts/hardcover-author-normalize.ts` als neuer pure DI-Helper (Initial-Drop + bidirektionaler Diminutive-Lookup gegen `scripts/seed-data/author-aliases.json`, 8–15 Paare, max 2 Varianten pro Input).
- [ ] `scripts/backfill-hardcover-rating.ts` neu wired mit der 6-Stage-Cascade in verbindlicher Reihenfolge (§ Variant-Cascade). Stop-Bedingung pro Stage: `result.result !== null` UND numerisches `audit.averageRating`. Benign-Miss-Definition unverändert zu 085.
- [ ] Zwei neue CLI-Flags `--write-misses` / `--hardcover-title-overrides` mit dem in § CLI-Flags spezifizierten Default-Verhalten.
- [ ] Pass-2-Retry-Schleife implementiert (§ Hebel 3): `pass2Queue` sammelt während Pass 1, nach Sleep einmaliger Re-Pass mit voller Stage-Cascade. Sleep-Dauer im Closing-Report dokumentiert.
- [ ] `progressLine` zeigt `via=<variant>`; Override-Detail-Sub-Zeile bei jedem Stage-6-Call.
- [ ] `printSummary` zeigt die vier Blöcke aus § Stdout-Log + Summary; die Konsistenz-Regeln dort halten.
- [ ] Test-Coverage: ≥ 11 Cases für `normalizeForHardcover` (8 aus 085 + 3 für `originalIfDifferent`), ≥ 6 Cases für `normalizeAuthor` (inkl. beider Diminutive-Richtungen). `npm run test:resolver` (oder eigene Test-Datei mit `package.json`-Script-Eintrag — Codex-Wahl) grün.
- [ ] **Phase 1 gefahren:** voller `--force --write-misses=outputs/hardcover-misses-086-phase1.json`-Lauf gegen Supabase über alle 200 Bücher, Miss-JSON existiert.
- [ ] **Phase 2 abgeschlossen:** `scripts/seed-data/hardcover-title-overrides.json` committed, Counts-Invariante erfüllt (`overrides[] + skipped[]` = `phase1BenignMissCount`), Required Fields pro Eintrag vorhanden inkl. verbatim-API-exaktem `hardcoverTitle` + `hardcoverSlug` (§ JSON-Schemas), Desk-Verifikation von 3–5 Overrides durchgeführt (§ Hebel 4).
- [ ] **Phase 3 gefahren:** voller `--force --hardcover-title-overrides=…`-Lauf gegen Supabase, Endcounts in der Counts-Delta-Tabelle des Closing-Reports.
- [ ] Closing-Report `sessions/2026-05-DD-086-impl-hardcover-hit-rate-pass-2.md` mit: Counts-Delta-Tabelle mit Subset-Split wie 085 (075-Subset / Welle-4) plus 086-Endstand-Spalte; Variant-Distribution aggregiert über 200; Pass-2-Recovery-Sub-Block; Override-table-consumption-Block; Post-Run-DB-Coverage-Count (`rating IS NOT NULL`) als separate Zahl neben den Run-Summary-Hits, mit Run-vs-DB-Divergenz-Erklärung (§ Zielerreichung); WebSearch-Resolution-Statistik (recherchiert / resolved / skipped / ⌀ WebSearch-Calls pro Miss als CC-Self-Estimate); 3–5 belegte Override-Beispiele mit `evidenceUrl`-Stichprobe; Override-Wirkungs-Check + ggf. Korrektur-Loop (§ Drei-Phasen-Workflow Schritt 8); Diff-Liste A (Δ ≥ 0.01); Diff-Liste B (Hit→Miss-Regressions, Erwartung 0); Phase-Cut-Dokumentation (welche `/clear`s, warum); For-next-session-Items; Endstand-Klassifikation gemäß § Zielerreichung.
- [ ] Verifikations-Commands grün: `npm run lint`, `npm run typecheck`, `npm run test:resolver` (bzw. gewählte Test-Datei), `npm run brain:lint -- --no-write` (0 blocking).
- [ ] Beide 085-Session-Files aus dem geschlossenen 085-Branch in den 086-Branch übernommen (`git checkout`, § Brief-086-Status-Lifecycle); danach Brief 085-arch auf `status: superseded` + Banner-Satz, Brief 085-impl inhaltlich unverändert.

## Zielerreichung

**Implementation-done ≠ Ziel-erreicht.** Die Acceptance-Checkliste prüft, ob Code, Phasen und Closing-Report vollständig sind — sie ist die Bedingung dafür, dass die Session als `implemented` reportet. Davon getrennt steht die **Ziel-Schwelle: Hit-Rate ≥ 70 % (≥ 140/200) Post-Phase-3.**

**Was die Schwelle misst.** Gemeint sind die **frischen `Hits` aus der Phase-3-Run-Summary** (`printSummary`-Zeile `Hits: NNN`), NICHT `book_details.rating IS NOT NULL` in der DB. Das Backfill-Script schreibt nur bei Hits und lässt bei einem Miss ein evtl. vorhandenes Alt-Rating (z. B. aus dem Brief-075-Lauf) stehen — die DB-Coverage liegt deshalb systematisch ≥ den Run-Hits und misst nicht, was Brief 086 tatsächlich konvertiert hat. Run-Summary-Hits sind die ehrliche 086-Metrik und der Maßstab für die Tabelle unten. Der Closing-Report nennt zusätzlich die DB-Coverage (`SELECT count(*) FROM book_details WHERE rating IS NOT NULL`) als separate, nachrangige Zahl mit genau dieser Erklärung.

Der Closing-Report klassifiziert den Endstand (auf Basis der Run-Summary-Hits):

| Empirie | Klassifikation | OQ-Konsequenz |
|---|---|---|
| ≥ 80 % | überperformt, voller Erfolg | OQ (10) kann geschlossen werden |
| 70–80 % | planmäßiger Erfolg | OQ (10) kann geschlossen werden |
| 60–70 % | unter Erwartung — Closing-Report listet Hindernisse + Hebel-Wirkungs-Zerlegung | OQ (10) **bleibt offen**; Folge-OQ OL-Fallback in den Carry-over |
| < 60 % | hard signal — strukturelle Hardcover-Coverage-Lücke für W40K | OQ (10) **bleibt offen**; Folge-OQ OL-Fallback in den Carry-over, mit Priorität |

**Wichtig:** Auch bei < 70 % wird die Session normal als `implemented` reportet und der Closing-Report vollständig geschrieben — ein dokumentierter Fehlschlag mit sauberer Hebel-Zerlegung ist ein wertvolles Ergebnis. Was sich allein unterscheidet, ist die OQ-Behandlung. Codex flippt den OQ-Status NICHT selbst: Codex reportet Endstand + Klassifikation, Cowork macht den OQ-/Wiki-Pass danach (≥ 70 % → OQ (10) schließen; < 70 % → OQ (10) offen lassen + Folge-OQ OL-Fallback öffnen).

Der `skipped[]`-Bucket der Override-JSON ist die direkteste Diagnose bei Unter-Ziel: Ist ein großer Teil der Phase-1-Benign-Misses skipped (CC fand nichts), ist Hardcover-Coverage das Problem und OL-Fallback die richtige nächste OQ. Wurden viele Overrides geladen, aber nicht gehittet (`matched + miss` hoch), ist die WebSearch-Query-Form oder die Stage-6-Konsumlogik verdächtig.

## Open questions

- **Pass-2-Sleep-Dauer.** Cowork-Tendenz 60s aus Brief-075-Empirie. Codex darf 30s/120s wählen je nach beobachtetem API-Verhalten in Pass 1; Wahl im Closing-Report begründen.
- **Author-Aliases-Listengröße.** Cowork-Vorgabe 8–15 Paare aus den 23 `author_mismatch`-Büchern. Findet Codex < 8 echte Cases → kürzere Liste, Closing-Report flaggt.
- **Diminutive-Match-Case-Sensitivity.** `rosterAuthor.toLowerCase()` vs. exakt? Cowork-Tendenz: lowercase-Match (Excel-Roster hat Title-Case-Idiosynkrasien). Codex entscheidet.
- **WebSearch-Query-Form (Phase 2).** Die Patterns in § Hebel 4 sind illustrativ. CC darf andere probieren (ohne `site:`, Hardcover-Author-Pages `hardcover.app/authors/<slug>`); Closing-Report dokumentiert, was empirisch traf.
- **Phase-1-Miss-JSON — committen oder unter `outputs/` lassen?** Cowork-Tendenz: `outputs/` (temporäres Run-Artefakt). Bei Audit-Grund (Miss-Pattern für künftige Roster-Pflege sichtbar halten) darf CC nach `scripts/seed-data/.audit/` committen; Wahl im Closing-Report.

- **Stage-6-Lookup-Pfad — Titel-`_eq` vs. Slug/ID.** Brief 086 hält Stage 6 bewusst auf dem Titel-`_eq`-Pfad (Library unverändert, § Out of scope), abgesichert durch verbatim-`hardcoverTitle` + Desk-Verifikation + Korrektur-Loop. Strukturell sauberer wäre ein Slug-/ID-basierter Lookup, immun gegen Titelform-Drift — er bräuchte aber einen neuen Query-Pfad in der Library und ist deshalb 086-out-of-scope. `hardcoverSlug` wird in der Override-JSON schon mitgeführt, damit ein Folge-Brief das ohne neue Recherche umstellen kann. Trigger für diesen Folge-Brief: `matched + miss` bleibt im Closing-Report trotz Korrektur-Loop hoch.

## Notes

### Branch-Konvention (Brief 082 Worktree-Disziplin)

Brief 086 ist Batch/Ingestion-Strang:

```bash
cd /c/Users/Phil/chrono-lexicanum-batches
git fetch origin
git switch -c codex/ingest-batches-hardcover-rerun origin/main
# 085-Session-Files in den Branch holen (§ Brief-086-Status-Lifecycle):
git checkout origin/codex/ingest-batches-hardcover-normalize -- \
  sessions/2026-05-19-085-arch-hardcover-hit-rate-hardening.md \
  sessions/2026-05-20-085-impl-hardcover-hit-rate-hardening.md
# Phase 1 → Phase 2 (/clear erlaubt) → Phase 3 → 085-arch-Status flippen
git push -u origin codex/ingest-batches-hardcover-rerun
gh pr create --base main --head codex/ingest-batches-hardcover-rerun
```

PR #72 (`codex/ingest-batches-hardcover-normalize`) wird vor dem 086-Run maintainer-seitig geschlossen (`gh pr close 72 --comment "Superseded by Brief 086"`). Der Branch bleibt remote als Form-Referenz — Codex darf `git show origin/codex/ingest-batches-hardcover-normalize:scripts/…` als Vorlage für die Helper-Files lesen, committet aber alles neu in `codex/ingest-batches-hardcover-rerun`.

### Coordination-Worktree-Hinweis

Der Main-Worktree (`C:\Users\Phil\chrono-lexicanum`) hat modifizierte Files aus historischem Setup, nicht mit Brief 086 verbunden. Brief 086 läuft im Batches-Worktree; vor dem Run `git status` prüfen, ggf. `git switch` in den Batches-Worktree.
