import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignupForm } from "../../../components/signup-form";
import { VersionShell } from "../../../components/version-shell";
import { authOptions } from "../../../lib/auth";
import { authSignInHref, DEFAULT_AUTH_CALLBACK, sanitizeAuthCallback } from "../../../lib/auth-callback";
import { versionedHref } from "../../../lib/navigation";
import type { ContentVersion } from "../../../lib/types";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = sanitizeAuthCallback((await searchParams).callbackUrl, DEFAULT_AUTH_CALLBACK);
  const version: ContentVersion = callbackUrl.startsWith("/tbc") ? "tbc" : "era";
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect(callbackUrl);
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-xl px-5 py-14 sm:py-20"><Link href={versionedHref(version)} className="text-xs text-[var(--text-muted)]">← Back to PrePull</Link><div className="panel mt-8 rounded-2xl p-6 sm:p-8"><p className="eyebrow">PrePull account · {version.toUpperCase()}</p><h1 className="display mt-2 text-4xl">Create account</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Create your account, then find a character and establish your first equipment baseline.</p><SignupForm callbackUrl={callbackUrl} /><p className="mt-6 text-center text-sm text-[var(--text-muted)]">Already have an account? <Link className="text-[var(--accent-hover)] underline" href={authSignInHref(callbackUrl)}>Sign in</Link></p></div></main></VersionShell>;
}
