import type { EquipmentSlot, EquippedItem, NormalizedCharacter } from "../types.ts";
import { eraFuryCandidates } from "../gear-analysis/dataset.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { getCanonicalCuratedProfile } from "./repository.ts";
import { progressionPhaseForSet, setForPhase } from "./progression.ts";
import { availabilityFor, isAvailableInPhase, resolvedPhaseForSet, sourceForPhase, type ClassicContentPhase } from "./availability.ts";
import type { CuratedActivity, CuratedEvaluation, CuratedRecommendation, CuratedReferenceProfile, ReferenceGearSet, ReferenceItemEntry } from "./types.ts";

const tierRank: Record<ReferenceItemEntry["tier"], number> = { bis: 5, excellent: 4, strong: 3, alternative: 2, entry: 1 };
const metadata = normalizedItemMetadata();
const candidateById = new Map(eraFuryCandidates.map((candidate) => [candidate.itemId, candidate]));
type EvaluatedItem = EquippedItem & { reference: ReferenceItemEntry; isRealistic?: boolean };
const blackDragonMailIds = new Set([16984, 15050, 15051, 15052]);

const itemFor = (reference: ReferenceItemEntry, character?: NormalizedCharacter, phase: ClassicContentPhase = 6): EvaluatedItem | undefined => {
  const source = candidateById.get(reference.itemId) ?? metadata.get(reference.itemId);
  if (!source) return undefined;
  const factionSource = character && reference.factionSources?.[character.faction];
  const phaseSource = sourceForPhase(reference.itemId, phase);
  return { ...source, slot: reference.slot, source: factionSource ? { ...reference.source, instance: factionSource } : phaseSource ?? reference.source, uniqueGroup: reference.uniqueGroup ?? source.uniqueGroup, reference, isRealistic: "isRealistic" in source ? source.isRealistic : undefined };
};
const sourceName = (recommendation: Pick<CuratedRecommendation, "target">) => recommendation.target?.source?.instance ?? recommendation.target?.source?.zone ?? recommendation.target?.source?.type ?? "Unspecified source";
const pairedSlots = (slot: EquipmentSlot) => ["Finger 1", "Finger 2"].includes(slot) ? ["Finger 1", "Finger 2"] : ["Trinket 1", "Trinket 2"].includes(slot) ? ["Trinket 1", "Trinket 2"] : ["Main Hand", "Off Hand / Shield"].includes(slot) ? ["Main Hand", "Off Hand / Shield"] : [];
const conflicts = (item: EvaluatedItem, reserved: Set<string>) => Boolean(item.uniqueGroup && reserved.has(`group:${item.uniqueGroup}`)) || reserved.has(`item:${item.itemId}`);
const reserve = (item: EvaluatedItem | undefined, reserved: Set<string>) => { if (!item) return; reserved.add(`item:${item.itemId}`); if (item.uniqueGroup) reserved.add(`group:${item.uniqueGroup}`); };
const notesFor = (character: NormalizedCharacter, item: EvaluatedItem | undefined, reference: ReferenceItemEntry | undefined): string[] => {
  if (!item || !reference) return [];
  const notes = reference.notes ? [reference.notes] : [];
  if (item.uniqueGroup) notes.push("Unique or paired-slot restrictions apply.");
  if (item.weapon?.weaponSkillBonus) notes.push(`Provides +${item.weapon.weaponSkillBonus} weapon skill.`);
  if (item.weapon?.weaponType === "Axe" && character.race === "Orc") notes.push("Orc racial axe expertise is relevant; no numerical performance delta is claimed.");
  if (["Sword", "Mace"].includes(item.weapon?.weaponType ?? "") && character.race === "Human") notes.push("Human racial weapon expertise is relevant; no numerical performance delta is claimed.");
  if (reference.professionRequirements?.length) notes.push(`Requires ${reference.professionRequirements.join(", ")}.`);
  if (reference.source.type === "World Drop") notes.push("Availability is conditional on the world-drop acquisition path.");
  if (reference.setBonusGroup === "black-dragon-mail") {
    const equippedPieces = character.equipment.filter((equipped) => blackDragonMailIds.has(equipped.itemId)).length;
    const resultingPieces = equippedPieces + (blackDragonMailIds.has(item.itemId) && !character.equipment.some((equipped) => equipped.itemId === item.itemId) ? 1 : 0);
    notes.push(`Black Dragon Mail context: ${equippedPieces} piece(s) equipped; this option results in ${resultingPieces} piece(s).`);
    if (resultingPieces >= 3) notes.push("Active 3-piece bonus: +2% critical strike.");
    else if (resultingPieces >= 2) notes.push("Active 2-piece bonus: +1% hit.");
  }
  if ([20130, 21180].includes(item.itemId)) notes.push("On-use trinket; evaluate cooldown alignment and paired-trinket conflicts contextually.");
  return [...new Set(notes)];
};
const certaintyFor = (item: EvaluatedItem | undefined, reference: ReferenceItemEntry | undefined): CuratedRecommendation["certainty"] => item?.isRealistic === false || reference?.source.type === "World Drop" ? "contextual" : reference?.provenance.verificationStatus === "curated" ? "high" : "limited";
const knownProgressionPhase = (item: EquippedItem | undefined) => { const candidate = item ? candidateById.get(item.itemId) : undefined; return candidate?.source?.type === "Raid" ? candidate.availability.phase : 0; };
const characterProgressionPhase = (character: NormalizedCharacter) => Math.max(0, ...character.equipment.map(knownProgressionPhase));
const hasReferenceRows = (set: ReferenceGearSet | undefined) => Boolean(set && Object.values(set.slots).some((entries) => (entries?.length ?? 0) > 0));
const isBeyondSet = (currentItem: EquippedItem | undefined, activePhase: number) => { const candidate = currentItem ? candidateById.get(currentItem.itemId) : undefined; return Boolean(candidate && candidate.source?.type === "Raid" && candidate.availability.phase > activePhase); };
const isPlaceholder = (item: EquippedItem | undefined) => Boolean(item && ((item.itemId >= 700000 && item.itemId < 700100) || item.name.startsWith("Fresh 60 ")));

