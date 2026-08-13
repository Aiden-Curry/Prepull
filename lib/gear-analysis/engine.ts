import type { EquipmentSlot, EquippedItem, NormalizedCharacter, UpgradeRecommendation, WeaponSkillContext } from "../types.ts";
import { eraFuryCandidates } from "./dataset.ts";
import { eraFuryWarriorProfile } from "./profiles.ts";
import type { AnalysisAssumptions, CombatSnapshot, CuratedCandidate, GearAnalysisInput, GearAnalysisResult, Loadout, SpecScoringProfile } from "./types.ts";

const numberFrom = (value: string | undefined) => { if (!value) return 0; const match = value.replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/); return match ? Number(match[0]) : 0; };
const statValue = (item: EquippedItem, names: string[]) => Object.entries(item.stats).reduce((total, [key, value]) => names.some((name) => key.toLowerCase().includes(name.toLowerCase())) ? total + numberFrom(value) : total, 0);
const loadoutOf = (character: NormalizedCharacter): Loadout => Object.fromEntries(character.equipment.map((item) => [item.slot, item]));
const cloneLoadout = (loadout: Loadout): Loadout => Object.fromEntries(Object.entries(loadout).map(([slot, item]) => [slot, item ? { ...item, stats: { ...item.stats }, enchantments: item.enchantments ? [...item.enchantments] : undefined, weapon: item.weapon ? { ...item.weapon } : undefined } : undefined]));

function scoreLoadout(loadout: Loadout, profile: SpecScoringProfile): CombatSnapshot {
  const items = Object.values(loadout).filter((item): item is EquippedItem => Boolean(item));
  const strength = items.reduce((sum, item) => sum + statValue(item, ["strength"]), 0);
  const agility = items.reduce((sum, item) => sum + statValue(item, ["agility"]), 0);
  const attackPower = items.reduce((sum, item) => sum + statValue(item, ["attack power", "attack_power"]), 0);
  const crit = items.reduce((sum, item) => sum + statValue(item, ["crit", "critical strike"]), 0);
  const hit = items.reduce((sum, item) => sum + statValue(item, ["hit"]), 0);
  const setPieces = items.reduce<Record<string, number>>((sets, item) => { if (item.setId) sets[item.setId] = (sets[item.setId] ?? 0) + 1; return sets; }, {});
  const setValue = profile.setBonuses.reduce((sum, bonus) => (setPieces[bonus.setId] ?? 0) >= bonus.pieces ? sum + bonus.value : sum, 0);
  const specialEffectValue = items.reduce((sum, item) => sum + (item.specialEffectId ? profile.specialEffects[item.specialEffectId]?.effectiveStats["Attack power"] ?? 0 : 0), 0);
  const weapons = items.filter((item) => item.weapon);
  const weaponDps = weapons.reduce((sum, item) => sum + (item.weapon?.dps ?? 0) * (item.slot === "Off Hand / Shield" ? profile.weaponRule.offHandWeight : profile.weaponRule.mainHandWeight), 0);
  const weaponSpeed = weapons.reduce((sum, item) => sum + (item.weapon?.speed ?? 0), 0);
  const hitScore = Math.min(hit, profile.hitBreakpoint.target) * profile.hitBreakpoint.belowWeight + Math.max(0, hit - profile.hitBreakpoint.target) * profile.hitBreakpoint.atOrAboveWeight;
  const score = strength * (profile.statWeights.Strength ?? 0) + agility * (profile.statWeights.Agility ?? 0) + attackPower * (profile.statWeights["Attack power"] ?? 0) + crit * (profile.statWeights.Crit ?? 0) + hitScore + setValue + specialEffectValue + weaponDps * profile.weaponRule.dpsWeight + weaponSpeed * profile.weaponRule.speedWeight;
  return { strength, agility, attackPower, crit, hit, hitTarget: profile.hitBreakpoint.target, hitState: hit < profile.hitBreakpoint.target ? "below" : hit === profile.hitBreakpoint.target ? "at-target" : "above", weaponDps, weaponSpeed, setPieces, setValue, specialEffectValue, score };
}

