import type { Metadata } from "next";
import Link from "next/link";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import LegalLanguageToggle, {
  legalLanguageFromParam,
  type LegalLanguage,
} from "@/components/legal/LegalLanguageToggle";
// Route-scoped stylesheet (S7a), shared by the three legal document pages.
import "@/app/styles/71-legal.css";

/* Datenschutzerklärung — Art.-13-DSGVO information for the whole
   deployed surface. Static server component, no DB, reachable WITHOUT a
   preview session (excluded from the proxy matcher). Facts the text states,
   verified against the codebase:
     - Hosting Vercel (server logs with IPs), DB Supabase eu-central-1
       (Frankfurt; DATABASE_URL pooler host).
     - No user accounts; the only cookie is the HMAC-signed preview session
       (`cl-preview`) — technically required, § 25 Abs. 2 Nr. 2 TDDDG.
     - Covers are hotlinked from external hosts; podcast audio streams from
       the feed host on user-initiated play; site music comes from the
       project's own Supabase storage; fonts are self-hosted via next/font.
   Since Launch S5 the observability stack is LIVE and covered here:
   cookieless Vercel Web Analytics + Speed Insights (Ziffer 06) and the
   error-only Sentry tracker behind the same-origin /monitoring tunnel —
   no replay, no tracing, no visitor IP to Sentry, EU data region, 90-day
   retention (Ziffer 07). English is the canonical default; `?lang=de`
   selects the sober German legal text without a site-wide locale layer. */

interface PrivacyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function resolveLanguage(
  searchParams: PrivacyPageProps["searchParams"],
): Promise<LegalLanguage> {
  const params = await searchParams;
  return legalLanguageFromParam(params.lang);
}

export async function generateMetadata({
  searchParams,
}: PrivacyPageProps): Promise<Metadata> {
  const language = await resolveLanguage(searchParams);
  return language === "de"
    ? {
        title: "Datenschutzerklärung",
        description:
          "Datenschutzerklärung von Chrono · Lexicanum: Informationen nach Art. 13 DSGVO zu Hosting, Server-Logs, Cookies und Betroffenenrechten.",
        alternates: { canonical: "/privacy" },
      }
    : {
        title: "Privacy Policy",
        description:
          "Privacy Policy for Chrono · Lexicanum: information under Article 13 GDPR about hosting, server logs, cookies and data-subject rights.",
        alternates: { canonical: "/privacy" },
      };
}

function PrivacyGermanPage() {
  return (
    <main id="main" tabIndex={-1} className="legal" lang="de">
      <header className="legal__head">
        <p className="legal__eyebrow">Chrono · Lexicanum: Rechtliches</p>
        <h1 className="legal__title">Datenschutzerklärung</h1>
        <div className="legal__rule" aria-hidden />
        <LegalLanguageToggle language="de" pathname="/privacy" />
        <p className="legal__stand">Stand · 23. Juli 2026</p>
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
            Zur Verbesserung des Angebots wird eine datensparsame,{" "}
            <strong>cookielose Reichweitenmessung</strong> eingesetzt (Vercel
            Web Analytics und Vercel Speed Insights, Anbieter: Vercel Inc.,
            siehe Ziffer 03). Diese Dienste arbeiten ohne Cookies und ohne
            geräteübergreifende Profile: Seitenaufrufe und
            Web-Performance-Werte werden aggregiert erfasst; zur Unterscheidung
            von Besuchen dient höchstens ein kurzlebiger, aus technischen
            Merkmalen abgeleiteter Hash, der eine Wiedererkennung über den
            Besuch hinaus nicht erlaubt. IP-Adressen werden dabei nicht
            dauerhaft gespeichert.
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

        <section className="legal__section" aria-labelledby="pv-errors">
          <h2 className="legal__kicker" id="pv-errors">
            <span className="legal__no" aria-hidden>
              07
            </span>
            Fehlerdiagnose (Sentry)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Um technische Fehler zu erkennen und zu beheben, wird ein{" "}
            <strong>reines Fehlerdiagnose-Werkzeug</strong> eingesetzt:
            Sentry, ein Dienst der Functional Software, Inc., 45 Fremont
            Street, San Francisco, CA 94105, USA. Nur wenn beim Aufruf der
            Website ein technischer Fehler auftritt, werden die zugehörigen
            Diagnosedaten übermittelt: Fehlermeldung und Programm-Stelle
            (Stacktrace), die betroffene Seiten-URL, Browser- und
            Betriebssystem-Typ sowie der Zeitpunkt.
          </p>
          <p className="legal__p">
            Es findet <strong>keine Sitzungsaufzeichnung</strong> (Session
            Replay), kein Performance-Tracing und keine Profilbildung statt;
            es wird kein Cookie gesetzt. Die Fehlermeldungen werden über die
            eigene Domain dieser Website weitergeleitet; die IP-Adresse der
            Besucher wird dabei nicht an Sentry übermittelt. Die Fehlerdaten
            werden in der EU-Datenregion von Sentry gespeichert und nach
            spätestens 90 Tagen automatisch gelöscht. Soweit im Rahmen des
            Dienstes Daten in die USA gelangen, stützt sich die Übermittlung
            auf die Zertifizierung von Sentry unter dem EU-U.S. Data Privacy
            Framework bzw. auf EU-Standardvertragsklauseln (Art. 46 DSGVO).
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse am stabilen, fehlerfreien Betrieb).
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-external">
          <h2 className="legal__kicker" id="pv-external">
            <span className="legal__no" aria-hidden>
              08
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
              09
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
              10
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
            <Link href="/imprint?lang=de">Impressum</Link>.
          </p>
        </section>
      </div>

      <ArchiveFooter mid="TVTELA DATORVM · DSGVO" />
    </main>
  );
}

