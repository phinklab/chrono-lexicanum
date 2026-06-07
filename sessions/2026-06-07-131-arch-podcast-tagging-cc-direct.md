---
session: 2026-06-07-131
role: architect
date: 2026-06-07
status: open
slug: podcast-tagging-cc-direct
parent: null
links:
  - 2026-06-07-130
  - 2026-06-03-122
  - 2026-06-01-110
  - 2026-06-02-114
commits: []
---

# Podcast-Tagging via CC-Direct (Max-Plan) — schaltbare Variante B gegen API (Brief 130)

## Goal

Das Podcast-Entity-Tagging als **zweite, schaltbare Variante** ohne metered API. Statt
`extract.ts` pro Episode die Anthropic-API zu rufen, erzeugt **Claude Code in-session auf der
Max-Allowance des Maintainers** (das CC-Direct-Muster aus dem Buch-Loop) die Extraktionen als
**committed File**. Variante A (API — der heutige Pfad, den auch Brief 130 erbt) bleibt
**unverändert und Default**; Variante B (CC-Direct) kommt **additiv** daneben. Welche Variante
läuft, wählst du per Flag/Prompt: `--tagging=api` (heute) vs. `--tagging=cc-direct` (neu).

**Orthogonal zur Quelle.** Tagging und Acquisition sind zwei unabhängige Achsen:
**Quelle** (RSS | YouTube — Brief 130) × **Tagging** (API | CC-Direct — *dieser* Brief). Alle vier
Kombinationen sind gültig. Dieser Brief fasst **nur** die Tagging-Achse an; der YouTube-Adapter
gehört zu 130.

Scope: den `--tagging`-Schalter + den CC-Direct-Pfad bauen, Variante A **unangetastet** lassen,
plus ein Verifikations-Lauf von **20 Episoden** (2 Auto-Batches à 10) über CC-Direct (null API-Call),
dessen Artefakt **form-identisch** zum API-Pfad ist. **Kein DB-Write.**

> **Beziehung zu Brief 130.** 130 (YouTube-Adapter, Variante A/API) wird **nicht umgeschrieben** —
> es bleibt der API-Pfad und der Default. 131 ist seine Schwester auf der Tagging-Achse. Nach 131
> existieren beide Pfade nebeneinander; du schaltest per Flag/Prompt. 131 ist **quellen-agnostisch**
> und braucht 130 nicht zwingend (Demo kann auf einer bestehenden RSS-Show laufen) — für eine
> luetin09-Demo setzt es den Adapter aus 130 voraus.

> **Strang:** Batches (`chrono-lexicanum-batches`) → Branch `codex/ingest-batches-podcast-cc-tagging`
> + PR. Dieser Brief ist doc-only und liegt auf `main`.

## Context

Vom Architekten am 2026-06-07 verifiziert — **CC liest die Dateien dennoch selbst gegen**, nicht
blind übernehmen.

**Die Naht ist `EpisodeExtraction` pro Episode.** Heute (`src/lib/ingestion/podcast/`):

- `ingest-podcast.ts` ist monolithisch: pro Episode `extractEpisodeEntities(ep, {client, model, cache})`
  → **Anthropic-API-Call** (forced tool call, `temperature: 0`, gecached unter `ingest/.llm-cache/`)
  → `resolveEpisodeTags(extraction)` → `buildShowArtifact`.
- `extract.ts` **ist** der API-Call (`@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`). Sein Output ist
  `EpisodeExtraction`:

  ```ts
  interface EpisodeExtraction {
    episodeKind: "lore" | "news_recap" | "interview" | "other";
    characters: { primary: string[]; mentioned: string[] };  // surface-forms, keine slugs
    factions:   { primary: string[]; mentioned: string[] };
    locations:  { primary: string[]; mentioned: string[] };
  }
  ```

