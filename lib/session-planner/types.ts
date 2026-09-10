import type { PlayerAction, PlayerActionType, PlayerAdvice, PlayerTarget } from "../player-advice/types.ts";

export type SessionDuration = "30m" | "60m" | "90m" | "120m";
export type SessionPreference = "best-progress" | "dungeons" | "solo-prep" | "raid-prep";
export type SessionSuitability = "good-fit" | "possible" | "longer-session" | "preparation";
export type SessionPlanStep = { actionId?: string; title: string; type: PlayerActionType; reason: string; targets: PlayerTarget[]; suitability: SessionSuitability };
export type SessionPlan = { characterId: string; requestedDuration: SessionDuration; preference: SessionPreference; primaryAction?: SessionPlanStep; secondaryActions: SessionPlanStep[]; longerTermTargets: SessionPlanStep[]; limitations: string[] };
export type SessionPlannerInput = { advice?: PlayerAdvice; synced: boolean; duration: SessionDuration; preference: SessionPreference };
