import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../components/version-shell";
import { isContentVersion } from "../../../../lib/game-data";
import type { ContentVersion } from "../../../../lib/types";

const sections = [
  ["Complete loadouts", "PrePull clones the current equipment set, equips a candidate in every legal slot, and compares the resulting loadout. Item level is never the final decision by itself."],
  ["Stats and Hit breakpoints", "The Era Fury profile uses documented heuristic stat values. Hit has a higher marginal value below the configured target and a reduced value above it. The target is configurable because weapon skill, race, talents, and encounter context can change the relevant assumption."],
  ["Weapons", "Weapons are evaluated separately using DPS, damage range, speed, hand eligibility, and weapon type. Weapon-skill context is represented, but unsupported skill/racial scenarios lower confidence rather than pretending to be simulated."],
  ["Sets and effects", "Set bonuses are recalculated after replacement. Only curated special effects contribute an estimated value. Unknown procs and on-use effects are marked Limited confidence."],
  ["Best in Slot vs realistic", "Best in Slot is the theoretical preferred candidate under the configured profile. Best realistic favours attainable progression and avoids presenting a late raid or legendary item as the only useful next step."],
  ["Acquisition recommendations", "Activities are scored transparently from major, meaningful, minor, and BiS opportunities, accessibility, and distinct affected slots. This is a prioritisation heuristic, not a drop-time or farming-efficiency model."],
  ["Limitations", "The current implementation supports Classic Era Fury Warrior only. It is not a full DPS simulator, does not model every item or effect, excludes world buffs, and does not provide live Anniversary analysis."],
] as const;

export default async function MethodologyPage({ params }: { params: Promise<{ version: string }> }) {
  const resolvedParams = await params;
  if (!isContentVersion(resolvedParams.version)) notFound();
  const version = resolvedParams.version as ContentVersion;
  return <VersionShell version={version}><main className="mx-auto min-h-[calc(100vh-148px)] max-w-[1000px] px-5 py-16 lg:px-8"><Link href={`/${version}/gear`} className="text-xs text-[var(--muted)] hover:text-[var(--primary-light)]">Ã¢â€ Â Back to gear</Link><div className="mt-10"><div className="eyebrow mb-4">How PrePull evaluates gear</div><h1 className="display text-5xl tracking-[-.04em]">Transparent gear intelligence.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">PrePullÃ¢â‚¬â„¢s first analysis profile is a curated Classic Era Fury Warrior heuristic. It is designed to explain useful choices without claiming exact simulated DPS.</p><div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">The development calibration framework records comparative simulation/reference cases. External reference results have not yet been entered for this build, so PrePull is not presented as simulation-calibrated. Very close item comparisons may depend on race, weapon skill, encounter, and buff assumptions.</div></div><div className="mt-12 space-y-4">{sections.map(([title, body]) => <section key={title} className="panel rounded-xl p-5"><h2 className="display text-2xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p></section>)}</div></main></VersionShell>;
}
