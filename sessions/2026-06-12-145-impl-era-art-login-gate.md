---
session: 2026-06-12-145
role: implementer
date: 2026-06-12
status: complete
slug: era-art-login-gate
parent: none (maintainer-direkte Zwischensession, kein Architect-Brief)
links: []
commits:
  - (siehe PR)
---

# Zwischensession: Era-Art-Swap, Bagnall-Credit, Preview-Login-Gate

## Summary

Drei Maintainer-Wünsche in einem PR: das Horus-Heresy-Era-Cover wandert zu Great Crusade und Horus Heresy bekommt ein neues Richard-Bagnall-Artwork inkl. Credit-Links (ArtStation + Instagram); außerdem steht die ganze Site jetzt hinter einem Preview-Login (`/login`, Cookie-Gate in `src/proxy.ts`). **Wichtigster Fakt für Cowork: nach dem Merge ist die Live-Site für anonyme Besucher gesperrt** (von Philipp explizit so entschieden); Kill-Switch `PREVIEW_GATE=off` existiert für den Launch.

## What I did

- `public/timeline/bg/era-great-crusade.webp` — ersetzt durch das bisherige Horus-Heresy-Cover (Datei-Swap in place; `eras.coverRef`-Pfade in DB/Seed bleiben unverändert, kein DB-Touch).
- `public/timeline/bg/era-horus-heresy.webp` — neues Richard-Bagnall-Artwork (Quelle 3840×2160 JPG, via sharp auf 2200×1238 WebP q80 ≈ 98 KB gebracht, passend zu den übrigen Era-Covern).
- `src/lib/chronicle/eraArtCredits.ts` — neu: Frontend-Map Era-ID → Artist-Credit (Name + mehrere Profil-Links); Eintrag `horus_heresy` → Richard Bagnall, https://www.artstation.com/r_bago + https://www.instagram.com/richard_bagnall_art/.
- `src/components/timeline/cinematic/CinematicView.tsx` — `.art-credit`-Slot: Event-Credit behält Vorrang, sonst Era-Credit-Fallback (Name + Link-Reihe); derselbe Block zusätzlich im Era-Intro-Overlay (mit stopPropagation, damit Link-Klick das Intro nicht dismisst) und im N===0-Fallback.
- `src/app/styles/67-chronicle-cinematic.css` — `.ac-links`-Styles (Mono, steel → gold hover) im bestehenden `.art-credit`-Stil.
- `public/img/login.webp` — neues Login-BG (2172×724 Panorama, aus PNG konvertiert, 94 KB).
- `src/components/chrome/SiteBackground.tsx` — Variante `"login"` ergänzt.
- `src/app/login/page.tsx` + `src/app/login/actions.ts` — Login-Seite (Server Component, `.lx-field`/`.lx-btn`-Primitives, Fehler via `?error=1`) + Server Action (Credential-Check, httpOnly-Cookie `cl-preview`, 30 Tage, Redirect auf `/`).
- `src/lib/previewGate.ts` — neu: geteilte Konstanten (Cookie-Name, Credentials mit env-Override `PREVIEW_USER`/`PREVIEW_PASS`, `previewGateEnabled()`), weil ein `"use server"`-Modul keine Konstanten exportieren darf.
- `src/app/styles/68-login.css` + Import in `globals.css` — Login-Layout, schwarzer Bottom-Gradient nach Hub-Muster, Chrome (`.site-burger`/`.site-menu`/`.media-player`) via `body:has(main.login)` ausgeblendet.
- `src/proxy.ts` — Matcher von `/atlas`+`/map` auf alle Routen erweitert (Negative-Lookahead für `/login`, `_next/`, public-Assets); Preview-Gate-Check vor dem bestehenden Atlas-Basic-Auth-Block (der early-returnt auf non-prod und hätte das Gate auf Vercel-Previews verschluckt).
- `sessions/2026-06-12-145-impl-era-art-login-gate.md` — dieser Report.

## Decisions I made

- **Datei-Swap statt DB-/Seed-Änderung** für die Era-Cover: `eras.coverRef` (DB ist SSOT) zeigt auf feste Pfade; gleiche Pfade, neuer Inhalt = Live-Wirkung ohne Migration/Seed-Lauf.
- **Frontend-Config statt Era-Credit-Spalten in der DB**: die Eras-Tabelle hat keine Credit-Felder, und das Event-Schema (`artCreditName`/`-Url`) trägt nur eine URL — der Bagnall-Credit braucht zwei. Für eine Zwischensession ist die Map in `eraArtCredits.ts` der ehrliche Tradeoff; falls Era-Credits häufiger werden, gehört das in die DB (→ For next session).
- **Gate enforced auf Vercel-Preview UND Production** (`NODE_ENV === "production"`), Bypass nur in lokalem `next dev` — so ist der Flow auf dem PR-Preview testbar, und die Dev-Experience bleibt reibungslos.
- **Credentials als committete Defaults** (`PreviewAccount`/`lexipreview`), env-überschreibbar: das Repo ist public, die Daten sind also lesbar — bewusster Soft-Lock gegen Zufallsbesucher, kein Sicherheitsanspruch. Kein Vercel-Env-Setup nötig, Gate wirkt sofort nach Merge.
- **`PREVIEW_GATE=off` als Kill-Switch**, damit der spätere Public-Launch keinen Code-Change braucht.
- **robots noindex auf /login**; alle anderen Seiten sind eh hinter dem Redirect.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- sharp-Output geprüft: era-horus-heresy.webp 2200×1238/98 KB, login.webp 2172×724/94 KB, era-great-crusade.webp = altes Heresy-Cover (118 KB).
- Dev-Server sauber neu gestartet (alte node-Prozesse gekillt, `.next` gelöscht), ein Up-Check: `/login` → 200. Browser-Eyeballing (Timeline-Intro + Credit-Links, Login-Flow, Falsch-Login-Fehler) macht Philipp; das Gate selbst greift erst auf dem Vercel-Preview/Prod.

## Open issues / blockers

- Keine. Achtung beim Merge: **Live-Site ist danach zu** (gewollt).

## For next session

- Era-Credits ggf. in die DB heben (Spalten an `eras` + mehrere Links), wenn weitere Era-Cover Credits bekommen.
- IndexView (Archiv-Ansicht) zeigt die Era-Cover ohne Credit — bewusst out-of-scope gelassen.
- Das alte Great-Crusade-Cover (1672×941) ist nur noch in der git-History; falls es woanders wiederverwendet werden soll, vorher bergen.

## References

- sharp (in node_modules vorhanden) für die WebP-Konvertierung; keine neuen Dependencies.
