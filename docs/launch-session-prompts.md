# Launch-Session-Prompts — Chrono Lexicanum

Begleitdokument zu [`launch-master-plan.md`](./launch-master-plan.md) (v2 + E8). Pro Session: Kurzplan + Kickoff-Prompt zum Einfügen in eine **frische** Claude-Code-Session. Verbindliche Spec ist immer der Plan-Abschnitt — die Prompts sind der operative Zünder; bei Widerspruch gewinnt der Plan.

## Ablauf pro Session

1. Frische CC-Session im **Koordinations-Worktree** `C:\Users\Phil\chrono-lexicanum` (E8: alle Launch-Sessions laufen hier).
2. Prompt aus dem passenden Block einfügen. CC prüft die Voraussetzung, legt den Branch an, liest den Plan-Abschnitt, arbeitet.
3. Bei UI-Sessions verifiziert Philipp im Browser (CC startet den Dev-Server sauber; keine Headless-Loops).
4. `fertig` → CC committet, pusht, öffnet den PR. Philipp merged.
5. `PR ist gemerged, bitte aufräumen` → Cleanup; nächste Session mit frischer CC-Session.

**Betriebsnotizen:** Ein Dev-Server pro Worktree — hängende node-Prozesse vor dem Start beenden, bei kaputten Chunks `.next` löschen und neu starten. · Die Prompts sind als „enge Session" i. S. v. CLAUDE.md geschnitten: project-state/open-questions müssen nicht gelesen werden. · Reihenfolge und Gates: Masterplan § „Reihenfolge & Launch-Gate".

## Reihenfolge & Status

| # | Session | Branch | Voraussetzung | Status |
|---|---|---|---|---|
| 1 | S0 — Kanonisierung & Entscheidungen | `codex/session-194-launch-s0` | — | ☑ (Session 194) |
| 2 | S1a — Snapshot-Exporter & Era-Fix (Code-PR) | `codex/ingest-batches-snapshot-exporter` | S0 | ☐ |
| 2b | S1a-Snapshot — Produktions-Sync & Initial-Artefakte | `codex/ingest-batches-initial-snapshot` | S1a gemerged + Freeze + Go | ☐ |
| 3 | S1b — DB-freie Consumer & CI | `codex/product-build-decouple` | S1a-Snapshot | ☐ |
| 4 | S2 — Fehlersemantik & Caches | `codex/product-error-semantics` | S1b | ☐ |
| 5 | S3a — DB-Rollen & Release-Revalidation | `codex/ingest-batches-db-hardening` | S2 | ☐ |
| 6 | S3b — CSP, Login, Audio, Runtime-DB-Cutover | `codex/product-csp-login-audio` | S0 (E6) + S3a | ☐ |
| 7 | S4 — Kanonische Routen & Book-ISR | `codex/product-canonical-routes` | S0-Matrix, S2 | ☐ |
| 8 | S4b — Buch-Projektion → Snapshot (Mini) | `codex/ingest-batches-book-snapshot` | S4 | ☐ |
| 9 | S5 — SEO, Observability, Launch-Runbook | `codex/product-seo-launch` | S3b + S4b | ☐ |
| 10 | S6 — Such- & Archive-Payload | `codex/product-archive-payload` | S2 | ☐ |
| 11 | S7a — CSS, Fonts, Hero-LCP | `codex/product-css-fonts-lcp` | sinnvoll nach S6 | ☐ |
| 12 | S8 — A11y-Fundament + Smoke-Set | `codex/product-a11y-foundation` | S2 (+ S3a für CI-DB) | ☐ |
| 13 | S9 — Chronicle A11y/Mobile | `codex/product-chronicle-a11y` | S8 | ☐ |
| 14 | S10a — Cartographer Payload & A11y | `codex/product-map-payload-a11y` | S8 | ☐ |
| 15 | S10b — Cartographer LOD (bedingt!) | `codex/product-map-lod` | S10a + Messbefund | ☐ |
| 16 | Launch-Readiness — finales Gate | `codex/session-<NNN>-launch-readiness` | alle Muss-Sessions | ☐ |
| 17 | PL1 — Preview-Abbau | `codex/product-preview-removal` | Launch + Go | ☐ |
| 18 | S7b — Player, Chrome, Assets | `codex/product-player-chrome-assets` | Launch | ☐ |
| 19 | S11 — Cleanup & Rollup (2 PRs) | `codex/product-s11-cleanup` + `codex/session-<NNN>-s11-rollup` | Launch | ☐ |

---

## S0 — Plan kanonisieren, Statusbereinigung, Launch-Entscheidungen

**Ziel:** Plan + Prompts auf `main`, Alt-Briefe bereinigt, die vier offenen Entscheidungen fixiert, README aktuell. **Besonderheit:** enthält vier Philipp-Entscheidungen — CC legt Empfehlungen vor und **wartet**, bevor es sie festschreibt.

