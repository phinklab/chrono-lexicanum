---
session: 2026-07-02-179
role: implementer
date: 2026-07-02
status: complete
slug: launch-legal
parent: 2026-07-02-179
links: [2026-06-20-163, 2026-06-03-121]
commits: []
---

# 179 — Launch-Legal: Impressum, Datenschutzerklärung, GW-Disclaimer (impl)

## Summary

`/imprint` (Impressum § 5 DDG + GW-IP-Disclaimer-Langform) und `/privacy` (Datenschutzerklärung Art. 13 DSGVO) sind als statische Server-Components live, beide ungated am Preview-Gate vorbei; der Imprimatur-Footer trägt jetzt Kurz-Disclaimer + beide Links, dazu Links auf `/login` und im Burger-Menü. Wichtigster Fakt für Cowork: Die Texte enthalten **keine Platzhalter** — Philipps echte Angaben (Name/Anschrift/Mail) standen im Brief und sind eingearbeitet; einzige Rest-Lücke ist die Sichtbarkeit auf Desktop-Map/-Timeline/-Entity-Seiten (kein Footer dort, Rail ohne Slot — siehe „For next session").

## What I did

- `src/app/imprint/page.tsx` — **neu**: Impressum. Sechs Sektionen: § 5 DDG-Angaben, Kontakt, § 18 Abs. 2 MStV, GW-Disclaimer-Langform (`id="disclaimer"`, inkl. Cover-Rights-Posture + englischem Standard-Absatz), Verbraucherstreitbeilegung (§ 36 VSBG), Haftung Inhalte/Links.
- `src/app/privacy/page.tsx` — **neu**: Datenschutzerklärung, Stand-Stempel 2. Juli 2026. Neun Sektionen: Verantwortlicher, Überblick, Hosting/Server-Logs (Vercel, USA/DPF), Datenbank (Supabase **eu-central-1 Frankfurt**, per `DATABASE_URL`-Pooler-Host verifiziert; Invite-Aktivierungs-Vermerk als einzige App-Schreibspur — PII-frei laut Schema: jti + Timestamps + Zähler), Preview-Cookie (`cl-preview`, § 25 Abs. 2 Nr. 2 TDDDG), Reichweitenmessung (182-antizipierend, cookielos formuliert), externe Inhalte (Cover-Hotlinks, Podcast-Audio erst bei aktivem Play, Musik aus eigenem Supabase-Storage EU, Fonts self-hosted via next/font), Betroffenenrechte inkl. Art. 77 (HmbBfDI), Schlussbemerkungen (kein Art.-22-Profiling, Änderungsvorbehalt).
- `src/app/styles/71-legal.css` — **neu**: Dokument-Register auf dem flachen Void — syspage-Vokabular oben (Mono-Eyebrow / Cinzel-Titel / Gold-Hairline), darunter eine linksbündige Lesespalte (660px) mit nummerierten Mono-Kickern, Cormorant-Fließtext (`--fs-read-sm`), Mono-Adressblöcken. Kein Artwork, kein Glow. In `globals.css` als letzter Import registriert.
- `src/components/chrome/ArchiveFooter.tsx` + `42-lex-primitives.css` — Legal-Row unter der Triade: GW-Kurz-Disclaimer (eine Mono-Zeile, faint) + `IMPRESSUM · DATENSCHUTZ`-Links (dim → gold on hover). Wirkt auf allen Footer-Seiten (Home, Archive, Podcasts, Compendium, Ask, + die zwei neuen Seiten selbst).
- `src/app/login/page.tsx` + `68-login.css` — `login-legal`-Footer: fixierte Mono-Zeile am unteren Viewport-Rand mit beiden Links (das Gate-Page-Chrome blendet Nav/Player aus, darum eigene Zeile).
- `src/components/chrome/SiteMenu.tsx` + `43-site-menu.css` — Legal-Links als letzte Zeile des Burger-Overlays (unter dem TERRA-STANDARD-Stempel, gleiche Einblend-Verzögerung). Deckt Touch/Narrow-Viewports auf **allen** Seiten ab, auch Map/Timeline/Entities.
- `src/proxy.ts` — Matcher-Exclusion `imprint|privacy` + Kommentar-Update. Sonst nichts am Gate.
- `src/components/chrome/SiteLegal.tsx` + Layout-Mount + `71-legal.css` — **Philipp-Nachtrag nach Review**: ganz kleine fixe `IMPRESSUM · DATENSCHUTZ`-Zeile links unten **unter dem MediaPlayer** (9px Mono, faint), site-weit aus dem Root-Layout. Schließt die Desktop-Lücke auf den footerlosen Flächen (Map/Timeline/Entities) vorläufig. Per CSS ausgeblendet auf `/login` (eigene Zeile) und ≤760px (Player-MQ; dort trägt das Burger-Menü die Links); 900px-MQ folgt dem Player-Offset (left 14px).

## Decisions I made

- **Slugs `/imprint` + `/privacy`** (nicht `/impressum`/`/datenschutz` wie in den Acceptance-Checkboxen): die Constraint „Englische Slugs wegen P12" ist die speziellere Vorgabe, und der P12-Eintrag im Board (121) bestätigt die EN-Migrationsrichtung — dort ist nichts anzupassen. Die sichtbaren **Link-Labels bleiben deutsch** („Impressum"/„Datenschutz"), weil § 5 DDG „leicht erkennbar" verlangt und deutsche Nutzer nach genau diesen Begriffen suchen.
- **GW-Disclaimer als Sektion auf dem Impressum** (Option aus dem Brief), nicht als eigene Seite: gleiche Rechtsnatur (IP-/Anbieterkennzeichnung), eine Seite weniger, per `/imprint#disclaimer` anspringbar. Zusätzlich ein englischer Standard-Absatz („not endorsed … no challenge intended") — GW-Legal liest Englisch.
- **§ 36 VSBG aufgenommen** (Open Question des Briefs): Als privates, nicht-kommerzielles Angebot ohne Verbraucherverträge ist die Pflicht m. E. gar nicht einschlägig; der eine Satz („nicht verpflichtet und nicht bereit") kostet nichts und nimmt den klassischen Abmahn-Winkel weg. **Weggelassen: der EU-ODR-Plattform-Link** — die Plattform wurde zum 20.07.2025 eingestellt (VO (EU) 524/2013 aufgehoben); der früher übliche Pflicht-Link wäre heute falsch. Ebenfalls weggelassen: Telefonnummer (nicht gefordert; E-Mail genügt für „schnelle elektronische Kontaktaufnahme" nach der EuGH-Linie) und ein Umsatzsteuer-/Aufsichts-Block (nicht einschlägig, non-commercial).
- **Kein Cookie-Consent-Banner** (bestätigt die Out-of-scope-Annahme des Briefs): einziger Cookie ist das technisch erforderliche Preview-Token (§ 25 Abs. 2 Nr. 2 TDDDG, einwilligungsfrei); Vercel Web Analytics/Speed Insights arbeiten cookielos ohne Endgeräte-Zugriff, § 25 TDDDG wird also gar nicht berührt → Art.-6-lit.-f-Posture reicht. Die Reichweitenmessungs-Sektion ist bewusst als „kann eingesetzt werden (vorgesehen: …)" formuliert plus Selbstverpflichtung, bei einwilligungspflichtigen Verfahren vorab zu aktualisieren — Brief 182 braucht damit keinen Legal-Nachzug.
- **Ich-Form statt Wir-Form** in beiden Texten: Einzelperson als Betreiber; „wir" wäre die unehrlichere Konvention.
- **SiteMenu-Legal-Row ergänzt** (leicht über die wörtliche Footer-Vorgabe hinaus): ArchiveFooter existiert nicht auf Map/Timeline/Entity-Seiten; das Burger-Overlay ist dort das einzige globale Chrome. Zwei Links im Menü-Fuß sind kein Redesign und schließen die Erreichbarkeits-Lücke für alle Touch/Narrow-Viewports. Die SiteNav-Numeral-Rail (Desktop) habe ich bewusst **nicht** angefasst — Textlinks passen nicht in die Rail-Sprache, das wäre ein echtes Redesign (→ Open issues).
- **Keine Platzhalter**: Der Brief lieferte Name/Anschrift/Mail konkret; das Acceptance-Kriterium „mit markierten Platzhaltern, bis Philipp füllt" ist damit gegenstandslos umgesetzt.
- **Datenlöschungs-Zusage Invite-Vermerke**: Die Erklärung sagt zu, dass die `preview_invite_activations`-Einträge mit dem Ende der Preview-Phase gelöscht werden — das ist eine kleine operative Verpflichtung für den Launch-Cleanup (im Gate-Rückbau-Brief mit abräumen).

## Verification

- `npm run lint` — pass.
- `npx tsc --noEmit` — pass (Exit 0). Erst rot wegen `scripts/books-excel.ts`: `write-excel-file` (Batches-PR #203) fehlte in den node_modules **dieses Worktrees** (staler Install, kein Code-Problem); `npm install` gegen das unveränderte Lockfile behob es (Lockfile-Diff: leer).
- Proxy-Matcher mechanisch verifiziert (Node-Regex-Test gegen repräsentative Pfade): `/imprint`, `/privacy`, `/login`, `/healthz`, `/api/revalidate`, `/api/preview-invites` → Bypass; `/`, `/archive`, `/map`, `/timeline`, `/buch/*`, `/compendium`, `/ask`, `/ingest` → weiterhin gated. Verhalten aller Bestandsrouten unverändert.
- Kein Browser-Eyeballing durch mich (Konvention: Philipp prüft im Browser); Dev-Server nicht angefasst.

## Open issues / blockers

- Keine. Die im ersten Wurf offene Desktop-Lücke (footerlose Flächen Map/Timeline/Entities ohne Legal-Link) ist per Philipp-Entscheid **vorläufig** durch die fixe `SiteLegal`-Zeile unter dem Player geschlossen; ob sie so bleibt oder in einen gestalteten Slot wandert (Rail-Fuß / Entity-Footer), ist ein Polish-Call.

## For next session

- Launch-Cleanup (Gate-Rückbau): die zugesagte Löschung der `preview_invite_activations`-Zeilen mit einplanen; außerdem prüfen, ob das site-weite `robots: noindex` beim Flip fällt (Rechtsseiten dürfen dann mitindexiert werden).
- Brief 182 (Analytics): Datenschutz-Sektion 06 ist darauf geschnitten — nach Einbau nur den Stand-Stempel aktualisieren, falls überhaupt.
- P12 (URL-EN-Migration): `/imprint` + `/privacy` sind schon englisch; bei der Migration nur die Footer-/Menü-Links gegenchecken (keine Redirects nötig).
- Desktop-Legal-Slot: die vorläufige `SiteLegal`-Zeile unter dem Player ggf. in einen gestalteten Slot überführen (Rail-Fuß / Entity-Footer) — Mini-Punkt für einen Polish-/P15-artigen Pass; auf `/map` prüfen, ob sie mit Map-Chrome unten links kollidiert.

## References

- DDG § 5 (Anbieterkennzeichnung, seit 2024 Nachfolger von § 5 TMG), MStV § 18 Abs. 2, DSGVO Art. 13/15–21/77, TDDDG § 25 Abs. 2 Nr. 2, VSBG § 36.
- EU-ODR-Plattform: eingestellt zum 20.07.2025 (Aufhebung VO (EU) Nr. 524/2013) — Link daher bewusst nicht aufgenommen.
- Vercel: DPF-Zertifizierung + Standardvertragsklauseln (Datenschutz-Posture Hosting); Vercel Web Analytics/Speed Insights: cookielos, Besuchs-Hash < 24 h, kein Endgeräte-Storage.
- Supabase-Region aus `DATABASE_URL` (aws-1-**eu-central-1**.pooler.supabase.com); Invite-Aktivierungs-Schema aus `src/db/schema.ts` (`previewInviteActivations`, Kommentar „PII-free").