function PrivacyEnglishPage() {
  return (
    <main id="main" tabIndex={-1} className="legal" lang="en">
      <header className="legal__head">
        <p className="legal__eyebrow">Chrono · Lexicanum: Legal</p>
        <h1 className="legal__title">Privacy Policy</h1>
        <div className="legal__rule" aria-hidden />
        <LegalLanguageToggle language="en" pathname="/privacy" />
        <p className="legal__stand">Last updated · 23 July 2026</p>
      </header>

      <div className="legal__doc">
        <section className="legal__section" aria-labelledby="pv-controller">
          <h2 className="legal__kicker" id="pv-controller">
            <span className="legal__no" aria-hidden>
              01
            </span>
            Controller
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <address className="legal__address">
            Philipp Künzler
            <br />
            Saseler Weg 11a
            <br />
            22359 Hamburg, Germany
            <br />
            Email:{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>
          </address>
          <p className="legal__p">
            This is the controller within the meaning of the General Data
            Protection Regulation (GDPR) for the processing of data on this
            website. Please send privacy enquiries to the email address above.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-overview">
          <h2 className="legal__kicker" id="pv-overview">
            <span className="legal__no" aria-hidden>
              02
            </span>
            Key information at a glance
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Chrono · Lexicanum is a non-commercial fan archive. There are
            <strong> no user accounts</strong>, comments, newsletters or sales.
            Personal data is generated only to the extent technically
            inherent in visiting any website (server log data, section 03) and
            through one technically necessary cookie during the non-public
            preview phase (section 05). Data is neither shared for advertising
            purposes nor sold; no advertising trackers are used.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-hosting">
          <h2 className="legal__kicker" id="pv-hosting">
            <span className="legal__no" aria-hidden>
              03
            </span>
            Hosting and server log data (Vercel)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            This website is hosted by <strong>Vercel Inc.</strong>, 440 N
            Barranca Ave #4133, Covina, CA 91723, USA. When the website is
            accessed, Vercel automatically processes server log data: IP
            address, date and time of access, requested URL, referrer URL,
            browser identifier (user agent) and HTTP status codes.
          </p>
          <p className="legal__p">
            The purposes of this processing are to deliver the website and to
            ensure its stability and security, including the detection of
            attacks and misuse. The legal basis is Article 6(1)(f) GDPR
            (legitimate interest in secure and stable operation). Log data is
            retained only for a short period and is not combined with other
            data sources.
          </p>
          <p className="legal__p">
            Vercel may also process data in the United States. Transfers rely
            on Vercel&apos;s certification under the EU-U.S. Data Privacy
            Framework or on EU Standard Contractual Clauses (Article 46 GDPR).
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-db">
          <h2 className="legal__kicker" id="pv-db">
            <span className="legal__no" aria-hidden>
              04
            </span>
            Database (Supabase, EU)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            The archive&apos;s content (books, factions, worlds, timelines and
            podcasts) is stored in a Postgres database provided by{" "}
            <strong>Supabase</strong> and hosted in the EU (AWS region
            eu-central-1, Frankfurt am Main). The database contains catalogue
            data, not visitor data.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-cookie">
          <h2 className="legal__kicker" id="pv-cookie">
            <span className="legal__no" aria-hidden>
              05
            </span>
            Preview access and cookie
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            During the non-public preview phase, access to the website is
            restricted. After a successful login, a cookie (
            <strong>cl-preview</strong>) is set. It is a signed access token
            with a fixed expiry date. It contains no tracking identifier, is
            not used for analytics and serves solely to protect access.
          </p>
          <p className="legal__p">
            Because this cookie is strictly necessary to provide the access
            expressly requested, no consent is required (§ 25(2)(2) TDDDG);
            the associated data processing is based on Article 6(1)(f) GDPR.
            The cookie expires automatically and will no longer be used once
            the preview phase ends. A cookie banner is not required because no
            other cookies are set.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-analytics">
          <h2 className="legal__kicker" id="pv-analytics">
            <span className="legal__no" aria-hidden>
              06
            </span>
            Audience measurement
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            To improve the service, privacy-conscious{" "}
            <strong>cookieless audience measurement</strong> is used (Vercel
            Web Analytics and Vercel Speed Insights, provided by Vercel Inc.;
            see section 03). These services operate without cookies and
            without cross-device profiles. Page views and web-performance
            values are collected in aggregate; visits may at most be
            distinguished by a short-lived hash derived from technical
            characteristics that does not permit recognition beyond the visit.
            IP addresses are not retained permanently for this purpose.
          </p>
          <p className="legal__p">
            The legal basis is Article 6(1)(f) GDPR (legitimate interest in
            statistical analysis of use). Because no information is stored on
            or read from the user&apos;s device, consent under § 25 TDDDG is not
            required. If a method requiring consent is introduced in the
            future, consent will be obtained in advance and this policy will
            be updated.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-errors">
          <h2 className="legal__kicker" id="pv-errors">
            <span className="legal__no" aria-hidden>
              07
            </span>
            Error diagnostics (Sentry)
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            To detect and resolve technical errors, a{" "}
            <strong>tool used solely for error diagnostics</strong> is
            employed: Sentry, a service of Functional Software, Inc., 45
            Fremont Street, San Francisco, CA 94105, USA. Diagnostic data is
            transmitted only when a technical error occurs while the website
            is being used: the error message and code location (stack trace),
            the affected page URL, browser and operating-system type, and the
            time of the error.
          </p>
          <p className="legal__p">
            There is <strong>no session recording</strong> (Session Replay),
            performance tracing or profiling, and no cookie is set. Error
            reports are forwarded through this website&apos;s own domain; visitor
            IP addresses are not transmitted to Sentry. Error data is stored
            in Sentry&apos;s EU data region and automatically deleted after no more
            than 90 days. Where data reaches the United States in connection
            with the service, the transfer relies on Sentry&apos;s certification
            under the EU-U.S. Data Privacy Framework or on EU Standard
            Contractual Clauses (Article 46 GDPR). The legal basis is Article
            6(1)(f) GDPR (legitimate interest in stable, error-free operation).
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-external">
          <h2 className="legal__kicker" id="pv-external">
            <span className="legal__no" aria-hidden>
              08
            </span>
            External content
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            <strong>Cover images:</strong> Book covers are not stored locally
            but loaded directly from external, publicly accessible sources
            (for example Open Library, Wikimedia, or the servers of publishers
            and catalogue services). When a page containing covers is loaded,
            your browser connects directly to those servers. The respective
            provider therefore receives your IP address and the usual browser
            information for technical reasons. I have no control over that
            processing; the respective provider&apos;s privacy information
            applies. The legal basis is Article 6(1)(f) GDPR (the interest in
            identifying the works discussed by their original covers).
          </p>
          <p className="legal__p">
            <strong>Podcast audio:</strong> Podcast episodes are streamed or
            downloaded from the respective podcast provider&apos;s server only
            when you actively play an episode or use its download link. The
            provider receives your IP address in that event.
          </p>
          <p className="legal__p">
            <strong>Music and fonts:</strong> The archive&apos;s optional
            background music is loaded from the project&apos;s own storage
            (Supabase, EU). All fonts are hosted locally; loading a page does
            not establish a connection to Google Fonts or other font services.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-rights">
          <h2 className="legal__kicker" id="pv-rights">
            <span className="legal__no" aria-hidden>
              09
            </span>
            Your rights
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            You have the following rights in relation to your personal data:
          </p>
          <ul className="legal__list">
            <li>access to the data processed (Article 15 GDPR),</li>
            <li>rectification of inaccurate data (Article 16 GDPR),</li>
            <li>erasure (Article 17 GDPR),</li>
            <li>restriction of processing (Article 18 GDPR),</li>
            <li>data portability (Article 20 GDPR),</li>
            <li>
              objection to processing based on Article 6(1)(f) GDPR (Article
              21 GDPR).
            </li>
          </ul>
          <p className="legal__p">
            To exercise these rights, an informal email to{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>{" "}
            is sufficient. You also have the right to lodge a complaint with a
            data protection supervisory authority (Article 77 GDPR), such as
            the Hamburg Commissioner for Data Protection and Freedom of
            Information.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="pv-misc">
          <h2 className="legal__kicker" id="pv-misc">
            <span className="legal__no" aria-hidden>
              10
            </span>
            Final information
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Providing personal data is neither a statutory nor a contractual
            requirement; however, the technical data generated when a page is
            accessed is necessary to deliver the website. No automated
            decision-making, including profiling (Article 22 GDPR), takes
            place.
          </p>
          <p className="legal__p">
            This policy will be amended whenever the service changes; the
            version published here at any given time applies. Provider
            information is available in the <Link href="/imprint">Imprint</Link>.
          </p>
        </section>
      </div>

      <ArchiveFooter mid="TVTELA DATORVM · GDPR" />
    </main>
  );
}

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const language = await resolveLanguage(searchParams);
  return language === "de" ? <PrivacyGermanPage /> : <PrivacyEnglishPage />;
}
