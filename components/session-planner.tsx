import Link from "next/link";
import type { ContentVersion } from "../lib/types";
import type { PlayerAdvice } from "../lib/player-advice/types";
import { buildSessionPlan, isSessionDuration, isSessionPreference, sessionPlanText } from "../lib/session-planner/service";
import type { SessionDuration, SessionPlanStep, SessionPreference } from "../lib/session-planner/types";
import { SharePlanButton } from "./share-plan-button";

const durations: [SessionDuration, string][] = [["30m", "30 minutes"], ["60m", "1 hour"], ["90m", "90 minutes"], ["120m", "2+ hours"]];
const preferences: [SessionPreference, string][] = [["best-progress", "Best progress"], ["dungeons", "Dungeons"], ["solo-prep", "Solo / preparation"], ["raid-prep", "Raid preparation"]];

export function SessionPlanner({ version, characterName, advice, synced, duration, preference }: { version: ContentVersion; characterName: string; advice?: PlayerAdvice; synced: boolean; duration?: string; preference?: string }) {
  const selectedDuration = isSessionDuration(duration) ? duration : undefined;
  const selectedPreference = isSessionPreference(preference) ? preference : undefined;
  const plan = selectedDuration && selectedPreference ? buildSessionPlan({ advice, synced, duration: selectedDuration, preference: selectedPreference }) : undefined;
  return <section className="panel mt-8 rounded-2xl p-6" aria-labelledby="session-planner-heading">
    <div className="eyebrow">Session planner</div><h2 id="session-planner-heading" className="display mt-2 text-3xl">Plan my session</h2>
    {!synced ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Refresh your character before building a personalized session plan.</p> : !advice?.supported ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Session planning based on gear upgrades isn&apos;t available for this specialization yet.</p> : <>
      <form method="get" action={`/${version}/dashboard`} className="mt-5 space-y-5">
        <fieldset><legend className="text-sm font-semibold">How much time do you have?</legend><div className="mt-3 flex flex-wrap gap-2">{durations.map(([value, label]) => <label key={value} className="cursor-pointer"><input className="sr-only peer" type="radio" name="duration" value={value} defaultChecked={selectedDuration === value} required /><span className="button-secondary block peer-checked:border-[var(--primary)] peer-checked:text-[var(--primary-light)]">{label}</span></label>)}</div></fieldset>
        <fieldset><legend className="text-sm font-semibold">What do you want to focus on?</legend><div className="mt-3 flex flex-wrap gap-2">{preferences.map(([value, label]) => <label key={value} className="cursor-pointer"><input className="sr-only peer" type="radio" name="preference" value={value} defaultChecked={selectedPreference === value} required /><span className="button-secondary block peer-checked:border-[var(--primary)] peer-checked:text-[var(--primary-light)]">{label}</span></label>)}</div></fieldset>
        <button className="button-primary" type="submit">Build my plan</button>
      </form>{plan && <PlanResult version={version} characterName={characterName} plan={plan} />}
    </>}
  </section>;
}

function PlanResult({ version, characterName, plan }: { version: ContentVersion; characterName: string; plan: ReturnType<typeof buildSessionPlan> }) {
  const text = sessionPlanText(characterName, plan);
  return <div className="mt-8 border-t border-[var(--line)] pt-6"><div className="eyebrow">Tonight&apos;s plan</div>{plan.primaryAction ? <>
    <h3 className="display mt-2 text-2xl">Main goal</h3><PlanStep version={version} step={plan.primaryAction} />
    {plan.secondaryActions.length > 0 && <><h3 className="display mt-6 text-2xl">Then</h3><div className="mt-3 space-y-3">{plan.secondaryActions.map((step) => <PlanStep key={step.actionId ?? step.title} version={version} step={step} />)}</div></>}
    {plan.longerTermTargets.length > 0 && <><h3 className="display mt-6 text-2xl">Longer term</h3><div className="mt-3 space-y-3">{plan.longerTermTargets.map((step) => <PlanStep key={step.title} version={version} step={step} />)}</div></>}
    <div className="mt-5"><SharePlanButton text={text} /></div>
  </> : <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{plan.limitations[0]}</p>}</div>;
}

function PlanStep({ version, step }: { version: ContentVersion; step: SessionPlanStep }) {
  return <article className="rounded-xl border border-[var(--line)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">{step.title}</h4><p className="mt-1 text-xs text-[var(--muted)]">{step.reason}</p></div><span className="rounded-full border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">{step.suitability}</span></div>{step.targets.length > 0 && <p className="mt-3 text-xs text-[var(--muted)]">Priority targets: {step.targets.map((target) => target.itemName).join(", ")}</p>}{step.actionId && <Link className="mt-3 inline-flex text-xs text-[var(--primary-light)]" href={`/${version}/dashboard/actions/${step.actionId}`}>View activity details &rarr;</Link>}</article>;
}
