---
session: 2026-06-18-157
role: architect
date: 2026-06-18
status: implemented
slug: incremental-apply-default
parent: null
links:
  - 2026-05-30-107
  - 2026-06-16-152
  - 2026-06-17-154
  - 2026-06-18-156
commits: []
---

# Inkrementeller Apply wird Default — `db:rebuild` nur noch Disaster-Recovery

> **Supersedes Brief 156.** Brief 156 (Range-Cap + Podcast-Step im Rebuild-Orchestrator) ist in diesen Brief gefaltet — die Chain-Fixes brauchen beide Apply-Pfade, also gehören sie in *eine* kohärente Änderung. 156 ist zurückgezogen; dieser Brief trägt seinen Inhalt mit.
>
> **Rev 2026-06-18 nach Plan-Review (Codex).** Zwei Scope-Schärfungen eingearbeitet: (1) `db:drift` bleibt **klein** — read-only Health-Check (Verifies + Counts + Batch-Contiguity + Podcast-Artifact-Drift), **kein** exakter „DB == kompletter SSOT"-Deep-Diff (das wäre fast die vertagte Plan-Engine). (2) Das Mid-Chain-Versprechen ist **ehrlich abgeschwächt**: `db:sync` verhindert den Halb-Truncate-Horror, aber bei einem Fehlschlag mitten im Lauf können frühe Batches schon neu, späte noch alt sein — sicher, weil re-runnable, **nicht** „exakt konsistent". Plus: Targeted-Mode (`--only`) ist **gestrichen** — Default ist Voll-Roster-Re-Apply, Punkt.

## Goal

Den Weg, wie SSOT-Änderungen in die Live-DB kommen, vom destruktiven Full-Rebuild auf einen **nicht-destruktiven, idempotenten Inkrement-Apply als Default** umstellen. `db:rebuild` (TRUNCATE + From-Reset-Re-Derive) bleibt im Werkzeugkasten, wird aber explizit zur **Disaster-Recovery-Operation** degradiert, die man fast nie braucht. Dazu ein **read-only Drift-Check**, der dem Maintainer sagt, *ob/wann* ein echter Rebuild überhaupt gerechtfertigt ist.

