---
session: 2026-05-19-085
role: architect
date: 2026-05-19
status: superseded
slug: hardcover-hit-rate-hardening
parent: 2026-05-15-075-impl-cockpit-drift-sort-and-rating
links:
  - 2026-05-15-075-arch-cockpit-drift-sort-and-rating
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-19-084-arch-locations-axis-hygiene
  - 2026-05-19-084-impl-locations-axis-hygiene
commits: []
---

# Hardcover-Hit-Rate-Härtung — Titel-Normalisierungs-Layer für `backfill-hardcover-rating`

> **Superseded by Brief 086 (2026-05-20-086-arch-hardcover-hit-rate-pass-2.md).** PR #72 closed without merge, full re-implementation in Brief 086.

> **Revisions-Historie entfernt** (token-save 2026-05-20). Fünf
> Codex-Review-Pässe (17 Punkte) sind in den Body unten eingearbeitet.

## Goal

Die Hardcover-Hit-Rate des W40K-SSOT-Backfill-Scripts von heute **77/200 = 38.5 %**
(Brief-075-Subset: 77/150 = 51.3 % für die ersten 150 W40K-Bücher; die 50
Welle-4-Bücher aus Brief 076/077 sind noch ohne Rating, weil der 075-Backfill
pre-Welle-4 lief) auf einen konservativ erwarteten Bereich **55–60 %** über
alle 200 W40K-Bücher heben (Stretch-Pin **70–80 %** überschreitet das
empirische Affected-Constraint von 38 von 200 cleanup-/fallback-affected
Büchern; Detail-Caveats in Notes § Erwartungs-Kalibrierung), indem zwischen
Roster-Titel und Hardcover-`_eq`-Query ein zweistufiger
Normalisierungs-Layer eingezogen wird: (1) **Cleanup-Schritt**, der bekannten
SSOT-Noise vor jedem Hardcover-Call entfernt (Trailing-Volume-Range, ` Omnibus`-
Varianten, ` Part One/Two`, `(Legends)`-Suffix, ` Vol.`/` Volume`-Suffix);
(2) **Fallback-Varianten-Schritt**, der bei `null_result_zero_hits` oder
`author_mismatch` (= benign Misses; nicht bei `graphql_error` /
`token_missing`) zusätzlich zwei Colon-Split-Varianten probiert (Drop-Suffix-
nach-Colon, Drop-Prefix-vor-Colon). Stop-Bedingung pro Buch: erste Variante,
die einen author-matched Hardcover-Treffer UND ein numerisches
`averageRating` liefert, gewinnt — author-matched Hits ohne Rating bleiben
heute Miss-Bucketed (Skript Zeile 380–386) und müssen deshalb in die
Win-Bedingung mit eingerechnet werden. Existierende `authorMatches()`-
Substring-Logik aus der Library bleibt unverändert. Detail-Spec in
Constraints § Architektur § Stop-Bedingung.

Effekt auf die DB ist ein Rating-Backfill — pro Buch höchstens ein
`bookDetails.rating`-Wert (wie heute), für ~32–40 zusätzliche Bücher
(konservative Schätzung über das Affected-Constraint: +7 bis +13 aus dem
150er-Subset, +25–27 aus dem Welle-4-Block via native Hardcover-Hit-Rate
auf den 40 nicht-affected plus die 10 affected Welle-4-Bücher; Detail-
Mathematik in Notes § Erwartungs-Kalibrierung).

Brief 085 schließt OQ (10) Hardcover-Hit-Rate-Härtung (Titel-Normalisierungs-
Layer) — siehe [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md)
unter dem Eintrag „gefaltet in Brief 085 (2026-05-19)" — und steht als
kleiner eigenständiger Brief zwischen Brief 084 (gemerged) und dem
Loop-Re-Trigger `ssot-w40k-021..025` aus dem Batches-Worktree.

## Context

