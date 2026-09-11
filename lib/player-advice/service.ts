import { evaluateCuratedReference } from "../curated-gear/evaluate.ts";
import type { CuratedActivity, CuratedRecommendation } from "../curated-gear/types.ts";
import type { CharacterSource, NormalizedCharacter } from "../types.ts";
import { getCharacterRecommendationSupport, loadRecommendationProfile } from "../recommendations/registry.ts";
import type { PlayerAction, PlayerActionPriority, PlayerActionType, PlayerAdvice, PlayerAdviceEvaluation, PlayerTarget } from "./types.ts";

const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "activity";
export const playerActionId = (view: PlayerAction["view"], activity: string) => `${view}-${slug(activity)}`;
const sourceLabel = (source?: CharacterSource) => source?.instance ?? source?.zone ?? source?.quest ?? source?.profession ?? source?.reputation ?? source?.npc ?? source?.type ?? "Unspecified source";
const actionType = (activity: string, source?: CharacterSource, raid = false): PlayerActionType => { if (raid || source?.type === "Raid") return "raid"; if (source?.type === "Dungeon") return "dungeon"; if (source?.type === "Quest") return "quest"; if (source?.type === "Profession" || source?.type === "Vendor" || source?.profession) return source?.type === "Vendor" ? "vendor" : "crafting"; if (source?.type === "PvP" || source?.reputation) return "pvp"; if (/craft|auction/i.test(activity)) return "crafting"; return "other"; };
const priorityFor = (activity: CuratedActivity): PlayerActionPriority => activity.score >= 4 || activity.upgrades.some((entry) => entry.priority === "major-opportunity") ? "high" : activity.score >= 2 ? "medium" : "low";
const targetFrom = (recommendation: CuratedRecommendation, aspirational: boolean, includeSingleBestInSlotTargets = false): PlayerTarget | undefined => {
  const item = aspirational ? recommendation.target : (recommendation.bestRealistic ?? recommendation.target);
  if (!item) return undefined;
  if (!includeSingleBestInSlotTargets && !aspirational && recommendation.target?.itemId === item.itemId && recommendation.target.reference.tier === "bis" && recommendation.bestRealistic?.itemId === item.itemId) return undefined;
  return { itemId: item.itemId, itemName: item.name, slot: recommendation.slot, tier: item.reference.tier, sourceLabel: sourceLabel(item.source), sourceType: item.source?.type, realistic: !aspirational, aspirational, conditionalNote: recommendation.conditionalNotes.join(" ") || undefined, currentItemName: recommendation.currentItem?.name, phase: item.reference.phase, raidOrigin: Boolean(item.reference.raidOrigin || item.reference.requiresRaidContent || item.source?.type === "Raid") };
};
const targetsFor = (activity: CuratedActivity, includeSingleBestInSlotTargets: boolean): PlayerTarget[] => activity.upgrades.flatMap((recommendation) => { const realistic = targetFrom(recommendation, false, includeSingleBestInSlotTargets); const aspirational = recommendation.target && recommendation.bestRealistic && recommendation.target.itemId !== recommendation.bestRealistic.itemId ? targetFrom(recommendation, true, includeSingleBestInSlotTargets) : undefined; return [realistic, aspirational].filter((target): target is PlayerTarget => Boolean(target)); }).filter((target, index, all) => all.findIndex((candidate) => candidate.itemId === target.itemId && candidate.slot === target.slot) === index);
const explain = (activity: CuratedActivity, priority: PlayerActionPriority, targets: PlayerTarget[]) => { const high = activity.upgrades.filter((entry) => entry.priority === "major-opportunity").length; const realistic = targets.filter((target) => target.realistic).length; if (priority === "high") return `Best overall target right now: ${realistic} realistic upgrade${realistic === 1 ? "" : "s"}${high ? `, including ${high} high-priority opportunity${high === 1 ? "" : "ies"}` : ""}.`; if (priority === "medium") return `Worth doing if you also need ${targets[0]?.slot?.toLowerCase() ?? "another upgrade"}.`; return "A useful option, but not your most efficient next step."; };
const actionFrom = (activity: CuratedActivity, view: PlayerAction["view"], includeSingleBestInSlotTargets: boolean): PlayerAction => { const targets = targetsFor(activity, includeSingleBestInSlotTargets); const primary = targets.find((target) => target.realistic) ?? targets[0]; const priority = priorityFor(activity); return { id: playerActionId(view, activity.activity), type: actionType(activity.activity, primary ? { type: (primary.sourceType ?? (primary.raidOrigin ? "Raid" : "Dungeon")) as CharacterSource["type"], instance: primary.sourceLabel } : undefined, view === "raid"), title: activity.activity, reason: explain(activity, priority, targets), priority, upgradeCount: targets.filter((target) => target.realistic).length, targets, view, activity: activity.activity }; };

