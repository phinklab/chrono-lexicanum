# Timeline-Artwork-Akquise (A0) — Dossier & Versand-Ledger

> **Werkstatt-Posten 14 (A0), W1-Gate-Blocker.** Ziel: alle 8 Era-Cover der Timeline stehen auf menschengemachtem Artwork mit schriftlicher Nutzungsfreigabe. Dieses Dokument ist das lebende Ledger der Akquise — Inventar, priorisierte Kontaktliste, versandfertige Anfragen (EN), No-Response-Fallback, Tracking. **Versand und Antworten sind menschliche Arbeit (Philipp); die Bild-Integration ist Posten 27 (A1) und passiert erst nach vorliegender Freigabe.**
>
> Angelegt in Session 264 (2026-07-24). Zugangsdaten fürs Preview stehen **nicht** in diesem Dokument (Repo ist öffentlich) — sie kommen aus den Vercel-Env-Vars `PREVIEW_USER` / `PREVIEW_PASS` und werden beim Versand von Hand in die Platzhalter eingesetzt.

## 1. Inventar — was fehlt

Die Timeline rendert pro Era ein Full-Viewport-Cover (`eras.coverRef` → `public/timeline/bg/*.webp`, `background-size: cover` mit Ken-Burns-Pan). Credits kommen aus `src/lib/chronicle/eraArtCredits.ts` (Name + beliebig viele Profil-Links); Events können per `src/lib/chronicle/eventArt.ts` einzeln überschreiben. Ohne Credit-Eintrag rendert der Slot „ADD ARTIST CREDIT".

| Era (UI-Name) | Cover-Datei | Maße | Herkunft | Status |
|---|---|---|---|---|
| Deep History | `war-in-heaven.webp` | 1916×821 | **KI-generiert** | ☐ ersetzen |
| Great Crusade | `era-great-crusade.webp` | 2172×724 | **KI-generiert** | ☐ ersetzen |
| Horus Heresy & Great Scouring | `era-horus-heresy.webp` | 2200×1238 | Richard Bagnall, **gekauft — Lizenz liegt vor** | ✅ ok (Nachweis ablegen, § 5) |
| The Forging | `era-forging.webp` | 2172×724 | **KI-generiert** | ☐ ersetzen |
| Age of Apostasy | `era-apostasy.webp` | 2172×724 | **KI-generiert** | ☐ ersetzen |
| The Waning | `era-waning.webp` | 2200×1238 | Javelin05 (Reddit), eingebaut mit Credit, **nie angefragt** | ☐ retroaktive Freigabe (Brief A) |
| Time of Ending | `era-time-of-ending.webp` | 2172×724 | **KI-generiert** | ☐ ersetzen |
| Era Indomitus | `era-indomitus.webp` | 2172×724 | **KI-generiert** | ☐ ersetzen |

**Handlungsbedarf A0: 6 Cover ersetzen + 1 retroaktive Freigabe.** Ebenfalls KI-generiert, aber **nicht Teil von A0** (Aufräumen gehört zu A1): die 6 Deep-History-Event-Bilder (`birth-of-the-emperor`, `age-of-terra`, `dark-age-of-technology`, `age-of-strife`, `fall-of-the-aeldari`, `war-in-heaven` selbst) und die generischen Platzhalter `bg1–6.webp`. Das kommissionierte `astronomican.webp` (Abdullah Riaz, Fiverr) bleibt unberührt.

**Format-Anforderung an neues Artwork** (steht so auch in den Briefen): breites Querformat, Quelle idealerweise ≥ 2000 px Breite (bisher: 3840×2160 JPG, 2560×1440 PNG). Beschnitt auf Viewport, WebP-Konvertierung und Größenanpassung machen wir selbst (Muster: sharp, q80, in-place-Datei-Swap ohne DB-Touch — Sessions 145/146).

## 2. Kontaktliste (priorisiert)

Mittel der Wahl: **kostenlose Nutzungsfreigabe für Bestandswerke gegen sichtbaren Credit.** Keine Kommissionen (Entscheid 2026-07-24). Reihenfolge:

### Prio 1 — Javelin05 (retroaktiv, Artwork ist bereits live hinter dem Gate)

