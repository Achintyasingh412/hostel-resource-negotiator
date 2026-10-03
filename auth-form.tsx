"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, LoaderCircle, ShieldCheck } from "lucide-react";
import { loginDemoUser } from "@/app/actions";

type DemoAccount = { id: string; name: string; passcode: string };

type AuthFormProps = { accounts: DemoAccount[] };

export function AuthForm({ accounts }: AuthFormProps) {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const result = await loginDemoUser(uid, passcode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="brand-lockup auth-brand" aria-label="Hostel Nexus">
          <span className="brand-mark"><Building2 aria-hidden="true" /></span>
          <span>hostel<span className="brand-accent">nexus</span></span>
        </div>

        <div className="auth-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> WING 4B · COMMUNITY PORTAL</div>
          <h1>Good stays.<br /><span>Better shared.</span></h1>
          <p>Book the things you love. Leave the space better than you found it.</p>
          <div className="auth-promise"><ShieldCheck aria-hidden="true" /><span>Demo access for trying the hostel community portal.</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="section-kicker">WELCOME BACK</span>
            <h2 id="auth-title">Sign in to your space</h2>
            <p>Enter your hostel UID and four-digit demo PIN.</p>
          </div>

          <form className="auth-fields" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="hostel-uid">
              Hostel UID
              <input
                id="hostel-uid"
                name="uid"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                value={uid}
                onChange={(event) => setUid(event.target.value.toUpperCase())}
                placeholder="HOSTEL-01"
                required
                maxLength={32}
              />
            </label>
            <label className="field-label" htmlFor="hostel-pin">
              4-digit PIN
              <input
                id="hostel-pin"
                name="passcode"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                pattern="[0-9]{4}"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter your PIN"
                required
                minLength={4}
                maxLength={4}
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="spin" aria-hidden="true" /> : null}
              {pending ? "One moment…" : "Sign in"}
              {!pending && <ArrowRight aria-hidden="true" />}
            </button>
          </form>

          <div className="demo-access" aria-labelledby="demo-access-title">
            <div className="demo-access-heading">
              <span className="section-kicker" id="demo-access-title">DEMO ACCESS</span>
              <span>UID · PIN</span>
            </div>
            <ul className="demo-account-list">
              {accounts.map((account) => (
                <li key={account.id}>
                  <span className="demo-account-name">{account.name}</span>
                  <code>{account.id}</code>
                  <code>{account.passcode}</code>
                </li>
              ))}
            </ul>
          </div>
          <p className="auth-footnote">Shared sample accounts use public PINs. Don&apos;t enter personal or sensitive information.</p>
        </div>
        <footer className="auth-footer">A little more room to live well. <span>© 2026 Hostel Nexus</span></footer>
      </section>
    </main>
  );
}
