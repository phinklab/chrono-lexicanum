import type { Metadata } from "next";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
// Route-scoped stylesheet (S7a), shared by the three legal document pages.
import "@/app/styles/71-legal.css";

/* Impressum — § 5 DDG mandatory information plus the long-form
   Games Workshop IP disclaimer. Static server
   component, no DB, reachable WITHOUT a preview session (excluded from the
   proxy matcher): the duty to carry an Impressum already attaches to the
   publicly reachable /login surface, not only to the post-launch site.
   English slug per the URL-EN convention; the content itself is German
   legal text and must stay sober — no in-universe register. */

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "Impressum von Chrono · Lexicanum — Anbieterkennzeichnung nach § 5 DDG und urheber- und markenrechtliche Hinweise (Games Workshop).",
  alternates: { canonical: "/imprint" },
};

export default function ImprintPage() {
  return (
    <main className="legal" lang="de">
      <header className="legal__head">
        <p className="legal__eyebrow">Chrono · Lexicanum — Rechtliches</p>
        <h1 className="legal__title">Impressum</h1>
        <div className="legal__rule" aria-hidden />
      </header>

      <div className="legal__doc">
        <section className="legal__section" aria-labelledby="lg-provider">
          <h2 className="legal__kicker" id="lg-provider">
            <span className="legal__no" aria-hidden>
              01
            </span>
            Angaben gemäß § 5 DDG
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <address className="legal__address">
            Philipp Künzler
            <br />
            Saseler Weg 11a
            <br />
            22359 Hamburg
            <br />
            Deutschland
          </address>
        </section>

        <section className="legal__section" aria-labelledby="lg-contact">
          <h2 className="legal__kicker" id="lg-contact">
            <span className="legal__no" aria-hidden>
              02
            </span>
            Kontakt
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <address className="legal__address">
            E-Mail:{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>
          </address>
        </section>

        <section className="legal__section" aria-labelledby="lg-editor">
          <h2 className="legal__kicker" id="lg-editor">
            <span className="legal__no" aria-hidden>
              03
            </span>
            Verantwortlich nach § 18 Abs. 2 MStV
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Philipp Künzler, Anschrift wie oben.
          </p>
        </section>

        <section
          className="legal__section"
          id="disclaimer"
          aria-labelledby="lg-gw"
        >
          <h2 className="legal__kicker" id="lg-gw">
            <span className="legal__no" aria-hidden>
              04
            </span>
            Urheber- und Markenrechte · Games Workshop
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Chrono · Lexicanum ist ein <strong>inoffizielles, nicht-kommerzielles
            Fan-Projekt</strong>. Es steht in keiner Verbindung zu Games Workshop
            und wird von Games Workshop weder unterstützt noch autorisiert.
          </p>
          <p className="legal__p">
            Warhammer, Warhammer 40,000, 40K, Black Library, The Horus Heresy
            sowie alle zugehörigen Marken, Logos, Namen, Orte, Charaktere,
            Fahrzeuge, Kreaturen, Völker und deren Insignien sind Marken bzw.
            eingetragene Marken von <strong>Games Workshop Limited</strong>,
            unterschiedlich registriert in Großbritannien und anderen Ländern.
            Alle Rechte liegen bei den jeweiligen Inhabern. Die Nennung von
            Marken und Werktiteln auf dieser Website dient ausschließlich der
            Identifikation und Besprechung der Werke; eine Anmaßung von Rechten
            ist damit nicht verbunden.
          </p>
          <p className="legal__p">
            <strong>Cover-Abbildungen:</strong> Die gezeigten Buchcover sind
            urheberrechtlich geschützt; die Rechte liegen bei den jeweiligen
            Verlagen, Künstlerinnen und Künstlern bzw. sonstigen
            Rechteinhabern. Cover werden nicht auf eigenen Servern vorgehalten,
            sondern von externen, öffentlich zugänglichen Quellen eingebunden
            und ausschließlich zur Identifikation der besprochenen Werke
            gezeigt. Rechteinhaber, die mit einer Einbindung nicht
            einverstanden sind, erreichen mich unter{" "}
            <a href="mailto:info@chrono-lexicanum.com">
              info@chrono-lexicanum.com
            </a>{" "}
            — betroffene Inhalte werden umgehend entfernt.
          </p>
          <p className="legal__en" lang="en">
            This is an unofficial, non-commercial fan site. It is not endorsed
            by or affiliated with Games Workshop. Warhammer 40,000 and all
            associated names, marks, and imagery are the intellectual property
            of Games Workshop Limited. No challenge to their status is
            intended.
          </p>
        </section>

        <section className="legal__section" aria-labelledby="lg-vsbg">
          <h2 className="legal__kicker" id="lg-vsbg">
            <span className="legal__no" aria-hidden>
              05
            </span>
            Verbraucherstreitbeilegung
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Chrono · Lexicanum ist ein privates, nicht-kommerzielles Angebot;
            Verträge werden über diese Website nicht geschlossen. Zur Teilnahme
            an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle bin ich nicht verpflichtet und nicht
            bereit (§ 36 VSBG).
          </p>
        </section>

        <section className="legal__section" aria-labelledby="lg-liability">
          <h2 className="legal__kicker" id="lg-liability">
            <span className="legal__no" aria-hidden>
              06
            </span>
            Haftung für Inhalte und Links
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            Die Inhalte dieser Website wurden mit Sorgfalt erstellt, sind aber
            fan-recherchiert; für Richtigkeit, Vollständigkeit und Aktualität
            übernehme ich keine Gewähr. Hinweise auf Fehler nehme ich gern per
            E-Mail entgegen.
          </p>
          <p className="legal__p">
            Diese Website enthält Links zu externen Websites Dritter, auf deren
            Inhalte ich keinen Einfluss habe. Für diese Inhalte sind
            ausschließlich die jeweiligen Betreiber verantwortlich; zum
            Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
          </p>
        </section>
      </div>

      <ArchiveFooter mid="IMPRESSVM · § 5 DDG" />
    </main>
  );
}
