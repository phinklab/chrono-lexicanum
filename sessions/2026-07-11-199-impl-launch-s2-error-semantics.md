---
session: 2026-07-11-199
role: implementer
date: 2026-07-11
status: complete
slug: launch-s2-error-semantics
parent: docs/launch-master-plan.md § Session 2 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
commits: []
---

# Launch S2 — Fehlersemantik & Laufzeit-Caches

## Summary

Alle öffentlichen Loader folgen jetzt der data/null/throw-Konvention (Detail: Daten | null | throw; Index: Array | throw) — ein DB-Ausfall erzeugt eine Fehlerfläche und nie mehr 404/leeres Archiv; der db-cache-Doppelaufruf ist weg, Timeline/Entity/Podcasts sind cross-request gecacht und getaggt, beide Ask-Caches haben TTL + Rejection-Eviction, und `/api/revalidate` purgt jetzt wirklich sofort (`{ expire: 0 }` statt des fälschlich als hard-purge kommentierten SWR-Profils `"max"`). Drei neue DB-freie Suiten (44 Fälle) beweisen den Vertrag gegen Nexts **echtes** `unstable_cache` — der wichtigste Fund für Cowork: `"max"` war nachweislich SWR, der erste Request nach einem Release hätte den alten Stand serviert.

## What I did

**Vertrag + Caches (src):**

