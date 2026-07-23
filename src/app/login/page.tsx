import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import { login } from "./actions";
// Route-scoped stylesheet (S7a). Its body:has(main.login) chrome overrides
// out-specify the global chrome rules, so load order stays irrelevant.
import "@/app/styles/68-login.css";

export const metadata: Metadata = {
  title: "Login",
  description: "Restricted preview access to the Chrono Lexicanum archive.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const failed = firstParam(params.error) === "1";

  return (
    <main id="main" tabIndex={-1} className="login">
      <SiteBackground variant="login" position="center" />
      <section className="login-console">
        <p className="login-kicker">RESTRICTED ARCHIVE · PREVIEW ACCESS</p>
        <h1 className="login-title">Chrono Lexicanum</h1>
        <div className="login-rule" aria-hidden />

        <p className="login-sub">
          The archive is sealed while the preview is underway. Identify
          yourself to enter.
        </p>
        <form className="login-form" action={login}>
          <label className="lx-field login-field">
            <span className="login-lab">NAME</span>
            <input
              name="user"
              type="text"
              autoComplete="username"
              placeholder="Name"
              required
            />
          </label>
          <label className="lx-field login-field">
            <span className="login-lab">PASSWORD</span>
            <input
              name="pass"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
            />
          </label>
          {failed && (
            <p className="login-error" role="alert">
              CREDENTIALS NOT RECOGNISED · ACCESS DENIED
            </p>
          )}
          <button type="submit" className="lx-btn login-btn">
            ENTER THE ARCHIVE
          </button>
        </form>
      </section>

      {/* Legal links: /login is publicly reachable even while the
          preview gate is up, so the § 5 DDG / Art. 13 DSGVO pages must be
          linked from here — all three routes sit outside the gate. */}
      <footer className="login-legal" aria-label="Legal">
        <Link href="/imprint">Imprint</Link>
        <span aria-hidden>·</span>
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden>·</span>
        <Link href="/artwork">Artwork</Link>
      </footer>
    </main>
  );
}
