---
title: Deferred questions (dormant)
type: overview
created: 2026-05-09
updated: 2026-06-20
sources:
  - ../../sessions/archive/2026-06/2026-06-20-163-arch-timed-preview-access.md
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
  - ../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md
  - ../../sessions/archive/2026-05/2026-05-03-037-impl-phase3b-aux-sources.md
  - ../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md
related:
  - ./open-questions.md
  - ./pipeline-state.md
  - ./roadmap.md
confidence: high
---

# Deferred questions

> Items that surfaced during a session but don't belong in the next-brief queue. Either dormant (waiting for a trigger), distant (Phase-4+ ambitions), or model-specific things that became inactive after a switch. Cowork promotes an item back into [`./open-questions.md`](./open-questions.md) when its trigger fires.
>
> Created during 051 (Brain Slim Pass) by lifting items 4–8 + the "distant" half of item 9 from the original 11-item queue. Phase-internal sub-phase reminders (3d / 3e / 3f to-dos that were inside item 9) live now in [`./pipeline-state.md`](./pipeline-state.md) under each sub-phase. Post-054 Session-End: ehemalige OQ4 (Anthologie-Re-Test) + OQ5 (Lexicanum-Body-Lore-Pass) hierher migriert — beide durch V2-Pilot strukturell adressiert. **2026-05-15:** OQ2-(c) `chaos`-pov_side-Promote-Pass hierher migriert (moot post-CC-Direct-Curation; ggf. später als isolierter SQL-Hygiene-Mini-Brief).

---

## Preview-Gate beim Public-Launch entfernen (nicht nur abschalten)

**Owner:** Cowork (Brief-Schnitt beim Launch) → CC (Implementation). **Sessions:** [145-impl-era-art-login-gate](../../sessions/archive/2026-06/2026-06-12-145-impl-era-art-login-gate.md), [163-arch-timed-preview-access](../../sessions/archive/2026-06/2026-06-20-163-arch-timed-preview-access.md), Cowork-Maintainer-Diskussion 2026-06-20.

Maintainer-Entscheid 2026-06-20: Der **gesamte Preview-Gate ist temporäres Vor-Launch-Gerüst und wird beim Public-Launch (Reddit) wieder ausgebaut** — nicht bloß per `PREVIEW_GATE=off` inert geschaltet, sondern als Code entfernt. Der Off-Switch ist die Sofort-Maßnahme am Launch-Tag (ein Env-Flip, kein Deploy-Risiko); das Herausnehmen des Codes ist der saubere Nachzug danach. Betroffen ist die komplette Gate-/Invite-Maschinerie aus 145 + 163: die Gate-Logik in `src/proxy.ts` (Preview-Zweig, **nicht** der Basic-Auth-Admin-Block), `src/lib/previewGate.ts`, das `/login`-Console-UI mit Invite-/Accept-State, die Signing-Lib (`previewToken.ts` o. ä.), der `/api/preview-invites`-Read-Endpoint, die lokale HTML-Konsole + ihr Serve-Script, die `preview_invite_activations`-Tabelle (+ Migration zum Droppen) und die `PREVIEW_*`-Env-Vars in `.env.example` / Vercel.

**Promote when:** der Public-Launch konkret ansteht (Reddit-Launch-Brief wird geschnitten). Reihenfolge: erst `PREVIEW_GATE=off` am Launch-Tag, dann ein dedizierter Cleanup-Brief, der das Gerüst entfernt. Bis dahin bleibt alles wie gebaut — der Gate schützt die Pre-Launch-Preview.

---

## `chaos`-pov_side-Promote-Pass für Traitor-Legion-POV-Bücher — moot post-CC-Direct-Curation

**Owner:** none (deferred). **Sessions:** [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), Cowork-Maintainer-Diskussion 2026-05-13 (open-questions.md OQ2-(c)), Cowork-Session 2026-05-15 (Brief 074 Pre-Brief-Klärung).

Ursprünglich (pre-2026-05-15) als OQ2-(c) in `open-questions.md`: System-Prompt-Patch für `src/lib/ingestion/v2/llm/` (Traitor-Legion-Surface-Forms → `pov_side: chaos`) plus retroaktiver SQL-Promote-Pass für die Pipeline-Outputs, die vor dem Patch erzeugt wurden. Begründung war eine in 044/045 erkannte Pipeline-Pathologie: V2-LLM mit Haiku/Sonnet hat `pov_side` bei Traitor-Legion-Büchern manchmal nicht auf `chaos` gesetzt, wenn die Synopsis das Wort „Chaos" nicht explizit nannte.

