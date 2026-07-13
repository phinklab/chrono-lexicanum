import type { Metadata } from "next";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import LegalLanguageToggle, {
  legalLanguageFromParam,
  type LegalLanguage,
} from "@/components/legal/LegalLanguageToggle";
// Route-scoped stylesheet (S7a), shared by the three legal document pages.
import "@/app/styles/71-legal.css";

/* Imprint — § 5 DDG mandatory information plus the long-form Games Workshop
   IP disclaimer. Static content, no DB, reachable WITHOUT a preview session.
   English is the canonical default; `?lang=de` selects the German document
   without introducing a site-wide locale layer. */

interface ImprintPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function resolveLanguage(
  searchParams: ImprintPageProps["searchParams"],
): Promise<LegalLanguage> {
  const params = await searchParams;
  return legalLanguageFromParam(params.lang);
}

export async function generateMetadata({
  searchParams,
}: ImprintPageProps): Promise<Metadata> {
  const language = await resolveLanguage(searchParams);
  return language === "de"
    ? {
        title: "Impressum",
        description:
          "Impressum von Chrono · Lexicanum — Anbieterkennzeichnung nach § 5 DDG und urheber- und markenrechtliche Hinweise (Games Workshop).",
        alternates: { canonical: "/imprint" },
      }
    : {
        title: "Imprint",
        description:
          "Imprint for Chrono · Lexicanum — provider information under § 5 DDG and copyright and trademark notices concerning Games Workshop.",
        alternates: { canonical: "/imprint" },
      };
}

function ImprintEnglish() {
  return (
    <div className="legal__doc">
      <section className="legal__section" aria-labelledby="lg-provider">
        <h2 className="legal__kicker" id="lg-provider">
          <span className="legal__no" aria-hidden>
            01
          </span>
          Information pursuant to § 5 DDG
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <address className="legal__address">
          Philipp Künzler
          <br />
          Saseler Weg 11a
          <br />
          22359 Hamburg
          <br />
          Germany
        </address>
      </section>

      <section className="legal__section" aria-labelledby="lg-contact">
        <h2 className="legal__kicker" id="lg-contact">
          <span className="legal__no" aria-hidden>
            02
          </span>
          Contact
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <address className="legal__address">
          Email:{" "}
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
          Responsible under § 18(2) MStV
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <p className="legal__p">Philipp Künzler, address as above.</p>
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
          Copyright and trademarks · Games Workshop
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <p className="legal__p">
          Chrono · Lexicanum is an{" "}
          <strong>unofficial, non-commercial fan project</strong>. It is not
          affiliated with Games Workshop and is neither supported nor
          authorised by Games Workshop.
        </p>
        <p className="legal__p">
          Warhammer, Warhammer 40,000, 40K, Black Library, The Horus Heresy,
          and all associated trademarks, logos, names, places, characters,
          vehicles, creatures, peoples and their insignia are trademarks or
          registered trademarks of <strong>Games Workshop Limited</strong>,
          registered in various forms in the United Kingdom and other
          countries. All rights remain with their respective owners.
          Trademarks and titles are named on this website solely to identify
          and discuss the works; no claim to any rights is intended.
        </p>
        <p className="legal__p">
          <strong>Cover images:</strong> The book covers shown are protected by
          copyright; the rights remain with the respective publishers,
          artists and other rights holders. Covers are not hosted on this
          project&apos;s own servers. They are embedded from external, publicly
          accessible sources and shown solely to identify the works discussed.
          Rights holders who object to an image being embedded can contact me
          at{" "}
          <a href="mailto:info@chrono-lexicanum.com">
            info@chrono-lexicanum.com
          </a>
          ; the affected content will be removed without delay.
        </p>
        <p className="legal__en" lang="en">
          This is an unofficial, non-commercial fan site. It is not endorsed
          by or affiliated with Games Workshop. Warhammer 40,000 and all
          associated names, marks, and imagery are the intellectual property
          of Games Workshop Limited. No challenge to their status is intended.
        </p>
      </section>

      <section className="legal__section" aria-labelledby="lg-vsbg">
        <h2 className="legal__kicker" id="lg-vsbg">
          <span className="legal__no" aria-hidden>
            05
          </span>
          Consumer dispute resolution
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <p className="legal__p">
          Chrono · Lexicanum is a private, non-commercial offering; no
          contracts are concluded through this website. I am neither obliged
          nor willing to participate in dispute resolution proceedings before
          a consumer arbitration board (§ 36 VSBG).
        </p>
      </section>

      <section className="legal__section" aria-labelledby="lg-liability">
        <h2 className="legal__kicker" id="lg-liability">
          <span className="legal__no" aria-hidden>
            06
          </span>
          Liability for content and links
        </h2>
        <div className="legal__section-rule" aria-hidden />
        <p className="legal__p">
          The content of this website has been prepared with care, but it is
          based on fan research; I make no warranty as to its accuracy,
          completeness or currency. Corrections are welcome by email.
        </p>
        <p className="legal__p">
          This website contains links to external third-party websites whose
          content is outside my control. The respective operators are solely
          responsible for that content; no unlawful material was apparent when
          the links were created.
        </p>
      </section>
    </div>
  );
}

function ImprintGerman() {
  return (
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
        <p className="legal__p">Philipp Künzler, Anschrift wie oben.</p>
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
          Chrono · Lexicanum ist ein{" "}
          <strong>inoffizielles, nicht-kommerzielles Fan-Projekt</strong>. Es
          steht in keiner Verbindung zu Games Workshop und wird von Games
          Workshop weder unterstützt noch autorisiert.
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
          gezeigt. Rechteinhaber, die mit einer Einbindung nicht einverstanden
          sind, erreichen mich unter{" "}
          <a href="mailto:info@chrono-lexicanum.com">
            info@chrono-lexicanum.com
          </a>{" "}
          — betroffene Inhalte werden umgehend entfernt.
        </p>
        <p className="legal__en" lang="en">
          This is an unofficial, non-commercial fan site. It is not endorsed
          by or affiliated with Games Workshop. Warhammer 40,000 and all
          associated names, marks, and imagery are the intellectual property
          of Games Workshop Limited. No challenge to their status is intended.
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
          an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          bin ich nicht verpflichtet und nicht bereit (§ 36 VSBG).
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
  );
}

export default async function ImprintPage({ searchParams }: ImprintPageProps) {
  const language = await resolveLanguage(searchParams);
  const german = language === "de";

  return (
    <main id="main" tabIndex={-1} className="legal" lang={language}>
      <header className="legal__head">
        <p className="legal__eyebrow">
          {german
            ? "Chrono · Lexicanum — Rechtliches"
            : "Chrono · Lexicanum — Legal"}
        </p>
        <h1 className="legal__title">{german ? "Impressum" : "Imprint"}</h1>
        <div className="legal__rule" aria-hidden />
        <LegalLanguageToggle language={language} pathname="/imprint" />
      </header>

      {german ? <ImprintGerman /> : <ImprintEnglish />}

      <ArchiveFooter mid="IMPRESSVM · § 5 DDG" />
    </main>
  );
}
