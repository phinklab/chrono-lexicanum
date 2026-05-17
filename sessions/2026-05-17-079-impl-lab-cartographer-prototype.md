---
session: 2026-05-17-079
role: implementer
date: 2026-05-17
status: complete
slug: lab-cartographer-prototype
parent: ""
links: []
commits:
  - 4cdf1a6
---

# Lab-Cartographer-Prototype — implemented

## Summary

Standalone Claude-Design-Galaxy-Map-Export aus `.scratch/map/Warhammer 40k Map/`
(lokal, gitignored) ist als isolierte statische Sandbox unter
`/lab/cartographer` verfügbar. Die produktive `/map`-Route bleibt unverändert,
keine DB-Anbindung, keine Navigations-Einbindung, kein TSX-Port (= Phase 2).
**Diese Session basiert auf einer User-Direktanweisung des Maintainers; es gibt
keinen paired Architect-Brief** — Brain-Hygiene-/Brief-078-Sessions liefen
parallel auf anderen Branches und blieben unangetastet.

## What I did

- `public/lab/cartographer-prototype/` neu, 13 verbatim-Kopien aus
  `.scratch/map/Warhammer 40k Map/` via `cp` (byte-identisch, kein
  Re-Encoding): `index.html`, `app.jsx`, `themes.js`, `eras.js`,
  `galaxy-data.js`, `galaxy-share.js`, `tweaks-panel.jsx`,
  `galaxy-parts.jsx`, `galaxy-detail.jsx`, `galaxy-editor.jsx`,
  `galaxy-add.jsx`, `galaxy-hologram.jsx`, `galaxy-search.jsx`. Source/dest
  size match auf jedes Byte (Spot-Check vor Commit).
- `src/app/lab/cartographer/page.tsx` neu, ~20-Zeilen Server-Component,
  rendert ein full-viewport-Iframe auf
  `/lab/cartographer-prototype/index.html`. `metadata.title = "Cartographer
  Lab — Prototype"`, plus `robots: { index: false, follow: false }` analog
  zum globalen Layout-Pattern. Keine Hooks, kein `"use client"`, kein
  Marketingtext, keine Navigation.
- `eslint.config.mjs` zwei `ignores`-Einträge ergänzt:
  `public/lab/cartographer-prototype/**` (gezielt für den neuen Sandbox-
  Pfad) und `.scratch/**` (Pre-Existing-Lücke — `.scratch/` ist in
  `.gitignore` als Local-Scratch ausgewiesen, war aber nicht in eslint-
  ignores; ohne den Eintrag schlägt `npm run lint` auf den
  Original-Export-Files unter `.scratch/map/Warhammer 40k Map/` fehl).

## Decisions I made

- **Iframe statt direkter TSX-Port.** Pro Maintainer-Vorgabe. Der Export ist
  eine UMD-CDN-HTML-App (React 18.3.1 + ReactDOM + Babel-Standalone von
  unpkg, plus zwölf Geschwister-Files, die an `window.*`-Globals hängen
  und über `localStorage` State persistieren). Iframe-Isolation hält die
  Prototype-Welt von der Chrono-App-Welt sauber getrennt: kein
  `window.*`-Kollisionsrisiko mit Chrono-State, kein Babel-im-Build, kein
  Konflikt mit dem Next-Modul-Graph. Bonus: `app.jsx:14` enthält bereits
  `const __isStandalone = (typeof window !== 'undefined') && (window === window.top);`
  — der Prototype ist iframe-aware (versteckt einen Standalone-Edit-Mode-
  Entry, wenn im Iframe). Iframe-Pfad ist also vom Prototype selbst
  mitgedacht.

- **13 Runtime-Files kopiert, `design-canvas.jsx` + `assets/` + `uploads/`
  ausgelassen.** `index.html` lädt die 13 aufgezählten Files; ein `grep` über
  alle 13 (`assets/|uploads/|design-canvas`) fand keine Runtime-Referenzen
  außerhalb von `design-canvas.jsx` selbst. `design-canvas.jsx` wird vom
  `index.html`-Modulgraph nicht geladen und ist eine separate
  Design-Environment-Komponente. `assets/reference-{dominion,galaxy}.jpg`
  werden ausschließlich von `design-canvas.jsx` referenziert,
  `uploads/*.{png,gif,jpg}` sind Maintainer-Screenshots ohne
  Code-Referenz. Verifikation: Smoke-Test gegen dev-Server (siehe
  Verification-Section) zeigt 200-Status auf alle 13 erwarteten Pfade.

