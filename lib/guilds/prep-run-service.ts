import { GuildDomainError } from "./errors.ts";
import { canManageRaid } from "./permissions.ts";
import { prepRunRepository, type PrepRunRepository } from "./prep-run-repository.ts";
import type { PrepRunDetail, PrepRunSignupStatus, PrepRunStatus } from "./prep-run-types.ts";
import { getRaidPrepBoard, getRaidPrepBoardForMember } from "./readiness-service.ts";
import type { GuildMembership } from "./types.ts";

type BoardLoader = typeof getRaidPrepBoard;

const membershipFrom = (row: Record<string, any>, userId: string): GuildMembership => ({
  id: row.id, guildId: row.guild_id, userId, role: row.role, capabilities: row.capabilities ?? [],
  revokedCapabilities: row.revoked_capabilities ?? [], active: Boolean(row.active),
  createdAt: row.created_at?.toISOString?.() ?? String(row.created_at), updatedAt: row.updated_at?.toISOString?.() ?? String(row.updated_at),
});

export function normalizePrepRunNote(value: string) {
  const note = value.trim();
  if (note.length > 280) throw new GuildDomainError("CONFLICT", "Prep Run notes must be 280 characters or fewer.");
  return note;
}

export function normalizePrepRunSchedule(value?: string) {
  if (!value?.trim()) return undefined;
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value.trim()) ? `${value.trim()}:00Z` : value.trim();
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new GuildDomainError("CONFLICT", "Prep Run schedule is invalid.");
  return date.toISOString();
}

export class PrepRunService {
  private readonly repository: PrepRunRepository;
  private readonly managerBoard: BoardLoader;
  private readonly memberBoard: BoardLoader;

  constructor(
    repository: PrepRunRepository = prepRunRepository,
    managerBoard: BoardLoader = getRaidPrepBoard,
    memberBoard: BoardLoader = getRaidPrepBoardForMember,
  ) { this.repository = repository; this.managerBoard = managerBoard; this.memberBoard = memberBoard; }

  async create(userId: string, guildId: string, raidId: string, activityKey: string, scheduledFor?: string, note = "") {
    const { membership } = await this.requireManager(userId, guildId, raidId);
    const board = await this.managerBoard(userId, guildId, raidId);
    const activity = board.activityGroups.find((candidate) => candidate.key === activityKey);
    if (!activity) throw new GuildDomainError("NOT_FOUND", "That current Prep Board activity was not found.");
    const existing = await this.repository.findOpen(guildId, raidId, activity.key);
    if (existing) return existing;
    try {
      return await this.repository.create(userId, {
        guildId, raidId, activityKey: activity.key, activityLabel: activity.label, activityCategory: activity.category,
        scheduledFor: normalizePrepRunSchedule(scheduledFor), note: normalizePrepRunNote(note), creatorMembershipId: membership.id,
      });
    } catch (error) {
      if (error instanceof GuildDomainError && error.code === "DUPLICATE") {
        const concurrent = await this.repository.findOpen(guildId, raidId, activity.key);
        if (concurrent) return concurrent;
      }
      throw error;
    }
  }

  async list(userId: string, guildId: string) {
    await this.requireMembership(userId, guildId);
    return this.repository.list(guildId);
  }

  async detail(userId: string, guildId: string, runId: string): Promise<PrepRunDetail> {
    const membership = await this.requireMembership(userId, guildId);
    const run = await this.repository.get(guildId, runId);
    if (!run) throw new GuildDomainError("NOT_FOUND", "Prep Run was not found.");
    const canManage = canManageRaid(membershipFrom(membership, userId), run.raidLeaderUserId, userId);
    const [board, participants, claimedIds, activeMemberCount] = await Promise.all([
      this.memberBoard(userId, guildId, run.raidId), this.repository.participants(guildId, runId),
      this.repository.claimedCharacterIds(userId, guildId), this.repository.activeMemberCount(guildId),
    ]);
    const activity = board.activityGroups.find((candidate) => candidate.key === run.activityKey);
    const relevantIds = new Set(activity?.players.map((player) => player.guildCharacterId) ?? []);
    const myCharacterMayBenefit = claimedIds.some((id) => relevantIds.has(id));
    const own = participants.find((participant) => participant.membership_id === membership.id);
    return {
      ...run, canManage, mySignup: own?.status, myCharacterMayBenefit,
      participants: participants.map((participant) => ({ membershipId: participant.membership_id, displayName: participant.display_name, status: participant.status })),
      ...(canManage ? {
        notRespondedCount: Math.max(0, activeMemberCount - participants.length),
        mayBenefitCount: activity?.playerCount ?? 0,
        mayBenefitCharacters: activity?.players.map((player) => player.characterName) ?? [],
      } : {}),
    };
  }

  async update(userId: string, guildId: string, runId: string, scheduledFor?: string, note = "") {
    const run = await this.requireRunManager(userId, guildId, runId);
    await this.repository.update(userId, guildId, run.id, normalizePrepRunSchedule(scheduledFor), normalizePrepRunNote(note));
  }

  async setStatus(userId: string, guildId: string, runId: string, status: Exclude<PrepRunStatus, "open">) {
    if (status !== "cancelled" && status !== "completed") throw new GuildDomainError("CONFLICT", "Prep Run status is invalid.");
    const run = await this.requireRunManager(userId, guildId, runId);
    await this.repository.setStatus(userId, guildId, run.id, status);
  }

  async setMySignup(userId: string, guildId: string, runId: string, status: PrepRunSignupStatus | "leave") {
    const membership = await this.requireMembership(userId, guildId);
    const run = await this.repository.get(guildId, runId);
    if (!run) throw new GuildDomainError("NOT_FOUND", "Prep Run was not found.");
    if (run.status !== "open") throw new GuildDomainError("CONFLICT", "This Prep Run is closed to signup changes.");
    if (status === "leave") return this.repository.removeSignup(guildId, runId, membership.id);
    if (status !== "going" && status !== "maybe") throw new GuildDomainError("CONFLICT", "Prep Run signup status is invalid.");
    return this.repository.setSignup(guildId, runId, membership.id, status);
  }

  private async requireMembership(userId: string, guildId: string) {
    const membership = await this.repository.getMembership(userId, guildId);
    if (!membership) throw new GuildDomainError("NOT_FOUND", "Prep Run was not found.");
    return membership;
  }

  private async requireManager(userId: string, guildId: string, raidId: string) {
    const [membership, raid] = await Promise.all([this.requireMembership(userId, guildId), this.repository.getRaid(guildId, raidId)]);
    if (!raid || !canManageRaid(membershipFrom(membership, userId), raid.raid_leader_user_id, userId)) throw new GuildDomainError("NOT_FOUND", "Prep Run was not found.");
    return { membership, raid };
  }

  private async requireRunManager(userId: string, guildId: string, runId: string) {
    const membership = await this.requireMembership(userId, guildId);
    const run = await this.repository.get(guildId, runId);
    if (!run || !canManageRaid(membershipFrom(membership, userId), run.raidLeaderUserId, userId)) throw new GuildDomainError("NOT_FOUND", "Prep Run was not found.");
    return run;
  }
}

export const prepRunService = new PrepRunService();
