import type { EffectiveSignupStatus, MemberSignupStatus } from "./types.ts";
export const VALID_MEMBER_SIGNUP_STATUSES: readonly MemberSignupStatus[] = ["accepted", "tentative", "unavailable", "late"];
export function effectiveSignupStatus(member: MemberSignupStatus, override?: EffectiveSignupStatus | null): EffectiveSignupStatus { return override ?? member; }
export function groupHasCapacity(memberIds: string[], incoming?: string) { return memberIds.length + (incoming && !memberIds.includes(incoming) ? 1 : 0) <= 5; }
export function rosterCounts(selected: string[], benched: string[]) { return { selected: new Set(selected).size, benched: new Set(benched).size }; }
export function staleRosterMessage() { return "Roster changes were made by another raid leader. Reload and review before saving."; }
export function staleAssignmentMessage() { return "Assignments were changed by another raid leader. Reload the latest assignments before applying changes."; }
export function reorder<T>(items: T[], from: number, to: number) { const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; }
