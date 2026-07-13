import Link from "next/link";

export type LegalLanguage = "en" | "de";

export function legalLanguageFromParam(
  value: string | string[] | undefined,
): LegalLanguage {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "de" ? "de" : "en";
}

export default function LegalLanguageToggle({
  language,
  pathname,
}: {
  language: LegalLanguage;
  pathname: "/imprint" | "/privacy";
}) {
  return (
    <nav className="legal__language" aria-label="Document language" lang="en">
      <Link
        href={pathname}
        scroll={false}
        className="legal__language-option"
        aria-current={language === "en" ? "page" : undefined}
        aria-label="Read this page in English"
        lang="en"
      >
        English
      </Link>
      <span className="legal__language-sep" aria-hidden>
        ·
      </span>
      <Link
        href={`${pathname}?lang=de`}
        scroll={false}
        className="legal__language-option"
        aria-current={language === "de" ? "page" : undefined}
        aria-label="Diese Seite auf Deutsch lesen"
        lang="de"
      >
        Deutsch
      </Link>
    </nav>
  );
}