- Kanal: Reddit-DM an [u/Javelin05](https://www.reddit.com/user/Javelin05/)
- Brief A (§ 3.1). Im P.S. fragen, ob weitere Stücke als Era-Cover infrage kommen — könnte zusätzlich offene Eras abdecken.

### Prio 2 — Neue Künstler für die 6 offenen Eras

Kandidaten aus der Web-Recherche (Session 264, alle Profile verifiziert). Pro Era den Erstkandidaten anschreiben (Brief B); Zweitkandidat ist der Fallback nach der Leiter in § 4.

| Era | Erstkandidat (Brief B) | Zweitkandidat (Fallback) | Reserven |
|---|---|---|---|
| Deep History | **Lazare Viennot** — [Profil](https://www.artstation.com/lazare_viennot), Werk: [„Necron Emergence – Fan Art"](https://www.artstation.com/artwork/YBnX4X) (1920×1553, #NoAI, eigenes Fan-Werk); Kanal: ArtStation-DM | **Of Nature** — [Profil](https://www.artstation.com/ofnature), Werk: [„Necrons Tomb World"](https://www.artstation.com/artwork/W4B4Q) (Fraktal-Szene, Maße beim Künstler erfragen); ArtStation-DM | Eddy González Dávila, [„Old earth Tech-Barbarians"](https://www.artstation.com/artwork/nJAVRe) (1920×893, Krita — im selben DM wie Great Crusade mit anfragen) |
| Great Crusade | **Eddy González Dávila** — [Profil](https://www.artstation.com/eddygonzlezdvila), Werk: [„Great Crusade"](https://www.artstation.com/artwork/Zlq8vw) (1920×877, #NoAI, Photoshop); ArtStation-DM | **Dagahaz** — [Profil](https://www.artstation.com/dagahaz), Werk: [„Warhammer 30k – Alexis Polux"](https://www.artstation.com/artwork/L28wqw) (1920×1080, Fan Art); ArtStation-DM | ALEXMERCERXX, [„The Warmaster's Armored Fist"](https://www.deviantart.com/alexmercerxx/art/The-Warmaster-s-Armored-Fist-969763134) (CC BY-NC-ND — **ND: Beschnitt braucht trotzdem sein OK**; SFM-Render) |
| The Forging | **Joan Piqué Llorens** — [Profil](https://www.artstation.com/joanpiquellorens), Werk: [„The Eternity Gate"](https://www.artstation.com/artwork/DvePKy) (Project Terra, „personal fan art project", bis 3160×1440, 4K vorhanden); ArtStation-DM oder [Website](http://www.joanpiquellorens.com) | **Sergei Panin** — [Profil](https://www.artstation.com/leoluch), Werk: [„Welcome to Mechanicus"](https://www.artstation.com/artwork/xJZx8E) (3224×1470); ArtStation-DM | Joazzz, [„Dictator-class Imperial battlecruiser"](https://www.artstation.com/artwork/v2zEr6) (2400×1350, Flotten-Facette); BlackMetalOrk (einziges echtes War-of-the-Beast-Werk, aber Hochformat) |
| Age of Apostasy | **Pete Amachree** — [Profil](https://www.artstation.com/summerpudding), Werk: [„Sunrise over The Ecclesiarchy on Holy Terra"](https://www.artstation.com/artwork/d0JoYW) (3000×1688, „Personal work"); ArtStation-DM | **Jonathan Pieterse** — [Profil](https://www.artstation.com/celtic_savitar), Werk: [„Hive City Cathedral"](https://www.artstation.com/artwork/a0E2GL) (1920×1080, #NoAI, E-Mail auf Profil einblendbar); ArtStation-DM/E-Mail | Tio Tzen Ann, [„Sector Malice"](https://www.artstation.com/artwork/P6qqXB) (4000×2250, #NoAI); Vitaly Ivachin, [„Warhammer Cathedral"](https://www.artstation.com/artwork/bgm4Ln) (2560×1440, #NoAI, Interieur) |
| Time of Ending | **Michal Svec** — [Profil](https://www.artstation.com/mikebota), Werk: [„Warhammer 40k Cadians Advance"](https://www.artstation.com/artwork/d0QayW) (2560×1440, Chaos vs. Cadianer); ArtStation-DM | **MadMac09** — [Profil](https://www.artstation.com/macrow097), Werk: [„Abaddon's War Council"](https://www.artstation.com/artwork/RqEP3O) (1920×1152, #NoAI, Fall-of-Cadia-Motiv); ArtStation-DM | Ariel Sosa, [„Warhammer 40k battle scene fan art"](https://www.artstation.com/artwork/RKROaW) (6311×3542 — vor Anfrage kurz visuell auf KI-Verdacht prüfen) |
| Era Indomitus | **Federico Pelat** — [Profil](https://www.artstation.com/supranutz), Werk: [„Re-supplying before yet another space crusade"](https://www.artstation.com/artwork/2BKNDv) (4000×2250, #NoAI, Kreuzzugs-Flotte); ArtStation-DM oder Instagram `supasupra` | **PatrickNerdu** — [Profil](https://www.deviantart.com/patricknerdu), Werk: [„Cicatrix Maledictum – Free Background"](https://www.deviantart.com/patricknerdu/art/Warhammer40k-Cicatrix-Maledictum-Free-Background-995398300) (3419×3658, explizit „Free to use asset" — Kurznachricht + Credit trotzdem senden); DeviantArt-Note | Hogmi, [„Warhammer 40k Map Great Rift"](https://www.deviantart.com/hogmi/art/Warhammer-40k-Map-Great-Rift-1019094478) (4000×3200, Karten-Ästhetik); L J Koh ([Guilliman-Szenen](https://www.artstation.com/kheljay) — Vorsicht: arbeitet offiziell für GW, Auftragswerke evtl. nicht lizenzierbar) |

**Hinweise zur Liste** (Recherche Session 264, jedes Profil/Werk wurde tatsächlich abgerufen und geprüft):

- **Ein DM kann zwei Eras abdecken:** Eddy González Dávila hat sowohl das Great-Crusade- als auch ein Deep-History-taugliches Werk — in einer Nachricht beides anfragen.
- **Kommissions-Vorsicht:** Bei Werken, die „done for a client" o. ä. sagen (z. B. Viennots „Planet Crusher"), liegt das Nutzungsrecht evtl. beim Auftraggeber — darum ist bei Viennot das eigene „Necron Emergence" das anzufragende Werk.
- **Ausgeschlossen bei der Recherche:** offizielle GW-/Black-Library-Auftragswerke (nicht vom Künstler lizenzierbar, z. B. Firat Solhan, Darren Tan, Jaime Martinez' Codex-Stück), erkennbare KI-Arbeiten (z. B. Vyerran, „Created using AI tools"), reine Hochformat-/Porträt-Stücke.
- ArtStation-DMs brauchen einen (kostenlosen) ArtStation-Account.

### Kein Outreach nötig — Richard Bagnall

Horus-Heresy-Cover ist gekauft, Lizenz liegt vor. **To-do Philipp:** Kaufbeleg/Lizenztext maintainer-lokal ablegen (nicht ins öffentliche Repo) und Ablageort in § 5 eintragen. Optional später: anfragen, ob weitere Stücke zu gleichen Konditionen möglich wären (wäre dann aber Budget — bewusst zurückgestellt).

## 3. Versandfertige Anfragen (Englisch)

**Platzhalter-Legende:** `{{ARTIST}}` Name/Handle · `{{ARTWORK}}` Werktitel · `{{ARTWORK_URL}}` Link zum Werk · `{{ERA}}` UI-Era-Name · `{{DATE+14}}` Datum in 14 Tagen · `{{DATE_SENT}}` Versanddatum · `{{SITE_URL}}` Produktions-URL · `{{PREVIEW_USER}}` / `{{PREVIEW_PASS}}` Preview-Login (aus Vercel-Env, nie committen) · `{{CONTACT_EMAIL}}` Antwortadresse.

### 3.1 Brief A — retroaktive Freigabe (Javelin05)

**Kurzfassung (Reddit-DM):**

```text
Hi Javelin05 — I'm Philipp, a 40k fan from Germany building a non-commercial fan archive of Black Library novels (interactive timeline, not public yet, sits behind a preview password). I owe you an apology: I used your piece "{{ARTWORK}}" as the backdrop of the "The Waning" era chapter, credited to you with a link to your profile — but I should have asked you first, and I'm sorry I didn't. Before the site ever goes public I want to make this right: may I keep it, with the credit shown exactly as you'd like (name + any links you choose)? If you'd rather I not use it, I'll remove it completely — no hard feelings. You can see it in place here: {{SITE_URL}}/timeline (login "{{PREVIEW_USER}}" / "{{PREVIEW_PASS}}"). If I don't hear back by {{DATE+14}}, I'll remove the piece before launch. Thanks for your time — it's a stunning piece. P.S. If you ever felt like seeing more of your work as era backdrops there, I'd be honored — but this one is entirely your call.
```

**Langfassung (falls E-Mail/anderer Kanal):**

```text
Subject: Your artwork on a non-commercial 40k fan timeline — apology & permission request

Hi Javelin05,

I'm Philipp, a Warhammer 40k fan from Germany. I run Chrono Lexicanum, a
non-commercial fan web archive of Black Library novels; its centerpiece is an
interactive in-universe timeline where each era chapter has one full-screen
background artwork with a visible artist credit.

I owe you an apology and a question. While building the timeline I used your
piece "{{ARTWORK}}" as the backdrop for "The Waning" era — credited to you by
name, with a link to your profile, shown directly on the artwork. I should
have asked first, and I'm sorry I didn't. The site has never been public; it
sits behind a preview password.

Before it launches publicly, I'd like to make this right: may I keep the
piece as that era's background, with the credit shown exactly as you'd like
(your name plus any links you choose)? If you'd rather I not use it, I'll
remove it completely before launch — no hard feelings at all.

A few facts so you know what you'd be agreeing to:
- Strictly non-commercial: no ads, no paywall, no revenue. The project
  follows Games Workshop's fan-content policy (human-made art only).
- You keep all rights; nothing is exclusive; you can withdraw permission at
  any time and I'll remove the piece promptly.

If you'd like to see it in place: {{SITE_URL}}/timeline — preview login
"{{PREVIEW_USER}}" / "{{PREVIEW_PASS}}".

If I don't hear back by {{DATE+14}}, I'll assume you'd rather not and will
remove the piece before launch.

Thanks for your time — and for the artwork itself.

Philipp
{{CONTACT_EMAIL}}
```

### 3.2 Brief B — Nutzungsanfrage Bestandswerk (Template für neue Künstler)

**Kurzfassung (DM auf ArtStation/Reddit/Instagram):**

```text
Hi {{ARTIST}} — I'm Philipp, a 40k fan from Germany building Chrono Lexicanum, a non-commercial fan archive of Black Library novels with an interactive in-universe timeline. Each era chapter has one full-screen background artwork with a visible artist credit, and I'd love to ask your permission to use your piece "{{ARTWORK}}" ({{ARTWORK_URL}}) as the backdrop of the "{{ERA}}" era. Concretely: strictly non-commercial (no ads, no revenue, GW fan-policy compliant, human-made art only), your name + any links you choose shown directly on the artwork, no exclusivity, all rights stay with you, and you can withdraw anytime — I'd remove it promptly. We handle cropping/format; happy to send you a preview of how it looks before anything goes live. The site is pre-launch behind a preview login if you want to look around: {{SITE_URL}}/timeline — "{{PREVIEW_USER}}" / "{{PREVIEW_PASS}}". Totally fine if it's a no; if I don't hear back by {{DATE+14}} I simply won't use the piece. Thanks for your time!
```

**Langfassung (E-Mail/Kontaktformular):**

```text
Subject: Permission request — "{{ARTWORK}}" as era artwork on a non-commercial 40k fan archive

Hi {{ARTIST}},

I'm Philipp, a Warhammer 40k fan from Germany. I run Chrono Lexicanum, a
non-commercial fan web archive of Black Library novels. Its centerpiece is an
interactive in-universe timeline: each era chapter has one full-screen
background artwork, with the artist's credit shown visibly on the artwork.

I'd like to ask your permission to use your piece "{{ARTWORK}}"
({{ARTWORK_URL}}) as the background of the "{{ERA}}" era chapter.

What that would mean, concretely:
- Strictly non-commercial fan project: no ads, no paywall, no revenue. It
  follows Games Workshop's fan-content policy (human-made art only — the
  reason I'm writing to you is precisely to replace placeholder imagery
  with real artists' work).
- Your piece is shown as the era's full-screen backdrop. It gets cropped to
  the viewer's screen; we handle all resizing/conversion, and I'm happy to
  send you a preview of the crop before anything goes live.
- A visible credit directly on the artwork: your name plus any links you
  choose (portfolio, socials, shop, ...).
- No exclusivity, no transfer of rights — everything stays yours, and you
  can withdraw permission at any time; I'd remove the piece promptly.

If you'd like to see the site first, it's pre-launch behind a preview login:
{{SITE_URL}}/timeline — user "{{PREVIEW_USER}}", password "{{PREVIEW_PASS}}".

I completely understand if the answer is no. If I don't hear back by
{{DATE+14}}, I'll simply not use the piece and won't ask again.

Thanks for your time — and for making art that makes this setting feel alive.

Philipp
{{CONTACT_EMAIL}}
```

### 3.3 Brief C — einmaliger Follow-up (nach 14 Tagen)

```text
Hi {{ARTIST}}, just a gentle nudge on my message from {{DATE_SENT}} about
using "{{ARTWORK}}" as an era backdrop on my non-commercial 40k fan timeline
(visible credit + your links, no exclusivity, removable anytime). No pressure
at all — if I don't hear back within a week, I won't use the piece and won't
message again. Thanks either way!
```

## 4. No-Response-Fallback (Leiter)

Pro Kontakt, ab Versanddatum:

1. **Tag 0** — Brief A/B über den Kanal mit der höchsten Antwortwahrscheinlichkeit (ArtStation-DM > Reddit-DM > Instagram-DM > Kontaktformular).
2. **Tag 14** — genau **ein** Follow-up (Brief C). Kein zweiter Kanal parallel, kein Nachfassen davor.
3. **Tag 21** — Kontakt als „keine Antwort" schließen (§ 5 nachführen), **Zweitkandidat derselben Era** anschreiben (zurück zu Schritt 1).
4. **Beide Kandidaten ohne Zusage** → **Eigenwerk-Fallback:** Philipp malt ein eigenes Era-Panorama (wie Login-/Hub-Backgrounds — eigenes, menschengemachtes Werk, hält das W1-Gate ohne externe Abhängigkeit erfüllbar). Alternativ neuen Kandidaten recherchieren, wenn Zeit im Vorlauf ist.

Sonderfälle:

- **Javelin05 antwortet nicht oder lehnt ab** → `era-waning.webp` wird **vor** Gate-off entfernt (Datei-Swap auf Ersatz); Ersatzweg wie oben (Zweitkandidat oder Eigenwerk).
- **Absage mit Hinweis auf anderes eigenes Werk** → gern annehmen, zählt als Zusage (Werk + Freigabe in § 5 dokumentieren).
- **Zusage mit Bedingungen** (bestimmter Credit-Text, kein Beschnitt, …) → Bedingungen wörtlich in § 5 festhalten; A1 setzt sie um.

## 5. Tracking (von Philipp fortgeschrieben)

Freigaben bitte als Screenshot/Export der DM **maintainer-lokal** ablegen (nicht ins öffentliche Repo) und hier nur den Ablageort referenzieren.

| Era | Künstler | Kanal | Gesendet | Follow-up | Antwort | Status | Freigabe-Nachweis (Ablage) |
|---|---|---|---|---|---|---|---|
| Horus Heresy | Richard Bagnall | — (Kauf) | — | — | — | ✅ Lizenz gekauft | ☐ Beleg ablegen: _Ort eintragen_ |
| The Waning | Javelin05 | Reddit-DM | ☐ | | | offen | |
| Deep History | Lazare Viennot | ArtStation-DM | ☐ | | | offen | |
| Great Crusade (+ Deep-History-Reserve) | Eddy González Dávila | ArtStation-DM | ☐ | | | offen | |
| The Forging | Joan Piqué Llorens | ArtStation-DM | ☐ | | | offen | |
| Age of Apostasy | Pete Amachree | ArtStation-DM | ☐ | | | offen | |
| Time of Ending | Michal Svec | ArtStation-DM | ☐ | | | offen | |
| Era Indomitus | Federico Pelat | ArtStation-DM | ☐ | | | offen | |

## 6. A1-Handoff (Posten 27 — erst nach schriftlicher Freigabe)

Pro Zusage:

1. Quelldatei in Originalauflösung erbitten (falls Profil-Download kleiner ist).
2. sharp-Konvertierung nach WebP q80, Breite ~2200 px, in-place-Swap der `coverRef`-Datei (kein DB-/Seed-Touch — Muster Sessions 145/146).
3. `ERA_ART_CREDITS`-Eintrag in `src/lib/chronicle/eraArtCredits.ts` (Name + gewünschte Links, ggf. Credit-Bedingungen aus § 5).
4. Crop-Preview an den Künstler senden (in Brief B zugesagt!), erst nach dessen OK live.

Einmalig am Ende von A1: **KI-Altlasten löschen** — die 5 verwaiteten Deep-History-Webps + `bg1–6.webp` (Event-`artworkRef`s in `scripts/seed-data/events.json` zeigen darauf; `/now` braucht dann einen Ersatz oder den Era-Cover-Fallback) — und prüfen, dass keine unfreigegebenen Bilder mehr referenziert sind („keine unfreigegebenen oder unzureichend belegten Bilder", Roadmap-Posten 27).
