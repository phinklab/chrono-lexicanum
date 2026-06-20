---
session: 2026-06-19-161
role: architect
date: 2026-06-19
status: open
slug: entity-isr-hot-subset
parent: null
links: []
commits: []
---

# Entity-Detailseiten — heiße Teilmenge prerendern, Rest on-demand ISR (Build-Egress senken)

## Goal

Die vier Entity-Routen (`charakter` / `welt` / `fraktion` / `person`) sollen beim Build nur noch eine kleine, kuratierte **heiße Teilmenge** vorrendern statt aller ~1300 Slugs; der Rest rendert on-demand via ISR. Damit fällt der Build von ~20 min auf Minuten, und der Build-Egress (US-Build ↔ eu-central-DB) kollabiert, der gerade das Supabase-Free-Limit (5 GB) reißt und das Projekt drosselt.

Product-Strang, Code → Branch + PR. **Erst Worktree / Strang / Branch in einem Satz ansagen, dann editieren** (CLAUDE.md § Parallel worktrees).

## Context

- Stand heute (verifiziert 2026-06-19): jede der vier Routen hat `export const dynamicParams = true` und ein `generateStaticParams`, das via `listEntityIds(type)` **alle** IDs zurückgibt → Build prerendert ~1300 Seiten, 20-min-Builds, einzelne 300s-Timeouts, und jeder dieser Prerenders zieht beim US-Build Daten aus der eu-central-DB → der Build-Egress allein reißt das 5-GB-Limit.
- `/buch/[slug]` macht es schon richtig (bewusst **kein** `generateStaticParams`, voll dynamisch, Runtime-Perf über per-slug `cachedRead` in `loadBook`) — **nicht anfassen** (Out of scope).
- `listEntityIds` ist bereits lean (ein ID-only-`select` pro Typ). `loadEntity` (+ die per-Typ-Loader) ist dagegen **nur** in React `cache()` (Request-Memo) gewickelt und liest roh aus der DB — es geht **nicht** durch `cachedRead` und trägt **keine** `CATALOGUE_TAGS`. Das ist der Kern von Constraint 3 unten.
- `cacheComponents` ist AUS und bleibt AUS: laut `src/lib/db-cache.ts`-Kommentar würde der Flag „jedes `export const revalidate` löschen, auf das wir uns verlassen" und ein leeres/kleines `generateStaticParams` zum Build-Error machen. Kein `'use cache'`-Umbau.
- `POST /api/revalidate` invalidiert heute per `revalidateTag(tag,"max")` über `CATALOGUE_TAGS` + leert In-Process-Memory-Caches. Es ruft **kein** `revalidatePath`.

Vorarbeit: Entity-Seam Brief 109; Cache-Schicht Report 144 (§ P.1/P.4/P.6).

Kein `## Design freedom`-Abschnitt: dieser Brief ändert **keine Optik**. Eine on-demand gerenderte Seite muss pixelgleich zur prerenderten sein (Constraint 2) — es gibt nichts ästhetisch zu entscheiden, also nichts zu übergeben.

## Constraints

1. **`generateStaticParams` gibt nur noch die heiße Teilmenge zurück und bleibt lean.** Eine kleine, wartbare, begründete Auswahl der Marquee-Seiten (z. B. Primarchen, große Fraktionen, Terra/Mars/Luna, ggf. meistverlinkte Entities) — **keine** hartcodierte Liste von hunderten Slugs. Mechanik ist CC-Entscheidung (kuratierte Konstante/JSON, oder ein billiger „top N"-ID-Query); im Report begründen. **Der Build-Pfad bleibt schlank:** `generateStaticParams` macht **nur** ID-Level-Arbeit — **kein** `loadEntity()`-Fanout, keine Compendium-Builder, nichts, was die heiße Teilmenge wieder zu vollen Entity-Reads im Build aufbläht. Sonst kehrt der Egress durch die Hintertür zurück.
2. **`dynamicParams = true` bleibt** (ist schon gesetzt). Eine on-demand gerenderte Seite muss **identisch** aussehen und funktionieren wie eine prerenderte — gleiches Markup, gleiche Metadata, gleiches `notFound()`/Redirect-Verhalten (inkl. `absorbedInto`-Redirect in `charakter`).
3. **Explizites langes `export const revalidate = <zahl>` auf jeder der vier Routen.** Das „ISR-Safety-Net" muss explizit im Code stehen, nicht implizit. Lang (Größenordnung Stunden–Tag, konsistent mit der `READ_CACHE_TTL`-Philosophie „stale-by-up-to-eine-Weile ist okay, echte Frische kommt vom Invalidate"); die exakte Zahl wählt CC.
4. **Post-Ingestion-Invalidierung muss die jetzt-ISR-Seiten wirklich flushen.** Outcome: nachdem ein Ingestion-/Apply-Lauf `POST /api/revalidate` triggert, serviert eine *bereits on-demand gerenderte* Entity-Seite beim nächsten Request frische Daten — nicht erst nach Ablauf des langen `revalidate`. Weil `loadEntity` keine `CATALOGUE_TAGS` trägt, leistet `revalidateTag` das heute **nicht**. **Bevorzugter, direkter Weg:** `/api/revalidate` zusätzlich `revalidatePath('/charakter/[slug]','page')` + die drei Geschwister-Patterns (`/welt`, `/fraktion`, `/person`) ausführen lassen. (Alternative wäre, `loadEntity` durch getaggten `cachedRead` zu ziehen — aber das ist ein Loader-Refactor, den dieser Brief vermeiden will; nimm den `revalidatePath`-Weg, es sei denn, du begründest im Report einen besseren.)
5. **Loader-Caching nicht verschlechtern, `cacheComponents` AUS lassen, keine kurzen TTLs nachrüsten.** `loadEntity` darf konsolidiert werden, wenn es pro Seite mehrfach dieselben Daten zieht — Pflicht ist es nicht.

