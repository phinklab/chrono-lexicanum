# Launch-Master-Plan — Chrono Lexicanum (v2, nach Codex-Gegenreview)

**Stand:** 2026-07-10 · **Basis:** `main` @ `9977cd3` · **Quellen:** CC-Deep-Review (adversarial verifiziert) + Codex-Review (Build-/Bundle-Zahlen) + Codex-Gegenreview des v1-Plans (2026-07-10), Einarbeitung Punkt für Punkt gegen den Code verifiziert (Änderungslog am Ende).

**Kanonischer Ort ab S0:** `docs/launch-master-plan.md` auf `main`. Bis dahin ist jede Kopie außerhalb des Repos/eines PR eine Arbeitskopie.

## Entscheidungen

**Getroffen (Philipp, 2026-07-10):**

- **E1 — Build-Snapshot:** `next build` wird von der Live-DB entkoppelt; Prerender liest aus einem versionierten Snapshot. Postgres bleibt SSOT, der Snapshot ist ein mechanischer Abzug (Atlas-Muster).
- **E2 — Mini-Smoke-Set:** kleines Playwright+axe-Set statt ausgebautem Browser-Testnetz. Kein weiterer Ausbau. (Präzisiert in S8: ~6 Kernrouten × 2 Viewports + vier gezielte Interaktions-Smokes + ein Degradations-Smoke — immer noch bewusst klein.)
- **E3 — 92-vh-Zeremonie bleibt:** Such-/Filter-Ankünfte (q, Facet, Format, Author) landen direkt am Ergebnisbereich; organische Besuche behalten den Hero.

**Aus dem Gegenreview übernommen (2026-07-10):**

