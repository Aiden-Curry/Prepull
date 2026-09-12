"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ContentVersion } from "../lib/types";
import { switchContentVersionHref, versionedHref } from "../lib/navigation";

const nav = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Characters", path: "/characters/connect" },
  { label: "Raids", path: "/raids" },
  { label: "Classes", path: "/classes" },
  { label: "Gear", path: "/gear" },
  { label: "Tools", path: "/tools" },
  { label: "Coverage", path: "/coverage" },
  { label: "Guilds", path: "/guilds" },
  { label: "Profile", path: "/profile" },
] as const;

export function Header({ version }: { version: ContentVersion }) {
  const pathname = usePathname();
  const router = useRouter();
  function switchVersion(next: ContentVersion) {
    if (next === version) return;
    router.push(switchContentVersionHref(next, pathname, window.location.search, window.location.hash));
  }
  const selector = (["era", "tbc"] as ContentVersion[]).map((item) => <button
    type="button"
    key={item}
    aria-pressed={version === item}
    onClick={() => switchVersion(item)}
    className={`focus-ring rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[.16em] transition-colors ${version === item ? "bg-[var(--accent)] text-[var(--background)] shadow-[0_0_18px_var(--glow)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
  >{item.toUpperCase()}</button>);
  return <header className="site-header sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-xl"><div className="mx-auto flex min-h-[74px] max-w-[1240px] items-center gap-4 px-5 lg:px-8">
    <Link href={versionedHref(version)} className="focus-ring flex shrink-0 items-center gap-2" aria-label={`PrePull ${version.toUpperCase()} home`}><span className="text-2xl font-black tracking-[-.08em] text-[var(--text)]">PRE<span className="text-[var(--accent)]">PULL</span></span><span className="expansion-mark">{version.toUpperCase()}</span></Link>
    <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 md:flex" role="group" aria-label="Choose content version">{selector}</div>
    <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-4 xl:flex">{nav.map((item) => { const href = versionedHref(version, item.path); const active = pathname === href || pathname.startsWith(`${href}/`); return <Link aria-current={active ? "page" : undefined} className="nav-link focus-ring" href={href} key={item.path}>{item.label}</Link>; })}</nav>
    <button className="focus-ring ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent-hover)] xl:ml-0" aria-label="Search">⌕</button>
    <button onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="focus-ring hidden shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] sm:block">Sign out</button>
    <details className="relative xl:hidden"><summary className="focus-ring cursor-pointer list-none rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--accent-hover)]">Menu</summary><div className="panel absolute right-0 top-12 max-h-[calc(100vh-6rem)] w-56 overflow-y-auto rounded-xl p-2"><div className="mb-2 flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-1" role="group" aria-label="Choose content version">{selector}</div>{nav.map((item) => { const href = versionedHref(version, item.path); const active = pathname === href || pathname.startsWith(`${href}/`); return <Link aria-current={active ? "page" : undefined} key={item.path} href={href} className="nav-link block rounded-lg px-3 py-2">{item.label}</Link>; })}</div></details>
  </div></header>;
}
