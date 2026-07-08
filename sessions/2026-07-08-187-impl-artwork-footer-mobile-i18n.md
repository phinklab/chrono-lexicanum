---
session: 2026-07-08-187
role: implementer
date: 2026-07-08
status: complete
slug: artwork-footer-mobile-i18n
parent: none            # maintainer-direct session (website changes round 3)
links: []
commits: []
---

# Artwork-Text, Footer-Links, drei Mobile-Fixes + i18n-Recherche

## Summary

Direkte Maintainer-Session mit sechs Punkten: neuer Intro-Text auf /artwork
(phinklabs-Link raus), Artwork-Link im ArchiveFooter, „Scroll for more" am
Cartographer-Bottom-Sheet, Voyage-Flimmer- und Music-Player-Fix auf Mobile,
Background-Zentrierung auf Phone-Portrait. Sechster Punkt (Impressum/
Datenschutz englisch + EN/DE/RU-Toggle) war explizit **nur Recherche + 
Konstruktionsvorschlag** — keine Übersetzung, keine Implementierung; das
Ergebnis steht unten als Empfehlung für den nächsten Architect-Brief.

## What I did

### 1. /artwork Intro-Text (`src/app/artwork/page.tsx`)
Neuer Wortlaut nach Philipps Vorgabe (Tippfehler bereinigt): eigene Arbeiten,
unzählige Stunden Digital-Artwork/Photobashing-Lernen, **kein AI-Anteil** →
nutzbar für Warhammer-Fanprojekte im Sinne von GWs non-AI-Policy, Download
für jeden Zweck frei, Attribution erwünscht aber nicht nötig. Der
phinklabs.com-Link ist entfernt; Buchcover/Era-Artwork bleiben wie gehabt
ausgenommen.

### 2. Footer-Legal-Zeile (`src/components/chrome/ArchiveFooter.tsx`)
Die Imprimatur-Fußzeile führt jetzt Impressum · Datenschutz · **Artwork** —
gleiche Separator-Grammatik wie `SiteLegal` (das alle drei schon hatte).

### 3. „Scroll for more" am Chart-Drawer (`CartoucheSheet.tsx`, `55-map.css`)
Unter dem nackten Grip-Strich des Mobile-Sheets steht jetzt ein Mono-Label
„SCROLL FOR MORE" (`--fs-label-3xs`, `--cl-gold-dim`, Site-Voice). Nur im
geschlossenen Dock; `.cg-sheet.open` blendet es aus und der Grip fällt auf
seine 26px zurück. Grip-Höhe ist content-getrieben — die JS-Drag-Messung
(`closedH = offsetHeight`) folgt automatisch.

### 4. Voyage-Flimmern beim Draggen (`55-map.css`, ≤900px-Block)
Root-Cause-Hypothese: `cgRtFly` — die endlose Marching-Dash-Animation auf den
mask-revealten Kurs-Pfaden — re-rasterisiert das gesamte SVG jede Frame;
zusammen mit der Pan-Transform flimmert das auf Phone-GPUs. Fix mobil:
`.cg-rtFly { animation: none; }` (Route bleibt gestrichelt sichtbar, der
Konvoi-Marsch bleibt Desktop-Geste) plus `animation-play-state: paused` für
Draw-in/Station-Blooms solange `.cg-chart.moving`. **Auf dem Gerät
verifizieren** — im Desktop-Emulator ist das Flimmern nicht reproduzierbar.

### 5. Music-Player unsichtbar bei aktiver Voyage (`56-media-player.css`)
Im Emulator öffnet die Stud-Karte korrekt (Layout/z-Index alle sauber:
Player z-40 über Sheet 24/Popup 25/Card 18) — der Bug ist daher fast sicher
dasselbe Compositing-Problem wie #4. Zusätzlich zum Animations-Stopp bekommt
`body.cg-on-map .media-player` eine eigene GPU-Layer
(`transform: translateZ(0)`), damit die Karte nicht im Repaint-Sturm des
Charts mitgemalt werden muss. **Auf dem Gerät verifizieren.**

### 6. Background-Zentrierung Phone-Portrait (`SiteBackground.tsx`, `41-site-bg.css`)
Alle „main"-Variant-Seiten (Hub, Archive, Podcasts, Ask, Compendium) croppen
desktop `right bottom` — ein 9:19-Slice davon zeigt fast nur die rechte Wand
der Library Nave. Neu: per-Variant-Mobile-Position **im Component** (eine
Quelle statt sieben Callsites): `MOBILE_POSITIONS = { main: "center bottom" }`
landet als `--bg-pos-m` inline; `41-site-bg.css` schaltet ≤760px auf
`var(--bg-pos-m, center) !important` (das `!important` schlägt das
Inline-Desktop-Position-Attribut; Fallback = Desktop-Position, andere
Varianten bewegen sich nicht). Logins Desktop-Override (≥960px) bleibt
unberührt.

