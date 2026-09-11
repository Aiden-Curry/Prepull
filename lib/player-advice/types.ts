import type { ContentVersion, EquipmentSlot, NormalizedCharacter } from "../types.ts";
import type { CuratedEvaluation } from "../curated-gear/types.ts";
import type { SupportedSpecKey } from "../recommendations/registry.ts";

export type PlayerActionType = "dungeon" | "raid" | "quest" | "crafting" | "vendor" | "pvp" | "other";
export type PlayerActionPriority = "high" | "medium" | "low";
export type PlayerTarget = { itemId: number; itemName: string; slot: EquipmentSlot; tier: string; sourceLabel: string; sourceType?: string; realistic: boolean; aspirational: boolean; conditionalNote?: string; currentItemName?: string; phase?: number; raidOrigin?: boolean };
export type PlayerAction = { id: string; type: PlayerActionType; title: string; reason: string; priority: PlayerActionPriority; upgradeCount: number; targets: PlayerTarget[]; view: "realistic" | "raid"; activity: string };
export type PlayerAdvice = {
  supported: boolean;
  specKey?: SupportedSpecKey;
  className?: string;
  specName?: string;
  availablePhases?: number[];
  characterId: string;
  contentVersion: ContentVersion;
  phase: number | null;
  summary: { evaluatedSlots: number; actionableUpgradeCount: number; highPriorityCount: number };
  topActions: PlayerAction[];
  secondaryActions: PlayerAction[];
  secondaryTargets: PlayerTarget[];
  limitations: string[];
};

export type PlayerAdviceInput = { character: NormalizedCharacter; phase?: number };
export type PlayerAdviceEvaluation = { advice: PlayerAdvice; evaluation?: CuratedEvaluation };