```text
Launch-Session S0 — Plan kanonisieren, Statusbereinigung, Launch-Entscheidungen.

Worktree: C:\Users\Phil\chrono-lexicanum (Koordinations-Worktree; Single-Worktree-Ausnahme E8 laut docs/launch-master-plan.md — gilt für alle Launch-Sessions). Frischer Branch codex/session-<NNN>-launch-s0 von origin/main (NNN = nächste freie Session-Nummer in sessions/).

Verbindliche Spec: docs/launch-master-plan.md § „Session 0" — lies zuerst diesen Abschnitt plus §§ „Entscheidungen", „Arbeitsmodus", „Leitplanken". Enge Session: keine weitere Brain-Leseroutine nötig.

Auftrag:
1. URL-Matrix als konkrete Tabelle erarbeiten (alle Punkte aus dem Plan-§: Detail- UND Index-/Kategorierouten je Entity-Typ, /buch-Entscheidung, /ask/fraktion, Modal-Intercepts, Admin-/Audit-Pfade, Redirects inkl. Querystring-Regel, Sitemap-/Canonical-Zuordnung, /api/revalidate-Pfadliste) und mir MIT Empfehlung vorlegen — zusammen mit den drei anderen offenen Entscheidungen: kanonischer Host/Domain, Era-Variante (Default steht im Plan), Error-only-Tracker ja/nein. Warte auf meine Antworten, bevor du irgendetwas festschreibst.
2. Entscheidungen in docs/launch-master-plan.md eintragen („In S0 zu entscheiden" → als entschieden markieren; URL-Matrix als Anhang des Plans).
3. Brief 181 (sessions/2026-07-02-181-arch-product-prune-pass.md) auf den real erreichten Status setzen; Brief 182 (sessions/2026-07-02-182-arch-launch-tech.md) als superseded durch den Plan markieren.
4. sessions/README.md + Brain-Rollup (project-state, log, ggf. worklist) für die Sessions 185–192 und diesen Plan nachziehen. npm run brain:lint -- --no-write muss grün sein.
5. README.md neu schreiben: Ist-Zustand statt „Phase 3 / 26 Bücher / Crawler-Pipeline"; „five questions" → four; Live-URL/Status prüfen.
6. Impl-Report unter sessions/ anlegen.

Kein Commit/PR, bis ich „fertig" sage.
```

---

## S1a — Snapshot-Exporter, Manifest, Era-Fix, Release-Runbook (Code-PR)

**Ziel:** Versionierter Build-Snapshot (nur echte Build-Projektionen) + Manifest + Era-Fix im Apply-Pfad + zweistufiges Release-Runbook. **PR-Inhalt:** Batches-rein, nur Code/Tests/Runbook — Produktions-Sync und Artefakte folgen als eigene Session „S1a-Snapshot" (nächster Block). Kein Produktions-Write mit ungemergtem Code (E4 / OQ 19).

```text
Launch-Session S1a — Snapshot-Exporter, Manifest, Era-Fix, Release-Runbook. Code-PR: KEINE Produktions-Writes, KEINE committeten Artefakte.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Vor Branch-Erstellung git status prüfen: Diffs an getrackten Dateien ⇒ stoppen und fragen; untrackte Maintainer-Dateien (z. B. outputs/) liegen lassen und niemals stagen. Frischer Branch codex/ingest-batches-snapshot-exporter von origin/main. Voraussetzung: S0 gemerged (Era-Entscheidung liegt vor) — sonst stoppen und melden.

Verbindliche Spec: docs/launch-master-plan.md § „Session 1a" (+ „Arbeitsmodus", „Leitplanken"). Diese Session schreibt NICHT in die Produktions-DB — kein db:sync, kein apply:*; lesende Probeläufe (Exporter, Verifikations-SELECTs) sind ok. PR-Inhalt bleibt Batches-rein: scripts/** + Runbook + GENAU EIN package.json-Eintrag (snapshot:regen — dokumentierte Ausnahme, sonst nichts an package.json); keine src/**-, keine brain/**-Änderungen (nötige src-Anpassungen nur notieren → S1b/S2; taucht ein brain-Diff auf: stoppen).

Kernpunkte (Details im Plan-§):
1. scripts/build-snapshot.ts + npm-Script snapshot:regen — exportiert NUR die konkreten Build-Projektionen (Home, Podcast-Index, kuratierte Entity-Prerender-Subsets; Liste und Ausschlüsse stehen im Plan-§). Die produktiven src-Loader sind server-only und aus tsx nicht ausführbar: der Exporter implementiert eigene DB-Projektionen unter scripts/**; Typen aus src/** ausschließlich per `import type` (zur Laufzeit getilgt) + Contract-Tests, damit Export-Shapes = Loader-Rückgabeformen bleiben. Fail-closed: DB-/Shape-Fehler werfen; leere Kernprojektionen, fehlende Hot-ID-Payloads oder unplausible Counts brechen den Lauf VOR dem Schreiben ab — niemals still leere Artefakte (die src-Loader degradieren bei DB-Fehlern zu []/null; dieses Muster nicht erben).
2. Manifest: Erzeugungszeitpunkt, Quell-Migrationsstand, Counts, Content-Hash pro Datenartefakt (das Manifest hasht sich nicht selbst). Determinismus: bei inhaltlich identischem Ergebnis wird der vorhandene Erzeugungszeitpunkt übernommen — zwei Läufe ohne DB-Änderung ⇒ byte-identische Dateien.
3. Era-Fix gemäß S0-Entscheidung, im APPLY-PFAD (Ableitung beim Upsert, muss db:rebuild überleben — kein One-off-UPDATE): M41_ERA_ID-Pauschalstempel aus scripts/book-apply-shared.ts entfernen; ein purer Helper bucketet primary_era_id aus scripts/seed-data/book-dates.json × eras.json (startY bestimmt den Bucket; keine book-dates-Zeile ⇒ NULL; gilt für --slug wie --all; apply:curation-overlay bleibt als letzter Tail höher priorisiert). Apply und Tests nutzen denselben Helper. Mit-Scope (alles Batches): apply-book.ts-Header, book-apply-shared.ts-Kommentare, scripts/test-apply-book.ts (assertiert heute den Stempel), scripts/runbooks/add-book-runbook.md, scripts/runbooks/weekly-refresh-runbook.md. WICHTIG: echte M41-Bücher behalten time_ending zu Recht (reguläre Era 41000–41999; aktuell 44 von 97 book-dates-Einträgen) — verboten ist nur time_ending OHNE passende Setting-Date; Acceptance ist diese Dateninvariante, kein Grep nach dem Literal. Null-Toleranz von Ask/Suche nur lesend verifizieren; stale Kommentare unter src/lib/ask/** report-only → S2/S6.
4. Release-Runbook (zweistufiger Content-Release, E4) unter scripts/runbooks/: Content-Freeze → read-only Migrations-Head-Parität (Repo == DB; Abweichung ⇒ Stopp, keine improvisierte Migration) → explizites Go → genau ein vollständig grüner db:sync (enthält apply:book --all — nicht zusätzlich laufen lassen) → Artefakte auf frischem Batches-Branch regenerieren → Manifest/Counts/Hashes/Diff prüfen → Snapshot-PR = Deploy → Revalidation + Live-Smoke.

Verifikation: npm run typecheck · npm run lint · npm test · npm run build · npm run test:apply-book · Era-Helper-Tests decken Bucket-Grenzen + NULL-Fall · Exporter-Doppellauf gegen unveränderte DB ⇒ byte-identische Ausgaben (nur lokal prüfen, nichts committen).
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S1a-Snapshot — Produktions-Sync (Era-Fix) & initiale Artefakte

**Ziel:** Erster Lauf des S1a-Release-Runbooks: Era-Fix mit gemergtem Code in die Produktions-DB, dann initiale Snapshot-Artefakte + Manifest. **Der Snapshot-PR ist der Deploy (E4).**

```text
Launch-Session S1a-Snapshot — Produktions-Sync (Era-Fix) & initiale Snapshot-Artefakte, nach dem S1a-Release-Runbook.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Vor Branch-Erstellung git status prüfen: Diffs an getrackten Dateien ⇒ stoppen; untrackte Maintainer-Dateien liegen lassen, niemals stagen. Frischer Branch codex/ingest-batches-initial-snapshot von origin/main. Voraussetzungen: S1a gemerged UND Content-Freeze von mir bestätigt — sonst stoppen und melden.

