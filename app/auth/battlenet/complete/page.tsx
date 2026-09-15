import { BattleNetComplete } from "../../../../components/battle-net-complete";
import { sanitizeAuthCallback } from "../../../../lib/auth-callback";

export default async function CompletePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = sanitizeAuthCallback((await searchParams).callbackUrl, "/era/battle-net/import");
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-24"><section className="panel rounded-2xl p-8"><h1 className="display text-3xl">Battle.net connected</h1><div className="mt-4 text-sm text-[var(--muted)]"><BattleNetComplete callbackUrl={callbackUrl} /></div></section></main>;
}
