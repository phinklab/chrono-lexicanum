---
session: 2026-07-11-198
role: implementer
date: 2026-07-11
status: complete
slug: launch-s1b-build-decouple
parent: null
links:
  - 2026-07-11-197
  - 2026-07-11-196
  - 2026-07-11-194
commits: []
---

# Launch S1b — DB-freie Build-Consumer, CI-Gate, Toolchain

**Worktree:** `chrono-lexicanum` (Koordination, E8-Ausnahme) · **logischer
Strang:** Product/Plattform · **Branch:** `codex/product-build-decouple`

## Summary

Der Build ist von der Live-DB entkoppelt. `next build` liest jetzt in **allen**
prerender-relevanten Loadern (Home, Podcast-Index, die vier Entity-Hot-Subsets
inkl. `generateStaticParams`) den committeten Snapshot; die Laufzeit
(ISR-Refresh, On-Demand-Langschwanz, dynamische Routen, Modals, API) lädt den
Live-Postgres-Pfad ausschließlich per lazy `import()`. Messung: **Baseline
10 min 12 s mit 4 × 300-s-Timeout-Retries → 11,5 s** (DB-frei) bzw. **10,8 s**
(normale Env), Static-Gen 158/158 in ~1,1 s, zwei aufeinanderfolgende Builds
ohne einen einzigen Retry. Der Build mit unerreichbarer `DATABASE_URL` ist grün
und protokolliert null Verbindungsversuche; CI erzwingt genau das ab jetzt als
Teil des bereits required Checks `lint-and-typecheck`. `eslint .` fiel von 904
Traversal-Findings auf **0 Findings in 8,7 s**. Toolchain: `npm ls`-Gate nach
`npm ci` (fing sofort einen realen Drift: lokal lief next 16.2.9 gegen ein Lock
mit 16.2.10), blockierende Audit-Policy für prod-Deps ab high,
`@anthropic-ai/sdk` → devDependencies.

## What I did

**1 · Loader-Weiche (Umfang 2):**

- `src/lib/snapshot/build-data.ts` (neu) — die DB-freie Snapshot-Fassade:
  `isBuildPhase()` (`NEXT_PHASE === "phase-production-build"`; Next setzt die
  Variable im Build-Prozess, die Static-Gen-Worker erben sie),
  `readSnapshotArtifact()` / `readSnapshotEntity()` mit **fail-closed** Reads
  (fehlendes/kaputtes Artefakt ⇒ throw ⇒ Build rot — nie stiller Fallback auf
  die Live-DB, nie leere Seite im Deploy). Artefakt-Registry wird aus
  `scripts/snapshot-shared.ts` importiert (eine Quelle, kein Drift).
- Drei Fassade/Live-Splits nach identischem Muster — Typen + pure Transforms
  bleiben im bisherigen Modulpfad (alle Importer + die S1a-Shape-Contracts
  unverändert), die DB-Körper wandern in ein `*-live.ts`, das nur noch lazy
  importiert wird:
  - `src/app/archive/loader.ts` ⇄ `loader-live.ts` (BrowseData; `bookSlugById`
    immer live — /archive ist searchParams-dynamisch).
  - `src/app/archive/podcasts/loader.ts` ⇄ `loader-live.ts` (PodcastIndex +
    PodcastSearch per Weiche; `loadPodcastShow` immer live — Shows rendern per
    leerem `generateStaticParams` nie beim Build). `buildPodcastSuggestions`
    bleibt pur in der Fassade.
  - `src/lib/entity/loader.ts` ⇄ `loader-live.ts` (`listHotEntityIds` beim
    Build aus `entity-hot-ids.json`, `loadEntity` beim Build aus
    `entities/<type>/<id>.json`; Laufzeit beide live; `listEntityIds` —
    reserviert für die S5-Sitemap — immer live). `cache()`-Wrapper bleiben in
    der Fassade.
- `src/lib/compendium/loader.ts` — der Schnitt liegt wie in S1a geplant auf den
  vier `cachedRead`-**Quell**-Reads: vier Switch-Funktionen (Snapshot beim
  Build, lazy `import()` von `./queries` bzw. `@/app/fraktionen/loader` zur
  Laufzeit) unter unverändertem `cachedRead`. Statische Imports der DB-Module
  auf `import type` reduziert; alles oberhalb (Items, Counts, Suggestions)
  läuft ungeändert in beiden Welten. S1b tauschte damit — wie von S1a
  vorbereitet — exakt vier Quell-Reads statt Presentation-Builder zu forken.
