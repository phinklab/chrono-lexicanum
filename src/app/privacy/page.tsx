import type { Metadata } from "next";
import Link from "next/link";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";

/* Datenschutzerklärung — Art.-13-DSGVO information for the whole
   deployed surface. Static server component, no DB, reachable WITHOUT a
   preview session (excluded from the proxy matcher). Facts the text states,
   verified against the codebase:
     - Hosting Vercel (server logs with IPs), DB Supabase eu-central-1
       (Frankfurt; DATABASE_URL pooler host).
     - No user accounts; the only cookie is the HMAC-signed preview session
       (`cl-preview`) — technically required, § 25 Abs. 2 Nr. 2 TDDDG.
     - The only app write is the PII-free invite-activation upsert
       (jti + timestamps + count; schema.ts `previewInviteActivations`).
     - Covers are hotlinked from external hosts; podcast audio streams from
       the feed host on user-initiated play; site music comes from the
       project's own Supabase storage; fonts are self-hosted via next/font.
   The "Reichweitenmessung" section deliberately anticipates a cookieless
   Vercel Web Analytics / Speed Insights rollout so that can ship without a
   legal follow-up. English slug per the URL-EN convention; content is
   sober German legal text. */

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung von Chrono · Lexicanum — Informationen nach Art. 13 DSGVO zu Hosting, Server-Logs, Cookies und Betroffenenrechten.",
};

