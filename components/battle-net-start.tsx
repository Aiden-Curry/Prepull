"use client";

import { useState } from "react";

export function BattleNetStart({ callbackUrl, intent = "login", compact = false }: { callbackUrl: string; intent?: "login" | "link"; compact?: boolean }) {
  const [region, setRegion] = useState<"eu" | "us">("eu");
  return <form action="/api/auth/battlenet/start" method="post" className={compact ? "space-y-3" : "mt-6 space-y-4"}>
    <input type="hidden" name="intent" value={intent} />
    <input type="hidden" name="callbackUrl" value={callbackUrl} />
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-[var(--muted)]">Where do you play?</legend>
      <div className="grid grid-cols-2 gap-2">
        {([['eu', 'Europe'], ['us', 'Americas']] as const).map(([value, label]) => <label key={value} className={`focus-within:ring-2 focus-within:ring-[var(--accent)] rounded-lg border px-3 py-2 text-center text-sm ${region === value ? "border-[var(--accent)] bg-[var(--surface-muted)]" : "border-[var(--line)]"}`}><input className="sr-only" type="radio" name="region" value={value} checked={region === value} onChange={() => setRegion(value)} />{label}</label>)}
      </div>
    </fieldset>
    <button className="button-primary focus-ring w-full" type="submit">{intent === "link" ? "Connect Battle.net" : "Continue with Battle.net"}</button>
  </form>;
}