- `src/lib/search-index.ts` — nur Docstring (Komposition unverändert; alle vier
  Quellen sind jetzt DB-freie Fassaden).

**2 · next.config (Umfang 1 + 6):** `experimental.cpus: 2` (Defense-in-depth —
der Build braucht die DB nicht mehr; rutscht je wieder eine DB-Route ins
Prerender-Set, bleiben 2 Worker × `max:5` unter den ~15 Pooler-Slots).
`staticPageGenerationTimeout: 300` und `staticGenerationMaxConcurrency: 3`
nach Neuvermessung **entfernt** (Static-Gen ~1,1 s gegen den Snapshot, weit
unter dem 60-s-Default). Stale Prosa raus: der /compendium-ISR-Kommentar hing
an der entfernten Timeout-Option; der Crawler-Phase-3-Rest im
`images.remotePatterns`-Kommentar (Wikipedia/Lexicanum/OL/Hardcover, Brief 177)
ersetzt; der deplatzierte Prototype-Hinweis (dokumentierte tsconfig/gitignore,
nicht next.config — Inhalt steht in CLAUDE.md) entfernt.

**3 · CI (Umfang 3):** `npm run build` in den bestehenden required Check
`lint-and-typecheck` gefaltet (Brief-180-Muster — sofort required, ohne
Branch-Protection-Änderung), mit `DATABASE_URL:
postgres://ci-build-must-not-touch-db:x@127.0.0.1:9/none`. Der required Check
führt damit lint, typecheck, test, check:eras, brain:lint **und** den DB-freien
Build aus.

**4 · ESLint (Umfang 4):** Ignores `**/.next/**` (statt nur root),
`.claude/worktrees/**`, `timeline-workshop/design-export/**`.

**5 · Toolchain (Umfang 5):** `npm ls` als CI-Step direkt nach `npm ci`;
Audit-Job: `npm audit --omit=dev --audit-level=high` **blockierend** (prod-Deps
= next, react, react-dom, drizzle-orm, postgres), voller `npm audit` bleibt
sichtbarer Non-Blocking-Report; `@anthropic-ai/sdk` `^0.110.0` →
`devDependencies` (Lock-Diff: exakt die dev-Flags des SDK-Teilbaums).

## Decisions I made

- **Weiche über `NEXT_PHASE`, nicht über eine eigene Env-Variable.** Kein
  cross-env (wäre eine neue Dependency — Leitplanke 5), kein Windows-fragiles
  Inline-Env im npm-Script, und Vercel-Builds tragen die Phase automatisch.
  Verifiziert: `next/dist/build/index.js` setzt `process.env.NEXT_PHASE =
  PHASE_PRODUCTION_BUILD`; die Worker (jest-worker-Kinder) erben env; im
  DB-freien Build haben alle 158 Seiten nachweislich Snapshot-Daten gerendert.
- **CI-Gate mit unerreichbarer URL, nicht mit leerer.** Empirisch belegt (kein
  Bauchgefühl): `DATABASE_URL= npm run build` bricht in „Collecting page data"
  — Next evaluiert beim Build die Modul-Graphen **aller** Routen, auch der
  dynamischen (/timeline, /buch, /healthz, APIs), und deren statischer
  `@/db/client`-Import wirft ohne Wert. Die haben zu Recht statische
  DB-Imports (sie rendern nie beim Build); sie alle auf lazy umzustellen wäre
  Scope-Explosion ohne Nutzen. Port 9 auf 127.0.0.1 macht jeden echten
  Verbindungsversuch sofort und laut sichtbar statt zu hängen.
- **Fail-closed beim Build, unverändert degradierend zur Laufzeit.** Beim
  Build wirft die Fassade bei fehlendem Artefakt (ein Build ohne
  Snapshot-Daten darf nicht deploybar sein); die Laufzeit-Fehlersemantik der
  Live-Pfade (degrade zu `[]`/`null`) habe ich bewusst NICHT angefasst — das
  ist der S2-Vertrag, Cross-Session-Fixes wären Scope-Bruch.
- **Split-Schnitt: Typen bleiben am alten Modulpfad.** Dadurch bleiben alle
  Importer (Pages, Filters, Components) und die Compile-Time-Shape-Contracts
  aus `scripts/test-build-snapshot.ts` unberührt (`scripts/**` in dieser
  Session komplett unangetastet — Strand-Reinheit). `loader-live.ts` importiert
  seine Typen `import type` aus der Fassade; der Lazy-Import läuft nur in
  Gegenrichtung — kein Zyklus zur Laufzeit.
