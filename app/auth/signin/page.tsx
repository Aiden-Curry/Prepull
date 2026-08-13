import Link from "next/link";
import { VersionShell } from "../../../components/version-shell";
import { SignInForm } from "../../../components/sign-in-form";
export default function SignInPage() { return <VersionShell version="era"><main className="mx-auto min-h-[calc(100vh-148px)] max-w-xl px-5 py-20"><Link href="/era" className="text-xs text-[var(--muted)]">← Back to PrePull</Link><div className="panel mt-8 rounded-2xl p-8"><p className="eyebrow">PrePull account</p><h1 className="display mt-2 text-4xl">Sign in</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use your authenticated PrePull account to manage guild workspaces. Battle.net connection remains a separate character-data integration.</p><SignInForm /></div></main></VersionShell>; }