**Moot post-2026-05-15.** Die V2-LLM-Stage (`src/lib/ingestion/v2/llm/`) ist seit dem Brief-061-Standing-Loop de-facto durch eine `claude -p`-Subsession ausgemustert — eine CC-Subsession produziert die Override-Datei direkt. Damit gibt es keine Pipeline-System-Prompt-Stelle mehr, an der ein Patch landen könnte; das `pov_side`-Field wird von CC pro Buch manuell entschieden (Maintainer-Override-Workflow). Vollständige Begründung in [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md) (geschrieben 2026-05-15, formal-ADR für den Pipeline-Shift).

**Promote when:** (a) Cockpit-Triage zeigt einen klaren Drift-Cluster bei `pov_side` (z. B. ≥ 5 Bücher mit Traitor-Legion-Faction-Primary + `pov_side` nicht `chaos`), ODER (b) die V2-LLM-Pipeline wird für irgendeinen Use-Case reaktiviert. Im Promote-Fall ist es ein kleiner SQL-Mini-Brief: `UPDATE works SET pov_side='chaos' WHERE EXISTS (SELECT 1 FROM work_factions wf JOIN factions f ON wf.faction_id=f.id WHERE wf.work_id=works.id AND f.parent IN ('heretic_astartes', 'chaos') AND wf.role='primary')` — Cowork validiert vorher in `pipeline-state.md` / Cockpit, ob die Trefferliste sauber ist.

---

## Anthologie-Re-Test für Hebel E (Hardcover-Author-Hint) — bestanden in V2-Pilot

**Owner:** none (closed). **Sessions:** [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md).

War vor 054 OQ4. *tales-of-heresy* im V2-Pilot hat das empirisch geklärt: V2 erkennt Anthologien deterministisch über Validator 4 (`author_editor_suspicion`) — Lexicanum-`Editor`-Cell und/oder `/various|editor|edited.by|anonymous/i` Single-Author-Patterns triggern `format=anthology` mit `source: "validator"`. V1's Hebel E (Hardcover-Author-Hint im LLM-Prompt) ist unter V2 effektiv ersetzt durch deterministischen Validator. *Mark of Calth* und *Sons of the Emperor* würden im 055-Voll-Lauf den gleichen Pfad treffen.

