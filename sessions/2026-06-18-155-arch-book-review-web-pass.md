---
session: 2026-06-18-155
role: architect
date: 2026-06-18
status: open
slug: book-review-web-pass
parent: 2026-06-17-154
links:
  - 2026-06-14-149
  - 2026-06-11-144
  - 2026-06-07-131
commits: []
---

# Buch-Reviewer Stage 3 — Per-Buch-Web-Pass: Sentinels auflösen/anlegen + Voll-Re-Review (Finder + adversariale Verifier, CC-Direct, Sonnet) (Board 122-B11 → B11.3)

## Goal

Fahre den **per-Buch-Web-Search-Pass über den vollen Korpus** auf einer korrigierten Baseline: löse die **500 Sentinels** aus dem B11-Lauf auf (strukturelle Factions/Locations zuerst, dann die Character-Long-Tail), re-reviewe **jedes Buch mit Web-Zugriff** auf fehlplatzierte Kanten — und lege alle Ergebnisse als **Vorschläge** ab (Kanten-Korrekturen → `reviewQueue`, neue Entities → eine eigene read-only Proposal-Datei), nie auto-appliziert, nie DB-Mutation. Stage 3 macht aus den `__unresolved__`-Sentinels echte, kanonisch auflösbare Referenzen und liefert die Datenqualitäts-Basis, gegen die später B12 (Ask-Tuning) tunt.

## Context