Hintergrund: Der 96+Drukhari-Push am 2026-06-18 wurde als Full-`db:rebuild` gefahren und brach mit halb-truncatetem Prod ab (Brief 156-Analyse). Die Ursache war nicht ein einzelner Bug, sondern ein **Modell-Fehler**: der Rebuild — gebaut als Recovery-Werkzeug (Brief 107) — wurde zur Routine-Deployment-Methode gemacht (mein „ein finaler `db:rebuild` zieht alles zusammen rein"-Plan). Ein Full-Refresh muss *alles* in einem Schuss neu derivieren; eine einzige Lücke reißt den ganzen `works`-Bereich um. Die nötige Maschinerie für inkrementelles Arbeiten existiert längst — dieselbe Engine, die die Resolver-Wellen benutzen (`run-phase4-apply.sh <range>`), schreibt ständig idempotent und nicht-destruktiv in die Live-DB.

## Context

Was heute existiert (alles idempotent, alles nicht-destruktiv außer Reset/Rebuild):

- `run-phase4-apply.sh <config>` — re-applied eine oder mehrere Batch-Ranges idempotent (delete-then-insert pro Junction). **Das ist der Inkrement-Kern.** Resolver-Wellen fahren genau das gegen Prod, einzeln, im Normalbetrieb.
- Die Tail-Applies, jeweils idempotent gescopt: `apply:audiobook-narrators`, `apply:podcast`, `apply:timeline`, `apply:curation-overlay` — alle mit `--verify`-Modus (read-only Post-Condition).
- `db:reset-for-ssot --confirm` — **destruktiv** (`TRUNCATE works CASCADE`; Reference-Tabellen bleiben).
- `db:rebuild` (`scripts/db-rebuild.sh`) — **destruktiv**: Schritt 1 = Reset, Schritte 2–8 = die o.g. idempotenten Applies in der richtigen Reihenfolge. **Schlüssel-Beobachtung: Schritte 2–8 sind bereits der komplette nicht-destruktive Inkrement-Apply. Nur Schritt 1 (Truncate) macht das Ding gefährlich.**
- Eine `refresh:check` / `refresh:audit-artifacts`-Familie existiert bereits (CC: prüfen, ob das die Basis für den Drift-Check ist, statt neu zu bauen).
- `scripts/db-counts.ts` — read-only Zählung.

Zwei vorbestehende Lücken im Apply-Chain (aus Brief 156, hier mitgetragen, weil **beide** Pfade — Sync und Rebuild — sie teilen):

1. **Stale Apply-Scope.** `db-rebuild.config.json` cappt `w40k` bei `to: 57`; committed ist bis **w40k-060** (hh bis 030). Batches 058–060 (inkl. `siege-of-vraks`) fallen still aus dem Scope.
2. **Kein Podcast-Restore.** Der Chain hat keinen `apply:podcast`-Schritt; der Truncate wischt die 4 committeten Shows (`adeptus-ridiculous`, `lorehammer`, `luetin09`, `the-40k-lorecast`), und `apply:timeline` kann die `event-works`-Hooks darauf nicht auflösen.

Strang: **Batches** (`chrono-lexicanum-batches`), Code-Pfade `scripts/**`. Dieser Brief ist doc-only → landet direkt auf `main`; CC branchet von `main`.

Marktcheck (Bestätigung der Richtung): Full-Refresh / kill-and-fill skaliert nicht und bricht mit wachsender Komplexität; der robuste Default ist inkrementeller Upsert/Merge auf stabilen Keys bzw. Partition-Overwrite gebündelter Batches — beide idempotent. Drizzle kann Bulk-Upsert (`onConflictDoUpdate`) nativ; die Apply-Skripte nutzen das Muster bereits.

## Architektur-Entscheid

1. **Policy-Inversion.** Der Routine-Weg, Änderungen in die DB zu bringen, **truncatet nie**. Default ist ein nicht-destruktiver Inkrement-Apply.

2. **Ein nicht-destruktiver Sync-Verb (Vorschlag `db:sync`, Name verhandelbar).** Im Kern: der `db:rebuild`-Chain **ohne** Schritt 1 (Reset) — Schritte 2–8 idempotent über den **gesamten committeten Roster** (auto-abgeleitet, siehe Entscheid 4) + alle Tails inkl. Podcast. Safe beliebig oft laufbar. Der entscheidende Gewinn gegenüber dem Rebuild: **kein Truncate, also nie ein Halb-leerer `works`-Bereich** — die DB serviert durchgehend weiter. Was Sync **nicht** garantiert: dass ein Fehlschlag *mitten* im Lauf keinen Misch-Zustand hinterlässt — fällt Batch 40 von 90 aus, sind 1–39 ggf. schon neu appliziert, 40+ noch alt. Das ist akzeptabel, weil idempotent re-runnable (nochmal laufen → sauberer Endzustand), aber es ist **nicht** „zuvor servierte Daten bleiben exakt konsistent". Das wird der dokumentierte Default für „push meine Änderungen".

3. **`db:rebuild` wird Disaster-Recovery.** Definiere `db:rebuild` als `db:sync` + ein vorangestelltes confirm-gegatetes Truncate. Help-Text + Runbook sagen explizit: „Du brauchst das fast nie — nutze `db:sync`. Dies ist From-Clean-Recovery, wenn der Drift-Check echte Divergenz zeigt." Confirm-Gating bleibt.

4. **Apply-Scope deckt den GESAMTEN committeten Roster ab — auto-abgeleitet, nicht hand-gepinnt.** „Sync/Rebuild = alles Committed" ist die Definition; eine hand-gepinnte Obergrenze, die „alle" bedeuten soll, ist die Fehlerquelle (Brief 156). Plus **Preflight-Guard**: eine committed Batch außerhalb des Scopes lässt den Lauf **laut anhalten, bevor irgendwas passiert**, statt sie still zu droppen.

5. **Podcast-Restore ist fester Chain-Schritt**, platziert **nach** dem Korpus-Re-Apply und **vor** `apply:timeline` (Timeline-Hooks lösen gegen `works.id` auf).

6. **Read-only Health-Check, bewusst klein (Vorschlag `db:drift`, Name verhandelbar).** **Kein** exakter „DB == kompletter SSOT"-Vollvergleich in diesem Brief — das wäre fast die vertagte Plan-Engine (Out of scope). Stattdessen ein billiger Health-Check aus **bestehenden** Bausteinen: die `--verify`-Modi der Tails, Counts (`db-counts.ts`), **Batch-Contiguity** (committeter Roster lückenlos und vollständig im Apply-Scope), **Podcast-Artifact-Drift** (committete Shows vs. DB) und ggf. die `refresh:check`-Familie. Schreibt nie. Sagt dem Maintainer „sieht gesund aus" bzw. „hier stimmt was nicht — schau hin / ggf. Rebuild". Ein exakter Vollvergleich kommt später, **nur wenn** sich herausstellt, dass der Health-Check nicht reicht.

7. **Ein Maintainer-Modell, nicht sieben.** Der dokumentierte Alltags-Workflow ist für **jede** Änderung derselbe — egal ob 1 Buch, 3 Bücher, eine kleine Korrektur, eine neue Reference-Entity, Podcast-Folgen oder ein Timeline-Tail:

   ```
   Quelle (committete Datei) ändern  →  PR / Merge  →  npm run db:sync
   ```

   **Kein** Targeted-Mode (`--only`), **kein** neues DB-Apply-Log, **keine** extra Tabelle. Bei der heutigen Datenmenge (~2k Works) ist „voller Roster re-apply, aber nicht-destruktiv" die simpelste und robusteste mentale Logik. Das Runbook führt das als *den* Weg; die einzelnen `apply:*`-Verben bleiben als Bausteine existent, sind aber nicht der Maintainer-Pfad.

## Constraints

- **Bestehende idempotente Applies wiederverwenden — keine Apply-Logik neu implementieren.** Kein neuer Diff-/Plan-Engine in diesem Brief (das wäre die separat vertagte „`db:apply` mit Plan/Diff"-Stufe). `db:sync` ist ein dünner Chainer wie `db:rebuild` heute, nur ohne den Truncate.
- **Der Default-Pfad truncatet NIE.** Truncate lebt ausschließlich hinter dem confirm-gegateten `db:rebuild`.
- **Fail-Fast, Idempotenz, Confirm-Gating bleiben erhalten.** Zweimal `db:sync` → selber Endzustand. Ein gescheiterter Schritt bricht vor späteren ab, nonzero Exit, klare Marker.
- **Podcast nach Korpus, vor Timeline** (harte Ordering-Constraint).
- **Keine Version-Pins** (Stack-Policy; hier ohnehin nicht berührt).
- **Dieser Brief fährt KEINEN destruktiven Prod-Lauf.** Verifikation über Dry-Run / bestehende Test-Harnesses (`test:timeline`, `apply:* --dry-run`, `test:curation-overlay`, …). Ein echter `db:sync` gegen Prod ist eine getrennte Ops-Entscheidung des Maintainers, nach Merge.

## Out of scope

- **Die Live-Forward-Complete-Rettung** des aktuell degradierten Prod (Batches 58–60 + `apply:podcast --all` + `apply:timeline` + `apply:curation-overlay`) — läuft separat und manuell in der laufenden CC-Session; dieser Brief fasst Prod nicht an.
- **Die `db:apply`-mit-Plan/Diff-Stufe (Option B)** — ein einzelnes Verb, das erst einen Plan druckt und nur das Delta upsertet. Bewusst vertagt; `db:sync` (Voll-Roster-Re-Apply, idempotent, nicht-destruktiv) ist der einfache, sichere erste Schritt. Als Follow-up vormerken.
- **Serving-Layer-Rethink (Option C)** — DB als Build-Artefakt / statisch. Nicht jetzt.
- Interne Logik der einzelnen Applies, der Resolver-Engine, der Konsolidierungs-Skripte — unverändert.
- Der OQ-16(b) `primaryEraId`-Placeholder-Fix — eigener Brief.
- `consolidation-pass-2.config.json` — nicht mit-anfassen (bewusst entkoppelte Semantik). Auto-Derive gilt nur für den Sync/Rebuild-Scope.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Ein nicht-destruktiver Default-Apply (`db:sync` o.ä.) bringt die Live-DB per idempotentem Upsert auf den vollen committeten SSOT — gesamter Roster + alle Tails (override / audiobook / podcast / timeline / curation) — **ohne je zu truncaten**. Beliebig oft laufbar; ein Mid-Chain-Fehler hinterlässt nie einen Halb-leeren `works`-Bereich (Truncate gibt es nicht), sondern höchstens einen idempotent re-runnable Misch-Zustand (frühe Batches neu, späte alt) — ein erneuter Lauf führt zum sauberen Endzustand. Default ist **Voll-Roster-Re-Apply**; kein Targeted-/`--only`-Modus.
- [ ] Der Apply-Scope deckt **alle** committeten w40k+hh-Batches ab (heute w40k bis 060, hh bis 030), **auto-abgeleitet** vom committeten Bestand statt hand-gepinnt. Ein voller Lauf applied `siege-of-vraks` (Batch 059).
- [ ] **Preflight-Guard:** eine committed Batch außerhalb des Apply-Scopes lässt Sync **und** Rebuild **laut anhalten, bevor** geschrieben/truncatet wird (klarer Marker).
- [ ] Der Chain stellt die Podcast-Works wieder her (`apply:podcast -- --all`), **nach** Korpus-Re-Apply, **vor** `apply:timeline`. Die 4 Shows lösen in der Timeline-Resolution auf; die zuvor 6 unauflösbaren Referenzen sind weg (im Dry-Run/Test nachgewiesen).
- [ ] `db:rebuild` ist als `db:sync` + vorangestelltes confirm-gegatetes Truncate definiert und in Help-Text **und** Runbook explizit als **Disaster-Recovery** markiert („du brauchst das fast nie; nutze `db:sync`").
- [ ] Ein read-only Health-Check (`db:drift` o.ä.) meldet aus **bestehenden** Bausteinen (Tail-`--verify` + Counts + Batch-Contiguity + Podcast-Artifact-Drift, ggf. `refresh:check`) einen gesund/ungesund-Status, schreibt nie, und weist bei Auffälligkeit auf die Stelle hin. **Kein** exakter DB==SSOT-Vollvergleich in diesem Brief.
- [ ] Eine „Wie kriege ich Änderung X rein"-Tabelle im Runbook mappt jeden Änderungs-Typ auf *einen* Handgriff.
- [ ] Stale Inline-Kommentare in `db-rebuild.sh` (+ neuer Sync-Datei) und die Runbook-Spec spiegeln die Realität: Auto-Scope, Podcast-Step, Sync-vs-Rebuild-Trennung, korrekte Batch-Zahl.
- [ ] `npm run lint` + `npm run typecheck` grün; `npm run test:timeline` grün.

## Open questions

Bitte im Report beantworten — Inputs, keine Blocker:

- **Verb-Namen:** `db:sync` (nicht-destruktiver Default) + `db:drift` (read-only Check) ok, oder schlägst du klarere vor? (Contract-Frage, nicht Ästhetik — kurz begründen.)
- **Health-Check-Bausteine:** Welche der bestehenden Signale (Tail-`--verify`, Counts, Batch-Contiguity, Podcast-Artifact-Drift, `refresh:check`) deckst du tatsächlich ab, und deckt `refresh:check` schon Teile davon? (Granularität + Targeted-Mode sind **entschieden** — Voll-Roster, kein `--only`; Drift-Tiefe ist **entschieden** — Health-Check, kein Vollvergleich. Hier nur: was geht günstig mit Bestehendem.)
- **hh-Range:** heute bis 030 committed — bestätige, dass nichts außerhalb hängt.

## Notes

- Der elegante Kern: `db:sync` = `db:rebuild` **minus Truncate**. Wir *entfernen* hauptsächlich den gefährlichen Schritt aus dem Routine-Pfad und benennen die Trennung sauber — das ist mehr Weglassen als Draufbauen, im Sinne von „es ist zu viel geworden".
- Der Drukhari-Fall illustriert die Über-Vorsicht der alten Methode: eine neue Reference-Row (Fraktion) braucht **gar keinen** Rebuild — Reference-Tabellen überleben den Truncate. Unter dem neuen Modell ist „neue Fraktion" ein Reference-Upsert, „96 Korrekturen" ein `apply:curation-overlay`, fertig.
- Herkunft des Chains + Tail-Reihenfolge: Briefs 107 (Audio), 149 (Curation), 152 (Timeline). Der Podcast-Step ist der vierte Tail derselben Logik.
- Reihenfolge-Skizze (illustrativ, **nicht** die finale Nummerierung): `Korpus-Re-Apply → Podcast → Audiobook → Audiobook-Verify → Timeline → Timeline-Verify → Curation → Curation-Verify`. Sync lässt Schritt 1 (Reset) weg; Rebuild stellt ihn confirm-gegatet voran.
