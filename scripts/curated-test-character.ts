import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { evaluateCuratedReference } from "../lib/curated-gear/evaluate.ts";
import { getCanonicalCuratedProfile } from "../lib/curated-gear/repository.ts";
import { normalizedItemMetadata } from "../lib/item-metadata/store.ts";
import type { CuratedRecommendation } from "../lib/curated-gear/types.ts";
import type { NormalizedCharacter } from "../lib/types.ts";
import { publishedPreRaidCompleteFixtures } from "../lib/curated-gear/character-fixtures.ts";

const fixtures = { "fresh-60": eraFuryFixtures.fresh60, "pre-raid": eraFuryFixtures.preRaid, "mc-progression": eraFuryFixtures.moltenCore, "near-bis": eraFuryFixtures.nearBis, "published-pre-raid-complete": publishedPreRaidCompleteFixtures.orc, "published-pre-raid-complete-human": publishedPreRaidCompleteFixtures.human, "published-pre-raid-complete-other": publishedPreRaidCompleteFixtures.other };
const specialNames = ["Lionheart Helm", "Savage Gladiator Chain", "Edgemaster's Handguards", "Devilsaur Gauntlets", "Devilsaur Leggings", "Hand of Justice", "Blackhand's Breadth", "Ironfoe", "Felstriker", "Dal'Rend's Sacred Charge", "Dal'Rend's Tribal Guardian", "Axe of the Deep Woods", "Flurry Axe"];
const metadata = normalizedItemMetadata();
const canonicalProfile = getCanonicalCuratedProfile();
const priorityRank: Record<CuratedRecommendation["priority"], number> = { "major-opportunity": 0, "meaningful-upgrade": 1, upgrade: 2, "low-priority": 3, complete: 4, "outside-reference-scope": 5, unknown: 6 };
const label = (recommendation: CuratedRecommendation) => recommendation.target?.source?.instance ?? recommendation.target?.source?.zone ?? recommendation.target?.source?.type ?? "Unspecified source";
const optionSource = (option: NonNullable<CuratedRecommendation["target"]>) => option.source?.instance ?? option.source?.zone ?? option.source?.type ?? "Unspecified source";
const item = (recommendation?: CuratedRecommendation["target"]) => recommendation ? `${recommendation.name} (#${recommendation.itemId})` : "none";
const names = (recommendation: CuratedRecommendation) => recommendation.otherOptions.map((option) => `${option.name} (#${option.itemId})`).join(", ") || "none";
const printCharacter = (fixtureName: string, character: NormalizedCharacter) => {
  const evaluation = evaluateCuratedReference(character, canonicalProfile, requestedSetId);
  const ranked = evaluation.recommendations.filter((entry) => entry.currentTier);
  const unknown = evaluation.recommendations.filter((entry) => entry.currentItem && !entry.currentTier);
  console.log(`\n=== ${fixtureName} ===`);
  console.log(`Fixture ID/name: ${character.id} / ${character.name}`);
  console.log(`Race/faction: ${character.race} / ${character.faction}`);
  console.log(`Equipped gear (${character.equipment.length}):`);
  for (const equipped of character.equipment) console.log(`  ${equipped.slot}: ${equipped.name} (#${equipped.itemId})`);
  console.log(`Evaluated slots: ${evaluation.recommendations.length}`);
  console.log(`Ranked current items: ${ranked.length}`);
  console.log(`Outside-reference-scope slots: ${evaluation.recommendations.filter((entry) => entry.scope === "outside-reference-scope").length}`);
  console.log(`Unknown slots: ${evaluation.recommendations.filter((entry) => entry.scope === "unknown").length}`);
  console.log(`Complete slots: ${evaluation.recommendations.filter((entry) => entry.scope === "complete").length}`);
  console.log(`Actionable slots: ${evaluation.recommendations.filter((entry) => ["major-opportunity", "meaningful-upgrade", "upgrade"].includes(entry.priority)).length}`);
  console.log(`Safe upgrade recommendations generated: ${evaluation.activities.reduce((total, activity) => total + activity.upgrades.length, 0)}`);
  console.log(`Reference availability: ${evaluation.referenceAvailability}; character progression phase: ${evaluation.characterProgressionPhase}; requested set: ${evaluation.requestedSetId}`);
  console.log("\nWEAK SLOTS BY PRIORITY");
  for (const recommendation of [...evaluation.recommendations].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority])) {
    console.log(`\n${recommendation.slot}`);
    console.log(`  Current: ${recommendation.currentItem?.name ?? "empty"}; scope: ${recommendation.scope}; curated tier: ${recommendation.currentTier ?? "unknown"}`);
    console.log(`  Priority: ${recommendation.priority}`);
    console.log(`  Ultimate target: ${item(recommendation.target)}`);
    console.log(`  Best realistic: ${item(recommendation.bestRealistic)}`);
    console.log(`  Alternatives: ${names(recommendation)}`);
    console.log(`  Source/activity: ${label(recommendation)}`);
    console.log(`  Certainty: ${recommendation.certainty}`);
    console.log(`  Conditional notes: ${recommendation.conditionalNotes.join(" ") || "none"}`);
  }
  console.log("\nREALISTIC NON-RAID IMPROVEMENTS");
  evaluation.activities.forEach((activity, index) => {
    const priorityScore = activity.upgrades.reduce((total, upgrade) => total + (upgrade.priority === "major-opportunity" ? 4 : upgrade.priority === "meaningful-upgrade" ? 2 : 1), 0);
    console.log(`${index + 1}. ${activity.activity}`);
    console.log(`   Relevant upgrades: ${activity.upgrades.length}`);
    console.log(`   Slots: ${activity.slots.join(", ")}`);
    console.log(`   Highest tier: ${activity.highestTier}`);
    console.log(`   Realistic targets: ${activity.upgrades.map((upgrade) => item(upgrade.bestRealistic)).join(", ")}`);
    console.log(`   Why this rank: score ${activity.score} (priority contribution ${priorityScore}); higher scores combine more urgent slot priorities.`);
  });
  console.log("\nRAID PROGRESSION OPPORTUNITIES");
  evaluation.raidActivities.forEach((activity, index) => {
    console.log(`${index + 1}. ${activity.activity}`);
    console.log(`   Relevant opportunities: ${activity.upgrades.length}`);
    console.log(`   Slots: ${activity.slots.join(", ")}`);
    console.log(`   Ultimate/available targets: ${activity.upgrades.flatMap((upgrade) => [upgrade.target, ...upgrade.otherOptions]).filter(Boolean).map((option) => `${option!.name} (#${option!.itemId})`).join(", ")}`);
    console.log(`   Lockout context: ${activity.lockoutType ?? "unknown"}`);
  });
  return evaluation;
};

const args = process.argv.slice(2);
const requested = args.find((arg) => arg.startsWith("--fixture="))?.split("=")[1];
const requestedPhase = args.find((arg) => arg.startsWith("--phase="))?.split("=")[1] ?? "phase-1";
const requestedSetId = requestedPhase === "pre-raid" ? "era-fury-pre-raid" : `era-fury-${requestedPhase}`;
const selected = args.includes("--all") || !requested ? Object.entries(fixtures) : Object.entries(fixtures).filter(([key]) => key === requested);
if (requested && !fixtures[requested as keyof typeof fixtures]) throw new Error(`Unknown fixture ${requested}. Use fresh-60, pre-raid, mc-progression, near-bis, published-pre-raid-complete, published-pre-raid-complete-human, published-pre-raid-complete-other, or --all.`);
const evaluations = selected.map(([name, fixture]) => [name, printCharacter(name, fixture)] as const);
console.log("\n=== SPECIAL CASE REVIEW ===");
for (const specialName of specialNames) {
  const records = evaluations.flatMap(([fixtureName, evaluation]) => evaluation.recommendations.flatMap((recommendation) => [recommendation.target, recommendation.bestRealistic, ...recommendation.otherOptions].filter((option): option is NonNullable<typeof option> => Boolean(option && option.name === specialName)).map((option) => ({ fixtureName, recommendation, option }))));
  const record = records[0];
  const metadataRecord = [...metadata.values()].find((entry) => entry.name === specialName);
  if (!record) { console.log(`${specialName}: not present in the selected recommendation output; no target status inferred.${metadataRecord ? ` Metadata exists as #${metadataRecord.itemId}.` : ""}`); continue; }
  const role = record.recommendation.target?.itemId === record.option.itemId ? "ultimate target" : record.recommendation.bestRealistic?.itemId === record.option.itemId ? "realistic target" : "alternative/conditional recommendation";
  console.log(`${specialName}: ${role} in ${record.fixtureName}; source ${optionSource(record.option)}; certainty ${record.recommendation.certainty}; ${record.recommendation.conditionalNotes.join(" ") || "no additional condition recorded"}.`);
}
console.log("\n=== RACE / WEAPON CONTEXT ===");
for (const [race, faction] of [["Orc", "Horde"], ["Human", "Alliance"]] as const) {
  const character = { ...eraFuryFixtures.fresh60, id: `fixture-fresh-60-${race.toLowerCase()}`, name: `Fresh 60 (${race})`, race, faction };
  const evaluation = evaluateCuratedReference(character);
  const weaponNotes = evaluation.recommendations.filter((entry) => ["Main Hand", "Off Hand / Shield"].includes(entry.slot) || entry.conditionalNotes.some((note) => note.includes("weapon")));
  console.log(`${race} Fury: ${weaponNotes.map((entry) => `${entry.slot}=${entry.bestRealistic?.name ?? "none"} [${entry.conditionalNotes.join(" ") || "no race-specific note"}]`).join("; ")}`);
}
console.log("\n=== PAIRED ITEM REVIEW ===");
const paired = evaluateCuratedReference(eraFuryFixtures.fresh60).recommendations.filter((entry) => ["Finger 1", "Finger 2", "Trinket 1", "Trinket 2", "Main Hand", "Off Hand / Shield"].includes(entry.slot));
for (const entry of paired) console.log(`${entry.slot}: target ${item(entry.target)}; realistic ${item(entry.bestRealistic)}; alternatives ${names(entry)}; unique/conditional notes: ${entry.conditionalNotes.join(" ") || "none"}`);
const reviewedSet = canonicalProfile.sets.find((set) => set.id === requestedSetId);
console.log(`\nCanonical set: ${reviewedSet?.name}; status ${reviewedSet?.status ?? "incomplete"}; publishable ${reviewedSet?.status === "published" ? "YES" : "NO"}.`);