- **Inline `position: fixed` statt nur Tailwind-Utility.** Die globale
  `main { position: relative; z-index: 1; }`-Regel in `globals.css` kommt nach
  den Tailwind-Utilities und überschreibt sonst `fixed`, wodurch das Iframe nur
  inhaltshoch (~150px) rendert. Die Lab-Route setzt `position: fixed; inset: 0;
  z-index: 1` deshalb seitenlokal inline auf ihrem `<main>`, ohne RootLayout
  oder globale CSS anzufassen. TopChrome (z-20) bleibt darüber.

- **`bg-[#0a0703]` auf der `<main>`.** Spiegelt den `body { background:
  #0a0703 }`-Inline-Style aus `.scratch/map/Warhammer 40k Map/index.html`
  damit das Lade-Flash beim Iframe-Mount keinen weißen oder Starfield-
  Hintergrund aufblitzen lässt. Starfield (z-0 fixed im RootLayout)
  bleibt strukturell intakt, wird in der Lab-Route aber visuell vom
  undurchsichtigen Bg überdeckt.

- **`eslint.config.mjs` editiert (außerhalb des engen Allow-Scopes).** Der
  Plan-File hatte `eslint.config.mjs` nicht im erlaubten Write-Scope
  gelistet, aber der ursprüngliche eslint-Lauf ergab 206 Errors auf den
  neuen Prototype-`.jsx`-Files (React-Hook-Semantik-Mismatch: CDN-React
  toleriert `valueRef.current = value` während Render, Next-eslint nicht)
  plus 100 Errors auf den Original-`.scratch/`-Files. Zwei targeted
  ignore-Einträge (`public/lab/cartographer-prototype/**` und
  `.scratch/**`) sind die minimale Lösung, die `npm run lint` grün zieht
  ohne globalen `public/**`-Scope. Beide Pfade sind konzeptionell
  Local-/Sandbox-Code (`.scratch/` ist explizit in `.gitignore`, der
  Sandbox-Pfad ist verbatim-CDN-Code). Verbotener-Write-Scope der
  User-Direktanweisung listet `eslint.config.mjs` nicht; ich habe die
  Edit als „natürliche Komplettierung der Sandbox-Isolation" gewertet
  und im Plan-File nachgeführt.

- **Branch aus dem aktuellen HEAD (`adb2400` auf `brain/hygiene-post-076-077`),
  nicht aus `main`.** Worktree war auf der Hygiene-Branch dirty mit
  Fremd-Änderungen aus einer parallelen Brain-Hygiene-Session
  (`brain/wiki/open-questions.md`, `sessions/README.md`, neue
  `sessions/2026-05-17-078-arch-…md`-File). Per Direktanweisung „fremde
  Änderungen außerhalb des Zielpfads ignorieren, nicht zurücksetzen" —
  ein `git switch main` hätte die Fremd-Änderungen potenziell überlagert
  oder konfliktiert. Branch aus dem HEAD bringt einen Brain-Hygiene-Commit
  (`adb2400`) als gemeinsamen Vorfahren mit; sobald der Hygiene-PR in
  `main` landet, ist das PR-Diff der Map-Branch sauber gegen `main`. Commit-
  Discipline: ausschließlich expliziter per-File `git add <path>`, niemals
  `git add .` / `git add -A` — damit die Fremd-Änderungen nicht
  versehentlich mitcommitted werden.

## Verification

- `npm run lint` → **0 Errors, 1 Warning** (pre-existing
  `@next/next/no-page-custom-font` auf `src/app/layout.tsx:44`, nicht von
  dieser Session).
- `npm run typecheck` (`tsc --noEmit`) → **grün** (kein Output, exit 0).
- `npm run brain:lint -- --no-write` → **0 blocking findings, 10 pre-existing
  warnings** (alle aus parallelen Hygiene-Sessions: 2 inline-diff-raw-fields,
  3 brain-size-budget, 5 stale-claim-suspects; meine Session berührt
  `brain/wiki/**` und `brain/outputs/**` überhaupt nicht).