- **Build in den bestehenden required Job gefaltet** statt eines neuen Jobs:
  ein neuer Job-Name wäre erst nach manueller Branch-Protection-Änderung
  required (Brief-180-Präzedenz). Kostet ~1 Build-Minute im seriellen Job,
  kauft sofortige Verbindlichkeit.
- **`npm ls` (Top-Level) statt `npm ls --all`.** `--all` ist auch nach
  frischem `npm ci` dauerhaft rot: npm materialisiert `@img/sharp-wasm32@0.35.3`
  (bekannter Arborist-Quirk bei plattform-konditionalen Optionals), das gegen
  die in next genestete `sharp@0.34.5` als „invalid" markiert wird — Rauschen
  ohne Drift-Aussage, plattformabhängig. Das Top-Level-`npm ls` validiert
  deklarierte Deps ↔ Lock ↔ Tree und hätte genau den real gefundenen Drift
  (unten) gefangen.
- **Audit-Schwelle high für prod-Deps.** Ist-Stand: 2 moderate im prod-Graph
  (postcss-Advisory GHSA-qx2v-qp2m-jg93 via next-nested postcss; „Fix" wäre
  next@9 — absurd breaking). Moderate blockieren nicht, bleiben aber im
  Non-Blocking-Vollreport sichtbar; high/critical in prod-Deps blocken ab
  jetzt jeden Merge.
- **`experimental.cpus: 2` trotz Loader-Weiche gesetzt** (Spec Umfang 1):
  reine Absicherung; Wall-Clock-Effekt beim Snapshot-Build gemessen ≈ null
  (158 Seiten in 1,1 s).

## Verification

Alle Werte frisch erhoben (Arbeitsmodus: keine Fortschreibung alter Zahlen):

- **Baseline (vorher, main-Stand, DB erreichbar):** `next build` **10 min
  12 s**, davon Compile 2,4 s + TS 5,1 s; 4 × „Failed to build … took more
  than 300 seconds" (`/`, `/archive/podcasts`, `/person/dan_abnett`) mit
  Retries — die im Plan dokumentierte Fragilität, live reproduziert.
  (Hinweis: Baseline lief auf dem lokal veralteten next 16.2.9, s. u.; der
  Größenordnungsvergleich bleibt davon unberührt.)
- **Build mit unerreichbarer `DATABASE_URL`** (exakt der CI-Wert): grün,
  **11,5 s** total, 158/158 statische Seiten in 1116 ms mit 2 Workern; im Log
  **0** Treffer für retry/failed/ECONNREFUSED/timeout/„rendering empty"/„fetch
  failed" — kein Verbindungsversuch, keine stille Degradation.
- **Nachweis echter Inhalte im DB-freien Build:** Home-HTML trägt „896 records
  indexed" (Snapshot-Counts aus PR #244); `charakter/alpharius.html` rendert
  den Merge „Alpharius Omegon"; Podcast-Index trägt Episoden. Route-Tabelle
  identisch zur Baseline (● Home/Podcast-Index/4 Entity-Routen; ƒ timeline,
  compendium, buch, healthz …).
- **Zweiter aufeinanderfolgender Build (normale Env, `.env.local` gesetzt):**
  grün, **10,8 s**, 158/158 in 1103 ms, **0 Retries/Timeouts** — auch mit
  erreichbarer DB liest der Build nur den Snapshot. Dritter Lauf zum
  Hinterlassen eines sauberen `.next`: grün, 158/158 in 1068 ms.
- **Gegenprobe leere `DATABASE_URL`:** bricht deterministisch in „Collecting
  page data" mit dem client.ts-Throw (Beleg für die CI-Variante).
- **Laufzeit-Smoke (`next start` auf dem Prod-Build):** `/healthz` → 200
  `{ok:true,db:"up"}` (lazy Live-Import + Query funktioniert);
  `/charakter/kharn_the_betrayer` (Langschwanz, NICHT im Snapshot) → 200 mit
  echtem DB-Inhalt „Khârn the Betrayer" (On-Demand-Live-Pfad); Home → 200 mit
  Prerender-Stand. Server danach beendet (ein Prozess, per CommandLine
  gekillt).
- **`eslint .`:** 8,7 s, 0 Findings (vorher: 904 Findings durch
  Worktree-/.next-/design-export-Traversal). `npm run lint` grün.