Verbindliche Spec: das in S1a committete Release-Runbook (scripts/runbooks/) + docs/launch-master-plan.md § „Session 1a".

Ablauf:
1. Read-only-Preflight: Migrations-Head-Parität Repo == DB (Repo-Kopf derzeit 0015_keen_tag). Abweichung ⇒ stoppen und melden; keine Migration improvisieren.
2. MEIN explizites Go abwarten, dann genau ein npm run db:sync (enthält apply:book --all — nicht doppelt laufen lassen). Scheitert die Kette: Ursache melden; erneuter Lauf nur nach Rücksprache (die Kette ist idempotent).
3. Era-Invariante read-only verifizieren: jede gesetzte primary_era_id ist aus book-dates.json × eras.json ableitbar (Kurationsoverlay ausgenommen); ohne Setting-Date ⇒ NULL; echte M41-Bücher tragen time_ending zu Recht.
4. npm run snapshot:regen; Manifest/Counts/Hashes prüfen; zweiter Lauf ⇒ leerer Diff.
5. Der PR enthält NUR Artefakte + Manifest, keine Code-Änderungen.
6. Revalidation NIE vor dem Deploy: sie folgt laut Runbook ERST nach dem Merge dieses PRs (= Deploy, E4) — als manueller curl laut Runbook, solange der explizite S3a-Befehl noch nicht existiert (B1). Nichts davon in dieser Session ausführen.

Verifikation: Determinismus-Doppellauf · Invarianten-Check + Counts im Report · die vier PR-Gates.
Abschluss: Impl-Report unter sessions/ (Counts/Messwerte rein). Kein Commit/PR, bis ich „fertig" sage.
```

---

## S1b — DB-freie Build-Consumer, CI-Gate, Toolchain

**Ziel:** Build liest Snapshot statt Live-DB; CI beweist es dauerhaft; ESLint/Toolchain entrümpelt.

```text
Launch-Session S1b — DB-freie Build-Consumer, CI-Gate, Toolchain.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-build-decouple von origin/main. Voraussetzung: S1a UND S1a-Snapshot gemerged (Snapshot-Artefakte existieren auf main).

Verbindliche Spec: docs/launch-master-plan.md § „Session 1b" (+ „Leitplanken").

