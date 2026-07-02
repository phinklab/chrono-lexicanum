---
session: 2026-07-02-179
role: architect
date: 2026-07-02
status: open
slug: launch-legal
parent: null
links: [2026-06-20-163, 2026-06-03-121]
commits: []
---

# 179 — Launch-Legal: Impressum, Datenschutzerklärung, GW-Disclaimer (121-Product)

## Goal

Die rechtlichen Launch-Lücken schließen, bevor der Reddit-Post denkbar ist: statisches `/impressum` (§ 5 DDG), statisches `/datenschutz` (DSGVO Art. 13), ein Games-Workshop-IP-Disclaimer — alle drei im Footer verlinkt und **auch ohne Preview-Session erreichbar**. Sofort umsetzbar, kollisionsfrei zu allem Laufenden.

## Design freedom — read before everything else

Layout, Typografie, Abstände und die Tonalität der Seiten-Chrome (Eyebrow, Rahmen, wie sich die Seiten in den Archiv-Look einfügen) sind komplett deine Entscheidung — nutze den frontend-design Skill. **Nicht** verhandelbar ist der informationelle Gehalt: die §-5-Pflichtangaben und die Art.-13-Inhalte müssen vollständig und unverfälscht dastehen; Rechtstexte werden nicht ins In-Universe-Register übersetzt (nüchternes Deutsch, gern im Haus-Layout).

## Context

Quelle: Status-quo-Review 2026-07-02 (adversarial verifiziert, `main` @ `add7ab5`). Die Review-Datei ist gitignored und liegt **nicht** in deinem Worktree — die Findings stehen deshalb vollständig hier:

- **W1 · Keine Datenschutzerklärung (DSGVO Art. 13) — HIGH, bestätigt 3/3 Verifier-Linsen.** Fundort: `src/components/chrome/ArchiveFooter.tsx:21`. Keine `/privacy`-/`/datenschutz`-Route existiert (repo-weit verifiziert); die Site verarbeitet server-seitig IPs (Vercel-/Supabase-Logs) = personenbezogene Daten. Public-Gehen aus Deutschland ohne Datenschutzerklärung verletzt DSGVO Art. 13 — verschärft, sobald Analytics dazukommt (kommt: Brief 182). **Das einzige High-Finding des gesamten Reviews.**
- **W3 · Kein Impressum (§ 5 DDG) — MEDIUM, bestätigt 3/3.** Fundort: `ArchiveFooter.tsx:20` — nur das „FAN-MADE · NON-COMMERCIAL"-Motto; keine Impressums-Route existiert. Öffentlich erreichbarer Dienst aus Deutschland ohne Impressum = klassisches Abmahnungs-Ziel ab dem Moment des Gate-Flips.
- **K38 · Kein dedizierter GW-IP-Disclaimer — LOW.** Footer-Motto existiert, aber keine Seite benennt Games Workshop als IP-Inhaber („unofficial, not endorsed"). GW ist bei Fan-Werken notorisch — Standard-Disclaimer senkt das Takedown-Risiko. Verwandt (K39, dokumentierter Tradeoff): Cover werden von externen Hosts gehotlinkt — die Rights-Posture dazu gehört mit in den Disclaimer-Text.

Relevanter Ist-Stand für die Datenschutz-Inhalte: Hosting Vercel (Server-Logs mit IPs), DB Supabase (EU-Region prüfen und korrekt angeben), **keine User-Accounts**, einziger Cookie ist die HMAC-signierte Preview-Session (technisch erforderlich, Briefe 145/163), einziger App-Write ist der Best-effort-Insert in `preview_invite_activations`, kein Analytics heute — aber Brief 182 bringt Vercel Analytics/Speed Insights, die Erklärung soll das **generisch antizipieren** (Abschnitt „Reichweitenmessung", so formuliert, dass 182 keinen Legal-Nachzug braucht).

Warum ungated erreichbar: `/login` ist heute schon öffentlich — die Impressumspflicht greift nach gängiger Lesart bereits für diese öffentlich erreichbare Fläche, nicht erst nach dem Gate-Flip.

## Constraints

- Statische Server-Components, kein DB-Zugriff, kein neues Dependency.
- **Deutsche Slugs `/impressum` + `/datenschutz` sind fix** und bleiben bei der P12-URL-EN-Migration unangetastet (deutsche Rechtstexte, deutsche URLs — im P12-Brief wird das als Ausnahme vermerkt).
- Proxy-Matcher (`src/proxy.ts`): beide Routen + der Footer auf `/login` ohne Preview-Session erreichbar; der Rest des Gates bleibt exakt unverändert.
- CC entwirft die Texte auf Basis der Ist-Stand-Fakten oben; **Platzhalter für Philipps § 5-Angaben klar markiert** (`[NAME]`, `[ANSCHRIFT]`, `[E-MAIL]`) — Philipp füllt und reviewt vor dem Merge. Im PR-Text explizit darauf hinweisen, dass weder CC noch Cowork Rechtsberatung leisten und Philipp die Texte final verifiziert (Generator/Anwalt nach eigenem Ermessen).
- GW-Disclaimer inhaltlich: unofficial fan project, not endorsed by Games Workshop, alle genannten Marken (Warhammer 40,000 etc.) Eigentum von Games Workshop Limited, non-commercial; Cover-Artwork liegt bei den jeweiligen Rechteinhabern und wird von externen Quellen eingebunden. Ob als Sektion auf dem Impressum oder eigene Seite: dein Call.
- `brain/**` + `sessions/README.md` nicht anfassen (Rollup-Ownership); Product-Worktree, ein PR.

## Out of scope

- Analytics selbst einbauen (Brief 182) — hier nur der vorbereitende Datenschutz-Abschnitt.
- Cookie-Consent-Banner: nicht bauen. Stand heute existiert nur der technisch erforderliche Preview-Cookie; sollte CC bei der Text-Recherche zum Schluss kommen, dass geplantes Analytics doch consent-pflichtig wäre, im Report flaggen statt bauen.
- Keine Footer-Redesigns über die zwei/drei neuen Links hinaus.
- Kein Gate-Rückbau (bleibt der Launch-Cleanup-Brief, siehe `brain/wiki/deferred-questions.md` § Preview-Gate).

## Acceptance

The session is done when:

- [ ] `/impressum` rendert die § 5-DDG-Pflichtangaben (mit markierten Platzhaltern, bis Philipp füllt) + GW-Disclaimer-Langform.
- [ ] `/datenschutz` rendert die Art.-13-Inhalte: Verantwortlicher, Hosting/Server-Logs (Vercel), Datenbank (Supabase), Preview-Session-Cookie, Abschnitt Reichweitenmessung (182-antizipierend), Betroffenenrechte.
- [ ] Footer verlinkt Impressum + Datenschutz site-weit und auf `/login`; Disclaimer-Kurzform im Footer.
- [ ] Beide Routen ohne Preview-Session erreichbar; alle anderen Routen unverändert gated (kurz gegen den Matcher verifiziert).
- [ ] `npm run lint` + `tsc --noEmit` grün.

## Open questions

- Empfiehlst du nach Text-Entwurf zusätzliche Angaben (z. B. Streitschlichtungs-Hinweis § 36 VSBG, obwohl non-commercial)? Kurz im Report begründen, was du aufgenommen/weggelassen hast.