- **`npm run typecheck`** grün (inkl. der neun S1a-Shape-Contracts über die
  unveränderten Loader-Typpfade). **`npm test`** grün — 32 Suiten in 6,5 s.
  **`npm run brain:lint -- --no-write`** grün (0 blocking).
- **`npm ci` + `npm ls`:** exit 0, alle deklarierten Deps valide.
  `npm audit --omit=dev --audit-level=high` exit 0.
- Kein `scripts/**`-, kein `brain/**`-, kein `sessions/README.md`-Touch; Diff
  = src (4 Fassaden + 3 Live-Module + 1 Fassaden-Lib + 1 Docstring),
  next.config, ci.yml, eslint.config, package.json + Lock.

## Found & fixed on the way

- **Realer Toolchain-Drift:** lokal lief next **16.2.9** (Baseline-Build-Log)
  gegen package.json/Lock **16.2.10** — ein nie nachgezogenes lokales
  `node_modules` nach einem Version-Bump; CI/Vercel bauten längst 16.2.10.
  Durch `npm ci` behoben; der neue CI-`npm ls`-Step gate-t exakt diese Klasse,
  lokal macht `npm ls` den Drift ab jetzt sofort sichtbar.

## Open issues / blockers

Keine Blocker. Befunde, bewusst nicht hier gefixt:

- **`sessions/2026-07-11-197-impl-launch-s1a-snapshot-release.md` liegt
  untracked im Koordinations-Worktree** (der Impl-Report der
  S1a-Snapshot-Session ist nicht im PR #244 mitgefahren), ebenso ein
  untracked `outputs/`-Ordner (`fable-map-prompt.md`). Beides gehört nicht in
  diesen Product-PR; Vorschlag: Report 197 + Rollups im nächsten
  Koordinations-PR einsammeln, `outputs/` entscheidet Philipp (ggf. löschen
  oder gitignoren).
- **sharp-wasm32-Rauschen:** `npm ls --all` bleibt wegen des
  Arborist-Optional-Quirks rot (Details oben) — dokumentiert, kein Handlungs-
  bedarf; wer es je loswerden will, müsste die top-level sharp-Version an
  nexts genestete koppeln (nicht lohnend).
- **Stale-Kommentare für S2/S6** (aus Report 196 weitergereicht, weiterhin
  report-only): `src/lib/ask/boundaries.ts:46` + `src/lib/ask/heresy-books.ts:4`
  („uniformly time_ending" — seit dem 197-Sync falsch),
  `src/lib/compendium/loader.ts` („~2400 location rows", real 442).
- **Degradations-Semantik der Live-Pfade** (leer/null statt Fehlerfläche) ist
  unverändert — das IST der S2-Auftrag; die Loader-Docstrings verweisen jetzt
  explizit darauf.

## For next session (S2 — Fehlersemantik & Laufzeit-Caches)

- Die Live-Module sind jetzt die einzige Stelle der try/catch→empty-Muster:
  `src/app/archive/loader-live.ts`, `src/app/archive/podcasts/loader-live.ts`,
  `src/lib/entity/loader-live.ts`, plus unverändert `./queries`,
  `fraktionen/loader`, `loadBook`, `loadTimeline`. Der S2-Vertrag (Detail:
  null/throw; Index: []/throw) lässt sich dort umsetzen, ohne die Fassaden
  oder den Build-Pfad anzufassen — beim Build wirft die Snapshot-Fassade
  bereits.
- `cachedRead`/`memoryCachedRead` wrappen jetzt Switch-Funktionen; der
  db-cache-Doppelaufruf (S2 Punkt 2) liegt unverändert in
  `src/lib/db-cache.ts:110-118`.
- Vercel braucht für diesen PR keine Env-Änderung: der Build liest den
  committeten Snapshot (Phase-gesteuert), die Runtime weiter `DATABASE_URL`.
  Der Runtime-Credential-Cutover bleibt S3a/S3b.

## References

- `docs/launch-master-plan.md` § Session 1b (+ Arbeitsmodus, Leitplanken) —
  verbindliche Spec.
- Reports 196/197 (Exporter-Registry, Artefakt→Loader-Zuordnung,
  Snapshot-Release-Stand 896 Bücher).
- next/dist/build/index.js:1131 (NEXT_PHASE-Setzung) — empirisch gegen den
  installierten next@16.2.10 geprüft.
