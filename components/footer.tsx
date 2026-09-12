import Link from "next/link";
import { ContentVersion } from "../lib/types";
import { versionedHref } from "../lib/navigation";
export function Footer({ version }: { version: ContentVersion }) { return <footer className="border-t border-[var(--border)]"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between lg:px-8"><Link href={versionedHref(version)} className="focus-ring font-bold tracking-[-.04em] text-[var(--text)]">PRE<span className="text-[var(--accent)]">PULL</span> <span className="ml-1 text-[10px] tracking-widest text-[var(--accent-hover)]">{version.toUpperCase()}</span></Link><span>Made for players who like to come prepared.</span><span>© 2026 PrePull</span></div></footer>; }