Brief 075 (PR #59, gemerged) hat den Hardcover-Rating-Backfill als Standalone-
Script `scripts/backfill-hardcover-rating.ts` gelandet (idempotent default,
`--force`-Refresh-Pfad, W40K-SSOT-eng). Endstand der ersten Voll-Läufe (über
das damalige 150-W40K-Subset, pre-Welle-4): **77 Hits / 73 Misses (51.3 %)**.
Brief 076/077 hat danach weitere 50 W40K-Bücher (Welle 4, `ssot-w40k-016..020`)
appliziert; Brief 075 lief auf denen nie, deshalb haben die 50 weder Hits noch
Misses in der 075-Tabelle. Aktueller DB-Stand (post-076/077, pre-085):
**77 Hits / 200 W40K-SSOT-Bücher = 38.5 %**.

Miss-Profile aufgelöst (Brief-075-150er-Subset getrennt vom Welle-4-50er-Block,
weil Letzterer im 075-Backfill nicht gelaufen ist):

| Bucket | 075-Subset (0001..0150) | Welle-4 (0151..0200) | Gesamt 200 |
|---|---:|---:|---:|
| **Hits** | 77 | 0 (ungerated) | 77 |
| `no_author` (Anthologien/Editor-only) | 14 | unbekannt | ≥ 14 |
| `null_result_zero_hits` (Hardcover-`_eq` matcht nicht) | 40 | unbekannt | ≥ 40 |
| `author_mismatch` (Treffer, aber kein matching Author) | 19 | unbekannt | ≥ 19 |
| `ungerated` (nie gelaufen — Welle 4) | 0 | 50 | 50 |
| `null_result_after_filter` / `graphql_error` / `token_missing` | 0 | unbekannt | 0 (Token aktiv) |

Brief-085-Ziele bleiben dieselben wie ursprünglich: `null_result_zero_hits` und
`author_mismatch` über **Titel-Normalisierung** in Richtung Hit drücken. Die
50 Welle-4-Bücher laufen im selben 085-Force-Lauf erstmals durch — die
Normalisierung greift dort genauso wie über den 075-Subset.

Die 59 normalisierbaren Misses (im 075-Subset; die 50 Welle-4-Bücher folgen
demselben Roster-Pattern, weil dieselbe Excel-SSOT-Quelle) zerfallen empirisch
in drei dominante Pattern, die `python3` über `scripts/seed-data/book-roster.json`
sichtbar macht. **Pattern-Counts zweispurig** — globaler Roster-Count über alle
565 W40K-Bücher (erklärt, warum die Pattern überhaupt im Brief stehen) vs.
lokaler Count im 200er-Backfill-Subset (085-Wirk-Scope):

| Pattern | Roster-global (565 W40K) | 085-Subset (200 W40K) |
|---|---:|---:|
| Doppelpunkt `:` | 74 | **29** |
| `Omnibus` (jede Form) | 45 | **19** |
| `(Legends)`-Suffix | 3 | **0** |
| Volume-Range `, N-M$` | (nicht gemessen) | **4** |
| `Vol.` / `Volume N` | (nicht gemessen) | **2** |
| `Part One/Two`-Marker | (nicht gemessen) | **1** |
| **Unique titles affected by any pattern** | (nicht gemessen) | **38** |

(085-Subset-Mining 2026-05-19: 38 von 200 Büchern sind cleanup- oder
fallback-affected — 19 colon-only ohne Omnibus/Vol-Range/Part, 9 omnibus-
ohne-colon, 10 omnibus-mit-colon. Die übrigen 162 Bücher haben Roster-Titel,
die schon clean an Hardcover gehen und durch die Normalisierung unverändert
durchlaufen.)

Die fünf Cleanup-Pattern-Gruppen, mit Beispielen:

- **Doppelpunkt-Splits** (`"Belisarius Cawl: The Great Work"`,
  `"Imperator: Wrath of the Omnissiah"`, `"Iron Warriors: The Omnibus"`,
  `"Dark Hunters: Umbra Sumus"`). Kommen in zwei Formen vor:
  - **Character-/Series-Prefix** (Drop-Suffix-nach-Colon hittet): `"Belisarius
    Cawl: The Great Work"` → `"Belisarius Cawl"` als Hardcover-Standalone-Identity.
  - **Generic-Prefix mit Subtitle-Identity** (Drop-Prefix-vor-Colon hittet):
    `"Imperator: Wrath of the Omnissiah"` → `"Wrath of the Omnissiah"` als
    eigenständiger Buchtitel.

  Welche der beiden hittet, ist pro Buch unklar — deshalb beide als separate
  Fallback-Varianten probieren, je 1 API-Call.

- **`Omnibus`-Varianten** in unterschiedlichen Formen: `"Eisenhorn Omnibus"`,
  `"Ravenor: The Omnibus"`, `"The Ultramarines Omnibus"`, `"Gaunt's Ghosts:
  The Founding Omnibus, 1-3"`, `"Space Wolf: The Second Omnibus"`. Maintainer-
  Position (per Grilling 2026-05-19): **Hardcover listet Omnibus-Sammelbände
  praktisch nie unter dem `X Omnibus`-Titel** — User loggen entweder die
  Einzel-Bücher oder die Reihe ohne Omnibus-Suffix. Deshalb gehört ` Omnibus`
  und Varianten in den **Cleanup-Schritt**, nicht in die Fallback-Variante (=
  immer strippen vor dem primären Call).

- **`(Legends)`-Suffix** (`Deathwatch (Legends)`, `Ultramarines (Legends)`,
  `Space Wolves (Legends)` — Roster-global; **im 085-Subset 0×**, alle drei
  Bücher liegen hinter W40K-0200). `(Legends)` ist ein GW-Edition-Marker für
  die 2019er-Reprint-Reihe alter OOP-Bücher; Hardcover-User loggen vermutlich
  die Original-Form ohne den Marker. Cleanup-Regel bleibt im Set, weil die
  Welle-5+-Bücher das Pattern künftig mit reinbringen werden.

- **Volume-Range-Suffixe** wie `", 1-3"` / `", 4-7"` / `", 8-11"` / `",
  12-13"` und Part-Marker `" Part One"` / `" Part Two"` tauchen ausschließlich
  in Omnibus-Titeln auf und werden **niemals** so in Hardcover gelistet — also
  ebenfalls Cleanup. (Im 085-Subset: 4 Vol-Range-Treffer + 1 Part-Marker, alle
  in der Gaunt's-Ghosts-Omnibus-Reihe W40K-0040..0045.)

- **`Vol.` / `Volume N`-Suffixe** (z. B. `"The Uriel Ventris Chronicles Vol. 1
  Omnibus"`, `"The Uriel Ventris Chronicles Vol. 2 Omnibus"`): analog
  Maintainer-Position → Cleanup. (Im 085-Subset: 2 Treffer, beide Uriel
  Ventris Chronicles W40K-0056/0057.)

**Hardcover-GraphQL-Restriktion**: Die Library `src/lib/ingestion/v2/sources/
hardcover.ts` (Brief 054) baut die Suche heute als `books(where: { title:
{ _eq: $title } }, limit: 5)`. Es gibt **keinen** Fuzzy-/`_ilike`-Pfad in
Hardcovers Schema — die einzige Architektur-Form für mehrere Titel-Varianten
ist „pro Variante ein separater `_eq`-Call". Author-Filterung passiert nach
dem Call lokal über `authorMatches()` (case-insensitive Substring auf den
`contributions[].author.name`-Liste, max. 5 Hits pro Query).

**Konsumenten der Hardcover-Library**: Nach ADR
[`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md)
(Brief 074 Hygiene-Pass) ist die V2-LLM-Enrichment-Stage nicht mehr der
Default-Pfad — der Standing-Loop produziert Override-Files direkt via
`claude -p`-Subsession. `src/lib/ingestion/v2/run-engine.ts:289` ruft
`discoverHardcoverClaimV2` zwar strukturell weiterhin auf, aber dieser
Code-Pfad ist **dormant** (kein Standing-Loop, kein Maintainer-Workflow
fährt ihn). Damit hat `discoverHardcoverClaimV2` heute **genau einen aktiven
Produktions-Konsumenten** (`scripts/backfill-hardcover-rating.ts`) plus
**einen dormant legacy consumer** in der V2-Pipeline. **Brief 085 berührt die
Library nicht** (siehe Out-of-Scope) — die Normalisierung lebt als pure
DI-Helper-File neben dem Backfill-Script, im Brief-077/084-Pattern. Falls die
V2-Pipeline reaktiviert wird, entscheidet der Reaktivierungs-Brief über
Helper-Reuse oder eigene Strategie, nicht Brief 085.

Pfad-Bezüge:

- Backfill-Script: [`scripts/backfill-hardcover-rating.ts`](../scripts/backfill-
  hardcover-rating.ts) (Main-Loop Zeile 305–430, `progressLine`-Helper für
  Stdout-Log Zeile 240–261, `printSummary` Zeile 435–471).
- Hardcover-Library: [`src/lib/ingestion/v2/sources/hardcover.ts`](../src/lib/
  ingestion/v2/sources/hardcover.ts) (`discoverHardcoverClaimV2` Zeile 88,
  `authorMatches` Zeile 160). **Bleibt unverändert.**
- Skip-Helper-Sibling-Konvention (Brief 077, Brief 084):
  [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts) und
  [`scripts/apply-override-location-skip.ts`](../scripts/apply-override-
  location-skip.ts) als Form-Vorlagen für die neue
  `scripts/hardcover-title-normalize.ts`.
- Test-File-Konvention: [`scripts/test-resolver.ts`](../scripts/test-resolver.ts)
  hat heute die `decideFactionSkips`- und `decideLocationSkips`-Cases — ein
  neuer Test-File `scripts/test-hardcover-title-normalize.ts` oder eine
  zusätzliche Sektion in `test-resolver.ts` ist beides akzeptabel (Codex-
  Stil-Wahl, siehe Open questions).

**Was Brief 085 NICHT ist**: keine Library-Refactor (V2-Konsumenten bleiben
hands-off), kein Schema-Touch (`bookDetails.ratingSource` bleibt
`'hardcover'`-only), kein neuer Audit-Bucket in `book_details.notes`, kein
OL-Fallback (separate spätere OQ falls Hit-Rate auch post-085 < 70 % bleibt),
kein Author-Normalisierungs-Pfad (z. B. „James Swallow" vs. „James A. Swallow"
als author_mismatch-Ursache — separate Optimierung wenn nötig).

## Constraints

### Architektur

- **Zwei-Schritte-Form: Cleanup → Fallback-Varianten.** Der Cleanup-Schritt
  läuft **immer** vor dem primären Hardcover-Call und produziert den Query-
  String. Die Fallback-Varianten laufen **nur bei Miss** (zero hits oder
  author_mismatch) und probieren strukturelle Cuts auf dem **gecleaneten**
  Titel (nicht auf dem Roster-Titel). **Fallback-Reihenfolge verbindlich
  gepinnt: (1) Drop-Suffix-nach-Colon, (2) Drop-Prefix-vor-Colon.** Begründung:
  „first author-match wins" macht die Reihenfolge nicht korrektheitsneutral —
  bei einem Titel wie `"Belisarius Cawl: The Great Work"` könnten theoretisch
  sowohl `"Belisarius Cawl"` (Character-Identity) als auch `"The Great Work"`
  (Subtitle-Identity) author-matching Hardcover-Hits liefern, aber das wären
  **verschiedene** Bücher. Suffix-Drop-zuerst ist die richtige Heuristik,
  weil Character-/Series-Prefix + Subtitle die häufigere W40K-Pattern ist
  (`Belisarius Cawl: ...`, `Helbrecht: ...`, `Lucius: ...`,
  `Shadowsun: ...`) — der Prefix-Teil ist die Hardcover-Identity, der
  Subtitle ist meist beschreibend.

- **Pure DI-Helper-File `scripts/hardcover-title-normalize.ts`.** Folgt der
  077/084-Sibling-Konvention: keine FS/DB zur Call-Time, deterministisch,
  einfach testbar. Skeleton (illustrativ, kein Pflicht-Code):

  ```ts
  // scripts/hardcover-title-normalize.ts — pure helper, no FS/DB at call time

  export interface NormalizedTitleVariants {
    /** Title nach Cleanup — wird als primärer `_eq`-Query gesendet. */
    primary: string;
    /** Geordnete Liste von Fallback-Variants. Nur Strings != primary. */
    fallbacks: string[];
  }

  export function normalizeForHardcover(rosterTitle: string): NormalizedTitleVariants {
    /* (1) Cleanup-Schritt auf rosterTitle anwenden → primary
       (2) Auf primary die beiden Colon-Splits anwenden → fallbacks (dedup gegen primary) */
  }
  ```

  Helper-Funktion produziert: 1 `primary` + 0..2 `fallbacks`. Wenn das Buch
  keinen Doppelpunkt enthält, ist `fallbacks` leer und es bleibt bei 1
  API-Call pro Buch (= heutiges Verhalten, kein Mehraufwand).

- **Stop-Bedingung pro Buch** (im Backfill-Script-Loop). Die Win-Bedingung
  ist zweiteilig: author-matched Hit UND numerisches Rating, weil das Script
  ohne numerisches `averageRating` keinen `bookDetails.rating`-Wert schreiben
  kann (Skript Zeile 380–386 bucketed solche Hits heute als
  `null_result_zero_hits`). Fallback-Trigger ist auf benign Misses begrenzt
  (zero_hits / author_mismatch); harte Errors reproduzieren sich für jede
  Variante und müssen den bestehenden Fehler-Pfad nehmen:

  1. Cleanup-Variante (`primary`) probieren via `discoverHardcoverClaimV2(
     primary, author, opts)`.
  2. **Win-Bedingung**: `result.result !== null` UND `typeof
     (result.result.claim.raw as { audit?: { averageRating?: unknown }})
     .audit?.averageRating === 'number'`. Beides erfüllt → Hit verbuchen, in
     DB schreiben, nächstes Buch. (`authorMatches`-Filter steckt bereits in
     `discoverHardcoverClaimV2` und ist Pflicht-Bedingung für `result.result
     !== null` — gilt heute schon.)
  3. **Benign Miss** (Fallback erlaubt): `result.result === null` UND
     (`result.authorMismatch === true` ODER `result.reason === undefined`,
     d. h. zero hits). ODER: `result.result !== null` aber **kein**
     numerisches `averageRating` (= author-matched Hardcover-Buch ohne
     Rating-Wert; vielleicht hat eine andere Variante ein anderes
     Hardcover-Buch mit Rating). In beiden Fällen → erste Fallback-Variante
     probieren. Wiederholen für jede Variante in der Liste.
  4. **Harter Miss** (Fallback NICHT erlaubt): `result.result === null` UND
     `result.reason !== undefined` UND `result.authorMismatch !== true` (= 
     `graphql_error` / `token_missing`, plus ratingsCount-Probe-Errors die
     der heute schon vorhandene Probe-Loop-Pfad abfängt). Bestehende
     Miss-Bucket-Logik greift unverändert; kein Fallback, kein neuer
     API-Call.
  5. Alle benign Fallbacks erschöpft, keine hat Win-Bedingung erfüllt →
     Buch landet im Miss-Bucket, der dem **letzten** Versuch entspricht.
     Bucketing folgt der bestehenden Skript-Logik (kein neuer Bucket):
     - `author_mismatch` wenn die letzte Variante einen Treffer mit
       `result.authorMismatch === true` lieferte (Skript Zeile 354).
     - `null_result_zero_hits` wenn die letzte Variante 0 Hits hatte
       (Skript Zeile 357) **ODER** einen author-matched Hit ohne
       numerisches `averageRating` produzierte (Skript Zeile 383). Beide
       Sub-Fälle fallen heute schon in denselben Bucket.

- **`authorMatches`-Substring-Logik bleibt unverändert.** Heute matcht
  `name.toLowerCase().includes(expected.toLowerCase())` über
  `hit.contributions[].author.name`. Das deckt typische Author-Schreibweisen
  ab (z. B. „James Swallow" matcht in einer Hardcover-Edition, die „James
  Swallow, James A. Swallow" als zwei Contributors trägt). Brief 085 baut
  **keine** Author-Normalisierung — sollte sich die Author-Substring-Logik in
  der Empirie als zu schmal erweisen (z. B. wenn „James A. Swallow" als
  einziger Hardcover-Contributor steht und unser Roster „James Swallow"
  trägt), wandert das in eine neue OQ post-085.

- **ratingCount-Probe-Logik im Backfill-Script bleibt unverändert.** Heute
  probiert das Script `users_count` und fällt auf `ratings_count` zurück;
  beide gescheitert → ratingCount stays NULL. Die Probe-Logik ist orthogonal
  zur Titel-Normalisierung; Cleanup/Fallback-Varianten benutzen denselben
  `opts.ratingsCountField`-State wie der heutige Code.

### Cleanup-Schritt — Regel-Set + Fixpoint-Loop

Folgende Regeln werden **in einer Schleife** auf `rosterTitle` angewendet,
case-insensitive Match, `.trim()` nach jedem Pass. Schleife läuft, bis **kein
Regel-Match mehr feuert** (Fixpoint). Reihenfolge **zwischen** den
Regel-Gruppen (Volume-Range / Part / Legends / Vol. / Omnibus) ist im
Fixpoint funktional egal — Mehrfach-Suffixe wie `… Vol. 1 Omnibus` werden
über die Schleife aufgelöst (egal welche Regel zuerst feuert: nach max. 3
Pässen ist Fixpoint erreicht).

**Reihenfolge INNERHALB der Omnibus-Regelgruppe ist NICHT invariant** — die
spezifischen Patterns müssen vor dem generischen `\s+Omnibus\s*$` laufen,
sonst frisst der generische Match die Omnibus-Tail-Substrings auf, bevor die
spezifischen Patterns (mit Colon-Prefix) zugreifen können. Beispiel: bei
`"Ravenor: The Omnibus"` würde `\s+Omnibus\s*$` zuerst ` Omnibus` strippen →
`"Ravenor: The"` (Sackgasse, kein weiteres Pattern matched, Fixpoint mit
falschem Result). Spezifisch-zuerst löst es zu `"Ravenor"` auf wie gewünscht.
Verbindliche Intra-Omnibus-Reihenfolge ist in der Regel-Liste unten codiert
(specific patterns first, generic last).

Pflicht-Guard: max. **8 Iterationen** der Schleife (safety net gegen
pathologische Regex-Interaktion). Wenn nach 8 Pässen kein Fixpoint erreicht
ist → `throw new Error(...)` mit dem Roster-Titel im Message-String.
Realistisch erwartete Pass-Zahl: 1–3.

Regel-Set (pro Pass in dieser Reihenfolge angewandt, jede Regel max. ein
Match-Strip pro Pass am Ende des Strings):

1. **Trailing Volume-Range strippen.** Regex matcht `,\s*\d+\s*[-–]\s*\d+\s*$`
   am Titel-Ende (Beispiel: `, 1-3`, `, 4-7`, `, 8-11`, `, 12-13`, auch mit
   Em-Dash `, 1–3`).
2. **Trailing Part-Marker strippen.** Regex matcht `\s+Part\s+(One|Two|Three|
   I|II|III|1|2|3)\s*$` am Titel-Ende.
3. **`(Legends)`-Suffix strippen.** Regex matcht `\s*\(Legends\)\s*$` am
   Titel-Ende.
4. **`Vol.`/`Volume N`-Suffix strippen.** Regex matcht `\s+Vol\.?\s+\d+\s*$`
   oder `\s+Volume\s+\d+\s*$` am Titel-Ende.
5. **` Omnibus`-Varianten strippen.** Die Omnibus-Variante hat mehrere Formen,
   die alle weg sollen. **Pflicht-Reihenfolge: spezifische Patterns zuerst,
   generisches `\s+Omnibus\s*$` zuletzt als Fallback** (siehe Begründung
   oben — generic-first frisst die Tail-Substrings auf, bevor specific
   matched). Mindestens diese Varianten müssen in dieser Reihenfolge
   abgedeckt sein:

   1. `:\s*The\s+Complete\s+\w+\s+Omnibus\s*$` (specific: `Iron Warriors:
      The Complete Honsou Omnibus` → `Iron Warriors`)
   2. `:\s*The\s+(First|Second|Third|Founding|Saint|Lost|Victory)\s+Omnibus\s*$`
      (specific: `Space Wolf: The Second Omnibus` → `Space Wolf`, `Gaunt's
      Ghosts: The Founding Omnibus` → `Gaunt's Ghosts`)
   3. `:\s*The\s+Omnibus\s*$` (specific: `Ravenor: The Omnibus` → `Ravenor`)
   4. `\s+Omnibus\s*$` (generic fallback: `Eisenhorn Omnibus` → `Eisenhorn`)

   Codex darf eine kompaktere Form verwenden (z. B. eine einzige Regex mit
   alternation, die alle Fälle abdeckt — dann ist die Reihenfolge implizit
   durch die Regex-Engine-Semantik geregelt: längster Match gewinnt nicht
   automatisch, aber bei `try-in-order`-Form mit nicht-überlappenden
   Patterns ist die Reihenfolge irrelevant). Hard-Anforderung: Test-Coverage
   (siehe Tests) muss alle obigen Beispiele plus die Edge-Cases treffen,
   insbesondere den Test-Case (4): `"Ravenor: The Omnibus" → "Ravenor"`
   (nicht `"Ravenor: The"`).

Nach jedem Pass: `.trim()` auf das Result, **leerer String** wäre ein Bug
(Edge-Case-Test: wenn der gecleanete String leer ist → throw, weil so was
in unserem Roster nicht vorkommen sollte). Skeleton:

```ts
function applyCleanup(title: string): string {
  let prev = "";
  let curr = title.trim();
  for (let i = 0; i < 8; i++) {
    if (curr === prev) return curr;          // fixpoint reached
    prev = curr;
    curr = curr.replace(/,\s*\d+\s*[-–]\s*\d+\s*$/u, "").trim();
    curr = curr.replace(/\s+Part\s+(One|Two|Three|I|II|III|1|2|3)\s*$/iu, "").trim();
    curr = curr.replace(/\s*\(Legends\)\s*$/iu, "").trim();
    curr = curr.replace(/\s+(Vol\.?|Volume)\s+\d+\s*$/iu, "").trim();
    curr = stripOmnibusVariants(curr).trim();  // specific-before-generic intern
  }
  throw new Error(`applyCleanup: no fixpoint after 8 passes for "${title}" — final: "${curr}"`);
}

// stripOmnibusVariants intern: specific Colon-Patterns ZUERST, generic
// "\s+Omnibus\s*$" ZULETZT — siehe Constraints § Cleanup-Schritt § Regel 5.
```

(Skeleton illustrativ. Codex macht die genaue Form.)

### Fallback-Varianten — exakte Liste mit verbindlicher Reihenfolge

Werden auf den **gecleaneten `primary`** angewandt (nicht auf den Roster-Titel),
nur wenn `primary.includes(':')`. **Reihenfolge ist verbindlich** (siehe
Architektur-Begründung: „first author-match wins" macht die Reihenfolge nicht
korrektheitsneutral). Die `fallbacks`-Liste in `NormalizedTitleVariants` MUSS
in dieser Reihenfolge geordnet sein:

1. **Drop-Suffix-nach-Colon** (zuerst probieren): `"Belisarius Cawl: The Great
   Work"` → `"Belisarius Cawl"` (alles nach dem ersten `:` weg, dann `.trim()`).
2. **Drop-Prefix-vor-Colon** (zweitens probieren): `"Belisarius Cawl: The Great
   Work"` → `"The Great Work"` (alles vor dem ersten `:` weg, dann `.trim()`).

Dedup gegen `primary` und gegen sich selbst (falls Cleanup bereits den
Colon-Cut produziert hat — selten, aber Edge-Case). Wenn beide Fallback-
Varianten identisch wären (unmöglich bei einem einzigen Colon, möglich bei
mehreren Colons), nur einmal in die Liste. Dedup ändert die Reihenfolge nicht
— der Suffix-Drop bleibt vor dem Prefix-Drop, falls beide unique sind.

### Stdout-Log-Erweiterung (Audit, no DB touch)

- **`progressLine`** in `scripts/backfill-hardcover-rating.ts` (Zeile 240–261)
  bekommt einen neuen optionalen Parameter `variantUsed?: string` für den
  `kind: "hit"`-Fall. Wenn ein Buch über den `primary` hittet → `via=cleanup`
  (oder `via=original` wenn Cleanup keine Änderung gemacht hat, also
  `primary === rosterTitle` — minor cosmetic, Codex-Wahl). Wenn ein Buch über
  eine Fallback-Variante hittet → `via=colon-suffix-drop` oder
  `via=colon-prefix-drop`. Beispiel-Stdout-Zeile (Index ist `[NNN/200]`,
  weil der Voll-Lauf über alle 200 W40K-Bücher geht):

  ```
  [042/200] W40K-0042 "Belisarius Cawl: The Great Work" → rating=4.42 (count=45, via=cleanup)
  [073/200] W40K-0073 "Eisenhorn Omnibus" → rating=3.94 (count=304, via=cleanup)
  [110/200] W40K-0110 "Imperator: Wrath of the Omnissiah" → rating=4.10 (count=88, via=colon-prefix-drop)
  ```

- **`printSummary`** in `scripts/backfill-hardcover-rating.ts` (Zeile 435–471)
  bekommt einen neuen Block „Variant-Distribution" nach der Misses-Bucket-
  Tabelle: zeigt, wie viele Hits aus welcher Variante kamen.

  ```
  Variant-distribution (hits only):
    cleanup                   85
    colon-suffix-drop         12
    colon-prefix-drop          7
  ```

  Das gibt dem Maintainer einen Spot-Check-Anker: „85 von 104 Hits laufen über
  den Cleanup-Pfad → Cleanup ist die dominante Hebel, Fallback-Varianten sind
  Marginal-Gewinn". Falls Fallback-Varianten 0 Hits liefern → Codex flagged
  das im Closing-Report (= Indiz, dass die Fallback-Strategie nicht trägt
  und wir die Liste anders bauen müssen, z. B. mit Punctuation-Strip).

- **`bookDetails.ratingSource` bleibt `'hardcover'` für jeden Hit**, egal
  welche Variante gewonnen hat. Kein neuer Wert, kein Schema-Touch.

### Tests

- **Mindestens 8 Test-Cases für `normalizeForHardcover`.** Codex kann sie in
  `scripts/test-resolver.ts` als neue Sektion oder in einer neuen File
  `scripts/test-hardcover-title-normalize.ts` legen (Codex-Stil). Pflicht-
  Coverage:
  1. Pass-through (Titel ohne Noise): `"Xenos"` → `{ primary: "Xenos",
     fallbacks: [] }`.
  2. Volume-Range-Strip plus Omnibus-Strip (Mehrfach-Suffix via Fixpoint):
     `"Gaunt's Ghosts: The Founding Omnibus, 1-3"` → `{ primary: "Gaunt's
     Ghosts", fallbacks: [] }`. Cleanup-Trace: Pass 1 strippt `, 1-3` →
     `"Gaunt's Ghosts: The Founding Omnibus"`, Pass 2 strippt
     `: The Founding Omnibus` (matcht die `:\s*The\s+Founding\s+Omnibus\s*$`-
     Variante) → `"Gaunt's Ghosts"`, Pass 3 macht keinen Change → Fixpoint.
     `primary.includes(":")` ist false → Fallback-Schritt feuert nicht → leere
     Fallbacks-Liste. **Wichtig**: Fallbacks werden architektur-konform aus
     dem **gecleaneten Primary** abgeleitet, nicht aus dem Roster-Titel.
  3. Omnibus-Strip-Basic: `"Eisenhorn Omnibus"` → `{ primary: "Eisenhorn",
     fallbacks: [] }`.
  4. Omnibus-Strip-mit-Colon: `"Ravenor: The Omnibus"` → `{ primary:
     "Ravenor", fallbacks: [] }`.
  5. `(Legends)`-Strip: `"Deathwatch (Legends)"` → `{ primary: "Deathwatch",
     fallbacks: [] }`.
  6. Vol-Strip-mit-Omnibus (Mehrfach-Suffix via Fixpoint):
     `"The Uriel Ventris Chronicles Vol. 1 Omnibus"` → `{ primary: "The Uriel
     Ventris Chronicles", fallbacks: [] }`. Cleanup-Trace: Pass 1 strippt
     ` Omnibus` (`\s+Omnibus\s*$`) → `"The Uriel Ventris Chronicles Vol. 1"`,
     Pass 2 strippt ` Vol. 1` (`\s+Vol\.?\s+\d+\s*$`) → `"The Uriel Ventris
     Chronicles"`, Pass 3 macht keinen Change → Fixpoint. Test-Case stellt
     sicher, dass die Cleanup-Schleife Mehrfach-Suffixe in beliebiger
     Reihenfolge auflöst (ohne dass Codex die Regelreihenfolge umsortieren
     muss).
  7. Colon-Split-Character-Prefix: `"Belisarius Cawl: The Great Work"` →
     `{ primary: "Belisarius Cawl: The Great Work", fallbacks: ["Belisarius
     Cawl", "The Great Work"] }`.
  8. Colon-Split-Series-Prefix: `"Imperator: Wrath of the Omnissiah"` →
     `{ primary: "Imperator: Wrath of the Omnissiah", fallbacks: ["Imperator",
     "Wrath of the Omnissiah"] }`.

  Plus Edge-Cases die Codex selbst entscheidet (Whitespace-Idiosynkrasien,
  Em-Dash in Volume-Range, mehrere Colons im Titel, leere String nach
  Cleanup-Throw).

- **`npm run test:hardcover-title-normalize` oder eine erweiterte
  `npm run test:resolver`**: in `package.json` als Script-Eintrag verankern,
  CI-Ready.

### Verifikation am echten Datensatz

- **Kein dedizierter Smoke-Lauf in der Acceptance.** Das Backfill-Script
  schreibt bei jedem Hit unconditionally in `bookDetails.rating` (Skript
  Zeile 404–419) — auch ohne `--force`. Damit würde JEDER Smoke (auch
  `--limit=20` ohne `--force`) die Pre-085-DB-Baseline für die getroffenen
  Bücher verändern, bevor der Full-Run die Diff-Listen aus „rating *vor*
  dem 085-Lauf" baut. Pre-Flight-Validation übernehmen stattdessen:
  - **Unit-Tests** (≥ 8 Test-Cases auf `normalizeForHardcover`, siehe
    Constraints § Tests) — deterministisches Pre-Flight ohne Hardcover-API.
  - **`npm run lint` und `npm run typecheck`** — Typ-/Style-Pre-Flight des
    Backfill-Script-Wirings.

  Optionaler Live-Hardcover-API-Spot-Check vor dem Full-Run (manuell, nicht
  acceptance-relevant): Throw-Away-`tsx`-Helper, der `normalizeForHardcover()`
  + `discoverHardcoverClaimV2()` für 1–2 Test-Bücher aufruft OHNE DB-Insert.
  Der Full-Run ist ~40 s und idempotent re-runnable bei Fehler.

- **Voller Force-Lauf `npm run backfill:hardcover-rating -- --force`** über
  **alle 200 W40K-Bücher** (`ssot-w40k-001..020`, `externalBookId` `W40K-0001`
  bis `W40K-0200`), einmal nach Implementation. `loadTargets()` ist bereits so
  geformt, dass `--force` über die volle W40K-SSOT-Menge läuft — kein
  zusätzliches Scope-Flag nötig. Was der Lauf produziert:

  - **Für die 150er-Subset (W40K-0001..W40K-0150)**: Idempotenz-Default würde
    nur die 73 Misses re-fetchen, aber `--force` macht zusätzlich sichtbar,
    ob Cleanup für die existierenden 77 Hits irgendetwas re-ändert (anderes
    Hardcover-Buch matched, weil cleaned-Titel anderen Bucket trifft). Codex
    flagged Überschreibungen — siehe Diff-Liste-Spec unten.
  - **Für den Welle-4-Block (W40K-0151..W40K-0200)**: Erstlauf — alle 50
    Bücher gehen entweder in einen Hit oder einen Miss-Bucket. Brief 075
    hat diese nie gesehen, deshalb existiert keine 075-Pre-Baseline für sie;
    die Brief-085-Counts sind der erste Datenpunkt.

  **Erwartung Überschreibungen im 150er-Subset: 0–3 Wechsel** (Cleanup ist
  bewusst konservativ; für „nie in Hardcover"-Strings — Volume-Range, Part,
  `(Legends)`, `Vol.`, Omnibus — ist die Wahrscheinlichkeit eines vorherigen
  Hits niedrig). Falls > 5 Wechsel → das ist ein Anlass zum Spot-Check, geht
  in den Closing-Report mit konkreten `before/after`-Diff pro Buch.

### Brief-085-Status-Lifecycle

- **Status-Flips macht Codex** (analog 077-impl / 080-impl / 084-impl):
  Brief 085-arch `status: open → implemented` im selben Commit wie der
  085-impl-Report; `sessions/README.md` Active-Threads-Zeilen entsprechend.
  Cowork übernimmt nur den Wiki-Hygiene-Pass danach.

## Out of scope

- **Die 14 `no_author`-Bücher** (Anthologien, Editor-only) bleiben weiter bei
  `bookDetails.rating = NULL`. Fix-Pfad ist Roster-Pflege im
  `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` (Maintainer-Workflow),
  kein Backfill-Concern. 085 berührt den `no_author`-Bucket-Pfad im Script
  nicht.
- **Author-Normalisierungs-Layer** (z. B. „James Swallow" vs. „James A.
  Swallow" als author_mismatch-Ursache). Wenn nach Brief 085 die Hit-Rate
  weiter signifikant unter Erwartung liegt und die Closing-Report-Empirie
  zeigt, dass author_mismatch trotz Titel-Normalisierung den dominanten
  Miss-Bucket darstellt, wandert das in eine neue OQ. **Nicht 085.**
- **Library `src/lib/ingestion/v2/sources/hardcover.ts` bleibt unverändert.**
  Die Normalisierung lebt als Backfill-Script-Konzern, nicht als
  Library-Funktion (Begründung in Context § „Konsumenten der Hardcover-
  Library": V2-Stage dormant per ADR; ein Library-Refactor wäre Komplexität
  ohne Nutzen, bis die V2-Pipeline reaktiviert wird).
- **OL-Fallback (Open Library als sekundärer Rating-Pfad).** Bleibt geparkt.
  Wird erst wieder Thema, wenn nach Brief 085 die Hit-Rate weiterhin < 70 %
  ist. Dann eigene OQ + eigener Brief.
- **`book_details.notes`-Schema-Touch.** Kein neuer Bucket wie
  `factionsSkippedRedundant` / `locationsSkippedRedundant`. Audit lebt
  ausschließlich im Stdout-Log des Backfill-Runs.
- **`bookDetails.ratingSource`-Erweiterung.** Kein neuer Wert
  `'hardcover-normalized'`. Bleibt `'hardcover'`. Per Maintainer-Wahl im
  Grilling 2026-05-19 (Frage 4 → Variante A, Minimal-Scope).
- **Schema-Migration.** Keine. `bookDetails`-Spalten bleiben unverändert.
- **`backfill-hardcover-rating.ts`-Erweiterung um `--limit=<NNN>`-Modus über
  bestehenden hinaus**, **um Multi-Pass-Logik**, **um Retry-on-graphql_error-
  Logik**, **um einen `--dry-run`/`--no-write`-Modus**, etc. — alles
  bestehende Verhalten bleibt. 085 ändert nur (a) den Titel-String, der an
  `discoverHardcoverClaimV2` rausgeht und (b) die Stdout-Log-Form. Sonst
  nichts. Dry-Run-Mode wäre die elegante Smoke-Lösung, ist aber 085-Out-of-
  Scope; wenn ein Maintainer-Workflow das post-085 braucht → eigene OQ.
- **Hardcover-`limit: 5`-Erhöhung.** Heute 5 Hits pro Query, wenn keiner
  passt → next variant. Das genügt; eine größere Hit-Liste pro Variante würde
  die Author-Filter-Wahrscheinlichkeit kaum verbessern (Hardcover sortiert
  per Default by relevance, die ersten 5 sind die relevantesten Matches).

## Acceptance

Die Session ist done, wenn:

- [ ] `scripts/hardcover-title-normalize.ts` existiert mit der pure DI-Helper-
  Funktion `normalizeForHardcover(rosterTitle: string): NormalizedTitleVariants`.
  Cleanup-Schritt deckt alle 5 Regelgruppen aus Constraints § Cleanup-Schritt
  ab. Fallback-Varianten sind die 2 Colon-Splits aus Constraints § Fallback-
  Varianten. Dedup-Logik gegen `primary` und sich selbst.

- [ ] Mindestens **8 Test-Cases** für `normalizeForHardcover` (Liste in
  Constraints § Tests). Test-Lauf grün via `npm run test:hardcover-title-
  normalize` (oder integriert in `npm run test:resolver`, Codex-Wahl).

- [ ] `scripts/backfill-hardcover-rating.ts` ruft `normalizeForHardcover`
  pro Buch auf und implementiert die 2-Schritt-Stop-Bedingung aus
  Constraints § Architektur § Stop-Bedingung: `primary` zuerst, dann
  Fallbacks bei **benign** Miss (`null_result_zero_hits` oder
  `author_mismatch` oder author-matched-Hit-ohne-numerisches-`averageRating`),
  KEINE Fallbacks bei harten Errors (`graphql_error` / `token_missing` /
  ratingsCount-Probe-Error). **Win-Bedingung: erste Variante mit
  `result.result !== null` UND numerischem `audit.averageRating` gewinnt.**

- [ ] `progressLine` erweitert um `variantUsed`-Output (Form: `via=<variant-name>`
  am Ende der Hit-Zeile). Codex wählt die genaue Variant-Naming-Konvention
  (z. B. `cleanup` / `colon-suffix-drop` / `colon-prefix-drop` oder eine
  prägnantere Form), aber konsistent zwischen Stdout und Summary-Block.

- [ ] `printSummary` zeigt einen neuen „Variant-distribution (hits only):"-
  Block nach der Misses-Bucket-Tabelle.

- [ ] Voller `--force`-Lauf über **alle 200 W40K-SSOT-Bücher** gefahren. Codex
  liefert im Closing-Report:
  - Neue Counts-Tabelle in **drei Spalten** (150er-Subset Pre vs. Post +
    Welle-4-Block-Post + Gesamt-200-Post):

    | Bucket | 075-Subset Pre (0001..0150) | 075-Subset Post | Welle-4 Post (0151..0200) | Gesamt 200 Post |
    |---|---:|---:|---:|---:|
    | Hits | 77 | ?? | ?? | ?? |
    | `no_author` | 14 | 14 | ?? | ?? |
    | `null_result_zero_hits` | 40 | ?? | ?? | ?? |
    | `author_mismatch` | 19 | ?? | ?? | ?? |
    | **Hit-Rate** | **51.3 %** | **??.?** | **??.?** | **??.?** |

    Trenn-Linie zwischen 150er und Welle-4 macht den Brief-075-Vergleich 1:1
    und zeigt zugleich den Welle-4-First-Pass als eigenen Datenpunkt.

  - Variant-Distribution-Tabelle (welche Variante hat wieviel Hits geliefert,
    aggregiert über alle 200; optional zusätzlich pro Subset wenn Codex Lust
    hat).

  - **Diff-Liste A: `--force`-Lauf-Überschreibungen** (Bücher im 150er-
    Subset, bei denen `bookDetails.rating` *vor* dem 085-Lauf einen Wert
    hatte und *nach* dem Lauf einen **anderen** Wert hat — das Script hat
    also für dasselbe Buch jetzt einen *anderen* Hardcover-Match gefunden).
    Erwartung 0–3 — bei > 5 flagged Codex mit Spot-Check-Material.
    Diff-Zeile pro Buch:
    `externalBookId | rosterTitle | primary (post-cleanup) | beforeRating →
    afterRating | new Hardcover URL`.

  - **Diff-Liste B: Hit→Miss-Regressions** (Bücher im 150er-Subset, bei denen
    `bookDetails.rating` *vor* dem 085-Lauf einen Wert hatte und der neue
    Lauf für sie **gar keinen Hit** mehr findet). Das Script schreibt im
    Miss-Pfad nichts (Zeile 352–376 — Counter wird gebumpt, DB-Wert bleibt
    stehen). In Diff-Liste A wären diese Bücher unsichtbar, weil
    `afterRating === beforeRating` (= alter DB-Wert ist noch da). Sie sind
    aber **genau die aggressive-Cleanup-Regressions-Klasse**, die Brief 085
    spot-checken will: Cleanup hat einen vorher hittenden Roster-Titel so
    verändert, dass Hardcover ihn nicht mehr findet. **Erwartung 0** — bei
    > 0 ist das ein hard signal, dass eine Cleanup-Regel zu aggressiv ist
    und revertiert werden muss (oder eine fehlende Fallback-Variante
    auffüllen muss). Diff-Zeile pro Buch:
    `externalBookId | rosterTitle | primary (post-cleanup) | missBucket |
    beforeRating`.

  Hinweis zur Erfüllbarkeit beider Diff-Listen: `book_details` persistiert
  nur `rating`/`ratingSource`/`ratingCount`,
  **keinen Hardcover-Slug oder URL**. Ein „Hardcover-Slug vorher/nachher"-
  Vergleich ist deshalb konstruktiv nicht möglich. Der **vorherige** Slug ist
  unbekannt; der **neue** Slug/URL kommt aus dem aktuellen API-Response und
  landet in Diff-Liste A als manueller Spot-Check-Anker. Für `beforeRating` ist
  `loadTargets()` zu erweitern, sodass es zusätzlich zu `workId/externalBookId/
  title` auch den existierenden `bookDetails.rating`-Wert lädt (ein weiterer
  Column-Select auf dem bestehenden `leftJoin(bookDetails, …)`, kein neuer
  Query). Wenn kein `before`-Wert existiert (z. B. Welle-4-Block) → Zeile
  landet **weder in A noch in B** (kein „Wechsel" und keine „Regression",
  weil kein Vorzustand existiert).

- [ ] Verifikations-Commands grün: `npm run lint`, `npm run typecheck`,
  `npm run test:hardcover-title-normalize` (bzw. integriert in
  `test:resolver`), `npm run brain:lint -- --no-write` (0 blocking).

- [ ] Closing-Report `sessions/2026-05-DD-085-impl-hardcover-hit-rate-
  hardening.md` geschrieben mit Counts-Delta-Tabelle, Variant-Distribution,
  Diff-Liste der Überschreibungen, plus For-next-session-Items (Author-
  Normalisierung als nächste OQ falls weiterhin substanzieller
  author_mismatch-Bucket; OL-Fallback-Wieder-Aufmachen falls Hit-Rate trotz
  Normalisierung < 70 %; Title-Pattern, die in der Empirie auftauchten und
  in der initialen Cleanup-Liste nicht abgedeckt waren).

## Open questions

- **Test-File-Konvention: neues `scripts/test-hardcover-title-normalize.ts`
  oder neue Sektion in `scripts/test-resolver.ts`?** Cowork-Tendenz: neue
  File, weil Title-Normalisierung kein Resolver-Semantik-Pfad ist
  (`test-resolver.ts` testet `resolveFaction` / `resolveLocation` /
  `resolveCharacter`-Surface-Form-zu-ID-Übersetzung). Aber Codex hat
  Stil-Freiheit — wenn die Integration in `test-resolver.ts` sauberer
  aussieht (weniger Boilerplate, gemeinsamer Test-Runner), gerne.

- **Variant-Naming für Stdout-Log.** Cowork hat in Constraints
  `cleanup` / `colon-suffix-drop` / `colon-prefix-drop` vorgeschlagen, aber
  das sind 17-Zeichen-Strings, die die Stdout-Zeile breit machen. Codex
  könnte kompakter (`c` / `cs` / `cp`) oder semantisch (`original` /
  `cleaned` / `colon-a` / `colon-b`) variieren. **Nicht** kritisch — wichtig
  ist Konsistenz zwischen progressLine und printSummary.

- **Cleanup-Schritt-Reihenfolge im Helper.** Zwischen den **Regel-Gruppen**
  (Volume-Range / Part / Legends / Vol. / Omnibus) ist die Reihenfolge im
  Fixpoint funktional egal — Codex kann die Listen-Reihenfolge frei wählen.
  **Innerhalb der Omnibus-Regelgruppe ist die Reihenfolge NICHT egal**
  (specific patterns first, generic `\s+Omnibus\s*$` last) — siehe
  Constraints § Cleanup-Schritt § Regel 5. Pflichten für Codex: (a) jede
  Regel-Gruppe max. ein Match-Strip pro Pass, (b) `.trim()` zwischen den
  Regeln, (c) Omnibus-Intra-Order eingehalten.

- ~~Fallback-Varianten-Reihenfolge~~ — geklärt: Suffix-Drop zuerst,
  Prefix-Drop zweitens, verbindlich. Siehe Constraints § Architektur und
  Constraints § Fallback-Varianten.

- **Whitespace-Edge-Cases.** Cleanup-Regeln benutzen `\s+` und `.trim()` —
  was passiert mit Non-Breaking-Space (U+00A0) im Roster-Titel? Sollte
  nicht vorkommen (Excel-SSOT-Import normalisiert), aber wäre ein
  ungesunder Edge-Case. Codex flagged im Closing-Report, falls die Empirie
  so was zeigt.

- **Cleanup-Regel für `, 12-13` als Volume-Range.** Das ist die einzige
  Volume-Range im Roster, die zweistellig ist. Constraints-Regex
  `,\s*\d+\s*[-–]\s*\d+\s*$` matcht das — Test-Case stellt sicher, dass
  Codex die Multi-Digit-Form nicht aus Versehen mit `\d` (= single digit)
  schreibt.

## Notes

### Branch-Konvention (per Brief 082 Worktree-Disziplin)

Brief 085 ist **Batch/Ingestion-Strang** (Backfill-Script ist Teil des
Ingestion-Stacks, lebt unter `scripts/` neben `apply-override*.ts`). Korrekte
Worktree-/Branch-Form:

```bash
cd /c/Users/Phil/chrono-lexicanum-batches
git fetch origin
git switch -c codex/ingest-batches-hardcover-normalize origin/main
# Implementation: hardcover-title-normalize.ts + Tests + Backfill-Script-Wiring + Stdout-Log
# Voller --force-Lauf gegen Supabase
# Closing-Report schreiben
git push -u origin codex/ingest-batches-hardcover-normalize
gh pr create --base main --head codex/ingest-batches-hardcover-normalize
```

Branch-Erzeugung erfolgt aus `origin/main` (Brief 084 ist gemerged, kein
Vorgänger-Dependency-Branch). `worktree/batches-bootstrap` bleibt unangetastet
als Bootstrap-Branch des Worktrees.

### Form-Vorlage für die Helper-File

Illustrativ, basierend auf `scripts/apply-override-skip.ts` (Brief 077) und
`scripts/apply-override-location-skip.ts` (Brief 084):

```ts
// scripts/hardcover-title-normalize.ts — Skeleton, kein vollständiger Code

export interface NormalizedTitleVariants {
  primary: string;
  fallbacks: string[];
}

export function normalizeForHardcover(rosterTitle: string): NormalizedTitleVariants {
  const primary = applyCleanup(rosterTitle);
  if (primary.length === 0) {
    throw new Error(`normalizeForHardcover: cleanup produced empty string for "${rosterTitle}"`);
  }
  const fallbacks = primary.includes(":")
    ? dedupAgainst(primary, [dropAfterColon(primary), dropBeforeColon(primary)])
    : [];
  return { primary, fallbacks };
}

function applyCleanup(title: string): string {
  // Fixpoint loop — pass-until-stable, max 8 passes (safety guard).
  // Inter-Gruppen-Reihenfolge unten ist funktional egal; Intra-Omnibus-
  // Reihenfolge in stripOmnibusVariants ist specific-before-generic.
  let prev = "";
  let curr = title.trim();
  for (let i = 0; i < 8; i++) {
    if (curr === prev) return curr;
    prev = curr;
    curr = curr.replace(/,\s*\d+\s*[-–]\s*\d+\s*$/u, "").trim();
    curr = curr.replace(/\s+Part\s+(One|Two|Three|I|II|III|1|2|3)\s*$/iu, "").trim();
    curr = curr.replace(/\s*\(Legends\)\s*$/iu, "").trim();
    curr = curr.replace(/\s+(Vol\.?|Volume)\s+\d+\s*$/iu, "").trim();
    curr = stripOmnibusVariants(curr).trim();
  }
  throw new Error(`applyCleanup: no fixpoint after 8 passes for "${title}"`);
}
```

Die genaue Form macht Codex — die DI-Signatur (pure function, kein FS/DB,
deterministisch) ist die harte Anforderung, alles andere ist Stil.

### Stdout-Log-Beispiel-Form (illustrativ)

```
=== backfill-hardcover-rating (--force) ===
200 target works; estimated minimum runtime ~40s (Hardcover politeness 200ms × N).
[001/200] W40K-0001 "Xenos" → rating=3.94 (count=304, via=cleanup)
[002/200] W40K-0002 "Eisenhorn Omnibus" → rating=3.94 (count=304, via=cleanup)
[003/200] W40K-0003 "Belisarius Cawl: The Great Work" → rating=4.42 (count=45, via=cleanup)
[004/200] W40K-0004 "Imperator: Wrath of the Omnissiah" → rating=4.10 (count=88, via=colon-prefix-drop)
[005/200] W40K-0005 "Helbrecht: Knight of the Throne" → rating=4.30 (count=22, via=colon-suffix-drop)
[006/200] W40K-0006 "Genefather" → rating=4.50 (count=13, via=cleanup)
[007/200] W40K-0007 "Voidscarred" → SKIP (no_author)
...

=== Summary ===
Mode:                  --force
Total target books:    200
Hits:                  144  (72.0%)
Misses:                56
  no_author                      18
  null_result_zero_hits          28
  null_result_after_filter        0
  author_mismatch                10
  graphql_error                   0
  token_missing                   0
ratingCount written:   140 / 144 hits (using "users_count")

Variant-distribution (hits only):
  cleanup                  118
  colon-suffix-drop         17
  colon-prefix-drop          9
```

(Konkrete Zahlen sind illustrativ — die echte Counts-Tabelle baut Codex aus
dem `--force`-Lauf über 200 Bücher.)

### Coordination-Worktree-Hinweis

Der Main-Worktree (`C:\Users\Phil\chrono-lexicanum`) hat aktuell ~150
modifizierte Files (rein Line-Ending-Symmetrie aus historisem Setup, nicht
mit Brief 085 verbunden). Brief 085 wird im Batches-Worktree
(`chrono-lexicanum-batches`) gefahren — dort ist der State clean. Wenn Codex
versehentlich im Main-Worktree landet (Worktree-Wechsel vergessen), erst
`git status` prüfen, dann `git switch` in den richtigen Worktree.

### Erwartungs-Kalibrierung

**Hard architectural constraint (Pattern-Mining 2026-05-19):** Brief 085
kann *ausschließlich* Bücher konvertieren, deren Roster-Titel ein Cleanup-
oder Fallback-Pattern triggert. Die übrigen Bücher gehen unverändert an
Hardcover und bleiben bei ihrem heutigen Hit/Miss-Status. Affected-Counts:

| Subset | n | affected | non-affected |
|---|---:|---:|---:|
| 150er-Subset (W40K-0001..0150) | 150 | **28** | 122 |
| Welle-4-Block (W40K-0151..0200) | 50 | **10** | 40 |
| 200er gesamt | 200 | **38** | 162 |

Die 38 zerfallen in 19 colon-only (nur Fallback-Varianten greifen),
9 omnibus-ohne-colon (nur generic-Omnibus-Cleanup), 10 omnibus-mit-colon
(specific-Omnibus-Cleanup, danach gibt's bei Bedarf noch Fallbacks). Im
085-Subset sind außerdem 4 Vol-Range-Treffer + 1 Part-Marker (alle in der
Gaunt's-Ghosts-Omnibus-Reihe W40K-0040..0045) sowie 2 `Vol.`/`Volume`-
Treffer (beide Uriel-Ventris-Chronicles W40K-0056/0057) — alle bereits in
den Omnibus-mit-colon-10 enthalten. **`(Legends)` taucht im 200er-Subset
0× auf**; die Cleanup-Regel ist defensiv für Welle-5+ im Set.

**150er-Subset (W40K-0001..0150, Brief-075-Vergleichsbasis):**

- 77 Hits / 14 `no_author` / 40 `null_result_zero_hits` / 19
  `author_mismatch` per 075-Closing.
- 14 `no_author` bleiben unbeeinflusst.
- Konversionen MAX bei 28 affected — davon einige bereits Hits in 075
  (W40K-0103 „Belisarius Cawl: The Great Work" rating=4.42 ist belegt im
  075-impl-Report; mehr Hit-Belege aus dem 075-Report nicht eindeutig pro
  affected-Buch ableitbar ohne separates Mining). Konservative Annahme:
  ~10–14 der 28 affected sind bereits Hits, damit 14–18 konvertierbare
  affected-Misses. Bei 50–70 % Conversion-Rate aus diesem Pool: **+7 bis
  +13 neue Hits**. Net 84–90 / 150 = **56–60 %**.
- Stretch-Pin **70–80 %** im 150er-Subset würde verlangen, dass entweder
  (a) der Anteil schon-Hits unter den 28 affected sehr niedrig ist (< 5),
  (b) Conversion-Rate über 90 % liegt, oder (c) Effekte ausserhalb des
  Affected-Constraints greifen (z. B. ein Hardcover-Backend-Update zwischen
  075 und 085 macht non-affected Roster-Titel plötzlich matchen) —
  unwahrscheinlich.

**Welle-4-Block (W40K-0151..0200, Brief-085-First-Pass):**

- Pre-085 ratet hier nichts (Welle-4-Block lief nie durch Brief 075). 50
  Bücher, davon 10 affected + 40 non-affected.
- Non-affected 40: gehen unverändert an Hardcover, erwartete Hit-Rate
  ähnlich 075-Subset (~51 %), also **~20 Hits**.
- Affected 10: bei 50–70 % Conversion-Rate **~5–7 Hits**.
- `no_author`-Schätzung über Welle-4 bei ~10 % der nicht-affected = ~4
  Misses bleiben fix.
- Net **~25–27 / 50 = 50–54 %** im Welle-4-Block.

**Summe konservativ:** 84–90 + 25–27 = **109–117 / 200 = 55–59 %**
(vs. 77/200 = 38.5 % pre-085, also +30 bis +40 Prozentpunkte).

**Stretch-Schätzung 70–80 %** (= Maintainer-Hoffnung):

- Würde verlangen 140–160 / 200 Hits Post-085, also +63 bis +83 zusätzliche
  Hits gegenüber 77 pre-085.
- Mit 38 affected Titeln über 200 (max möglicher Zuwachs aus dem Affected-
  Constraint) und einigen davon bereits Hits → bei optimistischen 90 %
  Conversion-Rate aus ~25 verbleibenden affected-Misses + bei ~50 %
  native-Hit-Rate aus den 40 non-affected Welle-4-Büchern: 77 + 23 + 20 =
  120 / 200 = **60 %**. Selbst optimistisch nur knapp über der konservativen
  Schätzung; 70–80 % nur bei ausserordentlichem Hardcover-Author-Filter-
  Glück.

**Reality-Check-Schwellen für den Closing-Report**:

- **Empirie ≥ 65 %** → Brief 085 hat überperformt, voll erfolgreich.
- **Empirie 55–65 %** → entspricht der konservativen Erwartung, planmäßiger
  Erfolg.
- **Empirie 45–55 %** → unter Erwartung, aber kein Bug — Closing-Report
  flaggt im Affected-Pool die Bücher, bei denen Conversion fehlschlug, mit
  Pattern-Hypothesen.
- **Empirie < 45 %** → strukturelles Problem (z. B. Cleanup ist zu
  aggressiv und regressiert Brief-075-Hits in Diff-B). Closing-Report
  trennt 150er-Subset von Welle-4-Block, weil unterschiedliche Diagnose-
  Schritte.

Falls die Empirie über 80 % landet → super, aber ggf. ist Cleanup zu
aggressiv und überschreibt existierende Hits mit anderem Hardcover-Match
(siehe Acceptance § Diff-Liste A).