**Promote when:** ein Voll-Lauf zeigt Anthologien, die Validator 4 nicht catched (z. B. Hardcover schreibt einen einzelnen prominent Editor als „Author", aber Lexicanum hat keine `Editor`-Cell und der Name matcht nicht das Pattern). Dann Mini-Brief für Validator-Erweiterung.

## Lexicanum-Body-Lore-Pass — V2 hat strukturell entschieden

**Owner:** none (closed). **Sessions:** [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md).

War vor 054 OQ5. V2 hat die FIELDS-Pfad-Frage strukturell entschieden: Body-Year-Regex ist aus dem FIELDS-Pfad raus (Validatoren übernehmen Sanity), und FIELD_PRIORITY für `factionNames`/`locationNames`/`characterNames` ist effektiv `[llm]` — Lexicanum trägt für diese drei Felder weiter nichts bei. Body-Lore-Walker (Cheerio-Walks über `.mw-parser-output` für `<a href="/wiki/<entity>">`-Links) wäre eine Optimierung, hat aber heute keinen Treiber: V2 erreicht 100% Junction-Coverage rein aus LLM-Output, und LLM-Cost auf $0.062/Buch ist niedrig genug, dass eine Lexicanum-Lore-Pre-Population für LLM-Prompt-Trimm nicht offensichtlich rechnet.

**Promote when:** (a) LLM-Cost steigt unerwartet bei 3e-Batch und Lexicanum-Lore-Pre-Population würde ihn drücken, oder (b) ein Voll-Lauf zeigt systematisch Junction-Lücken, wo Lexicanum-Body deutliche Wikilinks hat, die das LLM nicht aufgreift.

---

## `secondary_era_ids text[]` für Multi-Era-Sichtbarkeit

**Owner:** future Phase-4 brief. **Sessions:** [024-impl](../../sessions/archive/2026-05/2026-05-02-024-impl-era-anchor.md) "For next session".

`id01 The Infinite and the Divine` (M35–M41) wäre der Driver — lebt plausibel auch in `age_apostasy` und `long_war`. UX-Konsequenz offen (zählt zweimal in den Era-Counts? lädt EraDetail zweimal?). Wahrscheinlicher Aufgreif-Punkt: Phase-4-Timeline-Reshape (cineastische Era-Erkundung), dort wird Multi-Era-Sichtbarkeit ein konkretes Designthema.

**Promote when:** Phase-4-Timeline-Reshape brief opens.

## Redirect-Mechanismus — HTTP 307 vs. meta-refresh

**Owner:** future brief if pain becomes concrete. **Sessions:** [025-arch](../../sessions/archive/2026-05/2026-05-02-025-arch-detail-panel-deeplink.md), [026-impl](../../sessions/archive/2026-05/2026-05-02-026-impl-detail-panel-deeplink.md).

Mit `src/app/timeline/loading.tsx` (instant Skeleton beim Hub→Timeline-Click) hat sich das Verhalten von `redirect()`-Calls in `page.tsx` geändert: Stream startet vor Redirect → Next emittet `<meta http-equiv="refresh">` plus RSC-Redirect-Direktive, statt sauberen HTTP 307. Browser folgen korrekt; JS-User kriegen den Redirect via Next-Router instant; **Direkthits auf Redirect-URLs (geteilte Links, Legacy `?era=M30`) bekommen 1 Sekunde Skeleton-Blink vor Meta-Refresh**. Sauberere Alternative: Redirect-Logik in `middleware.ts` (gibt 307 sofort zurück). Trade-off: ~80 Zeilen `middleware.ts` mit 1–2 DB-Queries vor jedem `/timeline`-Hit. Mit Philipp 2026-05-02 bestätigt: bleibt vorerst hier liegen — Internal-Nav unaffected, Direkthits selten genug.

**Promote when:** geteilte Legacy-Links beschweren sich oder Lighthouse-Score auf Redirect-Pfaden auffällt.

## 3c `no_rating_found`-Flag-Misuse (Sonnet-spezifisch)

**Owner:** future brief, only if Sonnet ad-hoc per `INGEST_LLM_MODEL`-Override aktiviert wird. **Sessions:** [039-impl](../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md), [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md).

4 Bücher im Sonnet-Original-Lauf hatten `rating + ratingSource` gesetzt UND einen `no_rating_found`-Flag — der Sonnet nutzt den Flag als Audit-Erklärung für Source-Priority-Fallback. Haiku zeigte das Verhalten nicht (0× im Vergleichs-Lauf). Mit dem Modell-Switch in 040 ist das Symptom weg. Mini-Brief-Pfad falls jemals nötig: Flag-Kind-Union um `rating_source_fallback` erweitern, oder System-Prompt schärfen.

**Promote when:** ein Brief schaltet Sonnet wieder als Default ein.

## `series_total_mismatch`-Flag bei Voll-Lauf beobachten

**Owner:** open observation. **Sessions:** [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md), [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md).

Im Original-Haiku-Lauf (Bücher 21–40, alles HH-Phase-2) wurde der Flag 0× emittiert — entweder weil HH-Mid-Phase keine Series-Total-Anomalien hat, oder weil das Flag-Constraint im System-Prompt zu eng formuliert ist. Im 3e-Voll-Lauf (alle 800 Bücher inkl. Primarchs / Tales-of-Heresy / etc.) sollten echte Mismatches sichtbar werden.

**Promote when:** der Voll-Lauf läuft und 0 Mismatches zeigt obwohl wir wissen, dass es welche gibt → Prompt-Tweak-Mini-Brief.

## Pipeline-Cost-Tuning Mini-Brief

**Owner:** Cowork, only if 3e-batches überraschend hohe Cost zeigen. **Sessions:** [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md).

`max_uses` runter von 6 auf 3 (Haiku braucht im Vergleichs-Lauf nur 3.4 Searches/Buch); ggf. System-Prompt-Trim, Plot-Context kürzen, Web-Search-Optional-Mode für Bücher mit reichem Plot-Kontext. 042 hat das schon als "eher nicht der Mühe wert" eingestuft (Cost 3× unter Sonnet, weit unter Brief-Original-Budget). Realistisch: ~10–30% zusätzliche Ersparnis möglich, also $20–25 Reduktion auf den $88-Voll-Lauf-Estimate.

**Promote when:** zwei aufeinanderfolgende 3e-Batches kommen über $0.18/Buch oder die Voll-Lauf-Hochrechnung schiebt sich über $120.

## Universe-Year-Coverage — Walker + Series-Anchor-Inferenz + Hand-Override

**Owner:** Cowork (architectural design across multiple sources) → CC (Implementation). **Sessions:** [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md) (V1 Body-Year-Regex), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md) (V2 Drop), Cowork-Maintainer-Diskussion 2026-05-09 (rogue, Maintainer hat das Thema bewusst hinten angestellt).