- Direkter Nachfolger des B11-Voll-Laufs ([Brief 154](./2026-06-17-154-arch-book-reviewer.md) + impl [154](./2026-06-17-154-impl-book-reviewer.md), PR #180). B11 hat synopsis-only über 889 Bücher gefahren: 639 roh → **608 bestätigt** → 31 widerlegt (~4,9 %). Davon wurden **96 applyable Findings** hand-promoviert (`reviewQueue` → `curation-overlay.final`) und der **Drukhari-Split** in die Referenz-Daten gezogen; beide sind in der SSOT scharf, **noch nicht in der DB** (DB-Freeze). Die **500 neuen-Entity-Sentinels** (`__unresolved__:<axis>:<slug>`) blieben bewusst in der Queue geparkt — **die sind der Worklist-Kern dieser Session.**
- **Aufschlüsselung der 500** (aus dem 154-Report): ~166 **strukturelle** Sentinels (Factions + Locations) — per-Name, editions-**unabhängig**, hoher Wert (überwiegend fehlende Space-Marine-Chapters, Planeten, Schiffe); ~315 **Character**-Sentinels (One-offs, lösen mit Buch-Kontext deutlich besser auf als isoliert); Rest Mischfälle. Worklist liegt gruppiert im (gitignored) `03-new-entities-to-create.md`-Slice des B11-Laufs.
- **Maschinerie existiert schon** — diese Session **erweitert B11, baut nichts neu**: der CC-Direct-Driver (`scripts/run-book-review-loop.sh`), der Finding-Contract (`scripts/book-review/contract.ts`), die DB-freie Projektion inkl. `curation-overlay.final`-Tail (`scripts/book-review/projection.ts`, geteilte Helfer in `scripts/resolve-book-edges.ts`), das Sidecar-Merge (`scripts/book-review/sidecar.ts`) und die Konventions-Docs (`ingest/book-review/conventions-*.md`) sind die Basis. Stage 3 hängt **Web-Search + Thinking** in die Subsession, schaltet das Modell auf **Sonnet**, ergänzt einen **Neue-Entity-Proposal-Pfad** und phaset strukturell-zuerst.
- **Korrigierte Baseline ist automatisch da.** Die Projektion faltet den `final`-Tail bereits ein — die 96 liegen jetzt in `final` —, der Finder sieht also den korrigierten Zustand DB-frei, **ohne** dass dafür ein Rebuild laufen muss. Genau deshalb bleibt der DB-Freeze über Stage 3 bestehen (s. Constraints → Rebuild).
- **Das adversariale Muster bleibt der Qualitätsguard** ([144](./archive/2026-06/2026-06-11-144-impl-technical-deep-review.md)): jeder Finder-Vorschlag wird von einer **unabhängigen Verifier-Subsession** bestätigt/widerlegt. Bei Sonnet (schwächer als Opus) + Web-Search (Fehldeutung von Treffern) wiegt dieser Filter **schwerer**, nicht leichter — Maintainer-Entscheid 2026-06-18, ausdrücklich behalten.
- **Modell-Wechsel Opus → Sonnet** ist ein Budget-Entscheid (Maintainer 2026-06-18): der B11-Voll-Lauf auf Opus war zu teuer. Sonnet + der Verifier-Guard + Web-Search-Evidenz ist der Tausch.
- **DB-Freeze (Brief 149/151) gilt weiter.** Read-only ggü. DB; einziger Output sind committete Vorschlags-Dateien + (in Hand-Gates) Promotions in SSOT-Kataloge/Overlay. Kein Prod-`db:rebuild`/`db:migrate`/`db:apply-override`.

## Constraints

- **Voll-Lauf, kein Pilot** (Maintainer-Entscheid 2026-06-18 — Topologie ist via B11 erprobt). Trotzdem **vor** dem Voll-Sweep ein kurzer **Smoke-Beleg an wenigen Büchern**, dass das Web-Tool-Wiring greift und der Token-Rahmen pro Subsession **klar unter ~120k inkl. Web-Treffern** bleibt (Web-Search + Thinking blähen den Kontext — Chunk-Größe vermutlich **kleiner** als B11s 8; CCs Wahl, im Report belegt). Das ist Engineering-Sanity, keine Kalibrierungs-Charge.
- **Zwei-Phasen-Ordnung mit Hand-Gate dazwischen** (matcht den 154-Report „strukturelle Sentinels zuerst, damit der große Pass von sauberen Daten startet"):
  1. **Phase A — strukturelle Sentinels.** Finder + Verifier lösen die ~166 Faction/Location-Sentinels per Web-Search auf (editions-unabhängig: ein glaubwürdiger Wiki-Treffer genügt, **nicht** nach Edition über-verengen). Bestätigte neue Entities → **Neue-Entity-Proposal-Datei** (read-only). **Gate A:** Maintainer/Codex promoviert die bestätigten strukturellen Entities von Hand in die Seed-Kataloge (`factions.json`/`locations.json` + zugehörige `*-aliases.json`) — **dieselbe Hand-Promotions-Klasse wie die 96/Drukhari, nie auto.** Erst danach Phase B.
  2. **Phase B — Voll-Re-Review.** Jedes Buch per Web-Search gegen die Projektion (die jetzt die promovierten strukturellen Entities mit-auflöst): fehlplatzierte Kanten flaggen **und** die Character-Sentinels mit Buch-Kontext auflösen/anlegen. Kanten-Korrekturen → `reviewQueue` (149-konform). Neue Character-Entities → Neue-Entity-Proposal-Datei. **Gate B:** Maintainer/Codex promoviert von Hand.
- **Reviewer schreibt nur Vorschläge, nie Wahrheit.** Kanten-Findings ausschließlich in `reviewQueue` von `curation-overlay.json` (bzw. dem 149-konformen Sidecar, das mechanisch dorthin mündet). **Neue Entities** ausschließlich in eine **eigene, read-only Proposal-Datei** (Dateiname/Form = CCs Wahl, z. B. `scripts/seed-data/new-entity-proposals.json`) **ohne Apply-Pfad** — sie wird **nirgends** in `db:rebuild`, einen Seed-Loader oder einen DB-Write eingehängt. **Nie** `final`, **nie** direkter Katalog-Write durch den Reviewer, **nie** DB-Mutation. Materialisierung in Kataloge/Overlay passiert ausschließlich über die Hand-Gates A/B.
- **Web-Evidenz ist Pflicht und wird mitgeführt.** Jeder web-bestätigte Vorschlag (neue Entity wie Kanten-Korrektur) trägt **Quell-URL(s) + Confidence** im Proposal (Muster `source_kind`/`confidence` aus dem Datenmodell), damit das Hand-Gate auditierbar ist. Ein Vorschlag ohne belegende Quelle ist kein bestätigter Vorschlag.
- **Unresolved bleibt Sentinel, kein geratener Slug.** Findet der Web-Pass für eine Addition **keine** glaubwürdige kanonische Entsprechung, bleibt sie `__unresolved__:<axis>:<slug>` + `rawName` + lauter Note — **niemals** eine geratene Slug-ID, die bei späterer Promotion als echte Referenz durchrutscht (unverändert aus 154).
- **Omnibus-/Content-Scope-Guard behalten.** Eine Serien-/Wiki-Assoziation auf Reihen-Ebene **überschreibt keine** synopsis-basierte Ausschluss-Entscheidung (z. B. „ein Charakter taucht in der Reihe auf" ≠ „er ist in *diesem* Band"). Der Guard steht schon in den Konventions-Docs; der Web-Pass macht ihn **wichtiger** (Web-Treffer sind reihen-/franchise-weit) — explizit in der erweiterten Konvention adressieren, mit Beispiel.
- **Rollen-Vokabular + Role-Fix unverändert aus 154.** Overlay-Add-Vokabeln gepinnt (Factions `primary|supporting|antagonist`, Locations `primary|secondary|mentioned`, Characters `pov|appears|mentioned`); Out-of-vocab-SSOT-Rollen vor dem Emit gemappt; falsche bestehende Rolle bleibt eigener Finding-Typ (Role-Fix).
- **Adversariale Verifikation Pflicht + unabhängig.** Jeder faktische Vorschlag wird von einer **separaten Subsession als der, die ihn fand** geprüft (frischer Prozess/Kontext); nur **bestätigte** landen im Output, **widerlegte** mit Begründung in den Report/Log (nicht in Queue/Proposals). Widerlegungs-Quote als Tabelle (Muster 144), je Phase getrennt.
- **Kontext-Disziplin wie 131/154.** Ein Maintainer-Befehl; Bash-Driver iteriert, spawnt pro Chunk eine frische `claude -p`-Subsession (auto close/reopen, **kein** manuelles `/clear`), validiert JSON gegen den Contract, merged sequenziell/atomar. **Resumebar** (überspringt erledigte Buch-/Sentinel-Keys — bei Web-Latenz + Voll-Korpus über mehrere Wellen unverzichtbar). **MECHANICAL-Präludium byte-genau** für Finder **und** Verifier. **Null metered API** (CC-Direct, kein `@anthropic-ai/sdk`-Aufruf im Laufpfad).
- **Merge failt/routet laut bei Konflikt** (unverändert aus 154): bestätigtes `add` + bestätigtes `remove` auf gleicher Achse+ID+Buch → `ledgerConflicts`-Bucket (non-blocking, beide Seiten zurückgehalten + im Summary/Log gemeldet), nicht stilles Auflösen.
- **Modell = Sonnet (aktuell), nicht Opus** — Budget. Kein Versions-/Modell-Pin über die Absicht hinaus (CLAUDE.md § Version policy): „aktuelles Sonnet mit Web-Search + Thinking"; CC wählt das exakte Modell-Alias und belegt es im Report. **TypeScript strict, server-seitig.**

## Out of scope (explizit NICHT anfassen)

- **Jede DB-Mutation + der finale Rebuild.** Stage 3 ist read-only ggü. der DB. Der **eine finale `db:rebuild`**, der die 96 + Drukhari + Stage-3-Ergebnisse zusammen in die DB zieht, ist ein **separater Ops-Schritt nach Stage 3**, gated am Freeze-Lift — **nicht** Teil dieser Session (Architektur-Entscheid: ein finaler Rebuild über den vollständig korrigierten Stand, nicht stückweise; Begründung im letzten Bullet von § Notes).
- **Direkter Katalog-/Overlay-Write durch den Reviewer.** Materialisierung neuer Entities oder Promotion von `reviewQueue` → `final` bleibt **Maintainer-/Codex-Hand-Schritt** (Gates A/B). Der Reviewer **promotet/materialisiert nichts.**
- **Facets.** Stage 3 fasst die Facet-Dimension **nicht** an; die `facet-review-queue.json` aus 154 bleibt unverändert read-only ohne Apply-Pfad. Die 149/150-Content-Warning-/`isVisibleFacetCategory`-Garantie bleibt strukturell unberührt.
- **Series-/Event-Junctions** — weiterhin nicht im 149er-Apply-Pfad, nicht reviewen.
- **Synopsis-Qualität** — bleibt gestrichen (eigener Folge-Lauf, falls je gewünscht).
- **Änderungen an `resolve.ts`/Alias-Index-**Logik**, am `curation-overlay`-Apply/Validator, an `db:rebuild`.** Der Reviewer **konsumiert** den Resolver read-only. Diff an diesen Pfaden = 0. (Neue Aliase für promovierte Entities sind **Daten** in `*-aliases.json` über das Hand-Gate — wie der Drukhari-Split —, **keine** Logik-Änderung.)

## Acceptance

The session is done when:

- [ ] Der **CC-Direct-Driver ist auf den Web-Pass erweitert** (Web-Search + Thinking in der Subsession, Modell Sonnet), **Finder + unabhängiger adversarialer Verifier behalten**, resumebar, **null metered API**, MECHANICAL-Präludium byte-genau. Ein Maintainer-Befehl startet den Lauf; Chunk-Größe hart + im Report mit Token-Rahmen (< ~120k inkl. Web-Treffern) belegt.
- [ ] Die **Konventions-Docs sind um eine Web-Pass-Konvention erweitert**: strukturell = editions-unabhängig / nicht über-verengen; Character = Buch-Kontext nutzen; **Omnibus-/Content-Scope-Guard mit Beispiel**; „leere Korrektur-Liste ist die richtige Antwort, wenn das Buch stimmt". Der **Finding-Contract** trägt die **Neue-Entity-Proposal-Form** inkl. **Quell-URL(s) + Confidence**.
- [ ] **Phase A gefahren:** die ~166 strukturellen Sentinels per Web-Search aufgelöst; bestätigte neue Factions/Locations liegen als Vorschläge in der **read-only Neue-Entity-Proposal-Datei** (mit Web-Provenance), gegen die bestehenden Seed-Kataloge dedupliziert (kein Vorschlag, der eine schon existierende kanonische Entity doppelt). **Gate A** im Report als ausstehender Hand-Schritt benannt (nicht vom Reviewer ausgeführt).
- [ ] **Phase B gefahren:** Voll-Re-Review jedes Buchs per Web-Search gegen die Projektion; Kanten-Korrekturen liegen 149-konform in `reviewQueue` (committed, nie `final`, nie appliziert), Character-Sentinels als neue-Entity-Vorschläge mit Web-Provenance. `apply:curation-overlay -- --dry-run` bleibt grün und appliziert **nichts** aus `reviewQueue` (Beleg im Report).
- [ ] **Neue-Entity-Proposal-Datei hat keinen Apply-Pfad:** Beleg im Report, dass kein Script/`db:rebuild`/Seed-Loader sie in einen Katalog- oder DB-Write einhängt. Materialisierung ausschließlich über Gates A/B.
- [ ] **Sidecar gegen das echte `curation-overlay.json` cross-validiert** (Test, nicht nur Dry-Run): kein Buch zugleich in `final` und Sidecar-Queue, keine Dublette mit bestehender `reviewQueue`, deterministische Merge-Form (unverändert aus 154, jetzt über den Stage-3-Output).
- [ ] **Findings-Tabelle** (roh / bestätigt / widerlegt, je Phase und Dimension, Muster 144) + die widerlegten mit Begründung im Log. **Web-Pass-Falsch-Positiv-Rate** ausgewiesen und der B11-Synopsis-only-Rate (4,9 %) gegenübergestellt.
- [ ] **Guard belegt:** mindestens ein Fall im Log, in dem eine Serien-/Wiki-Assoziation korrekt **nicht** über einen synopsis-basierten Ausschluss appliziert wurde.
- [ ] `npm run lint` + `tsc --noEmit` + bestehende Tests grün. **Keine** Prod-DB-Mutation. Diff an `resolve.ts`-Logik, `curation-overlay`-Apply/Validator, `db:rebuild`, der Facet-Pfad = 0.

## Open questions (im Report beantworten)

- **Web-Pass-Falsch-Positiv-Rate** vs. B11-Synopsis-only (4,9 %): höher (Web-Fehldeutung) oder niedriger (mehr Evidenz)? Was sagt das über die nötige Hand-Triage-Tiefe?
- **Auflösungs-Quote der 500:** wie viele der ~166 strukturellen / ~315 Character-Sentinels ließen sich tatsächlich kanonisch auflösen, wie viele bleiben `__unresolved__`? Bei den verbleibenden — sinnvolle nächste Quelle, oder als „kein Werk-Eintrag" akzeptieren?
- **Endgröße `reviewQueue` + Neue-Entity-Proposals** nach Stage 3, und ist die Hand-Promotion (Gates A/B) bei der Größe handhabbar, oder braucht es eine Priorisierung (z. B. Confidence-Schwelle, Suppressions zuerst, strukturell vor Character)?
- **Rebuild-Timing:** aus CCs Sicht — ist die SSOT nach Gates A/B in einem Zustand, der **einen** sauberen Voll-`db:rebuild` trägt (Drukhari seedet zuerst, dann Re-Points, dann Overlay-Tail 7/8 inkl. der promovierten Stage-3-Einträge)? Stolpersteine?

## Notes

- **Strang:** Batches (`chrono-lexicanum-batches`) → Branch `codex/ingest-batches-book-review-web-pass` o. ä.; Code → PR. Dieser Brief ist doc-only → liegt direkt auf `main`.
- **Kein UI-Anteil** — daher kein „Design freedom"-Abschnitt; reine Daten-/Pipeline-Arbeit.
- **Reuse-first, nicht neu bauen.** Stage 3 ist die B11-Maschinerie + Web-Search + Sonnet + Neue-Entity-Pfad + strukturell-zuerst-Phasing. Wo ein B11-Helfer (Projektion, Sidecar, Contract, Driver) erweiterbar ist, erweitern statt parallel nachbauen — dieselbe Disziplin wie 154 (geteilte `resolve-book-edges.ts`).
- **Zwei strukturelle 154-Grenzen gelten unverändert:** Junctions = nur Locations + Characters; keine Facets im Overlay. Beides Architektur, nicht verhandelbar — sie schützen die 149/150-Content-Warning-Garantie.
- **ADR-Notiz (Koordinations-Pass):** Cowork faltet nach dem Report einen ADR/`log.md`-Eintrag, der die **gesamte B11-Topologie** festhält — CC-Direct Finder+Verifier → `reviewQueue`; Facets separat read-only; die Hand-Gate-Promotion (96/Drukhari + Stage-3-Entities); der Stage-3-Web-Pass mit Neue-Entity-Proposal-Pfad. `brain/**` + `sessions/README.md` sind coordination-only → CC trägt substanzielle Fakten in den **Impl-Report**, Cowork backfillt.
- **Warum ein finaler Rebuild, nicht zwei.** Die B11-Projektion ist DB-frei und faltet den `final`-Tail bereits ein — Stage 3 sieht den durch die 96 korrigierten Zustand **ohne** Zwischen-Rebuild. Ein Rebuild vor Stage 3 würde nur die Live-Site früher anfassen, ohne der Review-Qualität zu helfen, und `db:rebuild --confirm` ist destruktiv (truncatet `works`). Also: Freeze hält über Stage 3, danach **ein** sauberer Voll-Rebuild über den vollständig korrigierten Korpus (96 + Drukhari + Stage-3-Promotions) — gated am Freeze-Lift, eigener Ops-Schritt, eigene Cowork-Entscheidung.
- **Voraussetzung:** PR #180 (B11-Voll-Lauf + 96 + Drukhari) ist gemerged, bevor Stage 3 startet — die korrigierte Baseline (die 96 in `final`, Drukhari in den Katalogen) ist die Projektions-Grundlage von Phase A/B.
