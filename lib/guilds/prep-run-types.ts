import type { RaidPrepActivityCategory } from "./prep-board-types.ts";

export type PrepRunStatus = "open" | "cancelled" | "completed";
export type PrepRunSignupStatus = "going" | "maybe";

export type PrepRunRecord = {
  id: string;
  guildId: string;
  raidId: string;
  raidName: string;
  raidInstance: string;
  guildTimeZone: string;
  activityKey: string;
  activityLabel: string;
  activityCategory: RaidPrepActivityCategory;
  scheduledFor?: string;
  note: string;
  status: PrepRunStatus;
  organizerName: string;
  goingCount: number;
  maybeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PrepRunParticipant = {
  membershipId: string;
  displayName: string;
  status: PrepRunSignupStatus;
};

export type PrepRunDetail = PrepRunRecord & {
  guildName: string;
  canManage: boolean;
  mySignup?: PrepRunSignupStatus;
  myCharacterMayBenefit: boolean;
  participants: PrepRunParticipant[];
  notRespondedCount?: number;
  mayBenefitCount?: number;
  mayBenefitCharacters?: string[];
};

export type CreatePrepRunInput = {
  guildId: string;
  raidId: string;
  activityKey: string;
  activityLabel: string;
  activityCategory: RaidPrepActivityCategory;
  scheduledFor?: string;
  note: string;
  creatorMembershipId: string;
};