Kernpunkte:
1. experimental.cpus: 2 als Sofortschutz.
2. Loader-Weiche: Build liest Snapshot, Laufzeit Postgres. Harte Import-Regel: gemeinsame Typen/Transformationen DB-frei, Snapshot-Fassade DB-frei, Live-Pfad NUR per lazy import() — src/db/client.ts wirft beim Import ohne DATABASE_URL.
3. CI: next build als required Check mit unerreichbarer DATABASE_URL.
4. ESLint-Ignores (.claude/worktrees/**, verschachtelte .next, timeline-workshop/design-export/**).
5. Toolchain: npm-ci-Clean-Check, Audit-Policy, @anthropic-ai/sdk → devDependencies.
6. Stale next.config-Prosa korrigieren; staticPageGenerationTimeout/staticGenerationMaxConcurrency nach Neuvermessung zurückbauen.

Verifikation: Build mit unerreichbarer DATABASE_URL grün und öffnet nachweislich keine DB-Verbindung · zwei aufeinanderfolgende Builds ohne Retry/Timeout · eslint . lokal < 60 s · Buildzeit vorher/nachher messen · die vier PR-Gates.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S2 — Fehlersemantik & Laufzeit-Caches

**Ziel:** data/null/throw-Vertrag statt Fehlkonflationen; Caches + Tags komplett; Revalidation-Semantik korrekt.

```text
Launch-Session S2 — Fehlersemantik & Laufzeit-Caches.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-error-semantics von origin/main. Voraussetzung: S1b gemerged.

Verbindliche Spec: docs/launch-master-plan.md § „Session 2" — Leitplanken 1/2 gelten hier besonders: KEIN Result-Framework, keine generische Loader-Abstraktion; der Vertrag ist eine Konvention.

Kernpunkte:
1. data/null/throw-Konvention für alle Loader (Detail: Daten|null + throw; Index: Array + throw; nur null ⇒ notFound(), Throws ⇒ vorhandene Error-Boundaries).
2. db-cache-Doppelaufruf entfernen (src/lib/db-cache.ts, catch ruft fn() erneut); stale-good-Verhalten erhalten.
3. Caching + Tags nachrüsten: loadTimeline, loadEntity, Podcast-Index/Shows; CATALOGUE_TAGS erweitern.
4. cachedAskBooks: Rejection-Eviction + TTL (matrixPromise HAT die Eviction schon — matrix.ts:167-170, nicht doppelt bauen).
5. Revalidation-Semantik: revalidateTag(tag,"max") ist SWR (Next-16-Doku); der „hard-purge"-Kommentar in /api/revalidate ist falsch. Entscheidung umsetzen ({ expire: 0 } ist die Empfehlung für den Release-Revalidation-Befehl aus S3a), Kommentar fixen.
6. DB-freie Tests: Zustands-Matrix pro Loader, Cache-Pfade cold/warm/fail, Eviction.

Verifikation: Tests belegen — DB-Ausfall nie 404/leeres Archiv, fehlgeschlagene Quelle genau 1× pro Request, keine vergifteten Promises, Query-Zähler cold/warm · die vier PR-Gates.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S3a — DB-Rollen, Migrations-Rehearsal, Release-Revalidation

**Ziel:** Least-Privilege-Runtime-Rolle mit Allowlist, geprobter Migrationsweg, expliziter Post-Deploy-Revalidation-Befehl (B1). Der Runtime-Consumer-Wechsel in `src/db/client.ts` ist ausdrücklich S3b.

```text
Launch-Session S3a — DB-Rollen, Migrations-Rehearsal, Release-Revalidation.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/ingest-batches-db-hardening von origin/main. Voraussetzung: S2 gemerged (der Revalidation-Befehl zielt auf den dort fixierten Endpoint).

Verbindliche Spec: docs/launch-master-plan.md § „Session 3a". PR-Inhalt: Batches + .github (scripts/**, migrate.yml, .env.example) — keine src/-Edits.

Kernpunkte:
1. Runtime-Rolle mit expliziter Allowlist (Katalog-SELECT + preview_invite_activations-Upsert); KEIN Default-Grant auf künftige Tabellen; submissions bleibt unlesbar. Grants als nachvollziehbare Migration bzw. dokumentiertes SQL-Skript.
2. Negativtests als Skript: submissions-Read und Katalog-DML/DDL müssen mit der Runtime-Rolle scheitern.
3. Credential-Trennung: Runtime-Rolle + RUNTIME_DATABASE_URL-Credential anlegen und dokumentieren; MIGRATION_DATABASE_URL für den Migrations-Workflow; lokale Apply-/Ingest-Skripte behalten bewusst das privilegierte Credential. Der Consumer-Wechsel in src/db/client.ts und der Vercel-Cutover sind ausdrücklich S3b (B2) — hier KEINE src/**-Änderung.
4. migrate.yml: Environment + Approval, timeout-minutes, minimale permissions; CI-Rehearsal gegen frisches Postgres + zweiter idempotenter Lauf; TLS-Opt-out in scripts/migrate.ts NUR für den CI-Service-Container.
5. Release-Revalidation (B1): db:sync löst KEINE Revalidation aus. Stattdessen ein expliziter, fail-loud Befehl (genau EIN POST; REVALIDATE_BASE_URL, Timeout, Statusprüfung, Recovery-Meldung), den das E4-Release-Runbook genau einmal NACH erfolgreichem Snapshot-Deploy aufruft; bei Sync-/Snapshot-/Deploy-Fehler keine Revalidation. Das S1a-Release-Runbook auf diesen Befehl nachziehen.
6. statement_timeout-Entscheidung dokumentieren; .env.example-Hygiene (tote Supabase-Vars raus, neue Vars dokumentieren).

Verifikation: Negativtests grün · Rehearsal migriert frisches Postgres, zweiter Lauf idempotent · Revalidation-Befehl fail-loud belegt (Erfolgs- + erzwungener Fehlerfall, gegen eine Testumgebung — kein Produktions-POST) · db:sync löst nachweislich keine Revalidation aus · die vier PR-Gates.
Abschluss: Impl-Report; Vercel-Env-Änderungen als klare TODO-Liste an mich (ich setze sie im Dashboard). Kein Commit/PR, bis ich „fertig" sage.
```

---

## S3b — CSP, Login, Health, Audio, Runtime-DB-Cutover

**Ziel:** Prod-CSP ohne unsafe-eval, timing-safe Login, gebündelter Healthcheck, tokenloses Audio, Runtime liest `RUNTIME_DATABASE_URL` (Cutover mit Maintainer-Haltepunkten, B2).

```text
Launch-Session S3b — CSP, Login, Health, Audio, Runtime-DB-Cutover.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-csp-login-audio von origin/main. Voraussetzungen: S0 gemerged (Observability-Entscheidung für die CSP-Einträge) UND S3a gemerged (Runtime-Rolle + RUNTIME_DATABASE_URL-Credential existieren).

Verbindliche Spec: docs/launch-master-plan.md § „Session 3b".

Kernpunkte:
1. CSP: unsafe-eval nur noch dev (isDev-Gate); poweredByHeader: false; die CSP-Einträge des E6-Observability-Pakets hier festschreiben (S5 aktiviert nur noch).
2. login/actions.ts auf timingSafeEqualStr umstellen (der direkte Vergleich in Zeile ~25; die Helper-Funktion existiert).
3. Healthcheck bündeln/throttlen oder Readiness abtrennen.
4. Audio: committete signierte Supabase-URLs → tokenlose Public-Bucket-URLs, erst nach Range-/CORS-Check. Den Bucket-Flip mache ich im Supabase-Dashboard — sag mir wann und was genau.
5. Runtime-DB-Cutover (B2): src/db/client.ts liest RUNTIME_DATABASE_URL mit Übergangs-Fallback auf DATABASE_URL (lokal + Skripte unverändert privilegiert). Reihenfolge: ich setze RUNTIME_DATABASE_URL in Vercel VOR dem Merge (sag mir rechtzeitig Bescheid — expliziter Haltepunkt); Merge + Deploy mit Fallback-Code; nach verifiziertem Deploy entferne ich das privilegierte DATABASE_URL aus Vercel (zweiter Haltepunkt). Kein Deploy darf ohne gültige Runtime-URL entstehen; die End-Verifikation „nur Runtime-Credential in Produktion" ist Launch-Readiness Punkt 6.

Verifikation: lokaler Prod-Build ohne unsafe-eval in der CSP · Audio 200/206 + Range belegt · Cutover-Fallback belegt (Build/Boot grün mit nur RUNTIME_DATABASE_URL wie mit nur DATABASE_URL) · die vier PR-Gates. Login + Player prüfe ich im Browser.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S4 — Kanonische Routen & Book-ISR

**Ziel:** URL-Matrix live, Redirects + Intercepts sauber, Buchseite statisch.

```text
Launch-Session S4 — Kanonische Routen & Book-ISR.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-canonical-routes von origin/main. Voraussetzungen: S0-URL-Matrix entschieden, S2 gemerged.

Verbindliche Spec: docs/launch-master-plan.md § „Session 4" + die URL-Matrix im Plan-Anhang.

Kernpunkte:
1. URL-Matrix vollständig umsetzen: kanonische Entity-Routen (Detail + Index/Kategorie), Modal-Intercepts, 308-Redirects inkl. Querystring-Regel, interne Links; /werke-Redirect bleibt.
2. /api/revalidate: die hart deutsch kodierte ENTITY_ROUTES-Liste auf die neuen Pfade umstellen — Teil DIESER Session.
3. /buch/[slug] statisch: Region-State als Client-Island, headers()/searchParams als Server-Dynamiktreiber raus, SSG/ISR. Die Exporter-Erweiterung (Buch-Projektion) ist S4b — hier nur sauber vormerken.
4. Smokes: Redirects (mit Query), Canonicals, Modal-Intercepts.

Verifikation: alte Pfade 308en inkl. definierter Query-Behandlung · grep findet keine internen Alt-Links · Buchseite prerendert/ISR · die vier PR-Gates. Klick-Abnahme mache ich im Browser (inkl. Modals!).
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S4b — Buch-Projektion in den Snapshot (Mini)

**Ziel:** Der Snapshot kann die statische Buchseite + Sitemap versorgen. Muss vor S5 liegen.

```text
Mini-Session S4b — Buch-Projektion in den Snapshot (Follow-up zu S4, vor S5).

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/ingest-batches-book-snapshot von origin/main. Voraussetzung: S4 gemerged.

Auftrag: scripts/build-snapshot.ts um die /buch-Projektion (+ Slug-Liste für SSG/Sitemap) erweitern; Artefakte + Manifest regenerieren; Determinismus-Check (zweiter Lauf ⇒ leerer Diff). Spec: docs/launch-master-plan.md §§ „Session 1a" / „Session 4".

Verifikation: next build DB-frei grün inkl. Buch-Prerender · die vier PR-Gates.
Abschluss: Kurz-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S5 — SEO, Sharing, Observability & Launch-Runbook

**Ziel:** Vollständiger SEO-/Sharing-Vertrag, Observability aktiv, Launch-Runbook inkl. Rollback geschrieben.

```text
Launch-Session S5 — SEO, Sharing, Observability, Launch-Runbook.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-seo-launch von origin/main. Voraussetzungen: S3b UND S4b gemerged; Host/Domain aus S0 entschieden.

Verbindliche Spec: docs/launch-master-plan.md § „Session 5".

Kernpunkte:
1. noindex build-/env-gated; server-only SITE_URL statt NEXT_PUBLIC_SITE_URL; Prod-Build ohne Wert SCHEITERT (CI: https://example.invalid). Erinnere mich rechtzeitig, SITE_URL in Vercel zu setzen, BEVOR wir mergen.
2. robots.ts + sitemap.ts (Sitemap liest den Snapshot; keine Podcast-Episoden-Fragmente; den toten listEntityIds-Export nutzen); Canonicals + Query-Policy aus der S0-Matrix.
3. Title-Template-Doubling zentral fixen; routen-spezifische OG-Daten; Favicon/Manifest/Default-OG; JSON-LD (WebSite, Book, Podcast wo sinnvoll).
4. Observability per E6 aktivieren: Vercel Web Analytics + Speed Insights (+ Error-Tracker error-only, falls in S0 bejaht); global-error.tsx; Datenschutztext im selben PR; CSP kommt fertig aus S3b.
5. public/lab/ofob/** entfernen oder bewusst freigeben — frag mich.
6. Launch-Runbook inkl. Rollback-/Abort-Kriterien schreiben (konkreter Befehl + Wann-Kriterien; ausgeführt wird es erst im Launch-Readiness-Schritt).

Verifikation: erzwungener Server- UND Client-Fehler sichtbar (bzw. dokumentierter Verzicht) · Prod-Build ohne SITE_URL bricht · Sitemap/robots/Canonicals im lokalen Prod-Build geprüft · die vier PR-Gates. Der Live-Crawl-Smoke kommt erst im Launch-Readiness-Gate.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S6 — Such- & Archive-Payload

**Ziel:** Kein Suggestions-Blob im initialen Payload, Archive paginiert — bei global korrekter Suche.

```text
Launch-Session S6 — Such- & Archive-Payload.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-archive-payload von origin/main. Voraussetzung: S2 gemerged (Tags/Caches).

Verbindliche Spec: docs/launch-master-plan.md § „Session 6" — die Ergebnisbudgets dort SIND die Acceptance; die Architektur dahinter ist frei (Leitplanken beachten).

Kernpunkte:
1. Suggestions-Blob (~466 KB) aus dem initialen Flight von Home, /archive und /archive/podcasts; Laden erst bei Fokus/Eingabe; BrowseSearch-Ranking memoizen.
2. Archive serverseitig paginieren — Budgets: Suche/Filter/Sortierung/Counts/Facets über den GANZEN Katalog; ?focus öffnet jedes Buch unabhängig von seiner Seite; Back/Forward + URL-State stabil; initialer DOM gedeckelt; die 7 toten Buchfelder raus.
3. Prefetch auf sichtbare/wahrscheinliche Ziele begrenzen.
4. Danach: persistenter tagged Cache statt des 2,21-MB-memoryCachedRead-Blobs — begrenzte Key-Kardinalität, Einträge mit Sicherheitsabstand unter 2 MB.
5. E3: alle gefilterten Ankünfte landen am Ergebnisbereich; Hero bleibt für organische Besuche.

Verifikation: Payload vorher/nachher einmalig messen (curl/Build-Log) · kein Suggestions-Blob im initialen HTML/RSC · Stichprobe: ein „Seite-12-Buch" über Suche und ?focus finden · die vier PR-Gates. Verhalten nehme ich im Browser ab.
Abschluss: Impl-Report mit Messwerten. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S7a — CSS, Fonts, Hero-LCP

**Ziel:** Route-CSS entkoppelt, tote Fonts raus, LCP im Budget — mit Baseline vorher.

```text
Launch-Session S7a — CSS, Fonts, Hero-LCP.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-css-fonts-lcp von origin/main. Keine harte Voraussetzung; Baseline VOR den Änderungen messen (Leitplanke 4).

Verbindliche Spec: docs/launch-master-plan.md § „Session 7a".

Kernpunkte:
1. Route-spezifisches CSS aus dem globalen Bundle (~260 KB raw pro Route); 63-fraktionen.css löschen; bestätigte tote Podcast-Regeln raus. Cross-Route-Navigation testen — einmal geladenes globales CSS bleibt im Client kleben; CSS Modules dort, wo echte Isolation nötig ist.
2. Cinzel entfernen (rendert nie); Unicase nur im Timeline-Segment laden; Font-Preloads prüfen.
3. Hero-LCP als preload-scannbares, responsives Bild.
4. Budgets (Lab): LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; Home-/Podcast-RSC deutlich unter der 531–537-KB-Stichprobe.

Verifikation: Baseline + Nachmessung im Report; ohne messbare Verbesserung wird ein Refactor verworfen · die vier PR-Gates. Optik + Navigationspfade (mehrere Routen-Wechsel!) nehme ich im Browser ab.
Abschluss: Impl-Report mit beiden Messreihen. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S8 — A11y-/Mobile-Fundament + Mini-Smoke-Set

**Ziel:** Fokus, Kontrast, Motion, Touchziele solide — und das kleine Smoke-Set am Ende **required**.

```text
Launch-Session S8 — A11y-/Mobile-Fundament + Mini-Smoke-Set.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-a11y-foundation von origin/main. Voraussetzung: S2 gemerged (der Degradations-Smoke prüft dessen Vertrag); S3a hilft für den CI-DB-Zuschnitt. Neue Dependencies Playwright + axe sind hier ausdrücklich erlaubt (Leitplanke 5) — sonst keine.

Verbindliche Spec: docs/launch-master-plan.md § „Session 8" — die Smoke-Spezifikation dort ist verbindlich; das Set bleibt klein („kein weiterer Ausbau").

Kernpunkte:
1. Blanket outline:none raus; :focus-visible-Ring inkl. Forced Colors.
2. Kontrast über 1–2 semantische TEXT-Tokens lösen — nicht global aufhellen, Dekor darf dunkel bleiben.
3. Reduced Motion vollständig: Durations + Delays + JS-Pfade (Smooth-Scroll, rAF/Canvas).
4. 320-px-Hub-Suche fixen; Skip-Link; color-scheme: dark.
5. Touchziele ≥ 44 px auf coarse pointer (keine pauschale Desktop-Vergrößerung).
6. SiteMenu/Sheet inert; Player-Popover-Fokusmodell; Podcast-Headings; Artwork-Ratio/Alt.
7. Mini-Smoke-Set nach Plan-Spez: Prod-Build + next start, PREVIEW_GATE=off, ~6 Kernrouten × (320/1280); pro Route ein spezifischer Landmark-Assert; pageerror/console.error/unerwartete 4xx-5xx ⇒ fail; axe ohne serious/critical (Ausnahmen dokumentiert); vier Interaktions-Smokes (Menü-Fokus, Timeline vs. Volume-Slider, Map-Seek/Fokus-Restore, horizontaler Overflow); Hauptlauf mit erreichbarer DB + separater Degradations-Smoke. CI-Zuschnitt gemäß Plan-§ entscheiden und im Report festhalten. Am Ende dieser Session ist das Set in CI REQUIRED.

Verifikation: Smoke-Set lokal grün + in CI required · die vier PR-Gates. Fokus-Ring/Kontrast/320px nehme ich im Browser ab.
Abschluss: Impl-Report (axe-Ausnahmen einzeln aufführen). Kein Commit/PR, bis ich „fertig" sage.
```

---

## S9 — Chronicle: Tastatur, Screenreader, Mobile

**Ziel:** Timeline komplett tastaturbedienbar, Player-Konflikt gelöst, mobiler Default sinnvoll.

```text
Launch-Session S9 — Chronicle: Tastatur, Screenreader, Mobile.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-chronicle-a11y von origin/main. Voraussetzung: S8 gemerged (Fokus-Ring + Smoke-Harness).

Verbindliche Spec: docs/launch-master-plan.md § „Session 9".

Kernpunkte:
1. Coarse-Pointer-Phones defaulten auf Index-View (?view=cine bleibt Opt-in).
2. Index-Zeilen + Minimap als echte Buttons mit programmatischem Auswahlzustand (heute teils klickbare divs).
3. Globalen keydown auf die Stage begrenzen + Target-Guard — Inputs und der Player-Volume-Slider behalten ihre Pfeiltasten (aktueller Konflikt!).
4. Text serverseitig rendern; genau EINE SR-Ankündigung statt Zeichenstrom; Intro fokussierbar/dismissbar + Hintergrund inert; Touchziele (coarse); Forced Reflow im Scroll-Handler raus; rAF-/Scroll-Animationen respektieren Reduced Motion.

Verifikation: komplette Timeline nur per Tastatur bedienbar · der Timeline-vs-Volume-Smoke aus S8 bleibt grün · die vier PR-Gates. Mobile + Optik nehme ich im Browser ab.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S10a — Cartographer: Payload & A11y

**Ziel:** Initialer Map-Payload ohne Works/Blurbs, zugänglicher Parallelpfad — Messung zuerst.

```text
Launch-Session S10a — Cartographer: Payload & A11y.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-map-payload-a11y von origin/main. Voraussetzung: S8 gemerged.

Verbindliche Spec: docs/launch-master-plan.md § „Session 10a".

Kernpunkte:
1. ZUERST neu messen (works-Arrays, blurbs-Chunk, Knoten, Pins) — Counts sind Messwerte, keine Architekturkonstanten.
2. Works/Blurbs aus dem initialen Payload — über den vorhandenen PinSource.detail()-Seam (src/lib/map/pin-source.ts; genau dafür gebaut). EIN lazy Artefakt vs. per-Welt-Fetch: nach komprimierter Transfergröße entscheiden, nicht dogmatisch.
3. A11y-Parallelpfad: Weltliste/-suche statt 1.000+ Tab-Stop-Pins; Seek als Combobox/Listbox; WorldPanel ankündigen/fokussieren/Fokus zurückgeben; aria-pressed/aria-expanded; Overture macht unsichtbare Controls inert; VoyageTour-Keyhandler mit Target-Guard; mobiles Sheet bewusst modal/nichtmodal; Touchziele (coarse).
4. Die alte Map-A11y-Vertagung (brain/wiki/worklist.md) im Impl-Report neu bewerten — brain/ hier NICHT editieren (kommt in den S11-Rollup-PR).

Verifikation: Transfergrößen vorher/nachher im Report · Weltliste + Seek rein per Tastatur · Fokus-Restore belegt · Map-Smoke aus S8 grün · die vier PR-Gates. Den Ziel-Pixel-Gerätetest machen wir danach zusammen — er entscheidet über S10b.
Abschluss: Impl-Report mit Messwerten. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S10b — Cartographer: Rendering/LOD (bedingt!)

**Nur starten, wenn der Ziel-Pixel-Gerätetest nach S10a weiterhin scheitert.** Sonst entfällt die Session ersatzlos.

```text
Launch-Session S10b — Cartographer: Rendering/LOD. NUR gestartet, weil der Ziel-Pixel-Gerätetest nach S10a gescheitert ist — Befund: <Gerät, Szenario, Zahlen hier einfügen>.

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/product-map-lod von origin/main. Voraussetzung: S10a gemerged + der dokumentierte Messbefund oben.

Verbindliche Spec: docs/launch-master-plan.md § „Session 10b" + Leitplanken 1/4 — kein LOD-System allein wegen einer Knotenzahl; kleinstes wirksames Design (echtes LOD, Viewport-Culling ODER progressive Batches; CSS-display:none zählt nicht).

Verifikation: Nachmessung auf demselben Gerät/Szenario wie der Befund; ohne messbare Verbesserung wird der Refactor verworfen · Map-Smoke aus S8 grün · die vier PR-Gates.
Abschluss: Impl-Report mit Vorher/Nachher. Kein Commit/PR, bis ich „fertig" sage.
```

---

## Launch-Readiness — finales Release-Gate

**Ziel:** Einmalig belegen, dass alle Produktionszustände GLEICHZEITIG stimmen; dann Gate-off + Live-Crawl.

```text
Launch-Readiness — finales Release-Gate (Belegpaket, Gate-off, Live-Crawl).

Worktree: C:\Users\Phil\chrono-lexicanum (E8-Ausnahme laut docs/launch-master-plan.md). Frischer Branch codex/session-<NNN>-launch-readiness von origin/main. Voraussetzung: alle Muss-Sessions (S1a–S10a) gemerged; Content-Freeze aktiv.

Verbindliche Spec: docs/launch-master-plan.md § „Launch-Readiness" (12 Punkte) + die Runbooks aus S1a (Content-Release) und S5 (Launch).

Ablauf:
1. Die 12 Punkte der Reihe nach abarbeiten und JEDEN mit Beleg (Kommando + Ergebnis) in einem Launch-Protokoll unter sessions/ dokumentieren. Was du selbst prüfen kannst (Migrationsstand, Drift, Rollen-Negativtests, Snapshot-Manifest, Audio-Header, lokale Smokes, kalter/warmer Production-Smoke), prüfst du; was mich braucht (Vercel-Env/Deployment-Protection, Domain/DNS, Gate-Flip, physische Pixel-Abnahme), legst du mir als klaren Einzelschritt vor und WARTEST.
2. Der finale Snapshot läuft nach dem zweistufigen Release-Runbook (E4) — als eigener Batches-Release-PR; das Protokoll dieser Session bleibt ein separater Koordinations-PR (B3: kein gemischter Snapshot-/Evidence-PR).
3. Rollback-Ziel + konkreter Abort-Befehl stehen VOR dem Gate-Flip im Protokoll.
4. Nach meinem Go: Gate-off → neuer Production-Deploy → Live-Crawl-Smoke (robots, sitemap, canonicals, redirects, OG, keine noindex-/localhost-Reste, Analytics-/Error-Events kommen an).

Abschluss: vollständiges Protokoll als Session-Report; Koordinations-PR mit dem Protokoll, wenn ich „fertig" sage. Bei jedem roten Punkt: stoppen, melden, nicht weiterflippen.
```

---

## PL1 — Preview-Abbau (Post-Launch)

**Ziel:** Preview-Maschinerie entfernen, nicht nur deaktivieren.

```text
Post-Launch-Session PL1 — Preview-Abbau.

Worktree: C:\Users\Phil\chrono-lexicanum (E8, sofern die Ausnahme noch gilt — sonst Product-Worktree). Frischer Branch codex/product-preview-removal von origin/main. Voraussetzung: Launch stabil + mein explizites Go.

Verbindliche Spec: docs/launch-master-plan.md § „Session PL1".

Kernpunkte: Preview-Proxy/Gate-Branching entfernen; Login-/Invite-Code + lokale Console/API entfernen; Aktivierungsdaten löschen; preview_invite_activations per Migration droppen; Grant-Cleanup der S3a-Rolle; .env.example + Datenschutzerklärung anpassen.

Verifikation: Prod-Build grün, keine toten Imports; Migration idempotent im Rehearsal; die vier PR-Gates.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S7b — MediaPlayer-Split, Chrome, Assets (Post-Launch)

```text
Post-Launch-Session S7b — MediaPlayer-Split, Chrome, Asset-Cleanup.

Worktree: C:\Users\Phil\chrono-lexicanum (E8, sofern gültig). Frischer Branch codex/product-player-chrome-assets von origin/main. Voraussetzung: Launch erfolgt.

Verbindliche Spec: docs/launch-master-plan.md § „Session 7b". Leitplanke 4: Baseline + Nachmessung, sonst verwerfen.

Kernpunkte: MediaPlayer in Transport-Shell + lazy Advanced-UI; Chrome nicht laden, wo es nichts rendert; RouteMotionCanvas bei verborgenem Dokument pausieren; Asset-Cache-Header festlegen + LIVE nachmessen; hub.webp/aquila-Reste entscheiden; Home-SVG-Deko messen/begrenzen.

Verifikation: Player funktional identisch (ich teste im Browser, inkl. Popover + Tastatur) · Messwerte vorher/nachher · die vier PR-Gates.
Abschluss: Impl-Report unter sessions/. Kein Commit/PR, bis ich „fertig" sage.
```

---

## S11 — Wartbarkeit & Statusbereinigung (Post-Launch, zwei PRs)

```text
Post-Launch-Session S11 — Wartbarkeit & Statusbereinigung. Zwei getrennte PRs: erst Code, dann Doku.

Worktree: C:\Users\Phil\chrono-lexicanum (E8, sofern gültig). Voraussetzung: Launch erfolgt. Code-PR auf Branch codex/product-s11-cleanup; danach Doku-PR auf codex/session-<NNN>-s11-rollup.

Verbindliche Spec: docs/launch-master-plan.md § „Session 11" — die Behalten-/Gestrichen-Listen sind verbindlich (Leitplanken 1/7): KEIN generischer Entity-/Modal-Renderer, KEIN Hero-Scaffold, KEIN globales first(), KEINE Breakpoint-Normalisierung ohne konkreten Drift-Beleg.

Code-PR: gemeinsame Nav-Registry (SiteNav/SiteMenu-Duplikat); suppressHydrationWarning entfernen + reale Hydration-Ursache fixen; vorhandene roman-/Reduced-Motion-Helfer wiederverwenden; stale /werke-Kommentare + belegt toten Code raus; „Five questions" → „Four" falls noch offen (inkl. README). Refactors bleiben pixelgleich und decken kanonische + intercepted Routen ab.
Doku-PR: brain-Rollup (project-state/log/worklist) + sessions/README.md für die gesamte Launch-Strecke; npm run brain:lint -- --no-write grün.

Verifikation: die vier PR-Gates je PR; Pixelgleichheit nehme ich im Browser ab.
Abschluss: Impl-Report (im Doku-PR). Kein Commit/PR, bis ich je PR „fertig" sage.
```
