import Link from "next/link";
import SiteBackground, { type SiteBgVariant } from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/app/buecher/ScrollScrim";
import "./example.css";

/**
 * Geteilte Hülle der vier /lab-Beispielseiten (Session 141, Feedback-Runde 2,
 * 2026-06-11): liefert das ECHTE Seiten-Skelett der Produktionsrouten — das
 * fixe Foto-Backdrop (SiteBackground bzw. books.webp fürs Archiv), den
 * Fade-to-void, den ScrollScrim — plus die diskrete Lab-Leiste oben links.
 * Masthead + Imprimatur-Fuß sind Bausteine (LexMast / LexFooter), die jede
 * Seite in ihrem eigenen Fluss platziert. Dummy-Material, NICHT produktiv.
 */

const PAGES = [
  { slug: "home_example", num: "I", label: "Home" },
  { slug: "archive_example", num: "II", label: "Archive" },
  { slug: "compendium_example", num: "III", label: "Compendium" },
  { slug: "ask_example", num: "IV", label: "Ask" },
] as const;

export type ExampleSlug = (typeof PAGES)[number]["slug"];

export default function ExampleShell({
  active,
  mainClass,
  variant,
  position,
  heroSelector,
  children,
}: {
  active: ExampleSlug;
  /** Seitenklasse neben .lex — lexh | lexa | lexc | lexq. */
  mainClass: string;
  /** SiteBackground-Variante; "books" = das fixe books.webp des Archivs. */
  variant: SiteBgVariant | "books";
  position?: string;
  /** Hero-Selektor, über dessen Höhe der ScrollScrim abdunkelt. */
  heroSelector: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`lex ${mainClass}`}>
      {variant === "books" ? (
        <>
          <div className="lexa-photo" aria-hidden />
          <div className="lexa-fade" aria-hidden />
        </>
      ) : (
        <SiteBackground variant={variant} position={position} />
      )}
      <ScrollScrim
        className="lex-scrim"
        varName="--lex-scrim-opacity"
        heroSelector={heroSelector}
      />

      <nav className="lex-strip" aria-label="Lab-Beispielseiten">
        <span className="lex-strip__t">LAB·SPECIMEN</span>
        {PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/lab/${p.slug}`}
            className={p.slug === active ? "on" : undefined}
            aria-current={p.slug === active ? "page" : undefined}
          >
            {p.num}
            <span className="lbl">·{p.label}</span>
          </Link>
        ))}
        <Link href="/lab/design">
          ✶<span className="lbl">·Styleguide</span>
        </Link>
      </nav>

      {children}
    </main>
  );
}

/** Masthead — Titel bei 320px geparkt (die /ask + /werke + /compendium-Höhe),
 *  mit Terminus-Linie als Titel-Schmuck der neuen Sprache. */
export function LexMast({
  eyebrow,
  title,
  sub,
  className,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <header className={className ? `lex-mast ${className}` : "lex-mast"}>
      <p className="lex-mast__eyebrow">{eyebrow}</p>
      <h1 className="lex-mast__heading">{title}</h1>
      <div className="lex-mast__rule" aria-hidden />
      <p className="lex-mast__sub">{sub}</p>
    </header>
  );
}

/** Fuß — Imprimatur-Siegel (Report C1-1) über der Mono-Triade. */
export function LexFooter({ mid }: { mid: string }) {
  return (
    <footer className="lex-foot">
      <div className="lex-foot__seal">
        <span className="lex-foot__aq" aria-hidden>
          ⚜
        </span>
        <span className="lex-foot__l1">Imprimatur</span>
        <span className="lex-foot__l2">
          Archivvm Chronologicvm · Lab Specimen · Dummy Data
        </span>
      </div>
      <div className="lex-foot__triad">
        <span>EX TENEBRIS · COGNITIO</span>
        <span className="lex-foot__mid">{mid}</span>
        <span>STAMP M42.347</span>
      </div>
    </footer>
  );
}