## Out of scope

- `/buch/[slug]` — macht es schon richtig, nicht anfassen.
- Das Such→Compendium-Navigationsmodell.
- `loadEntity`/Loader über das in Constraint 4/5 Nötige hinaus refactoren.
- `cacheComponents` / `'use cache'` einführen.
- Security/Migrations (separater Prompt).
- Carry-over OQ 16b/c (`primaryEraId`-Placeholder + Atlas-Events) und OQ 18 (`db:apply` Plan/Diff) — bewusst **verschoben**, gehören nicht zu diesem Perf-Brief.

## Acceptance

The session is done when:

- [ ] `generateStaticParams` der vier Routen liefert nur die heiße Teilmenge; die Auswahl-Mechanik ist im Report begründet und der Build-Pfad zieht **keine** vollen Entity-Reads (Constraint 1).
- [ ] Jede der vier Routen hat ein explizites langes `export const revalidate` (Constraint 3).
- [ ] `dynamicParams = true` bleibt; ein on-demand gerenderter Slug rendert identisch zur prerenderten Variante (Constraint 2) — im Report kurz bestätigt (z. B. ein nicht-heißer Slug lokal aufgerufen).
- [ ] Post-Ingestion-Invalidierung flusht die ISR-Entity-Seiten (Constraint 4); im Report steht, über welchen Mechanismus (`revalidatePath` o. Ä.) und warum.
- [ ] `npm run lint` + `npm run typecheck` grün; `npm run brain:lint -- --no-write` grün (ein Impl-Report kommt mit).
- [ ] Lokaler Build zeigt **deutlich** weniger prerenderte Entity-Seiten. Belege mit **zwei** Quellen, nicht nur dem Konsolen-Routenblock: (a) der Build-Route-Liste und (b) der Pfad-Zahl in `.next/prerender-manifest.json`. Vorher ~1300 Entity-Pfade → Ziel grob „wenige Dutzend bis <100".
- [ ] Report hält die ungefähre Seitenzahl vorher/nachher + die erwartete Egress-/Build-Zeit-Wirkung fest. Keine Versionen pinnen.

## Open questions

- Welche Quelle hast du für die heiße Teilmenge gewählt (kuratierte Konstante vs. „top N"-Query) und warum? Falls Query: was ist der Verlinkungs-/Wichtigkeits-Proxy, und bleibt der Build-Pfad dabei wirklich ID-only?
- Hat `revalidatePath('/<route>/[slug]','page')` in dieser Next-Version den erwarteten Effekt auf on-demand-ISR-Seiten, oder gab es eine Überraschung, die einen anderen Mechanismus nötig machte?

## Notes

- Stack ist Next App Router (aktuelle Major, derzeit Next 16.2 laut `db-cache.ts`); **keine Version pinnen** — CC recherchiert/pinnt.
- Die heiße Teilmenge ist bewusst klein gehalten: sie deckt die Seiten ab, die beim Reddit-Launch zuerst geklickt werden. Der Long-Tail trägt sich beim ersten echten Besuch selbst ein und ist danach gecacht — Build-Egress zieht nur die Teilmenge.
