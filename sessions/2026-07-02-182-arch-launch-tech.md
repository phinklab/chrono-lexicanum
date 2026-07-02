---
session: 2026-07-02-182
role: architect
date: 2026-07-02
status: open
slug: launch-tech
parent: null
links: [2026-07-02-179, 2026-06-03-121]
commits: []
---

# 182 — Launch-Tech: Focus-visible-Fix, SEO-Paket, Observability (121-Product)

## Goal

Die technischen Launch-Voraussetzungen in einem Paket: die site-weite Fokus-Sichtbarkeits-Regression fixen (WCAG 2.4.7), `sitemap.ts` + `robots.ts` + Metadata-Lücken schließen, `noindex` an Env koppeln, Home-/Default-OG-Image, Analytics + leichtes Error-Reporting, `--font-mono`-Wiring. Danach ist der Launch nur noch Config-Flip + Checkliste.

> **Startbedingung:** erst nach Merge von **P12 (URL-EN-Migration)** — sitemap und Entity-Metadata enumerieren sonst URLs, die P12 gleich wieder ändert. Ausnahme-Option: Sollte P12 sich deutlich verschieben, können Focus-Fix (W2) + Font-Wiring (W6) als Mini-PR vorgezogen werden — beide sind URL-unabhängig; Philipp entscheidet.

## Design freedom — read before everything else

Wie der sichtbare Fokus-Ring aussieht (Farbe, Stärke, Offset, ob je Surface variiert), das Design des OG-Images und wo/wie dezent Analytics eingebunden wird — deine Entscheidungen, nutze den frontend-design Skill. Architektonisch fix ist nur das Outcome: Keyboard-Fokus ist auf jeder interaktiven Fläche deutlich sichtbar, Maus-Klicks lassen keine Ringe aufblitzen, und die Metadata-Inhalte stimmen.

## Context

Quelle: Status-quo-Review 2026-07-02 (adversarial verifiziert, `main` @ `add7ab5`). Die Review-Datei ist gitignored und liegt **nicht** in deinem Worktree — alle Findings stehen vollständig hier:

- **W2 · Globales `outline: none !important` tötet Fokus-Sichtbarkeit site-weit — MEDIUM, bestätigt 6/6 Linsen (robustestes Finding des Reviews; von CSS- UND A11y-Dimension unabhängig gefunden).** Fundort: `src/app/styles/10-base.css:63` — `:focus, :focus-visible { outline: none !important }` überschreibt per `!important` **alle** ~50 per-Component-Fokus-Ringe (browse-pill, lx-btn, catalogue-row, filter-select, media-player, sogar den Modal-eigenen Gold-Ring in `64-detail-modal.css:123`). Die Docblock-Prämisse „interactive surfaces keep their own focus affordances" ist faktisch falsch. Keyboard-, Switch- und Low-Vision-Nutzer sehen nirgends, wo der Fokus steht: WCAG 2.4.7 (AA)-Verletzung auf fast der gesamten interaktiven Oberfläche. Review-empfohlene Fix-Mechanik: Blanket-Kill ersetzen durch eine `:focus-visible`-Regel mit sichtbarem Ring + `:focus:not(:focus-visible) { outline: none }` — löst auch das ursprüngliche „Ring blitzt bei Maus-Klick"-Problem, das die Regel motiviert hat. (Ring-Gestaltung: dein Call, s. o.)
- **K59 · ~50 tote Fokus-Regeln** — Folge von W2; werden mit dem Fix wieder lebendig. Nach dem Fix sichten: kohärent halten oder prunen, damit sie künftige Edits nicht wieder maskieren.
- **W5 · Keine Sitemap, keine robots.ts — MEDIUM, bestätigt 2/3.** Der Proxy-Matcher (`src/proxy.ts:19`) schließt `robots.txt|sitemap.xml` bereits aus (antizipiert sie), aber weder `app/sitemap.ts` noch `robots.ts` noch statische Dateien existieren; Roadmap 4c hat beides versprochen. Bei ~896 Büchern + ~1.100 Episoden + ~1.300 Entity-Seiten heißt das: langsame/partielle Google-Discovery genau der Long-Tail-Seiten, die nach dem Launch organischen Traffic bringen. Fix: `app/sitemap.ts` (aus den Loadern enumerieren, post-P12-URLs) + `app/robots.ts`, hinter demselben Public-Flip.
- **K12 · Site-weit `robots: index:false` hardcodiert** in `layout.tsx:58` (Preview-Modus). An Env koppeln (derselbe Public-Flip wie das Gate), damit der Launch kein Code-Deploy braucht.
- **K36 · Entity-Seiten haben nur Title-Metadata** (`welt|charakter|fraktion|person/[slug]/page.tsx`) — keine Description, kein og:image, obwohl `loadEntity` den Blurb schon lädt; `/buch` macht es vor. Gerade die link-würdigsten Seiten (z. B. `/charakter/horus`) geben karge Share-Cards ab.
- **K7 · Kein Home-/Default-OG-Image.** Buch-OG ist exzellent (Review-Urteil), aber Home + Default fehlen; Roadmap Phase 7 listet „Real Open Graph images" — muss **vor** dem Reddit-Post landen, nicht danach (der Reddit-Post selbst rendert die Home-Card).
- **K37 · Null Analytics, null Error-Monitoring — LOW, aber echtes Gap (kein dokumentierter Verzicht).** Kein @vercel/analytics, kein Error-Reporter; Error-Boundaries loggen nur nach console. Am Launch-Tag: Blindflug bei Traffic, Referrern, Fehlerraten. Absicht: Vercel Analytics + Speed Insights + ein leichter Error-Reporter (du recherchierst, was heute das passende Leichtgewicht ist — kein Full-Sentry-Setup, wenn es Schlankeres gibt). Privacy-Abschnitt in `/datenschutz` existiert bereits vorbereitend (Brief 179) — prüfen, ob die konkrete Wahl davon abgedeckt ist; wenn nicht, Text minimal nachziehen.
- **W6 · `--font-mono` zeigt auf nie geladenes JetBrains Mono — MEDIUM.** `styles/00-tokens.css:95`; `layout.tsx` lädt IBM Plex Mono (als `--font-plex-mono`), nie JetBrains. `--font-mono` wird 16× in `24-detail-modal.css` (user-facing Timeline-DetailPanel!) und ~13× in `32-book-audit.css` konsumiert → dort rendert der OS-Default-Monospace, inkonsistent zum Rest; unsichtbar auf Maintainer-Maschinen mit lokal installiertem JetBrains Mono. Fix-Absicht: Token auf den geladenen Plex-Mono-Font verdrahten (oder Token löschen + Konsumenten migrieren — dein Call). Das verwandte Klassen-Rename `.font-mono`→`.c-mono` läuft in Brief 181.
- **Canonical-Check (Review Anhang A #9, beim Public-Flip fällig):** searchParam-Filter-Routen haben keine expliziten canonicals — bislang durch site-weites noindex neutralisiert. Sobald K12 das noindex kippt, einmal prüfen, ob die aus `metadataBase` abgeleiteten canonicals für die Filter-Ansichten korrekt sind.
- **Launch-Config-Checkliste:** die nicht-Code-Settings (PREVIEW_USER/PASS-Prod-Override, Vercel Deployment Protection für Previews, Supabase Data API aus, `NEXT_PUBLIC_SITE_URL` prod, `PREVIEW_GATE=off`-Ablauf) stehen kanonisch in `brain/wiki/deferred-questions.md` § Preview-Gate — **Philipps Handoff, nicht deiner**; im Report nur daran erinnern.

## Constraints

- sitemap/robots respektieren den Preview-Zustand: solange das Gate an ist, kein Indexierungs-Signal; der Flip auf public ist ein Env-Wechsel, kein Deploy.
- sitemap enumeriert aus den bestehenden `server-only`-Loadern (kein neuer Query-Pfad, Caching-Schichtung respektieren, `max:5`-Pool im Blick — die Enumeration darf keinen neuen Kalt-Fan-out einführen).
- Entity-Metadata nutzt die bereits geladenen Blurbs (`loadEntity`) — keine Zusatz-Queries.
- Analytics-Wahl: keine Cookie-pflichtige Lösung ohne Rücksprache (Datenschutz-Kopplung, Brief 179); Dependency-Zugang im Report begründen (CLAUDE.md § What NOT to do).
- Focus-Fix: die Ersatz-Regeln ohne `!important`-Wettrüsten; K59-Sichtung gehört zum Fix, nicht zu einem späteren Pass.
- `brain/**` + `sessions/README.md` nicht anfassen (Rollup-Ownership). Product-Worktree, ein PR.

## Out of scope

- Gate-Rückbau / Launch-Cleanup (eigener Brief am Launch-Tag, siehe deferred-questions § Preview-Gate).
- Map-A11y (W7/W8 — Philipp-Entscheid 2026-07-02: nicht v1; geparkt in `brain/wiki/worklist.md` § E).
- Skip-Link, Heading-Hierarchie, Popover-Rollen (A11y-Polish → UI-Gesamt-Pass).
- Degrade-to-empty-UI-Unterscheidung (K16, dokumentierter Tradeoff — nur falls trivial mitnehmbar, sonst liegen lassen).
- Rate-Limiting, CSP-Änderungen (dokumentierte Tradeoffs, Trigger nicht erreicht).

## Acceptance

The session is done when:

- [ ] Keyboard-Tab zeigt auf jeder interaktiven Fläche (Nav, Browse-Pills, Filter, Modals, MediaPlayer, Karten-Controls) einen deutlich sichtbaren Fokus-Indikator; Maus-Klick blitzt keinen Ring; K59-Bestand gesichtet (Verdikt im Report).
- [ ] `app/sitemap.ts` + `app/robots.ts` existieren, enumerieren Bücher/Entities/Episoden aus den Loadern und verhalten sich im Preview-Zustand korrekt (kein Indexierungs-Signal vor dem Flip).
- [ ] `robots: index` hängt an Env statt hardcodiert; Canonical-Spot-Check der Filter-Routen dokumentiert.
- [ ] Entity-Seiten liefern Description (Blurb) + OG-Metadata nach `/buch`-Muster; Home + Default-OG-Image vorhanden.
- [ ] Analytics + Speed Insights + leichter Error-Reporter aktiv; Datenschutz-Abdeckung geprüft (ggf. Textzeile nachgezogen).
- [ ] `--font-mono` rendert Plex Mono im Timeline-DetailPanel + Book-Audit.
- [ ] `npm run lint` + `tsc --noEmit` + `next build` grün.

## Open questions

- Error-Reporter: was ist 2026 das schlankeste sinnvolle Setup auf Vercel (Log Drains? leichtes SDK)? Empfehlung + Begründung in den Report.
- Sitemap-Größe: bei ~3.300 URLs — eine Datei oder Index+Chunks? Dein Call nach aktueller Next-Konvention.