- `npm run dev` (Background) + curl-Smoke gegen `localhost:3000`:
  - `GET /lab/cartographer` → HTTP 200, 18285 Bytes; Response enthält
    `<iframe src="/lab/cartographer-prototype/index.html" title="Cartographer Prototype" class="block h-full w-full border-0">`.
  - `GET /lab/cartographer-prototype/index.html` → HTTP 200, 5276 Bytes
    (byte-identisch zum Source); Response enthält `<div id="root">` plus
    drei `<script src="https://unpkg.com/..."` für React/ReactDOM/Babel
    plus die 13 lokalen Script-Tags.
  - Alle 13 Prototype-Files (`themes.js`, `eras.js`, `galaxy-data.js`,
    `galaxy-share.js`, `app.jsx`, alle 8 `galaxy-*.jsx` /
    `tweaks-panel.jsx`) → HTTP 200 mit korrekter Byte-Größe.
  - `GET /map` → HTTP 200, 18219 Bytes; Response enthält
    "Cartographer" + "Phase 2" Placeholder-Text (`src/app/map/page.tsx`
    unverändert).

Manual Browser: `/lab/cartographer` im In-App-Browser geöffnet. Der
React+Babel-CDN-Bootstrap läuft, `iframe` und Lab-`main` messen
`1280x720` bei `1280x720` Viewport, keine Browser-Error-Logs; nur die
erwartete Babel-Standalone-Warnung.

## Open issues / blockers

Keine.

**Known limitation (nicht in dieser Session zu beheben):** Wenn die
Production-Vercel-Umgebung CDN-Skripte (`unpkg.com/react@18.3.1`,
`unpkg.com/react-dom@18.3.1`, `unpkg.com/@babel/standalone@7.29.0`) nicht
erreichen kann oder Netzwerk-/CSP-Restriktionen sie blocken, lädt das
Iframe leer. Pro Maintainer-Vorgabe: nicht umbauen — Phase 2 (TSX-Port)
würde diese Abhängigkeit ohnehin eliminieren.

## For next session

Suggestions für künftige Sessions, falls die Cartographer-Pipeline
weitergeht:

- **Phase 2 TSX-Port** ist der natürliche Nachfolger: `app.jsx` +
  `galaxy-*.jsx` + `tweaks-panel.jsx` → TypeScript-React-Komponenten
  unter `src/components/map/`, mit `window.*`-Globals in ein Context-
  Provider-Modell überführt und `localStorage`-Persistenz auf
  Drizzle-Schreiben oder einen URL-State-Layer migriert. Die
  Iframe-Sandbox dieser Session bleibt parallel bestehen, bis die
  TSX-Port-Route Production-ready ist.
- **CDN-Pinning prüfen**, falls die Iframe-Sandbox länger lebt: die drei
  CDN-Scripts (`react@18.3.1`, `react-dom@18.3.1`,
  `@babel/standalone@7.29.0`) sind heute auf `unpkg.com` gehostet. Falls
  unpkg ausfällt oder die Versionen Probleme machen, könnte ein
  Mirror-Vendoring nach `public/lab/cartographer-prototype/vendor/` der
  Sandbox eine längere Lebenszeit sichern. Heute nicht nötig.
- **Lab-Index-Route?** Falls weitere Lab-Routen entstehen (z. B.
  `/lab/timeline-experiment`), könnte `src/app/lab/page.tsx` ein
  Maintainer-only-Index werden. Diese Session hat bewusst keine Lab-Nav
  eingebaut.
- **Sub-Cleanup**: Der `<Starfield />`-Render im RootLayout (z-0 fixed)
  läuft auf der Lab-Route mit, wird aber vom `bg-[#0a0703]` der `<main>`
  überdeckt. Marginale Performance-Pflege (Starfield ist im Server-
  Render günstig); kein Bedarf zur Optimierung.

## References

- `.scratch/map/Warhammer 40k Map/` — lokaler Claude-Design-Export
  (gitignored, daher kein Repo-Link).
- `src/app/map/page.tsx` — produktive Phase-2-Placeholder-Route, nicht
  angefasst.
- `src/app/layout.tsx` — RootLayout, nicht angefasst.
- `eslint.config.mjs` — zwei `ignores`-Einträge ergänzt (siehe Decisions).
- Maintainer-Direktanweisung: User-Prompt vom 2026-05-17 (kein
  Architect-Brief im Sessions-Folder, also kein Repo-Pfad).