const tierFor = (delta: number, profile: SpecScoringProfile, bestInSlot: boolean): UpgradeRecommendation["upgradeTier"] => bestInSlot && delta >= profile.tierThresholds.bestInSlot ? "BestInSlot" : delta >= profile.tierThresholds.major ? "Major" : delta >= profile.tierThresholds.meaningful ? "Meaningful" : delta >= profile.tierThresholds.minor ? "Minor" : "Sidegrade";
const tierRank: Record<string, number> = { Sidegrade: 0, Minor: 1, Meaningful: 2, Major: 3, BestInSlot: 4 };
const dualSlots: EquipmentSlot[][] = [["Finger 1", "Finger 2"], ["Trinket 1", "Trinket 2"], ["Main Hand", "Off Hand / Shield"]];
const replacementSlots = (candidate: CuratedCandidate): EquipmentSlot[] => candidate.slotOptions ?? (candidate.weapon ? ["Main Hand", "Off Hand / Shield"] : dualSlots.find((slots) => slots.includes(candidate.slot)) ?? [candidate.slot]);
const hasUniqueConflict = (loadout: Loadout, candidate: CuratedCandidate, target: EquipmentSlot) => Boolean(candidate.uniqueGroup && Object.entries(loadout).some(([slot, item]) => slot !== target && item?.uniqueGroup === candidate.uniqueGroup && item.itemId !== candidate.itemId));
const assumptionsFor = (current: CombatSnapshot, next: CombatSnapshot, profile: SpecScoringProfile) => { const breakpointChanges = current.hitState !== next.hitState ? [`Hit moved from ${current.hitState} target state to ${next.hitState}.`] : []; const setChanges = Object.keys({ ...current.setPieces, ...next.setPieces }).flatMap((setId) => current.setPieces[setId] !== next.setPieces[setId] ? [`${setId}: ${current.setPieces[setId] ?? 0} → ${next.setPieces[setId] ?? 0} pieces.`] : []); return { statDeltas: { Strength: next.strength - current.strength, Agility: next.agility - current.agility, "Attack power": next.attackPower - current.attackPower, Crit: next.crit - current.crit, Hit: next.hit - current.hit }, breakpointChanges, setChanges, assumptions: profile.assumptions } };

function evaluateCandidate(loadout: Loadout, current: CombatSnapshot, candidate: CuratedCandidate, profile: SpecScoringProfile, weaponSkillContext?: WeaponSkillContext): UpgradeRecommendation | null {
  if (candidate.weapon && (profile.weaponRule.oneHandOnly && candidate.weapon.hand !== "one-hand")) return null;
  const evaluations = replacementSlots(candidate).filter((target) => !candidate.weapon || profile.weaponRule.allowedHands.includes(target as "Main Hand" | "Off Hand / Shield")).filter((target) => !hasUniqueConflict(loadout, candidate, target)).map((target) => {
    const nextLoadout = cloneLoadout(loadout); const placed = { ...candidate, slot: target }; nextLoadout[target] = placed; const next = scoreLoadout(nextLoadout, profile); return { target, placed, next, delta: next.score - current.score };
  });
  const best = evaluations.sort((left, right) => right.delta - left.delta)[0];
  if (!best) return null;
  const tier = tierFor(best.delta, profile, Boolean(candidate.isBestInSlot));
  if (tier === "Sidegrade") return null;
  let confidence = candidate.unknownSpecialEffect ? "Limited" : candidate.confidence;
  if (candidate.weapon && !weaponSkillContext && confidence === "High") confidence = "Medium";
  const details = assumptionsFor(current, best.next, profile);
  const hitExplanation = best.next.hit < best.next.hitTarget ? `Equipping this item leaves the character below the configured ${best.next.hitTarget}% Hit target.` : `The character remains ${best.next.hit > best.next.hitTarget ? "above" : "at"} the configured Hit target after equipping it.`;
  const realisticReason = candidate.isRealistic ? (candidate.source?.type === "Raid" ? "This is a realistic raid progression option, but it is not treated as the easiest next step." : `${candidate.source?.instance ?? candidate.source?.zone ?? candidate.source?.type} does not require a 40-player raid lockout.`) : "This is theoretical best-in-slot rather than the recommended realistic path.";
  const reason = `${Object.entries(details.statDeltas).filter(([, value]) => value !== 0).map(([name, value]) => `${value > 0 ? "+" : ""}${value} ${name}`).join(", ") || "Loadout interaction"}. ${hitExplanation} ${details.setChanges.length ? details.setChanges.join(" ") : "Set bonuses unchanged."} ${candidate.weapon && !weaponSkillContext ? profile.weaponRule.weaponSkillNote : ""} ${confidence === "Limited" ? "Requires special-effect evaluation; PrePull has limited confidence for this item." : `Result: ${tier === "BestInSlot" ? "theoretical best-in-slot under this profile" : `${tier.toLowerCase()} overall improvement`} for the current Fury Warrior loadout.`}`;
  return { slot: best.target, currentItem: loadout[best.target], candidateItem: best.placed, upgradeTier: tier, reason, source: candidate.source ?? { type: "World Drop" }, difficulty: candidate.source?.difficulty ?? "Curated", availability: candidate.source?.phase ?? "Era phase 6", confidence, explanation: details, profileVersion: profile.id, bestRealistic: candidate.isRealistic, bestInSlot: candidate.isBestInSlot, realisticReason };
}

