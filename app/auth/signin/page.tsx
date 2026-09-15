import Link from "next/link";
import { BattleNetStart } from "../../../components/battle-net-start";
import { SignInForm } from "../../../components/sign-in-form";
import { VersionShell } from "../../../components/version-shell";
import { versionedHref } from "../../../lib/navigation";
import { authSignUpHref, DEFAULT_AUTH_CALLBACK, sanitizeAuthCallback } from "../../../lib/auth-callback";
import type { ContentVersion } from "../../../lib/types";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; battleNet?: string }> }) {
  const params = await searchParams; const callbackUrl = sanitizeAuthCallback(params.callbackUrl, DEFAULT_AUTH_CALLBACK); const version: ContentVersion = callbackUrl.startsWith("/tbc") ? "tbc" : "era";
  const battleNetError = params.battleNet === "cancelled" ? "Battle.net authorization was cancelled. No account was changed." : params.battleNet === "collision" ? "That Battle.net account is already connected to another PrePull account." : "Battle.net sign-in could not be completed. Please try again.";
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-xl px-5 py-20"><Link href={versionedHref(version)} className="text-xs text-[var(--text-muted)]">← Back to PrePull</Link><div className="panel mt-8 rounded-2xl p-8"><p className="eyebrow">PrePull account · {version.toUpperCase()}</p><h1 className="display mt-2 text-4xl">Sign in</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Sign in to manage your characters, preparation, and guild workspaces.</p>{params.battleNet && <p className="mt-4 rounded-lg border border-amber-300/30 p-3 text-sm" role="status">{battleNetError}</p>}<BattleNetStart callbackUrl={callbackUrl} /><div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--line)]"/><span>or use email</span><span className="h-px flex-1 bg-[var(--line)]"/></div><SignInForm callbackUrl={callbackUrl} /><p className="mt-6 text-center text-sm text-[var(--text-muted)]">Don&apos;t have an account? <Link className="text-[var(--accent-hover)] underline" href={authSignUpHref(callbackUrl)}>Create account</Link></p></div></main></VersionShell>;
}
