import Link from "next/link";
import { VersionShell } from "../../../../../../components/version-shell";
import { RosterImportForm } from "../../../../../../components/roster-import-form";
import { applyCsvImportAction, previewCsvImportAction } from "../../../../../../lib/guilds/actions";
import { requireUser } from "../../../../../../lib/guilds/auth";
import { query } from "../../../../../../lib/guilds/db";
import { hasCapability } from "../../../../../../lib/guilds/permissions";
import type { ContentVersion } from "../../../../../../lib/types";
import type { GuildMembership } from "../../../../../../lib/guilds/types";
export default async function ImportRosterPage({ params }: { params: Promise<{ version: string; guildId: string }> }) {
  const resolvedParams = await params;
  const user = await requireUser();
  const row = (await query("SELECT * FROM guild_workspace_memberships WHERE guild_id=$1 AND user_id=$2 AND active=true", [resolvedParams.guildId, user.id])).rows[0];
  const membership: GuildMembership | null = row ? { id: row.id, guildId: resolvedParams.guildId, userId: user.id, role: row.role, capabilities: row.capabilities ?? [], revokedCapabilities: row.revoked_capabilities ?? [], active: true, createdAt: row.created_at, updatedAt: row.updated_at } : null;
  const canManage = Boolean(membership && hasCapability(membership, "manage-roster"));
  return <VersionShell version={resolvedParams.version as ContentVersion}><main className="mx-auto max-w-4xl px-5 py-16"><Link href={`/${resolvedParams.version}/guilds/${resolvedParams.guildId}`} className="text-xs text-[var(--muted)]">← Guild workspace</Link><div className="panel mt-8 rounded-2xl p-6"><p className="eyebrow">Roster import / CSV</p><h1 className="display mt-2 text-4xl">Preview and apply roster</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Automatic Classic guild import is not currently supported. Use CSV import. Preview is non-mutating, decisions are revalidated server-side, and apply is atomic.</p>{canManage ? <RosterImportForm previewAction={previewCsvImportAction} applyAction={applyCsvImportAction} guildId={resolvedParams.guildId} initialCsv={'name,region,realm,class,level,faction,guildRank,mainName,preferredRole,notes\n'} /> : <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Roster import is available to guild officers and owners.</p>}<div className="mt-6 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">Absent members are marked inactive by default. Raw CSV is not written to audit events.</div></div></main></VersionShell>;
}
