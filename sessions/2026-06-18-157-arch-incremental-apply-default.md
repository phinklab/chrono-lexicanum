---
session: 2026-06-18-157
role: architect
date: 2026-06-18
status: open
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

2. **Ein nicht-destruktiver Sync-Verb (Vorschlag `db:sync`, Name verhandelbar).** Im Kern: der `db:rebuild`-Chain **ohne** Schritt 1 (Reset) — Schritte 2–8 idempotent über den **gesamten committeten Roster** (auto-abgeleitet, siehe Entscheid 4) + alle Tails inkl. Podcast. Safe beliebig oft laufbar. Bricht ein Schritt ab, bleibt die zuvor servierte Daten konsistent live (kein Halb-Truncate-Zustand) — man fixt und re-runt. Das wird der dokumentierte Default für „push meine Änderungen".

3. **`db:rebuild` wird Disaster-Recovery.** Definiere `db:rebuild` als `db:sync` + ein vorangestelltes confirm-gegatetes Truncate. Help-Text + Runbook sagen explizit: „Du brauchst das fast nie — nutze `db:sync`. Dies ist From-Clean-Recovery, wenn der Drift-Check echte Divergenz zeigt." Confirm-Gating bleibt.

4. **Apply-Scope deckt den GESAMTEN committeten Roster ab — auto-abgeleitet, nicht hand-gepinnt.** „Sync/Rebuild = alles Committed" ist die Definition; eine hand-gepinnte Obergrenze, die „alle" bedeuten soll, ist die Fehlerquelle (Brief 156). Plus **Preflight-Guard**: eine committed Batch außerhalb des Scopes lässt den Lauf **laut anhalten, bevor irgendwas passiert**, statt sie still zu droppen.

5. **Podcast-Restore ist fester Chain-Schritt**, platziert **nach** dem Korpus-Re-Apply und **vor** `apply:timeline` (Timeline-Hooks lösen gegen `works.id` auf).

6. **Read-only Drift-Check (Vorschlag `db:drift`, Name verhandelbar).** Berichtet, ob die Live-DB dem committeten SSOT entspricht — zusammengesetzt aus den **bestehenden** `--verify`-Modi + Counts (und ggf. der `refresh:check`-Familie). Schreibt nie. Empfiehlt einen Rebuild **nur** bei echter Divergenz (im Normalbetrieb ~nie).

7. **Eine „Wie kriege ich Änderung X rein"-Tabelle** im Runbook: pro Änderungs-Typ *ein* Handgriff (neue Batch / neue Reference-Entity / Korrekturen / Timeline / Podcast → jeweils der inkrementelle Befehl, bzw. schlicht `db:sync`). Ein mentales Modell statt sieben.

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

- [ ] Ein nicht-destruktiver Default-Apply (`db:sync` o.ä.) bringt die Live-DB per idempotentem Upsert auf den vollen committeten SSOT — gesamter Roster + alle Tails (override / audiobook / podcast / timeline / curation) — **ohne je zu truncaten**. Beliebig oft laufbar; ein Mid-Chain-Fehler lässt die zuvor servierten Daten intakt und konsistent (kein Halb-Truncate-Zustand).
- [ ] Der Apply-Scope deckt **alle** committeten w40k+hh-Batches ab (heute w40k bis 060, hh bis 030), **auto-abgeleitet** vom committeten Bestand statt hand-gepinnt. Ein voller Lauf applied `siege-of-vraks` (Batch 059).
- [ ] **Preflight-Guard:** eine committed Batch außerhalb des Apply-Scopes lässt Sync **und** Rebuild **laut anhalten, bevor** geschrieben/truncatet wird (klarer Marker).
- [ ] Der Chain stellt die Podcast-Works wieder her (`apply:podcast -- --all`), **nach** Korpus-Re-Apply, **vor** `apply:timeline`. Die 4 Shows lösen in der Timeline-Resolution auf; die zuvor 6 unauflösbaren Referenzen sind weg (im Dry-Run/Test nachgewiesen).
- [ ] `db:rebuild` ist als `db:sync` + vorangestelltes confirm-gegatetes Truncate definiert und in Help-Text **und** Runbook explizit als **Disaster-Recovery** markiert („du brauchst das fast nie; nutze `db:sync`").
- [ ] Ein read-only `db:drift` (o.ä.) berichtet, ob die Live-DB dem committeten SSOT entspricht (Wiederverwendung der bestehenden `--verify`-Logik + Counts / `refresh:check`-Familie), nonzero/klare Ausgabe, schreibt nie, und empfiehlt Rebuild nur bei echter Divergenz.
- [ ] Eine „Wie kriege ich Änderung X rein"-Tabelle im Runbook mappt jeden Änderungs-Typ auf *einen* Handgriff.
- [ ] Stale Inline-Kommentare in `db-rebuild.sh` (+ neuer Sync-Datei) und die Runbook-Spec spiegeln die Realität: Auto-Scope, Podcast-Step, Sync-vs-Rebuild-Trennung, korrekte Batch-Zahl.
- [ ] `npm run lint` + `npm run typecheck` grün; `npm run test:timeline` grün.

## Open questions

Bitte im Report beantworten — Inputs, keine Blocker:

- **Verb-Namen:** `db:sync` (nicht-destruktiver Default) + `db:drift` (read-only Check) ok, oder schlägst du klarere vor? (Contract-Frage, nicht Ästhetik — kurz begründen.)
- **Sync-Granularität:** Voll-Roster-Re-Apply pro Lauf (einfachstes mentales Modell, bei ~2k Works schnell genug) als Default — plus optionaler `--only <range|overlay>`-Fast-Path für „ich hab nur X geändert"? Mein Lean: Voll-Roster default, targeted als Power-User-Flag.
- **Drift-Check-Tiefe:** Count-Level vs. exakter Set-/Value-Vergleich (Wiederverwendung der `--verify`-Comparisons). Lean: die bestehenden exakten Vergleiche nutzen, da sie schon da sind. Deckt die `refresh:check`-Familie das teilweise schon ab?
- **hh-Range:** heute bis 030 committed — bestätige, dass nichts außerhalb hängt.

## Notes

- Der elegante Kern: `db:sync` = `db:rebuild` **minus Truncate**. Wir *entfernen* hauptsächlich den gefährlichen Schritt aus dem Routine-Pfad und benennen die Trennung sauber — das ist mehr Weglassen als Draufbauen, im Sinne von „es ist zu viel geworden".
- Der Drukhari-Fall illustriert die Über-Vorsicht der alten Methode: eine neue Reference-Row (Fraktion) braucht **gar keinen** Rebuild — Reference-Tabellen überleben den Truncate. Unter dem neuen Modell ist „neue Fraktion" ein Reference-Upsert, „96 Korrekturen" ein `apply:curation-overlay`, fertig.
- Herkunft des Chains + Tail-Reihenfolge: Briefs 107 (Audio), 149 (Curation), 152 (Timeline). Der Podcast-Step ist der vierte Tail derselben Logik.
- Reihenfolge-Skizze (illustrativ, **nicht** die finale Nummerierung): `Korpus-Re-Apply → Podcast → Audiobook → Audiobook-Verify → Timeline → Timeline-Verify → Curation → Curation-Verify`. Sync lässt Schritt 1 (Reset) weg; Rebuild stellt ihn confirm-gegatet voran.
