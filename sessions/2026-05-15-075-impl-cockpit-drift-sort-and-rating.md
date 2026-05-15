---
session: 2026-05-15-075
role: implementer
date: 2026-05-15
status: complete
slug: cockpit-drift-sort-and-rating
parent: 2026-05-15-075-arch-cockpit-drift-sort-and-rating
links:
  - 2026-05-15-074-impl-resolver-batch-3
  - 2026-05-14-073-arch-maintainer-audit-cockpit
  - 2026-05-11-061-arch-ssot-loop
commits:
  - 61d4ff5
  - e0c7575
  - 7f3f14f
---

# Cockpit-Refinement (Drift-Sort + DetailPanel) und OQ6 Hardcover-Rating-Promotion — Impl-Report

## Summary

Beide Tracks gelandet. Track A (drift-frequency sort + slim „Auch enthalten in:"-Panel) ist mit `npm run lint`/`typecheck` grün und smoke-verifiziert via SQL-Replica der neuen Sortier-Logik. Track B (Standalone-Backfill-Script) hat einen vollen Lauf gegen die prod-DB durchgezogen und 77 von 150 W40K-SSOT-Büchern mit Hardcover-Rating + `users_count` befüllt — **Hit-Rate 51.3 %**, also unter dem 70 %-Schwellenwert, daher For-next-session-Empfehlung „OQ Hardcover-OL-Fallback öffnen" (siehe unten).

## What I did

### Track A — Cockpit-Refinement (`e0c7575`)

- `src/app/buecher/page.tsx` — `CatalogueAudit.driftCount: number` ergänzt; `countResolvedDrift()` parallel zum bestehenden `hasResolvedDrift()`-Helper definiert; Compute-Stelle (alte Z. 262–265) berechnet `driftCount` in der gleichen Schleife wie `hasDrift`, kein zweiter DB-Read. `sortBooks()` erweitert um `auditFilters`-Parameter — wenn `'drift'` aktiv ist, sortiert es per `(driftCount desc, Number(confidence) desc, updatedAt desc, externalBookId asc)`, sonst fällt es auf die alte `updated`/`title`-Logik zurück. Mikro-Caption „Sortiert nach Drift-Frequenz · Confidence · zuletzt aktualisiert." rendert server-seitig nur bei `auditFilters.includes('drift') && sorted.length > 0`.
- `src/app/buecher/SortPills.tsx` — neue optionale Prop `overriddenByDrift?: boolean`. Wenn `true`, springt das `<span class="sort-pills-label">`-Label von `Sortieren` auf `Sortieren (Audit überschreibt)`. Pills bleiben klickbar — der `?sort=`-Param persistiert die User-Präferenz für nach dem Drift-Filter.
- `src/app/buch/[slug]/page.tsx` — neue Drizzle-Query in `loadBookBySlug` (siebte parallele Promise im bestehenden `Promise.all`), zieht `containedIn`-Rows aus `work_collections` JOIN `works` (`displayOrder asc, title asc`). Render: slim Komma-Zeile direkt unter dem Meta-Strip, `font-mono text-xs text-frost-400`, jeder Collection-Titel ist `<Link href={\`/buch/${collectionSlug}\`}>`. Nur Public-Lean-Form (kein `displayOrder`/`confidence`/`basis` sichtbar — Audit-Surface bleibt unangefasst).
- `src/app/globals.css` — neue `.catalogue-sort-caption`-Klasse, `font-mono text-xs text-ink-3 letter-spacing-0.02em margin: -6px 0 14px`. Visuell eine Stufe leiser als `.audit-pills-label`.
- `scripts/smoke-drift-sort-075.ts` — SQL-Replica der neuen `sortBooks`-Drift-Branch (CTE über `work_factions` / `work_locations` / `work_characters` für `drift_count` + `confidence::numeric DESC` + `updated_at DESC` + `external_book_id ASC`). Liefert für den Smoke-Spot-Check die Top-N-Bücher in der erwarteten Reihenfolge.

### Track B — Hardcover-Rating-Backfill (`7f3f14f`)

- `scripts/backfill-hardcover-rating.ts` — neues Standalone-Skript, `parseArgs` strict mit `--force` / `--limit` / `--help`. Init prüft `isHardcoverEnabled()` und exit(1) wenn Token fehlt. Estimated-Runtime-Banner kalkuliert via Politeness-Delay × N.
   - Query-Phase: zwei Drizzle-Reads. (1) `works LEFT JOIN bookDetails` mit konditionalem WHERE — Default `and(eq(sourceKind,'ssot'), like(externalBookId,'W40K-%'), eq(kind,'book'), isNull(rating))`, `--force` droppt den `isNull`-Teil. Order: `externalBookId asc`. (2) `workPersons INNER JOIN persons WHERE role='author' AND workId IN (target-ids)`. JS-seitig: `Map<workId, primaryAuthorName>` mit niedrigstem `displayOrder`.
   - Iteration: pro Buch primaryAuthor aus Map; wenn `undefined` → Bucket `no_author`, kein API-Call (Brief Erratum 3). Sonst `discoverHardcoverClaimV2(title, primaryAuthor, { ratingsCountField })`. Result-Mapping: `null_result_zero_hits` (Hardcover 0 hits), `null_result_after_filter` (Treffer existieren, kein Author-Match → vorgeschoben durch `authorMismatch=true`-Pfad als `author_mismatch`), `graphql_error` (HTTP/GraphQL), `token_missing` (Token fehlt — eigentlich nicht erreichbar, weil Init schon hard-exited).
   - Circuit-Breaker-Check via `getCircuitBreakerReason()` nach jedem Fail: trippt → loud-exit(1), damit die restlichen Bücher nicht still als `graphql_error` durchrutschen.
   - Write-Phase: `db.insert(bookDetails).values({...}).onConflictDoUpdate({target: workId, set: {...}})` (existierende `bookDetails`-Pattern aus `apply-override.ts`). `rating: clampRating(value).toFixed(2)` — defensiv 0..9.99 + 2-Dezimal-Form für die `numeric(3,2)`-Spalte. `ratingCount` nur überschrieben wenn die Probe einen Zahlenwert lieferte; sonst `sql\`${bookDetails.ratingCount}\`` (preserve), damit ein evtl. zuvor gesetzter Count nicht versehentlich genullt wird.
   - `ratingsCount`-Probe: erste Call mit `ratingsCountField: 'users_count'`. Wenn Hardcover-Schema ablehnt (Detection via `isUnknownFieldError(message, fieldName)` — sucht nach `not defined` / `not found` / `unknown` / `unsupported` / `cannot query field` / `does not exist`), fällt auf `'ratings_count'` zurück. Beide gescheitert → `ratingsCountField=null` und weiter ohne Count. Probe „settles" nach der ersten erfolgreichen Antwort, danach kein weiteres Probing.
   - Progress-Log per Buch (Hit / MISS / SKIP), Final-Summary mit Bucket-Counts + Hit-Rate + ratingCount-Write-Quote + ggf. OL-Fallback-Empfehlung.
- `src/lib/ingestion/v2/sources/hardcover.ts` — `discoverHardcoverClaimV2` bekommt einen dritten optionalen Parameter `opts: HardcoverDiscoveryV2Options = {}`. Neue Helper `buildSearchQuery(extraField: HardcoverRatingsCountField | null)` baut die `SEARCH_QUERY` dynamisch. Wenn `opts.ratingsCountField` gesetzt ist, fragt das Query Hardcover nach dem Feld, parst es zu `claim.raw.audit.ratingCount` (nur wenn `typeof === 'number'`). Default-Pfad (kein opts) baut die alte `SEARCH_QUERY`-Form — bestehende V2-Aufrufer (`run-engine.ts` etc.) sehen keinen Verhaltensänderung. `HardcoverBookHit`-Interface trägt jetzt optionale `users_count` / `ratings_count` Felder. `HardcoverRatingsCountField` Typ-Export für externe Aufrufer.
- `package.json` — neuer Script-Eintrag `"backfill:hardcover-rating": "tsx --env-file=.env.local scripts/backfill-hardcover-rating.ts"` (Wortlaut exakt wie Brief Erratum 1).

## Decisions I made

- **Drift-Sort-Affordance: Mikro-Caption + SortPills-Label-Patch (Option C aus Plan).** SortPills bleibt klickbar; die Bezeichnung wechselt nur. Honester als `aria-disabled` und ohne SortPills-Disabled-Prop, der die User-Präferenz visuell „kaputt" aussehen lässt. Caption macht den Sort-Modus explizit lesbar.
- **DetailPanel: slim Komma-Zeile im Meta-Strip (Option D aus Plan, vom Maintainer bestätigt).** `containedIn` ist eine bibliographische Relation, kein Entity-Slot. Eine Zeile direkt unter Jahr/Format/Era/Series fühlt sich strukturell richtig an; bordered Pills wären über-promoted.
- **Tie-Breaker `externalBookId asc` als 4. Sort-Key.** Plan-Agent flaggte richtig: Re-Apply-Cluster derselben Override-Batch haben fast identische `updatedAt`-Werte, ohne 4. Key wäre die Reihenfolge bei freq+conf+ts-Ties undeterministisch. `localeCompare` über `externalBookId` ist deterministisch und natürlich aufsteigend (W40K-0001 vor W40K-0150).
- **`Number(audit.confidence ?? "0")` Cast im Sort-Comparator.** Drizzle liefert `numeric`-Spalten als `string`; lexikografische Subtraktion wäre ein subtiler Bug. Vorwärts immer numerischer Vergleich.
- **`users_count` probiert vor `ratings_count`.** Hardcover-Hasura-Konvention legt `_count`-Suffix nahe; `users_count` ist semantisch näher an „logging-base" (was wir auch in einem Goodreads-Refugee-Kontext erwarten würden). Probe-Resultat: `users_count` ist supported — alle 77 Hits haben einen Count geschrieben. `ratings_count` als Fallback nie ausgelöst. Reihenfolge im Konstanten-Array dokumentiert die Vorlieben-Logik.
- **`onConflictDoUpdate` statt blankem `update`.** Im prod-Datensatz hat jedes applied SSOT-Buch bereits eine `bookDetails`-Zeile (geschrieben von `apply-override.ts`), aber das Insert-Pattern ist robuster und matched die bestehende Code-Konvention. `ratingCount`-Spalte: bei Probe-Erfolg überschreiben, sonst `sql\`${bookDetails.ratingCount}\`` (preserve), damit zukünftige Re-Runs ohne Probe-Erfolg keinen evtl. zuvor geschriebenen Count nullen.
- **Smoke-Skript `scripts/smoke-drift-sort-075.ts` committed.** Folgt der Disziplin von Brief 074, der `scripts/audit-cockpit-replica-074.ts` als persistente Smoke-Quelle committed hat. Macht den Track-A-Smoke-Spot-Check für Cowork reproduzierbar.
- **Kein neuer NPM-Dep.** Track A nutzt nur bestehende Drizzle/Next/React-Imports; Track B nutzt nur `drizzle-orm` + `node:util` + bestehende Hardcover-Library.
- **Track A und Track B in eigenen Commits, mit dem Brief-Arch als drittem Commit davor.** Pro Brief-Vorgabe „beide Tracks landen ggf. in eigenen Commits". Track A kann ohne Track B mergen — Sicherheitsventil eingehalten (auch wenn Track B nicht abbrechen musste).

## Verification

### Track A

- `npm run typecheck` — **pass** (0 errors).
- `npm run lint` — **pass** (1 pre-existing warning in `src/app/layout.tsx` zu `no-page-custom-font`, nicht von 075 introduziert).
- **Smoke-Spot-Check via `scripts/smoke-drift-sort-075.ts --limit=20`:**

```
=== /buecher?audit=drift sort smoke (top 20) ===
rank  external    drift  conf  f/l/c     updated     title
   1  W40K-0134       2  1.00  6/1/2     2026-05-15  Genefather
   2  W40K-0130       2  1.00  6/3/1     2026-05-15  The Lion: Sons of the Forest
   3  W40K-0129       2  1.00  6/2/0     2026-05-15  Pilgrims of Fire
   …
  19  W40K-0012       2  1.00  6/0/5     2026-05-15  For the Emperor
  20  W40K-0150       1  1.00  14/2/4    2026-05-15  Chaos Child
```

  - **Rang 1–19**: alle `drift_count=2`, `confidence=1.00`, gleicher Datums-String — innerhalb dieser Tie-Group greift `updated_at DESC` (sub-Tages-Präzision), und die Reihenfolge folgt der Re-Apply-Wave (`W40K-0134` zuletzt geschrieben, `W40K-0012` früher). Das ist deterministisch und mit der „freq≥2-zuerst"-Triage-Intuition konsistent.
  - **Rang 20**: erstes `drift_count=1`-Buch (`W40K-0150 Chaos Child`) — Drop unter die freq=2-Gruppe, wie erwartet. Demonstriert, dass die Primärschlüssel-Sortierung greift.
  - **Browser-Verifikation:** `npm run dev` startete unter Windows-PowerShell mit verzögertem stdout-Buffering und ließ sich im Tool-Sandbox nicht zuverlässig beobachten — typecheck + lint + SQL-Replica decken die SSR-Pfade ab; die Renderlogik ist Server-Component mit `auditFilters` aus dem URL-Param und kein Client-State.

### Track B

- `npm run typecheck` — **pass**.
- `npm run lint` — **pass**.
- **Live-Smoke `npm run backfill:hardcover-rating -- --limit=5`** (idempotent default, 5 Bücher):
  - 3 Hits (Xenos 3.94/304, Malleus 4.01/171, Hereticus 4.15/148), 1 author_mismatch (Eisenhorn Omnibus), 1 null_result_zero_hits (Ravenor — Titel-`_eq`-Mismatch).
  - `users_count`-Probe ohne Fehler erkannt → kein Fallback nötig.
- **Voller Lauf `npm run backfill:hardcover-rating`** (147 verbleibende Bücher, idempotent):
  - 73 Hits / 74 Misses → 49.7 % Hit-Rate dieses Laufs.
  - `users_count` für alle 73 Hits geschrieben.
  - 5 `graphql_error` in der Folge W40K-0075..0079 (konsekutiv, fast sicher ein transienter Hardcover-API-Hiccup).
- **Zweiter idempotenter Pass** (74 verbleibende Misses): 1 zusätzlicher Hit, 4 der 5 `graphql_error`-Bücher konvertierten zu `author_mismatch`/`null_result_zero_hits` (korrekte Hardcover-Antwort), 1 echter Hit. Bestätigt: `graphql_error` waren transient, der Idempotenz-Default ist korrekt.
- **`--force` Smoke** (`--limit=1` auf W40K-0001 Xenos, dessen rating bereits geschrieben war):
  - Erster Versuch: transienter `graphql_error`.
  - Zweiter Versuch: Hit, rating=3.94 / count=304 unverändert geschrieben. **Overwrite verifiziert.**
- **DB-Spot-Check** via ad-hoc Query auf `bookDetails`:
  ```
  total books with rating: 77
  W40K-0001  rating=3.94  source=hardcover  count=304  "Xenos"
  W40K-0103  rating=4.42  source=hardcover  count=45   "Belisarius Cawl: The Great Work"
  W40K-0134  rating=4.50  source=hardcover  count=13   "Genefather"
  W40K-0150  rating=3.50  source=hardcover  count=4    "Chaos Child"
  ```
  Sample-Werte plausibel (3.5–4.5 Range mit Counts 4–304).

### Endstand `book_details.rating` post-075-impl

- **77 / 150 W40K-SSOT-Bücher** mit `rating` befüllt (51.3 % Coverage).
- 73 Bücher bleiben `NULL`:
  - **14 `no_author`** — kein API-Call (Brief Erratum 3); Maintainer-Excel-Workflow needed.
  - **40 `null_result_zero_hits`** — Hardcover findet kein Buch mit dem exakten Titel (`_eq`-Match-Limit).
  - **19 `author_mismatch`** — Hardcover hat den Titel, aber der Author-Match scheitert (anderes Edition-Metadata oder anderer Author).

## Counts-Tabelle (Track B)

| Bucket | Count | Anteil | Anmerkung |
|---|---:|---:|---|
| **Hits** | 77 | 51.3 % | rating + ratingSource=hardcover + ratingCount geschrieben |
| `no_author` | 14 | 9.3 % | Anthologie/Editor-only books — kein API-Call (Erratum 3) |
| `null_result_zero_hits` | 40 | 26.7 % | Hardcover `_eq` exakt-Match scheitert → Titel-Normalisierungs-Lücke |
| `author_mismatch` | 19 | 12.7 % | Hardcover hat Treffer, aber Author-Match scheitert |
| `null_result_after_filter` | 0 | 0 % | (separater Bucket, hier nie ausgelöst) |
| `graphql_error` | 0 | 0 % | (5 in Pass 1 transient, alle in Pass 2 aufgelöst) |
| `token_missing` | 0 | 0 % | – |
| **Gesamt** | 150 | 100 % | W40K-SSOT-Scope |

## Open issues / blockers

Keine. Beide Tracks komplett, alle Acceptance-Bullets erfüllt.

## For next session

1. **`OQ` Hardcover-OL-Fallback öffnen** (Promote-Trigger eingetreten: 51.3 % < 70 %). Aber: die meisten Misses sind Titel-Normalisierungs-Probleme, nicht Coverage-Lücken. Ein OL-Fallback würde dasselbe Coverage-Problem-Profil haben (OL hat auch `_eq`/Slug-Matching, plus dünne 40K-Rating-Statistik). **Bessere alternative Folge-OQ:** Titel-Normalisierungs-Layer („Hardcover-Hit-Rate-Härtung" — versuche Titel-Varianten bei `null_result_zero_hits`: ohne Subtitle nach Doppelpunkt, ohne „Omnibus"-Suffix, ohne `,/-/series-number`, etc.). Cowork-Wahl.
2. **`no_author`-Audit** der 14 Bücher: 5 sind die bekannten data_conflicts aus 074-impl-Report (Voidscarred / Tomb World / Vagabond Squadron / Death Rider / Green Tide); 3 sind die Sabbat-Anthologien (Worlds/Crusade/War — Dan Abnett als Editor); 5 sind weitere editor-only Anthologien (Above and Beyond / Elemental Council / Interceptor City / Hell's Last / Fulgrim: The Perfect Son); **1 Sonderfall: `W40K-0144 Archmagos`** — sollte eigentlich Justin D Hill (Single-Author) sein, aber `work_persons` hat keine `role='author'`-Row. Vermutlich Roster-Pflege-Lücke; Maintainer-Excel-Workflow.
3. **Drift-Sort-Tie-Distribution.** 19 von 20 Top-Drift-Büchern sind `drift_count=2` mit gleicher Confidence — die freq≥2-Hauptgruppe ist tatsächlich „flat", und der Tie-Breaker `updated_at DESC` rangiert sie nach Re-Apply-Reihenfolge. Konsequenz für Maintainer-Triage: die ersten ~19 Bücher sind eigentlich gleichrangig; der ursprüngliche Cockpit-Feedback-Punkt aus 074-impl („freq=1 vs freq≥2 sichtbar machen") ist erfüllt, aber innerhalb freq=2 fehlt noch eine Sub-Sortierung (z. B. nach den höchsten Junction-Counts, oder per `(faction-drift, location-drift, character-drift)`-Triple). Folge-Brief-Material, nicht 075.
4. **DetailPanel-Pattern-Erweiterung.** Die slim-Komma-Zeile pattern lässt sich auch auf `seriesName` (`#index` + Series-Link) oder eine `containsCount`-Linie (für Collection-Bücher: „enthält 13 Bücher" mit Toggle) anwenden. Falls Cowork das Public-Lean-Surface schrittweise reicher macht, ist das eine konsistente Voice.
5. **Hardcover `users_count` ist deterministisch erreichbar** — das schließt einen Architektur-Punkt aus OQ6 sauber. Falls die V2-LLM-Stage je reaktiviert wird, kann sie über den Brief-058-Pfad denselben `discoverHardcoverClaimV2(title, author, { ratingsCountField: 'users_count' })`-Call benutzen, ohne weitere Schema-Recherche.
6. **Brain-Hygiene-Post-Merge.** Cowork prunt OQ6-Anker in `open-questions.md` (strikethrough → entfernen), updated `project-state.md` „Recently shipped" + Junction-Coverage-Zeile auf „150 W40K-Bücher applied + 77 mit Hardcover-Rating", ggf. ADR-Stub `decisions/why-no-ol-fallback-yet.md` als Story-Anker zur OL-Frage. Standard-Session-End-Pass.

## References

- Brief: [`sessions/2026-05-15-075-arch-cockpit-drift-sort-and-rating.md`](./2026-05-15-075-arch-cockpit-drift-sort-and-rating.md).
- Plan-Datei: `~/.claude/plans/wir-machen-eine-session-zippy-pudding.md` (lokal, nicht checked-in).
- Pattern-Vorbild für Track B: `scripts/apply-override.ts` (parseArgs strict + Drizzle update + onConflictDoUpdate).
- Pattern-Vorbild für Track-A-Smoke-Skript: `scripts/audit-cockpit-replica-074.ts`.
- `src/lib/ingestion/hardcover/parse.ts` Z. 14–21: bestätigt `_eq`-only Restriktion des Hardcover-GraphQL-Schemas (Plan-Agent-Push-back, der die Hit-Rate-Erwartung kalibriert hat).
