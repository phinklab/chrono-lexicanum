import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Login - Chrono Lexicanum",
  description: "Restricted preview access to the Chrono Lexicanum archive.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const failed = params.error === "1";

  return (
    <main className="login">
      <SiteBackground variant="login" position="center" />
      <section className="login-console">
        <p className="login-kicker">RESTRICTED ARCHIVE · PREVIEW ACCESS</p>
        <h1 className="login-title">Chrono · Lexicanum</h1>
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
    </main>
  );
}