export function analyzeGear(input: GearAnalysisInput): GearAnalysisResult {
  const { character, profile } = input;
  if (character.contentVersion !== profile.contentVersion || character.class !== profile.className || character.spec !== profile.specialization || character.realmType !== "era") return { supported: false, status: "unsupported", message: "PrePull gear analysis for this specialization is coming soon.", recommendations: [], bySlot: {}, activities: [] };
  const loadout = loadoutOf(character); const currentSnapshot = scoreLoadout(loadout, profile);
  const candidates = input.candidates.filter((candidate) => candidate.availability.contentVersion === character.contentVersion && candidate.availability.realms.includes(character.realmType) && candidate.availability.phase <= profile.currentPhase && (!candidate.availability.classes || candidate.availability.classes.includes(character.class)));
  const recommendations = candidates.map((candidate) => evaluateCandidate(loadout, currentSnapshot, candidate, profile, character.weaponSkillContext)).filter((recommendation): recommendation is UpgradeRecommendation => Boolean(recommendation));
  const bySlot = recommendations.reduce<GearAnalysisResult["bySlot"]>((result, recommendation) => { const entry = result[recommendation.slot] ?? { otherOptions: [] }; if (recommendation.bestRealistic && (!entry.bestRealistic || tierRank[recommendation.upgradeTier] > tierRank[entry.bestRealistic.upgradeTier])) entry.bestRealistic = recommendation; if (recommendation.bestInSlot && (!entry.bestInSlot || tierRank[recommendation.upgradeTier] > tierRank[entry.bestInSlot.upgradeTier])) entry.bestInSlot = recommendation; if (!recommendation.bestRealistic && !recommendation.bestInSlot) entry.otherOptions.push(recommendation); result[recommendation.slot] = entry; return result; }, {});
  const activities = Object.values(recommendations.reduce<Record<string, UpgradeRecommendation[]>>((groups, recommendation) => { const destination = recommendation.source.instance ?? recommendation.source.zone ?? recommendation.source.type; (groups[destination] ??= []).push(recommendation); return groups; }, {})).map((upgrades) => { const weights = profile.activityWeights; const uniqueSlots = new Set(upgrades.map((item) => item.slot)).size; const majorCount = upgrades.filter((item) => item.upgradeTier === "Major").length; const meaningfulCount = upgrades.filter((item) => ["Meaningful", "Major"].includes(item.upgradeTier)).length; const bisCount = upgrades.filter((item) => item.upgradeTier === "BestInSlot").length; const minorCount = upgrades.filter((item) => item.upgradeTier === "Minor").length; const access = upgrades[0].source.type === "Raid" ? weights.raidAccess : upgrades[0].source.type === "Dungeon" ? weights.dungeonAccess : upgrades[0].source.type === "Quest" ? weights.questAccess : 10; const score = majorCount * weights.major + meaningfulCount * weights.meaningful + minorCount * weights.minor + bisCount * weights.bestInSlot + uniqueSlots * weights.uniqueSlotBonus + access; const explanation = [`${majorCount ? `${majorCount} Major` : "No Major"}`, `${meaningfulCount} Meaningful`, `${bisCount} Best-in-Slot`, `${uniqueSlots} affected slot${uniqueSlots === 1 ? "" : "s"}`].join(" · "); return { destination: upgrades[0].source.instance ?? upgrades[0].source.zone ?? upgrades[0].source.type, upgrades, meaningfulCount, majorCount, bisCount, score, recommendation: `${explanation}. ${upgrades[0].source.type === "Raid" ? "Raid lockout required." : "No 40-player raid lockout required."}` }; }).sort((left, right) => right.score - left.score);
  const assumptions: AnalysisAssumptions = { profileVersion: profile.id, hitTarget: profile.hitBreakpoint.target, currentPhase: profile.currentPhase, enchantTreatment: "Current enchant names are preserved; candidates are evaluated unenchanted.", worldBuffs: "Excluded.", specialEffects: "Only curated effects contribute; unknown effects are Limited confidence.", methodologyPath: `/${character.contentVersion}/gear/methodology` };
  return { supported: true, status: "supported", profileVersion: profile.id, currentSnapshot, recommendations, bySlot, activities, assumptions };
}

export function analyzeCharacter(character: NormalizedCharacter) { return analyzeGear({ character, profile: eraFuryWarriorProfile, candidates: eraFuryCandidates }); }
export { scoreLoadout };