V1's Lexicanum-Body-Year-Regex hat im 20260508-2101-Lauf für 9 Bücher genau einen Jahres-Wert produziert (*false-gods* `startY=39000`), der korrekt eine LLM-Halluzination war und vom V2-`year_outlier`-Validator gedroppt wird. V2 schreibt nur noch infobox `Setting`/`Date`/`Story Date`, was auf Lexicanum aber für die meisten Bücher nicht gefüllt ist — Coverage geht damit gegen 0%. Die Chronicle-Timeline bräuchte zumindest grobe Universe-Year-Bänder, sonst rendert der Phase-3-Apply-Schritt fast leere Detail-Pages auf der zeitlichen Achse.

Vier Hebel, die zusammenwirken müssten (kein einzelner reicht):

- **(a) Strict M-notation walker.** Lexicanum-Body-Scan, aber sehr eng — nur Patterns wie `M\d{2}\.\d{3}`, „Late M31", „Year XYZ of the 41st Millennium". Output durch einen neuen Validator (`universe_year_inferred`), Median bei Mehrfach-Treffern, leere Field bei Inkonsistenz. Nicht V1-zurück, sondern V1-Idee mit V2-Disziplin.
- **(b) Series-Anchor-Inferenz.** Die `seriesYearAnchors`-Tabelle (HH/SoT/Eisenhorn/Ravenor/Cain/Dawn-of-Fire) wird heute nur defensiv im `year_outlier`-Validator genutzt. Offensiv: TLBranson liefert oft eine Position in der Serie; bei bekanntem Anchor-Range lässt sich daraus ein `confidence: low, source: "series-anchor-inferred"` Range ableiten. Coverage springt für ~150–250 Bücher kostenlos.
- **(c) Hand-Override für die Top-50.** *Eisenhorn*, *Gaunt's Ghosts*, *Cain*, *Horus Rising*, *Helsreach*, *Ahriman* haben Community-Konsens-Werte. V2's `FieldRecord.override`-Slot ist der richtige Slot. Ein `seed-data/book-universe-years.json` mit ~50 Einträgen ist billiger und genauer als jede Extraktion.
- **(d) LLM mit gerichteter Web-Search** auf `lexicanum.fandom.com/wiki/Timeline` und HH-„Year-by-Year"-Seiten — nur wenn (a)+(b)+(c) nichts liefern. Bounded-Cost-Fallback.

**Promote when:** vor Brief 057 (3d-Apply), weil sonst Chronicle-Timeline mit 90% leeren `startY`-Feldern in Production geht. Realistischer Trigger ist post-056-Resolver, dann eigener Brief „Universe-Year-Coverage" mit allen vier Hebeln gebündelt. Maintainer hat 2026-05-09 explizit signalisiert, dass das Thema *erstmal hinten angestellt* wird; Cowork zieht es nicht eigeninitiativ vor.

## Distant — Phase-3+-Engine-Erweiterungen aus 035 / 037

**Owner:** Cowork, only if a future brief explicitly opens this axis. **Sessions:** [035-impl](../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md), [037-impl](../../sessions/archive/2026-05/2026-05-03-037-impl-phase3b-aux-sources.md).

Lose Liste — alle drei sind heute durch Workarounds oder durch den LLM-Pass abgedeckt:

- **Lexicanum-`apiSearchFallback()`** als zweiter Discovery-Pfad (heute Cloudflare-blockiert auf `api.php`; URL-Probing reicht).
- **Format/Availability-Heuristik aus Open Library** mit per-Edition-Fetch + Sprach-Filter (heute durch LLM gelöst, post-047 mit Closest-Match-Map).
- **Engine-Friktions-Befunde aus 037:** `SourceName`-Union vs Plugin-Pattern, kein shared HTTP-Throttle, generisches `auditPayloads` statt source-spezifischer Slots. Refactor-Anlass; heute kein Schmerz.

**Promote when:** ein konkreter Schmerz auftaucht (Discovery vermisst Bücher, Refactor wegen neuem Source).