- **E4 — Content-Release ist zweistufig:** Content-Freeze → `db:sync` vollständig grün → Snapshot auf frischem Batches-Branch regenerieren → Manifest/Counts/Hashes/Diff prüfen → **der Snapshot-PR ist der Production-Deploy** → danach Revalidation (expliziter, fail-loud Post-Deploy-Befehl aus S3a — nie automatisch aus `db:sync`; B1, OQ-19-Preflight 2026-07-11) + Live-Smoke. Gilt für den Launch und jedes spätere Content-Release. Der v1-Satz „Regen in Apply/Sync verdrahten, damit kein Deploy mit altem Stand baut" war falsch herum: ein Daten-Merge deployt *vor* dem Post-Merge-Sync; „heilt sich via ISR" ist kein Releasevertrag und hilft z. B. einer beim Build erzeugten Sitemap nicht.
- **E5 — Launch-Gate erweitert:** S6, S7a, S8, S9 und S10a (Map-Payload + A11y) sind **Muss vor Gate-off**, nicht „stark empfohlen". Chronicle und Cartographer sind zwei der drei Kernwerkzeuge; bekannte Kernprobleme (Timeline-Keyhandler frisst Player-Pfeiltasten, klickbare divs, Pins ohne Tastaturpfad, 531–537 KB Home-/Podcast-RSC, ~260 KB CSS pro Route, 466-KB-Suggestions-Blob) launchen nicht mit. Map-LOD (S10b) nur, wenn die reale Ziel-Pixel-Messung nach S10a weiter scheitert.
- **E6 — Observability festgelegt, nicht in der Session offen:** Vercel Web Analytics + Speed Insights (datenschutzarm, kein Cookie-Banner-Zwang). Höchstens **ein** Error-only-Tracker dazu (ohne Replay, Tracing, personenbezogene Metadaten) — ob überhaupt: S0-Entscheidung. CSP-Einträge und Datenschutztext im selben Brief wie die Aktivierung. Keine zweite Analytics-/RUM-Schicht. (Hobby-Runtime-Logs sind kurzlebig und kein Client-Fehler-System.)
- **E7 — Strand-Reinheit:** keine Session überschreitet Pfad-Ownership (AGENTS.md/CLAUDE.md „halt and ask back"). Die v1-Mischsessions sind in a/b geteilt: S1→S1a (Batches)+S1b (Product/Plattform), S3→S3a (Batches)+S3b (Product); der Revalidation-Schritt wandert aus S2 nach S3a; S11-Doku und S11-Code sind getrennte PRs. Serielle Ausführung hebt die Inhalts-Ownership nicht auf; das Worktree-Routing selbst ist für die Dauer dieses Plans per E8 ausgesetzt.

**Nachtrag (Philipp, 2026-07-10, nach v2):**

- **E8 — Single-Worktree-Ausführung + Prompt-Betrieb:** Alle Launch-Sessions laufen seriell im **Koordinations-Worktree** `C:\Users\Phil\chrono-lexicanum` — bewusste, auf diesen Plan befristete Ausnahme vom Drei-Worktree-Routing (Übersichtlichkeit; das Routing schützt Parallelarbeit, die es hier per Arbeitsmodus nicht gibt). Der Koordinations-Worktree ist der einzige, der **alle** Pfade schreiben darf — `brain/**` + `sessions/README.md` sind pfadgebunden koordinations-exklusiv; „alles im Product-Worktree" hätte für S0, Rollups und den S11-Doku-PR doch wieder einen zweiten Worktree gebraucht. Unverändert bleiben: `main` read-only + alles per Task-Branch-PR, Branch-Namen nach Session-Typ, Strand-Reinheit des **PR-Inhalts** (E7). Session-Kickoff über `docs/launch-session-prompts.md` statt per-Session-Architect-Briefs; Impl-Reports bleiben. Nach dem Launch-Plan gilt wieder das normale Strand-Routing.

**In S0 entschieden (Philipp, 2026-07-11 · Session 194):**

1. **URL-Matrix final:** vollständige EN-Migration der Entity-Pfade — `/buch → /book`, `/charakter → /character`, `/fraktion → /faction`, `/welt → /world`; **`/person` bleibt** (bereits englisch-tauglich und deckt Autoren *und* Sprecher ab — `/author` wäre für reine Narrator-Einträge falsch); Compendium-Kategorie-Slugs → EN (`factions · primarchs · characters · worlds · authors`); `/ask/fraktion → /ask/faction`; die statischen Ask-Fraktions-Knoten kommen in die Sitemap. Vollständige Tabellen (kanonische Routen, Redirects inkl. Querystring-Regel, Sitemap-/Canonical-Zuordnung, `/api/revalidate`-Pfadliste, S4-Touchpoints): **Anhang A**.
2. **Kanonischer Host: `https://www.chrono-lexicanum.com`.** Die Domain `chrono-lexicanum.com` ist bei Strato registriert und bereits verdrahtet (verifiziert 2026-07-11): `www` ist auf das Vercel-Projekt aufgeschaltet (Preview-Gate antwortet dort mit den App-CSP-Headern), der Apex 308t Strato-seitig auf `www` und erhält dabei Pfad **und** Query (`/timeline?era=…` geprüft). `SITE_URL`, Canonicals, OG und Search Console nutzen `www`; Launch-Readiness Punkt 7 prüft zusätzlich, dass `chrono-lexicanum.vercel.app` nicht als zweiter indexierbarer Host lebt (Redirect auf `www` bzw. mindestens Canonical dorthin).
3. **Era-Wahrheit: Default übernommen** — Pauschalstempel entfernen, Bestand mechanisch aus Setting-Dates bucketen wo vorhanden, Rest `NULL` (Umsetzung S1a). Philipps Bedingung („darf die Chronicle-Seite nicht zerschießen") ist geprüft: die Chronicle liest ausschließlich die kuratierte `eras`/`events`/`event_works`-Spine (`src/lib/chronicle/loadTimeline.ts`) und nie `books.era_id` — der Era-Fix kann sie nicht beschädigen.
4. **Error-only-Tracker: ja** — genau einer, strikt error-only (kein Replay, kein Tracing, keine personenbezogenen Metadaten); Paketwahl + Aktivierung in S5, CSP-Einträge kommen aus S3b, Datenschutztext im selben PR (E6).

**Nachtrag — Werkstatt-Phase (Philipp, 2026-07-15 · Session 219).** Die Muss-Strecke S1a–S10a ist vollständig gemerged (PRs #240–#256); S10b ist durch die Geräteabnahme der Session 213 (Android-Canvas-Renderer, PR #260) faktisch erledigt. Für das verbleibende Programm gilt — bei Widerspruch gewinnt dieser Nachtrag gegenüber älteren Plan-Abschnitten:

- **W1 — Kein Launch-Zeitdruck.** Released wird erst, wenn (i) das Artist-Artwork vollständig ist **und** (ii) die gesamte Feature-Wunschliste ([`docs/post-launch-feature-ideas.md`](./post-launch-feature-ideas.md)) **besucht** wurde. „Besucht" heißt: jede Idee bekommt eine Bewertungsrunde und ein Maintainer-Urteil **„bauen / Backlog / verwerfen"** — nicht zwingend eine Umsetzung.
- **W2 — Werkstatt-Phase vor dem Gate.** Einstieg in der Reihenfolge **F2 → F1 → F3** (Idee 2 Doppelkauf-Warner → Idee 1 Status Imperialis → Idee 3c Statistiken), danach die übrigen Hauptideen (**4, 3a, 3b, 5, 6**) und der Anhang der Ideenliste als Kurz-Triage. Die „Perfektions-Kandidaten" aus der Worklist (Chronicle-Desktop-Restyle, BrandBeacon, Cartographer-Tails, Drukhari-Starter, Podcast-Aliasse, Galaspar/Myr, `arthas_moloch`, Charakter-Long-Tail) laufen durch dieselbe Triage mit demselben Urteils-Schema. Schema-Änderungen sind in dieser Phase zulässig; die Konvention „erst Ideas-Backlog (`brain/wiki/roadmap.md`), dann Brief" bleibt. Reihenfolge, Urteils-Ledger und Kickoff-Prompts: [`docs/werkstatt-roadmap.md`](./werkstatt-roadmap.md).
- **W3 — Qualitätspässe VOR dem Launch.** **S7b** wird vorgezogen (hinter dem Gate messbar; **eine finale Live-Messung wiederholt sich nach Gate-off**) und der **S11-Code-PR** läuft nach der Feature-Welle, pixelgleich wie spezifiziert. Der S11-Doku-Rollup bleibt hinter dem Gate-off (W5).
- **W4 — Preview-Gate bleibt an; Invite-Maschinerie ist tragende Infrastruktur.** Bis zum Launch laufen Artist-Previews über die preview-console mit einzeln widerrufbaren Codes. **PL1 (Preview-Abbau) läuft NICHT vor dem Launch.**
- **W5 — Release-Endspiel fix:** Content-Freeze → Launch-Readiness (12 Punkte, unverändert) → Gate-off als minimaler Flag-Flip → **stilles Fenster** (unangekündigt öffentlich: PL1, finale S7b-Live-Messung, S11-Doku-Rollup) → erst dann der Reddit-Post.
- **W6 — E8-Ausnahme verlängert** bis einschließlich Launch-Readiness (Single-Worktree-Betrieb im Koordinations-Worktree, PR-Inhalte bleiben strand-rein).

---

## Arbeitsmodus (gilt für jede Session)

- Sessions laufen **seriell**, eine pro CC-Session, **alle im Koordinations-Worktree `C:\Users\Phil\chrono-lexicanum` (E8)**, jeweils **frischer Task-Branch von `origin/main`** (`codex/product-<slug>` / `codex/ingest-batches-<slug>` / `codex/session-NNN-<slug>`), Abschluss per PR, Philipp merged.
- **Strand-Reinheit (E7) gilt dem PR-Inhalt:** jeder PR bleibt in den Pfaden seines Strangs; ein Auftrag, der fremde Pfade verlangt, wird in getrennte PRs geteilt, nicht „schnell mitgemacht". Das Worktree-Routing ist per E8 ausgesetzt.
- Session-Kickoff über die **Prompt-Sammlung [`docs/launch-session-prompts.md`](./launch-session-prompts.md)** (E8) — sie ersetzt für diesen Plan die per-Session-Architect-Briefs. Verbindliche Spec bleibt der jeweilige Plan-Abschnitt; bei Widerspruch gewinnt der Plan. Der Impl-Report pro Session bleibt. Die Statusbereinigung der Alt-Briefe passiert sofort (S0).
- Gates pro PR: `typecheck`, `lint`, `test`, `next build` (ab S1b in CI required, DB-frei), `brain:lint` wenn `brain/**` berührt.
- UI verifiziert Philipp im Browser; Messwerte (Buildzeit, Payload-KB, Knotenzahlen) werden **pro Session neu erhoben** und im Report festgehalten — keine Fortschreibung alter Zahlen, keine Headless-Loops.
- `brain/**` + `sessions/README.md` nur in **eigenen Koordinations-PRs** (S0, Rollup-PRs, S11-Doku-PR), nie im Strand-PR — unter E8 arbeitet ohnehin alles im Koordinations-Worktree; die Invariante bindet den PR-Schnitt.
- Während des Plans keine parallele Strang-Arbeit — zugleich Voraussetzung der E8-Ausnahme; wer parallelisieren will, kehrt zum Strand-Routing zurück.

## Leitplanken gegen Slop (gelten für jede Session)

1. Keine neue Abstraktion ohne mindestens **drei echte Consumer** oder einen **belegten** Drift-/Invariant-Fall.
2. Domänenspezifische Funktionen statt allgemeiner `utils`, Repository-/Service-Layer oder Result-Frameworks.
3. Kommentare erklären Invarianten und Gründe, nicht die Entstehungsgeschichte der Session.
4. Performance-Refactors brauchen Baseline **und** Nachmessung; ohne messbare Verbesserung werden sie verworfen.
5. Neue Dependencies nur für Playwright/axe und das in E6 gewählte Observability-Paket.
6. Keine Cache-Components-Migration, kein DB-Revisionsframework, kein volles Browser-Testnetz, kein Design-System-Rewrite im Launch-Scope.
7. Cleanup entfernt **belegten** Ballast; es „vereinheitlicht" nicht vorsorglich.
8. Acceptance prüft sichtbares Verhalten und Betriebszustände, nicht interne Architekturästhetik.

---

## Welle 0 — Ausführbarkeit herstellen

### Session 0 — Plan kanonisieren, Statusbereinigung, Launch-Entscheidungen  — Größe S · Strang: Koordination

Der v1-Plan lag untracked in einem via `.git/info/exclude` ignorierten Ephemeral-Worktree — weder langlebiges Projektdokument noch ausführbarer Auftrag. Solange die Alt-Briefe offen stehen, führt die vorgeschriebene Session-Start-Routine Implementer auf falsche Aufträge. Beides blockiert die Ausführung und wird zuerst behoben.

**Umfang:**

1. Diesen Plan als `docs/launch-master-plan.md` und die Session-Prompt-Sammlung `docs/launch-session-prompts.md` versionieren (Koordinations-PR).
2. **Brief 181** (`arch-product-prune-pass`, steht auf `open`) auf den real erreichten Status setzen; **Brief 182** (`arch-launch-tech`) als `superseded` durch diesen Plan markieren.
3. Sessions 185–192 in den Koordinations-Dokumenten nachziehen (`sessions/README.md`, project-state/log-Rollup).
4. **URL-Matrix festschreiben** (Vertragsbasis für S4/S5 — „englische kanonische Entity-Routen" allein ist keine Spezifikation): Detail- **und** Index-/Kategorierouten für character/faction/world/person(author); `/buch/[slug]`-Entscheidung; `/ask/fraktion`; Modal-Intercept-Routen; Admin-/Audit-Pfade; Redirect-Tabelle **inkl. Querystring-Verhalten**; Sitemap-/Canonical-Zuordnung; die Pfadliste von `/api/revalidate`.
5. **Kanonischen Production-Host + Domain/DNS** festlegen (S0-Entscheidung 2).
6. **Era-Entscheidung** treffen (S0-Entscheidung 3; Umsetzung in S1a).
7. **Observability bestätigen** (S0-Entscheidung 4).
8. **README.md neu schreiben:** der öffentliche Status („Phase 3 — Ingestion pipeline… 26 hand-curated books… apply-to-DB is the next step") ist um Monate/Größenordnungen veraltet (Crawler-Pipeline seit Brief 177 ausgebaut, ~889 Bücher); dort steht ebenfalls „five questions" (Ask hat vier).

**Fertig wenn:** Plan versioniert auf `main` · kein offener Brief zeigt auf überholte Aufträge · URL-Matrix, Host, Era- und Observability-Entscheidung im Plan dokumentiert · README beschreibt den Ist-Zustand.

---

## Welle 1 — Plattform stabilisieren

### Session 1a — Snapshot-Exporter, Manifest, Era-Fix, Release-Runbook  — Größe M–L · Strang: Batches

**Zweiteilung (OQ-19-Preflight, 2026-07-11): zwei PRs.** **PR 1** (Session „S1a"): Exporter, Era-Fix-Code, Tests, Release-Runbook — **keine Produktions-Writes** (kein `db:sync`/`apply:*`; lesende Probeläufe ok), keine committeten Artefakte. **PR 2** (Session „S1a-Snapshot", nach dem Merge): erster Lauf des Release-Runbooks — Content-Freeze → read-only Migrations-Head-Parität (Repo == DB; der Produktionsbeleg für `0015` steht noch aus — bei Abweichung Stopp, keine improvisierte Migration) → explizites Go → genau ein `db:sync` → Artefakte + Manifest auf frischem Batches-Branch; **dieser Snapshot-PR ist der Deploy** (E4); erst **nach** dem Deploy folgen Revalidation + Live-Smoke (B1). Ungemergter Branch-Code berührt die Produktions-DB nie; der Produktionszustand bleibt aus `main` reproduzierbar. Pfad-Ausnahme: PR 1 ergänzt **genau einen** `package.json`-Eintrag (`snapshot:regen`); alles Weitere an `package.json` bleibt S1b.

**Umfang:**

1. **Snapshot-Export** `scripts/build-snapshot.ts` (`npm run snapshot:regen`) — exportiert **nur die konkreten öffentlichen Build-Projektionen**, keine Pauschal-Kopie von sechs Domänen. Build-kritisch sind heute: Home (`revalidate=3600`), Podcast-Index (`revalidate=3600`), die kuratierten Entity-Prerender-Subsets der vier `[slug]`-Routen; ab S4 zusätzlich die Buch-Projektion, ab S5 die Sitemap-Quelle. **Nicht** im Snapshot: `/map` (liest bereits committetes `scripts/seed-data/map-worlds.json`, DB-frei), `/timeline`, `/ask`, `/archive` (searchParams-dynamisch), `/ask/fraktion` (committetes JSON), `/compendium` (force-dynamic). Export-Shapes = Loader-Rückgabeformen (Projektionen), abgestimmt mit S1b; diff-freundliche JSONs, committed (im Snapshot-PR). Die produktiven src-Loader importieren `server-only` und sind aus `tsx` nicht ausführbar — der Exporter implementiert die Projektionen mit eigenem DB-Zugriff unter `scripts/`; Typen aus `src/**` ausschließlich per `import type` (zur Laufzeit getilgt) + Contract-Tests gegen die Loader-Rückgabetypen; das Duplikat-Fenster endet in S1b (die Loader lesen dann den Snapshot). **Fail-closed:** DB-/Shape-Fehler werfen; leere Kernprojektionen, fehlende Hot-ID-Payloads oder unplausible Counts brechen den Lauf **vor** dem Schreiben ab — die src-Loader degradieren bei DB-Fehlern still zu `[]`/`null`, der Exporter darf dieses Muster nicht erben.
2. **Manifest:** Erzeugungszeitpunkt, Quell-Migrationsstand, Zeilen-Counts, Content-Hash pro **Datenartefakt** (das Manifest hasht sich nicht selbst) — die Prüfbasis für jeden Release-Diff (E4) und das Launch-Readiness-Gate. **Determinismus:** bei inhaltlich identischem Ergebnis übernimmt der Lauf den vorhandenen Erzeugungszeitpunkt — sonst wäre der Leerer-Diff-Test (zweiter Lauf) nie grün.
3. **Era-Fix (per S0-Entscheidung):** den Pauschalstempel `M41_ERA_ID = "time_ending"` aus dem Apply-Pfad entfernen (`scripts/book-apply-shared.ts:90-99` — der Kommentar dort erklärt das Feld selbst für „editorial wertlos"); Bestand mechanisch aus den Setting-Dates bucketen wo vorhanden, sonst `NULL`. Die öffentlichen Consumer sind verifiziert null-tolerant (`BookDetailView.tsx:129` und `ResultCard.tsx:46` rendern konditional); Ask-Ranking- und Such-Nulltoleranz verifizieren, nötige Einzeiler an S2/S6 melden statt hier cross-strand fixen. **Apply-Vertrag:** ein purer Helper bucketet `primary_era_id` beim Upsert mechanisch aus `scripts/seed-data/book-dates.json` × `eras.json` (`startY` bestimmt den Bucket; keine book-dates-Zeile ⇒ `NULL`; gilt für `--slug` wie `--all`; `apply:curation-overlay` bleibt als letzter Tail höher priorisiert); Apply und Tests nutzen denselben Helper. **Mit-Scope (alles Batches):** `apply-book.ts`-Header, `book-apply-shared.ts`-Kommentare, `scripts/test-apply-book.ts` (assertiert heute den Stempel), `scripts/runbooks/add-book-runbook.md`, `scripts/runbooks/weekly-refresh-runbook.md`. **Verboten ist nur der Platzhalter — `time_ending` ohne passende Setting-Date; echte M41-Bücher behalten `time_ending` zu Recht** (reguläre Era 41000–41999 in `eras.json`; aktuell fallen 44 von 97 book-dates-Einträgen per `startY` hinein). Acceptance ist die Dateninvariante — jede gesetzte `primary_era_id` ist aus einer Setting-Date ableitbar (Kurationsoverlay ausgenommen), ohne Setting-Date `NULL` — kein Grep nach dem Literal. Ein bekannt falscher Lore-Fakt wiegt für dieses Projekt schwerer als ein Performance-Prozentpunkt.
4. **Initiale Artefakte** entstehen **erst im S1a-Snapshot-PR** (nach Merge + Produktions-Sync per Runbook) — nach dem Era-Fix und nie aus ungemergtem Code, damit kein falscher oder nicht aus `main` reproduzierbarer Stand eingefroren wird.
5. **Release-Runbook (E4)** unter `scripts/runbooks/`: der zweistufige Content-Release-Ablauf inkl. read-only Migrations-Paritäts-Check vor jedem Produktionswrite, Prüfschritten (Manifest/Counts/Hashes/Diff) und dem Revalidation- + Live-Smoke-Abschluss.

**Fertig wenn (PR 1):** `snapshot:regen` ist deterministisch (Doppellauf ohne DB-Änderung ⇒ byte-identisch) und fail-closed · Era-Helper-Tests decken Bucket-Grenzen + `NULL`-Fall · `test:apply-book` grün auf den neuen Vertrag · Runbook committed · kein Produktions-Write, keine Artefakte im PR. **Fertig wenn (PR 2 / S1a-Snapshot):** Migrations-Parität belegt · genau ein vollständig grüner `db:sync` nach explizitem Go · Era-Invariante in der DB verifiziert (keine gesetzte `primary_era_id` ohne ableitende Setting-Date) · Artefakte + Manifest committed, zweiter Lauf ⇒ leerer Diff.

### Session 1b — DB-freie Build-Consumer, CI-Gate, Toolchain  — Größe M–L · Strang: Product/Plattform (src, next.config, .github, ESLint, package.json)

**Umfang:**

1. **Sofortschutz:** `experimental.cpus: 2` (verhindert bis zur Loader-Weiche 15 Worker × `max:5` gegen ~15 Pooler-Slots; darf als vorgezogener Mini-PR landen, falls vor S1b deployt werden muss).
2. **Loader-Weiche:** prerender-relevante Loader lesen beim Build aus dem Snapshot, zur Laufzeit (ISR-Revalidation, On-Demand-Entities, dynamische Routen, API) aus Postgres. **Harte Import-Regel:** gemeinsame Typen/Transformationen DB-frei; die Snapshot-Fassade DB-frei; der Live-Pfad wird **lazy importiert** — `src/db/client.ts` wirft bereits beim Import ohne `DATABASE_URL` (client.ts:20-24), ein statischer Import bräche jeden DB-freien Build.
3. **CI:** `next build` als required Check, **ohne/mit unerreichbarer `DATABASE_URL`** — beweist die Entkopplung dauerhaft.
4. **ESLint-Ignores:** `.claude/worktrees/**`, verschachtelte `.next`, `timeline-workshop/design-export/**` (aktuell 904 Fehler durch Traversal).
5. **Toolchain:** Clean-Install-Check (`npm ci` + `npm ls` ohne invalid); Audit-Policy für prod-Deps; `@anthropic-ai/sdk` → `devDependencies` (nur Skripte nutzen es — nicht löschen).
6. **Stale Kommentare/Krücken:** next.config-Prosa korrigieren (/compendium ist force-dynamic, nicht ISR; Crawler-Phase-3-Reste); `staticPageGenerationTimeout: 300` + `staticGenerationMaxConcurrency: 3` nach Neuvermessung zurückbauen.
7. **Messung:** Buildzeit vorher/nachher im Report.

**Fertig wenn:** Build mit unerreichbarer `DATABASE_URL` grün und öffnet keine DB-Verbindung · zwei aufeinanderfolgende Builds ohne Retry/Timeout · `eslint .` lokal < 60 s und grün · CI führt lint, typecheck, test, brain-lint, build als required aus · `npm ls` nach frischem `npm ci` ohne invalid.

### Session 2 — Fehlersemantik & Laufzeit-Caches  — Größe M · Strang: Product

**Umfang:**

1. **Schlanker Vertrag statt Result-Framework** (die drei Zustände found / not-found / upstream-unavailable bleiben nötig, aber als Konvention, nicht als Bibliothek): **Detail-Loader** liefern Daten oder `null` (echte Abwesenheit) und **werfen** bei DB-/Shape-Fehlern; **Index-Loader** liefern ein Array (auch legitim leer) und werfen bei Fehlern. Nur `null` führt zu `notFound()`; Throws landen in den vorhandenen Error-Boundaries. Gilt für Entity, Book, Archive, Podcasts (Index + Show), Compendium, Faction-Guide, Timeline. DB-Ausfall zeigt eine Fehlerfläche, nie 404 oder leeres Archiv.
2. **db-cache-Doppelaufruf entfernen** (`db-cache.ts:110-118`: der catch ruft `fn()` ein zweites Mal → 2× DB-Last im Incident) — löst sich im Zuge des Vertrags (Loader werfen, statt leer zu degradieren); stale-good-Verhalten erhalten.
3. **Cross-Request-Caching + Tags nachrüsten,** wo sie fehlen: `loadTimeline` (Headline-Route, bisher 0 Cache, 2 Round-Trips/Request) mit Tag `timeline`; `loadEntity` (cachedRead-Schicht wie `loadBook`) mit Entity-Tag; Podcast-Index/-Shows mit Tag `podcasts`. `CATALOGUE_TAGS` (db-cache.ts:48) entsprechend erweitern — damit entfällt mittelfristig die Pfad-Purge-Krücke für Entities.
4. **Ask-Caches:** `cachedAskBooks` bekommt Rejection-Eviction analog `matrixPromise` (**die hat sie bereits**, `matrix.ts:167-170` — Codex-Erstreview-Claim halbiert); TTL für beide ergänzen.
5. **Revalidation-Semantik korrekt benennen und wählen:** `revalidateTag(tag, "max")` ist laut Next-16-Doku **stale-while-revalidate** — die erste Anfrage nach dem Aufruf serviert noch den alten Stand; der Kommentar in `route.ts:99-101` („hard-purge") ist **falsch**. Entscheidung im Vertrag festhalten: SWR akzeptieren **oder** sofortige Expiration via `revalidateTag(tag, { expire: 0 })` (das dokumentierte Webhook-/Route-Handler-Pattern — Empfehlung für den Release-Revalidation-Befehl aus S3a, da Content-Releases selten und korrektheitsgetrieben sind). `/api/revalidate` und Kommentar entsprechend fixen. Präzisierung bleibt: Tag-/Path-Invalidierung wirkt auf Vercel cross-instance; nur die Memory-Extras sind per-Instanz (dokumentierter Tradeoff).
6. **DB-freie Tests:** Zustands-Matrix pro Loader (Daten/null/throw), Cache-Pfade cold/warm/fail, Eviction, Revalidation-Semantik.

**Fertig wenn:** DB-Ausfall erzeugt niemals 404 oder „leeres Archiv" · eine fehlgeschlagene Quelle wird pro Request genau einmal aufgerufen · rejected Promises vergiften keine Folge-Requests · Query-Zähler belegen Cold-/Warm-Verhalten · die gewählte Invalidierungs-Semantik ist benannt und getestet.

**Hinweis:** persistenter Archive-Cache erst in S6 (nach der Payload-Diät; 2-MB-Data-Cache-Limit). Der Release-Revalidation-Befehl (expliziter Post-Deploy-Schritt, kein Auto-Hook — B1) ist S3a (Batches).

### Session 3a — DB-Rollen, Migrations-Rehearsal, Release-Revalidation  — Größe M · Strang: Batches (+ `.github`)

**Umfang:**

1. **Explizite Allowlist statt Default-Grants:** die Runtime-Rolle bekommt SELECT nur auf die **aufgezählten öffentlichen Katalogtabellen** plus die tatsächlich nötigen INSERT/UPDATE auf `preview_invite_activations`. **Kein** pauschales SELECT auf künftige Tabellen (keine `ALTER DEFAULT PRIVILEGES`-Grants Richtung Runtime; Default-REVOKE von PUBLIC) — `submissions` enthält bereits E-Mail, Freitext und Review-Daten (`schema.ts:826-839`). Jede neue Tabelle wird bewusst freigegeben.
2. **Negativtests:** die Runtime-Rolle kann `submissions` nicht lesen und kein Katalog-DML/DDL ausführen.
3. **Credential-Trennung (Zielbild):** Vercel besitzt am Ende nur `RUNTIME_DATABASE_URL`; der Migrations-Workflow besitzt `MIGRATION_DATABASE_URL`; lokale Apply-/Ingest-Skripte nutzen weiterhin bewusst das privilegierte Credential. **S3a liefert Rolle, Grants, Credential und Doku — der Runtime-Consumer-Wechsel gehört ausdrücklich zu S3b (B2, OQ-19-Punkt 3):** `src/db/client.ts:18` liest heute `process.env.DATABASE_URL` und wirft beim Import ohne Wert; ein scripts-only Batches-PR kann den Cutover nicht abschließen. Übergangs- und Cutover-Reihenfolge stehen in § S3b.
4. **migrate.yml:** GitHub Environment mit Approval, `timeout-minutes`, minimale `permissions`; **CI-Rehearsal gegen frisches Postgres + zweiter idempotenter Lauf.** Dafür `scripts/migrate.ts` (erzwingt hart `ssl: "require"`, migrate.ts:26-30) um ein explizites TLS-Opt-out **nur für den CI-Service-Container** erweitern (`sslmode=disable` ausschließlich dort); Supabase bleibt TLS-required — `verify-full` bleibt der in `client.ts` dokumentierte, bewusst vertagte Follow-up.
5. **Release-Revalidation (B1, OQ-19-Punkt 2):** `db:sync` löst **keine** Revalidation aus — ein POST direkt nach dem Sync würde einen Deploy revalidieren, der noch gar nicht existiert (E4: der Snapshot-PR ist der Deploy). Stattdessen liefert S3a einen **expliziten, fail-loud Post-Deploy-Befehl** (eigenes npm-Script; derzeit ruft kein Skript den Endpoint, der Route-Docstring behauptet es): genau **ein** POST, Ziel aus `REVALIDATE_BASE_URL` (Script-Env), mit Timeout, Statusprüfung und klarer Recovery-Meldung bei Fehlschlag (manueller curl steht im Runbook und bleibt der Weg für Releases vor S3a). Das E4-Release-Runbook ruft ihn genau einmal **nach erfolgreichem Snapshot-Deploy** auf; bei Sync-, Snapshot- oder Deploy-Fehler findet keine Revalidation statt.
6. **Statement-Timeout:** bewusste Entscheidung treffen — `client.ts:69-71` dokumentiert die Vertagung (Pooler 6543 bräuchte `SET LOCAL`); Alternative: serverseitiges `statement_timeout` auf der Runtime-Rolle.
7. **.env-Hygiene:** tote Supabase-Vars aus `.env.example` raus; `RUNTIME_DATABASE_URL`, `MIGRATION_DATABASE_URL`, `REVALIDATE_BASE_URL` dokumentieren. (`REVALIDATE_TOKEN` steht dort bereits — .env.example:35; v1-Punkt korrigiert.)

**Fertig wenn:** Negativtests grün (submissions unlesbar, DDL/Katalog-DML verweigert) · Rehearsal migriert ein frisches Postgres und der zweite Lauf ist idempotent · der Revalidation-Befehl ist fail-loud belegt (Erfolgs- und erzwungener Fehlerfall, gegen eine Testumgebung — kein Produktions-POST) und im E4-Runbook eindeutig **nach** dem Snapshot-Deploy verankert · `db:sync` löst nachweislich keine Revalidation aus · Runtime-Rolle + `RUNTIME_DATABASE_URL`-Credential existieren und sind dokumentiert (Consumer-Wechsel + Vercel-Cutover: S3b; End-Verifikation „nur Runtime-Credential in Produktion": Launch-Readiness Punkt 6).

### Session 3b — CSP, Login, Health, Audio, Runtime-DB-Cutover  — Größe S–M · Strang: Product · **nach S3a**

**Umfang:**

1. **CSP:** `unsafe-eval` nur noch dev (isDev-Gate wie `connect-src`; verifiziert droppbar); `poweredByHeader: false`; die CSP-Einträge des E6-Observability-Pakets hier festschreiben (S5 aktiviert nur noch).
2. **Login timing-safe:** Proxy und API sind weitgehend timing-safe; konkret offen ist der direkte Vergleich in `login/actions.ts:25` (`timingSafeEqualStr` existiert und wird in der Revalidate-Route bereits benutzt).
3. **Healthcheck** bündeln/throttlen oder Readiness abtrennen.
4. **Audio:** committete signierte Supabase-URLs (JWT exp 2027-06-19) → tokenlose Public-Bucket-URLs, nach Range-/CORS-Check.
5. **Runtime-DB-Cutover (B2, OQ-19-Punkt 3):** `src/db/client.ts` liest `RUNTIME_DATABASE_URL` mit Übergangs-Fallback auf `DATABASE_URL` (lokal + Skripte bleiben unverändert auf dem privilegierten Credential). Reihenfolge, damit kein Deploy ohne gültige Runtime-URL entsteht: (1) S3a-Rolle + Credential existieren; (2) **Maintainer-Haltepunkt:** Philipp setzt `RUNTIME_DATABASE_URL` in Vercel, **bevor** dieser PR merged; (3) Merge + Deploy mit Fallback-Code; (4) nach verifiziertem Deploy entfernt Philipp das privilegierte `DATABASE_URL` aus Vercel (zweiter Haltepunkt). Launch-Readiness Punkt 6 verifiziert am Ende, dass Produktion nur noch das Runtime-Credential besitzt.

**Fertig wenn:** Prod-CSP ohne `unsafe-eval` · Login-Vergleich timing-safe · Audio spielt aus dem Public-Bucket (200/206 + Range belegt) · Healthcheck-Verhalten dokumentiert · die Runtime liest `RUNTIME_DATABASE_URL` (Fallback lokal belegt: Build/Boot grün mit nur der einen wie mit nur der anderen Variable) · beide Maintainer-Haltepunkte des Cutovers stehen als klare Einzelschritte im Report.

---

## Welle 2 — Launch-Vertrag

### Session 4 — Kanonische Routen & Book-ISR  — Größe M–L · Strang: Product · setzt die S0-URL-Matrix um · **muss vor S5**

**Umfang:**

1. **URL-Matrix aus S0 vollständig umsetzen (Anhang A):** kanonische Entity-Routen (Detail + Index/Kategorie), `/buch → /book`, Modal-Intercepts, 308-Redirects von den Alt-Pfaden **inkl. definiertem Querystring-Verhalten**, interne Links; `/werke`-Redirect bleibt.
2. **`/api/revalidate` mitziehen:** die `ENTITY_ROUTES`-Pfadliste ist hart deutsch kodiert (`route.ts:48-53`) — Teil **dieser** Session, sonst purgt der Release-Revalidation-Befehl nach der Migration ins Leere.
3. **Buchseite statisch machen:** Region-State in eine Client-Island; `headers()`/`searchParams` als Server-Dynamiktreiber entfernen; `/buch/[slug]` als SSG/ISR — damit wird die Buch-Projektion Teil des Snapshots (S1a-Exporter erweitern — als **S4b-Mini** direkt im Anschluss, eigener Batches-PR; muss vor S5 liegen, weil die Sitemap aus dem Snapshot liest).
4. **Smokes:** Redirects (mit Query), Canonicals, Modal-Intercepts.

**Fertig wenn:** alte Pfade 308en inkl. definierter Query-Behandlung · keine internen Links auf Alt-Pfade · Buchseite prerendert/ISR · Revalidate-Pfadliste zeigt auf die neuen Routen.

### Session 5 — SEO, Sharing, Observability & Launch-Runbook  — Größe M–L · Strang: Product · **nach S3b und S4**

**Umfang:**

1. **noindex build-/env-gated** (aktuell hart `robots: { index: false }` im Root-Layout). **Server-only `SITE_URL` statt `NEXT_PUBLIC_SITE_URL`:** der einzige Verbraucher ist serverseitig (`layout.tsx:69` metadataBase); Metadaten, Sitemap und Canonicals brauchen keine Browser-Variable, und `NEXT_PUBLIC_*` wird beim Build eingefroren (Env-Änderung wirkt erst im nächsten Deploy — eine Fußfalle, kein Feature). Prod-Build ohne Wert **scheitert**; CI setzt `https://example.invalid`; Vercel-Env wird vor dem Merge gesetzt (Runbook-Schritt).
2. **robots.ts, sitemap.ts** (den vorhandenen toten `listEntityIds`-Export nutzen; keine Podcast-Episoden-Fragmente als URLs; **die Sitemap liest aus dem Snapshot**, nicht live — sie entsteht beim Build). Canonicals + **Query-Policy aus der S0-Matrix (Anhang A)**: was ist für q, Filter, Facets, Sortierung, `focus`, Timeline-View, Pagination kanonisch, was trägt Canonical-auf-Basis/noindex.
3. **Title-Template-Doubling zentral fixen;** routen-spezifische OG-Daten statt Root-Vererbung; Favicon, Manifest, Default-OG-Bild; JSON-LD (WebSite, Book, Podcast wo sinnvoll).
4. **Observability per E6 aktivieren:** Vercel Web Analytics + Speed Insights; falls S0 den Error-Tracker bejaht hat: error-only-Setup (kein Replay/Tracing/PII), CSP kommt fertig aus S3b, Datenschutztext im selben PR; `global-error.tsx`.
5. **`public/lab/ofob/**`** (7 Prototypen, öffentlich sobald das Gate fällt) entfernen oder bewusst freigeben.
6. **Launch-Runbook schreiben** (ausgeführt wird es im Launch-Readiness-Schritt): Gate aus → **neuer Production-Deploy** (gebackenes noindex verschwindet nicht per Env-Flip!) → Live-Checks (Meta-Robots, robots.txt, Sitemap, Canonicals, OG, Redirects) → Search-Console-Property + Sitemap-Submission. **Rollback-/Abort-Kriterien definieren:** konkreter Befehl (Vercel Instant Rollback auf das letzte Gate-on-Deployment bzw. `PREVIEW_GATE` wieder aktivieren + Redeploy) und die Kriterien, wann er gezogen wird.

**Fertig wenn:** ein erzwungener Server- und Client-Fehler ist im gewählten System sichtbar (falls Tracker bejaht; sonst: Server-Fehler in Vercel-Logs nachgewiesen und der Verzicht dokumentiert) · Prod-Build ohne `SITE_URL` bricht · Sitemap/robots/Canonicals im lokalen Prod-Build verifiziert. Der **Live-Crawl-Smoke wandert ins Launch-Readiness-Gate** — vor Gate-off ist er definitionsgemäß nicht prüfbar.

---

## Welle 3 — Payload & Zugänglichkeit

### Session 6 — Such- & Archive-Payload  — Größe M–L · Strang: Product · **Muss (E5)**

**Umfang:**

1. **Suggestions-Blob (3.096 Einträge ≈ 466 KB JSON) aus dem initialen Flight** von Home, `/archive` **und** `/archive/podcasts` (alle drei importieren `loadUnifiedSearchIndex`): Laden erst bei Fokus/erster Eingabe; BrowseSearch-Ranking memoizen.
2. **Archive serverseitig paginieren/inkrementell laden — als Ergebnisbudget, nicht als Architekturvorgabe:** Suche, Filter, Sortierung, Counts und Facets arbeiten über den **ganzen Katalog**, nie nur die aktuelle Seite · `?focus` öffnet jedes Buch unabhängig von seiner Seite · Back/Forward und URL-State bleiben stabil · initialer DOM mit fester Obergrenze · die 7 toten Buchfelder entfernen. `seriesName` bleibt load-bearing für die Suche; `eraName` ist nach dem S1a-Era-Fix nur noch für echte Werte load-bearing (null-tolerant).
3. **Prefetch** auf sichtbare/wahrscheinliche Ziele begrenzen.
4. **Danach:** Archive vom per-Instanz-2,21-MB-Blob (`memoryCachedRead`) auf persistenten tagged Cache umstellen — **begrenzte Cache-Key-Kardinalität** (keine per-Query-Keys) und Einträge mit Sicherheitsabstand unter dem 2-MB-Limit.
5. **E3 umsetzen:** alle gefilterten Ankünfte (q, Facet, Format, Author — Home und direkt) landen am Ergebnisbereich; Hero bleibt für organische Besuche.

**Fertig wenn:** kein Suggestions-Blob im initialen HTML/RSC irgendeiner Route · Suche (inkl. Series-/Era-Treffer) funktional identisch und global korrekt (Stichprobe: Treffer/Facet-Counts von „Seite 12"-Büchern) · `?focus` auf ein tief paginiertes Buch funktioniert · Cache-Einträge < 2 MB mit Abstand · gefilterte Ankunft zeigt Ergebnisse ohne manuelles Scrollen · initialer Archive-DOM gedeckelt.

### Session 7a — CSS, Fonts, Hero-LCP  — Größe M · Strang: Product · **Muss (E5)**

**Umfang:**

1. **Route-spezifisches CSS** (Map/Timeline/…) aus dem globalen Bundle lösen (Stichprobe: ~260 KB raw CSS auf jeder Route); `63-fraktionen.css` löschen (100 % tot); bestätigte tote Podcast-Regeln raus. **Cross-Route-Navigation testen:** einmal geladenes globales CSS bleibt bei App-Router-Navigation im Client und kann später mit anderen Routen kollidieren — deshalb nicht nur Imports verschieben, sondern Navigationspfade prüfen und dort CSS Modules einsetzen, wo echte Isolation nötig ist.
2. **Cinzel entfernen** (rendert nie, reiner Fallback); Unicase nur im Timeline-Segment laden; Font-Preloads prüfen.
3. **Hero-LCP** als preload-scannbares, responsives Bild.
4. **Budgets (Lab-Proxy vor Launch, p75 via Speed Insights danach):** LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; Home-/Podcast-RSC deutlich unter der 531–537-KB-Stichprobe. Baseline **vor** den Änderungen messen (Leitplanke 4).

**Fertig wenn:** Budgets im Lab erreicht oder Abweichung konkret begründet · keine Style-Regression auf Cross-Route-Navigationspfaden (Philipp verifiziert im Browser) · Fonts ohne toten Ballast.

### Session 7b — MediaPlayer-Split, Chrome, Asset-Cleanup  — Größe S–M · Strang: Product · **vor dem Launch (Nachtrag 2026-07-15, W3); finale Live-Messung nach Gate-off**

**Umfang:** MediaPlayer in Transport-Shell + lazy Advanced-UI teilen; Chrome, das auf einer Route nichts rendert, dort nicht laden; RouteMotionCanvas bei verborgenem Dokument pausieren; Asset-Cache-Header explizit festlegen und **live nachmessen** (hinter dem Gate messbar; die Messung wiederholt sich einmal final nach Gate-off im stillen Fenster); `hub.webp`/`aquila.png`/`.aquila`-Reste entfernen oder bewusst nutzen; Home-SVG-Deko-Anteil messen/begrenzen.

### Session 8 — A11y- & Mobile-Fundament + Mini-Smoke-Set  — Größe M–L · Strang: Product · **Muss; das Set ist am Ende von S8 required**

**Umfang:**

1. **Blanket `outline: none` entfernen** (10-base.css); konsistenter `:focus-visible`-Ring inkl. Forced Colors.
2. **Kontrast über 1–2 semantische Text-Tokens** lösen statt global aufzuhellen — dieselben Tokens (`--cl-faint` 3,50:1, `--cl-blood` 2,77:1, `--sm-steel-dim` 3,24/2,92:1, `--cl-gold-dim` ≈ 3,1:1) dienen heute Text **und** Dekor; Text bekommt lesbare Token, dekorative Nutzungen dürfen dunkel bleiben.
3. **Reduced-Motion vollständig:** CSS-Durations **und** Delays (Hero-Content sonst bis 1,15 s unsichtbar) **und** die JS-Pfade — Smooth-Scroll, rAF-/Canvas-Animationen (Map/Timeline konkret in S9/S10 gegenprüfen).
4. **320-px-Hub-Suche fixen** (Spezifitätskonflikt 50-hub vs. 61-browse → 236,8 px breites Feld).
5. Skip-Link; `color-scheme: dark`.
6. **Touchziele ≥ 44 px auf coarse pointer** (Ask, Compendium, Podcasts, Modals, Browse). WCAG 2.2 AA verlangt 24 px als Minimum; 44 px bleibt das Mobile-Ziel — keine pauschale Desktop-Vergrößerung.
7. SiteMenu-/Sheet-Hintergrund für AT **inert**; Player-Popover als echtes Dialog-Fokusmodell (oder `role="dialog"` entfernen); Podcast-Headings H1→H2→H3; Artwork-Ratio/Alt-Strategie.
8. **Mini-Smoke-Set (E2, präzisiert) — am Ende dieser Session required, nicht „irgendwann wenn stabil":**
   - Läuft gegen den **Production-Build** (`next build` + `next start`), `PREVIEW_GATE=off`, ~6 Kernrouten × (320 px, 1280 px).
   - **Pro Route ein spezifischer Landmark-/Content-Assert** — verhindert, dass sechs Tests erfolgreich `/login` prüfen.
   - `pageerror`, `console.error` und unerwartete same-origin 4xx/5xx ⇒ **fail**.
   - axe: keine serious/critical-Funde ohne eng dokumentierte Ausnahme.
   - **Vier gezielte Interaktions-Smokes:** Menü-Fokus, Timeline-Pfeiltasten vs. Player-Volume-Slider, Map-Seek + Fokus-Restore, horizontaler Overflow. (axe erkennt nur einen Teil der A11y-Probleme — diese vier sind der fehlende semantische Beweis, kein Testnetz-Ausbau.)
   - **Zwei Konfigurationen, nicht eine:** der Hauptlauf gegen eine erreichbare Dev-DB (sonst testen die Interaktions-Smokes degradierte Seiten); **plus ein separater Degradations-Smoke** mit unerreichbarer DB, der belegt, dass Kernrouten mit Fehlerfläche antworten — nie 404/leer (prüft den S2-Vertrag im echten Prod-Build).
   - **CI-Zuschnitt:** required ist mindestens der DB-freie Teil (Landmark-Asserts auf den Prerender-Routen, axe, Degradations-Smoke). Der Interaktions-Hauptlauf läuft in CI über die Least-Privilege-Runtime-Rolle aus S3a (Read-only-Secret) — oder, falls dagegen entschieden wird, als dokumentierter lokaler Pflichtlauf vor jedem Merge; die Entscheidung fällt in S8 und steht im Report.
   - Kein weiterer Ausbau darüber hinaus.

**Fertig wenn:** das Set ist in CI **required** und grün · axe-Ausnahmen einzeln dokumentiert · Fokus überall sichtbar · 320-px-Suche nutzbar.

### Session 9 — Chronicle: Tastatur, Screenreader, Mobile  — Größe M · Strang: Product · **Muss (E5)**

**Umfang:**

1. Coarse-Pointer-Phones defaulten auf **Index-View** (`?view=cine` bleibt Opt-in).
2. Index-Zeilen + Minimap als **echte Controls** (Buttons, Auswahlzustand programmatisch — heute teils klickbare divs).
3. Globalen keydown **auf die Stage begrenzen + Target-Guard** — Inputs und der Player-Volume-Slider behalten ihre Pfeiltasten (aktueller Konflikt!).
4. Text serverseitig rendern; **genau eine** SR-Ankündigung statt Zeichenstrom; Intro fokussierbar/dismissbar, Hintergrund währenddessen inert; Touchziele 44 px (coarse pointer); Forced Reflow im Scroll-Handler entfernen; rAF-/Scroll-Animationen respektieren Reduced Motion (S8-Punkt 3 hier konkret).

**Fertig wenn:** komplette Timeline nur per Tastatur bedienbar · Player-Slider behält Pfeiltasten · Index-View ist der Coarse-Pointer-Default.

### Session 10a — Cartographer: Payload & A11y  — Größe M–L · Strang: Product · **Muss (E5)**

**Umfang:**

1. **Payload-Zahlen zu Session-Beginn neu messen** (works-Arrays zuletzt 161–163 KB ≈ 62 % des Map-Client-Payloads; world-blurbs-Chunk 272 KB, ein `import()` lädt **alle** Welten beim ersten Klick; ~5.500 SVG-Knoten; 1.055 Pins) — Counts sind Messwerte, keine Architekturkonstanten.
2. **Works/Blurbs aus dem initialen Payload — über den vorhandenen `PinSource.detail()`-Seam** (`pin-source.ts:7` benennt genau diesen Zweck: „detail() is the pressure valve … work lists move behind this call (lazy fetch) without any UI change"). Ob **ein** lazy Artefakt oder per-Welt-Fetch: anhand der **komprimierten Transfergröße** entscheiden, nicht dogmatisch.
3. **Zugänglicher Parallelpfad:** Weltliste/-suche statt 1.055 Tab-Stop-Pins; Seek als Combobox/Listbox; WorldPanel ankündigen/fokussieren/Fokus zurückgeben; Toggles mit `aria-pressed`/`aria-expanded`; Overture macht unsichtbare Controls inert; **VoyageTour-Keyhandler mit Target-Guard** (verifiziert: window-Listener ohne Guard); mobiles Sheet bewusst modal oder nichtmodal; Touchziele (coarse pointer).
4. Die Map-A11y-Vertagung in `brain/wiki/worklist.md` basiert auf der alten Map — für den neuen Cartographer neu entscheiden (Dokumentation im Koordinations-Rollup).

**Fertig wenn:** initialer Map-Payload ohne Works/Blurbs (Transfergröße im Report) · Weltliste + Seek vollständig tastaturbedienbar · Fokus-Restore belegt · Player-/Input-Tasten kollisionsfrei.

### Session 10b — Cartographer: Rendering/LOD  — Größe M · Strang: Product · **nur falls die Messung es erzwingt** — ✅ **faktisch erledigt (Nachtrag 2026-07-15):** die Geräteabnahme der Session 213 (Android-Canvas-Renderer, PR #260 — Pinch/Pan flüssig, Flicker weg) hat den Messbefund geschlossen; ein LOD-System wird nicht gebaut.

Erst nach S10a **auf dem Ziel-Pixel (reales Gerät) profilieren.** Reicht die Canvas-/Batching-Änderung aus S10a, entfällt S10b ersatzlos — es wird **kein LOD-System allein wegen einer Knotenzahl** gebaut (Leitplanken 1/4). Scheitert die physische Pixel-Verifikation weiterhin, dann: echtes LOD, Viewport-Culling oder progressive Batches — CSS-`display:none` zählt nicht.

---

## Launch-Readiness — das operative Release-Gate (genau einmal, protokolliert)

Viele grüne Einzel-PRs beweisen nicht, dass die Produktionszustände **gleichzeitig** stimmen. Vor Gate-off wird einmal das komplette Belegpaket erhoben und im Session-Report protokolliert (Runbooks aus S1a + S5).

**PR-Schnitt (B3, OQ-19-Punkt 4):** der finale Snapshot ist ein **Batches-Release-PR** (= Deploy, E4); das Launch-Readiness-Protokoll und Brain-/README-Rollups sind **separate Koordinations-PRs** — kein gemischter Snapshot-/Evidence-PR. Impl-Reports fahren wie üblich im jeweiligen Strand-PR mit.

1. Production-Migrationsstand + idempotentes Rehearsal-Log (S3a).
2. `db:drift` bzw. gleichwertiger Schema-Abgleich sauber.
3. Runtime-Rollen-Negativtests gegen die **Prod**-Rolle wiederholt (submissions unlesbar, kein DDL/DML).
4. Supabase Data-API-/RLS-Exposition geprüft.
5. Finaler Snapshot: Manifest, Counts, Hashes, Stichprobe der Hot-IDs (E4-Ablauf unter Content-Freeze).
6. Vercel-Env vollständig (`SITE_URL`, `RUNTIME_DATABASE_URL`, `REVALIDATE_TOKEN`, …) **und Produktion besitzt nur noch das Runtime-Credential** (das privilegierte `DATABASE_URL` ist nach dem S3b-Cutover entfernt); Deployment Protection, Preview-Gate-Zustand.
7. Custom Domain, DNS, kanonischer Host live.
8. Audio: 200/206, Range, MIME, CORS, echtes Browser-Playback.
9. Production-Smoke mit kaltem und warmem Cache.
10. Physische Pixel-Abnahme (Philipp, reale Geräte).
11. Rollback-Ziel benannt + konkreter Abort-Befehl griffbereit (aus S5).
12. **Gate-off → neuer Production-Deploy → Live-Crawl-Smoke:** robots, sitemap, canonicals, redirects, OG, keine noindex-/localhost-Reste, Error-Tracking + Analytics empfangen Events.

---

## Nach Gate-off (stilles Fenster, W5)

### Session PL1 — Preview-Abbau  — Größe M · Strang: Product (+ eine Migration) — **läuft NIE vor dem Launch (W4)**

Bis zum Launch ist die Invite-Maschinerie **tragende Infrastruktur** (Artist-Previews via preview-console, einzeln widerrufbare Codes — W4). Erst im stillen Fenster nach Gate-off wird sie laut bestehender Entscheidung **entfernt, nicht nur deaktiviert:** Preview-Proxy/Gate-Branching raus; Login-/Invite-Code + lokale Console/API raus; Aktivierungsdaten löschen; `preview_invite_activations` per Migration entfernen; Env-Dokumentation und Datenschutzerklärung an den neuen Zustand anpassen.

### Finale S7b-Live-Messung (s. § S7b — der Pass selbst läuft vor dem Launch)

### Session 11 — Wartbarkeit & Statusbereinigung (verschlankt)  — Größe S–M · Strang: Koordination (Doku-PR) + Product (Code-PR) — **getrennte PRs; Code-PR vor dem Launch nach der Feature-Welle (W3), Doku-Rollup im stillen Fenster (W5)**

**Behalten (belegte Duplikate/Fehler):**

1. Gemeinsame Nav-Registry (SiteNav/SiteMenu-Duplikat).
2. `suppressHydrationWarning` entfernen und die **reale** Hydration-Ursache fixen (kein globaler Suppressor).
3. Vorhandene `roman`-/Reduced-Motion-Helfer wiederverwenden statt Neuimplementierung.
4. Stale `/werke`-Kommentare + nachweislich toten Code entfernen; interne `/werke`-Bezeichner nach S4 auf Archive (Redirect + Legal-Prosa bleiben); Tailwind-als-Token-Motor knapp dokumentieren.
5. „Five questions" → „Four questions" in HomeExplore **und** README — darf in jedem früheren Product-PR mitfahren, je früher desto besser.
6. Doku-Seite: worklist-/project-state-Restpflege dieses Plans (Koordinations-Worktree).

**Gestrichen, außer es gibt bis dahin einen konkreten Drift-Beleg** (Leitplanken 1/7):

- Neuer generischer Entity-/Modal-Renderer (der Zero-Fork-Pfad existiert bereits).
- Allgemeiner Hero-Scaffold.
- Globales `first()`-Utility für lokale Dreizeiler.
- Pauschale Breakpoint-Normalisierung (760/761/820/960).
- Refactors, deren einzige Begründung ist, dass zwei Dateien ähnlich aussehen.

Strukturelle Refactors, die stattfinden, bleiben **pixelgleich** und decken kanonische + intercepted Routen ab. Die Cleanup-Session erfindet keine Architektur; sie entfernt belegten Ballast und falsche Aussagen.

---

## Reihenfolge & Launch-Gate (Reddit)

**Sequenz (aktualisiert per Nachtrag 2026-07-15):** S0 → S1a → S1a-Snapshot → S1b → S2 → S3a → S3b → S4 → S4b → S5 → S6 → S7a → S8 → S9 → S10a **(alles gemerged, PRs #240–#256; S10b per Session-213-Geräteabnahme erledigt)** → **Werkstatt-Phase** (F2 → F1 → F3, übrige Hauptideen, Anhang- + Perfektions-Triage; W1/W2) → **S7b** (vorgezogen, W3) → **S11-Code-PR** (pixelgleich, W3) → Content-Freeze → **Launch-Readiness** (12 Punkte) → Gate-off (Flag-Flip) → **stilles Fenster** (PL1, finale S7b-Live-Messung, S11-Doku-Rollup; W5) → Reddit-Post.

| Stufe | Schritte |
|---|---|
| **Vor allem anderen** | S0 (Plan kanonisieren, Briefstatus, URL-/Domain-/Era-/Observability-Entscheidungen) — ✅ erledigt |
| **Muss vor Gate-off** | S1a (+ S1a-Snapshot), S1b, S2, S3a, S3b, S4 (+ S4b-Mini), S5, S6, S7a, S8, S9, S10a — ✅ alle gemerged (PRs #240–#256) |
| **Bedingt** | S10b — ✅ entfällt: die Session-213-Geräteabnahme (Android-Canvas-Renderer, PR #260) hat den Messbefund erledigt |
| **Werkstatt-Phase (Nachtrag 2026-07-15)** | Feature-Wunschliste besuchen (F2 → F1 → F3, dann 4, 3a, 3b, 5, 6, Anhang-Triage) + Perfektions-Kandidaten-Triage; Urteil je Idee: bauen / Backlog / verwerfen |
| **Qualitätspässe vor Launch** | S7b (vorgezogen; finale Live-Messung nach Gate-off) · S11-Code-PR (nach der Feature-Welle, pixelgleich) |
| **Finales Gate** | Content-Freeze → Launch-Readiness: Belegpaket → Gate-off (Flag-Flip) → Live-Crawl → Rollback-Beleg |
| **Stilles Fenster (nach Gate-off, vor dem Reddit-Post)** | PL1 (Preview-Abbau), finale S7b-Live-Messung, S11-Doku-Rollup |

Das sind formal mehr, aber kleinere und eindeutig besitzbare PRs; die Codebasis wird dadurch nicht komplizierter. Die Erweiterung des Muss-Gates (E5) verschiebt den frühestmöglichen Launch bewusst nach hinten — Qualität der drei Kernwerkzeuge vor Launchdatum.

---

## Änderungslog v2 (Codex-Gegenreview vom 2026-07-10, CC-verifiziert)

**Übernommen** (Behauptungen gegen den Code geprüft, alle bestätigt):

1. **Zweistufiger Content-Release (E4)** — v1s Kausalkette „Regen im Apply-Workflow ⇒ kein Deploy mit altem Stand" war falsch herum.
2. **Snapshot-Scope konkretisiert** — /map ist bereits DB-frei (`map-worlds.json`), /timeline, /ask, /archive searchParams-dynamisch, /ask/fraktion committed JSON, /compendium force-dynamic; build-kritisch sind Home, Podcast-Index, kuratierte Entity-Prerenders (+ Buch ab S4, Sitemap ab S5). Statt sechs Domänen-Dumps: exakte Build-Projektionen.
3. **Lazy-Import-Regel** — `src/db/client.ts` wirft beim Import ohne `DATABASE_URL` (client.ts:20-24); statischer Import bräche jeden DB-freien Build.
4. **S0 neu** — Plan lag untracked im via `.git/info/exclude` ignorierten Ephemeral-Worktree; Briefe 181/182 offen = Fehlleitungsrisiko für die Session-Start-Routine; README öffentlich grob veraltet („Phase 3, 26 Bücher, Crawler-Pipeline") inkl. „five questions".
5. **Strand-reine Session-Schnitte (E7)** — v1-S1/S2/S3/S11 verletzten Pfad-Ownership.
6. **Gate-Erweiterung (E5)** inkl. Auflösung des S8-Widerspruchs (Muss-Session mit non-blocking Check): das Set ist am Ende von S8 required; Spezifikation (Landmark-Asserts, pageerror/console/4xx-5xx ⇒ fail, axe-Ausnahmen dokumentiert, vier Interaktions-Smokes) übernommen.
7. **Era-Wahrheit vor Launch** — Pauschalstempel bestätigt (`book-apply-shared.ts:90-99`, Kommentar nennt das Feld selbst editorial wertlos) und öffentlich sichtbar (`ResultCard.tsx:46`, `BookDetailView.tsx:129`).
8. **URL-/SEO-Vertrag als S0-Tabelle**, `/api/revalidate`-Pfade (hart deutsch, `route.ts:48-53`) nach S4 verschoben; Query-Policy, Search Console, Rollback-Kriterien, Live-Crawl-Smoke ins finale Gate; **server-only `SITE_URL`** (einziger Verbraucher serverseitig, `layout.tsx:69`; Build ohne Wert scheitert).
9. **S2 schlank** — data/null/throw-Konvention statt Result-Framework; Tags für entities/timeline/podcasts; Revalidation-Befehl mit `REVALIDATE_BASE_URL`, Timeout, Statusprüfung, genau ein POST (nach S3a verschoben — Batches-Pfade; Timing per OQ-19-Preflight 2026-07-11 korrigiert: expliziter Post-Deploy-Schritt, nie direkt nach `db:sync`).
10. **Revalidation-Semantik** — gegen die Next-16-Doku aufgelöst: Codex hatte recht, `revalidateTag(tag,"max")` ist **stale-while-revalidate**; der Kommentar in `route.ts:99-101` („hard-purge") ist falsch. Für den Release-Revalidation-Befehl (S3a) wird `{ expire: 0 }` (dokumentiertes Route-Handler-Pattern) empfohlen; Entscheidung + Benennung im S2-Vertrag.
11. **S3-Grants als explizite Allowlist** — `submissions` enthält PII (`schema.ts:826-839`); Default-REVOKE, Negativtests, Credential-Trennung (Runtime-/Migrations-URL); `migrate.ts` erzwingt hart TLS (migrate.ts:26-30) → Opt-out nur für den CI-Service-Container; S3a/S3b mit eigenen „Fertig wenn".
12. **Launch-Readiness-Gate** — das 12-Punkte-Belegpaket als eigener, einmalig protokollierter Schritt.
13. **S6-Ergebnisbudgets, S7-Split (7a Muss / 7b Post-Launch) inkl. Cross-Route-CSS-Test, CWV-Budgets** (LCP ≤ 2,5 s / INP ≤ 200 ms / CLS ≤ 0,1, Lab-Proxy → Speed Insights).
14. **S10: `PinSource.detail()`-Seam** (Kommentar in `pin-source.ts:7` benennt exakt diesen Zweck), Transfergrößen-basierte Formatwahl, **LOD nur nach gescheiterter Ziel-Pixel-Messung** (S10b bedingt).
15. **Observability fixiert (E6)** statt „Systemwahl in der Session".
16. **S11 verschlankt** (Keep/Drop-Listen), **PL1 Preview-Abbau** als eigene Post-Launch-Session.
17. **P3-Korrekturen:** `REVALIDATE_TOKEN` steht bereits in `.env.example:35` (v1-S3-Punkt korrigiert); timing-safe konkret = `login/actions.ts:25`; 44 px nur auf coarse pointer (WCAG 2.2 AA min. 24 px); Kontrast über semantische Text-Tokens statt globalem Aufhellen; Reduced Motion inkl. JS/rAF/Canvas; Map-Counts pro Session neu messen.
18. **Leitplanken-Sektion** übernommen (+ Messwert-Regel als Nr. 9 im Arbeitsmodus).

**Angepasst** (übernommen, aber nicht wörtlich):

- **Smoke-DB-Konfiguration:** Codex' Ein-Konfig-Vorgabe („Production-Build, Gate off, unerreichbare DB") hätte die vier Interaktions-Smokes gegen degradierte Seiten laufen lassen (Timeline/Seek brauchen echte Daten). Stattdessen zwei Läufe: Hauptlauf gegen erreichbare Dev-DB + separater Degradations-Smoke für den S2-Vertrag.
- **Era-Default konkretisiert:** statt binärem „korrekt befüllen oder ausblenden" → Stempel entfernen + mechanisches Bucketing aus Setting-Dates wo vorhanden + Rest `NULL`; die UI-Consumer sind verifiziert null-tolerant, „Ausblenden" passiert damit gratis.
- **Briefe just-in-time statt alle vorab:** S0 bereinigt die Alt-Briefe und kanonisiert den Plan; die per-Session-Briefe schneidet Cowork jeweils vor der Session aus dem Plan-Abschnitt (13 Vorab-Briefe wären beim ersten Befund stale).
- **TLS „überprüfbar":** `verify-full` für Supabase bleibt der in `client.ts:33-46` dokumentierte, bewusst vertagte Follow-up (blind nicht validierbar, Blast-Radius alle Prod-DB-Zugriffe) — nicht in den Launch-Scope vorgezogen; das CI-Opt-out gilt ausschließlich dem Rehearsal-Container.
- **E2 präzisiert statt erweitert:** die vier Interaktions-Smokes + der Degradations-Smoke sind Teil des „kleinen Sets" (semantischer Beweis), kein Einstieg in ein Testnetz — die „kein weiterer Ausbau"-Klausel bleibt.

**Aus v1 unverändert weitergetragen:** E1–E3 · Sequenz S1→S2, S4 vor S5 · Archive-Cache erst nach Payload-Diät · Launch-Deploy-Punkt im Runbook (gebackenes noindex braucht neuen Deploy) · matrixPromise-Rejection-Eviction existiert bereits (`matrix.ts:167-170`) · statement_timeout ist eine dokumentierte Vertagung, kein Versäumnis (`client.ts:69-71`) · Five-questions-Copy-Bug · Strang-/Branch-Konventionen · explizite Messpunkte.

**Nachtrag (2026-07-10, nach v2):** E8 — alle Launch-Sessions laufen seriell im Koordinations-Worktree (Single-Worktree-Ausnahme; der PR-Schnitt bleibt strand-rein); Session-Kickoff über `docs/launch-session-prompts.md` statt per-Session-Architect-Briefs; S4b-Mini (Buch-Projektion → Snapshot) zwischen S4 und S5 eingefügt; S8-CI-Zuschnitt präzisiert.

**Nachtrag (2026-07-11, OQ-19-Preflight für S1a, review-verifiziert gegen den Code):** S1a in zwei PRs geteilt — Code-PR ohne Produktions-Writes; „S1a-Snapshot" führt nach dem Merge das Release-Runbook erstmals aus (Migrations-Paritäts-Check read-only, explizites Go, genau ein `db:sync`, Artefakte-PR = Deploy). Era-Acceptance als Dateninvariante präzisiert: echte M41-Bücher behalten `time_ending` (reguläre Era 41000–41999; 44 von 97 book-dates-Einträgen), verboten ist nur der Platzhalter ohne Setting-Date. Apply-Vertrag festgeschrieben (purer Helper aus `book-dates.json` × `eras.json`, `NULL` ohne Date-Zeile, gilt für `--slug` wie `--all`, Kurations-Overlay bleibt letzter Tail; Mit-Scope: `test-apply-book.ts`, `apply-book.ts`-Header, Add-Book- + Weekly-Refresh-Runbook). Exporter scriptseitig mit `import type`-Contract (src-Loader sind `server-only`, aus `tsx` nicht ausführbar) und fail-closed; Manifest-Zeitstempel deterministisch (Carry-forward bei identischem Inhalt); enge `package.json`-Ausnahme (nur der `snapshot:regen`-Eintrag). **OQ-19-Punkte 2–4 im selben Preflight entschieden (Session 195, von Philipp bestätigt):** `db:sync` löst keine Revalidation aus — S3a baut einen expliziten, fail-loud Post-Deploy-Befehl, den das E4-Runbook genau einmal nach erfolgreichem Snapshot-Deploy aufruft (B1); der `RUNTIME_DATABASE_URL`-Consumer-Wechsel in `src/db/client.ts` gehört mit Übergangs-Fallback und maintainer-gehaltenem Vercel-Cutover zu S3b (B2); Snapshot-Artefakte bleiben im Batches-Release-PR, Launch-Protokoll + Rollups bleiben separate Koordinations-PRs (B3). **OQ 19 ist damit vollständig geschlossen.**

---

## Anhang A — URL-Matrix (S0-Entscheidung, 2026-07-11 · Session 194)

Vertragsbasis für S4 (Umsetzung) und S5 (Sitemap/Canonicals). Grundsatz: die Site ist durchgehend englisch; die verbliebenen deutschen Pfade werden **vor** dem Launch einmalig migriert, solange keine SEO-Equity auf ihnen liegt.

### A.1 Kanonische Routen (Detail + Index je Entity-Typ)

| Fläche | Heute | Kanonisch ab S4 | Anmerkung |
|---|---|---|---|
| Buch-Detail | `/buch/[slug]` | **`/book/[slug]`** | wird in S4 zugleich SSG/ISR; `?store=` bleibt Query der Client-Island |
| Buch-Index | `/archive` | `/archive` (bleibt) | kanonischer Werk-Index seit Session 139 |
| Charakter-Detail | `/charakter/[slug]` | **`/character/[slug]`** | ISR 24 h + Hot-Subset-Prerender, unverändert |
| Fraktions-Detail | `/fraktion/[slug]` | **`/faction/[slug]`** | dito |
| Welt-Detail | `/welt/[slug]` | **`/world/[slug]`** | dito |
| Personen-Detail | `/person/[slug]` | **`/person/[slug]` (bleibt)** | deckt Autoren **und** Sprecher ab (`narrator`/`co_narrator`-Rollen im Entity-Loader) |
| Entity-Indizes | `/compendium/[category]` mit `fraktionen · primarchen · charaktere · welten · autoren` | `/compendium/` + **`factions · primarchs · characters · worlds · authors`** | Compendium bleibt die Index-Fläche; keine neuen Top-Level-Indizes (Leitplanke 1) |
| Fraktionen-Kurzweg | `/fraktionen` → `/compendium/fraktionen` | `/fraktionen` → **`/compendium/factions`** | Ziel-Update des bestehenden Redirects — kein Doppel-Hop |
| Ask-Fraktionstool | `/ask/fraktion/[[...segments]]` | **`/ask/faction/[[...segments]]`** | voll statisch (committetes JSON); Segment-Slugs unverändert |
| Podcasts | `/archive/podcasts`, `/archive/podcasts/[slug]` | bleibt | Episoden bleiben `#ep-…`-Fragmente, nie eigene URLs |
| Übrige Seiten | `/`, `/timeline`, `/map`, `/ask`, `/compendium`, `/artwork`, `/imprint`, `/privacy` | bleiben | bereits englisch/neutral |

**Modal-Intercepts** folgen 1:1: `@modal/(.)book · (.)character · (.)faction · (.)world · (.)person` (+ catchAll/default unverändert). Intercepts erzeugen keine eigenen URLs — Adresse ist immer die kanonische Detailroute; kein eigener Sitemap-/Canonical-Eintrag.

**Admin-/Audit-/Maschinenpfade** (unverändert, alle noindex + nie in der Sitemap): `/ingest`, `/ingest/[runId]`, `/book/[slug]/audit` (wandert mit dem Buch-Pfad; `isAdminPath`-Regex in `src/proxy.ts` zieht S4 nach), `/login` (bis PL1), `/healthz`, `/api/revalidate`, `/api/preview-invites`.

### A.2 Redirect-Tabelle

**Querystring-Regel (gilt für jede Zeile):** 308; der Querystring wird **unverändert weitergereicht** (Next-Default bei `redirects()`) — kein Redirect schreibt Parameter um oder verwirft sie. `#`-Fragmente erreichen den Server nie und werden vom Browser nach dem 308 wieder angehängt (dokumentiertes `/podcasts`-Verhalten, gilt fort).

| Quelle | Ziel (308) | Query-relevant |
|---|---|---|
| `/buch/:slug` | `/book/:slug` | `?store=` überlebt |
| `/buch/:slug/audit` | `/book/:slug/audit` | — |
| `/charakter/:slug` | `/character/:slug` | — |
| `/fraktion/:slug` | `/faction/:slug` | — |
| `/welt/:slug` | `/world/:slug` | — |
| `/compendium/fraktionen` | `/compendium/factions` | `q/alignment/sort` überleben |
| `/compendium/primarchen` | `/compendium/primarchs` | dito |
| `/compendium/charaktere` | `/compendium/characters` | dito |
| `/compendium/welten` | `/compendium/worlds` | dito |
| `/compendium/autoren` | `/compendium/authors` | dito |
| `/fraktionen` | `/compendium/factions` (Ziel-Update) | `alignment=chaos` etc. überleben |
| `/ask/fraktion/:path*` | `/ask/faction/:path*` | — |
| Timeline-Legacy `?book=<slug>` | interner Redirect neu auf `/book/<slug>` | S4 |

**Bestand bleibt unverändert:** `/buecher → /archive` · `/werke → /archive` · `/podcasts → /archive/podcasts` · `/podcasts/:slug → /archive/podcasts/:slug`. `/person` braucht keinen Redirect (Route bleibt).

### A.3 Sitemap- und Canonical-Zuordnung (Vertragsbasis für S5)

| Route | Sitemap | Canonical / Query-Policy |
|---|---|---|
| `/` | ja | self |
| `/archive` | ja | self; **alle** Filter-Queries (`q, faction, format, facet, sort, focus`) → Canonical auf Basis, nie in der Sitemap |
| `/archive/podcasts` + Show-Seiten | ja | self; Episoden nur als Fragmente |
| `/timeline` | ja | self; `?era`/`?view` → Canonical auf Basis (Ansichten eines Dokuments) |
| `/map` | ja | self (keine URL-Params) |
| `/ask` | ja | self; Antwort-/`deeper`-Queries → Canonical auf Basis |
| `/ask/faction` + Fraktions-/Subfraktions-Knoten | **ja** (statisch generiert, kuratiert — Long-Tail „where to start with X") | self |
| `/compendium` + 5 Kategorien | ja | self; `q/alignment/sort` → Canonical auf Basis |
| `/book/[slug]` (~896) | ja (aus dem Snapshot, ab S4b) | self; `?store` → Canonical auf Basis |
| `/character` · `/faction` · `/world` · `/person` `[slug]` (~1.300, via `listEntityIds`) | ja | self |
| `/artwork`, `/imprint`, `/privacy` | ja | self |
| `/login`, `/ingest*`, `/book/*/audit`, `/healthz`, `/api/*` | **nie** | noindex |
| Pagination (falls S6 URL-sichtbar paginiert) | nein | Canonical auf Basis; Buch-Discovery läuft über die Detail-URLs |

### A.4 `/api/revalidate`-Pfadliste nach S4

`ENTITY_ROUTES` = `/character/[slug]` · `/world/[slug]` · `/faction/[slug]` · `/person/[slug]`. **Plus** `/book/[slug]`, falls der Katalog-Tag die neue ISR-Buchseite nicht abdeckt (Buch liest über die getaggte `cachedRead`-Schicht — S4 verifiziert das und ergänzt den Path-Purge nur bei Bedarf).

### A.5 Bekannte S4-Touchpoints (Scope-Beleg, kein Zusatzauftrag)

`next.config.ts` (`redirects()`) · `src/proxy.ts` (`isAdminPath`) · `src/app/api/revalidate/route.ts` (`ENTITY_ROUTES`) · `src/lib/work-links.ts` · `src/lib/compendium/loader.ts` (hrefs) · `src/lib/compendium/primarchs.ts` (absorbed-Redirect) · `@modal`-Ordner · Entity-/Buch-Routenordner · Timeline-Legacy-`?book=`-Redirect · `EntityBackLink`.
