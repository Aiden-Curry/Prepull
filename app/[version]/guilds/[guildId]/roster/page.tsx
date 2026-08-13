import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionShell } from "../../../../../components/version-shell";
import { MainAltRoster } from "../../../../../components/main-alt-roster";
import { requireUser } from "../../../../../lib/guilds/auth";
import { getGuildRepository } from "../../../../../lib/guilds/factory";
import { getMainAltRoster } from "../../../../../lib/guilds/main-alt-service";
import type { ContentVersion } from "../../../../../lib/types";
export default async function RosterPage({ params }: { params:{version:string;guildId:string} }) { const user=await requireUser(); let workspace;try{workspace=await getGuildRepository().getWorkspace(user.id,params.guildId);}catch{notFound();}const data=await getMainAltRoster(params.guildId);return <VersionShell version={params.version as ContentVersion}><main className="mx-auto max-w-6xl px-5 py-12"><Link href={`/${params.version}/guilds/${params.guildId}`} className="text-xs text-[var(--muted)]">← Guild workspace</Link><h1 className="display mt-8 text-4xl">Guild roster</h1><p className="mt-2 text-sm text-[var(--muted)]">Search and organize mains, alternates, unassigned characters, and inactive history.</p><MainAltRoster guildId={workspace.guild.id} data={data} canManage={true}/></main></VersionShell>; }
