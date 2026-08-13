import { randomUUID } from "node:crypto";
import type { CreateGuildInput, CreateRaidInput, Guild, GuildMember, GuildWorkspace, RaidAssignment, RaidEvent, RaidGroup, RaidSignup, SignupStatus } from "./types.ts";

export type GuildRepository = {
  listForUser(userId: string): Guild[];
  getWorkspace(userId: string, guildId: string): GuildWorkspace;
  createGuild(userId: string, input: CreateGuildInput): Guild;
  importGuild(userId: string, payload: unknown): Guild;
  addMember(userId: string, guildId: string, member: Omit<GuildMember, "id" | "joinedAt">): GuildMember;
  createRaid(userId: string, guildId: string, input: CreateRaidInput): RaidEvent;
  setSignup(userId: string, guildId: string, eventId: string, characterId: string, status: SignupStatus, note?: string): RaidSignup;
  selectRoster(userId: string, guildId: string, eventId: string, characterIds: string[]): RaidEvent;
  saveGroup(userId: string, guildId: string, eventId: string, group: RaidGroup): RaidGroup;
  saveAssignment(userId: string, guildId: string, eventId: string, assignment: RaidAssignment): RaidAssignment;
};

type State = { guilds: Guild[]; members: GuildMember[]; events: RaidEvent[] };
const states = new Map<string, State>();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${randomUUID()}`;
const stateFor = (userId: string) => states.get(userId) ?? (() => { const state: State = { guilds: [], members: [], events: [] }; states.set(userId, state); return state; })();
const ownedGuild = (state: State, userId: string, guildId: string) => { const guild = state.guilds.find((entry) => entry.id === guildId); if (!guild || guild.ownerUserId !== userId) throw new Error("You are not authorized to manage this guild."); return guild; };
const eventFor = (state: State, userId: string, guildId: string, eventId: string) => { ownedGuild(state, userId, guildId); const event = state.events.find((entry) => entry.id === eventId && entry.guildId === guildId); if (!event) throw new Error("Raid event was not found."); return event; };

export class MemoryGuildRepository implements GuildRepository {
  listForUser(userId: string) { return [...stateFor(userId).guilds]; }
  getWorkspace(userId: string, guildId: string) { const state = stateFor(userId); const guild = ownedGuild(state, userId, guildId); return { guild, roster: state.members.filter((member) => guild.memberIds.includes(member.id)), events: state.events.filter((event) => guild.raidEventIds.includes(event.id)) }; }
  createGuild(userId: string, input: CreateGuildInput) { const state = stateFor(userId); const timestamp = now(); const guild: Guild = { ...input, id: id("guild"), ownerUserId: userId, importProvider: "manual", createdAt: timestamp, updatedAt: timestamp, memberIds: [], raidEventIds: [] }; state.guilds.push(guild); return guild; }
  importGuild(userId: string, payload: unknown) { const raw = payload as Partial<Guild> & { roster?: Omit<GuildMember, "id" | "joinedAt">[] }; if (!raw || typeof raw.name !== "string" || !raw.realmName || !raw.realmSlug) throw new Error("Guild import requires name, realm name, and realm slug."); const guild = this.createGuild(userId, { name: raw.name, region: raw.region ?? "eu", realmSlug: raw.realmSlug, realmName: raw.realmName, characterRealmType: raw.characterRealmType ?? "era", contentVersion: raw.contentVersion ?? "era", faction: raw.faction ?? "Alliance", description: raw.description ?? "", }); guild.importProvider = "json"; const state = stateFor(userId); for (const member of raw.roster ?? []) this.addMember(userId, guild.id, member); return guild; }
  addMember(userId: string, guildId: string, input: Omit<GuildMember, "id" | "joinedAt">) { const state = stateFor(userId); const guild = ownedGuild(state, userId, guildId); const member: GuildMember = { ...input, id: id("member"), joinedAt: now() }; state.members.push(member); guild.memberIds.push(member.id); guild.updatedAt = now(); return member; }
  createRaid(userId: string, guildId: string, input: CreateRaidInput) { const state = stateFor(userId); const guild = ownedGuild(state, userId, guildId); const timestamp = now(); const event: RaidEvent = { ...input, id: id("raid"), guildId, durationMinutes: Number(input.durationMinutes), status: "open", signups: [], selectedCharacterIds: [], groups: [], assignments: [], createdAt: timestamp, updatedAt: timestamp }; state.events.push(event); guild.raidEventIds.push(event.id); guild.updatedAt = timestamp; return event; }
  setSignup(userId: string, guildId: string, eventId: string, characterId: string, status: SignupStatus, note?: string) { const state = stateFor(userId); const event = eventFor(state, userId, guildId, eventId); if (!state.members.some((member) => member.id === characterId && state.guilds.find((guild) => guild.id === guildId)?.memberIds.includes(member.id))) throw new Error("Character is not in this guild roster."); const signup: RaidSignup = { characterId, status, note, updatedAt: now() }; event.signups = [...event.signups.filter((entry) => entry.characterId !== characterId), signup]; event.updatedAt = now(); return signup; }
  selectRoster(userId: string, guildId: string, eventId: string, characterIds: string[]) { const state = stateFor(userId); const event = eventFor(state, userId, guildId, eventId); const allowed = new Set(ownedGuild(state, userId, guildId).memberIds); event.selectedCharacterIds = [...new Set(characterIds)].filter((characterId) => allowed.has(characterId)); event.updatedAt = now(); return event; }
  saveGroup(userId: string, guildId: string, eventId: string, group: RaidGroup) { const state = stateFor(userId); const event = eventFor(state, userId, guildId, eventId); const saved = { ...group, id: group.id || id("group"), memberCharacterIds: [...new Set(group.memberCharacterIds)] }; event.groups = [...event.groups.filter((entry) => entry.id !== saved.id), saved]; event.updatedAt = now(); return saved; }
  saveAssignment(userId: string, guildId: string, eventId: string, assignment: RaidAssignment) { const state = stateFor(userId); const event = eventFor(state, userId, guildId, eventId); if (!event.selectedCharacterIds.includes(assignment.characterId)) throw new Error("Assignments require a selected raid-roster character."); const saved = { ...assignment, id: assignment.id || id("assignment") }; event.assignments = [...event.assignments.filter((entry) => entry.id !== saved.id), saved]; event.updatedAt = now(); return saved; }
}

export const guildRepository: GuildRepository = new MemoryGuildRepository();
