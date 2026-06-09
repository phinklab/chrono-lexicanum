---
session: 2026-06-09-133
role: architect
date: 2026-06-09
status: open
slug: weekly-content-refresh
parent: null
links:
  - 2026-05-31-110
  - 2026-06-02-114
  - 2026-06-07-130
  - 2026-06-03-122
commits: []
---

# Weekly content refresh — Bücher + Podcasts (additions-only, cron → PR → apply)

## Goal

Ein wöchentlich automatisierter **Refresh-Pass**, der prüft, ob unser Bestand (Bücher + Podcast-Folgen) noch vollständig ist: er zieht Upstream-Quellen, difft sie gegen unseren committeten Bestand, und erzeugt **einen einzigen, maintainer-prüfbaren Vorschlag** (Report + strukturiertes Apply-File). Philipp segnet per **PR-Merge** ab; danach laufen die genehmigten Neuzugänge durch die *bestehenden* Apply-Pfade an ihren richtigen Platz. Kein DB-Write aus CI, keine Drift-Prüfung auf dem Altbestand — nur Neuzugänge.

Dies ist die **operative Reife** des Wartungs-Modus, den [`why-bulk-backfill.md`](../brain/wiki/decisions/why-bulk-backfill.md) als Revisit-Trigger vorgezeichnet hat („nach 3e … weekly local maintenance with a script we trust" + „adding Black Library … polling axis"). Der Korpus ist datenkomplett (859/859); jetzt geht es nur noch um den langen Schwanz neuer Releases (~10–20 Bücher/Jahr) und laufende Podcast-Folgen.

## Design freedom — read before everything else

Der Pass erzeugt einen **Report (Markdown)** und einen **PR-Body**. Beides ist Präsentation — gehört dir, nicht mir:

- Exaktes Report-Layout, Abschnitts-Reihenfolge, Spalten, Tabellen-vs-Prosa, Voice/Copy, Emoji-ja/nein, wie „neu" vs „upcoming" vs „unsicher" visuell getrennt werden.
- PR-Titel- und PR-Body-Copy, Commit-Message-Wortlaut, Dateinamen-Shape unter `ingest/refresh/…`.
- Confidence-Schwellen-Wording, wie Borderline-Matches im Report markiert werden.

Ich schreibe nur **Outcomes** („der Report listet pro Kandidat Titel/Autor/Datum/Format/Quelle/Confidence" / „ein No-Op-Lauf öffnet keinen PR"). Wenn unten ein Wert wie ein Pixel/ms/Klassenname klingt, ist er illustrativ — überschreib ihn. Es gibt **keine** Public-UI in diesem Brief; das ist ein Maintainer-/Ops-Werkzeug.

## Context

**Heutiger Stand, den der Implementer kennen muss:**

