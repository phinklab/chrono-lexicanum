import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import { previewSecret } from "@/lib/previewGate";
import { verifyPreviewToken } from "@/lib/previewToken";
import { acceptInvite, login } from "./actions";
// Route-scoped stylesheet (S7a). Its body:has(main.login) chrome overrides
// out-specify the global chrome rules, so load order stays irrelevant.
import "@/app/styles/68-login.css";

export const metadata: Metadata = {
  title: "Login",
  description: "Restricted preview access to the Chrono Lexicanum archive.",
  robots: { index: false, follow: false },
  // The invite token rides in `?invite=`. `no-referrer` keeps it out
  // of any outbound Referer (belt-and-suspenders with the contact link's
  // rel="noopener noreferrer") so the token can't leak when this page links out.
  referrer: "no-referrer",
};

// Where a recipient asks for a fresh preview link.
const REDDIT_CONTACT = "https://www.reddit.com/user/piwireddit/";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const failed = firstParam(params.error) === "1";
  const inviteToken = firstParam(params.invite);

  // Server-validate the invite (if any) BEFORE rendering: the accept action
  // only appears for a signature-valid, unexpired `typ === "invite"` token. A
  // bad/expired token — or an unset secret (redemption disabled) — yields null,
  // which renders the invalid/expired state instead. The Accept action
  // re-verifies authoritatively; this render-time check only chooses the UI.
  const secret = previewSecret();
  const invite =
    inviteToken && secret
      ? await verifyPreviewToken(inviteToken, secret, "invite")
      : null;

  const mode: "accept" | "expired" | "credentials" = inviteToken
    ? invite
      ? "accept"
      : "expired"
    : "credentials";

  return (
    <main id="main" tabIndex={-1} className="login">
      <SiteBackground variant="login" position="center" />
      <section className="login-console">
        <p className="login-kicker">RESTRICTED ARCHIVE · PREVIEW ACCESS</p>
        <h1 className="login-title">Chrono Lexicanum</h1>
        <div className="login-rule" aria-hidden />

        {mode === "accept" && (
          <div className="login-invite">
            <p className="login-sub">
              Your seal is recognised. Accept the invitation to break the wax and
              enter the archive for the span of your grant.
            </p>
            <form className="login-form" action={acceptInvite}>
              <input type="hidden" name="invite" value={inviteToken} />
              <button type="submit" className="lx-btn login-btn">
                ACCEPT INVITATION
              </button>
            </form>
          </div>
        )}

        {mode === "expired" && (
          <div className="login-expired">
            <p className="login-sub">
              This invitation cannot be read — its seal is broken or its term has
              lapsed. The archive stays sealed.
            </p>
            <p className="login-expired-contact">
              If you need a fresh preview link,{" "}
              <a
                href={REDDIT_CONTACT}
                target="_blank"
                rel="noopener noreferrer"
              >
                contact me
              </a>
              .
            </p>
          </div>
        )}

        {mode === "credentials" && (
          <>
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
          </>
        )}
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