export default function PrivacyPage() {
  return (
    <main className="legal" lang="de">
      <header className="legal__head">
        <p className="legal__eyebrow">Chrono · Lexicanum — Rechtliches</p>
        <h1 className="legal__title">Datenschutzerklärung</h1>
        <div className="legal__rule" aria-hidden />
        <p className="legal__stand">Stand · 2. Juli 2026</p>
      </header>

      <div className="legal__doc">
        <section className="legal__section" aria-labelledby="pv-controller">
          <h2 className="legal__kicker" id="pv-controller">
            <span className="legal__no" aria-hidden>
              01
            </span>
            Verantwortlicher
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <address className="legal__address">
            Philipp Künzler
            <br />
            Saseler Weg 11a
            <br />
            22359 Hamburg, Deutschland
            <br />
            E-Mail:{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>
          </address>
          <p className="legal__p">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO)
            für die Datenverarbeitung auf dieser Website. Anfragen zum
            Datenschutz richten Sie bitte an die genannte E-Mail-Adresse.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-overview">
          <h2 className="legal__kicker" id="pv-overview">
            <span className="legal__no" aria-hidden>
              02
            </span>
            Das Wichtigste im Überblick
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Chrono · Lexicanum ist ein nicht-kommerzielles Fan-Archiv. Es gibt
            <strong> keine Benutzerkonten</strong>, keine Kommentarfunktion,
            keinen Newsletter und keinen Verkauf. Personenbezogene Daten fallen
            nur in dem Umfang an, der beim Aufruf jeder Website technisch
            entsteht (Server-Logdaten, Ziffer 03), sowie durch einen einzelnen
            technisch erforderlichen Cookie während der nicht-öffentlichen
            Vorschau-Phase (Ziffer 05). Daten werden nicht zu Werbezwecken
            weitergegeben und nicht verkauft; Werbe-Tracker gibt es nicht.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-hosting">
          <h2 className="legal__kicker" id="pv-hosting">
            <span className="legal__no" aria-hidden>
              03
            </span>
            Hosting und Server-Logdaten (Vercel)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Diese Website wird bei <strong>Vercel Inc.</strong>, 440 N Barranca
            Ave #4133, Covina, CA 91723, USA, gehostet. Beim Aufruf der Website
            verarbeitet Vercel automatisch Server-Logdaten: IP-Adresse, Datum
            und Uhrzeit des Zugriffs, aufgerufene URL, Referrer-URL,
            Browser-Kennung (User-Agent) und HTTP-Statuscodes.
          </p>
          <p className="legal__p">
            Zweck der Verarbeitung ist die Auslieferung der Website sowie die
            Gewährleistung von Stabilität und Sicherheit (etwa die Erkennung
            von Angriffen und Missbrauch). Rechtsgrundlage ist Art. 6 Abs. 1
            lit. f DSGVO (berechtigtes Interesse am sicheren und stabilen
            Betrieb). Logdaten werden nur kurzfristig vorgehalten und nicht mit
            anderen Datenquellen zusammengeführt.
          </p>
          <p className="legal__p">
            Vercel kann Daten auch in den USA verarbeiten. Die Übermittlung
            stützt sich auf die Zertifizierung von Vercel unter dem
            EU-U.S. Data Privacy Framework bzw. auf
            EU-Standardvertragsklauseln (Art. 46 DSGVO).
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-db">
          <h2 className="legal__kicker" id="pv-db">
            <span className="legal__no" aria-hidden>
              04
            </span>
            Datenbank (Supabase, EU)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Die Inhalte des Archivs (Bücher, Fraktionen, Welten, Zeitleisten,
            Podcasts) liegen in einer Postgres-Datenbank bei{" "}
            <strong>Supabase</strong>, gehostet in der EU (AWS-Region
            eu-central-1, Frankfurt am Main). Die Datenbank enthält
            Katalogdaten, keine Besucherdaten.
          </p>
          <p className="legal__p">
            Einzige Ausnahme: Wird ein persönlicher Vorschau-Einladungslink
            eingelöst, wird vermerkt, <em>dass</em> dieser Link aktiviert wurde
            (technische Kennung des Links, Zeitpunkt der ersten und letzten
            Aktivierung, Zähler) — ohne IP-Adresse, ohne Gerätedaten, ohne
            Namen. Zweck ist die Missbrauchskontrolle der ausgegebenen
            Einladungen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die
            Einträge werden mit dem Ende der Vorschau-Phase gelöscht.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-cookie">
          <h2 className="legal__kicker" id="pv-cookie">
            <span className="legal__no" aria-hidden>
              05
            </span>
            Vorschau-Zugang und Cookie
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Während der nicht-öffentlichen Vorschau-Phase ist die Website
            zugangsbeschränkt. Nach erfolgreicher Anmeldung wird ein Cookie
            (<strong>cl-preview</strong>) gesetzt: ein signiertes Zugangs-Token
            mit festem Ablaufdatum. Es enthält keine Tracking-Kennung, wird
            nicht für Analysen genutzt und dient ausschließlich dem
            Zugangsschutz.
          </p>
          <p className="legal__p">
            Da der Cookie unbedingt erforderlich ist, um den ausdrücklich
            gewünschten Zugang bereitzustellen, ist keine Einwilligung nötig
            (§ 25 Abs. 2 Nr. 2 TDDDG); die zugehörige Datenverarbeitung stützt
            sich auf Art. 6 Abs. 1 lit. f DSGVO. Der Cookie läuft automatisch
            ab und entfällt mit dem Ende der Vorschau-Phase. Ein
            Cookie-Banner ist nicht erforderlich, weil darüber hinaus keine
            Cookies gesetzt werden.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-analytics">
          <h2 className="legal__kicker" id="pv-analytics">
            <span className="legal__no" aria-hidden>
              06
            </span>
            Reichweitenmessung
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Zur Verbesserung des Angebots kann eine datensparsame,{" "}
            <strong>cookielose Reichweitenmessung</strong> eingesetzt werden
            (vorgesehen: Vercel Web Analytics und Vercel Speed Insights). Diese
            Dienste arbeiten ohne Cookies und ohne geräteübergreifende Profile:
            Seitenaufrufe und Web-Performance-Werte werden aggregiert erfasst;
            zur Unterscheidung von Besuchen dient höchstens ein kurzlebiger,
            aus technischen Merkmalen abgeleiteter Hash, der eine
            Wiedererkennung über den Besuch hinaus nicht erlaubt. IP-Adressen
            werden dabei nicht dauerhaft gespeichert.
          </p>
          <p className="legal__p">
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an einer statistischen Auswertung der Nutzung). Da auf
            dem Endgerät weder Informationen gespeichert noch ausgelesen
            werden, ist eine Einwilligung nach § 25 TDDDG nicht erforderlich.
            Sollte künftig ein Verfahren eingesetzt werden, das eine
            Einwilligung voraussetzt, wird diese vorab eingeholt und diese
            Erklärung aktualisiert.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-external">
          <h2 className="legal__kicker" id="pv-external">
            <span className="legal__no" aria-hidden>
              07
            </span>
            Externe Inhalte
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            <strong>Cover-Abbildungen:</strong> Buchcover werden nicht lokal
            gespeichert, sondern direkt von externen, öffentlich zugänglichen
            Quellen geladen (z. B. Open Library, Wikimedia oder Server der
            Verlage und Katalogdienste). Beim Laden einer Seite mit Covern
            stellt Ihr Browser eine direkte Verbindung zu diesen Servern her;
            der jeweilige Anbieter erhält dabei technisch bedingt Ihre
            IP-Adresse und die üblichen Browser-Angaben. Auf die dortige
            Verarbeitung habe ich keinen Einfluss; es gelten die
            Datenschutzhinweise der jeweiligen Anbieter. Rechtsgrundlage ist
            Art. 6 Abs. 1 lit. f DSGVO (Interesse, die besprochenen Werke durch
            ihr Original-Cover zu identifizieren).
          </p>
          <p className="legal__p">
            <strong>Podcast-Audio:</strong> Podcast-Episoden werden erst dann
            vom Server des jeweiligen Podcast-Anbieters gestreamt bzw.
            heruntergeladen, wenn Sie eine Episode aktiv abspielen oder den
            Download-Link nutzen. Dabei erhält der Anbieter Ihre IP-Adresse.
          </p>
          <p className="legal__p">
            <strong>Musik und Schriften:</strong> Die optionale
            Hintergrund-Musik des Archivs wird aus eigenem Speicher (Supabase,
            EU) geladen. Alle Schriftarten sind lokal eingebunden; beim
            Seitenaufruf wird keine Verbindung zu Google Fonts oder anderen
            Schriften-Diensten aufgebaut.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-rights">
          <h2 className="legal__kicker" id="pv-rights">
            <span className="legal__no" aria-hidden>
              08
            </span>
            Ihre Rechte
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Ihnen stehen hinsichtlich Ihrer personenbezogenen Daten die
            folgenden Rechte zu:
          </p>
          <ul className="legal__list">
            <li>Auskunft über die verarbeiteten Daten (Art. 15 DSGVO),</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
            <li>Löschung (Art. 17 DSGVO),</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
            <li>
              Widerspruch gegen Verarbeitungen, die auf Art. 6 Abs. 1 lit. f
              DSGVO gestützt sind (Art. 21 DSGVO).
            </li>
          </ul>
          <p className="legal__p">
            Zur Ausübung genügt eine formlose E-Mail an{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>
            . Daneben besteht ein Beschwerderecht bei einer
            Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), etwa beim
            Hamburgischen Beauftragten für Datenschutz und
            Informationsfreiheit.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-misc">
          <h2 className="legal__kicker" id="pv-misc">
            <span className="legal__no" aria-hidden>
              09
            </span>
            Schlussbemerkungen
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Die Bereitstellung personenbezogener Daten ist weder gesetzlich
            noch vertraglich vorgeschrieben; die beim Seitenaufruf anfallenden
            technischen Daten sind für die Auslieferung der Website jedoch
            erforderlich. Eine automatisierte Entscheidungsfindung
            einschließlich Profiling (Art. 22 DSGVO) findet nicht statt.
          </p>
          <p className="legal__p">
            Diese Erklärung wird angepasst, sobald sich das Angebot ändert; es
            gilt die jeweils hier veröffentlichte Fassung. Die
            Anbieterkennzeichnung finden Sie im{" "}
            <Link href="/imprint">Impressum</Link>.
          </p>
        </section>
      </div>

      <ArchiveFooter mid="TVTELA DATORVM · DSGVO" />
    </main>
  );
}