- `src/lib/db-cache.ts` — Vertrag im Header kanonisch dokumentiert; `cachedRead` auf `cache(unstable_cache(fn))` reduziert: der catch-Fallback, der `fn()` ein zweites Mal aufrief (2× DB-Last im Incident), ist entfernt; `isDegraded` komplett gestrichen (Prämisse „Loader degradieren still zu leer" gilt nicht mehr). Stale-good bleibt: `unstable_cache` serviert bei fehlschlagender Revalidation selbst den letzten guten Wert (in `next/dist/.../unstable-cache.js` verifiziert, Zeilen 176–205). `CATALOGUE_TAGS` + `entities`, `podcasts`, `timeline`.
- `src/lib/memory-cache.ts` (neu) — `memoryCachedRead`/`resetMemoryCaches`/`READ_CACHE_TTL` aus db-cache extrahiert, bewusst ohne `server-only` (Begründung s. Decisions); db-cache re-exportiert, bestehende Konsumenten unverändert. `isDegraded` auch hier raus; Rejection-Eviction + Seq-Guard bleiben.
- `src/lib/book/loadBook.ts` — äußeres try/catch→null entfernt: unbekannter Slug cached als stabiles `null` (404), DB-Fehler wirft.
- `src/lib/entity/loader.ts` / `loader-live.ts` — Fassade: Runtime-Pfad hinter per-id `cachedRead` (Tag `entities`, loadBook-Muster). Live-Modul: try/catch→null/[] aus `loadEntityLive`, `listEntityIdsLive`, `listHotEntityIdsLive` entfernt.
- `src/lib/chronicle/loadTimeline.ts` — try/catch→null raus (Rückgabetyp jetzt `ChronicleEraData[]`); Export hinter `cachedRead(["timeline"], { tags: ["timeline"] })` — die Headline-Route hatte 0 Cache und 2 Round-Trips pro Request.
- `src/app/timeline/page.tsx` — Empty-State nur noch für echte leere Spine (Copy angepasst); Ausfall geht in die Root-Error-Boundary.
- `src/app/archive/loader.ts` / `loader-live.ts` — `fetchBrowseBooksLive` wirft statt leerer Halle; `loadBrowseBooks` ohne `isDegraded`; `bookSlugById` bleibt dokumentiert außerhalb des Vertrags (s. Decisions).
- `src/app/archive/podcasts/loader.ts` / `loader-live.ts` — Index/Search werfen; Show: `null` nur für unbekannten Slug. Fassade: `loadPodcastIndex` (`["podcast-index"]`), `loadPodcastShow` (per-Slug), `loadPodcastSearchIndex` (`["podcast-search"]`) alle hinter `cachedRead` mit Tag `podcasts`.
- `src/app/fraktionen/loader.ts`, `src/lib/compendium/queries.ts` — try/catch→[] entfernt (3 Inventory-Queries + Faction-Guide); `src/lib/compendium/loader.ts` — 4× `isDegraded` raus, Kommentare auf den Vertrag.
- `src/lib/ask/recommend.ts` / `matrix.ts` — beide Ad-hoc-Promise-Slots (`cachedAskBooks`, `matrixPromise`) durch `memoryCachedRead` ersetzt: TTL (3600 s Default) + Rejection-Eviction + Fill-Koaleszenz aus einem Mechanismus; `clearAskRecommendationCache`/`clearAskMatrixCache` entfernt (einziger Konsument war die Route, `resetMemoryCaches()` deckt jetzt alle drei Memory-Caches).
- `src/app/api/revalidate/route.ts` — `revalidateTag(tag, { expire: 0 })`; falscher „hard-purge"-Kommentar ersetzt durch die Semantik-Entscheidung im Header; ENTITY_ROUTES-Pfad-Purge bleibt als dokumentierte Belt-and-braces-Schicht; clearAsk-Imports raus.
- `src/app/compendium/page.tsx`, `scripts/snapshot-shared.ts` — zwei stale Kommentare, die das alte Degrade-Verhalten als geltend beschrieben.

**Tests (scripts):**

- `scripts/test-helpers/next-runtime-stub.ts` (neu) — macht Nexts Servermodule unter tsx testbar: `AsyncLocalStorage`-Polyfill, `module.registerHooks`-Resolve von `server-only` auf Nexts gebündelte Leerdatei (das Paket ist nicht standalone installiert), Fake-`__incrementalCache` (der offizielle Fallback-Seam in `unstable_cache`).
- `scripts/test-db-cache.ts` (neu, 14 Fälle) — `cachedRead` gegen das **echte** `unstable_cache`: cold (1 Loader-Call, Tags persistiert), warm (0 Calls), Fail (wirft, exakt 1 Call — Regressionstest für den Doppelaufruf —, nichts gecacht, nächster Request retried), `null` als cachebarer Wert, stale-Recompute; `memoryCachedRead`: cold/warm, TTL, Eviction, Koaleszenz (auch im Fehlerfall: 1 Fill für alle gleichzeitigen Caller), Seq-Guard (späte Rejection evictet keinen neueren Fill), Reset-Hook; Tag-Drift-Guard für `CATALOGUE_TAGS`.
- `scripts/test-loader-error-contract.ts` (neu, 22 Fälle) — Zustands-Matrix DB-frei: Throw-Hälfte über beendeten Pool (`db.$client.end()` ⇒ jede Query rejectet sofort; s. Decisions) für alle 14 Loader-Pfade inkl. Fassaden; Daten/null-Hälfte über geseedete Data-Cache-Einträge (cached `null` ⇒ Absenz/notFound, Payload kommt intakt zurück, cached `[]` ist legitim leer).
- `scripts/test-revalidate-route.ts` (neu, 8 Fälle) — echter Handler-Aufruf mit abgefangenem `next/cache`: 503 ohne Token, 401 bei falschem, Default purgt alle Tags mit exakt `{ expire: 0 }` (ein Rückfall auf `"max"` schlägt fehl), Pfad-Purge der vier Entity-Routen, Scoped-Body, 400 bei unbekannten/non-string Tags, Memory-Cache-Reset.

## Decisions I made

- **Invalidierung: `{ expire: 0 }` (sofortige Expiration), nicht SWR** — wie in der Spec empfohlen. In `next@16.2.10` verifiziert: `revalidateTag(tag, profile)` akzeptiert `CacheLifeConfig`, und `expire === 0` nimmt den Sofort-Pfad (`revalidate.js:209`). Begründung im Route-Header festgehalten: Content-Releases sind selten und korrektheitsgetrieben; ein Cold-Fill pro Tag ist der richtige Preis.
- **`memoryCachedRead` in eigenes Modul ohne `server-only` extrahiert** statt es in db-cache zu lassen: `recommend.ts`/`matrix.ts` werden von den manuellen tsx-Skripten (`test-ask-recommend`, `audit-ask-combinations`) geladen, wo `server-only` nicht einmal *resolvet* (nur Nexts Build aliast es). db-cache re-exportiert alles — Server-Code behält eine Import-Heimat, kein Konsument musste angefasst werden.
- **Beide Ask-Caches = `memoryCachedRead`** statt die Eviction für `cachedAskBooks` nachzubauen — Wiederverwendung statt drittem Mechanismus; TTL kommt als Default mit. Die `clearAsk*`-Exports habe ich entfernt statt sie auf den Reset-Hook zu delegieren: einziger Aufrufer war die Route, die `resetMemoryCaches()` ohnehin ruft.
- **`isDegraded` ersatzlos gestrichen** (beide Cache-Schichten): Die Option existierte nur, weil Loader Fehler in Leere schluckten. Nach dem Vertrag ist leer wieder eindeutig „legitim leer" und Fehler werfen — eine leere-heißt-kaputt-Heuristik wäre jetzt falsch.
- **`bookSlugById` bleibt bewusst außerhalb des Vertrags** (degrade→null, im Docstring begründet): Der `?focus=`-Input ist client-kontrolliert (malformed UUID = Postgres-Fehler, kein Ausfall), und eine gescheiterte Deep-Link-Nettigkeit darf einen gesunden Archive-Render nicht abreißen. Bei echtem Ausfall wirft ohnehin vorher `loadUnifiedSearchIndex`.
- **`recommend()`s `onError`-API unangetastet** — Ask ist nicht Teil der Loader-Liste der Spec; die /ask-Seite besitzt ihre eigene Fehlerfläche (page-level try/catch), Produktionspfade nutzen bereits `onError: "throw"`.
- **`loadPodcastSearchIndex` mitgecacht + getaggt**, obwohl die Spec nur „Podcast-Index/-Shows" nennt: `/archive` ist searchParams-dynamisch und komponiert die Projektion in **jeden** Request — ohne Cross-Request-Schicht wären das 2 Queries pro Besucher; sie gehört sachlich zur Index-Fläche (Tag `podcasts`).
- **ENTITY_ROUTES-Pfad-Purge behalten** (Belt-and-braces, Kommentar sagt jetzt warum + Abbau-Kriterium): `loadEntity` trägt zwar neu den `entities`-Tag, aber Seiten, die vor diesem Deploy gerendert wurden, kennen ihn nicht. Abbau nach Live-Beleg der Tag-Propagation (S3a/Launch-Readiness).
- **Throw-Hälfte der Loader-Tests über `db.$client.end()`** statt echter TCP-Ablehnung: sequenzielle refused-Connects eskalieren durch postgres.js-Reconnect-Backoff von 6 ms auf >10 s pro Call (gemessen; die naive Suite brauchte 85 s, Port 9 ist unter der Windows-Firewall zusätzlich gefiltert ⇒ ~5 s SYN-Timeout). Nach Pool-Ende rejectet jede Query sofort mit `CONNECTION_ENDED` — die Loader sind gegenüber der Infra-Fehler-Sorte agnostisch; der Vertrag verlangt Propagation, und genau die wird geprüft. Suite: 0,4 s statt 85 s.
- **Testplatzierung `scripts/test-*.ts`:** formal Batches-Pfad (E7), aber `npm test` (PR-Gate, von der Spec verlangt) discovert ausschließlich dort, und die Tests gehören in den PR, dessen Code sie gaten — Präzedenz S1a. Explizit als Pfad-Anmerkung für Cowork notiert.
- **Timeline-Empty-State-Copy geändert** („The chronicle holds no entries yet …"): die alte Zeile behauptete „archive is unreachable" — dieser Zustand läuft jetzt in die Error-Boundary; die verbleibende Bedingung ist eine ungeseedete Spine.

## Verification

Alle vier PR-Gates lokal grün:

- `npm test` — **35 Suiten grün in 6,1 s** (32 Bestand + 3 neue mit 14 + 22 + 8 Fällen). Kein Bestandstest musste angefasst werden.
- `npx tsc --noEmit` — grün.
- `npm run lint` — grün.
- `npm run build` — grün (Prerender aus Snapshot unverändert; /timeline bleibt ƒ dynamic, Entity-Routen ● SSG).

Abnahme-Kriterien der Spec → Beleg:

- *DB-Ausfall nie 404/leeres Archiv* → `test-loader-error-contract` (14 Throw-Fälle über alle Loader-Pfade inkl. Fassaden; cached `null`/`[]` als kontrastierende Absenz-/Leer-Fälle).
- *Fehlgeschlagene Quelle genau 1× pro Request* → `test-db-cache` „failing fill … loader called EXACTLY once" (der Alt-Code ist im Verlauf mit 2 Calls belegt).
- *Rejected Promises vergiften keine Folge-Requests* → Eviction-/Retry-/Koaleszenz-/Seq-Guard-Fälle beider Schichten.
- *Query-Zähler cold/warm* → Zähler-Asserts in `test-db-cache` (cold 1, warm 0, Tags registriert).
- *Invalidierungs-Semantik benannt + getestet* → Route-Header (Entscheidung) + `test-revalidate-route` (exaktes Profil-Argument).

Nicht verifiziert (ehrlich): das Seiten-Level-Verhalten im echten Prod-Build (Error-Boundary-Fläche bei totem Postgres) — das ist per Spec der **Degradations-Smoke aus S8**; und der Live-null-Pfad „unbekannter Slug gegen erreichbare DB" braucht naturgemäß eine DB (bleibt bei den manuellen DB-gated Flows). Kein Browser-/UI-Check nötig — sichtbares Verhalten ändert nur der Timeline-Empty-State-Text.

## Open issues / blockers

Keine Blocker.

## For next session

- **S3a (Release-Revalidation-Befehl):** Der Default-POST purgt jetzt auch `entities`/`podcasts`/`timeline` — der fail-loud Befehl aus S3a sollte den Default (alle Tags) nutzen, nichts Neues nötig. Nach dem ersten Live-Release einmal Tag-Propagation auf Entity-Seiten belegen, dann kann der ENTITY_ROUTES-Pfad-Purge raus (Kommentar in der Route nennt das Kriterium).
- **S8 Degradations-Smoke** prüft den hier eingeführten Vertrag im echten Prod-Build (Kernrouten antworten mit Fehlerfläche, nie 404/leer) — die Loader-Seite ist ab jetzt testfixiert.
- **Rollup (Koordination):** Vertrag ist in `src/lib/db-cache.ts` kanonisch dokumentiert; falls eine Brain-Notiz gewünscht ist, gehört sie in den Koordinations-PR, nicht hierher.
- Beobachtung am Rande: `listEntityIds` (S5-Sitemap-Reserve) wirft jetzt ebenfalls — für die Sitemap aus dem Snapshot (S5-Plan) irrelevant, aber falls S5 doch live liest, ist das Verhalten jetzt fail-loud statt still-leer.

## References

- `node_modules/next/dist/server/web/spec-extension/unstable-cache.js` (16.2.10) — Fill-/Stale-/Fehlerpfade + `globalThis.__incrementalCache`-Seam.
- `node_modules/next/dist/server/web/spec-extension/revalidate.js` (16.2.10) — `revalidateTag`-Profil-Semantik, `expire === 0`-Sofortpfad.
- Next-16-Doku zu `revalidateTag`-Profilen (SWR vs. `{ expire: 0 }`) — deckungsgleich mit dem installierten Code verifiziert.
