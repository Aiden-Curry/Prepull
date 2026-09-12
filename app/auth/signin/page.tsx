import Link from "next/link";
import { SignInForm } from "../../../components/sign-in-form";
import { VersionShell } from "../../../components/version-shell";
import { versionedHref } from "../../../lib/navigation";
import type { ContentVersion } from "../../../lib/types";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const requested = (await searchParams).callbackUrl;
  const callbackUrl = requested && /^\/(?:era|tbc)(?:\/|$)/.test(requested) ? requested : "/era/guilds";
  const version: ContentVersion = callbackUrl.startsWith("/tbc") ? "tbc" : "era";
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-xl px-5 py-20"><Link href={versionedHref(version)} className="text-xs text-[var(--text-muted)]">← Back to PrePull</Link><div className="panel mt-8 rounded-2xl p-8"><p className="eyebrow">PrePull account · {version.toUpperCase()}</p><h1 className="display mt-2 text-4xl">Sign in</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Use your authenticated PrePull account to manage guild workspaces. Battle.net connection remains a separate character-data integration.</p><SignInForm callbackUrl={callbackUrl} /></div></main></VersionShell>;
}