function evaluateSlot(character: NormalizedCharacter, slot: EquipmentSlot, entries: ReferenceItemEntry[], reserved: Set<string>, activePhase: number, availabilityPhase: ClassicContentPhase): CuratedRecommendation {
  const equippedItem = character.equipment.find((item) => item.slot === slot);
  const currentItem = isPlaceholder(equippedItem) ? undefined : equippedItem;
  const unavailable = entries.filter((entry) => !isAvailableInPhase(entry.itemId, availabilityPhase));
  const allOptions = entries.filter((entry) => isAvailableInPhase(entry.itemId, availabilityPhase) && (!entry.faction || entry.faction === character.faction)).map((entry) => itemFor(entry, character, availabilityPhase)).filter((item): item is EvaluatedItem => Boolean(item)).sort((left, right) => tierRank[right.reference.tier] - tierRank[left.reference.tier]);
  const currentReference = allOptions.find((item) => item.itemId === currentItem?.itemId);
  if (isBeyondSet(currentItem, activePhase)) return { slot, currentItem, currentTier: undefined, scope: "outside-reference-scope", otherOptions: [], status: "outside-reference-scope", priority: "outside-reference-scope", certainty: "limited", conditionalNotes: [], reason: "This character's equipment is beyond the current reference dataset. No downgrade recommendation generated; later-phase reference data is required for a reliable comparison." };
  const paired = new Set(pairedSlots(slot).filter((pairedSlot) => pairedSlot !== slot).flatMap((pairedSlot) => character.equipment.filter((item) => item.slot === pairedSlot)));
  const options = allOptions.filter((item) => !conflicts(item, reserved) && ![...paired].some((equipped) => equipped.itemId === item.itemId || (item.uniqueGroup && equipped.uniqueGroup === item.uniqueGroup)));
  const target = options.find((item) => item.reference.tier === "bis") ?? options[0];
  const bestRealistic = options.find((item) => item.isRealistic !== false && item.reference.tier !== "bis") ?? options.find((item) => item.isRealistic !== false) ?? target;
  const otherOptions = options.filter((item) => item.itemId !== target?.itemId && item.itemId !== bestRealistic?.itemId);
  let status: CuratedRecommendation["status"] = "unknown";
  let priority: CuratedRecommendation["priority"] = "unknown";
  let scope: CuratedRecommendation["scope"] = currentItem && !currentReference ? "unknown" : "ranked";
  if (!options.length) { status = "unknown"; priority = "unknown"; scope = currentItem ? "unknown" : "ranked"; }
  else if (currentReference?.reference.tier === "bis") { status = "target-equipped"; priority = "complete"; scope = "complete"; }
  else if (currentReference?.reference.tier === "excellent") { status = "excellent"; priority = "low-priority"; }
  else if (currentReference?.reference.tier === "strong") { status = "strong"; priority = "upgrade"; }
  else if (currentReference) { status = "serviceable"; priority = "meaningful-upgrade"; }
  else if (!currentItem && target?.reference.tier === "bis") { status = "major-progression"; priority = "major-opportunity"; }
  else if (!currentItem) { status = "upgrade-available"; priority = "meaningful-upgrade"; }
  else { status = "unknown"; priority = "unknown"; }
  const conditionalNotes = notesFor(character, bestRealistic ?? target, (bestRealistic ?? target)?.reference);
  if (!options.length && unavailable.length) conditionalNotes.push(`Options unavailable in Phase ${availabilityPhase}: ${unavailable.map((entry) => `${entry.itemId} (available from Phase ${availabilityFor(entry.itemId)?.availableFromPhase ?? "unknown"})`).join(", ")}.`);
  if (character.race === "Orc" && options.some((item) => item.weapon?.weaponType === "Axe" || [811, 871, 13015].includes(item.itemId))) conditionalNotes.push("Axe alternatives are Orc-favored through racial axe expertise; ordering remains contextual and no numerical performance delta is claimed.");
  if (character.race === "Human" && options.some((item) => ["Sword", "Mace"].includes(item.weapon?.weaponType ?? ""))) conditionalNotes.push("Sword/mace alternatives are Human-favored through racial weapon expertise; ordering remains contextual and no numerical performance delta is claimed.");
  const reason = currentItem && scope === "unknown" ? "The current item is not safely identified in this reference set. No upgrade priority is inferred." : options.length ? `Curated ${target?.reference.tier ?? "reference"} option from ${sourceName({ target })}. No numerical performance increase is claimed.` : "This slot is not ranked in the selected curated reference set.";
  const recommendation = { slot, currentItem, currentTier: currentReference?.reference.tier, scope, target, bestRealistic, otherOptions, status, priority, certainty: certaintyFor(bestRealistic ?? target, (bestRealistic ?? target)?.reference), conditionalNotes, reason };
  if (priority !== "unknown") reserve(target, reserved);
  return recommendation;
}