## Verification

- `tsc --noEmit` und `eslint` (geänderte Files) grün.
- Preview 375×812: Artwork-Text + Footer-Links + Grip-Label (zu/offen) +
  computed `background-position: 50% 100%` auf `/` geprüft; Route zeichnet
  mit `animation: none` weiterhin, Course-Card + Sheet-Toggle funktionieren;
  Player-Transform auf Map = eigene Layer.
- Punkte 4/5 sind GPU-abhängig → Philipps Phone-Check ist der eigentliche Test.
- Nebenfund beim Verifizieren: frischer Worktree ohne `.env.local` → Hub 500;
  Kopie aus dem Haupt-Worktree + `.next`-Reset nötig (bekanntes
  Stale-`.next`-Muster, Hydration hing ohne Konsolen-Fehler).

## i18n-Vorschlag (Recherche-Ergebnis, Stand 2026-07 — nichts implementiert)

Recherchiert mit Web-Verifikation (Library-Pflegestand Juli 2026). Kurzfassung
für den nächsten Arch-Brief; Übersetzung selbst macht ein günstigeres Modell.

**Sofortziel (Impressum/Datenschutz, EN-Default, EN/DE-Toggle):**
[next-intl](https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing)
im offiziell dokumentierten **„without i18n routing"-Setup**: Locale aus
einem Cookie (Default `en`), gelesen via `getRequestConfig`; keine
Middleware-Änderung, keine URL-Änderung, kein `[locale]`-Segment. Der Toggle
ist eine kleine Client-Component (Server-Action setzt Cookie +
`router.refresh()`). Für den langen Rechtstext **keine** Message-Keys,
sondern **eine Content-Component pro Sprache** (`ImprintDe`/`ImprintEn`,
ausgewählt über `getLocale()`) — bei Rechtstexten ist Duplikation pro Sprache
der übliche, ehrliche Standard; die `legal__*`-CSS bleibt unangetastet.
`lang`-Attribut dynamisch setzen. Nebeneffekt: die zwei Seiten werden
dynamisch gerendert (Cookie-Read) — bei Hobby-Traffic irrelevant.

**Zielbild später (EN/DE/RU site-weit):** dasselbe next-intl mit
**Sub-Path-Routing** (`/de/...`, `/ru/...`, EN präfixfrei via
`localePrefix: 'as-needed'`) — SEO-Best-Practice mit reziproken
hreflang-Links, nur für tatsächlich übersetzte Routen. next-intl ist der
De-facto-Standard für den App Router (v4, ~3,9 M Downloads/Woche, RSC-nativ,
~4 kB Client-Runtime). Next-16-Fallstricke bekannt & beherrschbar: async
`params`, `setRequestLocale()` für statisches Rendering, `createMiddleware`
in den bestehenden `src/proxy.ts` **hineinkomponieren** (dokumentiertes
Muster).

**Migrationspfad ohne Rework:** Das without-routing-Setup ist explizit als
Einstieg in den Sub-Path-Ausbau dokumentiert — Messages, Provider,
Request-Config und die per-Locale-Legal-Components bleiben; es kommt nur
`[locale]`-Segment + routing.ts + hreflang hinzu. Einziges Wegwerfstück: die
~20-zeilige Cookie-Action des Toggles.

**DB-Content (Beschreibungen etc.):** UI-Strings in Dateien, Fachcontent in
der DB — nie mischen. Empfehlung: **Sidecar-Übersetzungstabellen**
(`work_translations(work_id, locale, …)`), englische Basiszeile bleibt
kanonisch (Per-Buch-SSOT unverändert), Fallback per
`LEFT JOIN … COALESCE`, und das vorhandene `source_kind`/`confidence`-Muster
passt 1:1 für maschinenübersetzte Zeilen (`source_kind='mt'` + Review-Flag).
JSONB-per-Feld bricht Queries/Suche; Spalten-pro-Sprache skaliert nicht auf RU+.

**Verworfen:** next-international (Pflege faktisch eingestellt),
react-i18next im RSC (Boilerplate/Runtime ohne Mehrwert hier), Lingui
(Extraction-Workflow Overkill), Eigenbau (kein Migrationspfad; next-intl
minimal ist kaum teurer).

## For next session

- Philipp: Punkte 4/5 auf dem Phone gegentesten (Voyage wählen → draggen;
  Music-Stud bei aktiver Voyage).
- Arch-Brief für die Legal-i18n-Umsetzung nach obigem Vorschlag; die
  EN-Erstübersetzung der beiden Seiten macht das Übersetzer-Modell.
- `.claude/launch.json` (neu, committet) trägt jetzt `autoPort` fürs
  Preview-Tooling — bewusst generisch gehalten.
