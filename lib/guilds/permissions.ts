import type { GuildCapability, GuildMembership, GuildRole } from "./types.ts";

const defaults: Record<GuildRole, GuildCapability[]> = {
  owner: ["manage-settings", "manage-permissions", "import-roster", "manage-roster", "manage-notes", "create-raid", "manage-raid", "manage-assignments", "manage-signup-overrides"],
  officer: ["manage-roster", "create-raid", "manage-raid", "manage-assignments", "manage-signup-overrides"],
  "raid-leader": ["manage-raid", "manage-assignments"],
  member: [],
};
export function hasCapability(membership: GuildMembership, capability: GuildCapability) { return membership.active && (defaults[membership.role].includes(capability) || membership.capabilities.includes(capability)); }
export function defaultCapabilities(role: GuildRole) { return [...defaults[role]]; }
export function canManageRaid(membership: GuildMembership, raidLeaderUserId: string | undefined, userId: string) { return hasCapability(membership, "manage-raid") && (membership.role !== "raid-leader" || raidLeaderUserId === userId); }