export function evaluateCuratedReference(character: NormalizedCharacter, profile: CuratedReferenceProfile = getCanonicalCuratedProfile(), setId = profile.defaultSetId, requestedAvailabilityPhase?: ClassicContentPhase): CuratedEvaluation {
  const baseSet: ReferenceGearSet = profile.sets.find((candidate) => candidate.id === setId) ?? profile.sets[0];
  const characterPhase = characterProgressionPhase(character);
  const requestedSet = requestedAvailabilityPhase !== undefined ? baseSet : setId === profile.defaultSetId ? setForPhase(profile, characterPhase) : baseSet;
  const activeSet = requestedSet && (characterPhase === 0 || hasReferenceRows(requestedSet)) ? requestedSet : baseSet;
  const referenceAvailability = characterPhase > progressionPhaseForSet(baseSet) && !hasReferenceRows(requestedSet) ? "not-available" : "available";
  const activePhase = progressionPhaseForSet(activeSet);
  const availabilityPhase = requestedAvailabilityPhase ?? resolvedPhaseForSet(activePhase);
  const reserved = new Set<string>();
  const rawRecommendations = Object.keys(activeSet.slots).map((slot) => evaluateSlot(character, slot as EquipmentSlot, activeSet.slots[slot as EquipmentSlot] ?? [], reserved, activePhase, availabilityPhase));
  const recommendations = referenceAvailability === "not-available" ? rawRecommendations.map((recommendation) => recommendation.priority === "outside-reference-scope" || recommendation.priority === "complete" ? recommendation : { ...recommendation, target: undefined, bestRealistic: undefined, otherOptions: [], status: "unknown" as const, priority: "unknown" as const, certainty: "limited" as const, conditionalNotes: [], reason: "Reference data not yet available for this progression level. No recommendation is generated until the relevant later-phase dataset exists." }) : rawRecommendations;
  const groups = referenceAvailability === "available" ? recommendations.filter((recommendation) => recommendation.bestRealistic && ["major-opportunity", "meaningful-upgrade", "upgrade"].includes(recommendation.priority)).reduce<Record<string, CuratedRecommendation[]>>((result, recommendation) => { const activity = sourceName(recommendation); (result[activity] ??= []).push(recommendation); return result; }, {}) : {};
  const activities: CuratedActivity[] = Object.entries(groups).map(([activity, upgrades]) => { const score = upgrades.reduce((total, recommendation) => total + (recommendation.priority === "major-opportunity" ? 4 : recommendation.priority === "meaningful-upgrade" ? 2 : 1), 0); const highestTier = upgrades.map((upgrade) => upgrade.bestRealistic?.reference.tier ?? "entry").sort((left, right) => tierRank[right] - tierRank[left])[0] ?? "entry"; return { activity, upgrades, slots: upgrades.map((upgrade) => upgrade.slot), highestTier, score, recommendation: `${upgrades.length} curated upgrade${upgrades.length === 1 ? "" : "s"} across ${upgrades.map((upgrade) => upgrade.slot).join(", ")}.` }; }).sort((left, right) => right.score - left.score);
  return { profileId: profile.id, strategy: profile.strategy, methodology: profile.methodology, set: activeSet, recommendations, activities, incompleteData: !activeSet.complete, referenceAvailability, characterProgressionPhase: characterPhase, requestedSetId: requestedSet?.id ?? baseSet.id };
}
