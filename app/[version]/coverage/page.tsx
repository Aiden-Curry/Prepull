import { notFound } from "next/navigation";
import { VersionShell } from "../../../components/version-shell";
import { isContentVersion } from "../../../lib/game-data";
import { getSupportMatrix } from "../../../lib/recommendations/support-matrix";
import type { ContentVersion } from "../../../lib/types";

export default async function CoveragePage({ params }: { params: Promise<{ version: string }> }) {
  const { version: raw } = await params;
  if (!isContentVersion(raw)) notFound();
  const version = raw as ContentVersion;
  const matrix = getSupportMatrix(version);
  const supported = matrix.flatMap((entry) => entry.specs.filter((spec) => spec.status === "supported").map((spec) => ({ ...spec, className: entry.className })));
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
    <header className="max-w-3xl"><div className="eyebrow mb-3">Recommendation coverage</div><h1 className="display text-5xl tracking-[-.04em]">Know what PrePull supports.</h1><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Supported specializations use reviewed curated recommendations for PlayerAdvice, gear progress, and Session Planner. More specializations are coming later; no release dates are promised.</p></header>
    <section className="mt-10" aria-labelledby="supported-heading"><h2 id="supported-heading" className="display text-3xl">Supported now</h2>{supported.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{supported.map((spec) => <article className="rounded-2xl border border-[var(--primary)]/45 bg-[var(--surface)] p-6" key={spec.specKey}><div className="eyebrow">Supported</div><h3 className="display mt-2 text-2xl">{spec.specName} {spec.className}</h3><div className="mt-4 flex flex-wrap gap-2">{spec.phases.map((phase) => <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--primary-light)]" key={phase}>{phase}</span>)}</div></article>)}</div> : <p className="panel mt-5 rounded-xl p-5 text-sm text-[var(--muted)]">Recommendation coverage for this content version is coming later.</p>}</section>
    <section className="mt-12" aria-labelledby="matrix-heading"><h2 id="matrix-heading" className="display text-3xl">All specializations</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{matrix.map((entry) => <article className="panel rounded-2xl p-5" key={entry.className}><h3 className="text-lg font-semibold">{entry.className}</h3><ul className="mt-4 space-y-3">{entry.specs.map((spec) => <li className="flex items-center justify-between gap-3 text-sm" key={spec.specName}><span>{spec.specName}</span><span className={spec.status === "supported" ? "text-[var(--primary-light)]" : "text-[var(--muted)]"}>{spec.status === "supported" ? "Supported" : "Coming later"}</span></li>)}</ul></article>)}</div></section>
  </main></VersionShell>;
}