export function buildPlayerAdvice(character: NormalizedCharacter, phase?: number): PlayerAdviceEvaluation {
  const base: PlayerAdvice = { supported: false, characterId: character.id, contentVersion: character.contentVersion, className: character.class, specName: character.spec, phase: null, summary: { evaluatedSlots: 0, actionableUpgradeCount: 0, highPriorityCount: 0 }, topActions: [], secondaryActions: [], secondaryTargets: [], limitations: [] };
  const support = getCharacterRecommendationSupport(character);
  if (!support.supported) { base.limitations.push(support.reason === "content-version-not-supported" ? "Personal gear recommendations for this content version are coming later." : "Personal gear recommendations for this specialization are coming later."); return { advice: base }; }
  const profile = loadRecommendationProfile(support.config);
  const requestedPhase = phase ?? 6;
  const setId = phase === undefined ? profile.defaultSetId : support.config.setIdByPhase[phase] ?? profile.defaultSetId;
  const evaluation = evaluateCuratedReference(character, profile, setId, phase === undefined ? undefined : requestedPhase as 1 | 2 | 3 | 4 | 5 | 6, support.config.candidates);
  const includeSingleBestInSlotTargets = support.config.includeSingleBestInSlotTargets ?? false;
  const realistic = evaluation.realisticActivities.map((activity) => actionFrom(activity, "realistic", includeSingleBestInSlotTargets));
  const raids = evaluation.raidActivities.map((activity) => actionFrom(activity, "raid", includeSingleBestInSlotTargets));
  const allRecommendations = evaluation.recommendations.filter((entry) => ["major-opportunity", "meaningful-upgrade", "upgrade"].includes(entry.priority));
  const aspirational = evaluation.recommendations.flatMap((entry) => { const target = targetFrom(entry, true, includeSingleBestInSlotTargets); return target && (!entry.bestRealistic || target.itemId !== entry.bestRealistic.itemId) ? [target] : []; }).filter((target, index, all) => all.findIndex((candidate) => candidate.itemId === target.itemId && candidate.slot === target.slot) === index).slice(0, 3);
  const topActions = realistic.slice(0, 3); const secondaryActions = [...realistic.slice(3), ...raids].slice(0, 3);
  base.supported = true; base.specKey = support.specKey; base.availablePhases = [...support.phases]; base.phase = phase ?? (evaluation.characterProgressionPhase || null); base.summary = { evaluatedSlots: evaluation.recommendations.length, actionableUpgradeCount: allRecommendations.length, highPriorityCount: allRecommendations.filter((entry) => entry.priority === "major-opportunity").length }; base.topActions = topActions; base.secondaryActions = secondaryActions; base.secondaryTargets = aspirational;
  if (!topActions.length && !secondaryActions.length) base.limitations.push(base.summary.actionableUpgradeCount ? "Your remaining upgrades are mostly raid, crafted, or conditional targets." : "You are already close to the current reference set. Remaining upgrades are mostly specific or aspirational targets.");
  if (evaluation.incompleteData) base.limitations.push("This is a curated reference preview, not a simulation or exact DPS calculation.");
  return { advice: base, evaluation };
}

export function findPlayerAction(advice: PlayerAdvice, actionId: string) { return [...advice.topActions, ...advice.secondaryActions].find((action) => action.id === actionId); }
