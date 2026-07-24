---
session: 2026-07-24-264
role: implementer
date: 2026-07-24
status: complete
slug: artwork-akquise
parent: docs/werkstatt-roadmap.md § Posten 14 (A0) — Kurz-Prompt, Launch-Ausnahme (Koordinations-Worktree)
links:
  - docs/artwork-akquise.md
commits:
  - (siehe PR)
---

# Session 264: Timeline-Artwork-Akquise (A0) — Dossier, Kontaktliste, Versandvorlagen

## Summary

A0 (Posten 14, W1-Gate-Blocker) ist als Koordinationsarbeit fertig vorbereitet: Das neue
Dossier [`docs/artwork-akquise.md`](../docs/artwork-akquise.md) enthält das Inventar
(2 von 8 Era-Covern sauber, 6 zu ersetzen, 1 retroaktive Freigabe), eine priorisierte,
vollständig verifizierte Kontaktliste (Erst-/Zweitkandidat + Reserven für alle 6 offenen
Eras), drei versandfertige englische Anfragen (retroaktiv, Neuanfrage, Follow-up) und
eine No-Response-Fallback-Leiter mit Eigenwerk-Ultima-ratio. **Nichts wurde integriert;
Versand + Antworten sind menschliche Parallelarbeit (Philipp), Tracking im Dossier § 5.**
Bild-Integration und KI-Altlasten-Cleanup bleiben Posten 27 (A1).

## Maintainer-Klärung (Fakten, die vorher nirgends dokumentiert waren)

Per Rückfrage in dieser Session (2026-07-24) hat Philipp festgestellt:

- Die 6 Era-Cover ohne Credit (`deep_history`, `great_crusade`, `the_forging`,
  `age_apostasy`, `time_ending`, `indomitus`) sind **KI-generiert und müssen ersetzt
  werden** — ebenso die 6 Deep-History-Event-Bilder und die Platzhalter `bg1–6.webp`
  (Cleanup → A1). `astronomican.webp` bleibt (Fiverr-Kommission Abdullah Riaz).
- **Richard Bagnall** (Horus-Heresy-Cover): **gekauft, Lizenz liegt vor** — kein
  Outreach; To-do ist nur die maintainer-lokale Ablage des Nachweises.
- **Javelin05** (The-Waning-Cover): **nie kontaktiert** → retroaktive Freigabe ist
  Prio 1 (Brief A im Dossier, ehrlich inkl. Entschuldigung + Entfernen-Angebot).
- Scope-/Mittel-Entscheid: **nur die großen Era-Bilder**, **keine Kommissionen**
  (zwei schlechte Fiverr-Erfahrungen, davon einmal KI geliefert), ausschließlich
  kostenlose Nutzungsanfragen gegen sichtbaren Credit.

## What I did

- `docs/artwork-akquise.md` — **neu**: Inventar-Matrix (mit per sharp verifizierten
  Ist-Maßen aller 20 Dateien unter `public/timeline/bg/`), priorisierte Kontaktliste,
  Briefe A/B/C (je Kurz-DM- und Langfassung, Platzhalter-Legende), Fallback-Leiter
  (Tag 0/14/21 → Zweitkandidat → Eigenwerk-Panorama), Tracking-Tabelle, A1-Handoff.
- `docs/werkstatt-roadmap.md` — Posten-14-Zeile + Prompt-Abschnitt 14 um den
  Session-264-Stand ergänzt (Haken bleibt ☐, bis Freigaben vorliegen).
- Künstler-Recherche über drei parallele Research-Agents (WebSearch + Live-Verifikation;
  ArtStation blockt Server-Fetches mit 403, daher Browser-Pane + ArtStation-JSON-API).
  **Jedes gelistete Profil/Werk wurde tatsächlich geladen und geprüft**; ausgeschlossen:
  offizielle GW-/Black-Library-Auftragswerke (vom Künstler nicht lizenzierbar),
  erkennbare KI-Arbeiten, reine Hochformat-Porträts. Ergebnis: 6 Eras × Erst- und
  Zweitkandidat + Reserven; 5+ Kandidaten mit explizitem #NoAI-Tag.

## Decisions I made

- **Dossier in `docs/` statt nur im Session-Log** — lebendes Ledger nach dem Muster
  `ui-backlog.md`; Tracking wird von Philipp fortgeschrieben, A1 liest daraus.
- **Keine Zugangsdaten im Repo** (public!): Briefe tragen Platzhalter
  `{{PREVIEW_USER}}`/`{{PREVIEW_PASS}}`; konkrete Werte nur im Chat-Handoff an Philipp,
  gesetzt werden sie als Vercel-Env (`PREVIEW_USER`/`PREVIEW_PASS`/`PREVIEW_SESSION_SECRET`
  — laut Session 260 ohnehin noch offen; ohne sie fail-closed, niemand kann sich einloggen).
- **Erstkandidaten so verteilt, dass kein Künstler doppelt in Welle 1 hängt**
  (Eddy González Dávila deckt per einem DM Great Crusade + Deep-History-Reserve ab);
  Kommissions-Werke Dritter („done for a client") werden nicht angefragt, stattdessen
  eigene Stücke desselben Künstlers.
- **PatrickNerdus „Free to use"-Rift-Background als Indomitus-Zweitkandidat** — de facto
  garantierter Fallback, Kurznachricht + Credit trotzdem (Höflichkeit + Nachweis).
- Follow-up-Politik bewusst zurückhaltend: genau ein Nudge nach 14 Tagen, ein Kanal,
  danach schließen — kein Nachfass-Spam gegenüber Künstlern.

## Verification

- `npm run typecheck` — pass; `npm run lint` — pass (kein Produktcode berührt).
- Bildmaße der Inventar-Matrix per sharp aus den echten Dateien gelesen (nicht aus Doku).
- Alle Kandidaten-Links von den Research-Agents live verifiziert (Seitentitel/JSON als
  Beleg); unverifizierbare Leads wurden verworfen, nicht gelistet.
- Kein Secret im Diff: Dossier + Report enthalten nur Platzhalter, keine echten Werte.
- Kein `brain/**`, kein `sessions/README.md` (Rollup macht Cowork post-merge).

## Open issues / blockers

- **Vercel-Env setzen** (`PREVIEW_USER`, `PREVIEW_PASS`, `PREVIEW_SESSION_SECRET`,
  Production + Preview), sonst ist das Preview für Künstler nicht erreichbar —
  Werte-Vorschlag im Chat-Handoff dieser Session.
- **Bagnall-Lizenznachweis** maintainer-lokal ablegen und Ablageort in Dossier § 5
  eintragen.
- Versand Welle 1 (7 Nachrichten: Javelin05 + 6 Erstkandidaten) durch Philipp;
  Platzhalter-Checkliste steht im Handoff.

## For next session

- A1 (Posten 27) startet pro eingegangener Freigabe: Quelldatei erbitten, sharp-WebP-Swap,
  `ERA_ART_CREDITS`-Eintrag, Crop-Preview an den Künstler (in Brief B zugesagt).
- Bei A1-Abschluss: KI-Altlasten löschen (5 verwaiste Deep-History-Webps + `bg1–6`;
  `/now`-Plates brauchen dann Ersatz oder Era-Fallback) — Details Dossier § 6.
- Rotation von `PREVIEW_PASS` nach Abschluss der Akquise-Welle erwägen (geteiltes Login).
