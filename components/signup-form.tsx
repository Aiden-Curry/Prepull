"use client";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

type SignupError = { message?: string; field?: string };

export function SignupForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState<SignupError>({});
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError({}); setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? ""); const password = String(form.get("password") ?? "");
    try {
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, confirmPassword: form.get("confirmPassword") }) });
      const result = await response.json() as SignupError;
      if (!response.ok) { setError({ message: result.message ?? "We couldn't create your account.", field: result.field }); return; }
      const signedIn = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (signedIn?.error) { setError({ message: "Your account was created. Sign in to continue." }); return; }
      window.location.assign(signedIn?.url ?? callbackUrl);
    } catch { setError({ message: "We couldn't create your account right now. Try again shortly." }); }
    finally { setPending(false); }
  }
  const describedBy = error.message ? "signup-error" : undefined;
  return <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
    <label className="block text-xs text-[var(--muted)]">Email<input name="email" type="email" autoComplete="email" required aria-invalid={error.field === "email"} aria-describedby={error.field === "email" ? describedBy : undefined} className="field mt-1 w-full" /></label>
    <label className="block text-xs text-[var(--muted)]" htmlFor="signup-password">Password</label><input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={12} required aria-invalid={error.field === "password"} aria-describedby={error.field === "password" ? describedBy : "password-help"} className="field -mt-3 w-full" /><span id="password-help" className="-mt-3 block text-[11px] text-[var(--muted)]">At least 12 characters.</span>
    <label className="block text-xs text-[var(--muted)]">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required aria-invalid={error.field === "confirmPassword"} aria-describedby={error.field === "confirmPassword" ? describedBy : undefined} className="field mt-1 w-full" /></label>
    <p id="signup-error" aria-live="polite" className="min-h-5 text-sm text-red-300">{error.message}</p>
    <button disabled={pending} aria-disabled={pending} className="button-primary w-full">{pending ? "Creating account…" : "Create account"}</button>
  </form>;
}
