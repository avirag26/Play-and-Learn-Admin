"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Alert, BrandMark, Button, inputClass, labelClass } from "@/components/ui";
import { ApiError, login, type AdminUser } from "@/lib/api";

export function LoginForm({ onSignedIn }: { onSignedIn: (user: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { onSignedIn(await login(email, password)); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return <main className="grid flex-1 place-items-center bg-sky/60 px-4 py-12">
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center justify-center gap-3"><BrandMark size="lg" /><div><p className="text-xl font-extrabold leading-tight text-ink">Play &amp; Learn</p><p className="text-sm font-semibold text-muted-ink">Admin</p></div></div>
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(48,70,93,0.08)] sm:p-7">
        <h1 className="text-xl font-extrabold text-ink">Sign in</h1>
        <p className="mt-1 text-sm leading-6 text-muted-ink">Use an account with the admin role.</p>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className={labelClass}>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus className={inputClass} /></label>
          <label className={labelClass}>Password
            <span className="relative block"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className={`${inputClass} pr-16`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-muted-ink hover:bg-cream">{showPassword ? "Hide" : "Show"}</button></span>
          </label>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" disabled={busy} className="mt-1 w-full">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </section>
      <p className="mt-5 text-center text-xs leading-5 text-muted-ink">No admin yet? On the API server run<br /><code className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink">npm run admin -- create you@example.com Your Name</code></p>
    </div>
  </main>;
}