- **Bücher** sind eine statische Excel-SSOT: `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` → `npm run import:ssot-roster` → `scripts/seed-data/book-roster.json` (859 Bücher, `books[]` mit `externalBookId` `W40K-####`/`HH-####`, `slug`, `title`, `authors`, `releaseYear`, `format`, `seriesHint`, `sourceUrl`). **Granularität ist nur `releaseYear`** — kein Monat/Tag. Es gibt heute **keinen** Upstream-Abgleich für neue Bücher; der Maintainer pflegt das Excel von Hand. Die alten Crawler (`src/lib/ingestion/{tlbranson,wikipedia,lexicanum,discovery}`) sind bypassed Dead-Code (122-B6), **nicht** wiederbeleben.
- **Podcasts** sind reif: Registry `scripts/seed-data/podcast-shows.json` (feedUrl, `source: rss|youtube`, links) → `npm run ingest:podcast` (`src/lib/ingestion/podcast/feed.ts` zieht den ganzen Feed → Artefakt `ingest/podcasts/<slug>.json`) → Tagging (`ingest:podcast:tag`, cc-direct → `<slug>.extractions.json`) → `npm run apply:podcast` (**episodeGuid-keyed, idempotent** → DB; `podcast`/`podcast_episode` work-kinds aus Brief 114). Lineage: 110 (Pilot) → 114 (Schema/Apply) → 130 (YouTube-Source-Adapter) → 131 (cc-direct Tagging). Die committeten Feed-Artefakte sind der „letzte bekannte Stand".
- **Quelle (entschieden mit Philipp, 2026-06-09):** primärer Anker für Bücher = **Track of Words BL-Pre-Order-Tracker** (`trackofwords.com`, fan-gepflegt, upcoming-fokussiert; aggregiert selbst die Community-Release-Tabelle + die Warhammer-Community-Sunday-Previews). **Die Fallback-Kette muss currency-fokussiert sein, nicht vollständigkeits-fokussiert** — falls Track of Words aus CI nicht zuverlässig fetchbar ist, in dieser Reihenfolge: (a) **At Boundary's Edge** „Upcoming Black Library Releases" (`atboundarysedge.com`, unabhängiger Fan-Tracker, aktuell), (b) **Warhammer Community „Sunday Preview"** (autoritativ + aktuell, aber Prosa → Parse/LLM nötig; Fetchbarkeit/Cloudflare prüfen). **Wikipedia ist NICHT die Fallback-Quelle** — die „List of Warhammer 40,000 novels" hinkt den neuesten Releases Tage/Wochen hinterher und taugt höchstens als Vollständigkeits-Backstop, nie zur Aktualitäts-Erkennung. **Black Library offiziell scheidet als Currency-Fallback aus**: die „Coming Soon"-Seite ist eingestellt, der Shop historisch Cloudflare-geblockt.
- **Apply-Ziel für genehmigte Bücher (entschieden):** **Auto-Roster-Extension** — der Pass schreibt genehmigte Bücher in ein committetes Erweiterungs-File, das beim Import in den Roster gemerged wird; danach laufen sie durch die *normale* Pro-Buch-Kuratierung (`claude -p`-Override → `apply-override`), genau wie die 859. Das Excel bleibt unangetastet für Philipps Bulk-Edits.
- **Cadence (entschieden):** voll automatisiert via **GitHub-Action-Cron**, wöchentlich; Approval = PR.

**Konkreter Test, der schon greift** (Beleg, dass die Quelle Lücken fängt): Neuestes im Roster sind 7 Bücher mit `releaseYear` 2026. Der Abgleich gegen Track of Words / BL fördert sofort **_Carnage Unending_ von Dan Abnett (21. April 2026)** als fehlend zutage. Das Acceptance unten verlangt, dass der erste Lauf genau das zeigt.

## Decision — der Drei-Stufen-Fluss

**Stufe 1 — Detection (CI, wöchentlicher Cron, NULL DB-Write, secret-arm):**
Zieht Track of Words (Bücher) + jeden Registry-Feed (Podcasts, via bestehendem `feed.ts`), liest den committeten `book-roster.json` + die committeten Podcast-Artefakte, difft. Bücher-Diff über normalisiertes Identitäts-Tripel (Titel + Autor + Jahr); Upstream-nicht-im-Roster = Kandidat. Podcast-Diff = Feed-`episodeGuid`s, die nicht im committeten Artefakt stehen. Emittiert (a) einen **Report** (Markdown, menschlich) und (b) ein **strukturiertes Apply-File** (die vorgeschlagenen Roster-Extension-Zeilen + die Liste neuer Folgen) unter `ingest/refresh/…`.

**Stufe 2 — Approval (PR):**
Der Cron öffnet (oder aktualisiert) **einen rollenden PR** mit Report + Apply-File. Philipp prüft, kann im PR kürzen/korrigieren, **Merge = Freigabe**. Eine Woche ohne Neuzugänge öffnet **keinen** PR (bzw. schließt den rollenden).

**Stufe 3 — Apply (post-merge, maintainer-/CC-getriggert, DB-schreibend, qualitäts-gegated):**
- Bücher: das gemergte Roster-Extension-File → `import:ssot-roster` (Merge in Roster) → Standard-Pro-Buch-Kuratierung → `apply-override`. Jedes neue Buch bekommt dieselbe Behandlung wie die 859.
- Podcasts: neue Folgen → `ingest:podcast:tag` → `apply:podcast` (idempotent).