- `resolve.ts` (`resolveEpisodeTags`) und `artifact.ts` (`buildShowArtifact`) konsumieren
  `EpisodeExtraction` **quellen-/modus-agnostisch** — sie wissen nicht und kümmern sich nicht darum,
  *wer* die Extraction erzeugt hat. Das ist der Hebel: **dieselbe `EpisodeExtraction`, anderer
  Erzeuger** (API → CC auf Max-Plan), Downstream unverändert.

**Präzedenz — der Buch-Backfill läuft bereits so.** ADR
[`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md)
(entschieden Brief 061): statt der metered API (`src/lib/ingestion/v2/llm/enrich.ts`) öffnet der
Maintainer eine `claude -p`-Subsession (Claude Code, Max-Allowance, Default-Modell), die liest
Roster + Konventionen und schreibt `manual-overrides-…json` **direkt**; `apply-override.ts`
konsumiert sie. 150+ Bücher so gelaufen. § Why dort wörtlich der Grund hier: *„Kein separates
Token-Budget … CC-Subsessions laufen gegen die generelle Claude-Allowance … vermeidet die parallele
API-Key-Wartung"* + höhere Modell-Qualität. **131 dehnt dasselbe Muster aufs Podcast-Tagging aus —
als zuschaltbare Option, nicht als Ersatz** (anders als beim Buch-Pfad, wo die API-Stage geparkt
wurde; hier bleibt sie als Variante A live).

**Konventionen stecken heute in `EPISODE_SYSTEM_PROMPT` + dem Tool-Schema** (`extract.ts`):
Achsen-Definitionen (characters/factions/locations), surface-form-Treue, „nur in-universe Entities"
(Hosts/Autoren/GW sind keine Tags), `episodeKind`-Klassen, „leere Listen sind die richtige Antwort".
Diese Semantik ist sorgfältig getunt und muss **erhalten** bleiben, wenn der Erzeuger wechselt.

## Decision

1. **`--tagging`-Schalter, Default `api`.** `api` = heutiges Verhalten, **byte-identisch**. `cc-direct`
   = der neue Pfad. Kein bestehender Lauf ändert sich; 130 (API) bleibt der Default-Pfad.
2. **`cc-direct` = acquire → tag(CC) → assemble** um ein **committed `EpisodeExtraction`-File**
   (per Show, gekeyt auf `episodeGuid`). Kein API-Call im gesamten cc-direct-Pfad.
3. **`extract.ts` bleibt** als `api`-Mode — **nicht parken, nicht löschen**. Es *ist* Variante A.
4. **`resolve.ts` + `artifact.ts` + `apply-podcast.ts` unverändert** (Diff = 0). Sie konsumieren
   `EpisodeExtraction` bzw. das Artefakt, modus-agnostisch.

## Der schaltbare Pfad

**Variante A — `api` (unverändert, Default):**

```
npm run ingest:podcast -- --show <slug>              # one-shot, API-Tagging (wie heute / Brief 130)
```

**Variante B — `cc-direct` (neu, mehrstufig, kein API):**

```
npm run ingest:podcast -- --show <slug> --tagging=cc-direct --stage=acquire
#   → schreibt ingest/podcasts/<slug>.episodes.json  (Manifest, reine Metadaten, KEIN LLM)
npm run ingest:podcast:tag -- --show <slug>
#   → AUTOMATISIERTER Batch-Loop: spawnt pro 10er-Batch eine FRISCHE `claude -p`-Subsession
#     (eigener Prozess = frischer Kontext, automatisches close/reopen — KEIN manuelles /clear),
#     nimmt pro Batch valides Batch-JSON entgegen, validiert/merged es sequenziell in
#     ingest/podcasts/<slug>.extractions.json; resumebar (überspringt bereits getaggte guids).
#     Max-Allowance, null API. Siehe § Automatisierter Batch-Driver.
npm run ingest:podcast -- --show <slug> --tagging=cc-direct --stage=assemble
#   → liest Manifest + extractions → resolveEpisodeTags → buildShowArtifact
#   → ingest/podcasts/<slug>.json + report   (KEIN API-Call)
```

Die exakte CLI-Form (Sub-Commands vs. `--stage`-Flag, Namen) ist **CCs Entscheidung** — der Brief
spezifiziert den **Contract**: ein Modus-Selektor; `api` = unveränderter One-Shot; `cc-direct` =
Manifest → committed extractions-File → Assemble, ohne API.

## Automatisierter Batch-Driver (kein manuelles `/clear`)

Der Tag-Schritt ist **ein** Befehl (`npm run ingest:podcast:tag -- --show <slug>`), der einen Driver
nach dem Vorbild von [`scripts/run-ssot-loop.sh`](../scripts/run-ssot-loop.sh) fährt:

- **Harte Batch-Größe: 10.** Der Driver liest das Manifest und zerlegt die noch nicht getaggten Folgen
  in Chunks von **genau 10** (keine Range, keine Heuristik).
- **Frischer Kontext pro Batch, automatisch.** Pro Chunk spawnt der Driver eine **eigene headless
  `claude -p`-Subsession** (eigener Prozess → frischer Kontext). Das IST das automatische
  „close/reopen": nach jedem Batch ist der Kontext weg, der nächste startet leer — **ohne dass der
  Maintainer `/clear` tippt**. Die Subsession taggt exakt ihre 10 guids (Konventions-Doc + die 10
  Beschreibungen aus dem Manifest) und liefert **ein Batch-JSON** zurück. Der Driver validiert dieses
  JSON gegen den `EpisodeExtraction`-Contract, merged es **sequenziell** in `<slug>.extractions.json`
  und schreibt die Datei atomar/deterministisch (Key-Sortierung; kein konkurrierender JSON-Append).
- **Resumebar / idempotent.** Vor jedem Batch überspringt der Driver guids, die bereits im
  `extractions`-File stehen. Abbruch/Neustart setzt nahtlos fort; ein zweiter Voll-Lauf ist ein No-op.
- **Max-Allowance, null metered API.** Wie der Buch-Loop ziehen die `claude -p`-Subsessions gegen die
  Claude-Allowance — kein `ANTHROPIC_API_KEY`, kein `@anthropic-ai/sdk`.
- **Der Bash-Driver hält null LLM-Kontext.** Die ganze Token-Last sitzt ausschließlich in den kurzen,
  je-10er-frischen Subsessions (Batch-Kontext ≈ Konventions-Doc + 10 Beschreibungen ≈ ~17k Token).

Damit ist die „dumb zone" (>120k) strukturell unerreichbar: **kein Kontext sieht je mehr als 10 Folgen**,
und der Maintainer startet genau einen Befehl.

## Committed `extractions`-File + Konventions-Doc

- **`<slug>.extractions.json`** (committed, wie die Buch-Overrides): `{ episodeGuid → EpisodeExtraction }`.
  Gekeyt auf `episodeGuid` (stabil, human-readable) statt auf den API-Cache-Hash — es ist ein
  **kuratiertes, versioniertes Input-File**, kein Cache. Liegt versioniert im Repo (nicht gitignored
  wie `ingest/.llm-cache/`).
- **Konventions-Doc** (committed): die Tagging-Regeln aus `EPISODE_SYSTEM_PROMPT` + Tool-Schema in ein
  menschenlesbares Doc extrahieren, das die CC-Tagging-Session liest. So bleibt die getunte
  Tagging-Semantik erhalten; nur der Erzeuger wechselt. `resolve.ts` (Alias-Auflösung) bleibt der
  deterministische Konsument — CC erzeugt **surface-forms**, nicht canonical-IDs (exakt die
  Arbeitsteilung des Buch-Loops: „Pipeline produziert Surface-Forms, Resolver crystallisiert sie").

## Migration der bestehenden Shows — ohne Re-Tag, ohne API

Die zwei RSS-Shows (`the-40k-lorecast`, `adeptus-ridiculous` — Letztere 363 Folgen) sind via API
getaggt; ihre Artefakte sind committed. Sie sollen unter `cc-direct` laufen, **ohne 363 Folgen neu
zu taggen**: das committed `<slug>.json` trägt pro Episode bereits `episodeKind` + `tags[]`
(`rawName`, `role`, `type`) + `unresolved[]` (`rawName`, `axisGuess`, `role`). Daraus lässt sich die
für den neuen Assemble-Pfad nötige **kompatible `EpisodeExtraction`** ableiten (`role:subject→primary`,
`mentioned→mentioned`, `type`/`axisGuess`→Achse). Das ist **keine historische Rekonstruktion der
ursprünglichen pre-resolve LLM-Extraction**: `resolveEpisodeTags` dedupliziert bereits im bestehenden
Artefakt nach `(type, canonicalId)` und behält dabei eine Raw-Form. Der Beweis ist deshalb
**Artefakt-Äquivalenz**, nicht Original-Extraction-Verlustfreiheit. Ein **einmaliges, rein lokales
Skript** (kein API, kein Netzwerk) erzeugt `<slug>.extractions.json` aus `<slug>.json`. Re-`assemble`
darüber muss dasselbe Downstream-Artefakt reproduzieren (inkl. `extraction.model`/`promptVersion`,
sofern das Legacy-Artefakt diese Felder trägt).

## Constraints (hart)

- **Variante A (`api`) bleibt Default und verhaltens-identisch.** Kein bestehender Lauf / kein
  bestehendes Artefakt ändert sich. `--tagging=api` ⇒ heutiger Code-Pfad.
- **Im `cc-direct`-Pfad null Aufrufe der metered API.** `extract.ts` / `@anthropic-ai/sdk` werden
  im cc-direct-Laufpfad **nicht** ausgeführt/importiert. Praktisch heißt das: der CLI muss erst
  `--tagging`/`--stage` parsen; `Anthropic`-Import, Client-Erzeugung und `ANTHROPIC_API_KEY`-Gate
  laufen nur im `api`-Modus (z. B. lazy import oder getrenntes API-Modul).
- **Kontext-Disziplin — harte Batch-Größe 10, automatisch, kein manuelles `/clear`.** Das Tagging läuft
  NIE als *eine* Session über die ganze Show. Ein **automatisierter Driver** (§ Automatisierter
  Batch-Driver; Vorbild `scripts/run-ssot-loop.sh`) zerlegt die Folgen in **Batches von genau 10** und
  spawnt **pro Batch eine frische `claude -p`-Subsession** (eigener Prozess = frischer Kontext →
  automatisches close/reopen). Der Maintainer startet **einen** Befehl; der Loop iteriert selbst —
  **kein händisches `/clear`**. Pro Folge zustandslos. Jeder Batch-Kontext ≈ Konventions-Doc + 10
  Beschreibungen ≈ ~17k Token, **klar unter ~120k**. Der Driver-Prozess (Bash) hält null LLM-Kontext;
  resumebar (überspringt bereits im `extractions`-File vorhandene guids).
- **Kein Voll-Vokabular im Tagging-Kontext.** Der Tagger sieht das Konventions-Doc + die Episode
  (Beschreibung gekappt wie `MAX_DESC_CHARS`), **NICHT** die vollständigen
  `characters/factions/locations`-Listen. Surface-Forms werden frei emittiert; die deterministische
  Auflösung gegen den Alias-Index macht `resolve.ts` danach (exakt wie im API-Pfad). Das hält jeden
  Kontext klein und vermeidet den größten Token-Sink. (Ein einzelner Grenzfall darf ad-hoc gegen die
  Aliase geprüft werden — aber kein Preload der ganzen Listen.)
- **`resolve.ts`, `artifact.ts` (Determinismus-/Sortier-/Report-Logik), `apply-podcast.ts`
  unverändert** (Diff = 0).
- **Artefakt-Parität:** das `cc-direct`-Artefakt ist **form-identisch** zum `api`-Artefakt (gleiche
  Keys/Shape); nur die Tag-*Werte* dürfen sich nach Modell-Urteil unterscheiden. Downstream (Apply,
  Reader) darf nicht unterscheiden können, welcher Modus es erzeugt hat.
- **Kein Schema-/Migrations-Change.**
- **Version-Policy:** keine Pins.
- **TypeScript strict, server-seitig.**

## Out of scope (explizit NICHT anfassen)

- **`extract.ts` / die API-Variante entfernen oder parken** — sie bleibt live als Variante A.
- **Voll-Backfill-Tagging großer Shows via CC** (Volumen: adeptus-ridiculous = 363, luetin09 = Hunderte) —
  eigener, gebündelter Folge-Lauf nach dem Buch-Loop-Muster (ggf. ein `run-ssot-loop.sh`-artiger
  Wrapper für die CC-Tagging-Batches). **Dieser Brief taggt nur die ersten 20 Demo-Folgen via CC
  (2 automatische Batches à 10).**
- **Der YouTube-Adapter** (Brief 130) — nicht hier bauen.
- **DB-Apply** (Brief 130 § „Dokumentierter Folgeschritt": `source_kind` etc.).
- **Downstream** (Reader/Search/`resolve`) refactoren.

## Acceptance

Die Session ist fertig, wenn:

- [ ] **`--tagging`-Selektor** (`api` default, `cc-direct` neu) existiert; `--tagging=api` ist
      byte-identisch zum heutigen Verhalten (bestehende RSS-Artefakte rendern unverändert; RSS-
      Warm-Cache-Diff gegen `the-40k-lorecast`/`adeptus-ridiculous` im Report, sofern Cache vorhanden).
- [ ] **`cc-direct`-Pfad:** `acquire` schreibt `<slug>.episodes.json` (Manifest, reine Metadaten,
      kein LLM); `assemble` liest Manifest + `<slug>.extractions.json` → `<slug>.json` + report;
      **null API-Calls** im gesamten Pfad.
- [ ] **Committed `EpisodeExtraction`-File-Contract** (per Show, gekeyt auf `episodeGuid`) +
      **Konventions-Doc** (aus `EPISODE_SYSTEM_PROMPT`/Tool-Schema extrahiert).
- [ ] **Migration:** ein lokales Skript rekonstruiert `<slug>.extractions.json` aus dem committed
      `<slug>.json` für die bestehenden RSS-Shows als kompatible Extraction-Datei; ein Re-`assemble`
      darüber **reproduziert das Downstream-Artefakt** (Artefakt-Äquivalenz-Beweis; nicht Behauptung
      der ursprünglichen pre-resolve LLM-Extraction-Verlustfreiheit). Kein Re-Tag, kein API.
- [ ] **`resolve.ts` / `artifact.ts` / `apply-podcast.ts` unverändert** (Diff = 0).
- [ ] **Demo:** für eine Show — **luetin09**, falls Brief 130 implementiert; sonst **the-40k-lorecast** —
      werden die **ersten 20 Episoden** via CC-Direct getaggt, d. h. der Driver fährt **2 Batches à 10
      automatisch** (Beweis des auto close/reopen — kein manuelles `/clear` dazwischen). `assemble` baut
      das Artefakt; es ist **form-identisch** zu einem `api`-getaggten Artefakt derselben 20 Episoden
      (Vergleich im Report).
- [ ] **Automatisierter Batch-Driver** (`npm run ingest:podcast:tag`, Vorbild `run-ssot-loop.sh`):
      harte Batch-Größe **10**, frische `claude -p`-Subsession pro Batch (auto close/reopen, **kein
      manuelles `/clear`**), validiertes sequenzielles Merge ins `extractions`-File, **resumebar**
      (überspringt getaggte guids).
      Der Report dokumentiert den **Token-Rahmen pro Batch** (Beleg: klar unter ~120k). Den Driver über
      den **gesamten** Katalog laufen zu lassen ist Maintainer-Betrieb, kein Build-Schritt.
- [ ] `npm run typecheck` + `npm run lint` grün. **Kein `@anthropic-ai/sdk`-Import im
      `cc-direct`-Laufpfad** (durch lazy import / getrennte Module belegt).

## Open questions (im Report beantworten)

- Wo lebt das `extractions`-File am besten — `ingest/podcasts/<slug>.extractions.json` (bei den
  Artefakten) oder `scripts/seed-data/` (bei den Buch-Overrides)? CC schlägt vor + begründet.
- Ist die Rekonstruktion aus dem Artefakt für **alle** bestehenden Episoden artefakt-äquivalent, oder
  gibt es Fälle (z. B. fehlender `rawName`, Alias-Drift seit dem API-Lauf, deduplizierte Raw-Forms), die
  ein byte-identisches Re-`assemble` verhindern? Bericht + Mitigation.
- Bestätige, dass die headless `claude -p`-Subsession aus dem Driver heraus zuverlässig auf die
  Max-Allowance zugreift (wie `run-ssot-loop.sh`) und valides Batch-JSON an den Driver liefert; der
  Driver merged strikt sequenziell/atomar ins `extractions`-File (kein nebenläufiger Append).
- Soll der Modus auch in `package.json` als eigenes Script sichtbar werden (`ingest:podcast:acquire` /
  `:assemble`), oder nur als Flag? CCs Vorschlag.

## Notes (illustrativ — KEINE fertige Implementierung)

**`extractions`-File (Form):**

```jsonc
{
  "dQw4w9WgXcQ": {                                  // Key = episodeGuid (YouTube-Video-ID / RSS-<guid>)
    "episodeKind": "lore",
    "characters": { "primary": ["Konrad Curze"], "mentioned": [] },
    "factions":   { "primary": ["Night Lords"], "mentioned": ["Inquisition"] },
    "locations":  { "primary": [], "mentioned": ["Terra"] }
  }
}
```

**Rekonstruktion (Form):** pro Artefakt-Episode → `tags[].{rawName, role, type}` +
`unresolved[].{rawName, axisGuess, role}` zurück in eine **kompatible** Extraction
`{characters,factions,locations}.{primary(=role:subject), mentioned}` + `episodeKind`. Das Ziel ist
ein byte-/formgleiches Re-`assemble` des bestehenden Artefakts; die ursprüngliche pre-resolve
LLM-Extraction wird nicht behauptet.

**CC-Direct-Tagging operativ:** kein `claude.messages.create`-Skript — die Tagging-Einheit ist eine
headless `claude -p`-Subsession (Max-Plan, Default-/Sonnet-Modell), **automatisch je 10er-Batch vom
Driver gespawnt** (§ Automatisierter Batch-Driver). Jede Subsession sieht nur das Konventions-Doc + ihre
10 Beschreibungen, **kein Voll-Vokabular** (Surface-Forms frei; `resolve.ts` matcht deterministisch).
Frischer Prozess = frischer Kontext pro Batch → automatisches close/reopen **ohne manuelles `/clear`**.
Exakt der Buch-Loop (10 pro Iteration), auf Episoden gemünzt. Demo = erste 20 Folgen = 2 Auto-Batches;
der Voll-Katalog ist derselbe Driver-Befehl im Maintainer-Betrieb.

**ADR-Notiz:** Cowork faltet in der Koordinations-Pass einen ADR (`why-cc-direct-podcast-tagging.md`
oder eine Erweiterung von `why-cc-direct-curation.md`), der diese Zwei-Varianten-Entscheidung
festhält. `brain/**` + `sessions/README.md` sind coord-only → CC trägt substanzielle Fakten in den
**Impl-Report**, Cowork backfillt.