> **Warum Apply nicht auch in CI?** Der DB-Write ist der Qualitäts-Grenzpunkt des Projekts (`why-bulk-backfill.md` § quality boundary; `why-cc-direct-curation.md`; „user/scraped content schreibt nie ungeprüft in kanonische Tabellen"). „Voll automatisiert" gilt deshalb für **Detection + Vorschlag + PR** — die laufen unbeaufsichtigt. Der Write bleibt hinter dem PR-Merge + dem bestehenden Kuratierungs-Gate. Philipps Wochenaufwand sinkt damit auf: einen PR sichten, mergen, einen Apply-Befehl anstoßen (oder CC anstoßen lassen). Ein späterer on-merge-Apply-Action kann das schließen, wenn wir der Auto-Detection-Qualität trauen — als dokumentierte Option, nicht in v1.

## Constraints

- **Detection schreibt nie in die DB** und braucht idealerweise **kein** Anthropic-API (reines Fetch + Diff, kein LLM nötig). Wenn überhaupt Secrets nötig sind, minimal halten und im Report begründen.
- **Additions-only.** Kein Re-Check der Metadaten der bestehenden 859. Der Diff darf **keines** der 859 als „neu" markieren (Normalisierung muss Reprints/Re-Titles/Omnibus-Neuauflagen wie *Horus Rising* → *Horus Heresy Saga* abfangen, nicht als Neuzugang melden).
- **Reuse, kein Refactor.** Podcast-Refresh hängt sich an `feed.ts` (Pull) + `apply:podcast` (idempotenter Write) an; die Internals von 110/114/130/131 bleiben unangetastet. Bücher-Detection nutzt den committeten `book-roster.json` als Wahrheit, **nicht** die alten Crawler.
- **Fail-soft.** Eine unerreichbare Einzelquelle ergibt einen **partiellen** Report mit klarer Lücken-Notiz, **kein** abgestürzter Cron. Track-of-Worts-Ausfall darf den Podcast-Teil nicht mitreißen und umgekehrt.
- **Roster-Extension-Contract:** Zeilen tragen die `book-roster.json`-`books[]`-Shape; neue `externalBookId`s setzen die bestehenden Serien kollisionsfrei fort (nächste freie `W40K-####`/`HH-####`). Jede vorgeschlagene Zeile trägt `source_kind` + `confidence` (Guardrail von Board 122).
- **Keine Version-Pins.** Parser sind schon da (`fast-xml-parser`, `cheerio`); jede neue Dependency wird im Report begründet. CC recherchiert/pinnt selbst.
- **Strang-Disziplin:** Worktree `chrono-lexicanum-batches`, Branch `codex/ingest-batches-*`; Code/Daten/Config/`.github/**` → branch + PR. `brain/**` + `sessions/README.md` **nicht** anfassen (Rollup-Ownership) — systemische Fakten in den Impl-Report, Cowork backfillt.

## Out of scope

- **Drift/Metadaten-Re-Check** auf den 859 bestehenden Büchern (bewusst — Q3 = additions-only; Drift teils schon von Brief 104 abgedeckt).
- **Auto-DB-Write / Auto-Kuratierung aus CI.** Der PR-Merge ist das Gate; Apply bleibt supervised.
- **Wiederbelebung der alten Crawler** (`tlbranson`/`wikipedia`/`lexicanum`/`discovery`) — die werden in 122-B6 ausgemustert, nicht hier reaktiviert.
- **Neue Public-UI / Site-Routen.** Reines Maintainer-Tool.
- **Podcast-Show-Onboarding** (neue Shows hinzufügen) — das ist 122-B1. Dieser Brief refresht nur die **schon registrierten** Shows.
- **Excel-SSOT-Schreibzugriff** — der Pass fasst `Warhammer_Books_SSOT.xlsx` nie an.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Ein Detection-Lauf (lokal **und** in CI aufrufbar) Track of Words + die Registry-Podcast-Feeds zieht, gegen committeten `book-roster.json` + committete Podcast-Artefakte difft und einen Report + ein strukturiertes Apply-File unter `ingest/refresh/…` schreibt — **ohne jeden DB-Write**.
- [ ] Der erste Lauf gegen die heutigen Daten listet **_Carnage Unending_ (Dan Abnett, 2026)** als fehlendes Buch (konkreter Test).
- [ ] Der Bücher-Diff normalisiert Titel+Autor+Jahr und markiert **keines** der bestehenden 859 als „neu" (Reprint-/Omnibus-Robustheit belegt an ≥1 Beispiel).
- [ ] Der Podcast-Diff listet pro Show **nur** Folgen, die nicht im committeten Artefakt stehen.
- [ ] Ein wöchentlicher GitHub-Action-Cron fährt die Detection unbeaufsichtigt und öffnet/aktualisiert **einen** rollenden PR mit dem Vorschlag; eine Woche ohne Neuzugänge öffnet keinen PR.
- [ ] Fail-soft belegt: eine simuliert unerreichbare Quelle ergibt einen partiellen Report statt eines Absturzes.
- [ ] Der Pfad „gemergte Roster-Extension → `import:ssot-roster` → Kuratierung → `apply-override`" bzw. „neue Folgen → `apply:podcast`" ist dokumentiert (README/Runbook), auch wenn Apply maintainer-getriggert bleibt.
- [ ] `npm run lint` + `npm run typecheck` grün; der neue Detection-Pfad hat einen Smoke-Test (`test:*`-Konvention).

## Open questions

Inputs für deinen Report, keine Blocker:

- **Track-of-Words-Fetchbarkeit aus CI** — UA/Cloudflare/Rate-Limit sauber? Falls unzuverlässig: arbeite die currency-fokussierte Fallback-Kette ab (At Boundary's Edge → Warhammer Community Sunday Preview), **nicht** Wikipedia. Sag, was du genommen hast und warum, und nenn die exakte URL/Struktur, die du parst. Prüf insbesondere, ob die von Track of Words eingebettete Community-Release-Tabelle als direkte, strukturierte Quelle (CSV-/Sheet-Export) greifbar ist — das wäre der robusteste Anker.
- **Identitäts-Key fürs Buch-Matching** — Titel+Autor+Jahr vs. normalisierter Slug; wie du Anthologien/Omnibusse/Reprints/Re-Titles gegen False-Positive-„neu" absicherst.
- **`externalBookId`-Allokation** — Schema für die nächste freie ID pro Serie; Kollisions-Schutz bei parallelen Vorschlägen.
- **Rollender PR vs. datierter PR** — was operativ angenehmer ist (ein Long-Lived-PR, der sich aktualisiert, vs. ein frischer PR pro Woche).
- **On-merge-Auto-Apply** — jetzt schon hinter einem Flag mitbauen oder bewusst vertagen?

## Notes

- **Cadence-ADR-Amendment (Cowork, post-merge):** Dieser Brief feuert den Revisit-Trigger von [`why-bulk-backfill.md`](../brain/wiki/decisions/why-bulk-backfill.md) (monthly → weekly; Source-Set +Track of Words). Ich amende die ADR im Post-Merge-Koordinations-Pass aus dem Coordination-Worktree — **du fasst `brain/**` nicht an**.
- **Board-Andockung:** seedet einen neuen Batches-Board-Task (122-B10, „Weekly content refresh"). Briefing/Review läuft wie üblich über die Board-Mechanik.
- **Test-Datenpunkt zum Mitnehmen:** Roster-Neueste (2026) = `Flames of Betrayal` (HH-0069), `Death Rider` (W40K-0146), `The Green Tide` (W40K-0147), `Chem Dog` (W40K-0247), `Vaults of Terra: The Omnibus` (W40K-0459), `Ghazghkull Thraka: Warlord of Warlords` (W40K-0559), `Ghost Legion` (W40K-0561). Upstream-Kandidat außerhalb davon: *Carnage Unending* (Abnett, 21.04.2026) → muss als „neu" auftauchen.
- **Illustrative Shape** (nicht normativ — Design-Freiheit oben): ein npm-Script `refresh:check` neben den bestehenden `ingest:*`; Output `ingest/refresh/<YYYY-WW>/report.md` + `proposal.json`; Workflow `.github/workflows/weekly-refresh.yml` mit `on: schedule: cron`. Namen/Pfade sind deine.
